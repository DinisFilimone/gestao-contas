package mz.gestaocontas.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import mz.gestaocontas.domain.Account;
import mz.gestaocontas.domain.Movement;
import mz.gestaocontas.domain.MovementType;
import mz.gestaocontas.dto.TransferRequest;
import mz.gestaocontas.dto.TransferResponse;
import mz.gestaocontas.exception.BusinessRuleException;
import mz.gestaocontas.exception.ResourceNotFoundException;
import mz.gestaocontas.repository.AccountRepository;
import mz.gestaocontas.repository.MovementRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TransferService {

    private final AccountRepository accountRepository;
    private final MovementRepository movementRepository;

    public TransferService(AccountRepository accountRepository, MovementRepository movementRepository) {
        this.accountRepository = accountRepository;
        this.movementRepository = movementRepository;
    }

    /**
     * Tudo ou nada: se qualquer excepcao (RuntimeException) sair deste metodo,
     * o Spring faz rollback e nenhum saldo nem movimento fica gravado.
     */
    @Transactional
    public TransferResponse transfer(TransferRequest request, Authentication authentication) {
        String from = request.fromAccount();
        String to = request.toAccount();

        if (from.equals(to)) {
            throw new BusinessRuleException("A conta de origem e a de destino devem ser diferentes");
        }

        BigDecimal amount = request.amount().setScale(2, RoundingMode.HALF_UP);

        // 1) Bloqueia as duas contas (FOR UPDATE, ordenadas por id) ate ao fim da
        // transaccao.
        Map<String, Account> accounts = accountRepository.lockByAccountNumbers(List.of(from, to)).stream()
                .collect(Collectors.toMap(Account::getAccountNumber, Function.identity()));
        Account source = accounts.get(from);
        Account target = accounts.get(to);

        // 2) Autorizacao: CLIENTE so move dinheiro da sua propria conta (ADMIN pode de
        // qualquer uma).
        if (!isAdmin(authentication)
                && (source == null || !source.getOwner().getUsername().equals(authentication.getName()))) {
            throw new AccessDeniedException("Sem acesso a conta de origem");
        }
        if (source == null) {
            throw new ResourceNotFoundException("Conta de origem nao encontrada");
        }
        if (target == null) {
            throw new ResourceNotFoundException("Conta de destino nao encontrada");
        }

        // 3) Regra de negocio: saldo nunca fica negativo.
        if (source.getBalance().compareTo(amount) < 0) {
            throw new BusinessRuleException("Saldo insuficiente na conta de origem");
        }

        // 4) Actualiza saldos. Nao ha save(): as entidades estao "geridas" e o
        // Hibernate
        // grava as alteracoes (dirty checking) no commit.
        source.setBalance(source.getBalance().subtract(amount));
        target.setBalance(target.getBalance().add(amount));

        // 5) Regista os dois movimentos, ligados pela mesma referencia.
        String reference = UUID.randomUUID().toString();
        String description = (request.description() == null || request.description().isBlank())
                ? "Transferencia"
                : request.description().trim();

        Movement sent = buildMovement(source, MovementType.TRANSFERENCIA_ENVIADA, amount,
                description, to, reference);
        Movement received = buildMovement(target, MovementType.TRANSFERENCIA_RECEBIDA, amount,
                description, from, reference);
        movementRepository.save(sent);
        movementRepository.save(received);

        return new TransferResponse(reference, from, to, amount, description,
                sent.getCreatedAt(), source.getBalance());
    }

    private Movement buildMovement(Account account, MovementType type, BigDecimal amount,
            String description, String counterpart, String reference) {
        Movement m = new Movement();
        m.setAccount(account);
        m.setType(type);
        m.setAmount(amount);
        m.setBalanceAfter(account.getBalance());
        m.setDescription(description);
        m.setCounterpartAccountNumber(counterpart);
        m.setTransferReference(reference);
        return m;
    }

    private boolean isAdmin(Authentication authentication) {
        return authentication.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    }
}
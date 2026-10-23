package mz.gestaocontas.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import mz.gestaocontas.domain.Account;
import mz.gestaocontas.domain.Movement;
import mz.gestaocontas.domain.MovementType;
import mz.gestaocontas.domain.Role;
import mz.gestaocontas.domain.User;
import mz.gestaocontas.dto.AccountResponse;
import mz.gestaocontas.dto.BalanceResponse;
import mz.gestaocontas.dto.CreateAccountRequest;
import mz.gestaocontas.dto.MovementResponse;
import mz.gestaocontas.dto.PageResponse;
import mz.gestaocontas.exception.ConflictException;
import mz.gestaocontas.exception.ResourceNotFoundException;
import mz.gestaocontas.repository.AccountRepository;
import mz.gestaocontas.repository.MovementRepository;
import mz.gestaocontas.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AccountService {

    private final AccountRepository accountRepository;
    private final MovementRepository movementRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AccountService(AccountRepository accountRepository, MovementRepository movementRepository,
            UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.accountRepository = accountRepository;
        this.movementRepository = movementRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Cria utilizador CLIENTE + conta + movimento de abertura, tudo na mesma
     * transaccao.
     */
    @Transactional
    public AccountResponse create(CreateAccountRequest request) {
        if (accountRepository.existsByAccountNumber(request.accountNumber())) {
            throw new ConflictException("Ja existe uma conta com o número " + request.accountNumber());
        }
        if (userRepository.existsByUsername(request.username())) {
            throw new ConflictException("O username '" + request.username() + "' já esta em uso");
        }

        User owner = userRepository.save(
                new User(request.username(), passwordEncoder.encode(request.password()), Role.CLIENTE));

        BigDecimal initialBalance = request.initialBalance().setScale(2, RoundingMode.HALF_UP);

        Account account = new Account();
        account.setAccountNumber(request.accountNumber());
        account.setCustomerName(request.customerName().trim());
        account.setNuit(request.nuit());
        account.setAccountType(request.accountType());
        account.setBalance(initialBalance);
        account.setOwner(owner);
        account = accountRepository.save(account);

        Movement opening = new Movement();
        opening.setAccount(account);
        opening.setType(MovementType.ABERTURA);
        opening.setAmount(initialBalance);
        opening.setBalanceAfter(initialBalance);
        opening.setDescription("Abertura de conta");
        movementRepository.save(opening);

        return AccountResponse.from(account);
    }

    @Transactional(readOnly = true)
    public List<AccountResponse> listAll() {
        return accountRepository.findAll(Sort.by("id")).stream().map(AccountResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public AccountResponse getMine(Authentication authentication) {
        Account account = accountRepository.findByOwnerUsername(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("O utilizador não tem conta associada"));
        return AccountResponse.from(account);
    }

    @Transactional(readOnly = true)
    public AccountResponse get(String accountNumber, Authentication authentication) {
        return AccountResponse.from(authorize(accountNumber, authentication));
    }

    @Transactional(readOnly = true)
    public BalanceResponse balance(String accountNumber, Authentication authentication) {
        Account account = authorize(accountNumber, authentication);
        return new BalanceResponse(account.getAccountNumber(), account.getBalance(), OffsetDateTime.now());
    }

    @Transactional(readOnly = true)
    public PageResponse<MovementResponse> statement(String accountNumber, int page, int size,
            Authentication authentication) {
        Account account = authorize(accountNumber, authentication);
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100),
                Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id")));
        Page<Movement> result = movementRepository.findByAccountId(account.getId(), pageable);
        return new PageResponse<>(result.getContent().stream().map(MovementResponse::from).toList(),
                result.getNumber(), result.getSize(), result.getTotalElements(), result.getTotalPages());
    }

    /**
     * Regra de acesso: ADMIN ve qualquer conta; CLIENTE so ve a sua.
     * Para o CLIENTE, "conta de outra pessoa" e "conta inexistente" dao ambas 403,
     * para nao revelar que numeros de conta existem.
     */
    private Account authorize(String accountNumber, Authentication authentication) {
        Optional<Account> account = accountRepository.findByAccountNumber(accountNumber);
        if (isAdmin(authentication)) {
            return account.orElseThrow(() -> new ResourceNotFoundException("Conta nao encontrada"));
        }
        return account
                .filter(a -> a.getOwner().getUsername().equals(authentication.getName()))
                .orElseThrow(() -> new AccessDeniedException("Sem acesso a esta conta"));
    }

    private boolean isAdmin(Authentication authentication) {
        return authentication.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    }
}

package mz.gestaocontas.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.doThrow;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.ThreadLocalRandom;
import java.util.concurrent.TimeUnit;
import mz.gestaocontas.domain.AccountType;
import mz.gestaocontas.domain.Movement;
import mz.gestaocontas.domain.MovementType;
import mz.gestaocontas.dto.CreateAccountRequest;
import mz.gestaocontas.dto.TransferRequest;
import mz.gestaocontas.exception.BusinessRuleException;
import mz.gestaocontas.repository.AccountRepository;
import mz.gestaocontas.repository.MovementRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;

@SpringBootTest
@ActiveProfiles("test")
class TransferServiceTest {

    @Autowired
    TransferService transferService;

    @Autowired
    AccountService accountService;

    @Autowired
    AccountRepository accountRepository;

    // "spy": comporta-se como o repositorio real, mas permite forcar uma falha num
    // teste
    @MockitoSpyBean
    MovementRepository movementRepository;

    // ---------- 1) caminho feliz ----------
    @Test
    void transferenciaValidaActualizaSaldosERegistaDoisMovimentos() {
        String a = createAccount("1000.00");
        String b = createAccount("500.00");

        var response = transferService.transfer(request(a, b, "250.00"), asOwnerOf(a));

        assertThat(response.reference()).isNotBlank();
        assertThat(balance(a)).isEqualByComparingTo("750.00");
        assertThat(balance(b)).isEqualByComparingTo("750.00");
        assertThat(movementCount(a)).isEqualTo(2); // abertura + enviada
        assertThat(movementCount(b)).isEqualTo(2); // abertura + recebida
    }

    // ---------- 2) saldo insuficiente ----------
    @Test
    void saldoInsuficienteRejeitaESaldosFicamIntactos() {
        String a = createAccount("100.00");
        String b = createAccount("0.00");

        assertThatThrownBy(() -> transferService.transfer(request(a, b, "100.01"), asOwnerOf(a)))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("Saldo insuficiente");

        assertThat(balance(a)).isEqualByComparingTo("100.00");
        assertThat(balance(b)).isEqualByComparingTo("0.00");
        assertThat(movementCount(a)).isEqualTo(1);
        assertThat(movementCount(b)).isEqualTo(1);
    }

    // ---------- 3) rollback real: falha DEPOIS de alterar saldos e gravar o 1.o
    // movimento ----------
    @Test
    void falhaAMeioDaTransferenciaFazRollbackDeTudo() {
        String a = createAccount("1000.00");
        String b = createAccount("500.00");

        // o 2.o movimento (o da conta destino) vai falhar
        doThrow(new IllegalStateException("falha simulada"))
                .when(movementRepository)
                .save(argThat((Movement m) -> m.getType() == MovementType.TRANSFERENCIA_RECEBIDA));

        assertThatThrownBy(() -> transferService.transfer(request(a, b, "300.00"), asOwnerOf(a)))
                .isInstanceOf(IllegalStateException.class);

        assertThat(balance(a)).isEqualByComparingTo("1000.00");
        assertThat(balance(b)).isEqualByComparingTo("500.00");
        assertThat(movementCount(a)).isEqualTo(1); // o movimento "enviada" foi desfeito
        assertThat(movementCount(b)).isEqualTo(1);
    }

    // ---------- 4) concorrencia: nunca ha saldo negativo nem dinheiro perdido
    // ----------
    @Test
    void vinteTransferenciasSimultaneasNuncaDeixamSaldoNegativo() throws Exception {
        String a = createAccount("1000.00");
        String b = createAccount("0.00");

        List<Callable<Boolean>> tarefas = new ArrayList<>();
        for (int i = 0; i < 20; i++) {
            tarefas.add(tentativa(a, b, "100.00"));
        }
        long sucessos = runInParallel(tarefas).stream().filter(Boolean::booleanValue).count();

        assertThat(sucessos).isEqualTo(10); // 1000 / 100
        assertThat(balance(a)).isEqualByComparingTo("0.00");
        assertThat(balance(b)).isEqualByComparingTo("1000.00");
    }

    // ---------- 5) sem deadlock quando A->B e B->A acontecem ao mesmo tempo
    // ----------
    @Test
    void transferenciasCruzadasNaoCausamDeadlock() throws Exception {
        String a = createAccount("1000.00");
        String b = createAccount("1000.00");

        List<Callable<Boolean>> tarefas = new ArrayList<>();
        for (int i = 0; i < 10; i++) {
            tarefas.add(tentativa(a, b, "10.00"));
            tarefas.add(tentativa(b, a, "10.00"));
        }
        List<Boolean> resultados = runInParallel(tarefas);

        assertThat(resultados).containsOnly(true);
        assertThat(balance(a)).isEqualByComparingTo("1000.00");
        assertThat(balance(b)).isEqualByComparingTo("1000.00");
    }

    // ---------- 6) so o dono da conta de origem pode transferir ----------
    @Test
    void clienteNaoPodeTransferirDeContaAlheia() {
        String a = createAccount("1000.00");
        String b = createAccount("500.00");

        assertThatThrownBy(() -> transferService.transfer(request(a, b, "100.00"), asOwnerOf(b)))
                .isInstanceOf(AccessDeniedException.class);

        assertThat(balance(a)).isEqualByComparingTo("1000.00");
        assertThat(balance(b)).isEqualByComparingTo("500.00");
    }

    // ---------- 7) o administrador nao transfere (so cria contas e consulta) ----------
    @Test
    void administradorNaoPodeTransferir() {
        String a = createAccount("1000.00");
        String b = createAccount("500.00");
        Authentication admin = new UsernamePasswordAuthenticationToken("admin", null,
                List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));

        assertThatThrownBy(() -> transferService.transfer(request(a, b, "100.00"), admin))
                .isInstanceOf(AccessDeniedException.class);

        assertThat(balance(a)).isEqualByComparingTo("1000.00");
        assertThat(movementCount(a)).isEqualTo(1);
    }

    // ======================= auxiliares =======================

    private String createAccount(String initialBalance) {
        String number = String.valueOf(ThreadLocalRandom.current().nextLong(100_000_000_000L, 999_999_999_999L));
        accountService.create(new CreateAccountRequest("Cliente " + number, "123456789", number,
                AccountType.ORDEM, new BigDecimal(initialBalance), "u" + number, "Senha@123"));
        return number;
    }

    private Authentication asOwnerOf(String accountNumber) {
        return new UsernamePasswordAuthenticationToken("u" + accountNumber, null,
                List.of(new SimpleGrantedAuthority("ROLE_CLIENTE")));
    }

    private TransferRequest request(String from, String to, String amount) {
        return new TransferRequest(from, to, new BigDecimal(amount), "teste");
    }

    private BigDecimal balance(String accountNumber) {
        return accountRepository.findByAccountNumber(accountNumber).orElseThrow().getBalance();
    }

    private long movementCount(String accountNumber) {
        Long id = accountRepository.findByAccountNumber(accountNumber).orElseThrow().getId();
        return movementRepository.findByAccountId(id, PageRequest.of(0, 100)).getTotalElements();
    }

    /**
     * true = transferencia feita; false = recusada por saldo insuficiente. Qualquer
     * outro erro rebenta o teste.
     */
    private Callable<Boolean> tentativa(String from, String to, String amount) {
        return () -> {
            try {
                transferService.transfer(request(from, to, amount), asOwnerOf(from));
                return true;
            } catch (BusinessRuleException e) {
                return false;
            }
        };
    }

    /** Arranca todas as tarefas exactamente ao mesmo tempo. */
    private List<Boolean> runInParallel(List<Callable<Boolean>> tarefas) throws Exception {
        ExecutorService pool = Executors.newFixedThreadPool(tarefas.size());
        CountDownLatch partida = new CountDownLatch(1);
        List<Future<Boolean>> futuros = new ArrayList<>();
        for (Callable<Boolean> tarefa : tarefas) {
            futuros.add(pool.submit(() -> {
                partida.await();
                return tarefa.call();
            }));
        }
        partida.countDown();
        List<Boolean> resultados = new ArrayList<>();
        for (Future<Boolean> futuro : futuros) {
            resultados.add(futuro.get(60, TimeUnit.SECONDS));
        }
        pool.shutdown();
        return resultados;
    }
}
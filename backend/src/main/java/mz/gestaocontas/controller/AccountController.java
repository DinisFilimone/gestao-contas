package mz.gestaocontas.controller;

import jakarta.validation.Valid;
import java.util.List;
import mz.gestaocontas.dto.AccountResponse;
import mz.gestaocontas.dto.BalanceResponse;
import mz.gestaocontas.dto.CreateAccountRequest;
import mz.gestaocontas.dto.MovementResponse;
import mz.gestaocontas.dto.PageResponse;
import mz.gestaocontas.service.AccountService;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/accounts")
public class AccountController {

    private final AccountService accountService;

    public AccountController(AccountService accountService) {
        this.accountService = accountService;
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public AccountResponse create(@Valid @RequestBody CreateAccountRequest request) {
        return accountService.create(request);
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<AccountResponse> listAll() {
        return accountService.listAll();
    }

    /** A conta do cliente autenticado. */
    @GetMapping("/me")
    public AccountResponse myAccount(Authentication authentication) {
        return accountService.getMine(authentication);
    }

    @GetMapping("/{accountNumber}")
    public AccountResponse get(@PathVariable String accountNumber, Authentication authentication) {
        return accountService.get(accountNumber, authentication);
    }

    @GetMapping("/{accountNumber}/balance")
    public BalanceResponse balance(@PathVariable String accountNumber, Authentication authentication) {
        return accountService.balance(accountNumber, authentication);
    }

    @GetMapping("/{accountNumber}/statement")
    public PageResponse<MovementResponse> statement(@PathVariable String accountNumber,
                                                    @RequestParam(defaultValue = "0") int page,
                                                    @RequestParam(defaultValue = "20") int size,
                                                    Authentication authentication) {
        return accountService.statement(accountNumber, page, size, authentication);
    }
}

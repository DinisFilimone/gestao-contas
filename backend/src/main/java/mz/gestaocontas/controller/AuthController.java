package mz.gestaocontas.controller;

import jakarta.validation.Valid;
import java.util.Map;
import mz.gestaocontas.dto.LoginRequest;
import mz.gestaocontas.dto.LoginResponse;
import mz.gestaocontas.service.AuthService;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    /** Devolve quem esta autenticado (util para testar o token). */
    @GetMapping("/me")
    public Map<String, Object> me(Authentication authentication) {
        return Map.of(
                "username", authentication.getName(),
                "roles", authentication.getAuthorities().stream().map(GrantedAuthority::getAuthority).toList());
    }
}

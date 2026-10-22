package mz.gestaocontas.service;

import mz.gestaocontas.dto.LoginRequest;
import mz.gestaocontas.dto.LoginResponse;
import mz.gestaocontas.security.JwtService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    public AuthService(AuthenticationManager authenticationManager, JwtService jwtService) {
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
    }

    /** Valida as credenciais (BadCredentialsException se erradas) e devolve o token. */
    public LoginResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.username(), request.password()));
        String role = authentication.getAuthorities().iterator().next().getAuthority().replace("ROLE_", "");
        String token = jwtService.generate(authentication.getName(), role);
        return new LoginResponse(token, "Bearer", jwtService.getExpirationSeconds(), authentication.getName(), role);
    }
}

package mz.gestaocontas.dto;

public record LoginResponse(String token, String tokenType, long expiresInSeconds, String username, String role) {
}

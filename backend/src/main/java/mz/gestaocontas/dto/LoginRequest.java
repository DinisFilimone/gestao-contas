package mz.gestaocontas.dto;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        @NotBlank(message = "o username e obrigatorio") String username,
        @NotBlank(message = "a password e obrigatoria") String password) {
}

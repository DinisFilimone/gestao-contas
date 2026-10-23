package mz.gestaocontas.dto;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
                @NotBlank(message = "O username e obrigatório") String username,
                @NotBlank(message = "A password e obrigatória") String password) {
}

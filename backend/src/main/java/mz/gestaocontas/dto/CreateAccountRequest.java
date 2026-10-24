package mz.gestaocontas.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import mz.gestaocontas.domain.AccountType;

/**
 * Dados para criar uma conta (so ADMIN). Cria tambem o utilizador CLIENTE dono
 * da conta.
 */
public record CreateAccountRequest(
        @NotBlank(message = "o nome do cliente é obrigatório") @Size(max = 120, message = "o nome do cliente tem no máximo 120 caracteres") String customerName,

        @NotBlank(message = "o NUIT é obrigatório") @Pattern(regexp = "\\d{9}", message = "o NUIT deve ter 9 dígitos") String nuit,

        @NotBlank(message = "o número da conta é obrigatório") @Pattern(regexp = "\\d{6,20}", message = "o número da conta deve ter entre 6 e 20 dígitos") String accountNumber,

        @NotNull(message = "o tipo de conta é obrigatório (ORDEM ou POUPANCA)") AccountType accountType,

        @NotNull(message = "o saldo inicial é obrigatório") @DecimalMin(value = "0.00", message = "o saldo inicial não pode ser negativo") @Digits(integer = 17, fraction = 2, message = "o saldo inicial admite no máximo 2 casas decimais") BigDecimal initialBalance,

        @NotBlank(message = "o username do cliente é obrigatório") @Size(min = 3, max = 50, message = "o username deve ter entre 3 e 50 caracteres") String username,

        @NotBlank(message = "a password do cliente é obrigatória") @Size(min = 6, max = 72, message = "a password deve ter entre 6 e 72 caracteres") String password) {
}

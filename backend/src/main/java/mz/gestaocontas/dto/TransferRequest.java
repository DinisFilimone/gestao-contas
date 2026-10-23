package mz.gestaocontas.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record TransferRequest(
                @NotBlank(message = "a conta de origem é obrigatória") @Pattern(regexp = "\\d{6,20}", message = "a conta de origem deve ter entre 6 e 20 digitos") String fromAccount,

                @NotBlank(message = "a conta de destino é obrigatória") @Pattern(regexp = "\\d{6,20}", message = "a conta de destino deve ter entre 6 e 20 digitos") String toAccount,

                @NotNull(message = "o valor é obrigatório") @DecimalMin(value = "0.01", message = "o valor deve ser positivo (minimo 0.01)") @Digits(integer = 17, fraction = 2, message = "o valor admite no máximo 2 casas decimais") BigDecimal amount,

                @Size(max = 255, message = "a descrição tem no máximo 255 caracteres") String description) {
}
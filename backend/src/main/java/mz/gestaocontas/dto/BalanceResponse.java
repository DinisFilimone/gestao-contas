package mz.gestaocontas.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record BalanceResponse(String accountNumber, BigDecimal balance, OffsetDateTime consultedAt) {
}

package mz.gestaocontas.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record TransferResponse(String reference, String fromAccount, String toAccount,
        BigDecimal amount, String description,
        OffsetDateTime dateTime, BigDecimal sourceBalanceAfter) {
}
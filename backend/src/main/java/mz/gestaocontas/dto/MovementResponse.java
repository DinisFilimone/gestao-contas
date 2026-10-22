package mz.gestaocontas.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import mz.gestaocontas.domain.Movement;
import mz.gestaocontas.domain.MovementType;

/** Uma linha do extracto. */
public record MovementResponse(OffsetDateTime dateTime, MovementType type, BigDecimal amount,
                               BigDecimal balanceAfter, String description, String counterpartAccountNumber) {

    public static MovementResponse from(Movement m) {
        return new MovementResponse(m.getCreatedAt(), m.getType(), m.getAmount(), m.getBalanceAfter(),
                m.getDescription(), m.getCounterpartAccountNumber());
    }
}

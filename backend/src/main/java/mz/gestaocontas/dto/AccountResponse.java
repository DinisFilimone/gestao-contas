package mz.gestaocontas.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import mz.gestaocontas.domain.Account;
import mz.gestaocontas.domain.AccountType;

public record AccountResponse(Long id, String accountNumber, String customerName, String nuit,
                              AccountType accountType, BigDecimal balance, OffsetDateTime createdAt) {

    public static AccountResponse from(Account a) {
        return new AccountResponse(a.getId(), a.getAccountNumber(), a.getCustomerName(), a.getNuit(),
                a.getAccountType(), a.getBalance(), a.getCreatedAt());
    }
}

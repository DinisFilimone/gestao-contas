package mz.gestaocontas.repository;

import jakarta.persistence.LockModeType;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import mz.gestaocontas.domain.Account;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AccountRepository extends JpaRepository<Account, Long> {

    Optional<Account> findByAccountNumber(String accountNumber);

    boolean existsByAccountNumber(String accountNumber);

    Optional<Account> findByOwnerId(Long ownerId);

    Optional<Account> findByOwnerUsername(String username);

    /**
     * Bloqueia as contas (SELECT ... FOR UPDATE) sempre pela mesma ordem (id),
     * para evitar deadlocks quando duas transferencias cruzam as mesmas contas.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select a from Account a where a.accountNumber in :numbers order by a.id")
    List<Account> lockByAccountNumbers(@Param("numbers") Collection<String> numbers);
}

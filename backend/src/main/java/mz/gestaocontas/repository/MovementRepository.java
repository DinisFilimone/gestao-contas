package mz.gestaocontas.repository;

import mz.gestaocontas.domain.Movement;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MovementRepository extends JpaRepository<Movement, Long> {

    Page<Movement> findByAccountId(Long accountId, Pageable pageable);
}

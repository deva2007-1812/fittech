package com.fitmind.repository;

import com.fitmind.entity.SleepLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SleepLogRepository extends JpaRepository<SleepLog, UUID> {

    Optional<SleepLog> findFirstByUserIdAndSleepDateOrderByCreatedAtDesc(UUID userId, LocalDate sleepDate);

    @Query("SELECT s FROM SleepLog s WHERE s.user.id = :userId AND s.sleepDate BETWEEN :from AND :to ORDER BY s.sleepDate DESC")
    List<SleepLog> findByUserIdAndDateRange(@Param("userId") UUID userId,
                                             @Param("from") LocalDate from,
                                             @Param("to") LocalDate to);

    Optional<SleepLog> findByIdAndUserId(UUID id, UUID userId);
}

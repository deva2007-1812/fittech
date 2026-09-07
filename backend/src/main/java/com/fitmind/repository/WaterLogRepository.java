package com.fitmind.repository;

import com.fitmind.entity.WaterLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WaterLogRepository extends JpaRepository<WaterLog, UUID> {

    @Query("SELECT w FROM WaterLog w WHERE w.user.id = :userId AND DATE(w.loggedAt) = :date ORDER BY w.loggedAt")
    List<WaterLog> findByUserIdAndDate(@Param("userId") UUID userId, @Param("date") LocalDate date);

    @Query("SELECT w FROM WaterLog w WHERE w.user.id = :userId AND DATE(w.loggedAt) BETWEEN :from AND :to ORDER BY w.loggedAt DESC")
    List<WaterLog> findByUserIdAndDateRange(@Param("userId") UUID userId,
                                             @Param("from") LocalDate from,
                                             @Param("to") LocalDate to);

    Optional<WaterLog> findByIdAndUserId(UUID id, UUID userId);

    @Query("SELECT SUM(w.amount) FROM WaterLog w WHERE w.user.id = :userId AND DATE(w.loggedAt) = :date")
    Integer sumAmountByUserIdAndDate(@Param("userId") UUID userId, @Param("date") LocalDate date);

    @Query("SELECT w FROM WaterLog w WHERE w.user.id = :userId ORDER BY w.loggedAt DESC LIMIT 20")
    List<WaterLog> findTop20ByUserId(@Param("userId") UUID userId);
}

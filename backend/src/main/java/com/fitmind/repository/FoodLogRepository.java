package com.fitmind.repository;

import com.fitmind.entity.FoodLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FoodLogRepository extends JpaRepository<FoodLog, UUID> {

    @Query("SELECT fl FROM FoodLog fl WHERE fl.user.id = :userId AND DATE(fl.loggedAt) = :date ORDER BY fl.loggedAt")
    List<FoodLog> findByUserIdAndDate(@Param("userId") UUID userId, @Param("date") LocalDate date);

    @Query("SELECT fl FROM FoodLog fl WHERE fl.user.id = :userId AND DATE(fl.loggedAt) BETWEEN :from AND :to ORDER BY fl.loggedAt")
    List<FoodLog> findByUserIdAndDateRange(@Param("userId") UUID userId,
                                           @Param("from") LocalDate from,
                                           @Param("to") LocalDate to);

    Optional<FoodLog> findByIdAndUserId(UUID id, UUID userId);

    @Query("SELECT SUM(fl.calories) FROM FoodLog fl WHERE fl.user.id = :userId AND DATE(fl.loggedAt) = :date")
    Double sumCaloriesByUserIdAndDate(@Param("userId") UUID userId, @Param("date") LocalDate date);
}

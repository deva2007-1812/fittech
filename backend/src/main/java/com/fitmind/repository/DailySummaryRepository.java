package com.fitmind.repository;

import com.fitmind.entity.DailySummary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DailySummaryRepository extends JpaRepository<DailySummary, UUID> {

    Optional<DailySummary> findByUserIdAndDate(UUID userId, LocalDate date);

    @Query("SELECT d FROM DailySummary d WHERE d.user.id = :userId AND d.date BETWEEN :from AND :to ORDER BY d.date ASC")
    List<DailySummary> findByUserIdAndDateRange(@Param("userId") UUID userId,
                                                 @Param("from") LocalDate from,
                                                 @Param("to") LocalDate to);
}

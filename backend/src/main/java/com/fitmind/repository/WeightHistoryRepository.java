package com.fitmind.repository;

import com.fitmind.entity.WeightHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WeightHistoryRepository extends JpaRepository<WeightHistory, UUID> {

    @Query("SELECT w FROM WeightHistory w WHERE w.user.id = :userId AND w.recordedDate BETWEEN :from AND :to ORDER BY w.recordedDate ASC")
    List<WeightHistory> findByUserIdAndDateRange(@Param("userId") UUID userId,
                                                  @Param("from") LocalDate from,
                                                  @Param("to") LocalDate to);

    @Query("SELECT w FROM WeightHistory w WHERE w.user.id = :userId ORDER BY w.recordedDate DESC")
    List<WeightHistory> findByUserIdOrderByDateDesc(@Param("userId") UUID userId);

    Optional<WeightHistory> findFirstByUserIdOrderByRecordedDateDesc(UUID userId);

    Optional<WeightHistory> findByUserIdAndRecordedDate(UUID userId, LocalDate recordedDate);

    Optional<WeightHistory> findByIdAndUserId(UUID id, UUID userId);
}

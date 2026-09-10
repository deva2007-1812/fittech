package com.fitmind.repository;

import com.fitmind.entity.WorkoutLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WorkoutLogRepository extends JpaRepository<WorkoutLog, UUID> {

    List<WorkoutLog> findByUserIdAndWorkoutDateOrderByCreatedAtDesc(UUID userId, LocalDate workoutDate);

    @Query("SELECT w FROM WorkoutLog w WHERE w.user.id = :userId AND w.workoutDate BETWEEN :from AND :to ORDER BY w.workoutDate DESC")
    List<WorkoutLog> findByUserIdAndDateRange(@Param("userId") UUID userId,
                                               @Param("from") LocalDate from,
                                               @Param("to") LocalDate to);

    Optional<WorkoutLog> findByIdAndUserId(UUID id, UUID userId);

    @Query("SELECT SUM(w.duration) FROM WorkoutLog w WHERE w.user.id = :userId AND w.workoutDate = :date")
    Integer sumDurationByUserIdAndDate(@Param("userId") UUID userId, @Param("date") LocalDate date);

    @Query("SELECT w FROM WorkoutLog w WHERE w.user.id = :userId ORDER BY w.createdAt DESC LIMIT 20")
    List<WorkoutLog> findTop20ByUserId(@Param("userId") UUID userId);

    long countByUserId(UUID userId);
}

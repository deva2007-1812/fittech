package com.fitmind.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "workout_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkoutLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 200)
    private String exercise;

    @Column(nullable = false)
    @Builder.Default
    private Integer duration = 0; // minutes

    private Integer sets;

    private Integer repetitions;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "calories_burned", precision = 8, scale = 2)
    private BigDecimal caloriesBurned;

    @Column(name = "workout_date")
    @Builder.Default
    private LocalDate workoutDate = LocalDate.now();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;
}

package com.fitmind.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "daily_summaries")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DailySummary {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private LocalDate date;

    @Column(name = "calories_consumed", precision = 8, scale = 2)
    @Builder.Default
    private BigDecimal caloriesConsumed = BigDecimal.ZERO;

    @Column(precision = 8, scale = 2)
    @Builder.Default
    private BigDecimal protein = BigDecimal.ZERO;

    @Column(precision = 8, scale = 2)
    @Builder.Default
    private BigDecimal carbohydrates = BigDecimal.ZERO;

    @Column(precision = 8, scale = 2)
    @Builder.Default
    private BigDecimal fat = BigDecimal.ZERO;

    @Builder.Default
    private Integer water = 0; // ml

    @Column(name = "workout_duration")
    @Builder.Default
    private Integer workoutDuration = 0; // minutes

    @Column(name = "sleep_duration", precision = 4, scale = 2)
    @Builder.Default
    private BigDecimal sleepDuration = BigDecimal.ZERO; // hours
}

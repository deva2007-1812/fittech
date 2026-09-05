package com.fitmind.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "user_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    private Integer age;

    @Column(precision = 5, scale = 2)
    private BigDecimal height; // cm

    @Column(precision = 5, scale = 2)
    private BigDecimal weight; // kg

    @Enumerated(EnumType.STRING)
    @Column(name = "activity_level", length = 30)
    private ActivityLevel activityLevel;

    @Enumerated(EnumType.STRING)
    @Column(name = "fitness_goal", length = 30)
    private FitnessGoal fitnessGoal;

    @Column(name = "daily_calorie_target")
    private Integer dailyCalorieTarget;

    @Column(name = "daily_protein_target", precision = 6, scale = 2)
    private BigDecimal dailyProteinTarget;

    @Column(name = "daily_carbohydrate_target", precision = 6, scale = 2)
    private BigDecimal dailyCarbohydrateTarget;

    @Column(name = "daily_fat_target", precision = 6, scale = 2)
    private BigDecimal dailyFatTarget;

    @Column(name = "daily_water_target")
    @Builder.Default
    private Integer dailyWaterTarget = 2500;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;
}

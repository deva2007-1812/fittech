package com.fitmind.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "food_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FoodLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "food_id")
    private Food food;

    @Column(name = "food_name", nullable = false, length = 200)
    private String foodName;

    @Column(precision = 8, scale = 2)
    @Builder.Default
    private BigDecimal quantity = BigDecimal.ONE;

    @Column(length = 30)
    @Builder.Default
    private String unit = "serving";

    @Enumerated(EnumType.STRING)
    @Column(name = "meal_type", length = 20)
    @Builder.Default
    private MealType mealType = MealType.SNACK;

    @Column(precision = 8, scale = 2)
    @Builder.Default
    private BigDecimal calories = BigDecimal.ZERO;

    @Column(precision = 8, scale = 2)
    @Builder.Default
    private BigDecimal protein = BigDecimal.ZERO;

    @Column(precision = 8, scale = 2)
    @Builder.Default
    private BigDecimal carbohydrates = BigDecimal.ZERO;

    @Column(precision = 8, scale = 2)
    @Builder.Default
    private BigDecimal fat = BigDecimal.ZERO;

    @Column(name = "logged_at")
    @Builder.Default
    private OffsetDateTime loggedAt = OffsetDateTime.now();
}

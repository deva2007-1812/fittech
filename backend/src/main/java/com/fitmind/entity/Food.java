package com.fitmind.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "foods")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Food {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(name = "serving_size", precision = 8, scale = 2)
    @Builder.Default
    private BigDecimal servingSize = BigDecimal.valueOf(100);

    @Column(name = "serving_unit", length = 30)
    @Builder.Default
    private String servingUnit = "g";

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

    @Column(precision = 8, scale = 2)
    @Builder.Default
    private BigDecimal fiber = BigDecimal.ZERO;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;
}

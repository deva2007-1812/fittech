package com.fitmind.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "weight_history")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WeightHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal weight; // kg

    @Column(name = "recorded_date")
    @Builder.Default
    private LocalDate recordedDate = LocalDate.now();
}

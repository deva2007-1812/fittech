package com.fitmind.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "sleep_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SleepLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, precision = 4, scale = 2)
    @Builder.Default
    private BigDecimal duration = BigDecimal.ZERO; // hours

    @Column(name = "bedtime", length = 10)
    private String bedtime; // HH:MM

    @Column(name = "wake_time", length = 10)
    private String wakeTime; // HH:MM

    @Column(name = "sleep_date")
    @Builder.Default
    private LocalDate sleepDate = LocalDate.now();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;
}

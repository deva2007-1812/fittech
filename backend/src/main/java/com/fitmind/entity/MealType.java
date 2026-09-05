package com.fitmind.entity;

import com.fasterxml.jackson.annotation.JsonCreator;

public enum MealType {
    BREAKFAST,
    LUNCH,
    DINNER,
    SNACK;

    @JsonCreator
    public static MealType fromString(String value) {
        if (value == null) return SNACK;
        String v = value.trim().toUpperCase();
        if ("SNACKS".equals(v)) return SNACK;
        try {
            return MealType.valueOf(v);
        } catch (IllegalArgumentException e) {
            return SNACK;
        }
    }
}

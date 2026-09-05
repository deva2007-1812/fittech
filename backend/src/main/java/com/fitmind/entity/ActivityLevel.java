package com.fitmind.entity;

import com.fasterxml.jackson.annotation.JsonCreator;

public enum ActivityLevel {
    SEDENTARY,
    LIGHTLY_ACTIVE,
    MODERATELY_ACTIVE,
    VERY_ACTIVE,
    EXTRA_ACTIVE;

    @JsonCreator
    public static ActivityLevel fromString(String value) {
        if (value == null) return MODERATELY_ACTIVE;
        String v = value.trim().toUpperCase().replace("-", "_");
        try {
            return ActivityLevel.valueOf(v);
        } catch (IllegalArgumentException e) {
            return MODERATELY_ACTIVE;
        }
    }
}

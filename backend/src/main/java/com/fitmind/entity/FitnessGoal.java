package com.fitmind.entity;

import com.fasterxml.jackson.annotation.JsonCreator;

public enum FitnessGoal {
    MAINTAIN_WEIGHT,
    IMPROVE_FITNESS,
    WEIGHT_MANAGEMENT;

    @JsonCreator
    public static FitnessGoal fromString(String value) {
        if (value == null) return IMPROVE_FITNESS;
        String v = value.trim().toUpperCase().replace("-", "_");
        try {
            return FitnessGoal.valueOf(v);
        } catch (IllegalArgumentException e) {
            return IMPROVE_FITNESS;
        }
    }
}

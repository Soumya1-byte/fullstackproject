package com.fsad.feedback.modules.users.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum Role {
    SUPER_ADMIN,
    TEACHER,
    ADMIN,
    STUDENT;

    public boolean isAdminLike() {
        return this == SUPER_ADMIN || this == TEACHER || this == ADMIN;
    }

    @JsonValue
    public String toJson() {
        return name().toLowerCase();
    }

    @JsonCreator
    public static Role fromValue(String value) {
        return Role.valueOf(value.trim().toUpperCase());
    }
}

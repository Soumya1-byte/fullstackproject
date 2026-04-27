package com.fsad.feedback.modules.users.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum AdminRequestStatus {
    NONE,
    PENDING,
    APPROVED,
    DENIED;

    @JsonValue
    public String toJson() {
        return name().toLowerCase();
    }

    @JsonCreator
    public static AdminRequestStatus fromValue(String value) {
        return AdminRequestStatus.valueOf(value.trim().toUpperCase());
    }
}

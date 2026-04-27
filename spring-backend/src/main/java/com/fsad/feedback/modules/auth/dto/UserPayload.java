package com.fsad.feedback.modules.auth.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fsad.feedback.modules.users.model.AdminRequestStatus;
import com.fsad.feedback.modules.users.model.Role;

import java.time.Instant;

public record UserPayload(
        @JsonProperty("_id") String id,
        String name,
        String email,
        Role role,
        AdminRequestStatus adminRequestStatus,
        Instant adminRequestRequestedAt,
        Instant adminRequestReviewedAt
) {
}

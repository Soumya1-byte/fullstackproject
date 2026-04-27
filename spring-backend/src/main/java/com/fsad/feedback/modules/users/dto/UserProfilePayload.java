package com.fsad.feedback.modules.users.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fsad.feedback.modules.users.model.AdminRequestStatus;
import com.fsad.feedback.modules.users.model.Role;

import java.time.Instant;

public record UserProfilePayload(
        @JsonProperty("_id") String id,
        String name,
        String email,
        Role role,
        AdminRequestStatus adminRequestStatus,
        String adminRequestMessage,
        Instant adminRequestRequestedAt,
        Instant adminRequestReviewedAt,
        String adminRequestDecisionNote,
        String departmentId,
        Boolean isActive,
        Instant lastLoginAt,
        Instant createdAt,
        Instant updatedAt
) {
}

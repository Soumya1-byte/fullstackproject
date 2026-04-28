package com.fsad.feedback.modules.users.dto;

import com.fsad.feedback.modules.users.model.AdminRequestStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ReviewAdminAccessRequest(
        @NotNull(message = "Decision is required")
        AdminRequestStatus decision,
        @Size(max = 500, message = "Note must be at most 500 characters")
        String note
) {
}

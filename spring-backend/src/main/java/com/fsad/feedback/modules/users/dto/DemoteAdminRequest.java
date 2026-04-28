package com.fsad.feedback.modules.users.dto;

import jakarta.validation.constraints.Size;

public record DemoteAdminRequest(
        @Size(max = 500, message = "Note must be at most 500 characters")
        String note
) {
}

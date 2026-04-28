package com.fsad.feedback.modules.users.dto;

import jakarta.validation.constraints.Size;

public record RequestAdminAccessRequest(
        @Size(max = 500, message = "Message must be at most 500 characters")
        String message
) {
}

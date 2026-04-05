package com.fsad.feedback.modules.users.dto;

import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
        @Size(min = 2, max = 120, message = "Name must be between 2 and 120 characters")
        String name,
        @Size(max = 120, message = "Department ID must be at most 120 characters")
        String departmentId
) {
}

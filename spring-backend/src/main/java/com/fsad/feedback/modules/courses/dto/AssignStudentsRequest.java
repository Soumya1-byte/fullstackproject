package com.fsad.feedback.modules.courses.dto;

import jakarta.validation.constraints.NotNull;

import java.util.List;

public record AssignStudentsRequest(
        @NotNull(message = "studentIds is required")
        List<String> studentIds
) {
}

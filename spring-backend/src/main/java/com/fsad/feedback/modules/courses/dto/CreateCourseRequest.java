package com.fsad.feedback.modules.courses.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateCourseRequest(
        @NotBlank(message = "Course code is required")
        @Size(max = 40, message = "Course code must be at most 40 characters")
        String code,
        @NotBlank(message = "Course title is required")
        @Size(max = 160, message = "Course title must be at most 160 characters")
        String title,
        @NotBlank(message = "Semester is required")
        @Size(max = 80, message = "Semester must be at most 80 characters")
        String semester,
        @NotBlank(message = "Department is required")
        @Size(max = 120, message = "Department must be at most 120 characters")
        String department
) {
}

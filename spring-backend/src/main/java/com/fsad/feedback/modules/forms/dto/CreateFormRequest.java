package com.fsad.feedback.modules.forms.dto;

import com.fsad.feedback.modules.forms.model.FormStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CreateFormRequest(
        @NotBlank(message = "Form title is required")
        @Size(max = 160, message = "Form title must be at most 160 characters")
        String title,
        @Size(max = 1000, message = "Description must be at most 1000 characters")
        String description,
        @NotBlank(message = "Course ID is required")
        String courseId,
        @NotEmpty(message = "At least one question is required")
        List<@Valid FormQuestionRequest> questions,
        @NotNull(message = "Form status is required")
        FormStatus status
) {
}

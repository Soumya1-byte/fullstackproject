package com.fsad.feedback.modules.forms.dto;

import com.fsad.feedback.modules.forms.model.QuestionType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record FormQuestionRequest(
        @NotBlank(message = "Question ID is required")
        String questionId,
        @NotBlank(message = "Question label is required")
        String label,
        @NotNull(message = "Question type is required")
        QuestionType type,
        Boolean required,
        List<String> options,
        Integer scale
) {
}

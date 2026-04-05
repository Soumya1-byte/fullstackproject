package com.fsad.feedback.modules.responses.dto;

import jakarta.validation.constraints.NotBlank;

public record AnswerRequest(
        @NotBlank(message = "questionId is required")
        String questionId,
        Object value
) {
}

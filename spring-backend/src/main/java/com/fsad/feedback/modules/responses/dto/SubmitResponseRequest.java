package com.fsad.feedback.modules.responses.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record SubmitResponseRequest(
        @NotEmpty(message = "At least one answer is required")
        List<@Valid AnswerRequest> answers
) {
}

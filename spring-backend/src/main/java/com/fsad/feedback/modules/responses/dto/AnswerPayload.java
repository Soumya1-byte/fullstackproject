package com.fsad.feedback.modules.responses.dto;

public record AnswerPayload(
        String questionId,
        Object value
) {
}

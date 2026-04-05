package com.fsad.feedback.modules.responses.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.Instant;
import java.util.List;

public record ResponsePayload(
        @JsonProperty("_id") String id,
        String formId,
        String courseId,
        List<AnswerPayload> answers,
        Instant submittedAt
) {
}

package com.fsad.feedback.modules.forms.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fsad.feedback.modules.forms.model.FormStatus;

import java.time.Instant;
import java.util.List;

public record FormPayload(
        @JsonProperty("_id") String id,
        String title,
        String description,
        String courseId,
        String createdBy,
        FormStatus status,
        Boolean isAnonymous,
        List<FormQuestionPayload> questions,
        Instant publishAt,
        Instant closeAt,
        Instant createdAt,
        Instant updatedAt
) {
}

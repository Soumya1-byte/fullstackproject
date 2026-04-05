package com.fsad.feedback.modules.courses.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.Instant;
import java.util.List;

public record CoursePayload(
        @JsonProperty("_id") String id,
        String code,
        String title,
        String semester,
        String department,
        String adminId,
        List<String> assignedStudentIds,
        Instant createdAt,
        Instant updatedAt
) {
}

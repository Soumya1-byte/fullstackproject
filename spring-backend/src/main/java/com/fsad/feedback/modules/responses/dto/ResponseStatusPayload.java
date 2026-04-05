package com.fsad.feedback.modules.responses.dto;

import java.time.Instant;

public record ResponseStatusPayload(
        String formId,
        Instant submittedAt
) {
}

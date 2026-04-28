package com.fsad.feedback.modules.notifications.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fsad.feedback.modules.notifications.model.NotificationType;

import java.time.Instant;

public record NotificationPayload(
        @JsonProperty("_id") String id,
        NotificationType type,
        String title,
        String message,
        String actionUrl,
        boolean read,
        Instant readAt,
        Instant createdAt
) {
}

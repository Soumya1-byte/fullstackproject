package com.fsad.feedback.modules.notifications.dto;

import java.util.List;

public record NotificationListPayload(
        List<NotificationPayload> items,
        long unreadCount
) {
}

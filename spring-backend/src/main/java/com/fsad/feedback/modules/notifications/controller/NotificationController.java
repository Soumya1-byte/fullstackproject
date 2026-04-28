package com.fsad.feedback.modules.notifications.controller;

import com.fsad.feedback.common.api.ApiResponse;
import com.fsad.feedback.common.security.AuthenticatedUser;
import com.fsad.feedback.common.security.SecurityUtils;
import com.fsad.feedback.modules.notifications.dto.NotificationListPayload;
import com.fsad.feedback.modules.notifications.dto.NotificationPayload;
import com.fsad.feedback.modules.notifications.service.NotificationService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public ApiResponse<NotificationListPayload> list() {
        AuthenticatedUser user = SecurityUtils.requireAuthenticatedUser();
        return ApiResponse.ok(notificationService.listForUser(user.id()));
    }

    @PatchMapping("/{notificationId}/read")
    public ApiResponse<NotificationPayload> markRead(@PathVariable String notificationId) {
        AuthenticatedUser user = SecurityUtils.requireAuthenticatedUser();
        return ApiResponse.ok(notificationService.markRead(user.id(), notificationId));
    }

    @PatchMapping("/read-all")
    public ApiResponse<NotificationListPayload> markAllRead() {
        AuthenticatedUser user = SecurityUtils.requireAuthenticatedUser();
        return ApiResponse.ok(notificationService.markAllRead(user.id()));
    }
}

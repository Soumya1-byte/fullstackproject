package com.fsad.feedback.modules.notifications.service;

import com.fsad.feedback.common.error.AppException;
import com.fsad.feedback.modules.notifications.dto.NotificationListPayload;
import com.fsad.feedback.modules.notifications.dto.NotificationPayload;
import com.fsad.feedback.modules.notifications.model.Notification;
import com.fsad.feedback.modules.notifications.model.NotificationType;
import com.fsad.feedback.modules.notifications.repository.NotificationRepository;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    public NotificationListPayload listForUser(String userId) {
        List<NotificationPayload> items = notificationRepository.findByUserId(userId, Sort.by(Sort.Direction.DESC, "createdAt"))
                .stream()
                .limit(20)
                .map(this::toPayload)
                .toList();

        return new NotificationListPayload(items, notificationRepository.countByUserIdAndReadIsFalse(userId));
    }

    public NotificationPayload markRead(String userId, String notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "NOTIFICATION_NOT_FOUND", "Notification not found"));

        if (!notification.getUserId().equals(userId)) {
            throw new AppException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Forbidden");
        }

        if (!notification.isRead()) {
            notification.setRead(true);
            notification.setReadAt(Instant.now());
            notification = notificationRepository.save(notification);
        }

        return toPayload(notification);
    }

    public NotificationListPayload markAllRead(String userId) {
        List<Notification> notifications = notificationRepository.findByUserId(userId, Sort.unsorted());
        List<Notification> dirty = new ArrayList<>();
        Instant now = Instant.now();
        for (Notification notification : notifications) {
            if (!notification.isRead()) {
                notification.setRead(true);
                notification.setReadAt(now);
                dirty.add(notification);
            }
        }
        if (!dirty.isEmpty()) {
            notificationRepository.saveAll(dirty);
        }
        return listForUser(userId);
    }

    public void createForUser(String userId, NotificationType type, String title, String message, String actionUrl) {
        if (userId == null || userId.isBlank()) {
            return;
        }

        Notification notification = new Notification();
        notification.setUserId(userId);
        notification.setType(type);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setActionUrl(actionUrl);
        notification.setRead(false);
        notification.setReadAt(null);
        notificationRepository.save(notification);
    }

    public void createForUsers(List<String> userIds, NotificationType type, String title, String message, String actionUrl) {
        Set<String> uniqueUserIds = new LinkedHashSet<>();
        for (String userId : userIds) {
            if (userId != null && !userId.isBlank()) {
                uniqueUserIds.add(userId);
            }
        }
        for (String userId : uniqueUserIds) {
            createForUser(userId, type, title, message, actionUrl);
        }
    }

    private NotificationPayload toPayload(Notification notification) {
        return new NotificationPayload(
                notification.getId(),
                notification.getType(),
                notification.getTitle(),
                notification.getMessage(),
                notification.getActionUrl(),
                notification.isRead(),
                notification.getReadAt(),
                notification.getCreatedAt()
        );
    }
}

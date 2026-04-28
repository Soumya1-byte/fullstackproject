package com.fsad.feedback.modules.notifications.repository;

import com.fsad.feedback.modules.notifications.model.Notification;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface NotificationRepository extends MongoRepository<Notification, String> {

    List<Notification> findByUserId(String userId, Sort sort);

    long countByUserIdAndReadIsFalse(String userId);
}

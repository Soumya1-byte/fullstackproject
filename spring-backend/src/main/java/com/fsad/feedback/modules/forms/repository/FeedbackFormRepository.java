package com.fsad.feedback.modules.forms.repository;

import com.fsad.feedback.modules.forms.model.FeedbackForm;
import com.fsad.feedback.modules.forms.model.FormStatus;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Collection;
import java.util.List;

public interface FeedbackFormRepository extends MongoRepository<FeedbackForm, String> {

    List<FeedbackForm> findByCreatedBy(String createdBy, Sort sort);

    List<FeedbackForm> findByCourseIdInAndStatus(Collection<String> courseIds, FormStatus status, Sort sort);
}

package com.fsad.feedback.modules.responses.repository;

import com.fsad.feedback.modules.responses.model.FeedbackResponse;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface FeedbackResponseRepository extends MongoRepository<FeedbackResponse, String> {

    Optional<FeedbackResponse> findByFormIdAndStudentId(String formId, String studentId);

    List<FeedbackResponse> findByFormId(String formId, Sort sort);

    List<FeedbackResponse> findByStudentId(String studentId, Sort sort);

    long countByFormId(String formId);

    List<FeedbackResponse> findByFormIdIn(List<String> formIds);
}

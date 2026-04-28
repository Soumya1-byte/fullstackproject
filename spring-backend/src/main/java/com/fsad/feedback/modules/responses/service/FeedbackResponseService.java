package com.fsad.feedback.modules.responses.service;

import com.fsad.feedback.common.error.AppException;
import com.fsad.feedback.common.security.AuthenticatedUser;
import com.fsad.feedback.modules.courses.model.Course;
import com.fsad.feedback.modules.courses.repository.CourseRepository;
import com.fsad.feedback.modules.forms.model.FeedbackForm;
import com.fsad.feedback.modules.forms.model.FormStatus;
import com.fsad.feedback.modules.forms.repository.FeedbackFormRepository;
import com.fsad.feedback.modules.notifications.model.NotificationType;
import com.fsad.feedback.modules.notifications.service.NotificationService;
import com.fsad.feedback.modules.responses.dto.AnswerPayload;
import com.fsad.feedback.modules.responses.dto.InsightPayload;
import com.fsad.feedback.modules.responses.dto.ResponsePayload;
import com.fsad.feedback.modules.responses.dto.ResponseStatusPayload;
import com.fsad.feedback.modules.responses.dto.SubmitResponseRequest;
import com.fsad.feedback.modules.responses.model.Answer;
import com.fsad.feedback.modules.responses.model.FeedbackResponse;
import com.fsad.feedback.modules.responses.repository.FeedbackResponseRepository;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class FeedbackResponseService {

    private final FeedbackResponseRepository feedbackResponseRepository;
    private final FeedbackFormRepository feedbackFormRepository;
    private final CourseRepository courseRepository;
    private final NotificationService notificationService;

    public FeedbackResponseService(
            FeedbackResponseRepository feedbackResponseRepository,
            FeedbackFormRepository feedbackFormRepository,
            CourseRepository courseRepository,
            NotificationService notificationService
    ) {
        this.feedbackResponseRepository = feedbackResponseRepository;
        this.feedbackFormRepository = feedbackFormRepository;
        this.courseRepository = courseRepository;
        this.notificationService = notificationService;
    }

    public ResponsePayload submit(AuthenticatedUser user, String formId, SubmitResponseRequest request) {
        FeedbackForm form = feedbackFormRepository.findById(formId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "FORM_NOT_AVAILABLE", "Form not available"));

        if (form.getStatus() != FormStatus.PUBLISHED) {
            throw new AppException(HttpStatus.NOT_FOUND, "FORM_NOT_AVAILABLE", "Form not available");
        }

        Course course = courseRepository.findById(form.getCourseId())
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "COURSE_NOT_FOUND", "Course not found"));

        if (!course.getAssignedStudentIds().contains(user.id())) {
            throw new AppException(HttpStatus.FORBIDDEN, "COURSE_ACCESS_DENIED", "Course access denied");
        }

        FeedbackResponse response = feedbackResponseRepository.findByFormIdAndStudentId(formId, user.id())
                .orElseGet(FeedbackResponse::new);

        response.setFormId(formId);
        response.setCourseId(form.getCourseId());
        response.setStudentId(user.id());
        response.setAnswers(request.answers().stream().map(answer -> {
            Answer mapped = new Answer();
            mapped.setQuestionId(answer.questionId().trim());
            mapped.setValue(answer.value());
            return mapped;
        }).toList());
        response.setSubmittedAt(Instant.now());

        FeedbackResponse savedResponse = feedbackResponseRepository.save(response);
        notificationService.createForUser(
                form.getCreatedBy(),
                NotificationType.FEEDBACK_SUBMITTED,
                "New feedback submitted",
                "A student submitted feedback for " + form.getTitle() + ".",
                "/admin/responses"
        );

        return toPayload(savedResponse);
    }

    public List<ResponsePayload> listForForm(AuthenticatedUser user, String formId) {
        FeedbackForm form = feedbackFormRepository.findById(formId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "FORM_NOT_FOUND", "Form not found"));

        if (!form.getCreatedBy().equals(user.id()) || !user.role().isAdminLike()) {
            throw new AppException(HttpStatus.FORBIDDEN, "FORM_ACCESS_DENIED", "Access denied");
        }

        return feedbackResponseRepository.findByFormId(formId, Sort.by(Sort.Direction.DESC, "submittedAt")).stream()
                .map(this::toPayload)
                .toList();
    }

    public List<ResponseStatusPayload> myStatuses(AuthenticatedUser user) {
        return feedbackResponseRepository.findByStudentId(user.id(), Sort.by(Sort.Direction.DESC, "submittedAt")).stream()
                .map(response -> new ResponseStatusPayload(response.getFormId(), response.getSubmittedAt()))
                .toList();
    }

    public InsightPayload insightsForStudent(AuthenticatedUser user, String formId) {
        FeedbackForm form = feedbackFormRepository.findById(formId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "FORM_NOT_AVAILABLE", "Form not available"));

        if (form.getStatus() != FormStatus.PUBLISHED) {
            throw new AppException(HttpStatus.NOT_FOUND, "FORM_NOT_AVAILABLE", "Form not available");
        }

        feedbackResponseRepository.findByFormIdAndStudentId(formId, user.id())
                .orElseThrow(() -> new AppException(HttpStatus.FORBIDDEN, "INSIGHTS_LOCKED", "Submit feedback before viewing insights"));

        List<FeedbackResponse> responses = feedbackResponseRepository.findByFormId(formId, Sort.unsorted());
        return buildInsights(responses);
    }

    public InsightPayload buildInsights(List<FeedbackResponse> responses) {
        Map<Integer, Integer> distribution = new LinkedHashMap<>();
        for (int i = 1; i <= 5; i++) {
            distribution.put(i, 0);
        }

        int totalCount = 0;
        for (FeedbackResponse response : responses) {
            for (Answer answer : response.getAnswers()) {
                Integer bucket = toBucket(answer.getValue());
                if (bucket == null) {
                    continue;
                }
                distribution.put(bucket, distribution.get(bucket) + 1);
                totalCount += 1;
            }
        }

        if (totalCount < 5) {
            return new InsightPayload(true, List.of(), List.of());
        }

        List<Map<String, Object>> distributionPayload = distribution.entrySet().stream()
                .map(entry -> Map.<String, Object>of("bucket", String.valueOf(entry.getKey()), "count", entry.getValue()))
                .toList();

        int positive = distribution.entrySet().stream().filter(entry -> entry.getKey() >= 4).mapToInt(Map.Entry::getValue).sum();
        int neutral = distribution.getOrDefault(3, 0);
        int negative = distribution.entrySet().stream().filter(entry -> entry.getKey() <= 2).mapToInt(Map.Entry::getValue).sum();

        List<Map<String, Object>> satisfaction = List.of(
                Map.of("name", "Positive", "value", positive),
                Map.of("name", "Neutral", "value", neutral),
                Map.of("name", "Negative", "value", negative)
        );

        return new InsightPayload(false, satisfaction, distributionPayload);
    }

    private Integer toBucket(Object value) {
        if (value instanceof Number number) {
            int rounded = (int) Math.round(number.doubleValue());
            return Math.max(1, Math.min(5, rounded));
        }
        return null;
    }

    private ResponsePayload toPayload(FeedbackResponse response) {
        return new ResponsePayload(
                response.getId(),
                response.getFormId(),
                response.getCourseId(),
                response.getAnswers().stream()
                        .map(answer -> new AnswerPayload(answer.getQuestionId(), answer.getValue()))
                        .toList(),
                response.getSubmittedAt()
        );
    }
}

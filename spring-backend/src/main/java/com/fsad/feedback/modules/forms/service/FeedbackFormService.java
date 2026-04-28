package com.fsad.feedback.modules.forms.service;

import com.fsad.feedback.common.error.AppException;
import com.fsad.feedback.common.security.AuthenticatedUser;
import com.fsad.feedback.modules.courses.model.Course;
import com.fsad.feedback.modules.courses.repository.CourseRepository;
import com.fsad.feedback.modules.notifications.model.NotificationType;
import com.fsad.feedback.modules.notifications.service.NotificationService;
import com.fsad.feedback.modules.forms.dto.CreateFormRequest;
import com.fsad.feedback.modules.forms.dto.FormPayload;
import com.fsad.feedback.modules.forms.dto.FormQuestionPayload;
import com.fsad.feedback.modules.forms.dto.FormQuestionRequest;
import com.fsad.feedback.modules.forms.model.FeedbackForm;
import com.fsad.feedback.modules.forms.model.FormQuestion;
import com.fsad.feedback.modules.forms.model.FormStatus;
import com.fsad.feedback.modules.forms.model.QuestionType;
import com.fsad.feedback.modules.forms.repository.FeedbackFormRepository;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
public class FeedbackFormService {

    private final FeedbackFormRepository feedbackFormRepository;
    private final CourseRepository courseRepository;
    private final NotificationService notificationService;

    public FeedbackFormService(
            FeedbackFormRepository feedbackFormRepository,
            CourseRepository courseRepository,
            NotificationService notificationService
    ) {
        this.feedbackFormRepository = feedbackFormRepository;
        this.courseRepository = courseRepository;
        this.notificationService = notificationService;
    }

    public FormPayload create(AuthenticatedUser user, CreateFormRequest request) {
        Course course = courseRepository.findById(request.courseId())
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "COURSE_NOT_FOUND", "Course not found"));

        if (!course.getAdminId().equals(user.id()) || !user.role().isAdminLike()) {
            throw new AppException(HttpStatus.FORBIDDEN, "COURSE_ACCESS_DENIED", "Course access denied");
        }

        FeedbackForm form = new FeedbackForm();
        form.setTitle(request.title().trim());
        form.setDescription(request.description() == null ? "" : request.description().trim());
        form.setCourseId(request.courseId());
        form.setCreatedBy(user.id());
        form.setStatus(request.status());
        form.setQuestions(request.questions().stream().map(this::toQuestion).toList());

        if (request.status() == FormStatus.PUBLISHED) {
            form.setPublishAt(Instant.now());
        }
        if (request.status() == FormStatus.CLOSED) {
            form.setCloseAt(Instant.now());
        }

        return toPayload(feedbackFormRepository.save(form));
    }

    public List<FormPayload> list(AuthenticatedUser user) {
        Sort sort = Sort.by(Sort.Direction.DESC, "createdAt");
        List<FeedbackForm> forms;
        if (user.role().isAdminLike()) {
            forms = feedbackFormRepository.findByCreatedBy(user.id(), sort);
        } else {
            List<String> courseIds = courseRepository.findByAssignedStudentId(user.id()).stream()
                    .map(Course::getId)
                    .toList();
            forms = courseIds.isEmpty()
                    ? List.of()
                    : feedbackFormRepository.findByCourseIdInAndStatus(courseIds, FormStatus.PUBLISHED, sort);
        }
        return forms.stream().map(this::toPayload).toList();
    }

    public FormPayload getById(AuthenticatedUser user, String formId) {
        FeedbackForm form = requireAccessibleForm(formId, user);
        return toPayload(form);
    }

    public FormPayload publish(AuthenticatedUser user, String formId) {
        FeedbackForm form = requireOwnedForm(formId, user);
        form.setStatus(FormStatus.PUBLISHED);
        form.setPublishAt(Instant.now());
        FeedbackForm savedForm = feedbackFormRepository.save(form);
        Course course = courseRepository.findById(savedForm.getCourseId())
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "COURSE_NOT_FOUND", "Course not found"));
        notificationService.createForUsers(
                course.getAssignedStudentIds(),
                NotificationType.FORM_PUBLISHED,
                "New feedback form available",
                savedForm.getTitle() + " is now available for " + course.getCode() + ".",
                "/student/feedback"
        );
        return toPayload(savedForm);
    }

    public FormPayload close(AuthenticatedUser user, String formId) {
        FeedbackForm form = requireOwnedForm(formId, user);
        form.setStatus(FormStatus.CLOSED);
        form.setCloseAt(Instant.now());
        return toPayload(feedbackFormRepository.save(form));
    }

    public FeedbackForm requireAccessibleForm(String formId, AuthenticatedUser user) {
        FeedbackForm form = feedbackFormRepository.findById(formId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "FORM_NOT_FOUND", "Form not found"));

        if (user.role().isAdminLike()) {
            if (!form.getCreatedBy().equals(user.id())) {
                throw new AppException(HttpStatus.FORBIDDEN, "FORM_ACCESS_DENIED", "Access denied");
            }
            return form;
        }

        Course course = courseRepository.findById(form.getCourseId())
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "COURSE_NOT_FOUND", "Course not found"));

        if (!course.getAssignedStudentIds().contains(user.id()) || form.getStatus() != FormStatus.PUBLISHED) {
            throw new AppException(HttpStatus.FORBIDDEN, "FORM_ACCESS_DENIED", "Access denied");
        }
        return form;
    }

    public FeedbackForm requireOwnedForm(String formId, AuthenticatedUser user) {
        FeedbackForm form = feedbackFormRepository.findById(formId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "FORM_NOT_FOUND", "Form not found"));

        if (!form.getCreatedBy().equals(user.id()) || !user.role().isAdminLike()) {
            throw new AppException(HttpStatus.FORBIDDEN, "FORM_ACCESS_DENIED", "Access denied");
        }
        return form;
    }

    private FormQuestion toQuestion(FormQuestionRequest request) {
        validateQuestion(request);
        FormQuestion question = new FormQuestion();
        question.setQuestionId(request.questionId().trim());
        question.setLabel(request.label().trim());
        question.setType(request.type());
        question.setRequired(Boolean.TRUE.equals(request.required()));
        question.setOptions(request.options() == null ? List.of() : request.options().stream()
                .filter(option -> option != null && !option.trim().isEmpty())
                .map(String::trim)
                .toList());
        question.setScale(request.scale());
        return question;
    }

    private void validateQuestion(FormQuestionRequest request) {
        if ((request.type() == QuestionType.MCQ || request.type() == QuestionType.LIKERT)
                && (request.options() == null || request.options().stream().filter(option -> option != null && !option.trim().isEmpty()).count() < 2)) {
            throw new AppException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "MCQ and LIKERT questions require at least two options");
        }
    }

    private FormPayload toPayload(FeedbackForm form) {
        return new FormPayload(
                form.getId(),
                form.getTitle(),
                form.getDescription(),
                form.getCourseId(),
                form.getCreatedBy(),
                form.getStatus(),
                form.getIsAnonymous(),
                form.getQuestions().stream()
                        .map(question -> new FormQuestionPayload(
                                question.getQuestionId(),
                                question.getLabel(),
                                question.getType(),
                                question.isRequired(),
                                question.getOptions(),
                                question.getScale()
                        ))
                        .toList(),
                form.getPublishAt(),
                form.getCloseAt(),
                form.getCreatedAt(),
                form.getUpdatedAt()
        );
    }
}

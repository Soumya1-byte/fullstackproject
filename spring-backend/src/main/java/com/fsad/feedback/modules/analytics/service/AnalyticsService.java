package com.fsad.feedback.modules.analytics.service;

import com.fsad.feedback.common.error.AppException;
import com.fsad.feedback.common.security.AuthenticatedUser;
import com.fsad.feedback.modules.analytics.dto.AnalyticsOverviewPayload;
import com.fsad.feedback.modules.analytics.dto.AnalyticsSummaryPayload;
import com.fsad.feedback.modules.courses.model.Course;
import com.fsad.feedback.modules.courses.repository.CourseRepository;
import com.fsad.feedback.modules.forms.model.FeedbackForm;
import com.fsad.feedback.modules.forms.model.FormQuestion;
import com.fsad.feedback.modules.forms.repository.FeedbackFormRepository;
import com.fsad.feedback.modules.responses.dto.InsightPayload;
import com.fsad.feedback.modules.responses.model.Answer;
import com.fsad.feedback.modules.responses.model.FeedbackResponse;
import com.fsad.feedback.modules.responses.repository.FeedbackResponseRepository;
import com.fsad.feedback.modules.responses.service.FeedbackResponseService;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class AnalyticsService {

    private static final DateTimeFormatter DAY_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd").withZone(ZoneOffset.UTC);

    private final FeedbackFormRepository feedbackFormRepository;
    private final FeedbackResponseRepository feedbackResponseRepository;
    private final CourseRepository courseRepository;
    private final FeedbackResponseService feedbackResponseService;

    public AnalyticsService(
            FeedbackFormRepository feedbackFormRepository,
            FeedbackResponseRepository feedbackResponseRepository,
            CourseRepository courseRepository,
            FeedbackResponseService feedbackResponseService
    ) {
        this.feedbackFormRepository = feedbackFormRepository;
        this.feedbackResponseRepository = feedbackResponseRepository;
        this.courseRepository = courseRepository;
        this.feedbackResponseService = feedbackResponseService;
    }

    public AnalyticsOverviewPayload overview(AuthenticatedUser user, String courseId, String semester) {
        List<Course> adminCourses = courseRepository.findByAdminId(user.id(), Sort.unsorted());
        List<Course> filteredCourses = adminCourses.stream()
                .filter(course -> courseId == null || courseId.isBlank() || course.getId().equals(courseId))
                .filter(course -> semester == null || semester.isBlank() || semester.equals(course.getSemester()))
                .toList();

        List<String> courseIds = filteredCourses.stream().map(Course::getId).toList();
        if (courseIds.isEmpty()) {
            return new AnalyticsOverviewPayload(false, normalizeBlank(semester), List.of(), List.of(), List.of());
        }

        List<String> formIds = feedbackFormRepository.findAll().stream()
                .filter(form -> form.getCreatedBy().equals(user.id()))
                .filter(form -> courseIds.contains(form.getCourseId()))
                .map(FeedbackForm::getId)
                .toList();

        if (formIds.isEmpty()) {
            return new AnalyticsOverviewPayload(false, normalizeBlank(semester), List.of(), List.of(), List.of());
        }

        List<FeedbackResponse> responses = feedbackResponseRepository.findByFormIdIn(formIds);
        InsightPayload insight = feedbackResponseService.buildInsights(responses);
        List<Map<String, Object>> trends = buildTrends(responses);

        return new AnalyticsOverviewPayload(
                insight.suppressed(),
                normalizeBlank(semester),
                insight.satisfaction(),
                insight.distribution(),
                insight.suppressed() ? List.of() : trends
        );
    }

    public AnalyticsSummaryPayload formSummary(AuthenticatedUser user, String formId) {
        FeedbackForm form = feedbackFormRepository.findById(formId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "FORM_NOT_FOUND", "Form not found"));

        requireOwnedForm(form, user);

        List<FeedbackResponse> responses = feedbackResponseRepository.findByFormId(formId, Sort.unsorted());
        long count = responses.size();

        double total = 0;
        int ratedAnswers = 0;
        for (FeedbackResponse response : responses) {
            for (Answer answer : response.getAnswers()) {
                if (answer.getValue() instanceof Number number) {
                    total += number.doubleValue();
                    ratedAnswers += 1;
                }
            }
        }

        Double avgRating = ratedAnswers == 0 ? null : Math.round((total / ratedAnswers) * 100.0) / 100.0;
        return new AnalyticsSummaryPayload(formId, count, avgRating);
    }

    public String exportCsv(AuthenticatedUser user, String formId) {
        FeedbackForm form = feedbackFormRepository.findById(formId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "FORM_NOT_FOUND", "Form not found"));
        requireOwnedForm(form, user);

        List<FeedbackResponse> responses = feedbackResponseRepository.findByFormId(formId, Sort.by(Sort.Direction.DESC, "submittedAt"));
        AnalyticsSummaryPayload summary = formSummary(user, formId);
        Map<String, FormQuestion> questionMap = questionMap(form);
        List<String> orderedQuestionIds = form.getQuestions().stream().map(FormQuestion::getQuestionId).toList();

        List<String> lines = new ArrayList<>();
        lines.add("Report Type," + csvValue("Detailed Feedback Export"));
        lines.add("Form ID," + csvValue(form.getId()));
        lines.add("Title," + csvValue(form.getTitle()));
        lines.add("Description," + csvValue(form.getDescription()));
        lines.add("Course ID," + csvValue(form.getCourseId()));
        lines.add("Status," + csvValue(String.valueOf(form.getStatus())));
        lines.add("Published At," + csvValue(formatInstant(form.getPublishAt())));
        lines.add("Closed At," + csvValue(formatInstant(form.getCloseAt())));
        lines.add("Question Count," + form.getQuestions().size());
        lines.add("Response Count," + summary.responseCount());
        lines.add("Average Rating," + csvValue(summary.avgRating() == null ? "N/A" : summary.avgRating()));
        lines.add("");
        lines.add("Question Index,Question ID,Question Label,Question Type,Required,Options");

        for (int i = 0; i < form.getQuestions().size(); i += 1) {
            FormQuestion question = form.getQuestions().get(i);
            lines.add(String.join(",",
                    String.valueOf(i + 1),
                    csvValue(question.getQuestionId()),
                    csvValue(question.getLabel()),
                    csvValue(String.valueOf(question.getType())),
                    csvValue(String.valueOf(question.isRequired())),
                    csvValue(String.join(" | ", question.getOptions()))
            ));
        }

        lines.add("");
        List<String> headers = new ArrayList<>();
        headers.add("Response ID");
        headers.add("Submitted At");
        headers.add("Answered Questions");
        orderedQuestionIds.forEach(questionId -> {
            FormQuestion question = questionMap.get(questionId);
            String label = question == null ? questionId : question.getLabel() + " [" + question.getType() + "]";
            headers.add(label);
        });
        lines.add(toCsvRow(headers));

        for (FeedbackResponse response : responses) {
            Map<String, Object> answerMap = answerMap(response);
            List<String> row = new ArrayList<>();
            row.add(response.getId());
            row.add(formatInstant(response.getSubmittedAt()));
            row.add(String.valueOf(response.getAnswers().size()));
            orderedQuestionIds.forEach(questionId -> row.add(formatAnswer(answerMap.get(questionId))));
            lines.add(toCsvRow(row));
        }

        return String.join("\n", lines);
    }

    public byte[] exportPdf(AuthenticatedUser user, String formId) {
        FeedbackForm form = feedbackFormRepository.findById(formId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "FORM_NOT_FOUND", "Form not found"));
        requireOwnedForm(form, user);

        AnalyticsSummaryPayload summary = formSummary(user, formId);
        List<FeedbackResponse> responses = feedbackResponseRepository.findByFormId(formId, Sort.by(Sort.Direction.DESC, "submittedAt"));
        List<Map<String, Object>> trends = buildTrends(responses);
        InsightPayload insight = feedbackResponseService.buildInsights(responses);

        List<String> lines = new java.util.ArrayList<>();
        lines.add("Detailed Student Feedback Report");
        lines.add("Form ID: " + formId);
        lines.add("Title: " + form.getTitle());
        lines.add("Description: " + defaultText(form.getDescription()));
        lines.add("Course ID: " + form.getCourseId());
        lines.add("Status: " + form.getStatus());
        lines.add("Published At: " + formatInstant(form.getPublishAt()));
        lines.add("Closed At: " + formatInstant(form.getCloseAt()));
        lines.add("Responses: " + summary.responseCount());
        lines.add("Average Rating: " + (summary.avgRating() == null ? "N/A" : summary.avgRating()));
        lines.add(" ");
        lines.add("Question Summary");

        if (form.getQuestions().isEmpty()) {
            lines.add("No questions configured.");
        } else {
            for (int i = 0; i < form.getQuestions().size(); i += 1) {
                FormQuestion question = form.getQuestions().get(i);
                lines.add((i + 1) + ". " + question.getLabel() + " [" + question.getType() + "]");
                if (!question.getOptions().isEmpty()) {
                    lines.add("   Options: " + String.join(" | ", question.getOptions()));
                }
            }
        }

        lines.add(" ");
        lines.add("Trend Snapshot");

        if (trends.isEmpty()) {
            lines.add("No trend data available.");
        } else {
            trends.stream().limit(12).forEach(point -> lines.add(point.get("label") + ": " + point.get("value")));
        }

        lines.add(" ");
        lines.add("Distribution Snapshot");
        if (insight.suppressed() || insight.distribution().isEmpty()) {
            lines.add("Distribution hidden or not enough numeric data.");
        } else {
            insight.distribution().forEach(item -> lines.add(item.get("bucket") + ": " + item.get("count")));
        }

        lines.add(" ");
        lines.add("Recent Anonymous Responses");
        if (responses.isEmpty()) {
            lines.add("No responses submitted.");
        } else {
            Map<String, FormQuestion> questionMap = questionMap(form);
            responses.stream().limit(8).forEach(response -> {
                lines.add("Response " + response.getId() + " at " + formatInstant(response.getSubmittedAt()));
                if (response.getAnswers().isEmpty()) {
                    lines.add("   No answers recorded.");
                    return;
                }
                response.getAnswers().stream().limit(4).forEach(answer -> {
                    FormQuestion question = questionMap.get(answer.getQuestionId());
                    String label = question == null ? answer.getQuestionId() : question.getLabel();
                    lines.add("   " + label + ": " + formatAnswer(answer.getValue()));
                });
                if (response.getAnswers().size() > 4) {
                    lines.add("   ... " + (response.getAnswers().size() - 4) + " more answers");
                }
            });
        }

        return buildSimplePdf(lines);
    }

    private List<Map<String, Object>> buildTrends(List<FeedbackResponse> responses) {
        Map<String, List<Double>> daily = new LinkedHashMap<>();
        for (FeedbackResponse response : responses) {
            String key = DAY_FORMAT.format(response.getSubmittedAt());
            List<Double> values = daily.computeIfAbsent(key, ignored -> new java.util.ArrayList<>());
            for (Answer answer : response.getAnswers()) {
                if (answer.getValue() instanceof Number number) {
                    values.add(number.doubleValue());
                }
            }
        }

        return daily.entrySet().stream()
                .map(entry -> {
                    double avg = entry.getValue().stream().mapToDouble(Double::doubleValue).average().orElse(0);
                    return Map.<String, Object>of("label", entry.getKey(), "value", Math.round(avg * 100.0) / 100.0);
                })
                .toList();
    }

    private String normalizeBlank(String value) {
        return value == null || value.isBlank() ? null : value;
    }

    private Map<String, FormQuestion> questionMap(FeedbackForm form) {
        Map<String, FormQuestion> questionMap = new LinkedHashMap<>();
        form.getQuestions().forEach(question -> questionMap.put(question.getQuestionId(), question));
        return questionMap;
    }

    private void requireOwnedForm(FeedbackForm form, AuthenticatedUser user) {
        if (!form.getCreatedBy().equals(user.id()) || !user.role().isAdminLike()) {
            throw new AppException(HttpStatus.FORBIDDEN, "FORM_ACCESS_DENIED", "Access denied");
        }
    }

    private String csvValue(Object value) {
        if (value == null) {
            return "";
        }
        String raw = String.valueOf(value).replace("\"", "\"\"");
        return "\"" + raw + "\"";
    }

    private String toCsvRow(List<String> values) {
        return values.stream().map(this::csvValue).collect(java.util.stream.Collectors.joining(","));
    }

    private Map<String, Object> answerMap(FeedbackResponse response) {
        Map<String, Object> answerMap = new LinkedHashMap<>();
        response.getAnswers().forEach(answer -> answerMap.put(answer.getQuestionId(), answer.getValue()));
        return answerMap;
    }

    private String formatInstant(java.time.Instant instant) {
        return instant == null ? "N/A" : instant.toString();
    }

    private String formatAnswer(Object value) {
        if (value == null) {
            return "";
        }
        if (value instanceof List<?> list) {
            return list.stream().map(String::valueOf).collect(java.util.stream.Collectors.joining(" | "));
        }
        return String.valueOf(value);
    }

    private String defaultText(String value) {
        return value == null || value.isBlank() ? "N/A" : value;
    }

    private <T> List<T> prepend(T first, List<T> rest) {
        List<T> items = new java.util.ArrayList<>();
        items.add(first);
        items.addAll(rest);
        return items;
    }

    private byte[] buildSimplePdf(List<String> lines) {
        List<String> safeLines = lines.stream().limit(120).map(this::escapePdfText).toList();

        StringBuilder stream = new StringBuilder("BT\n/F1 12 Tf\n50 790 Td\n");
        for (int i = 0; i < safeLines.size(); i += 1) {
            stream.append("(").append(safeLines.get(i)).append(") Tj\n");
            if (i < safeLines.size() - 1) {
                stream.append("0 -16 Td\n");
            }
        }
        stream.append("ET\n");

        List<String> objects = List.of(
                "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
                "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
                "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n",
                "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
                "5 0 obj\n<< /Length " + stream.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8).length + " >>\nstream\n" + stream + "endstream\nendobj\n"
        );

        StringBuilder pdf = new StringBuilder("%PDF-1.4\n%\u00E2\u00E3\u00CF\u00D3\n");
        List<Integer> offsets = new java.util.ArrayList<>();
        offsets.add(0);

        for (String object : objects) {
            offsets.add(pdf.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8).length);
            pdf.append(object);
        }

        int xrefOffset = pdf.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8).length;
        pdf.append("xref\n0 ").append(objects.size() + 1).append("\n");
        pdf.append("0000000000 65535 f \n");
        for (int i = 1; i <= objects.size(); i += 1) {
            pdf.append(String.format("%010d 00000 n \n", offsets.get(i)));
        }
        pdf.append("trailer\n<< /Size ").append(objects.size() + 1).append(" /Root 1 0 R >>\nstartxref\n");
        pdf.append(xrefOffset).append("\n%%EOF\n");
        return pdf.toString().getBytes(java.nio.charset.StandardCharsets.ISO_8859_1);
    }

    private String escapePdfText(String input) {
        return String.valueOf(input).replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)");
    }
}

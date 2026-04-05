package com.fsad.feedback.modules.analytics.controller;

import com.fsad.feedback.common.api.ApiResponse;
import com.fsad.feedback.common.security.AuthenticatedUser;
import com.fsad.feedback.common.security.SecurityUtils;
import com.fsad.feedback.modules.analytics.dto.AnalyticsOverviewPayload;
import com.fsad.feedback.modules.analytics.dto.AnalyticsSummaryPayload;
import com.fsad.feedback.modules.analytics.service.AnalyticsService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/analytics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping("/overview")
    public ApiResponse<AnalyticsOverviewPayload> overview(
            @RequestParam(value = "courseId", required = false) String courseId,
            @RequestParam(value = "semester", required = false) String semester
    ) {
        AuthenticatedUser user = SecurityUtils.requireAuthenticatedUser();
        return ApiResponse.ok(analyticsService.overview(user, courseId, semester));
    }

    @GetMapping("/forms/{formId}/summary")
    public ApiResponse<AnalyticsSummaryPayload> formSummary(@PathVariable("formId") String formId) {
        AuthenticatedUser user = SecurityUtils.requireAuthenticatedUser();
        return ApiResponse.ok(analyticsService.formSummary(user, formId));
    }

    @GetMapping("/forms/{formId}/export.csv")
    public ResponseEntity<String> exportCsv(@PathVariable("formId") String formId) {
        AuthenticatedUser user = SecurityUtils.requireAuthenticatedUser();
        String csv = analyticsService.exportCsv(user, formId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"feedback-report-" + formId + ".csv\"")
                .contentType(MediaType.TEXT_PLAIN)
                .body(csv);
    }

    @GetMapping("/forms/{formId}/export.pdf")
    public ResponseEntity<byte[]> exportPdf(@PathVariable("formId") String formId) {
        AuthenticatedUser user = SecurityUtils.requireAuthenticatedUser();
        byte[] pdf = analyticsService.exportPdf(user, formId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"feedback-report-" + formId + ".pdf\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }
}

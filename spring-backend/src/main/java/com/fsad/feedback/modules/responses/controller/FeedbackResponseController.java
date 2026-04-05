package com.fsad.feedback.modules.responses.controller;

import com.fsad.feedback.common.api.ApiResponse;
import com.fsad.feedback.common.security.AuthenticatedUser;
import com.fsad.feedback.common.security.SecurityUtils;
import com.fsad.feedback.modules.responses.dto.InsightPayload;
import com.fsad.feedback.modules.responses.dto.ResponsePayload;
import com.fsad.feedback.modules.responses.dto.ResponseStatusPayload;
import com.fsad.feedback.modules.responses.dto.SubmitResponseRequest;
import com.fsad.feedback.modules.responses.service.FeedbackResponseService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/responses")
public class FeedbackResponseController {

    private final FeedbackResponseService feedbackResponseService;

    public FeedbackResponseController(FeedbackResponseService feedbackResponseService) {
        this.feedbackResponseService = feedbackResponseService;
    }

    @PostMapping("/forms/{formId}")
    public ApiResponse<ResponsePayload> submit(
            @PathVariable("formId") String formId,
            @Valid @RequestBody SubmitResponseRequest request
    ) {
        AuthenticatedUser user = SecurityUtils.requireAuthenticatedUser();
        return ApiResponse.ok(feedbackResponseService.submit(user, formId, request));
    }

    @GetMapping("/me")
    public ApiResponse<List<ResponseStatusPayload>> myStatuses() {
        AuthenticatedUser user = SecurityUtils.requireAuthenticatedUser();
        return ApiResponse.ok(feedbackResponseService.myStatuses(user));
    }

    @GetMapping("/forms/{formId}/insights")
    public ApiResponse<InsightPayload> insights(@PathVariable("formId") String formId) {
        AuthenticatedUser user = SecurityUtils.requireAuthenticatedUser();
        return ApiResponse.ok(feedbackResponseService.insightsForStudent(user, formId));
    }

    @GetMapping("/forms/{formId}")
    public ApiResponse<List<ResponsePayload>> listForForm(@PathVariable("formId") String formId) {
        AuthenticatedUser user = SecurityUtils.requireAuthenticatedUser();
        return ApiResponse.ok(feedbackResponseService.listForForm(user, formId));
    }
}

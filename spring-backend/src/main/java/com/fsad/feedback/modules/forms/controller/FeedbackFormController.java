package com.fsad.feedback.modules.forms.controller;

import com.fsad.feedback.common.api.ApiResponse;
import com.fsad.feedback.common.security.AuthenticatedUser;
import com.fsad.feedback.common.security.SecurityUtils;
import com.fsad.feedback.modules.forms.dto.CreateFormRequest;
import com.fsad.feedback.modules.forms.dto.FormPayload;
import com.fsad.feedback.modules.forms.service.FeedbackFormService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/forms")
public class FeedbackFormController {

    private final FeedbackFormService feedbackFormService;

    public FeedbackFormController(FeedbackFormService feedbackFormService) {
        this.feedbackFormService = feedbackFormService;
    }

    @GetMapping
    public ApiResponse<List<FormPayload>> list() {
        AuthenticatedUser user = SecurityUtils.requireAuthenticatedUser();
        return ApiResponse.ok(feedbackFormService.list(user));
    }

    @PostMapping
    public ApiResponse<FormPayload> create(@Valid @RequestBody CreateFormRequest request) {
        AuthenticatedUser user = SecurityUtils.requireAuthenticatedUser();
        return ApiResponse.ok(feedbackFormService.create(user, request));
    }

    @GetMapping("/{formId}")
    public ApiResponse<FormPayload> getById(@PathVariable("formId") String formId) {
        AuthenticatedUser user = SecurityUtils.requireAuthenticatedUser();
        return ApiResponse.ok(feedbackFormService.getById(user, formId));
    }

    @PostMapping("/{formId}/publish")
    public ApiResponse<FormPayload> publish(@PathVariable("formId") String formId) {
        AuthenticatedUser user = SecurityUtils.requireAuthenticatedUser();
        return ApiResponse.ok(feedbackFormService.publish(user, formId));
    }

    @PostMapping("/{formId}/close")
    public ApiResponse<FormPayload> close(@PathVariable("formId") String formId) {
        AuthenticatedUser user = SecurityUtils.requireAuthenticatedUser();
        return ApiResponse.ok(feedbackFormService.close(user, formId));
    }
}

package com.fsad.feedback.modules.users.controller;

import com.fsad.feedback.common.security.AuthenticatedUser;
import com.fsad.feedback.common.api.ApiResponse;
import com.fsad.feedback.common.security.SecurityUtils;
import com.fsad.feedback.modules.users.dto.RequestAdminAccessRequest;
import com.fsad.feedback.modules.users.dto.ReviewAdminAccessRequest;
import com.fsad.feedback.modules.users.dto.UpdateProfileRequest;
import com.fsad.feedback.modules.users.dto.UserProfilePayload;
import com.fsad.feedback.modules.users.service.UserService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/students")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER', 'SUPER_ADMIN')")
    public ApiResponse<List<UserProfilePayload>> listStudents() {
        return ApiResponse.ok(userService.listStudents());
    }

    @GetMapping("/me")
    public ApiResponse<UserProfilePayload> me() {
        return ApiResponse.ok(userService.getProfile(SecurityUtils.requireAuthenticatedUser().id()));
    }

    @PatchMapping("/me")
    public ApiResponse<UserProfilePayload> updateMe(@Valid @RequestBody UpdateProfileRequest request) {
        return ApiResponse.ok(userService.updateProfile(SecurityUtils.requireAuthenticatedUser().id(), request));
    }

    @PostMapping("/admin-request")
    @PreAuthorize("hasRole('STUDENT')")
    public ApiResponse<UserProfilePayload> requestAdminAccess(@Valid @RequestBody RequestAdminAccessRequest request) {
        return ApiResponse.ok(userService.requestAdminAccess(SecurityUtils.requireAuthenticatedUser().id(), request));
    }

    @GetMapping("/admin-requests")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER', 'SUPER_ADMIN')")
    public ApiResponse<List<UserProfilePayload>> listAdminRequests() {
        return ApiResponse.ok(userService.listAdminRequests());
    }

    @PatchMapping("/admin-requests/{userId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER', 'SUPER_ADMIN')")
    public ApiResponse<UserProfilePayload> reviewAdminRequest(
            @PathVariable String userId,
            @Valid @RequestBody ReviewAdminAccessRequest request
    ) {
        AuthenticatedUser authenticatedUser = SecurityUtils.requireAuthenticatedUser();
        return ApiResponse.ok(userService.reviewAdminRequest(authenticatedUser.id(), userId, request));
    }
}

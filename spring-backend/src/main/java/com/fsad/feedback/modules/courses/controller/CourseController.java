package com.fsad.feedback.modules.courses.controller;

import com.fsad.feedback.common.api.ApiResponse;
import com.fsad.feedback.common.security.AuthenticatedUser;
import com.fsad.feedback.common.security.SecurityUtils;
import com.fsad.feedback.modules.courses.dto.AssignStudentsRequest;
import com.fsad.feedback.modules.courses.dto.CoursePayload;
import com.fsad.feedback.modules.courses.dto.CreateCourseRequest;
import com.fsad.feedback.modules.courses.service.CourseService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/courses")
public class CourseController {

    private final CourseService courseService;

    public CourseController(CourseService courseService) {
        this.courseService = courseService;
    }

    @GetMapping
    public ApiResponse<List<CoursePayload>> list() {
        AuthenticatedUser user = SecurityUtils.requireAuthenticatedUser();
        return ApiResponse.ok(courseService.list(user));
    }

    @PostMapping
    public ApiResponse<CoursePayload> create(@Valid @RequestBody CreateCourseRequest request) {
        AuthenticatedUser user = SecurityUtils.requireAuthenticatedUser();
        return ApiResponse.ok(courseService.create(user, request));
    }

    @PostMapping("/{courseId}/assign-students")
    public ApiResponse<CoursePayload> assignStudents(
            @PathVariable("courseId") String courseId,
            @Valid @RequestBody AssignStudentsRequest request
    ) {
        AuthenticatedUser user = SecurityUtils.requireAuthenticatedUser();
        return ApiResponse.ok(courseService.assignStudents(user, courseId, request));
    }
}

package com.fsad.feedback.modules.courses.service;

import com.fsad.feedback.common.error.AppException;
import com.fsad.feedback.common.security.AuthenticatedUser;
import com.fsad.feedback.modules.courses.dto.AssignStudentsRequest;
import com.fsad.feedback.modules.courses.dto.CoursePayload;
import com.fsad.feedback.modules.courses.dto.CreateCourseRequest;
import com.fsad.feedback.modules.courses.model.Course;
import com.fsad.feedback.modules.courses.repository.CourseRepository;
import com.fsad.feedback.modules.notifications.model.NotificationType;
import com.fsad.feedback.modules.notifications.service.NotificationService;
import com.fsad.feedback.modules.users.model.Role;
import com.fsad.feedback.modules.users.model.User;
import com.fsad.feedback.modules.users.repository.UserRepository;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
public class CourseService {

    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public CourseService(CourseRepository courseRepository, UserRepository userRepository, NotificationService notificationService) {
        this.courseRepository = courseRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    public List<CoursePayload> list(AuthenticatedUser user) {
        Sort sort = Sort.by(Sort.Direction.DESC, "createdAt");
        List<Course> courses = user.role().isAdminLike()
                ? courseRepository.findByAdminId(user.id(), sort)
                : courseRepository.findByAssignedStudentId(user.id());
        return courses.stream().map(this::toPayload).toList();
    }

    public CoursePayload create(AuthenticatedUser user, CreateCourseRequest request) {
        if (!user.role().isAdminLike()) {
            throw new AppException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Forbidden");
        }

        Course course = new Course();
        course.setCode(request.code().trim());
        course.setTitle(request.title().trim());
        course.setSemester(request.semester().trim());
        course.setDepartment(request.department().trim());
        course.setAdminId(user.id());
        course.setAssignedStudentIds(List.of());
        return toPayload(courseRepository.save(course));
    }

    public CoursePayload assignStudents(AuthenticatedUser user, String courseId, AssignStudentsRequest request) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "COURSE_NOT_FOUND", "Course not found"));

        if (!course.getAdminId().equals(user.id()) || !user.role().isAdminLike()) {
            throw new AppException(HttpStatus.FORBIDDEN, "COURSE_ACCESS_DENIED", "Course access denied");
        }

        Set<String> uniqueIds = new LinkedHashSet<>();
        for (String studentId : request.studentIds()) {
            if (studentId == null || studentId.isBlank()) {
                continue;
            }
            String normalizedStudentId = studentId.trim();
            User student = userRepository.findById(normalizedStudentId)
                    .orElseThrow(() -> new AppException(HttpStatus.BAD_REQUEST, "USER_NOT_FOUND", "Student not found"));
            if (student.getRole() != Role.STUDENT) {
                throw new AppException(HttpStatus.BAD_REQUEST, "INVALID_STUDENT", "Only student users can be assigned");
            }
            uniqueIds.add(normalizedStudentId);
        }

        course.setAssignedStudentIds(List.copyOf(uniqueIds));
        Course savedCourse = courseRepository.save(course);
        notificationService.createForUsers(
                savedCourse.getAssignedStudentIds(),
                NotificationType.COURSE_ASSIGNED,
                "New course assigned",
                savedCourse.getCode() + " - " + savedCourse.getTitle() + " was assigned to you.",
                "/student/courses"
        );
        return toPayload(savedCourse);
    }

    public Course requireAccessibleCourse(String courseId, AuthenticatedUser user) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "COURSE_NOT_FOUND", "Course not found"));

        if (user.role().isAdminLike()) {
            if (!course.getAdminId().equals(user.id())) {
                throw new AppException(HttpStatus.FORBIDDEN, "COURSE_ACCESS_DENIED", "Course access denied");
            }
            return course;
        }

        if (!course.getAssignedStudentIds().contains(user.id())) {
            throw new AppException(HttpStatus.FORBIDDEN, "COURSE_ACCESS_DENIED", "Course access denied");
        }
        return course;
    }

    private CoursePayload toPayload(Course course) {
        return new CoursePayload(
                course.getId(),
                course.getCode(),
                course.getTitle(),
                course.getSemester(),
                course.getDepartment(),
                course.getAdminId(),
                course.getAssignedStudentIds(),
                course.getCreatedAt(),
                course.getUpdatedAt()
        );
    }
}

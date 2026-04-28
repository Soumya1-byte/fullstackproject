package com.fsad.feedback.modules.courses.service;

import com.fsad.feedback.common.security.AuthenticatedUser;
import com.fsad.feedback.modules.courses.model.Course;
import com.fsad.feedback.modules.courses.repository.CourseRepository;
import com.fsad.feedback.modules.users.model.Role;
import com.fsad.feedback.modules.users.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CourseServiceTest {

    @Mock
    private CourseRepository courseRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private CourseService courseService;

    @Test
    void studentListReturnsAssignedCourses() {
        AuthenticatedUser student = new AuthenticatedUser("student-1", "student@example.com", Role.STUDENT, 1);
        Course course = new Course();
        course.setId("course-1");
        course.setCode("CSE101");
        course.setTitle("Intro to CS");
        course.setSemester("Semester 1");
        course.setDepartment("CSE");
        course.setAdminId("admin-1");
        course.setAssignedStudentIds(List.of("student-1"));
        course.setCreatedAt(Instant.now());
        course.setUpdatedAt(Instant.now());

        when(courseRepository.findByAssignedStudentId("student-1")).thenReturn(List.of(course));

        var result = courseService.list(student);

        assertEquals(1, result.size());
        assertEquals("course-1", result.get(0).id());
        assertEquals(List.of("student-1"), result.get(0).assignedStudentIds());
        verify(courseRepository).findByAssignedStudentId("student-1");
    }
}

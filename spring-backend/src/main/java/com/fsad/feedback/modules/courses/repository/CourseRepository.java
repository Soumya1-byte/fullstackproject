package com.fsad.feedback.modules.courses.repository;

import com.fsad.feedback.modules.courses.model.Course;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface CourseRepository extends MongoRepository<Course, String> {

    List<Course> findByAdminId(String adminId, Sort sort);

    List<Course> findByAssignedStudentIdsContaining(String studentId, Sort sort);
}

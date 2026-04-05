package com.fsad.feedback.modules.courses.model;

import com.fsad.feedback.common.model.BaseDocument;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.ArrayList;
import java.util.List;

@Document(collection = "courses")
public class Course extends BaseDocument {

    @Id
    private String id;

    @Indexed
    private String code;

    private String title;

    @Indexed
    private String semester;

    private String department;

    @Indexed
    private String adminId;

    private List<String> assignedStudentIds = new ArrayList<>();

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getSemester() {
        return semester;
    }

    public void setSemester(String semester) {
        this.semester = semester;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public String getAdminId() {
        return adminId;
    }

    public void setAdminId(String adminId) {
        this.adminId = adminId;
    }

    public List<String> getAssignedStudentIds() {
        return assignedStudentIds;
    }

    public void setAssignedStudentIds(List<String> assignedStudentIds) {
        this.assignedStudentIds = assignedStudentIds;
    }
}

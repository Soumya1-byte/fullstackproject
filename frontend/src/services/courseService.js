import apiClient from './apiClient';

function normalizeCourse(course) {
  if (!course) return course;

  return {
    ...course,
    _id: course._id || course.id || null,
    assignedStudentIds: Array.isArray(course.assignedStudentIds)
      ? course.assignedStudentIds.map((student) => String(student?._id || student?.id || student))
      : []
  };
}

export const courseService = {
  async list() {
    const { data } = await apiClient.get('/courses');
    return Array.isArray(data.data) ? data.data.map(normalizeCourse) : [];
  },

  async create(payload) {
    const { data } = await apiClient.post('/courses', payload);
    return normalizeCourse(data.data);
  },

  async assignStudents(courseId, studentIds) {
    const { data } = await apiClient.post(`/courses/${courseId}/assign-students`, { studentIds });
    return normalizeCourse(data.data);
  }
};

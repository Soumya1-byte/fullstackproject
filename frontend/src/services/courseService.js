import apiClient from './apiClient';

export const courseService = {
  async list() {
    const { data } = await apiClient.get('/courses');
    return Array.isArray(data.data) ? data.data : [];
  },

  async create(payload) {
    const { data } = await apiClient.post('/courses', payload);
    return data.data;
  },

  async assignStudents(courseId, studentIds) {
    const { data } = await apiClient.post(`/courses/${courseId}/assign-students`, { studentIds });
    return data.data;
  }
};

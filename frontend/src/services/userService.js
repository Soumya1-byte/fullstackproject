import apiClient from './apiClient';

export const userService = {
  async listStudents() {
    const { data } = await apiClient.get('/users/students');
    return data.data;
  },

  async listAdminRequests() {
    const { data } = await apiClient.get('/users/admin-requests');
    return data.data;
  },

  async me() {
    const { data } = await apiClient.get('/users/me');
    return data.data;
  },

  async updateMe(payload) {
    const { data } = await apiClient.patch('/users/me', payload);
    return data.data;
  },

  async requestAdminAccess(payload) {
    const { data } = await apiClient.post('/users/admin-request', payload);
    return data.data;
  },

  async reviewAdminRequest(userId, payload) {
    const { data } = await apiClient.patch(`/users/admin-requests/${userId}`, payload);
    return data.data;
  }
};

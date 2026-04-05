import apiClient from './apiClient';

export const userService = {
  async listStudents() {
    const { data } = await apiClient.get('/users/students');
    return data.data;
  },

  async me() {
    const { data } = await apiClient.get('/users/me');
    return data.data;
  },

  async updateMe(payload) {
    const { data } = await apiClient.patch('/users/me', payload);
    return data.data;
  }
};

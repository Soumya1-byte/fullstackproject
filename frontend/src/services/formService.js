import apiClient from './apiClient';

export const formService = {
  async list() {
    const { data } = await apiClient.get('/forms');
    return Array.isArray(data.data) ? data.data : [];
  },
  async create(payload) {
    const { data } = await apiClient.post('/forms', payload);
    return data.data;
  },
  async publish(formId) {
    const { data } = await apiClient.post(`/forms/${formId}/publish`);
    return data.data;
  },
  async close(formId) {
    const { data } = await apiClient.post(`/forms/${formId}/close`);
    return data.data;
  },
  async getById(formId) {
    const { data } = await apiClient.get(`/forms/${formId}`);
    return data.data;
  }
};

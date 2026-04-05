import apiClient from './apiClient';

export const analyticsService = {
  async overview(params = {}) {
    const { data } = await apiClient.get('/analytics/overview', { params });
    return data.data;
  },
  async summary(formId) {
    const { data } = await apiClient.get(`/analytics/forms/${formId}/summary`);
    return data.data;
  }
};

import apiClient from './apiClient';

export const responseService = {
  async submit(formId, payload) {
    const { data } = await apiClient.post(`/responses/forms/${formId}`, payload);
    return data.data;
  },
  async myStatuses() {
    const { data } = await apiClient.get('/responses/me');
    return data.data;
  },
  async insights(formId) {
    const { data } = await apiClient.get(`/responses/forms/${formId}/insights`);
    return data.data;
  },
  async listForForm(formId) {
    const { data } = await apiClient.get(`/responses/forms/${formId}`);
    return data.data;
  }
};

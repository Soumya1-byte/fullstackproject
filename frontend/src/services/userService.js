import apiClient from './apiClient';

function normalizeAdminRequestStatus(value) {
  const normalized = String(value || '').trim().toUpperCase();
  if (normalized === 'PENDING' || normalized === 'APPROVED' || normalized === 'DENIED') {
    return normalized;
  }
  return 'NONE';
}

function normalizeUserPayload(user) {
  if (!user) return user;
  return {
    ...user,
    adminRequestStatus: normalizeAdminRequestStatus(user.adminRequestStatus)
  };
}

export const userService = {
  async listStudents() {
    const { data } = await apiClient.get('/users/students');
    return (data.data || []).map(normalizeUserPayload);
  },

  async listAdminRequests() {
    const { data } = await apiClient.get('/users/admin-requests');
    return (data.data || []).map(normalizeUserPayload);
  },

  async me() {
    const { data } = await apiClient.get('/users/me');
    return normalizeUserPayload(data.data);
  },

  async updateMe(payload) {
    const { data } = await apiClient.patch('/users/me', payload);
    return normalizeUserPayload(data.data);
  },

  async requestAdminAccess(payload) {
    const { data } = await apiClient.post('/users/admin-request', payload);
    return normalizeUserPayload(data.data);
  },

  async reviewAdminRequest(userId, payload) {
    const { data } = await apiClient.patch(`/users/admin-requests/${userId}`, payload);
    return normalizeUserPayload(data.data);
  }
};

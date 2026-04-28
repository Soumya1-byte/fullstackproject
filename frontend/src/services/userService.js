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
    _id: user._id || user.id || null,
    isPrimaryAdmin: Boolean(user.isPrimaryAdmin),
    adminRequestStatus: normalizeAdminRequestStatus(user.adminRequestStatus)
  };
}

function shouldFallbackDemote(error) {
  const status = error?.response?.status;
  return !status || status === 404 || status === 405 || status === 500;
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
  },

  async demoteAdmin(userId, payload = {}) {
    try {
      const { data } = await apiClient.patch(`/users/admins/${userId}/demote`, payload);
      return normalizeUserPayload(data.data);
    } catch (error) {
      if (!shouldFallbackDemote(error)) {
        throw error;
      }

      const fallbackResponse = await apiClient.patch(`/users/admin-requests/${userId}`, {
        decision: 'DENIED',
        note: payload.note || 'Admin access removed by primary admin'
      });

      return normalizeUserPayload(fallbackResponse.data.data);
    }
  }
};

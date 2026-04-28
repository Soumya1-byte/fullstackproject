import apiClient from './apiClient';

function normalizeNotification(item) {
  if (!item) return item;
  return {
    ...item,
    _id: item._id || item.id || null,
    actionUrl: item.actionUrl || ''
  };
}

export const notificationService = {
  async list() {
    const { data } = await apiClient.get('/notifications');
    return {
      items: Array.isArray(data.data?.items) ? data.data.items.map(normalizeNotification) : [],
      unreadCount: Number(data.data?.unreadCount || 0)
    };
  },

  async markRead(notificationId) {
    const { data } = await apiClient.patch(`/notifications/${notificationId}/read`);
    return normalizeNotification(data.data);
  },

  async markAllRead() {
    const { data } = await apiClient.patch('/notifications/read-all');
    return {
      items: Array.isArray(data.data?.items) ? data.data.items.map(normalizeNotification) : [],
      unreadCount: Number(data.data?.unreadCount || 0)
    };
  }
};

import request from '../utils/request';
import { Notification, NotificationType, NotificationStats } from '../types/notification';

export const getNotifications = (params?: {
  type?: NotificationType | 'all';
  status?: 'unread' | 'read' | 'all';
  page?: number;
  pageSize?: number;
}): Promise<{ list: Notification[]; total: number; page: number; pageSize: number }> => {
  return request.get('/notifications', { params });
};

export const getNotificationStats = (): Promise<NotificationStats> => {
  return request.get('/notifications/stats');
};

export const markAsRead = (id: string): Promise<Notification> => {
  return request.put(`/notifications/${id}/read`);
};

export const markAllAsRead = (type?: NotificationType): Promise<{ updated: number }> => {
  return request.put('/notifications/read-all', { type });
};

export const deleteNotification = (id: string): Promise<{ message: string }> => {
  return request.delete(`/notifications/${id}`);
};

export const clearAllNotifications = (type?: NotificationType): Promise<{ deleted: number }> => {
  return request.delete('/notifications/clear-all', { params: { type } });
};

export const getNotificationDetail = (id: string): Promise<Notification> => {
  return request.get(`/notifications/${id}`);
};

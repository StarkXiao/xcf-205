import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Notification, NotificationType, NotificationStats } from '../types/notification';
import {
  getNotifications,
  getNotificationStats,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
} from '../api/notification';

interface NotificationContextType {
  notifications: Notification[];
  stats: NotificationStats;
  loading: boolean;
  loadNotifications: (params?: {
    type?: NotificationType | 'all';
    status?: 'unread' | 'read' | 'all';
    page?: number;
    pageSize?: number;
  }) => Promise<void>;
  loadStats: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: (type?: NotificationType) => Promise<void>;
  removeNotification: (id: string) => Promise<void>;
  clearAll: (type?: NotificationType) => Promise<void>;
  totalUnread: number;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats>({
    total: 0,
    unread: 0,
    byType: { system: 0, todo: 0, reminder: 0, approval: 0 },
  });
  const [loading, setLoading] = useState(false);

  const loadNotifications = useCallback(async (params?: {
    type?: NotificationType | 'all';
    status?: 'unread' | 'read' | 'all';
    page?: number;
    pageSize?: number;
  }) => {
    setLoading(true);
    try {
      const result = await getNotifications(params);
      setNotifications(result.list);
    } catch (error) {
      console.error('加载通知列表失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const result = await getNotificationStats();
      setStats(result);
    } catch (error) {
      console.error('加载通知统计失败:', error);
    }
  }, []);

  const markRead = useCallback(async (id: string) => {
    try {
      await markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) =>
          n._id === id ? { ...n, status: 'read', readAt: new Date().toISOString() } : n
        )
      );
      setStats((prev) => ({
        ...prev,
        unread: Math.max(0, prev.unread - 1),
      }));
    } catch (error) {
      console.error('标记已读失败:', error);
    }
  }, []);

  const markAllRead = useCallback(async (type?: NotificationType) => {
    try {
      await markAllAsRead(type);
      setNotifications((prev) =>
        prev.map((n) =>
          (!type || n.type === type) && n.status === 'unread'
            ? { ...n, status: 'read', readAt: new Date().toISOString() }
            : n
        )
      );
      const unreadCount = notifications.filter(
        (n) => (!type || n.type === type) && n.status === 'unread'
      ).length;
      setStats((prev) => ({
        ...prev,
        unread: Math.max(0, prev.unread - unreadCount),
      }));
    } catch (error) {
      console.error('全部标记已读失败:', error);
    }
  }, [notifications]);

  const removeNotification = useCallback(async (id: string) => {
    try {
      await deleteNotification(id);
      const removed = notifications.find((n) => n._id === id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      if (removed && removed.status === 'unread') {
        setStats((prev) => ({
          ...prev,
          unread: Math.max(0, prev.unread - 1),
          total: Math.max(0, prev.total - 1),
        }));
      } else {
        setStats((prev) => ({
          ...prev,
          total: Math.max(0, prev.total - 1),
        }));
      }
    } catch (error) {
      console.error('删除通知失败:', error);
    }
  }, [notifications]);

  const clearAll = useCallback(async (type?: NotificationType) => {
    try {
      await clearAllNotifications(type);
      const removedCount = notifications.filter((n) => !type || n.type === type).length;
      const unreadRemoved = notifications.filter(
        (n) => (!type || n.type === type) && n.status === 'unread'
      ).length;
      setNotifications((prev) => prev.filter((n) => type && n.type !== type));
      setStats((prev) => ({
        ...prev,
        unread: Math.max(0, prev.unread - unreadRemoved),
        total: Math.max(0, prev.total - removedCount),
      }));
    } catch (error) {
      console.error('清空通知失败:', error);
    }
  }, [notifications]);

  useEffect(() => {
    loadStats();
    loadNotifications({ pageSize: 50 });
  }, [loadStats, loadNotifications]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        stats,
        loading,
        loadNotifications,
        loadStats,
        markRead,
        markAllRead,
        removeNotification,
        clearAll,
        totalUnread: stats.unread,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

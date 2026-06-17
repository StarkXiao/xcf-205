import request from '../utils/request';
import { Notification, NotificationType, NotificationStats } from '../types/notification';
import dayjs from 'dayjs';

const mockNotifications: Notification[] = [
  {
    _id: '1',
    type: 'system',
    title: '系统维护通知',
    content: '系统将于本周六凌晨2:00-4:00进行例行维护，届时服务将暂停，请提前做好相关安排。',
    status: 'unread',
    createdAt: dayjs().subtract(1, 'hour').toISOString(),
    priority: 'medium',
  },
  {
    _id: '2',
    type: 'todo',
    title: '新工单待处理',
    content: '您有一个新的工单【WO20240115001】需要处理，请及时查看。',
    status: 'unread',
    createdAt: dayjs().subtract(2, 'hour').toISOString(),
    relatedId: 'WO20240115001',
    relatedType: 'workorder',
    priority: 'high',
  },
  {
    _id: '3',
    type: 'todo',
    title: '巡检任务待完成',
    content: '您有今日的巡检任务【市中心区域日常巡检】尚未完成，请按时执行。',
    status: 'unread',
    createdAt: dayjs().subtract(3, 'hour').toISOString(),
    relatedId: 'task001',
    relatedType: 'inspection_task',
    priority: 'medium',
  },
  {
    _id: '4',
    type: 'reminder',
    title: '工单催办通知',
    content: '工单【WO20240110003】即将超期，请尽快处理完成。',
    status: 'unread',
    createdAt: dayjs().subtract(5, 'hour').toISOString(),
    relatedId: 'WO20240110003',
    relatedType: 'workorder',
    priority: 'high',
    sender: { _id: 'admin', realName: '系统管理员' },
  },
  {
    _id: '5',
    type: 'approval',
    title: '审批通过通知',
    content: '您提交的【2024年Q1设备采购申请】已通过审批，请查看详情。',
    status: 'read',
    createdAt: dayjs().subtract(1, 'day').toISOString(),
    readAt: dayjs().subtract(20, 'hour').toISOString(),
    relatedId: 'approval001',
    relatedType: 'approval',
    priority: 'low',
    sender: { _id: 'manager', realName: '张经理' },
  },
  {
    _id: '6',
    type: 'approval',
    title: '审批驳回通知',
    content: '您提交的【预算调整申请】被驳回，请修改后重新提交。',
    status: 'read',
    createdAt: dayjs().subtract(2, 'day').toISOString(),
    readAt: dayjs().subtract(1, 'day').toISOString(),
    relatedId: 'approval002',
    relatedType: 'approval',
    priority: 'medium',
    sender: { _id: 'manager', realName: '张经理' },
  },
  {
    _id: '7',
    type: 'system',
    title: '账号安全提醒',
    content: '检测到您的账号在新设备登录，如非本人操作请及时修改密码。',
    status: 'read',
    createdAt: dayjs().subtract(3, 'day').toISOString(),
    readAt: dayjs().subtract(2, 'day').toISOString(),
    priority: 'high',
  },
  {
    _id: '8',
    type: 'reminder',
    title: '巡检任务催办',
    content: '您负责的【工业园区巡检】任务已超期，请立即完成。',
    status: 'read',
    createdAt: dayjs().subtract(4, 'day').toISOString(),
    readAt: dayjs().subtract(3, 'day').toISOString(),
    relatedId: 'task002',
    relatedType: 'inspection_task',
    priority: 'high',
    sender: { _id: 'admin', realName: '系统管理员' },
  },
  {
    _id: '9',
    type: 'todo',
    title: '待审批事项',
    content: '有3条待审批事项等待您处理，请进入审批中心查看。',
    status: 'unread',
    createdAt: dayjs().subtract(6, 'hour').toISOString(),
    relatedType: 'approval_list',
    priority: 'medium',
  },
  {
    _id: '10',
    type: 'system',
    title: '功能更新通知',
    content: '系统已升级至v2.3.0版本，新增工单批量处理功能，欢迎体验。',
    status: 'read',
    createdAt: dayjs().subtract(5, 'day').toISOString(),
    readAt: dayjs().subtract(4, 'day').toISOString(),
    priority: 'low',
  },
];

export const getNotifications = (params?: {
  type?: NotificationType | 'all';
  status?: 'unread' | 'read' | 'all';
  page?: number;
  pageSize?: number;
}): Promise<{ list: Notification[]; total: number }> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      let filtered = [...mockNotifications];
      if (params?.type && params.type !== 'all') {
        filtered = filtered.filter((n) => n.type === params.type);
      }
      if (params?.status && params.status !== 'all') {
        filtered = filtered.filter((n) => n.status === params.status);
      }
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const page = params?.page || 1;
      const pageSize = params?.pageSize || 20;
      const start = (page - 1) * pageSize;
      const list = filtered.slice(start, start + pageSize);
      resolve({ list, total: filtered.length });
    }, 300);
  });
};

export const getNotificationStats = (): Promise<NotificationStats> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const stats: NotificationStats = {
        total: mockNotifications.length,
        unread: mockNotifications.filter((n) => n.status === 'unread').length,
        byType: {
          system: mockNotifications.filter((n) => n.type === 'system').length,
          todo: mockNotifications.filter((n) => n.type === 'todo').length,
          reminder: mockNotifications.filter((n) => n.type === 'reminder').length,
          approval: mockNotifications.filter((n) => n.type === 'approval').length,
        },
      };
      resolve(stats);
    }, 200);
  });
};

export const markAsRead = (id: string): Promise<Notification> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const notification = mockNotifications.find((n) => n._id === id);
      if (notification) {
        notification.status = 'read';
        notification.readAt = new Date().toISOString();
        resolve(notification);
      } else {
        reject(new Error('通知不存在'));
      }
    }, 200);
  });
};

export const markAllAsRead = (type?: NotificationType): Promise<boolean> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      mockNotifications.forEach((n) => {
        if ((!type || n.type === type) && n.status === 'unread') {
          n.status = 'read';
          n.readAt = new Date().toISOString();
        }
      });
      resolve(true);
    }, 300);
  });
};

export const deleteNotification = (id: string): Promise<boolean> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const index = mockNotifications.findIndex((n) => n._id === id);
      if (index > -1) {
        mockNotifications.splice(index, 1);
      }
      resolve(true);
    }, 200);
  });
};

export const clearAllNotifications = (type?: NotificationType): Promise<boolean> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      for (let i = mockNotifications.length - 1; i >= 0; i--) {
        if (!type || mockNotifications[i].type === type) {
          mockNotifications.splice(i, 1);
        }
      }
      resolve(true);
    }, 300);
  });
};

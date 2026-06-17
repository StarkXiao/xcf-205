export type NotificationType = 'system' | 'todo' | 'reminder' | 'approval';

export type NotificationStatus = 'unread' | 'read';

export interface Notification {
  _id: string;
  type: NotificationType;
  title: string;
  content: string;
  status: NotificationStatus;
  createdAt: string;
  readAt?: string;
  relatedId?: string;
  relatedType?: string;
  sender?: {
    _id: string;
    realName: string;
  };
  priority?: 'low' | 'medium' | 'high';
}

export interface NotificationStats {
  total: number;
  unread: number;
  byType: {
    system: number;
    todo: number;
    reminder: number;
    approval: number;
  };
}

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  system: '站内消息',
  todo: '待办提醒',
  reminder: '催办通知',
  approval: '审批结果',
};

export const NOTIFICATION_TYPE_COLORS: Record<NotificationType, string> = {
  system: 'blue',
  todo: 'orange',
  reminder: 'red',
  approval: 'green',
};

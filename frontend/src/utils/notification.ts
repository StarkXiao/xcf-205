import { Notification } from '../types/notification';

export const getNotificationNavigatePath = (notification: Notification): string | null => {
  const { type, relatedType, relatedId, extra } = notification;

  switch (relatedType) {
    case 'workorder':
      if (relatedId) {
        return `/workorders/${relatedId}`;
      }
      return '/workorders';

    case 'inspection_task':
      if (relatedId) {
        return `/inspection/tasks/${relatedId}/checkin`;
      }
      return '/inspection';

    case 'inspection_plan':
      if (extra?.planId) {
        return `/inspection/plans/${extra.planId}/edit`;
      }
      return '/inspection';

    case 'event':
      if (relatedId) {
        return `/events/list`;
      }
      return '/events/list';

    default:
      if (type === 'approval') {
        return '/workorders';
      }
      if (type === 'todo') {
        return '/workorders';
      }
      if (type === 'reminder') {
        return '/workorders';
      }
      return null;
  }
};

export const canNavigate = (notification: Notification): boolean => {
  return getNotificationNavigatePath(notification) !== null;
};

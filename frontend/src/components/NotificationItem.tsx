import { List, Tag, Button, Space, Typography, Popconfirm } from 'antd';
import {
  BellOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { Notification, NOTIFICATION_TYPE_LABELS, NOTIFICATION_TYPE_COLORS } from '../types/notification';
import { useNotification } from '../context/NotificationContext';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Text, Paragraph } = Typography;

interface NotificationItemProps {
  notification: Notification;
  showActions?: boolean;
  onClick?: () => void;
}

const getIcon = (type: Notification['type']) => {
  switch (type) {
    case 'system':
      return <BellOutlined style={{ color: '#1890ff', fontSize: 18 }} />;
    case 'todo':
      return <ClockCircleOutlined style={{ color: '#faad14', fontSize: 18 }} />;
    case 'reminder':
      return <ExclamationCircleOutlined style={{ color: '#f5222d', fontSize: 18 }} />;
    case 'approval':
      return <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 18 }} />;
    default:
      return <BellOutlined style={{ color: '#1890ff', fontSize: 18 }} />;
  }
};

const NotificationItem = ({ notification, showActions = true, onClick }: NotificationItemProps) => {
  const { markRead, removeNotification } = useNotification();
  const isUnread = notification.status === 'unread';

  const handleMarkRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    markRead(notification._id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeNotification(notification._id);
  };

  return (
    <List.Item
      onClick={() => {
        if (isUnread) {
          markRead(notification._id);
        }
        onClick?.();
      }}
      style={{
        cursor: 'pointer',
        padding: '12px 16px',
        background: isUnread ? 'rgba(24, 144, 255, 0.04)' : 'transparent',
        borderBottom: '1px solid #f0f0f0',
      }}
    >
      <List.Item.Meta
        avatar={
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: '#f5f5f5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            {getIcon(notification.type)}
            {isUnread && (
              <span
                style={{
                  position: 'absolute',
                  top: 2,
                  right: 2,
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: '#f5222d',
                }}
              />
            )}
          </div>
        }
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Text strong style={{ color: isUnread ? '#262626' : '#595959' }}>
              {notification.title}
            </Text>
            <Tag color={NOTIFICATION_TYPE_COLORS[notification.type]} style={{ margin: 0 }}>
              {NOTIFICATION_TYPE_LABELS[notification.type]}
            </Tag>
            {notification.priority === 'high' && (
              <Tag color="red" style={{ margin: 0 }}>
                紧急
              </Tag>
            )}
          </div>
        }
        description={
          <div>
            <Paragraph
              ellipsis={{ rows: 2, expandable: false }}
              style={{ margin: '4px 0 8px 0', color: '#666' }}
            >
              {notification.content}
            </Paragraph>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Space size="small">
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {dayjs(notification.createdAt).fromNow()}
                </Text>
                {notification.senderName && (
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    来自: {notification.senderName}
                  </Text>
                )}
              </Space>
              {showActions && (
                <Space size="small">
                  {isUnread && (
                    <Button
                      type="link"
                      size="small"
                      icon={<EyeOutlined />}
                      onClick={handleMarkRead}
                    >
                      标为已读
                    </Button>
                  )}
                  <Popconfirm
                    title="确定删除这条通知吗？"
                    onConfirm={handleDelete}
                    okText="确定"
                    cancelText="取消"
                  >
                    <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                      删除
                    </Button>
                  </Popconfirm>
                </Space>
              )}
            </div>
          </div>
        }
      />
    </List.Item>
  );
};

export default NotificationItem;

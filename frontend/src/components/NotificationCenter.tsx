import { useState, useMemo } from 'react';
import {
  Card,
  Tabs,
  List,
  Empty,
  Button,
  Space,
  Popconfirm,
  Badge,
  Row,
  Col,
  Statistic,
  Divider,
  message,
} from 'antd';
import {
  BellOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  ReadOutlined,
  DeleteOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useNotification } from '../context/NotificationContext';
import { NotificationType, NOTIFICATION_TYPE_LABELS } from '../types/notification';
import NotificationItem from './NotificationItem';
import { useNavigate } from 'react-router-dom';
import { getNotificationNavigatePath } from '../utils/notification';

const typeIcons: Record<NotificationType, React.ReactNode> = {
  system: <BellOutlined />,
  todo: <ClockCircleOutlined />,
  reminder: <ExclamationCircleOutlined />,
  approval: <CheckCircleOutlined />,
};

const NotificationCenter = () => {
  const navigate = useNavigate();
  const {
    notifications,
    stats,
    loading,
    loadNotifications,
    loadStats,
    markAllRead,
    clearAll,
    totalUnread,
  } = useNotification();

  const [activeType, setActiveType] = useState<NotificationType | 'all'>('all');
  const [activeStatus, setActiveStatus] = useState<'unread' | 'read' | 'all'>('all');

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (activeType !== 'all' && n.type !== activeType) return false;
      if (activeStatus !== 'all' && n.status !== activeStatus) return false;
      return true;
    });
  }, [notifications, activeType, activeStatus]);

  const unreadByType = useMemo(() => {
    const result: Record<NotificationType, number> = {
      system: 0,
      todo: 0,
      reminder: 0,
      approval: 0,
    };
    notifications.forEach((n) => {
      if (n.status === 'unread' && result[n.type] !== undefined) {
        result[n.type]++;
      }
    });
    return result;
  }, [notifications]);

  const handleMarkAllRead = async () => {
    const type = activeType === 'all' ? undefined : activeType;
    await markAllRead(type);
    message.success('已全部标记为已读');
  };

  const handleClearAll = async () => {
    const type = activeType === 'all' ? undefined : activeType;
    await clearAll(type);
    message.success('已清空通知');
  };

  const handleRefresh = async () => {
    await Promise.all([
      loadNotifications({ type: activeType, status: activeStatus, pageSize: 100 }),
      loadStats(),
    ]);
    message.success('刷新成功');
  };

  const handleNotificationClick = (notification: any) => {
    const path = getNotificationNavigatePath(notification);
    if (path) {
      navigate(path);
    }
  };

  const tabItems = [
    {
      key: 'all',
      label: (
        <Badge count={totalUnread} size="small" offset={[6, -2]}>
          全部通知
        </Badge>
      ),
    },
    ...(['system', 'todo', 'reminder', 'approval'] as NotificationType[]).map((type) => ({
      key: type,
      label: (
        <Badge count={unreadByType[type]} size="small" offset={[6, -2]}>
          {NOTIFICATION_TYPE_LABELS[type]}
        </Badge>
      ),
    })),
  ];

  const statsCards = (
    <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
      <Col span={6}>
        <Card size="small">
          <Statistic
            title="全部通知"
            value={stats.total}
            prefix={<BellOutlined style={{ color: '#1890ff' }} />}
          />
        </Card>
      </Col>
      <Col span={6}>
        <Card size="small">
          <Statistic
            title="未读通知"
            value={stats.unread}
            valueStyle={{ color: stats.unread > 0 ? '#f5222d' : undefined }}
            prefix={<BellOutlined />}
          />
        </Card>
      </Col>
      <Col span={6}>
        <Card size="small">
          <Statistic
            title="待办事项"
            value={stats.byType.todo}
            prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
          />
        </Card>
      </Col>
      <Col span={6}>
        <Card size="small">
          <Statistic
            title="催办通知"
            value={stats.byType.reminder}
            prefix={<ExclamationCircleOutlined style={{ color: '#f5222d' }} />}
          />
        </Card>
      </Col>
    </Row>
  );

  const actionBar = (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        padding: '0 4px',
      }}
    >
      <Space>
        <Button.Group>
          {(['all', 'unread', 'read'] as const).map((status) => (
            <Button
              key={status}
              type={activeStatus === status ? 'primary' : 'default'}
              onClick={() => setActiveStatus(status)}
            >
              {status === 'all' ? '全部' : status === 'unread' ? '未读' : '已读'}
            </Button>
          ))}
        </Button.Group>
      </Space>
      <Space>
        <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={loading}>
          刷新
        </Button>
        <Button
          icon={<ReadOutlined />}
          onClick={handleMarkAllRead}
          disabled={
            activeStatus === 'read' ||
            (activeType === 'all' ? totalUnread : unreadByType[activeType as NotificationType]) === 0
          }
        >
          全部已读
        </Button>
        <Popconfirm
          title="确定清空当前分类的所有通知吗？"
          onConfirm={handleClearAll}
          okText="确定"
          cancelText="取消"
          okButtonProps={{ danger: true }}
        >
          <Button
            icon={<DeleteOutlined />}
            danger
            disabled={filteredNotifications.length === 0}
          >
            清空通知
          </Button>
        </Popconfirm>
      </Space>
    </div>
  );

  return (
    <div style={{ padding: 24 }}>
      {statsCards}

      <Card
        title={
          <Space>
            <BellOutlined />
            <span>通知中心</span>
          </Space>
        }
        variant="outlined"
      >
        <Tabs
          activeKey={activeType}
          onChange={(key) => setActiveType(key as NotificationType | 'all')}
          items={tabItems}
          style={{ marginBottom: 8 }}
        />

        <Divider style={{ margin: '8px 0 16px 0' }} />

        {actionBar}

        <List
          loading={loading}
          dataSource={filteredNotifications}
          locale={{
            emptyText: (
              <Empty
                description={
                  activeStatus === 'unread'
                    ? '暂无未读通知'
                    : activeStatus === 'read'
                    ? '暂无已读通知'
                    : '暂无通知'
                }
              />
            ),
          }}
          renderItem={(item) => (
            <NotificationItem
              key={item._id}
              notification={item}
              onClick={() => handleNotificationClick(item)}
            />
          )}
        />
      </Card>
    </div>
  );
};

export default NotificationCenter;

import { useState } from 'react';
import { Badge, Dropdown, List, Button, Typography, Divider, Empty, Spin, Space } from 'antd';
import { BellOutlined, ReadOutlined, RightOutlined } from '@ant-design/icons';
import { useNotification } from '../context/NotificationContext';
import NotificationItem from './NotificationItem';
import { useNavigate } from 'react-router-dom';
import { getNotificationNavigatePath } from '../utils/notification';

const { Text, Title } = Typography;

const NotificationBell = () => {
  const navigate = useNavigate();
  const { notifications, loading, totalUnread, markAllRead, loadStats, markRead } = useNotification();
  const [open, setOpen] = useState(false);

  const recentNotifications = notifications
    .filter((n) => n.status === 'unread')
    .slice(0, 5);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      loadStats();
    }
  };

  const handleMarkAllRead = async () => {
    await markAllRead();
  };

  const handleGoToCenter = () => {
    setOpen(false);
    navigate('/notifications');
  };

  const handleNotificationClick = (notification: any) => {
    setOpen(false);
    const path = getNotificationNavigatePath(notification);
    if (path) {
      navigate(path);
    }
  };

  const dropdownContent = (
    <div
      style={{
        width: 400,
        maxHeight: 500,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          padding: '12px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #f0f0f0',
        }}
      >
        <Title level={5} style={{ margin: 0 }}>
          通知消息
          {totalUnread > 0 && (
            <Badge
              count={totalUnread}
              style={{ marginLeft: 8, backgroundColor: '#f5222d' }}
            />
          )}
        </Title>
        <Button
          type="link"
          size="small"
          icon={<ReadOutlined />}
          onClick={handleMarkAllRead}
          disabled={totalUnread === 0}
        >
          全部已读
        </Button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', minHeight: 200 }}>
        <Spin spinning={loading}>
          {recentNotifications.length === 0 ? (
            <div style={{ padding: '40px 0' }}>
              <Empty description="暂无新通知" />
            </div>
          ) : (
            <List
              dataSource={recentNotifications}
              renderItem={(item) => (
                <NotificationItem
                  key={item._id}
                  notification={item}
                  showActions={false}
                  onClick={() => handleNotificationClick(item)}
                />
              )}
            />
          )}
        </Spin>
      </div>

      <Divider style={{ margin: 0 }} />

      <div
        onClick={handleGoToCenter}
        style={{
          padding: '12px 16px',
          textAlign: 'center',
          cursor: 'pointer',
          color: '#1890ff',
          transition: 'background-color 0.2s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
      >
        <Space>
          <Text style={{ color: '#1890ff' }}>查看全部通知</Text>
          <RightOutlined style={{ fontSize: 12, color: '#1890ff' }} />
        </Space>
      </div>
    </div>
  );

  return (
    <Dropdown
      open={open}
      onOpenChange={handleOpenChange}
      dropdownRender={() => dropdownContent}
      trigger={['click']}
      placement="bottomRight"
    >
      <div
        style={{
          cursor: 'pointer',
          padding: '0 12px',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          transition: 'background-color 0.2s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
      >
        <Badge count={totalUnread} size="small" offset={[2, -2]}>
          <BellOutlined style={{ fontSize: 18, color: '#595959' }} />
        </Badge>
      </div>
    </Dropdown>
  );
};

export default NotificationBell;

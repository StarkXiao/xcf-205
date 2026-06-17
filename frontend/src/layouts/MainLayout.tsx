import { Layout, Menu, Avatar, Dropdown, Space } from 'antd';
import {
  DashboardOutlined,
  FormOutlined,
  UnorderedListOutlined,
  EnvironmentOutlined,
  FileTextOutlined,
  TeamOutlined,
  SafetyOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  BellOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import NotificationBell from '../components/NotificationBell';

const { Header, Sider, Content } = Layout;

const MainLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '统计看板',
    },
    {
      key: '/notifications',
      icon: <BellOutlined />,
      label: '通知中心',
    },
    {
      key: 'events',
      icon: <FormOutlined />,
      label: '事件管理',
      children: [
        { key: '/events/report', icon: <FormOutlined />, label: '事件上报' },
        { key: '/events/list', icon: <UnorderedListOutlined />, label: '事件列表' },
        { key: '/events/map', icon: <EnvironmentOutlined />, label: '地图分布' },
      ],
    },
    {
      key: '/workorders',
      icon: <FileTextOutlined />,
      label: '工单流转',
    },
    {
      key: 'inspection',
      icon: <CheckCircleOutlined />,
      label: '巡检管理',
      children: [
        { key: '/inspection', icon: <UnorderedListOutlined />, label: '巡检列表' },
      ],
    },
    {
      key: 'system',
      icon: <SettingOutlined />,
      label: '系统管理',
      children: [
        { key: '/system/users', icon: <TeamOutlined />, label: '用户管理' },
        { key: '/system/roles', icon: <SafetyOutlined />, label: '角色管理' },
      ],
    },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const userMenuItems = [
    {
      key: '1',
      icon: <UserOutlined />,
      label: '个人中心',
    },
    {
      key: '2',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  const getSelectedKeys = () => {
    const path = location.pathname;
    if (path.startsWith('/events')) {
      return [path, 'events'];
    }
    if (path.startsWith('/inspection')) {
      return ['/inspection', 'inspection'];
    }
    if (path.startsWith('/system')) {
      return [path, 'system'];
    }
    return [path];
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="dark"
        width={220}
      >
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: collapsed ? 14 : 18,
          fontWeight: 'bold',
          background: '#002140',
        }}>
          {collapsed ? '智慧城市' : '智慧城市管理系统'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={getSelectedKeys()}
          defaultOpenKeys={['events', 'inspection', 'system']}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header style={{
          background: 'white',
          padding: '0 24px',
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          boxShadow: '0 1px 4px rgba(0,21,41,0.08)',
        }}>
          <NotificationBell />
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Space style={{ cursor: 'pointer', marginLeft: 8 }}>
              <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />
              <span style={{ color: '#333' }}>{user.realName || '用户'}</span>
            </Space>
          </Dropdown>
        </Header>
        <Content className="layout-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;

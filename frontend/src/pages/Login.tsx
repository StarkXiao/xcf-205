import { Form, Input, Button, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { login } from '../api/auth';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login: setAuthLogin } = useAuth();
  const [form] = Form.useForm();

  const handleLogin = async (values: any) => {
    try {
      const result: any = await login(values.username, values.password);
      setAuthLogin(result.token, result.user);
      message.success('登录成功');
      navigate('/dashboard', { replace: true });
    } catch (error: any) {
      message.error(error.response?.data?.message || '登录失败');
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-title">智慧城市事件管理系统</div>
        <Form
          form={form}
          onFinish={handleLogin}
          initialValues={{ username: 'admin', password: '123456' }}
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              登录
            </Button>
          </Form.Item>
          <div style={{ textAlign: 'center', color: '#999', fontSize: 12 }}>
            默认账号：admin / 123456
          </div>
        </Form>
      </div>
    </div>
  );
};

export default Login;

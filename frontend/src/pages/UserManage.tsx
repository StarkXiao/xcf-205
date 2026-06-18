import { useState, useEffect } from 'react';
import { Table, Button, Tag, Select, Input, Space, Card, Modal, Form, Switch, message } from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { getUsers, createUser, updateUser, deleteUser } from '../api/user';
import { getRoles } from '../api/role';
import { getDictionariesByType } from '../api/dictionary';
import dayjs from 'dayjs';

const { Option } = Select;

const UserManage = () => {
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [filters, setFilters] = useState<any>({});
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit'>('create');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [roles, setRoles] = useState<any[]>([]);
  const [departmentOptions, setDepartmentOptions] = useState<any[]>([]);
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
    loadRoles();
    loadDepartments();
  }, [pagination.current, pagination.pageSize, filters]);

  const loadData = async () => {
    setLoading(true);
    try {
      const result: any = await getUsers({
        page: pagination.current,
        pageSize: pagination.pageSize,
        ...filters,
      });
      setData(result.list);
      setTotal(result.total);
    } catch (error) {
      console.error('加载用户列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      const data: any = await getRoles();
      setRoles(data);
    } catch (error) {
      console.error('加载角色列表失败:', error);
    }
  };

  const loadDepartments = async () => {
    try {
      const data: any = await getDictionariesByType('department');
      setDepartmentOptions(data);
    } catch (error) {
      console.error('加载部门列表失败:', error);
    }
  };

  const getDepartmentName = (code: string) => {
    const dept = departmentOptions.find((d: any) => d.code === code);
    return dept ? dept.name : code;
  };

  const handleCreate = () => {
    setModalType('create');
    setCurrentUser(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: any) => {
    setModalType('edit');
    setCurrentUser(record);
    form.setFieldsValue({
      ...record,
      roleId: record.roleId?._id,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteUser(id);
      message.success('删除成功');
      loadData();
    } catch (error: any) {
      message.error(error.response?.data?.message || '删除失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      if (modalType === 'create') {
        await createUser(values);
        message.success('创建成功');
      } else {
        await updateUser(currentUser._id, values);
        message.success('更新成功');
      }
      
      setModalVisible(false);
      loadData();
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败');
    }
  };

  const handleToggleStatus = async (record: any, checked: boolean) => {
    try {
      await updateUser(record._id, { isActive: checked });
      message.success('状态更新成功');
      loadData();
    } catch (error: any) {
      message.error(error.response?.data?.message || '状态更新失败');
    }
  };

  const columns = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      width: 120,
    },
    {
      title: '真实姓名',
      dataIndex: 'realName',
      key: 'realName',
      width: 120,
    },
    {
      title: '角色',
      dataIndex: 'roleId',
      key: 'roleId',
      width: 120,
      render: (role: any) => role?.name || '-',
    },
    {
      title: '部门',
      dataIndex: 'department',
      key: 'department',
      width: 150,
      render: (dept: string) => dept ? getDepartmentName(dept) : '-',
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
      width: 130,
      render: (phone: string) => phone || '-',
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (isActive: boolean, record: any) => (
        <Switch
          checked={isActive}
          onChange={(checked) => handleToggleStatus(record, checked)}
          size="small"
        />
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record._id)}>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title">用户管理</div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          新增用户
        </Button>
      </div>

      <div className="filter-bar">
        <Space>
          <Input
            placeholder="搜索用户名/姓名/电话"
            style={{ width: 220 }}
            allowClear
            onChange={(e) => setFilters(f => ({ ...f, keyword: e.target.value }))}
            onPressEnter={() => { setPagination(p => ({ ...p, current: 1 })); loadData(); }}
            suffix={<SearchOutlined />}
          />
          <Select
            placeholder="角色"
            style={{ width: 140 }}
            allowClear
            onChange={(value) => setFilters(f => ({ ...f, roleId: value }))}
          >
            {roles.map(role => (
              <Option key={role._id} value={role._id}>{role.name}</Option>
            ))}
          </Select>
          <Button type="primary" onClick={() => { setPagination(p => ({ ...p, current: 1 })); loadData(); }} icon={<SearchOutlined />}>
            查询
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="_id"
        loading={loading}
        pagination={{
          ...pagination,
          total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条`,
          onChange: (page, pageSize) => setPagination({ current: page, pageSize }),
        }}
      />

      <Modal
        title={modalType === 'create' ? '新增用户' : '编辑用户'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="用户名"
            name="username"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 3, max: 20, message: '用户名长度3-20位' },
            ]}
          >
            <Input placeholder="请输入用户名" disabled={modalType === 'edit'} />
          </Form.Item>
          <Form.Item
            label="密码"
            name="password"
            rules={modalType === 'create' ? [{ required: true, message: '请输入密码' }] : []}
          >
            <Input.Password placeholder={modalType === 'create' ? '请输入密码' : '不修改请留空'} />
          </Form.Item>
          <Form.Item
            label="真实姓名"
            name="realName"
            rules={[{ required: true, message: '请输入真实姓名' }]}
          >
            <Input placeholder="请输入真实姓名" />
          </Form.Item>
          <Form.Item
            label="角色"
            name="roleId"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select placeholder="请选择角色">
              {roles.map(role => (
                <Option key={role._id} value={role._id}>{role.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="部门" name="department">
            <Select placeholder="请选择部门" allowClear>
              {departmentOptions.map(dept => (
                <Option key={dept.code} value={dept.code}>
                  {dept.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="手机号" name="phone">
            <Input placeholder="请输入手机号" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserManage;

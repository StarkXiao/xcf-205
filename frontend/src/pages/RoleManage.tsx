import { useState, useEffect } from 'react';
import { Table, Button, Tag, Input, Space, Card, Modal, Form, Switch, message, Select } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { getRoles, createRole, updateRole, deleteRole } from '../api/role';
import dayjs from 'dayjs';

const { Option } = Select;

const RoleManage = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit'>('create');
  const [currentRole, setCurrentRole] = useState<any>(null);
  const [form] = Form.useForm();

  const allPermissions = [
    { code: 'event:view', name: '查看事件' },
    { code: 'event:create', name: '创建事件' },
    { code: 'event:update', name: '编辑事件' },
    { code: 'event:delete', name: '删除事件' },
    { code: 'workorder:view', name: '查看工单' },
    { code: 'workorder:create', name: '创建工单' },
    { code: 'workorder:assign', name: '分派工单' },
    { code: 'workorder:process', name: '处理工单' },
    { code: 'workorder:complete', name: '完成工单' },
    { code: 'workorder:verify', name: '核查工单' },
    { code: 'user:view', name: '查看用户' },
    { code: 'user:create', name: '创建用户' },
    { code: 'user:update', name: '编辑用户' },
    { code: 'user:delete', name: '删除用户' },
    { code: 'role:view', name: '查看角色' },
    { code: 'role:create', name: '创建角色' },
    { code: 'role:update', name: '编辑角色' },
    { code: 'role:delete', name: '删除角色' },
    { code: 'statistics:view', name: '查看统计' },
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data: any = await getRoles();
      setData(data);
    } catch (error) {
      console.error('加载角色列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setModalType('create');
    setCurrentRole(null);
    form.resetFields();
    form.setFieldsValue({ isActive: true, permissions: [] });
    setModalVisible(true);
  };

  const handleEdit = (record: any) => {
    setModalType('edit');
    setCurrentRole(record);
    form.setFieldsValue({
      ...record,
      permissions: record.permissions || [],
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteRole(id);
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
        await createRole(values);
        message.success('创建成功');
      } else {
        await updateRole(currentRole._id, values);
        message.success('更新成功');
      }
      
      setModalVisible(false);
      loadData();
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败');
    }
  };

  const getPermissionNames = (codes: string[]) => {
    if (!codes || codes.length === 0) return '-';
    if (codes.includes('*')) return '全部权限';
    return codes
      .map(code => allPermissions.find(p => p.code === code)?.name || code)
      .slice(0, 3)
      .join('、') + (codes.length > 3 ? ` 等${codes.length}项` : '');
  };

  const columns = [
    {
      title: '角色名称',
      dataIndex: 'name',
      key: 'name',
      width: 150,
    },
    {
      title: '角色编码',
      dataIndex: 'code',
      key: 'code',
      width: 150,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '权限',
      dataIndex: 'permissions',
      key: 'permissions',
      width: 250,
      render: (permissions: string[]) => getPermissionNames(permissions),
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'default'}>
          {isActive ? '启用' : '禁用'}
        </Tag>
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
        <div className="page-title">角色管理</div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          新增角色
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="_id"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条`,
        }}
      />

      <Modal
        title={modalType === 'create' ? '新增角色' : '编辑角色'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
        width={700}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="角色名称"
            name="name"
            rules={[{ required: true, message: '请输入角色名称' }]}
          >
            <Input placeholder="请输入角色名称" />
          </Form.Item>
          <Form.Item
            label="角色编码"
            name="code"
            rules={[
              { required: true, message: '请输入角色编码' },
              { pattern: /^[a-z]+$/, message: '只能包含小写字母' },
            ]}
          >
            <Input placeholder="请输入角色编码（英文）" disabled={modalType === 'edit'} />
          </Form.Item>
          <Form.Item label="描述" name="description">
            <Input.TextArea rows={2} placeholder="请输入角色描述" />
          </Form.Item>
          <Form.Item
            label="权限分配"
            name="permissions"
            rules={[{ required: true, message: '请选择权限' }]}
          >
            <Select
              mode="multiple"
              placeholder="请选择权限"
              optionFilterProp="children"
              style={{ width: '100%' }}
            >
              <Option value="*">全部权限</Option>
              {allPermissions.map(perm => (
                <Option key={perm.code} value={perm.code}>{perm.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="启用状态" name="isActive" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default RoleManage;

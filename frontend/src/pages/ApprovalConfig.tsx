import { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Space,
  Form,
  Input,
  Select,
  Table,
  Popconfirm,
  message,
  Switch,
  Modal,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  SaveOutlined,
  UpOutlined,
  DownOutlined,
} from '@ant-design/icons';
import {
  getApprovalFlows,
  createApprovalFlow,
  updateApprovalFlow,
  deleteApprovalFlow,
} from '../api/approval';
import { getUsers } from '../api/user';
import { getRoles } from '../api/role';

const { Option } = Select;

const flowTypes = [
  { value: 'extension', label: '延期申请' },
  { value: 'reassign', label: '改派申请' },
  { value: 'close_reject', label: '关闭驳回' },
];

const nodeTypes = [
  { value: 'submit', label: '提交节点' },
  { value: 'approve', label: '审批节点' },
  { value: 'end', label: '结束节点' },
];

const approverTypes = [
  { value: 'role', label: '按角色' },
  { value: 'department_head', label: '部门负责人' },
  { value: 'specific', label: '指定人员' },
];

const ApprovalConfig = () => {
  const [flows, setFlows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingFlow, setEditingFlow] = useState<any>(null);
  const [form] = Form.useForm();
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [nodes, setNodes] = useState<any[]>([]);

  useEffect(() => {
    loadFlows();
    loadUsers();
    loadRoles();
  }, []);

  const loadFlows = async () => {
    setLoading(true);
    try {
      const data: any = await getApprovalFlows();
      setFlows(data);
    } catch (error) {
      console.error('加载审批流列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const data: any = await getUsers({ pageSize: 1000 });
      setUsers(data.list || data || []);
    } catch (error) {
      console.error('加载用户列表失败:', error);
    }
  };

  const loadRoles = async () => {
    try {
      const data: any = await getRoles();
      setRoles(data || []);
    } catch (error) {
      console.error('加载角色列表失败:', error);
    }
  };

  const handleEdit = (flow: any) => {
    setEditingFlow(flow);
    form.setFieldsValue({
      name: flow.name,
      type: flow.type,
      description: flow.description,
      isActive: flow.isActive,
    });
    setNodes(flow.nodes || []);
  };

  const handleNew = () => {
    setEditingFlow({ isNew: true });
    form.resetFields();
    form.setFieldsValue({ isActive: true });
    setNodes([
      { name: '提交申请', type: 'submit', approverType: 'specific', approverIds: [], order: 0 },
      { name: '审批', type: 'approve', approverType: 'specific', approverIds: [], order: 1 },
      { name: '结束', type: 'end', approverType: undefined, approverIds: [], order: 2 },
    ]);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const data = {
        ...values,
        nodes: nodes.map((n, index) => ({
          name: n.name,
          type: n.type,
          order: index,
          approverType: n.approverType,
          approverIds: n.approverIds || [],
          roleCode: n.roleCode,
        })),
      };

      if (editingFlow?.isNew) {
        await createApprovalFlow(data);
        message.success('创建审批流成功');
      } else {
        await updateApprovalFlow(editingFlow._id, data);
        message.success('更新审批流成功');
      }

      setEditingFlow(null);
      loadFlows();
    } catch (error: any) {
      message.error(error.response?.data?.message || '保存失败');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteApprovalFlow(id);
      message.success('删除成功');
      loadFlows();
    } catch (error: any) {
      message.error(error.response?.data?.message || '删除失败');
    }
  };

  const handleAddNode = () => {
    const newNode = {
      name: `审批节点${nodes.length}`,
      type: 'approve',
      approverType: 'specific',
      approverIds: [],
      order: nodes.length,
    };
    const newNodes = [...nodes];
    newNodes.splice(newNodes.length - 1, 0, newNode);
    setNodes(newNodes);
  };

  const handleRemoveNode = (index: number) => {
    const newNodes = nodes.filter((_, i) => i !== index);
    setNodes(newNodes);
  };

  const handleMoveNode = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index <= 1) return;
    if (direction === 'down' && index >= nodes.length - 2) return;

    const newNodes = [...nodes];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (newNodes[targetIndex].type === 'submit' || newNodes[targetIndex].type === 'end') return;

    const temp = newNodes[index];
    newNodes[index] = newNodes[targetIndex];
    newNodes[targetIndex] = temp;
    setNodes(newNodes);
  };

  const handleNodeChange = (index: number, field: string, value: any) => {
    const newNodes = [...nodes];
    newNodes[index] = { ...newNodes[index], [field]: value };
    if (field === 'approverIds') {
      newNodes[index].approverIds = value;
    }
    setNodes(newNodes);
  };

  const flowColumns = [
    {
      title: '流程名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '流程类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => flowTypes.find(t => t.value === type)?.label || type,
    },
    {
      title: '节点数',
      key: 'nodeCount',
      render: (_: any, record: any) => record.nodes?.length || 0,
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <span style={{ color: isActive ? '#52c41a' : '#999' }}>
          {isActive ? '已启用' : '已禁用'}
        </span>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除该审批流？"
            onConfirm={() => handleDelete(record._id)}
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (editingFlow) {
    return (
      <div>
        <Card
          title={editingFlow.isNew ? '新建审批流' : '编辑审批流'}
          extra={
            <Space>
              <Button onClick={() => setEditingFlow(null)}>返回</Button>
              <Button type="primary" icon={<SaveOutlined />} onClick={handleSave}>
                保存
              </Button>
            </Space>
          }
        >
          <Form form={form} layout="vertical" style={{ maxWidth: 600 }}>
            <Form.Item
              label="流程名称"
              name="name"
              rules={[{ required: true, message: '请输入流程名称' }]}
            >
              <Input placeholder="请输入流程名称" />
            </Form.Item>

            <Form.Item
              label="流程类型"
              name="type"
              rules={[{ required: true, message: '请选择流程类型' }]}
            >
              <Select placeholder="请选择流程类型" disabled={!editingFlow.isNew}>
                {flowTypes.map(t => (
                  <Option key={t.value} value={t.value}>{t.label}</Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item label="描述" name="description">
              <Input.TextArea rows={2} placeholder="请输入描述" />
            </Form.Item>

            <Form.Item label="启用状态" name="isActive" valuePropName="checked">
              <Switch checkedChildren="启用" unCheckedChildren="禁用" />
            </Form.Item>
          </Form>
        </Card>

        <Card
          title="节点配置"
          style={{ marginTop: 16 }}
          extra={
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              onClick={handleAddNode}
            >
              添加审批节点
            </Button>
          }
        >
          {nodes.map((node, index) => (
            <Card
              key={index}
              size="small"
              style={{ marginBottom: 12, borderLeft: `3px solid ${node.type === 'submit' ? '#1890ff' : node.type === 'approve' ? '#faad14' : '#52c41a'}` }}
              extra={
                <Space size={4}>
                  {node.type === 'approve' && (
                    <>
                      <Button
                        type="text"
                        size="small"
                        icon={<UpOutlined />}
                        disabled={index <= 1}
                        onClick={() => handleMoveNode(index, 'up')}
                      />
                      <Button
                        type="text"
                        size="small"
                        icon={<DownOutlined />}
                        disabled={index >= nodes.length - 2}
                        onClick={() => handleMoveNode(index, 'down')}
                      />
                      {nodes.length > 3 && (
                        <Button
                          type="text"
                          danger
                          size="small"
                          icon={<DeleteOutlined />}
                          onClick={() => handleRemoveNode(index)}
                        />
                      )}
                    </>
                  )}
                </Space>
              }
            >
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <Space wrap>
                  <span style={{ fontWeight: 500 }}>节点 {index + 1}</span>
                  <Input
                    value={node.name}
                    onChange={(e) => handleNodeChange(index, 'name', e.target.value)}
                    placeholder="节点名称"
                    style={{ width: 160 }}
                  />
                  <Select
                    value={node.type}
                    onChange={(val) => handleNodeChange(index, 'type', val)}
                    style={{ width: 120 }}
                  >
                    {nodeTypes.map(t => (
                      <Option key={t.value} value={t.value}>{t.label}</Option>
                    ))}
                  </Select>
                </Space>

                {node.type === 'approve' && (
                  <Space wrap direction="vertical" style={{ width: '100%' }}>
                    <Space wrap>
                      <span style={{ color: '#666', minWidth: 80 }}>审批方式:</span>
                      <Select
                        value={node.approverType}
                        onChange={(val) => handleNodeChange(index, 'approverType', val)}
                        style={{ width: 140 }}
                        placeholder="选择审批方式"
                      >
                        {approverTypes.map(t => (
                          <Option key={t.value} value={t.value}>{t.label}</Option>
                        ))}
                      </Select>
                    </Space>

                    {node.approverType === 'specific' && (
                      <Space wrap>
                        <span style={{ color: '#666', minWidth: 80 }}>指定人员:</span>
                        <Select
                          mode="multiple"
                          value={node.approverIds || []}
                          onChange={(val) => handleNodeChange(index, 'approverIds', val)}
                          style={{ minWidth: 300 }}
                          placeholder="选择审批人员"
                        >
                          {users.map((u: any) => (
                            <Option key={u._id} value={u._id}>
                              {u.realName} - {u.department || '无部门'}
                            </Option>
                          ))}
                        </Select>
                      </Space>
                    )}

                    {node.approverType === 'role' && (
                      <Space wrap>
                        <span style={{ color: '#666', minWidth: 80 }}>选择角色:</span>
                        <Select
                          value={node.roleCode}
                          onChange={(val) => handleNodeChange(index, 'roleCode', val)}
                          style={{ width: 200 }}
                          placeholder="选择审批角色"
                        >
                          {roles.map((r: any) => (
                            <Option key={r.code} value={r.code}>
                              {r.name}
                            </Option>
                          ))}
                        </Select>
                        <span style={{ fontSize: 12, color: '#999' }}>
                          （系统会自动查找该角色下的活跃用户进行审批）
                        </span>
                      </Space>
                    )}

                    {node.approverType === 'department_head' && (
                      <div style={{ fontSize: 12, color: '#666', paddingLeft: 8 }}>
                        <span style={{ color: '#faad14' }}>💡</span> 部门负责人模式：将根据申请人所在部门自动查找该部门的负责人（角色编码为 dept_head）进行审批，若未找到则降级为管理员审批。
                      </div>
                    )}
                  </Space>
                )}
              </Space>
            </Card>
          ))}
        </Card>
      </div>
    );
  }

  return (
    <div>
      <Card
        title="审批流配置"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleNew}>
            新建审批流
          </Button>
        }
      >
        <Table
          columns={flowColumns}
          dataSource={flows}
          rowKey="_id"
          loading={loading}
          pagination={false}
        />
      </Card>
    </div>
  );
};

export default ApprovalConfig;

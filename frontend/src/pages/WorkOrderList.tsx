import { useState, useEffect } from 'react';
import { Table, Button, Tag, Select, Input, Space, Card, Modal, Form, message } from 'antd';
import { SearchOutlined, PlusOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getWorkOrders, createWorkOrder, assignWorkOrder } from '../api/workorder';
import { getUsersByRole } from '../api/user';
import { getEvents } from '../api/event';
import { getDictionariesByType } from '../api/dictionary';
import { useAuth } from '../context/AuthContext';
import dayjs from 'dayjs';

const { Option } = Select;

const WorkOrderList = () => {
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [filters, setFilters] = useState<any>({});
  const [createModal, setCreateModal] = useState(false);
  const [assignModal, setAssignModal] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [handlers, setHandlers] = useState<any[]>([]);
  const [priorityOptions, setPriorityOptions] = useState<any[]>([]);
  const [departmentOptions, setDepartmentOptions] = useState<any[]>([]);
  const [form] = Form.useForm();
  const [assignForm] = Form.useForm();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    loadData();
    loadEvents();
    loadHandlers();
    loadDictionaries();
  }, [pagination.current, pagination.pageSize, filters]);

  const loadDictionaries = async () => {
    try {
      const [priorities, departments] = await Promise.all([
        getDictionariesByType('event_priority'),
        getDictionariesByType('department'),
      ]);
      setPriorityOptions(priorities as any[]);
      setDepartmentOptions(departments as any[]);
    } catch (error) {
      console.error('加载字典数据失败:', error);
    }
  };

  const getPriorityTag = (priority: string) => {
    const item = priorityOptions.find(p => p.code === priority);
    if (item) {
      return <Tag color={item.color || 'default'}>{item.name}</Tag>;
    }
    return <Tag color="default">{priority}</Tag>;
  };

  const getDepartmentName = (code: string) => {
    const item = departmentOptions.find(d => d.code === code);
    return item ? item.name : code;
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const result: any = await getWorkOrders({
        page: pagination.current,
        pageSize: pagination.pageSize,
        ...filters,
      });
      setData(result.list);
      setTotal(result.total);
    } catch (error) {
      console.error('加载工单列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEvents = async () => {
    try {
      const result: any = await getEvents({ pageSize: 100, status: 'pending' });
      setEvents(result.list);
    } catch (error) {
      console.error('加载事件列表失败:', error);
    }
  };

  const loadHandlers = async () => {
    try {
      const data: any = await getUsersByRole('handler');
      setHandlers(data);
    } catch (error) {
      console.error('加载处理人员失败:', error);
    }
  };

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      pending: { color: 'orange', text: '待分派' },
      assigned: { color: 'blue', text: '已分派' },
      processing: { color: 'cyan', text: '处理中' },
      completed: { color: 'green', text: '已完成' },
      verified: { color: 'purple', text: '已核查' },
      closed: { color: 'default', text: '已关闭' },
    };
    const info = statusMap[status] || { color: 'default', text: status };
    return <Tag color={info.color}>{info.text}</Tag>;
  };

  const handleViewDetail = (record: any) => {
    navigate(`/workorders/${record._id}`);
  };

  const handleCreate = () => {
    form.resetFields();
    setCreateModal(true);
  };

  const handleCreateSubmit = async () => {
    try {
      const values = await form.validateFields();
      await createWorkOrder({
        ...values,
        assignerId: user._id,
        assignerName: user.realName,
      });
      message.success('工单创建成功');
      setCreateModal(false);
      loadData();
    } catch (error: any) {
      message.error(error.response?.data?.message || '创建失败');
    }
  };

  const handleAssign = (record: any) => {
    setCurrentOrder(record);
    assignForm.resetFields();
    setAssignModal(true);
  };

  const handleAssignSubmit = async () => {
    try {
      const values = await assignForm.validateFields();
      const handler = handlers.find(h => h._id === values.handlerId);
      await assignWorkOrder(currentOrder._id, {
        handlerId: values.handlerId,
        handlerName: handler?.realName,
        department: handler?.department,
        assignerId: user._id,
        assignerName: user.realName,
      });
      message.success('派单成功');
      setAssignModal(false);
      loadData();
    } catch (error: any) {
      message.error(error.response?.data?.message || '派单失败');
    }
  };

  const columns = [
    {
      title: '工单编号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 160,
    },
    {
      title: '工单标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
      render: (priority: string) => getPriorityTag(priority),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => getStatusTag(status),
    },
    {
      title: '处理人',
      dataIndex: 'handlerName',
      key: 'handlerName',
      width: 100,
      render: (name: string) => name || '-',
    },
    {
      title: '部门',
      dataIndex: 'department',
      key: 'department',
      width: 120,
      render: (dept: string) => dept ? getDepartmentName(dept) : '-',
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
      width: 180,
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            详情
          </Button>
          {record.status === 'pending' && (
            <Button type="link" size="small" onClick={() => handleAssign(record)}>
              派单
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title">工单流转</div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          创建工单
        </Button>
      </div>

      <div className="filter-bar">
        <Space>
          <Input
            placeholder="搜索工单编号/标题"
            style={{ width: 220 }}
            allowClear
            onChange={(e) => setFilters(f => ({ ...f, keyword: e.target.value }))}
            onPressEnter={() => { setPagination(p => ({ ...p, current: 1 })); loadData(); }}
            suffix={<SearchOutlined />}
          />
          <Select
            placeholder="状态"
            style={{ width: 120 }}
            allowClear
            onChange={(value) => setFilters(f => ({ ...f, status: value }))}
          >
            <Option value="pending">待分派</Option>
            <Option value="assigned">已分派</Option>
            <Option value="processing">处理中</Option>
            <Option value="completed">已完成</Option>
            <Option value="verified">已核查</Option>
            <Option value="closed">已关闭</Option>
          </Select>
          <Select
            placeholder="优先级"
            style={{ width: 100 }}
            allowClear
            onChange={(value) => setFilters(f => ({ ...f, priority: value }))}
          >
            {priorityOptions.map(item => (
              <Option key={item.code} value={item.code}>{item.name}</Option>
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
        title="创建工单"
        open={createModal}
        onCancel={() => setCreateModal(false)}
        onOk={handleCreateSubmit}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="关联事件"
            name="eventId"
            rules={[{ required: true, message: '请选择关联事件' }]}
          >
            <Select placeholder="请选择要关联的事件">
              {events.map(event => (
                <Option key={event._id} value={event._id}>{event.title}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            label="工单标题"
            name="title"
            rules={[{ required: true, message: '请输入工单标题' }]}
          >
            <Input placeholder="请输入工单标题" />
          </Form.Item>
          <Form.Item
            label="描述"
            name="description"
          >
            <Input.TextArea rows={3} placeholder="请输入工单描述" />
          </Form.Item>
          <Form.Item
            label="优先级"
            name="priority"
            rules={[{ required: true, message: '请选择优先级' }]}
          >
            <Select placeholder="请选择优先级">
              {priorityOptions.map(item => (
                <Option key={item.code} value={item.code}>{item.name}</Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="派单"
        open={assignModal}
        onCancel={() => setAssignModal(false)}
        onOk={handleAssignSubmit}
      >
        <Form form={assignForm} layout="vertical">
          <Form.Item
            label="选择处理人"
            name="handlerId"
            rules={[{ required: true, message: '请选择处理人' }]}
          >
            <Select placeholder="请选择处理人员">
              {handlers.map(h => (
                <Option key={h._id} value={h._id}>
                  {h.realName} - {getDepartmentName(h.department)}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default WorkOrderList;

import { useState, useEffect } from 'react';
import { Table, Button, Tag, Select, Input, Space, Card, Tabs, Badge, Modal, message } from 'antd';
import { SearchOutlined, PlusOutlined, PlayCircleOutlined, CheckCircleOutlined, ExclamationCircleOutlined, EyeOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getInspectionPlans, getInspectionTasks, getInspectionExceptions, deleteInspectionPlan, type InspectionPlan, type InspectionTask, type InspectionException } from '../api/inspection';
import { useAuth } from '../context/AuthContext';
import dayjs from 'dayjs';

const { Option } = Select;
const { TabPane } = Tabs;

const InspectionList = () => {
  const [activeTab, setActiveTab] = useState('plans');
  const [plans, setPlans] = useState<InspectionPlan[]>([]);
  const [tasks, setTasks] = useState<InspectionTask[]>([]);
  const [exceptions, setExceptions] = useState<InspectionException[]>([]);
  const [plansTotal, setPlansTotal] = useState(0);
  const [tasksTotal, setTasksTotal] = useState(0);
  const [exceptionsTotal, setExceptionsTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [filters, setFilters] = useState<any>({});
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; type: string } | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (activeTab === 'plans') {
      loadPlans();
    } else if (activeTab === 'tasks') {
      loadTasks();
    } else {
      loadExceptions();
    }
  }, [activeTab, pagination.current, pagination.pageSize, filters]);

  const loadPlans = async () => {
    setLoading(true);
    try {
      const result: any = await getInspectionPlans({
        page: pagination.current,
        pageSize: pagination.pageSize,
        ...filters,
      });
      setPlans(result.list || []);
      setPlansTotal(result.total || 0);
    } catch (error) {
      console.error('加载巡检计划失败:', error);
      setPlans([]);
      setPlansTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const loadTasks = async () => {
    setLoading(true);
    try {
      const result: any = await getInspectionTasks({
        page: pagination.current,
        pageSize: pagination.pageSize,
        ...filters,
      });
      setTasks(result.list || []);
      setTasksTotal(result.total || 0);
    } catch (error) {
      console.error('加载巡检任务失败:', error);
      setTasks([]);
      setTasksTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const loadExceptions = async () => {
    setLoading(true);
    try {
      const result: any = await getInspectionExceptions({
        page: pagination.current,
        pageSize: pagination.pageSize,
        ...filters,
      });
      setExceptions(result.list || []);
      setExceptionsTotal(result.total || 0);
    } catch (error) {
      console.error('加载异常记录失败:', error);
      setExceptions([]);
      setExceptionsTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const getPlanStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      draft: { color: 'default', text: '草稿' },
      active: { color: 'green', text: '进行中' },
      completed: { color: 'blue', text: '已完成' },
      cancelled: { color: 'red', text: '已取消' },
    };
    const info = statusMap[status] || { color: 'default', text: status };
    return <Tag color={info.color}>{info.text}</Tag>;
  };

  const getTaskStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      pending: { color: 'orange', text: '待开始' },
      in_progress: { color: 'blue', text: '进行中' },
      completed: { color: 'green', text: '已完成' },
      exception: { color: 'red', text: '有异常' },
    };
    const info = statusMap[status] || { color: 'default', text: status };
    return <Tag color={info.color}>{info.text}</Tag>;
  };

  const getExceptionStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      pending: { color: 'orange', text: '待处理' },
      processed: { color: 'blue', text: '已处理' },
      closed: { color: 'green', text: '已关闭' },
    };
    const info = statusMap[status] || { color: 'default', text: status };
    return <Tag color={info.color}>{info.text}</Tag>;
  };

  const getPriorityTag = (priority: string) => {
    const priorityMap: Record<string, { color: string; text: string }> = {
      low: { color: 'green', text: '低' },
      medium: { color: 'blue', text: '中' },
      high: { color: 'orange', text: '高' },
      urgent: { color: 'red', text: '紧急' },
    };
    const info = priorityMap[priority] || { color: 'default', text: priority };
    return <Tag color={info.color}>{info.text}</Tag>;
  };

  const getTypeTag = (type: string) => {
    const typeMap: Record<string, { color: string; text: string }> = {
      daily: { color: 'blue', text: '每日' },
      weekly: { color: 'cyan', text: '每周' },
      monthly: { color: 'purple', text: '每月' },
      temporary: { color: 'orange', text: '临时' },
    };
    const info = typeMap[type] || { color: 'default', text: type };
    return <Tag color={info.color}>{info.text}</Tag>;
  };

  const handleCreatePlan = () => {
    navigate('/inspection/plans/new');
  };

  const handleEditPlan = (id: string) => {
    navigate(`/inspection/plans/${id}/edit`);
  };

  const handleDeletePlan = (id: string) => {
    setDeleteTarget({ id, type: 'plan' });
    setDeleteModal(true);
  };

  const handleStartTask = (id: string) => {
    navigate(`/inspection/tasks/${id}/checkin`);
  };

  const handleViewTask = (id: string) => {
    navigate(`/inspection/tasks/${id}/checkin`);
  };

  const handleViewException = (record: InspectionException) => {
    if (record.eventId) {
      navigate(`/events/list`);
    } else {
      message.info('该异常尚未生成事件');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteInspectionPlan(deleteTarget.id);
      message.success('删除成功');
      setDeleteModal(false);
      loadPlans();
    } catch (error: any) {
      message.error(error.response?.data?.message || '删除失败');
    }
  };

  const planColumns = [
    {
      title: '计划名称',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 80,
      render: (type: string) => getTypeTag(type),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => getPlanStatusTag(status),
    },
    {
      title: '巡检点数量',
      dataIndex: 'checkpoints',
      key: 'checkpoints',
      width: 100,
      render: (checkpoints: any[]) => checkpoints?.length || 0,
    },
    {
      title: '负责人',
      dataIndex: 'assigneeNames',
      key: 'assigneeNames',
      width: 120,
      render: (names: string[]) => names?.join('、') || '-',
    },
    {
      title: '有效时间',
      key: 'dateRange',
      width: 200,
      render: (_: any, record: InspectionPlan) => (
        <span>
          {dayjs(record.startDate).format('YYYY-MM-DD')}
          {record.endDate ? ` ~ ${dayjs(record.endDate).format('YYYY-MM-DD')}` : ' ~ 长期'}
        </span>
      ),
    },
    {
      title: '创建人',
      dataIndex: 'createdByName',
      key: 'createdByName',
      width: 100,
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: any, record: InspectionPlan) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleEditPlan(record._id!)}>
            编辑
          </Button>
          <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDeletePlan(record._id!)}>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  const taskColumns = [
    {
      title: '任务名称',
      dataIndex: 'planName',
      key: 'planName',
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => getTaskStatusTag(status),
    },
    {
      title: '巡检点',
      key: 'checkpointProgress',
      width: 120,
      render: (_: any, record: InspectionTask) => (
        <span>
          {record.checkinRecords?.length || 0}/{record.checkpoints?.length || 0}
        </span>
      ),
    },
    {
      title: '负责人',
      dataIndex: 'assigneeName',
      key: 'assigneeName',
      width: 100,
    },
    {
      title: '计划日期',
      dataIndex: 'scheduledDate',
      key: 'scheduledDate',
      width: 120,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '异常数',
      dataIndex: 'exceptionCount',
      key: 'exceptionCount',
      width: 80,
      render: (count: number) => count ? <Badge count={count} color="red" /> : 0,
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: any, record: InspectionTask) => (
        <Space>
          {record.status === 'pending' && (
            <Button type="link" size="small" icon={<PlayCircleOutlined />} onClick={() => handleStartTask(record._id!)}>
              开始巡检
            </Button>
          )}
          {record.status === 'in_progress' && (
            <Button type="link" size="small" icon={<PlayCircleOutlined />} onClick={() => handleStartTask(record._id!)}>
              继续巡检
            </Button>
          )}
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewTask(record._id!)}>
            查看
          </Button>
        </Space>
      ),
    },
  ];

  const exceptionColumns = [
    {
      title: '异常标题',
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
      render: (status: string) => getExceptionStatusTag(status),
    },
    {
      title: '巡检点',
      dataIndex: 'checkpointName',
      key: 'checkpointName',
      width: 120,
    },
    {
      title: '上报人',
      dataIndex: 'reporterName',
      key: 'reporterName',
      width: 100,
    },
    {
      title: '上报时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '关联事件',
      key: 'event',
      width: 100,
      render: (_: any, record: InspectionException) => (
        record.eventId ? <Tag color="green">已生成</Tag> : <Tag color="orange">未生成</Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: any, record: InspectionException) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewException(record)}>
            查看事件
          </Button>
        </Space>
      ),
    },
  ];

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    setPagination({ current: 1, pageSize: 10 });
    setFilters({});
  };

  const handleSearch = () => {
    setPagination(p => ({ ...p, current: 1 }));
    if (activeTab === 'plans') loadPlans();
    else if (activeTab === 'tasks') loadTasks();
    else loadExceptions();
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title">巡检管理</div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreatePlan}>
          创建巡检计划
        </Button>
      </div>

      <Card>
        <div className="filter-bar">
          <Space>
            <Input
              placeholder="搜索名称"
              style={{ width: 220 }}
              allowClear
              onChange={(e) => setFilters(f => ({ ...f, keyword: e.target.value }))}
              onPressEnter={handleSearch}
              suffix={<SearchOutlined />}
            />
            {activeTab === 'plans' && (
              <Select
                placeholder="状态"
                style={{ width: 120 }}
                allowClear
                onChange={(value) => setFilters(f => ({ ...f, status: value }))}
              >
                <Option value="draft">草稿</Option>
                <Option value="active">进行中</Option>
                <Option value="completed">已完成</Option>
                <Option value="cancelled">已取消</Option>
              </Select>
            )}
            {activeTab === 'tasks' && (
              <Select
                placeholder="状态"
                style={{ width: 120 }}
                allowClear
                onChange={(value) => setFilters(f => ({ ...f, status: value }))}
              >
                <Option value="pending">待开始</Option>
                <Option value="in_progress">进行中</Option>
                <Option value="completed">已完成</Option>
                <Option value="exception">有异常</Option>
              </Select>
            )}
            {activeTab === 'exceptions' && (
              <Select
                placeholder="状态"
                style={{ width: 120 }}
                allowClear
                onChange={(value) => setFilters(f => ({ ...f, status: value }))}
              >
                <Option value="pending">待处理</Option>
                <Option value="processed">已处理</Option>
                <Option value="closed">已关闭</Option>
              </Select>
            )}
            <Button type="primary" onClick={handleSearch} icon={<SearchOutlined />}>
              查询
            </Button>
          </Space>
        </div>

        <Tabs activeKey={activeTab} onChange={handleTabChange}>
          <TabPane tab={<span><CheckCircleOutlined /> 巡检计划</span>} key="plans">
            <Table
              columns={planColumns}
              dataSource={plans}
              rowKey="_id"
              loading={loading}
              pagination={{
                ...pagination,
                total: plansTotal,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条`,
                onChange: (page, pageSize) => setPagination({ current: page, pageSize }),
              }}
            />
          </TabPane>
          <TabPane tab={<span><PlayCircleOutlined /> 巡检任务</span>} key="tasks">
            <Table
              columns={taskColumns}
              dataSource={tasks}
              rowKey="_id"
              loading={loading}
              pagination={{
                ...pagination,
                total: tasksTotal,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条`,
                onChange: (page, pageSize) => setPagination({ current: page, pageSize }),
              }}
            />
          </TabPane>
          <TabPane tab={<span><ExclamationCircleOutlined /> 异常记录</span>} key="exceptions">
            <Table
              columns={exceptionColumns}
              dataSource={exceptions}
              rowKey="_id"
              loading={loading}
              pagination={{
                ...pagination,
                total: exceptionsTotal,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条`,
                onChange: (page, pageSize) => setPagination({ current: page, pageSize }),
              }}
            />
          </TabPane>
        </Tabs>
      </Card>

      <Modal
        title="确认删除"
        open={deleteModal}
        onCancel={() => setDeleteModal(false)}
        onOk={confirmDelete}
        okText="确认删除"
        okButtonProps={{ danger: true }}
      >
        <p>确定要删除该巡检计划吗？此操作不可恢复。</p>
      </Modal>
    </div>
  );
};

export default InspectionList;

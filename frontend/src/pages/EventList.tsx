import { useState, useEffect } from 'react';
import { Table, Button, Tag, Select, Input, Space, Card, Modal, Descriptions, Badge, message } from 'antd';
import { PlusOutlined, SearchOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getEvents, deleteEvent, updateEventStatus } from '../api/event';
import { getWorkOrders, createWorkOrder } from '../api/workorder';
import dayjs from 'dayjs';

const { Option } = Select;

const EventList = () => {
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [filters, setFilters] = useState<any>({});
  const [detailModal, setDetailModal] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<any>(null);
  const [dispatchModal, setDispatchModal] = useState(false);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    loadData();
  }, [pagination.current, pagination.pageSize, filters]);

  const loadData = async () => {
    setLoading(true);
    try {
      const result: any = await getEvents({
        page: pagination.current,
        pageSize: pagination.pageSize,
        ...filters,
      });
      setData(result.list);
      setTotal(result.total);
    } catch (error) {
      console.error('加载事件列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      pending: { color: 'orange', text: '待处理' },
      processing: { color: 'blue', text: '处理中' },
      resolved: { color: 'green', text: '已解决' },
      closed: { color: 'default', text: '已关闭' },
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

  const getCategoryName = (category: string) => {
    const categoryMap: Record<string, string> = {
      road: '道路设施',
      sanitation: '环境卫生',
      greening: '园林绿化',
      facility: '公共设施',
      noise: '噪声污染',
      water: '供排水',
      electricity: '电力设施',
      gas: '燃气设施',
      other: '其他',
    };
    return categoryMap[category] || category;
  };

  const handleViewDetail = (record: any) => {
    setCurrentEvent(record);
    setDetailModal(true);
  };

  const handleDispatch = async (record: any) => {
    try {
      const result: any = await createWorkOrder({
        eventId: record._id,
        title: record.title,
        description: record.description,
        priority: record.priority,
        assignerId: user._id,
        assignerName: user.realName,
      });
      message.success('工单创建成功');
      setDispatchModal(false);
      loadData();
      navigate(`/workorders/${result._id}`);
    } catch (error: any) {
      message.error(error.response?.data?.message || '创建工单失败');
    }
  };

  const columns = [
    {
      title: '事件标题',
      dataIndex: 'title',
      key: 'title',
      width: 200,
      ellipsis: true,
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: (category: string) => getCategoryName(category),
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
      title: '地点',
      dataIndex: 'address',
      key: 'address',
      ellipsis: true,
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
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            详情
          </Button>
          {record.status === 'pending' && (
            <Button type="link" size="small" onClick={() => handleDispatch(record)}>
              派单
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const handleSearch = () => {
    setPagination(p => ({ ...p, current: 1 }));
    loadData();
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title">事件列表</div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/events/report')}>
          上报事件
        </Button>
      </div>

      <div className="filter-bar">
        <Space>
          <Input
            placeholder="搜索标题/地点"
            style={{ width: 200 }}
            allowClear
            onChange={(e) => setFilters(f => ({ ...f, keyword: e.target.value }))}
            onPressEnter={handleSearch}
            suffix={<SearchOutlined />}
          />
          <Select
            placeholder="状态"
            style={{ width: 120 }}
            allowClear
            onChange={(value) => setFilters(f => ({ ...f, status: value }))}
          >
            <Option value="pending">待处理</Option>
            <Option value="processing">处理中</Option>
            <Option value="resolved">已解决</Option>
            <Option value="closed">已关闭</Option>
          </Select>
          <Select
            placeholder="分类"
            style={{ width: 120 }}
            allowClear
            onChange={(value) => setFilters(f => ({ ...f, category: value }))}
          >
            <Option value="road">道路设施</Option>
            <Option value="sanitation">环境卫生</Option>
            <Option value="greening">园林绿化</Option>
            <Option value="facility">公共设施</Option>
            <Option value="water">供排水</Option>
            <Option value="electricity">电力设施</Option>
            <Option value="gas">燃气设施</Option>
            <Option value="other">其他</Option>
          </Select>
          <Button type="primary" onClick={handleSearch} icon={<SearchOutlined />}>
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
        title="事件详情"
        open={detailModal}
        onCancel={() => setDetailModal(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModal(false)}>关闭</Button>,
        ]}
        width={700}
      >
        {currentEvent && (
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="事件标题" span={2}>{currentEvent.title}</Descriptions.Item>
            <Descriptions.Item label="事件分类">{getCategoryName(currentEvent.category)}</Descriptions.Item>
            <Descriptions.Item label="优先级">{getPriorityTag(currentEvent.priority)}</Descriptions.Item>
            <Descriptions.Item label="状态">{getStatusTag(currentEvent.status)}</Descriptions.Item>
            <Descriptions.Item label="事发地点">{currentEvent.address}</Descriptions.Item>
            <Descriptions.Item label="上报人">{currentEvent.reporterName}</Descriptions.Item>
            <Descriptions.Item label="联系电话">{currentEvent.reporterPhone}</Descriptions.Item>
            <Descriptions.Item label="上报时间">{dayjs(currentEvent.createdAt).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
            <Descriptions.Item label="来源">{currentEvent.source}</Descriptions.Item>
            <Descriptions.Item label="处理人">{currentEvent.handlerName || '-'}</Descriptions.Item>
            <Descriptions.Item label="详细描述" span={2}>{currentEvent.description}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default EventList;

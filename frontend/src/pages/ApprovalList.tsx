import { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Tag,
  Space,
  Button,
  Select,
  Input,
  Tabs,
  message,
} from 'antd';
import {
  ClockCircleOutlined,
  SwapOutlined,
  CloseCircleOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getApprovalInstances } from '../api/approval';
import { useAuth } from '../context/AuthContext';
import dayjs from 'dayjs';

const { Search } = Input;

const ApprovalList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('myApplications');
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [type, setType] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    loadData();
  }, [activeTab, page, pageSize, type, status, keyword]);

  const loadData = async () => {
    setLoading(true);
    try {
      const params: any = { page, pageSize };
      if (type) params.type = type;
      if (status) params.status = status;
      if (keyword) params.keyword = keyword;

      if (activeTab === 'myApplications') {
        params.applicantId = user._id;
      } else if (activeTab === 'myApprovals') {
        params.approverId = user._id;
        params.status = 'pending';
      }

      const data: any = await getApprovalInstances(params);
      setList(data.list || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error('加载审批列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      extension: '延期申请',
      reassign: '改派申请',
      close_reject: '关闭驳回',
    };
    return map[type] || type;
  };

  const getTypeTag = (type: string) => {
    const map: Record<string, { color: string; icon: React.ReactNode }> = {
      extension: { color: 'orange', icon: <ClockCircleOutlined /> },
      reassign: { color: 'blue', icon: <SwapOutlined /> },
      close_reject: { color: 'red', icon: <CloseCircleOutlined /> },
    };
    const info = map[type] || { color: 'default', icon: null };
    return <Tag color={info.color} icon={info.icon}>{getTypeLabel(type)}</Tag>;
  };

  const getStatusTag = (status: string) => {
    const map: Record<string, { color: string; text: string }> = {
      pending: { color: 'processing', text: '审批中' },
      approved: { color: 'success', text: '已通过' },
      rejected: { color: 'error', text: '已驳回' },
      cancelled: { color: 'default', text: '已撤销' },
    };
    const info = map[status] || { color: 'default', text: status };
    return <Tag color={info.color}>{info.text}</Tag>;
  };

  const columns = [
    {
      title: '申请标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: '申请类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: string) => getTypeTag(type),
    },
    {
      title: '关联工单',
      dataIndex: 'relatedNo',
      key: 'relatedNo',
      width: 140,
    },
    {
      title: '申请人',
      dataIndex: 'applicantName',
      key: 'applicantName',
      width: 100,
    },
    {
      title: '当前节点',
      key: 'currentNode',
      width: 120,
      render: (_: any, record: any) => {
        const currentNode = record.nodeInstances?.[record.currentNodeIndex];
        return currentNode?.nodeName || '-';
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => getStatusTag(status),
    },
    {
      title: '申请时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 170,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_: any, record: any) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/approvals/${record._id}`)}
        >
          详情
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={(key) => {
            setActiveTab(key);
            setPage(1);
          }}
          items={[
            { key: 'myApplications', label: '我的申请' },
            { key: 'myApprovals', label: '待我审批' },
            { key: 'all', label: '全部审批' },
          ]}
        />

        <Space style={{ marginBottom: 16 }} wrap>
          <Select
            placeholder="申请类型"
            allowClear
            style={{ width: 140 }}
            value={type || undefined}
            onChange={(val) => { setType(val || ''); setPage(1); }}
          >
            <Select.Option value="extension">延期申请</Select.Option>
            <Select.Option value="reassign">改派申请</Select.Option>
            <Select.Option value="close_reject">关闭驳回</Select.Option>
          </Select>

          {activeTab !== 'myApprovals' && (
            <Select
              placeholder="审批状态"
              allowClear
              style={{ width: 140 }}
              value={status || undefined}
              onChange={(val) => { setStatus(val || ''); setPage(1); }}
            >
              <Select.Option value="pending">审批中</Select.Option>
              <Select.Option value="approved">已通过</Select.Option>
              <Select.Option value="rejected">已驳回</Select.Option>
              <Select.Option value="cancelled">已撤销</Select.Option>
            </Select>
          )}

          <Search
            placeholder="搜索标题/原因/工单号"
            allowClear
            style={{ width: 240 }}
            onSearch={(val) => { setKeyword(val); setPage(1); }}
          />
        </Space>

        <Table
          columns={columns}
          dataSource={list}
          rowKey="_id"
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
          }}
        />
      </Card>
    </div>
  );
};

export default ApprovalList;

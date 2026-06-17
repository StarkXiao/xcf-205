import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Tag,
  Input,
  Space,
  Card,
  Modal,
  Form,
  Select,
  message,
  Row,
  Col,
  Statistic,
  Tabs,
  Drawer,
  Descriptions,
  Divider,
  Typography,
  Switch,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  EyeOutlined,
  BookOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ApiOutlined,
  CopyOutlined,
} from '@ant-design/icons';
import {
  getKnowledgeList,
  getKnowledge,
  getKnowledgeStats,
  createKnowledge,
  updateKnowledge,
  deleteKnowledge,
  referenceKnowledge,
} from '../api/knowledge';
import { getRoles } from '../api/role';
import dayjs from 'dayjs';

const { Option } = Select;
const { Title, Paragraph } = Typography;

const KnowledgeTypeMap: Record<string, { label: string; color: string; icon: any }> = {
  event_classification: { label: '事件分类标准', color: 'blue', icon: <BookOutlined /> },
  processing_spec: { label: '处理规范', color: 'green', icon: <FileTextOutlined /> },
  verification_criteria: { label: '核查口径', color: 'orange', icon: <CheckCircleOutlined /> },
};

const EventCategories = [
  '城市设施',
  '环境卫生',
  '交通秩序',
  '治安管理',
  '环境污染',
  '园林绿化',
  '市政工程',
  '其他',
];

const KnowledgeBase = () => {
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [keyword, setKeyword] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>();

  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit'>('create');
  const [currentItem, setCurrentItem] = useState<any>(null);
  const [form] = Form.useForm();

  const [detailVisible, setDetailVisible] = useState(false);
  const [detailData, setDetailData] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [roles, setRoles] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ total: 0, byType: {}, totalReferences: 0 });

  useEffect(() => {
    loadRoles();
    loadStats();
  }, []);

  useEffect(() => {
    loadData();
  }, [page, pageSize, activeTab, keyword, categoryFilter]);

  const loadRoles = async () => {
    try {
      const data: any = await getRoles();
      setRoles(data);
    } catch (error) {
      console.error('加载角色列表失败:', error);
    }
  };

  const loadStats = async () => {
    try {
      const data: any = await getKnowledgeStats();
      setStats(data);
    } catch (error) {
      console.error('加载统计数据失败:', error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const params: any = { page, pageSize };
      if (activeTab !== 'all') {
        params.type = activeTab;
      }
      if (keyword) {
        params.keyword = keyword;
      }
      if (categoryFilter) {
        params.eventCategory = categoryFilter;
      }
      const data: any = await getKnowledgeList(params);
      setData(data.list);
      setTotal(data.total);
    } catch (error) {
      console.error('加载知识库列表失败:', error);
      message.error('加载知识库列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setModalType('create');
    setCurrentItem(null);
    form.resetFields();
    form.setFieldsValue({
      isActive: true,
      tags: [],
      visibleRoles: [],
      type: activeTab !== 'all' ? activeTab : 'event_classification',
    });
    setModalVisible(true);
  };

  const handleEdit = (record: any) => {
    setModalType('edit');
    setCurrentItem(record);
    form.setFieldsValue({
      ...record,
      tags: record.tags || [],
      visibleRoles: (record.visibleRoles || []).map((r: any) => r._id || r),
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteKnowledge(id);
      message.success('删除成功');
      loadData();
      loadStats();
    } catch (error: any) {
      message.error(error.response?.data?.message || '删除失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (modalType === 'create') {
        await createKnowledge(values);
        message.success('创建成功');
      } else {
        await updateKnowledge(currentItem._id, values);
        message.success('更新成功');
      }

      setModalVisible(false);
      loadData();
      loadStats();
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败');
    }
  };

  const handleViewDetail = async (id: string) => {
    setDetailVisible(true);
    setDetailLoading(true);
    try {
      const data: any = await getKnowledge(id);
      setDetailData(data);
    } catch (error) {
      console.error('加载详情失败:', error);
      message.error('加载详情失败');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleReference = async (record: any) => {
    try {
      await referenceKnowledge(record._id);
      message.success('已引用');
      loadData();
      loadStats();
    } catch (error: any) {
      message.error(error.response?.data?.message || '引用失败');
    }
  };

  const handleCopyContent = (content: string) => {
    navigator.clipboard.writeText(content);
    message.success('已复制到剪贴板');
  };

  const columns = [
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 140,
      render: (type: string) => {
        const info = KnowledgeTypeMap[type];
        return (
          <Tag color={info?.color} icon={info?.icon}>
            {info?.label || type}
          </Tag>
        );
      },
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (title: string, record: any) => (
        <a onClick={() => handleViewDetail(record._id)} style={{ color: '#1890ff' }}>
          {title}
        </a>
      ),
    },
    {
      title: '事件分类',
      dataIndex: 'eventCategory',
      key: 'eventCategory',
      width: 120,
      render: (category: string) => category || '-',
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      width: 200,
      render: (tags: string[]) =>
        tags && tags.length > 0 ? (
          <Space wrap>
            {tags.slice(0, 3).map((tag, idx) => (
              <Tag key={idx} color="geekblue">
                {tag}
              </Tag>
            ))}
            {tags.length > 3 && <Tag>+{tags.length - 3}</Tag>}
          </Space>
        ) : (
          '-'
        ),
    },
    {
      title: '适用角色',
      dataIndex: 'visibleRoles',
      key: 'visibleRoles',
      width: 180,
      render: (roles: any[]) => {
        if (!roles || roles.length === 0) return '全部角色';
        return roles
          .map((r: any) => r.name || r)
          .slice(0, 2)
          .join('、') + (roles.length > 2 ? ' 等' : '');
      },
    },
    {
      title: '引用次数',
      dataIndex: 'referenceCount',
      key: 'referenceCount',
      width: 100,
      render: (count: number) => (
        <Tag color={count > 0 ? 'cyan' : 'default'}>{count} 次</Tag>
      ),
    },
    {
      title: '版本',
      dataIndex: 'version',
      key: 'version',
      width: 80,
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 80,
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
      width: 220,
      fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record._id)}
          >
            查看
          </Button>
          <Button
            type="link"
            size="small"
            icon={<CopyOutlined />}
            onClick={() => handleReference(record)}
          >
            引用
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record._id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  const tabItems = [
    { key: 'all', label: `全部 (${stats.total})` },
    {
      key: 'event_classification',
      label: `${KnowledgeTypeMap.event_classification.label} (${
        stats.byType?.event_classification || 0
      })`,
    },
    {
      key: 'processing_spec',
      label: `${KnowledgeTypeMap.processing_spec.label} (${
        stats.byType?.processing_spec || 0
      })`,
    },
    {
      key: 'verification_criteria',
      label: `${KnowledgeTypeMap.verification_criteria.label} (${
        stats.byType?.verification_criteria || 0
      })`,
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title">知识库管理</div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          新增条目
        </Button>
      </div>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="知识条目总数"
              value={stats.total}
              prefix={<BookOutlined style={{ color: '#1890ff' }} />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="事件分类标准"
              value={stats.byType?.event_classification || 0}
              valueStyle={{ color: '#1890ff' }}
              prefix={<BookOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="处理规范"
              value={stats.byType?.processing_spec || 0}
              valueStyle={{ color: '#52c41a' }}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="总引用次数"
              value={stats.totalReferences}
              valueStyle={{ color: '#fa8c16' }}
              prefix={<ApiOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={8}>
            <Input
              placeholder="搜索标题或内容"
              prefix={<SearchOutlined />}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              allowClear
            />
          </Col>
          <Col span={6}>
            <Select
              placeholder="按事件分类筛选"
              style={{ width: '100%' }}
              allowClear
              value={categoryFilter}
              onChange={setCategoryFilter}
            >
              {EventCategories.map((cat) => (
                <Option key={cat} value={cat}>
                  {cat}
                </Option>
              ))}
            </Select>
          </Col>
        </Row>
      </Card>

      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          style={{ marginBottom: 16 }}
        />

        <Table
          columns={columns}
          dataSource={data}
          rowKey="_id"
          loading={loading}
          scroll={{ x: 1400 }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
          }}
        />
      </Card>

      <Modal
        title={modalType === 'create' ? '新增知识条目' : '编辑知识条目'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
        width={800}
        okText="提交"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="条目类型"
                name="type"
                rules={[{ required: true, message: '请选择条目类型' }]}
              >
                <Select placeholder="请选择条目类型">
                  {Object.entries(KnowledgeTypeMap).map(([key, info]) => (
                    <Option key={key} value={key}>
                      {info.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="关联事件分类" name="eventCategory">
                <Select placeholder="请选择事件分类" allowClear>
                  {EventCategories.map((cat) => (
                    <Option key={cat} value={cat}>
                      {cat}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="标题"
            name="title"
            rules={[{ required: true, message: '请输入标题' }]}
          >
            <Input placeholder="请输入知识条目标题" maxLength={200} />
          </Form.Item>

          <Form.Item
            label="内容"
            name="content"
            rules={[{ required: true, message: '请输入内容' }]}
          >
            <Input.TextArea
              rows={8}
              placeholder="请输入知识条目内容，支持详细描述"
              maxLength={5000}
              showCount
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="标签" name="tags">
                <Select mode="tags" placeholder="输入标签后回车" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="版本号" name="version">
                <Input placeholder="例如: 1.0" defaultValue="1.0" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="可见角色（不选则全部可见）"
            name="visibleRoles"
          >
            <Select mode="multiple" placeholder="选择可见角色" style={{ width: '100%' }}>
              {roles.map((role) => (
                <Option key={role._id} value={role._id}>
                  {role.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="启用状态" name="isActive" valuePropName="checked">
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title="知识条目详情"
        width={720}
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
        extra={
          <Space>
            {detailData && (
              <Button
                icon={<CopyOutlined />}
                onClick={() => {
                  handleCopyContent(detailData.content);
                  handleReference(detailData);
                }}
              >
                引用并复制
              </Button>
            )}
          </Space>
        }
      >
        {detailLoading ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>加载中...</div>
        ) : detailData ? (
          <div>
            <Descriptions column={2} bordered style={{ marginBottom: 24 }}>
              <Descriptions.Item label="类型" span={1}>
                <Tag color={KnowledgeTypeMap[detailData.type]?.color}>
                  {KnowledgeTypeMap[detailData.type]?.label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="关联事件分类" span={1}>
                {detailData.eventCategory || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="版本" span={1}>
                {detailData.version}
              </Descriptions.Item>
              <Descriptions.Item label="引用次数" span={1}>
                {detailData.referenceCount} 次
              </Descriptions.Item>
              <Descriptions.Item label="标签" span={1}>
                {detailData.tags && detailData.tags.length > 0
                  ? detailData.tags.map((tag: string, idx: number) => (
                      <Tag key={idx} color="geekblue">
                        {tag}
                      </Tag>
                    ))
                  : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="适用角色" span={1}>
                {detailData.visibleRoles && detailData.visibleRoles.length > 0
                  ? detailData.visibleRoles.map((r: any) => r.name).join('、')
                  : '全部角色'}
              </Descriptions.Item>
              <Descriptions.Item label="创建人" span={1}>
                {detailData.createdBy?.realName || detailData.createdBy?.username || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间" span={1}>
                {dayjs(detailData.createdAt).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
            </Descriptions>

            <Divider orientation="left">标题</Divider>
            <Title level={4} style={{ marginTop: 0 }}>
              {detailData.title}
            </Title>

            <Divider orientation="left">内容</Divider>
            <div
              style={{
                background: '#fafafa',
                padding: 16,
                borderRadius: 4,
                minHeight: 200,
                whiteSpace: 'pre-wrap',
                lineHeight: 1.8,
              }}
            >
              <Paragraph style={{ marginBottom: 0 }}>{detailData.content}</Paragraph>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '50px', color: '#999' }}>
            暂无数据
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default KnowledgeBase;

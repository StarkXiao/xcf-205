import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Tag,
  Select,
  Input,
  Space,
  Card,
  Modal,
  Image,
  message,
  Popconfirm,
  DatePicker,
  Statistic,
  Row,
  Col,
  Tooltip,
  Grid,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EyeOutlined,
  DownloadOutlined,
  DeleteOutlined,
  SaveOutlined,
  UnlockOutlined,
  FileImageOutlined,
  FileOutlined,
  TeamOutlined,
  AuditOutlined,
  FolderOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import {
  getAttachments,
  getAttachmentStatistics,
  archiveAttachment,
  batchArchiveAttachments,
  restoreAttachment,
  deleteAttachment,
  getAttachmentPreviewUrl,
  getAttachmentDownloadUrl,
} from '../api/attachment';
import type { Attachment, AttachmentType, AttachmentStatus } from '../types/attachment';
import {
  ATTACHMENT_TYPE_LABELS,
  ATTACHMENT_TYPE_COLORS,
  ATTACHMENT_STATUS_LABELS,
  ATTACHMENT_STATUS_COLORS,
  formatFileSize,
  isImage,
  isPdf,
} from '../types/attachment';
import AttachmentUpload from '../components/AttachmentUpload';
import AttachmentPreview from '../components/AttachmentPreview';
import ReactECharts from 'echarts-for-react';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { useBreakpoint } = Grid;

const AttachmentList = () => {
  const screens = useBreakpoint();
  const [data, setData] = useState<Attachment[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [filters, setFilters] = useState<any>({});
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [uploadModal, setUploadModal] = useState(false);
  const [previewModal, setPreviewModal] = useState(false);
  const [previewAttachments, setPreviewAttachments] = useState<Attachment[]>([]);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [statistics, setStatistics] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');

  useEffect(() => {
    loadData();
    loadStatistics();
  }, [pagination.current, pagination.pageSize, filters]);

  const loadData = async () => {
    setLoading(true);
    try {
      const result: any = await getAttachments({
        page: pagination.current,
        pageSize: pagination.pageSize,
        ...filters,
      });
      setData(result.list);
      setTotal(result.total);
    } catch (error) {
      console.error('加载附件列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const result = await getAttachmentStatistics();
      setStatistics(result);
    } catch (error) {
      console.error('加载统计数据失败:', error);
    }
  };

  const handleSearch = () => {
    setPagination((p) => ({ ...p, current: 1 }));
    loadData();
  };

  const handlePreview = (attachment: Attachment, index?: number) => {
    if (isImage(attachment.mimeType) || isPdf(attachment.mimeType)) {
      setPreviewAttachments(data);
      setPreviewIndex(index ?? data.findIndex((a) => a._id === attachment._id));
      setPreviewModal(true);
    } else {
      window.open(getAttachmentDownloadUrl(attachment._id));
    }
  };

  const handleDownload = (attachment: Attachment) => {
    window.open(getAttachmentDownloadUrl(attachment._id));
  };

  const handleArchive = async (attachment: Attachment) => {
    try {
      await archiveAttachment(attachment._id);
      message.success('归档成功');
      loadData();
      loadStatistics();
    } catch (error: any) {
      message.error(error.response?.data?.message || '归档失败');
    }
  };

  const handleBatchArchive = async () => {
    try {
      await batchArchiveAttachments(selectedRowKeys as string[]);
      message.success(`成功归档 ${selectedRowKeys.length} 个附件`);
      setSelectedRowKeys([]);
      loadData();
      loadStatistics();
    } catch (error: any) {
      message.error(error.response?.data?.message || '批量归档失败');
    }
  };

  const handleRestore = async (attachment: Attachment) => {
    try {
      await restoreAttachment(attachment._id);
      message.success('恢复成功');
      loadData();
      loadStatistics();
    } catch (error: any) {
      message.error(error.response?.data?.message || '恢复失败');
    }
  };

  const handleDelete = async (attachment: Attachment) => {
    try {
      await deleteAttachment(attachment._id);
      message.success('删除成功');
      loadData();
      loadStatistics();
    } catch (error: any) {
      message.error(error.response?.data?.message || '删除失败');
    }
  };

  const handleUploadSuccess = () => {
    setUploadModal(false);
    loadData();
    loadStatistics();
  };

  const columns: ColumnsType<Attachment> = [
    {
      title: '预览',
      dataIndex: '_id',
      key: 'preview',
      width: 80,
      render: (_: string, record: Attachment) => (
        <div
          style={{
            width: 60,
            height: 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f5f5f5',
            borderRadius: 4,
            cursor: 'pointer',
            overflow: 'hidden',
          }}
          onClick={() => handlePreview(record)}
        >
          {isImage(record.mimeType) ? (
            <Image
              src={getAttachmentPreviewUrl(record._id)}
              alt={record.originalName}
              width={60}
              height={60}
              style={{ objectFit: 'cover' }}
              preview={false}
            />
          ) : (
            <FileOutlined style={{ fontSize: 24, color: '#999' }} />
          )}
        </div>
      ),
    },
    {
      title: '文件名称',
      dataIndex: 'originalName',
      key: 'originalName',
      width: 250,
      ellipsis: true,
      render: (text: string, record: Attachment) => (
        <Tooltip title={text}>
          <a onClick={() => handlePreview(record)}>{text}</a>
        </Tooltip>
      ),
    },
    {
      title: '附件类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: AttachmentType) => (
        <Tag color={ATTACHMENT_TYPE_COLORS[type]}>
          {ATTACHMENT_TYPE_LABELS[type]}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: AttachmentStatus) => (
        <Tag color={ATTACHMENT_STATUS_COLORS[status]}>
          {ATTACHMENT_STATUS_LABELS[status]}
        </Tag>
      ),
    },
    {
      title: '大小',
      dataIndex: 'fileSize',
      key: 'fileSize',
      width: 100,
      render: (size: number) => formatFileSize(size),
    },
    {
      title: '关联编号',
      dataIndex: 'relatedNo',
      key: 'relatedNo',
      width: 140,
      render: (text: string) => text || '-',
    },
    {
      title: '上传人',
      dataIndex: 'uploadedByName',
      key: 'uploadedByName',
      width: 100,
      render: (text: string) => text || '-',
    },
    {
      title: '上传时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
      sorter: (a, b) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(),
    },
    {
      title: '操作',
      key: 'action',
      width: 240,
      fixed: screens.xs ? undefined : 'right',
      render: (_: any, record: Attachment) => (
        <Space size="small">
          <Tooltip title="预览">
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handlePreview(record)}
            />
          </Tooltip>
          <Tooltip title="下载">
            <Button
              type="link"
              size="small"
              icon={<DownloadOutlined />}
              onClick={() => handleDownload(record)}
            />
          </Tooltip>
          {record.status === 'normal' && (
            <Tooltip title="归档">
              <Popconfirm
                title="确定要归档此附件吗？"
                onConfirm={() => handleArchive(record)}
                okText="确定"
                cancelText="取消"
              >
                <Button type="link" size="small" icon={<SaveOutlined />} />
              </Popconfirm>
            </Tooltip>
          )}
          {record.status === 'archived' && (
            <Tooltip title="恢复">
              <Button
                type="link"
                size="small"
                icon={<UnlockOutlined />}
                onClick={() => handleRestore(record)}
              />
            </Tooltip>
          )}
          {record.status !== 'deleted' && (
            <Tooltip title="删除">
              <Popconfirm
                title="确定要删除此附件吗？"
                onConfirm={() => handleDelete(record)}
                okText="确定"
                cancelText="取消"
              >
                <Button type="link" size="small" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  const trendChartOption = statistics?.byMonth
    ? {
        tooltip: {
          trigger: 'axis',
          formatter: (params: any) => {
            const data = params[0];
            const size = statistics.byMonth.find(
              (m: any) =>
                m._id.year === data.data._id?.year &&
                m._id.month === data.data._id?.month,
            )?.size;
            return `${data.data._id?.year}-${String(data.data._id?.month).padStart(2, '0')}<br/>上传数量: ${data.value} 个<br/>总大小: ${formatFileSize(size || 0)}`;
          },
        },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: statistics.byMonth
            .slice()
            .reverse()
            .map((m: any) => `${m._id.year}-${String(m._id.month).padStart(2, '0')}`),
        },
        yAxis: { type: 'value' },
        series: [
          {
            name: '上传数量',
            type: 'line',
            smooth: true,
            areaStyle: {},
            data: statistics.byMonth.slice().reverse().map((m: any) => ({
              value: m.count,
              _id: m._id,
            })),
            itemStyle: { color: '#1890ff' },
          },
        ],
      }
    : null;

  const pieChartOption = statistics?.byType
    ? {
        tooltip: { trigger: 'item' },
        legend: { orient: 'vertical', left: 'left' },
        series: [
          {
            name: '附件类型',
            type: 'pie',
            radius: ['40%', '70%'],
            avoidLabelOverlap: false,
            label: { show: false },
            emphasis: {
              label: { show: true, fontSize: 16, fontWeight: 'bold' },
            },
            labelLine: { show: false },
            data: Object.entries(statistics.byType).map(([key, value]) => ({
              value,
              name: ATTACHMENT_TYPE_LABELS[key as AttachmentType] || key,
            })),
            color: ['#1890ff', '#52c41a', '#fa8c16', '#8c8c8c'],
          },
        ],
      }
    : null;

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title">附件管理</div>
        <Space>
          <Space.Compact>
            <Button
              type={viewMode === 'table' ? 'primary' : 'default'}
              onClick={() => setViewMode('table')}
              icon={<UnorderedListOutlined />}
            >
              列表
            </Button>
            <Button
              type={viewMode === 'card' ? 'primary' : 'default'}
              onClick={() => setViewMode('card')}
              icon={<FolderOutlined />}
            >
              卡片
            </Button>
          </Space.Compact>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setUploadModal(true)}
          >
            上传附件
          </Button>
        </Space>
      </div>

      {statistics && (
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="附件总数"
                value={statistics.total}
                prefix={<FolderOutlined style={{ color: '#1890ff' }} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title={ATTACHMENT_TYPE_LABELS.event_image}
                value={statistics.byType.event_image || 0}
                prefix={<FileImageOutlined style={{ color: '#1890ff' }} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title={ATTACHMENT_TYPE_LABELS.workorder_image}
                value={statistics.byType.workorder_image || 0}
                prefix={<AuditOutlined style={{ color: '#52c41a' }} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title={ATTACHMENT_TYPE_LABELS.inspection_material}
                value={statistics.byType.inspection_material || 0}
                prefix={<TeamOutlined style={{ color: '#fa8c16' }} />}
              />
            </Card>
          </Col>
        </Row>
      )}

      {trendChartOption && pieChartOption && (
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col xs={24} lg={16}>
            <Card title="近12个月上传趋势">
              <ReactECharts option={trendChartOption} style={{ height: 220 }} />
            </Card>
          </Col>
          <Col xs={24} lg={8}>
            <Card title="类型分布">
              <ReactECharts option={pieChartOption} style={{ height: 220 }} />
            </Card>
          </Col>
        </Row>
      )}

      <div className="filter-bar">
        <Space wrap>
          <Input
            placeholder="搜索文件名/编号/备注"
            style={{ width: 200 }}
            allowClear
            onChange={(e) => setFilters((f: any) => ({ ...f, keyword: e.target.value }))}
            onPressEnter={handleSearch}
            suffix={<SearchOutlined />}
          />
          <Select
            placeholder="附件类型"
            style={{ width: 140 }}
            allowClear
            onChange={(value) => setFilters((f: any) => ({ ...f, type: value }))}
          >
            {Object.entries(ATTACHMENT_TYPE_LABELS).map(([key, label]) => (
              <Option key={key} value={key}>
                {label}
              </Option>
            ))}
          </Select>
          <Select
            placeholder="状态"
            style={{ width: 120 }}
            allowClear
            onChange={(value) => setFilters((f: any) => ({ ...f, status: value }))}
          >
            {Object.entries(ATTACHMENT_STATUS_LABELS).map(([key, label]) => (
              <Option key={key} value={key}>
                {label}
              </Option>
            ))}
          </Select>
          <RangePicker
            showTime={{ format: 'HH:mm' }}
            format="YYYY-MM-DD HH:mm"
            placeholder={['开始时间', '结束时间']}
            onChange={(dates) => {
              setFilters((f: any) => ({
                ...f,
                startDate: dates?.[0]?.toISOString(),
                endDate: dates?.[1]?.toISOString(),
              }));
            }}
          />
          <Button type="primary" onClick={handleSearch} icon={<SearchOutlined />}>
            查询
          </Button>
          <Button onClick={() => {
            setFilters({});
            setPagination((p) => ({ ...p, current: 1 }));
          }}>
            重置
          </Button>
        </Space>
      </div>

      {selectedRowKeys.length > 0 && (
        <div style={{ marginBottom: 16, padding: '8px 16px', background: '#e6f7ff', borderRadius: 4 }}>
          <Space>
            <span>已选择 <strong>{selectedRowKeys.length}</strong> 项</span>
            <Popconfirm
              title={`确定要归档选中的 ${selectedRowKeys.length} 个附件吗？`}
              onConfirm={handleBatchArchive}
              okText="确定"
              cancelText="取消"
            >
              <Button icon={<SaveOutlined />} type="primary">
                批量归档
              </Button>
            </Popconfirm>
            <Button onClick={() => setSelectedRowKeys([])}>取消选择</Button>
          </Space>
        </div>
      )}

      {viewMode === 'table' ? (
        <Table
          columns={columns}
          dataSource={data}
          rowKey="_id"
          loading={loading}
          scroll={{ x: 1200 }}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
            getCheckboxProps: (record) => ({
              disabled: record.status !== 'normal',
            }),
          }}
          pagination={{
            ...pagination,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (page, pageSize) => setPagination({ current: page, pageSize }),
          }}
        />
      ) : (
        <Row gutter={[16, 16]}>
          {data.map((attachment, index) => (
            <Col xs={24} sm={12} md={8} lg={6} xl={6} key={attachment._id}>
              <Card
                hoverable
                style={{ height: '100%' }}
                cover={
                  <div
                    style={{
                      height: 160,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: '#f5f5f5',
                      cursor: 'pointer',
                      overflow: 'hidden',
                    }}
                    onClick={() => handlePreview(attachment, index)}
                  >
                    {isImage(attachment.mimeType) ? (
                      <Image
                        src={getAttachmentPreviewUrl(attachment._id)}
                        alt={attachment.originalName}
                        style={{ width: '100%', height: 160, objectFit: 'cover' }}
                        preview={false}
                      />
                    ) : (
                      <FileOutlined style={{ fontSize: 64, color: '#999' }} />
                    )}
                  </div>
                }
                actions={[
                  <Tooltip key="preview" title="预览">
                    <EyeOutlined onClick={() => handlePreview(attachment, index)} />
                  </Tooltip>,
                  <Tooltip key="download" title="下载">
                    <DownloadOutlined onClick={() => handleDownload(attachment)} />
                  </Tooltip>,
                  <Tooltip key={attachment.status === 'archived' ? 'restore' : 'archive'} title={attachment.status === 'archived' ? '恢复' : '归档'}>
                    {attachment.status === 'archived' ? (
                      <UnlockOutlined onClick={() => handleRestore(attachment)} />
                    ) : (
                      <Popconfirm
                        title="确定要归档此附件吗？"
                        onConfirm={() => handleArchive(attachment)}
                        okText="确定"
                        cancelText="取消"
                      >
                        <SaveOutlined />
                      </Popconfirm>
                    )}
                  </Tooltip>,
                  <Tooltip key="delete" title="删除">
                    <Popconfirm
                      title="确定要删除此附件吗？"
                      onConfirm={() => handleDelete(attachment)}
                      okText="确定"
                      cancelText="取消"
                    >
                      <DeleteOutlined style={{ color: '#ff4d4f' }} />
                    </Popconfirm>
                  </Tooltip>,
                ]}
              >
                <Card.Meta
                  title={
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {attachment.originalName}
                    </div>
                  }
                  description={
                    <Space direction="vertical" size={4} style={{ width: '100%' }}>
                      <Space size={4}>
                        <Tag color={ATTACHMENT_TYPE_COLORS[attachment.type]} style={{ margin: 0 }}>
                          {ATTACHMENT_TYPE_LABELS[attachment.type]}
                        </Tag>
                        <Tag color={ATTACHMENT_STATUS_COLORS[attachment.status]} style={{ margin: 0 }}>
                          {ATTACHMENT_STATUS_LABELS[attachment.status]}
                        </Tag>
                      </Space>
                      <div style={{ fontSize: 12, color: '#999' }}>
                        {formatFileSize(attachment.fileSize)}
                      </div>
                      <div style={{ fontSize: 12, color: '#999' }}>
                        {dayjs(attachment.createdAt).format('MM-DD HH:mm')}
                      </div>
                    </Space>
                  }
                />
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {viewMode === 'card' && (
        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <Space>
            <Button
              disabled={pagination.current <= 1}
              onClick={() => setPagination((p) => ({ ...p, current: p.current - 1 }))}
            >
              上一页
            </Button>
            <span>
              第 {pagination.current} / {Math.ceil(total / pagination.pageSize) || 1} 页
            </span>
            <Button
              disabled={pagination.current >= Math.ceil(total / pagination.pageSize)}
              onClick={() => setPagination((p) => ({ ...p, current: p.current + 1 }))}
            >
              下一页
            </Button>
          </Space>
        </div>
      )}

      <Modal
        title="上传附件"
        open={uploadModal}
        onCancel={() => setUploadModal(false)}
        footer={null}
        width={600}
        destroyOnClose
      >
        <AttachmentUpload
          mode="multiple"
          showForm={true}
          onUploadSuccess={handleUploadSuccess}
        />
      </Modal>

      <AttachmentPreview
        open={previewModal}
        attachments={previewAttachments}
        currentIndex={previewIndex}
        onClose={() => setPreviewModal(false)}
      />
    </div>
  );
};

export default AttachmentList;

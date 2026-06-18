import { useState, useEffect } from 'react';
import { Form, Input, Select, Button, Card, Row, Col, message, Space, Divider, Alert, Image, Tag, Tooltip, Empty, Modal } from 'antd';
import { ArrowLeftOutlined, WarningOutlined, InfoCircleOutlined, PlusOutlined, EyeOutlined, DeleteOutlined, FileImageOutlined, FolderOutlined } from '@ant-design/icons';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { reportException, createEventFromException, type Checkpoint, type InspectionTask, type InspectionException } from '../api/inspection';
import { useAuth } from '../context/AuthContext';
import type { Attachment } from '../types/attachment';
import { ATTACHMENT_TYPE_LABELS, ATTACHMENT_TYPE_COLORS, formatFileSize, isImage, getAttachmentPreviewUrl } from '../types/attachment';
import { getAttachmentsByRelated, updateAttachment } from '../api/attachment';
import AttachmentUpload from '../components/AttachmentUpload';
import AttachmentPreview from '../components/AttachmentPreview';

const { TextArea } = Input;
const { Option } = Select;

const InspectionExceptionReport = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [creatingEvent, setCreatingEvent] = useState(false);
  const [checkpoint, setCheckpoint] = useState<Checkpoint | null>(null);
  const [task, setTask] = useState<InspectionTask | null>(null);
  const [exceptionId, setExceptionId] = useState<string | null>(null);
  const [eventCreated, setEventCreated] = useState(false);

  const [exceptionAttachments, setExceptionAttachments] = useState<Attachment[]>([]);
  const [previewModal, setPreviewModal] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [uploadModal, setUploadModal] = useState(false);

  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    const state = location.state as any;
    if (state) {
      if (state.checkpoint) setCheckpoint(state.checkpoint);
      if (state.task) setTask(state.task);
      if (state.prefill) {
        form.setFieldsValue(state.prefill);
      }
    }
  }, [location]);

  useEffect(() => {
    if (exceptionId) {
      loadAttachments();
    }
  }, [exceptionId]);

  const loadAttachments = async () => {
    if (!exceptionId) return;
    try {
      const data: any = await getAttachmentsByRelated(exceptionId, 'InspectionException', 'inspection_material');
      setExceptionAttachments(data);
    } catch (error) {
      console.error('加载附件失败:', error);
    }
  };

  const categoryOptions = [
    { value: 'road', label: '道路设施' },
    { value: 'sanitation', label: '环境卫生' },
    { value: 'greening', label: '园林绿化' },
    { value: 'facility', label: '公共设施' },
    { value: 'noise', label: '噪声污染' },
    { value: 'water', label: '供排水' },
    { value: 'electricity', label: '电力设施' },
    { value: 'gas', label: '燃气设施' },
    { value: 'other', label: '其他' },
  ];

  const priorityOptions = [
    { value: 'low', label: '低' },
    { value: 'medium', label: '中' },
    { value: 'high', label: '高' },
    { value: 'urgent', label: '紧急' },
  ];

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const exceptionData: Partial<InspectionException> = {
        taskId: id!,
        planId: task?.planId || '',
        checkpointId: checkpoint?._id || '',
        checkpointName: checkpoint?.name || '',
        reporterId: user._id,
        reporterName: user.realName,
        title: values.title,
        description: values.description,
        category: values.category,
        priority: values.priority,
        address: checkpoint?.address || values.address,
        lng: checkpoint?.lng || values.lng,
        lat: checkpoint?.lat || values.lat,
        status: 'pending',
      };

      const result: any = await reportException(exceptionData);
      setExceptionId(result._id);
      message.success('异常上报成功');

      if (values.autoCreateEvent) {
        await handleCreateEvent(values, result._id);
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '上报失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (values: any, exceptionId: string) => {
    setCreatingEvent(true);
    try {
      const eventResult: any = await createEventFromException(exceptionId, {
        title: values.title,
        description: values.description,
        category: values.category,
        priority: values.priority,
        address: checkpoint?.address || values.address,
        lng: checkpoint?.lng || values.lng,
        lat: checkpoint?.lat || values.lat,
      });
      setEventCreated(true);
      message.success('事件已自动生成，可前往事件列表查看');

      setTimeout(() => {
        if (id) {
          navigate(`/inspection/tasks/${id}/checkin`);
        } else {
          navigate('/inspection');
        }
      }, 1500);
    } catch (error: any) {
      message.error(error.response?.data?.message || '生成事件失败');
    } finally {
      setCreatingEvent(false);
    }
  };

  const handleBackToCheckin = () => {
    if (id) {
      navigate(`/inspection/tasks/${id}/checkin`);
    } else {
      navigate('/inspection');
    }
  };

  const handleUploadSuccess = async (attachments: any[]) => {
    if (exceptionId && attachments.length > 0) {
      await Promise.all(
        attachments.map((att) =>
          updateAttachment(att._id, {
            type: 'inspection_material',
          })
        )
      );
      loadAttachments();
    }
    setUploadModal(false);
  };

  const handlePreview = (index: number) => {
    setPreviewIndex(index);
    setPreviewModal(true);
  };

  const handleRemoveAttachment = async (attId: string) => {
    try {
      await updateAttachment(attId, { type: 'other' });
      message.success('已移除');
      loadAttachments();
    } catch (error: any) {
      message.error(error.response?.data?.message || '移除失败');
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title">
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={handleBackToCheckin} />
            <span>异常上报</span>
          </Space>
        </div>
        <Space>
          <Button onClick={() => navigate('/attachments')}>
            <FolderOutlined /> 附件中心
          </Button>
          <Button onClick={handleBackToCheckin}>取消</Button>
        </Space>
      </div>

      {eventCreated && (
        <Alert
          message="事件已生成"
          description="异常上报成功，事件工单已自动创建，即将返回巡检页面..."
          type="success"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Row gutter={16}>
        <Col xs={24} lg={16}>
          <Card title="异常信息" loading={loading || creatingEvent}>
            {checkpoint && (
              <Alert
                message={`巡检点：${checkpoint.name}`}
                description={checkpoint.address}
                type="info"
                showIcon
                icon={<InfoCircleOutlined />}
                style={{ marginBottom: 24 }}
              />
            )}

            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              initialValues={{
                priority: 'medium',
                category: 'road',
                autoCreateEvent: true,
              }}
            >
              <Form.Item
                label="异常标题"
                name="title"
                rules={[{ required: true, message: '请输入异常标题' }]}
              >
                <Input placeholder="请简述异常情况" maxLength={100} />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="异常分类"
                    name="category"
                    rules={[{ required: true, message: '请选择异常分类' }]}
                  >
                    <Select placeholder="请选择异常分类">
                      {categoryOptions.map(item => (
                        <Option key={item.value} value={item.value}>{item.label}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="优先级"
                    name="priority"
                    rules={[{ required: true, message: '请选择优先级' }]}
                  >
                    <Select placeholder="请选择优先级">
                      {priorityOptions.map(item => (
                        <Option key={item.value} value={item.value}>{item.label}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              {!checkpoint && (
                <>
                  <Form.Item
                    label="事发地点"
                    name="address"
                    rules={[{ required: true, message: '请输入事发地点' }]}
                  >
                    <Input placeholder="请输入详细地址" />
                  </Form.Item>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item label="经度" name="lng">
                        <Input type="number" step="0.0001" placeholder="请输入经度（可选）" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label="纬度" name="lat">
                        <Input type="number" step="0.0001" placeholder="请输入纬度（可选）" />
                      </Form.Item>
                    </Col>
                  </Row>
                </>
              )}

              <Form.Item
                label="详细描述"
                name="description"
                rules={[{ required: true, message: '请输入详细描述' }]}
              >
                <TextArea rows={5} placeholder="请详细描述异常情况，包括问题现象、影响范围等" maxLength={500} />
              </Form.Item>

              <Form.Item>
                <Space>
                  <Button type="primary" htmlType="submit" loading={loading || creatingEvent} size="large">
                    {exceptionId ? '重新提交' : '提交上报'}
                  </Button>
                  <Button onClick={handleBackToCheckin} size="large">
                    返回巡检
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Card>

          {exceptionId && (
            <Card
              title={
                <Space>
                  <FileImageOutlined />
                  <span>核查材料/现场照片</span>
                  <Tag color={ATTACHMENT_TYPE_COLORS.inspection_material}>
                    {ATTACHMENT_TYPE_LABELS.inspection_material}
                  </Tag>
                  <span style={{ color: '#999', fontSize: 12 }}>已上传 {exceptionAttachments.length} 份</span>
                </Space>
              }
              style={{ marginTop: 16 }}
              extra={
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setUploadModal(true)}
                  size="small"
                >
                  添加材料
                </Button>
              }
            >
              {exceptionAttachments.length === 0 ? (
                <Empty
                  description="暂无核查材料，点击右上角按钮上传"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              ) : (
                <Row gutter={[16, 16]}>
                  {exceptionAttachments.map((att, index) => (
                    <Col xs={24} sm={12} md={8} lg={6} key={att._id}>
                      <div style={{
                        border: '1px solid #eee',
                        borderRadius: 4,
                        overflow: 'hidden',
                      }}>
                        <div
                          style={{
                            height: 140,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: '#f5f5f5',
                            cursor: 'pointer',
                          }}
                          onClick={() => handlePreview(index)}
                        >
                          {isImage(att.mimeType) ? (
                            <Image
                              src={getAttachmentPreviewUrl(att._id)}
                              alt={att.originalName}
                              preview={false}
                              style={{ width: '100%', height: 140, objectFit: 'cover' }}
                            />
                          ) : (
                            <FileImageOutlined style={{ fontSize: 48, color: '#999' }} />
                          )}
                        </div>
                        <div style={{
                          padding: '8px 12px',
                          background: '#fafafa',
                          borderTop: '1px solid #eee',
                        }}>
                          <div style={{
                            fontSize: 12,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            marginBottom: 4,
                          }} title={att.originalName}>
                            {att.originalName}
                          </div>
                          <Space size={4} style={{ fontSize: 11, color: '#999' }}>
                            <span>{formatFileSize(att.fileSize)}</span>
                            <Space style={{ marginLeft: 'auto' }}>
                              <Tooltip title="预览">
                                <Button
                                  type="text"
                                  size="small"
                                  icon={<EyeOutlined />}
                                  onClick={() => handlePreview(index)}
                                  style={{ padding: '0 4px', height: 'auto' }}
                                />
                              </Tooltip>
                              <Tooltip title="移除">
                                <Button
                                  type="text"
                                  size="small"
                                  danger
                                  icon={<DeleteOutlined />}
                                  onClick={() => handleRemoveAttachment(att._id)}
                                  style={{ padding: '0 4px', height: 'auto' }}
                                />
                              </Tooltip>
                            </Space>
                          </Space>
                        </div>
                      </div>
                    </Col>
                  ))}
                </Row>
              )}
            </Card>
          )}
        </Col>

        <Col xs={24} lg={8}>
          <Card title="上报须知">
            <div style={{ lineHeight: 2, fontSize: 13, color: '#666' }}>
              <p><strong>1. 异常分类说明：</strong></p>
              <ul style={{ paddingLeft: 20, marginBottom: 16 }}>
                <li>道路设施：路面破损、井盖缺失等</li>
                <li>环境卫生：垃圾堆放、污水溢流等</li>
                <li>园林绿化：树木倒伏、绿化带损坏等</li>
                <li>公共设施：路灯故障、座椅损坏等</li>
                <li>其他：未归类的其他问题</li>
              </ul>

              <p><strong>2. 优先级说明：</strong></p>
              <ul style={{ paddingLeft: 20, marginBottom: 16 }}>
                <li>低：不影响正常使用，可按计划处理</li>
                <li>中：影响部分功能，需尽快处理</li>
                <li>高：影响较大，需优先处理</li>
                <li>紧急：存在安全隐患，需立即处理</li>
              </ul>

              <p><strong>3. 注意事项：</strong></p>
              <ul style={{ paddingLeft: 20 }}>
                <li>请尽可能详细描述异常情况</li>
                <li>上传现场照片有助于问题处理</li>
                <li>自动生成的事件将进入工单流转</li>
                <li>如有人员伤亡请立即拨打急救电话</li>
              </ul>
            </div>
          </Card>

          <Card title="联动事件生成" style={{ marginTop: 16 }}>
            <Alert
              message=""
              description="上报异常后可自动生成事件工单，进入事件处理流程"
              type="warning"
              showIcon
              icon={<WarningOutlined />}
              style={{ marginBottom: 16 }}
            />
            <Form form={form} layout="vertical">
              <Form.Item
                name="autoCreateEvent"
                valuePropName="checked"
              >
                <Select>
                  <Option value={true}>上报后自动生成事件</Option>
                  <Option value={false}>仅上报异常，暂不生成事件</Option>
                </Select>
              </Form.Item>
            </Form>
          </Card>

          {task && (
            <Card title="任务信息" style={{ marginTop: 16 }}>
              <div style={{ lineHeight: 2, fontSize: 13 }}>
                <p><strong>任务名称：</strong>{task.planName}</p>
                <p><strong>负责人：</strong>{task.assigneeName}</p>
                <p><strong>计划日期：</strong>{task.scheduledDate}</p>
              </div>
            </Card>
          )}
        </Col>
      </Row>

      <AttachmentPreview
        open={previewModal}
        attachments={exceptionAttachments}
        currentIndex={previewIndex}
        onClose={() => setPreviewModal(false)}
      />

      <Modal
        title="上传核查材料"
        open={uploadModal}
        onCancel={() => setUploadModal(false)}
        footer={null}
        width={600}
        destroyOnClose
      >
        <AttachmentUpload
          mode="multiple"
          defaultType="inspection_material"
          showTypeSelect={false}
          showForm={false}
          relatedId={exceptionId!}
          relatedModel="InspectionException"
          onUploadSuccess={handleUploadSuccess}
          buttonText="上传材料"
        />
      </Modal>
    </div>
  );
};

export default InspectionExceptionReport;

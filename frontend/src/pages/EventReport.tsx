import { useState, useEffect } from 'react';
import { Form, Input, Select, Button, Card, message, Row, Col, Space, Image, Tag, Tooltip, Modal } from 'antd';
import { PlusOutlined, EyeOutlined, DeleteOutlined, FileImageOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { createEvent } from '../api/event';
import { useAuth } from '../context/AuthContext';
import type { Attachment } from '../types/attachment';
import { ATTACHMENT_TYPE_LABELS, ATTACHMENT_TYPE_COLORS, formatFileSize, isImage, getAttachmentPreviewUrl } from '../types/attachment';
import { getAttachmentsByRelated, updateAttachment } from '../api/attachment';
import { getDictionariesByType } from '../api/dictionary';
import AttachmentUpload from '../components/AttachmentUpload';
import AttachmentPreview from '../components/AttachmentPreview';

const { TextArea } = Input;
const { Option } = Select;

const EventReport = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [createdEventId, setCreatedEventId] = useState<string | null>(null);
  const [eventAttachments, setEventAttachments] = useState<Attachment[]>([]);
  const [previewModal, setPreviewModal] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [uploadModal, setUploadModal] = useState(false);
  const [categoryOptions, setCategoryOptions] = useState<any[]>([]);
  const [priorityOptions, setPriorityOptions] = useState<any[]>([]);
  const [sourceOptions, setSourceOptions] = useState<any[]>([]);
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuth();

  useEffect(() => {
    if (isLoggedIn && user) {
      form.setFieldsValue({
        reporterName: user.realName,
        reporterPhone: user.phone,
      });
    }
  }, [isLoggedIn, user, form]);

  useEffect(() => {
    loadDictionaries();
  }, []);

  const loadDictionaries = async () => {
    try {
      const [categories, priorities, sources] = await Promise.all([
        getDictionariesByType('event_category'),
        getDictionariesByType('event_priority'),
        getDictionariesByType('source_channel'),
      ]);
      setCategoryOptions(categories as any[]);
      setPriorityOptions(priorities as any[]);
      setSourceOptions(sources as any[]);
      
      if (categories.length > 0) {
        form.setFieldsValue({ category: categories[0].code });
      }
      if (priorities.length > 0) {
        const defaultPriority = priorities.find((p: any) => p.code === 'medium') || priorities[0];
        form.setFieldsValue({ priority: defaultPriority.code });
      }
    } catch (error) {
      console.error('加载字典数据失败:', error);
    }
  };

  useEffect(() => {
    if (createdEventId) {
      loadAttachments();
    }
  }, [createdEventId]);

  const loadAttachments = async () => {
    if (!createdEventId) return;
    try {
      const data: any = await getAttachmentsByRelated(createdEventId, 'Event', 'event_image');
      setEventAttachments(data);
    } catch (error) {
      console.error('加载附件失败:', error);
    }
  };

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const sourceItem = sourceOptions.find((s: any) => 
        isLoggedIn ? s.code === 'staff' : s.code === 'citizen'
      );
      const data = {
        ...values,
        lng: 121.4737 + Math.random() * 0.1 - 0.05,
        lat: 31.2304 + Math.random() * 0.1 - 0.05,
        source: sourceItem ? sourceItem.code : (isLoggedIn ? 'staff' : 'citizen'),
        reporterId: user?._id,
      };
      const result: any = await createEvent(data);
      setCreatedEventId(result._id);
      message.success(isLoggedIn ? '事件上报成功，可前往事件列表派单' : '事件上报成功，感谢您的反馈！');
      if (isLoggedIn) {
        navigate('/events/list');
      } else {
        form.resetFields();
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '上报失败');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSuccess = async (attachments: any[]) => {
    if (createdEventId && attachments.length > 0) {
      await Promise.all(
        attachments.map((att) =>
          updateAttachment(att._id, {
            type: 'event_image',
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

  const handleDeleteAttachment = async (id: string) => {
    try {
      await updateAttachment(id, { type: 'other' });
      message.success('已从事件移除');
      loadAttachments();
    } catch (error: any) {
      message.error(error.response?.data?.message || '移除失败');
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title">事件上报</div>
        <Space>
          <Button onClick={() => navigate('/events/list')}>查看列表</Button>
          <Button onClick={() => navigate('/attachments')}>附件中心</Button>
        </Space>
      </div>

      <Card title="上报信息">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="事件标题"
                name="title"
                rules={[{ required: true, message: '请输入事件标题' }]}
              >
                <Input placeholder="请简述事件情况" maxLength={100} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="事件分类"
                name="category"
                rules={[{ required: true, message: '请选择事件分类' }]}
              >
                <Select placeholder="请选择事件分类">
                  {categoryOptions.map(item => (
                    <Option key={item.code} value={item.code}>
                      <Space>
                        {item.color && (
                          <span
                            style={{
                              display: 'inline-block',
                              width: 10,
                              height: 10,
                              borderRadius: '50%',
                              backgroundColor: item.color,
                            }}
                          />
                        )}
                        {item.name}
                      </Space>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="优先级"
                name="priority"
                rules={[{ required: true, message: '请选择优先级' }]}
              >
                <Select placeholder="请选择优先级">
                  {priorityOptions.map(item => (
                    <Option key={item.code} value={item.code}>
                      <Space>
                        {item.color && (
                          <span
                            style={{
                              display: 'inline-block',
                              width: 10,
                              height: 10,
                              borderRadius: '50%',
                              backgroundColor: item.color,
                            }}
                          />
                        )}
                        {item.name}
                      </Space>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="事发地点"
                name="address"
                rules={[{ required: true, message: '请输入事发地点' }]}
              >
                <Input placeholder="请输入详细地址" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="详细描述"
            name="description"
            rules={[{ required: true, message: '请输入详细描述' }]}
          >
            <TextArea rows={4} placeholder="请详细描述事件情况" maxLength={500} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="上报人姓名" name="reporterName">
                <Input placeholder="请输入上报人姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="联系电话" name="reporterPhone">
                <Input placeholder="请输入联系电话" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} size="large">
              {createdEventId ? '继续补充信息' : '提交上报'}
            </Button>
            <Button style={{ marginLeft: 16 }} onClick={() => form.resetFields()}>
              重置
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {createdEventId && (
        <Card
          title={
            <Space>
              <FileImageOutlined />
              <span>现场照片</span>
              <Tag color={ATTACHMENT_TYPE_COLORS.event_image}>
                {ATTACHMENT_TYPE_LABELS.event_image}
              </Tag>
              <span style={{ color: '#999', fontSize: 12 }}>已上传 {eventAttachments.length} 张</span>
            </Space>
          }
          style={{ marginTop: 16 }}
          extra={
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setUploadModal(true)}
            >
              添加照片
            </Button>
          }
        >
          {eventAttachments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
              <FileImageOutlined style={{ fontSize: 48, marginBottom: 12 }} />
              <p>暂无现场照片，点击右上角按钮上传</p>
            </div>
          ) : (
            <Row gutter={[16, 16]}>
              {eventAttachments.map((att, index) => (
                <Col xs={24} sm={12} md={8} lg={6} key={att._id}>
                  <div style={{
                    position: 'relative',
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
                        color: '#333',
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
                              onClick={() => handleDeleteAttachment(att._id)}
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

      <AttachmentPreview
        open={previewModal}
        attachments={eventAttachments}
        currentIndex={previewIndex}
        onClose={() => setPreviewModal(false)}
      />

      <Modal
        title="上传事件照片"
        open={uploadModal}
        onCancel={() => setUploadModal(false)}
        footer={null}
        width={600}
        destroyOnClose
      >
        <AttachmentUpload
          mode="multiple"
          defaultType="event_image"
          showTypeSelect={false}
          showForm={false}
          relatedId={createdEventId!}
          relatedModel="Event"
          onUploadSuccess={handleUploadSuccess}
          buttonText="上传照片"
          accept="image/*"
        />
      </Modal>
    </div>
  );
};

export default EventReport;

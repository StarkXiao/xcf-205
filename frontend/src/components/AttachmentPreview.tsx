import { useState, useEffect } from 'react';
import {
  Modal,
  Image,
  Empty,
  Spin,
  Descriptions,
  Tag,
  Button,
  Space,
  Tabs,
} from 'antd';
import {
  DownloadOutlined,
  LeftOutlined,
  RightOutlined,
  EyeOutlined,
  FileOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  FileZipOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import type { Attachment } from '../types/attachment';
import {
  ATTACHMENT_TYPE_LABELS,
  ATTACHMENT_TYPE_COLORS,
  ATTACHMENT_STATUS_LABELS,
  ATTACHMENT_STATUS_COLORS,
  formatFileSize,
  isImage,
  isPdf,
  getPreviewUrl,
  getDownloadUrl,
} from '../types/attachment';

interface AttachmentPreviewProps {
  open: boolean;
  attachments: Attachment[];
  currentIndex?: number;
  onClose: () => void;
  showInfo?: boolean;
  showDownload?: boolean;
}

const AttachmentPreview = ({
  open,
  attachments,
  currentIndex = 0,
  onClose,
  showInfo = true,
  showDownload = true,
}: AttachmentPreviewProps) => {
  const [activeIndex, setActiveIndex] = useState(currentIndex);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setActiveIndex(currentIndex);
  }, [currentIndex, open]);

  const current = attachments[activeIndex];

  const getFileIcon = (mimeType: string) => {
    if (isImage(mimeType)) return <EyeOutlined style={{ fontSize: 64, color: '#1890ff' }} />;
    if (isPdf(mimeType)) return <FilePdfOutlined style={{ fontSize: 64, color: '#f5222d' }} />;
    if (mimeType.includes('word')) return <FileWordOutlined style={{ fontSize: 64, color: '#1890ff' }} />;
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return <FileExcelOutlined style={{ fontSize: 64, color: '#52c41a' }} />;
    if (mimeType.includes('zip') || mimeType.includes('rar')) return <FileZipOutlined style={{ fontSize: 64, color: '#fa8c16' }} />;
    if (mimeType.includes('text')) return <FileTextOutlined style={{ fontSize: 64, color: '#8c8c8c' }} />;
    return <FileOutlined style={{ fontSize: 64, color: '#8c8c8c' }} />;
  };

  const renderPreview = (attachment: Attachment) => {
    if (!attachment) return <Empty description="暂无附件" />;

    if (isImage(attachment.mimeType)) {
      return (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 400,
          background: '#f5f5f5',
          position: 'relative',
        }}>
          <Image
            src={getPreviewUrl(attachment._id)}
            alt={attachment.originalName}
            style={{ maxHeight: '60vh', maxWidth: '100%' }}
            preview={false}
            onLoad={() => setLoading(false)}
          />
        </div>
      );
    }

    if (isPdf(attachment.mimeType)) {
      return (
        <div style={{ minHeight: 600, background: '#f5f5f5' }}>
          <iframe
            src={getPreviewUrl(attachment._id)}
            style={{ width: '100%', height: '60vh', border: 'none' }}
            title={attachment.originalName}
          />
        </div>
      );
    }

    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 400,
        background: '#f5f5f5',
        padding: 40,
      }}>
        {getFileIcon(attachment.mimeType)}
        <h3 style={{ marginTop: 24, color: '#333' }}>{attachment.originalName}</h3>
        <p style={{ color: '#666', marginTop: 8 }}>
          {formatFileSize(attachment.fileSize)} | {attachment.mimeType}
        </p>
        <Button
          type="primary"
          icon={<DownloadOutlined />}
          style={{ marginTop: 24 }}
          onClick={() => window.open(getDownloadUrl(attachment._id))}
        >
          下载文件
        </Button>
      </div>
    );
  };

  const handleDownload = (attachment: Attachment) => {
    window.open(getDownloadUrl(attachment._id));
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : attachments.length - 1));
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev < attachments.length - 1 ? prev + 1 : 0));
  };

  const renderTabBar = () => null;

  return (
    <Modal
      open={open}
      title={
        attachments.length > 1
          ? `附件预览 (${activeIndex + 1}/${attachments.length})`
          : '附件预览'
      }
      onCancel={onClose}
      width={900}
      footer={
        <Space>
          {showDownload && current && (
            <Button
              icon={<DownloadOutlined />}
              onClick={() => handleDownload(current)}
            >
              下载
            </Button>
          )}
          <Button onClick={onClose}>关闭</Button>
        </Space>
      }
    >
      <Spin spinning={loading}>
        {attachments.length === 0 ? (
          <Empty description="暂无附件" />
        ) : (
          <div>
            {attachments.length > 1 && (
              <div style={{ position: 'relative', marginBottom: 16 }}>
                <Button
                  icon={<LeftOutlined />}
                  onClick={handlePrev}
                  style={{
                    position: 'absolute',
                    left: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: 10,
                  }}
                  shape="circle"
                />
                <Button
                  icon={<RightOutlined />}
                  onClick={handleNext}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: 10,
                  }}
                  shape="circle"
                />
              </div>
            )}

            <Tabs
              activeKey={String(activeIndex)}
              onChange={(key) => setActiveIndex(Number(key))}
              renderTabBar={renderTabBar}
            >
              {attachments.map((attachment, index) => (
                <Tabs.TabPane key={index} tab="">
                  {renderPreview(attachment)}
                </Tabs.TabPane>
              ))}
            </Tabs>

            {attachments.length > 1 && (
              <div style={{
                display: 'flex',
                gap: 8,
                overflowX: 'auto',
                padding: '12px 0',
                marginTop: 16,
                borderTop: '1px solid #eee',
              }}>
                {attachments.map((attachment, index) => (
                  <div
                    key={attachment._id}
                    onClick={() => setActiveIndex(index)}
                    style={{
                      flex: '0 0 auto',
                      width: 80,
                      height: 80,
                      border: index === activeIndex ? '2px solid #1890ff' : '1px solid #ddd',
                      borderRadius: 4,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      background: '#fafafa',
                    }}
                  >
                    {isImage(attachment.mimeType) ? (
                      <img
                        src={getPreviewUrl(attachment._id)}
                        alt={attachment.originalName}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{ fontSize: 24, color: '#999' }}>
                        {getFileIcon(attachment.mimeType)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {showInfo && current && (
              <div style={{ marginTop: 16, padding: 16, background: '#fafafa', borderRadius: 4 }}>
                <Descriptions column={2} size="small" bordered>
                  <Descriptions.Item label="文件名称" span={2}>
                    {current.originalName}
                  </Descriptions.Item>
                  <Descriptions.Item label="附件类型">
                    <Tag color={ATTACHMENT_TYPE_COLORS[current.type]}>
                      {ATTACHMENT_TYPE_LABELS[current.type]}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="状态">
                    <Tag color={ATTACHMENT_STATUS_COLORS[current.status]}>
                      {ATTACHMENT_STATUS_LABELS[current.status]}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="文件大小">{formatFileSize(current.fileSize)}</Descriptions.Item>
                  <Descriptions.Item label="文件类型">{current.mimeType}</Descriptions.Item>
                  <Descriptions.Item label="上传人">{current.uploadedByName || '-'}</Descriptions.Item>
                  <Descriptions.Item label="关联编号">{current.relatedNo || '-'}</Descriptions.Item>
                  <Descriptions.Item label="标签" span={2}>
                    {current.tags && current.tags.length > 0 ? (
                      <Space>
                        {current.tags.map((tag) => (
                          <Tag key={tag} color="blue">{tag}</Tag>
                        ))}
                      </Space>
                    ) : (
                      '-'
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="备注说明" span={2}>
                    {current.description || '-'}
                  </Descriptions.Item>
                </Descriptions>
              </div>
            )}
          </div>
        )}
      </Spin>
    </Modal>
  );
};

export default AttachmentPreview;

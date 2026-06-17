import { useState } from 'react';
import { Upload, Button, Space, message, Form, Input, Select } from 'antd';
import {
  UploadOutlined,
  InboxOutlined,
  PlusOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';
import {
  uploadAttachment,
  uploadAttachments,
} from '../api/attachment';
import type { AttachmentType } from '../types/attachment';
import { ATTACHMENT_TYPE_LABELS } from '../types/attachment';

const { Option } = Select;
const { Dragger } = Upload;
const { TextArea } = Input;

interface AttachmentUploadProps {
  mode?: 'single' | 'multiple';
  maxCount?: number;
  defaultType?: AttachmentType;
  showTypeSelect?: boolean;
  relatedId?: string;
  relatedModel?: string;
  relatedNo?: string;
  onUploadSuccess?: (attachments: any[]) => void;
  buttonText?: string;
  accept?: string;
  size?: 'large' | 'middle' | 'small';
  showForm?: boolean;
}

const AttachmentUpload = ({
  mode = 'multiple',
  maxCount = 20,
  defaultType = 'other',
  showTypeSelect = true,
  relatedId,
  relatedModel,
  relatedNo,
  onUploadSuccess,
  buttonText = '上传附件',
  accept,
  size = 'middle',
  showForm = true,
}: AttachmentUploadProps) => {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [form] = Form.useForm();

  const beforeUpload = (file: UploadFile) => {
    const isLt50M = (file.size || 0) / 1024 / 1024 < 50;
    if (!isLt50M) {
      message.error('文件大小不能超过 50MB!');
      return Upload.LIST_IGNORE;
    }
    setFileList((prev) => [...prev, file]);
    return false;
  };

  const handleRemove = (file: UploadFile) => {
    setFileList((prev) => prev.filter((f) => f.uid !== file.uid));
  };

  const handleUpload = async () => {
    if (fileList.length === 0) {
      message.warning('请先选择文件');
      return;
    }

    try {
      const values = showForm ? await form.validateFields() : {};
      setUploading(true);

      const type = values.type || defaultType;
      const tags = values.tags || [];
      const description = values.description;

      const files = fileList
        .filter((f) => f.originFileObj)
        .map((f) => f.originFileObj as File);

      let result: any;
      if (mode === 'single' || files.length === 1) {
        const uploaded = await uploadAttachment(files[0], {
          type,
          relatedId,
          relatedModel,
          relatedNo,
          description,
          tags,
        });
        result = [uploaded];
      } else {
        result = await uploadAttachments(files, {
          type,
          relatedId,
          relatedModel,
          relatedNo,
          description,
          tags,
        });
      }

      message.success(`成功上传 ${result.length} 个文件`);
      setFileList([]);
      if (showForm) {
        form.resetFields();
        form.setFieldsValue({ type: defaultType });
      }
      if (onUploadSuccess) {
        onUploadSuccess(result);
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '上传失败');
    } finally {
      setUploading(false);
    }
  };

  const uploadProps: UploadProps = {
    multiple: mode === 'multiple',
    maxCount: mode === 'multiple' ? maxCount : 1,
    fileList,
    beforeUpload,
    onRemove: handleRemove,
    accept,
    showUploadList: {
      showDownloadIcon: false,
      showPreviewIcon: false,
      showRemoveIcon: true,
    },
  };

  const uploadButton = (
    <div>
      <PlusOutlined />
      <div style={{ marginTop: 8 }}>选择文件</div>
    </div>
  );

  return (
    <div className="attachment-upload">
      <Form form={form} layout="vertical">
        {showForm && (
          <Space direction="vertical" style={{ width: '100%', marginBottom: 16 }}>
            {showTypeSelect && (
              <Form.Item
                label="附件类型"
                name="type"
                initialValue={defaultType}
                rules={[{ required: true, message: '请选择附件类型' }]}
                style={{ marginBottom: 8 }}
              >
                <Select placeholder="请选择附件类型">
                  {Object.entries(ATTACHMENT_TYPE_LABELS).map(([key, label]) => (
                    <Option key={key} value={key}>
                      {label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            )}
            <Form.Item label="标签" name="tags" style={{ marginBottom: 8 }}>
              <Select
                mode="tags"
                placeholder="输入标签后回车添加"
                tokenSeparators={[',']}
                style={{ width: '100%' }}
              />
            </Form.Item>
            <Form.Item label="备注说明" name="description" style={{ marginBottom: 8 }}>
              <TextArea rows={2} placeholder="请输入备注说明（选填）" maxLength={200} showCount />
            </Form.Item>
          </Space>
        )}

        {mode === 'single' ? (
          <Upload
            {...uploadProps}
            listType="picture-card"
            style={{ width: '100%' }}
          >
            {fileList.length >= 1 ? null : uploadButton}
          </Upload>
        ) : (
          <Dragger {...uploadProps} style={{ marginBottom: 16 }}>
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
            <p className="ant-upload-hint">
              支持单个或批量上传，文件大小不超过 50MB，支持图片、PDF、Word、Excel、TXT、ZIP 等格式
            </p>
          </Dragger>
        )}

        <Space>
          <Button
            type="primary"
            icon={<UploadOutlined />}
            loading={uploading}
            onClick={handleUpload}
            disabled={fileList.length === 0}
            size={size}
          >
            {buttonText}
          </Button>
          {fileList.length > 0 && (
            <Button
              icon={<CloseOutlined />}
              onClick={() => setFileList([])}
              size={size}
            >
              清空列表
            </Button>
          )}
          {fileList.length > 0 && (
            <span style={{ color: '#666' }}>
              已选择 {fileList.length} 个文件
            </span>
          )}
        </Space>
      </Form>
    </div>
  );
};

export default AttachmentUpload;

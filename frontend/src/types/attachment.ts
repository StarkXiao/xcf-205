export type AttachmentType = 'event_image' | 'workorder_image' | 'inspection_material' | 'other';

export type AttachmentStatus = 'normal' | 'archived' | 'deleted';

export interface Attachment {
  _id: string;
  originalName: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  type: AttachmentType;
  status: AttachmentStatus;
  relatedId?: string;
  relatedModel?: string;
  relatedNo?: string;
  description?: string;
  tags: string[];
  uploadedBy?: string;
  uploadedByName?: string;
  archivedBy?: string;
  archivedByName?: string;
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AttachmentStatistics {
  total: number;
  byType: Record<AttachmentType, number>;
  byStatus: Record<AttachmentStatus, number>;
  byMonth: Array<{
    _id: { year: number; month: number };
    count: number;
    size: number;
  }>;
}

export const ATTACHMENT_TYPE_LABELS: Record<AttachmentType, string> = {
  event_image: '事件图片',
  workorder_image: '工单处理图片',
  inspection_material: '核查材料',
  other: '其他附件',
};

export const ATTACHMENT_TYPE_COLORS: Record<AttachmentType, string> = {
  event_image: 'blue',
  workorder_image: 'green',
  inspection_material: 'orange',
  other: 'default',
};

export const ATTACHMENT_STATUS_LABELS: Record<AttachmentStatus, string> = {
  normal: '正常',
  archived: '已归档',
  deleted: '已删除',
};

export const ATTACHMENT_STATUS_COLORS: Record<AttachmentStatus, string> = {
  normal: 'green',
  archived: 'blue',
  deleted: 'red',
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const isImage = (mimeType: string): boolean => {
  return mimeType.startsWith('image/');
};

export const isPdf = (mimeType: string): boolean => {
  return mimeType === 'application/pdf';
};

export const getPreviewUrl = (id: string): string => {
  return `/api/attachments/preview/${id}`;
};

export const getAttachmentPreviewUrl = getPreviewUrl;

export const getDownloadUrl = (id: string): string => {
  return `/api/attachments/download/${id}`;
};

export const getAttachmentDownloadUrl = getDownloadUrl;

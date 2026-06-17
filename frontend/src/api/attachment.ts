import request from '../utils/request';
import type { AttachmentType } from '../types/attachment';

export const getAttachments = (params?: any) => {
  return request.get('/attachments', { params });
};

export const getAttachment = (id: string) => {
  return request.get(`/attachments/${id}`);
};

export const getAttachmentsByRelated = (
  relatedId: string,
  relatedModel?: string,
  type?: AttachmentType,
) => {
  return request.get(`/attachments/related/${relatedId}`, {
    params: { relatedModel, type },
  });
};

export const getAttachmentStatistics = () => {
  return request.get('/attachments/statistics');
};

export const uploadAttachment = (
  file: File,
  options?: {
    type?: AttachmentType;
    relatedId?: string;
    relatedModel?: string;
    relatedNo?: string;
    description?: string;
    tags?: string[];
  },
) => {
  const formData = new FormData();
  formData.append('file', file);
  if (options?.type) formData.append('type', options.type);
  if (options?.relatedId) formData.append('relatedId', options.relatedId);
  if (options?.relatedModel) formData.append('relatedModel', options.relatedModel);
  if (options?.relatedNo) formData.append('relatedNo', options.relatedNo);
  if (options?.description) formData.append('description', options.description);
  if (options?.tags) formData.append('tags', options.tags.join(','));

  return request.post('/attachments/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const uploadAttachments = (
  files: File[],
  options?: {
    type?: AttachmentType;
    relatedId?: string;
    relatedModel?: string;
    relatedNo?: string;
    description?: string;
    tags?: string[];
  },
) => {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));
  if (options?.type) formData.append('type', options.type);
  if (options?.relatedId) formData.append('relatedId', options.relatedId);
  if (options?.relatedModel) formData.append('relatedModel', options.relatedModel);
  if (options?.relatedNo) formData.append('relatedNo', options.relatedNo);
  if (options?.description) formData.append('description', options.description);
  if (options?.tags) formData.append('tags', options.tags.join(','));

  return request.post('/attachments/upload-multiple', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const updateAttachment = (
  id: string,
  data: {
    originalName?: string;
    description?: string;
    tags?: string[];
    type?: AttachmentType;
  },
) => {
  return request.put(`/attachments/${id}`, data);
};

export const archiveAttachment = (id: string) => {
  return request.put(`/attachments/${id}/archive`);
};

export const batchArchiveAttachments = (ids: string[]) => {
  return request.put('/attachments/batch-archive', { ids });
};

export const restoreAttachment = (id: string) => {
  return request.put(`/attachments/${id}/restore`);
};

export const deleteAttachment = (id: string, permanent = false) => {
  return request.delete(`/attachments/${id}`, {
    params: { permanent: permanent ? 'true' : 'false' },
  });
};

export const getAttachmentPreviewUrl = (id: string) => {
  return `/api/attachments/preview/${id}`;
};

export const getAttachmentDownloadUrl = (id: string) => {
  return `/api/attachments/download/${id}`;
};

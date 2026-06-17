import request from '../utils/request';

export const getApprovalFlows = (params?: any) => {
  return request.get('/approvals/flows', { params });
};

export const getApprovalFlow = (id: string) => {
  return request.get(`/approvals/flows/${id}`);
};

export const getApprovalFlowByType = (type: string) => {
  return request.get(`/approvals/flows/type/${type}`);
};

export const createApprovalFlow = (data: any) => {
  return request.post('/approvals/flows', data);
};

export const updateApprovalFlow = (id: string, data: any) => {
  return request.put(`/approvals/flows/${id}`, data);
};

export const deleteApprovalFlow = (id: string) => {
  return request.delete(`/approvals/flows/${id}`);
};

export const getApprovalInstances = (params?: any) => {
  return request.get('/approvals/instances', { params });
};

export const getApprovalInstance = (id: string) => {
  return request.get(`/approvals/instances/${id}`);
};

export const getApprovalPendingCount = (approverId: string) => {
  return request.get('/approvals/instances/pending-count', { params: { approverId } });
};

export const submitApproval = (data: any) => {
  return request.post('/approvals/instances', data);
};

export const approveApproval = (id: string, data: any) => {
  return request.put(`/approvals/instances/${id}/approve`, data);
};

export const rejectApproval = (id: string, data: any) => {
  return request.put(`/approvals/instances/${id}/reject`, data);
};

export const cancelApproval = (id: string, data: any) => {
  return request.put(`/approvals/instances/${id}/cancel`, data);
};

export const getApprovalLogs = (id: string) => {
  return request.get(`/approvals/instances/${id}/logs`);
};

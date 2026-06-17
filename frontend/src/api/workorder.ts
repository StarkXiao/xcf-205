import request from '../utils/request';

export const getWorkOrders = (params?: any) => {
  return request.get('/workorders', { params });
};

export const getWorkOrder = (id: string) => {
  return request.get(`/workorders/${id}`);
};

export const createWorkOrder = (data: any) => {
  return request.post('/workorders', data);
};

export const updateWorkOrder = (id: string, data: any) => {
  return request.put(`/workorders/${id}`, data);
};

export const deleteWorkOrder = (id: string) => {
  return request.delete(`/workorders/${id}`);
};

export const assignWorkOrder = (id: string, data: any) => {
  return request.put(`/workorders/${id}/assign`, data);
};

export const startWorkOrder = (id: string, data: any) => {
  return request.put(`/workorders/${id}/start`, data);
};

export const completeWorkOrder = (id: string, data: any) => {
  return request.put(`/workorders/${id}/complete`, data);
};

export const verifyWorkOrder = (id: string, data: any) => {
  return request.put(`/workorders/${id}/verify`, data);
};

export const closeWorkOrder = (id: string, data: any) => {
  return request.put(`/workorders/${id}/close`, data);
};

export const getWorkOrderLogs = (id: string) => {
  return request.get(`/workorders/${id}/logs`);
};

export const getWorkOrderStatistics = () => {
  return request.get('/workorders/statistics');
};

export const getDepartmentStats = () => {
  return request.get('/workorders/department-stats');
};

export const getWorkOrderTrend = (days?: number) => {
  return request.get('/workorders/trend', { params: { days } });
};

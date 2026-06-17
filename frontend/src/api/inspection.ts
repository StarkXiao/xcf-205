import request from '../utils/request';

export interface Checkpoint {
  _id?: string;
  name: string;
  address: string;
  lng: number;
  lat: number;
  order: number;
  radius?: number;
}

export interface InspectionPlan {
  _id?: string;
  name: string;
  description?: string;
  type: 'daily' | 'weekly' | 'monthly' | 'temporary';
  frequency?: string;
  checkpoints: Checkpoint[];
  assigneeIds: string[];
  assigneeNames?: string[];
  startDate: string;
  endDate?: string;
  startTime: string;
  endTime: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  createdBy?: string;
  createdByName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface InspectionTask {
  _id?: string;
  planId: string;
  planName: string;
  assigneeId: string;
  assigneeName: string;
  checkpoints: Checkpoint[];
  checkinRecords: CheckinRecord[];
  status: 'pending' | 'in_progress' | 'completed' | 'exception';
  scheduledDate: string;
  startTime?: string;
  endTime?: string;
  actualStartTime?: string;
  actualEndTime?: string;
  exceptionCount?: number;
  createdAt?: string;
}

export interface CheckinRecord {
  _id?: string;
  checkpointId: string;
  checkpointName: string;
  checkinTime: string;
  lng: number;
  lat: number;
  status: 'normal' | 'abnormal' | 'skipped';
  remark?: string;
  images?: string[];
}

export interface InspectionException {
  _id?: string;
  taskId: string;
  planId: string;
  checkpointId: string;
  checkpointName: string;
  reporterId: string;
  reporterName: string;
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  address: string;
  lng: number;
  lat: number;
  images?: string[];
  eventId?: string;
  status: 'pending' | 'processed' | 'closed';
  createdAt?: string;
}

export const getInspectionPlans = (params?: any) => {
  return request.get('/inspection/plans', { params });
};

export const getInspectionPlan = (id: string) => {
  return request.get(`/inspection/plans/${id}`);
};

export const createInspectionPlan = (data: Partial<InspectionPlan>) => {
  return request.post('/inspection/plans', data);
};

export const updateInspectionPlan = (id: string, data: Partial<InspectionPlan>) => {
  return request.put(`/inspection/plans/${id}`, data);
};

export const deleteInspectionPlan = (id: string) => {
  return request.delete(`/inspection/plans/${id}`);
};

export const getInspectionTasks = (params?: any) => {
  return request.get('/inspection/tasks', { params });
};

export const getInspectionTask = (id: string) => {
  return request.get(`/inspection/tasks/${id}`);
};

export const startInspectionTask = (id: string) => {
  return request.put(`/inspection/tasks/${id}/start`);
};

export const checkin = (taskId: string, data: Partial<CheckinRecord>) => {
  return request.post(`/inspection/tasks/${taskId}/checkin`, data);
};

export const completeInspectionTask = (id: string) => {
  return request.put(`/inspection/tasks/${id}/complete`);
};

export const reportException = (data: Partial<InspectionException>) => {
  return request.post('/inspection/exceptions', data);
};

export const createEventFromException = (exceptionId: string, data: any) => {
  return request.post(`/inspection/exceptions/${exceptionId}/create-event`, data);
};

export const getInspectionExceptions = (params?: any) => {
  return request.get('/inspection/exceptions', { params });
};

export const getInspectionStatistics = () => {
  return request.get('/inspection/statistics');
};

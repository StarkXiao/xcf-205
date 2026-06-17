import request from '../utils/request';

export const getDepartmentRanking = (year: number, month: number) => {
  return request.get('/performance/ranking', { params: { year, month } });
};

export const getMonthlySummary = (year: number, month: number) => {
  return request.get('/performance/summary', { params: { year, month } });
};

export const getWorkOrderDetailReport = (year: number, month: number, department?: string) => {
  const params: any = { year, month };
  if (department) params.department = department;
  return request.get('/performance/workorders', { params });
};

export const getEventDetailReport = (year: number, month: number, department?: string) => {
  const params: any = { year, month };
  if (department) params.department = department;
  return request.get('/performance/events', { params });
};

export const getInspectionDetailReport = (year: number, month: number, department?: string) => {
  const params: any = { year, month };
  if (department) params.department = department;
  return request.get('/performance/inspections', { params });
};

export const getDepartmentList = () => {
  return request.get('/performance/departments');
};

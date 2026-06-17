import request from '../utils/request';

export const getOverview = () => {
  return request.get('/statistics/overview');
};

export const getEventCategoryStats = () => {
  return request.get('/statistics/event-category');
};

export const getEventStatusStats = () => {
  return request.get('/statistics/event-status');
};

export const getWorkOrderStatusStats = () => {
  return request.get('/statistics/workorder-status');
};

export const getTrend = (days?: number) => {
  return request.get('/statistics/trend', { params: { days } });
};

export const getDepartmentStats = () => {
  return request.get('/statistics/department');
};

export const getPriorityStats = () => {
  return request.get('/statistics/priority');
};

export const getHandlerRanking = () => {
  return request.get('/statistics/handler-ranking');
};

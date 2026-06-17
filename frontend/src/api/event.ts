import request from '../utils/request';

export const getEvents = (params?: any) => {
  return request.get('/events', { params });
};

export const getEventsForMap = (params?: any) => {
  return request.get('/events/map', { params });
};

export const getEvent = (id: string) => {
  return request.get(`/events/${id}`);
};

export const createEvent = (data: any) => {
  return request.post('/events', data);
};

export const updateEvent = (id: string, data: any) => {
  return request.put(`/events/${id}`, data);
};

export const deleteEvent = (id: string) => {
  return request.delete(`/events/${id}`);
};

export const updateEventStatus = (id: string, status: string, handlerId?: string, handlerName?: string) => {
  return request.put(`/events/${id}/status`, { status, handlerId, handlerName });
};

export const getEventStatistics = () => {
  return request.get('/events/statistics');
};

export const getEventTrend = (days?: number) => {
  return request.get('/events/trend', { params: { days } });
};

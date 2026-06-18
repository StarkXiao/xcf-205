import request from '../utils/request';

export const getDictionaries = (params?: any) => {
  return request.get('/dictionaries', { params });
};

export const getDictionary = (id: string) => {
  return request.get(`/dictionaries/${id}`);
};

export const getDictionariesByType = (type: string, all?: boolean) => {
  return request.get(`/dictionaries/type/${type}`, { params: { all: all ? 'true' : 'false' } });
};

export const createDictionary = (data: any) => {
  return request.post('/dictionaries', data);
};

export const updateDictionary = (id: string, data: any) => {
  return request.put(`/dictionaries/${id}`, data);
};

export const deleteDictionary = (id: string) => {
  return request.delete(`/dictionaries/${id}`);
};

export const DictionaryTypeLabels: Record<string, string> = {
  event_category: '事件分类',
  event_priority: '优先级',
  department: '部门',
  source_channel: '来源渠道',
};

export const DictionaryTypeList = [
  { value: 'event_category', label: '事件分类' },
  { value: 'event_priority', label: '优先级' },
  { value: 'department', label: '部门' },
  { value: 'source_channel', label: '来源渠道' },
];

import request from '../utils/request';

export const getKnowledgeList = (params?: any) => {
  return request.get('/knowledge', { params });
};

export const getKnowledge = (id: string) => {
  return request.get(`/knowledge/${id}`);
};

export const getKnowledgeByCategory = (category: string) => {
  return request.get(`/knowledge/category/${category}`);
};

export const getKnowledgeStats = () => {
  return request.get('/knowledge/stats');
};

export const createKnowledge = (data: any) => {
  return request.post('/knowledge', data);
};

export const updateKnowledge = (id: string, data: any) => {
  return request.put(`/knowledge/${id}`, data);
};

export const deleteKnowledge = (id: string) => {
  return request.delete(`/knowledge/${id}`);
};

export const referenceKnowledge = (id: string) => {
  return request.put(`/knowledge/${id}/reference`);
};

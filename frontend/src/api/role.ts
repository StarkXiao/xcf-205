import request from '../utils/request';

export const getRoles = () => {
  return request.get('/roles');
};

export const getRole = (id: string) => {
  return request.get(`/roles/${id}`);
};

export const createRole = (data: any) => {
  return request.post('/roles', data);
};

export const updateRole = (id: string, data: any) => {
  return request.put(`/roles/${id}`, data);
};

export const deleteRole = (id: string) => {
  return request.delete(`/roles/${id}`);
};

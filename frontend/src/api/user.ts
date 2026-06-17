import request from '../utils/request';

export const getUsers = (params?: any) => {
  return request.get('/users', { params });
};

export const getUser = (id: string) => {
  return request.get(`/users/${id}`);
};

export const createUser = (data: any) => {
  return request.post('/users', data);
};

export const updateUser = (id: string, data: any) => {
  return request.put(`/users/${id}`, data);
};

export const deleteUser = (id: string) => {
  return request.delete(`/users/${id}`);
};

export const getUsersByRole = (roleCode: string) => {
  return request.get(`/users/role/${roleCode}`);
};

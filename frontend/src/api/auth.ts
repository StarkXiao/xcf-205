import request from '../utils/request';

export const login = (username: string, password: string) => {
  return request.post('/auth/login', { username, password });
};

export const getProfile = () => {
  return request.get('/auth/profile');
};

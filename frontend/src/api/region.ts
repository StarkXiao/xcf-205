import request from '../utils/request';

export const getStreets = (params?: any) => {
  return request.get('/regions/streets', { params });
};

export const getAllStreets = () => {
  return request.get('/regions/streets/all');
};

export const getStreet = (id: string) => {
  return request.get(`/regions/streets/${id}`);
};

export const createStreet = (data: any) => {
  return request.post('/regions/streets', data);
};

export const updateStreet = (id: string, data: any) => {
  return request.put(`/regions/streets/${id}`, data);
};

export const deleteStreet = (id: string) => {
  return request.delete(`/regions/streets/${id}`);
};

export const getCommunities = (params?: any) => {
  return request.get('/regions/communities', { params });
};

export const getCommunitiesByStreet = (streetId: string) => {
  return request.get(`/regions/communities/by-street/${streetId}`);
};

export const getCommunity = (id: string) => {
  return request.get(`/regions/communities/${id}`);
};

export const createCommunity = (data: any) => {
  return request.post('/regions/communities', data);
};

export const updateCommunity = (id: string, data: any) => {
  return request.put(`/regions/communities/${id}`, data);
};

export const deleteCommunity = (id: string) => {
  return request.delete(`/regions/communities/${id}`);
};

export const getGrids = (params?: any) => {
  return request.get('/regions/grids', { params });
};

export const getGridsByCommunity = (communityId: string) => {
  return request.get(`/regions/grids/by-community/${communityId}`);
};

export const getGrid = (id: string) => {
  return request.get(`/regions/grids/${id}`);
};

export const createGrid = (data: any) => {
  return request.post('/regions/grids', data);
};

export const updateGrid = (id: string, data: any) => {
  return request.put(`/regions/grids/${id}`, data);
};

export const deleteGrid = (id: string) => {
  return request.delete(`/regions/grids/${id}`);
};

export const getRegionTree = () => {
  return request.get('/regions/tree');
};

export const getRegionStats = () => {
  return request.get('/regions/stats');
};

export interface Street {
  _id: string;
  code: string;
  name: string;
  description?: string;
  lng?: number;
  lat?: number;
  boundary?: number[][];
  sort: number;
  isActive: boolean;
  remark?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Community {
  _id: string;
  code: string;
  name: string;
  streetId: string;
  streetName: string;
  streetCode: string;
  description?: string;
  lng?: number;
  lat?: number;
  boundary?: number[][];
  sort: number;
  isActive: boolean;
  remark?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Grid {
  _id: string;
  code: string;
  name: string;
  streetId: string;
  streetName: string;
  streetCode: string;
  communityId: string;
  communityName: string;
  communityCode: string;
  description?: string;
  lng?: number;
  lat?: number;
  boundary?: number[][];
  gridLeaderId?: string;
  gridLeaderName?: string;
  gridMemberIds?: string[];
  gridMemberNames?: string[];
  sort: number;
  isActive: boolean;
  remark?: string;
  createdAt?: string;
  updatedAt?: string;
}

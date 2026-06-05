import apiClient from '../api-client';

export const getManagementData = async () => {
  const response = await apiClient.get('/gestion-usuarios');
  return response.data;
};

export const toggleUserStatus = async (userId: number) => {
  const response = await apiClient.patch(`/gestion-usuarios/${userId}/toggle-status`);
  return response.data;
};

export const getUserDetails = async (userId: number) => {
  const response = await apiClient.get(`/gestion-usuarios/${userId}`);
  return response.data;
};

export const updateUser = async (userId: number, userData: object) => {
  const response = await apiClient.patch(`/gestion-usuarios/${userId}`, userData);
  return response.data;
};

export const deleteUser = async (userId: number) => {
  const response = await apiClient.delete(`/gestion-usuarios/${userId}`);
  return response.data;
};

export const updateUserLogistica = async (userId: number, logisticaData: {
  nombre_empresa?: string;
  placa_vehiculo?: string;
}) => {
  const response = await apiClient.patch(`/gestion-usuarios/${userId}/logistica`, logisticaData);
  return response.data;
};

export const updateUserLogisticaComplete = async (userId: number, userData: {
  nombre_usuario?: string;
  apellido_usuario?: string;
  celular?: string;
  nombre_empresa?: string;
  placa_vehiculo?: string;
}) => {
  const response = await apiClient.patch(`/gestion-usuarios/${userId}`, userData);
  return response.data;
};

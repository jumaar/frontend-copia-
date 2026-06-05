import apiClient from '../api-client';

export const getLogistica = async (idUsuario?: number) => {
  const params = idUsuario ? `?id_usuario=${idUsuario}` : '';
  const response = await apiClient.get(`/logistica${params}`);
  return response.data;
};

export const getInventarioLogistica = async (idLogistica: number) => {
  const response = await apiClient.get(`/logistica?id_logistica=${idLogistica}`);
  return response.data;
};

export const getLogisticaHermanos = async () => {
  const response = await apiClient.get('/logistica/hermanos');
  return response.data;
};

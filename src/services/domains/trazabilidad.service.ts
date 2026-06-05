import apiClient from '../api-client';

export const getEmpaque = async (idOrEpc: string | number) => {
  const response = await apiClient.get(`/empaques/${encodeURIComponent(idOrEpc)}`);
  return response.data;
};

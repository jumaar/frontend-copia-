import apiClient from '../api-client';

export const getFrigorificoData = async () => {
  const response = await apiClient.get('/frigorifico');
  return response.data;
};

export const createFrigorifico = async (frigorificoData: {
  nombre_frigorifico: string;
  direccion: string;
  id_ciudad: number;
}) => {
  const response = await apiClient.post('/frigorifico', frigorificoData);
  return response.data;
};

export const updateFrigorifico = async (updateData: {
  id_frigorifico: number;
  nombre_frigorifico?: string;
  direccion?: string;
  id_ciudad?: number;
}) => {
  const response = await apiClient.patch('/frigorifico', updateData);
  return response.data;
};

export const deleteFrigorifico = async (idFrigorifico: number) => {
  const response = await apiClient.delete('/frigorifico', {
    data: { id_frigorifico: idFrigorifico },
  });
  return response.data;
};

export const createEstacion = async (frigorificoId: number) => {
  const response = await apiClient.post(`/frigorifico/estacion/${frigorificoId}`);
  return response.data;
};

export const deleteEstacion = async (estacionId: number) => {
  const response = await apiClient.delete(`/frigorifico/estacion/${estacionId}`);
  return response.data;
};

export const getHermanos = async () => {
  const response = await apiClient.get('/frigorifico/hermanos');
  return response.data;
};

export const getGestionLogistica = async (estacionId?: number) => {
  const url = estacionId ? `/frigorifico/gestion?estacionId=${estacionId}` : '/frigorifico/gestion';
  const response = await apiClient.get(url);
  return response.data;
};

export const getGestionLogisticaByUser = async (idUsuario: number) => {
  const response = await apiClient.get(`/frigorifico/gestion?id_usuario=${idUsuario}`);
  return response.data;
};

export const deleteEmpaque = async (estacionId: string, epc: string) => {
  const response = await apiClient.delete(`/frigorifico/estacion/${estacionId}/empaque/${epc}`);
  return response.data;
};

export const cambiarEstadoEmpaques = async (idEstacion: string, idProducto: number, idLogistica?: number) => {
  const requestBody: any = {
    id_estacion: idEstacion,
    id_producto: idProducto,
  };
  if (idLogistica) {
    requestBody.id_logistica = idLogistica;
  }
  const response = await apiClient.post('/frigorifico/empaques/cambiar-estado', requestBody);
  return response.data;
};

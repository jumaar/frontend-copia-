import apiClient from '../api-client';

export const getActiveFridgesCount = async () => {
  const response = await apiClient.get('/neveras/count/active');
  return response.data;
};

export const getCuentasNevera = async (id_nevera: number) => {
  const response = await apiClient.get(`/logistica/cuentas/nevera/${id_nevera}`);
  return response.data;
};

export const getNeverasSurtir = async () => {
  const response = await apiClient.get('/tiendas/');
  return response.data;
};

export const getLogisticaSurtir = async () => {
  const response = await apiClient.get('/tiendas/');
  return response.data;
};

export const distribuirNeveras = async (cityIds?: number[]) => {
  let url = '/neveras/surtir';
  if (cityIds && cityIds.length > 0) {
    const idsParam = cityIds.join(',');
    url += `?id_ciudad=${idsParam}`;
  }
  const response = await apiClient.get(url);
  return response.data;
};

export const getSurtidoPorNevera = async (idNevera: number, idCiudades: number[], diasExcluir: number = 0) => {
  const idsParam = idCiudades.join(',');
  const response = await apiClient.get(`/neveras/surtir?id_nevera=${idNevera}&id_ciudad=${idsParam}&dias_excluir=${diasExcluir}`);
  return response.data;
};

export const postValidacionEmpaques = async () => {
  const response = await apiClient.post('/neveras/calificacion');
  return response.data;
};

export const iniciarSurtidoNevera = async (idNevera: number) => {
  const response = await apiClient.patch(`/logistica/surtir/${idNevera}`);
  return response.data;
};

export const finalizarSurtidoNevera = async (idNevera: number) => {
  const response = await apiClient.patch(`/logistica/surtir/${idNevera}/finalizar`);
  return response.data;
};

export const retirarEmpaquesEstado5 = async (data: {
  timestamp: number;
  pending_packages: Array<{ epc?: string; id_empaque?: number }>;
}) => {
  const response = await apiClient.patch('/logistica/decincoaseis', data);
  return response.data;
};

export const darDeBajaEmpaque = async (idEmpaque: number) => {
  const response = await apiClient.patch('/logistica/seisasiete', { id_empaque: idEmpaque });
  return response.data;
};

export const validacionDosaTres = async (data: {
  id_nevera: number;
  timestamp: number;
  pending_packages: Array<{ epc?: string; id_empaque?: number }>;
}) => {
  const response = await apiClient.patch('/neveras/validacionDosaTres', data);
  return response.data;
};

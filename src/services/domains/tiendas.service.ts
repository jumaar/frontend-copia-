import apiClient from '../api-client';

export const getTiendasSobrinas = async (userId: number) => {
  const response = await apiClient.get(`/tiendas/sobrinas/${userId}`);
  return response.data;
};

export const getTiendaData = async (userId: number) => {
  const response = await apiClient.get(`/gestion-usuarios/${userId}`);
  return response.data;
};

export const getTiendas = async (userId: number) => {
  const response = await apiClient.get(`/tiendas/${userId}`);
  return response.data;
};

export const getTiendasNeveras = async (idNevera: number) => {
  const response = await apiClient.get(`/tiendas/neveras/${idNevera}`);
  return response.data;
};

export const createTienda = async (tiendaData: {
  nombre_tienda: string;
  direccion: string;
  id_ciudad: number;
}) => {
  const response = await apiClient.post('/tiendas', tiendaData);
  return response.data;
};

export const updateTienda = async (idTienda: number, updateData: {
  nombre_tienda?: string;
  direccion?: string;
  id_ciudad?: number;
}) => {
  const response = await apiClient.patch(`/tiendas/${idTienda}`, updateData);
  return response.data;
};

export const deleteTienda = async (idTienda: number) => {
  const response = await apiClient.delete(`/tiendas/${idTienda}`);
  return response.data;
};

export const createNevera = async (neveraData: { id_tienda: number }) => {
  const response = await apiClient.post('/tiendas/neveras', neveraData);
  return response.data;
};

export const deleteNevera = async (idNevera: number) => {
  const response = await apiClient.delete(`/tiendas/neveras/${idNevera}`);
  return response.data;
};

export const updateProductoStock = async (
  idProducto: number,
  idNevera: number,
  stockData: { stock_minimo?: number; stock_maximo?: number }
) => {
  const response = await apiClient.patch('/tiendas/producto-stock', {
    id_producto: idProducto,
    id_nevera: idNevera,
    ...stockData,
  });
  return response.data;
};

export const updateNeveraStocks = async (
  idNevera: number,
  stockData: Array<{
    id_stock: number | null;
    id_producto?: number;
    stock_minimo: number;
    stock_maximo: number;
  }>
) => {
  const response = await apiClient.patch(`/tiendas/neveras/${idNevera}`, stockData);
  return response.data;
};

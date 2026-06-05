import apiClient from '../api-client';

export const getProductos = async () => {
  const response = await apiClient.get('/frigorifico/productos');
  return response.data;
};

export const createProducto = async (productData: {
  nombre_producto: string;
  descripcion_producto: string;
  peso_nominal_g: number;
  precio_venta: number;
  dias_vencimiento: number;
  precio_frigorifico: number;
  precio_tienda: number;
}) => {
  const response = await apiClient.post('/frigorifico/productos', productData);
  return response.data;
};

export const updateProducto = async (productId: number, productData: Partial<{
  nombre_producto: string;
  descripcion_producto: string;
  peso_nominal_g: number;
  precio_venta: number;
  dias_vencimiento: number;
  precio_frigorifico: number;
  precio_tienda: number;
}>) => {
  const response = await apiClient.patch(`/frigorifico/productos/${productId}`, productData);
  return response.data;
};

export const deleteProducto = async (productId: number) => {
  const response = await apiClient.delete(`/frigorifico/productos/${productId}`);
  return response.data;
};

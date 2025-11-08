import axios, { AxiosError } from 'axios';

const API_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Eliminado: Interceptor para añadir Authorization header
// Las cookies se envían automáticamente con withCredentials: true

// Eliminado: Lógica compleja de refresh con localStorage
// Ahora el refresh es simple y las cookies se manejan automáticamente

// Interceptor de respuesta para auto-refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !(originalRequest as any)._retry &&
      originalRequest.url !== '/auth/refresh' &&
      originalRequest.url !== '/auth/logout' &&
      originalRequest.url !== '/auth/login'
    ) {
      (originalRequest as any)._retry = true;

      try {
        // Intentar refresh - las cookies se envían automáticamente
        await api.post('/auth/refresh', {}, { withCredentials: true });
        // Si refresh funciona, reintentar la petición original
        return api(originalRequest);
      } catch (refreshError) {
        // Si refresh falla, redirigir al login
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
// Función para obtener el número de neveras activas
export const getActiveFridgesCount = async () => {
  try {
    const response = await api.get('/neveras/count/active');
    return response.data;
  } catch (error) {
    console.error('Error fetching active fridges count:', error);
    throw error;
  }
};
// --- Funciones de Gestión de Usuarios ---

type UserRole = 'superadmin' | 'admin' | 'frigorifico' | 'logistica' | 'tienda';

const roleToIdMap: Record<UserRole, number> = {
  superadmin: 1,
  admin: 2,
  frigorifico: 3,
  logistica: 4,
  tienda: 5,
};

/**
 * Crea un nuevo token de registro para un rol de usuario específico.
 * @param role El rol para el que se creará el token.
 * @returns La respuesta de la API con los datos del token.
 */
export const createRegistrationToken = async (role: UserRole) => {
  try {
    const id_rol_nuevo_usuario = roleToIdMap[role];
    if (!id_rol_nuevo_usuario) {
      throw new Error(`El rol "${role}" no es válido.`);
    }

    const response = await api.post('/registration-tokens', { id_rol_nuevo_usuario });
    return response.data;
  } catch (error) {
    console.error('Error al crear el token de registro:', error);
    // Re-lanzamos el error para que el componente que llama pueda manejarlo (ej. mostrar un mensaje al usuario)
    throw error;
  }
};
/**
 * Obtiene todos los tokens de registro que aún no han expirado.
 * Obtiene los datos de gestión de usuarios, incluyendo usuarios y tokens activos.
 * @returns Un objeto con la lista de usuarios y tokens.
 */
export const getManagementData = async () => {
  try {
    const response = await api.get('/gestion-usuarios');
    return response.data;
  } catch (error) {
    console.error('Error al obtener los datos de gestión:', error);
    throw error;
  }
};
/**
 * Cambia el estado (activo/inactivo) de un usuario.
 * @param userId El ID del usuario a modificar.
 * @returns El objeto del usuario actualizado.
 */
export const toggleUserStatus = async (userId: number) => {
  try {
    const response = await api.patch(`/gestion-usuarios/${userId}/toggle-status`);
    return response.data;
  } catch (error) {
    console.error(`Error al cambiar el estado del usuario ${userId}:`, error);
    throw error;
  }
};
/**
 * Obtiene los detalles completos de un usuario para edición.
 * @param userId El ID del usuario a obtener.
 * @returns El objeto completo del usuario.
 */
export const getUserDetails = async (userId: number) => {
  try {
    const response = await api.get(`/gestion-usuarios/${userId}`);
    return response.data;
  } catch (error) {
    console.error(`Error al obtener los detalles del usuario ${userId}:`, error);
    throw error;
  }
};

/**
 * Actualiza los datos de un usuario.
 * @param userId El ID del usuario a actualizar.
 * @param userData Un objeto con los campos a modificar.
 * @returns El objeto del usuario actualizado.
 */
export const updateUser = async (userId: number, userData: object) => {
  try {
    const response = await api.patch(`/gestion-usuarios/${userId}`, userData);
    return response.data;
  } catch (error) {
    console.error(`Error al actualizar el usuario ${userId}:`, error);
    throw error;
  }
};

/**
 * Crea un nuevo usuario usando un token de registro.
 * @param userData Los datos del nuevo usuario incluyendo email, password, turnstileToken, registrationToken y datos personales.
 * @returns La respuesta de la API con los datos del usuario creado.
 */
export const createUserWithToken = async (userData: {
  email: string;
  password: string;
  turnstileToken: string;
  registrationToken: string;
  nombre_usuario: string;
  apellido_usuario: string;
  identificacion_usuario: string;
  celular: string;
}) => {
  try {
    const response = await api.post('/auth/create-user', userData);
    return response.data;
  } catch (error) {
    console.error('Error al crear usuario con token:', error);
    throw error;
  }
};
/**
 * Elimina (desactiva) un usuario. Solo disponible para Super Admin.
 * @param userId El ID del usuario a eliminar.
 * @returns Un mensaje de confirmación.
 */
export const deleteUser = async (userId: number) => {
  try {
    const response = await api.delete(`/gestion-usuarios/${userId}`);
    return response.data;
  } catch (error) {
    console.error(`Error al eliminar el usuario ${userId}:`, error);
    throw error;
  }
};

// --- Funciones de Gestión de Productos ---

/**
 * Obtiene todos los productos del frigorífico.
 * @returns Lista de productos con sus detalles.
 */
export const getProductos = async () => {
  try {
    const response = await api.get('/frigorifico/productos');
    return response.data;
  } catch (error) {
    console.error('Error al obtener los productos:', error);
    throw error;
  }
};

/**
 * Crea un nuevo producto.
 * @param productData Los datos del producto a crear.
 * @returns El producto creado.
 */
export const createProducto = async (productData: {
  nombre_producto: string;
  descripcion_producto: string;
  peso_nominal_g: number;
  precio_venta: number;
  dias_vencimiento: number;
  precio_frigorifico: number;
}) => {
  try {
    const response = await api.post('/frigorifico/productos', productData);
    return response.data;
  } catch (error) {
    console.error('Error al crear el producto:', error);
    throw error;
  }
};

/**
 * Actualiza un producto existente.
 * @param productId El ID del producto a actualizar.
 * @param productData Los datos a actualizar.
 * @returns El producto actualizado.
 */
export const updateProducto = async (productId: number, productData: Partial<{
  nombre_producto: string;
  descripcion_producto: string;
  peso_nominal_g: number;
  precio_venta: number;
  dias_vencimiento: number;
  precio_frigorifico: number;
}>) => {
  try {
    const response = await api.patch(`/frigorifico/productos/${productId}`, productData);
    return response.data;
  } catch (error) {
    console.error(`Error al actualizar el producto ${productId}:`, error);
    throw error;
  }
};

/**
 * Elimina un producto.
 * @param productId El ID del producto a eliminar.
 * @returns Confirmación de eliminación.
 */
export const deleteProducto = async (productId: number) => {
  try {
    const response = await api.delete(`/frigorifico/productos/${productId}`);
    return response.data;
  } catch (error) {
    console.error(`Error al eliminar el producto ${productId}:`, error);
    throw error;
  }
};

/**
 * Obtiene los datos del frigorífico para el usuario logueado.
 * @param userId El ID del usuario.
 * @returns Los datos del frigorífico incluyendo lotes y transacciones.
 */
export const getFrigorificoData = async () => {
  try {
    const response = await api.get('/frigorifico');
    return response.data;
  } catch (error) {
    console.error('Error al obtener los datos del frigorífico:', error);
    throw error;
  }
};
/**
 * Crea un nuevo frigorífico.
 * @param userId El ID del usuario.
 * @param frigorificoData Los datos del frigorífico a crear.
 * @returns El frigorífico creado.
 */
export const createFrigorifico = async (frigorificoData: {
  nombre_frigorifico: string;
  direccion: string;
  id_ciudad: number;
}) => {
  try {
    const response = await api.post('/frigorifico', frigorificoData);
    return response.data;
  } catch (error) {
    console.error('Error al crear el frigorífico:', error);
    throw error;
  }
};

/**
 * Actualiza un frigorífico existente.
 * @param userId El ID del usuario.
 * @param frigorificoData Los datos a actualizar incluyendo id_frigorifico.
 * @returns El frigorífico actualizado.
 */
export const updateFrigorifico = async (updateData: {
  id_frigorifico: number;
  nombre_frigorifico?: string;
  direccion?: string;
  id_ciudad?: number;
}) => {
  try {
    const response = await api.patch('/frigorifico', updateData);
    return response.data;
  } catch (error) {
    console.error(`Error al actualizar el frigorífico ${updateData.id_frigorifico}:`, error);
    throw error;
  }
};

/**
 * Crea una nueva estación para un frigorífico.
 * @param frigorificoId El ID del frigorífico.
 * @returns La estación creada.
 */
export const createEstacion = async (frigorificoId: number) => {
  try {
    const response = await api.post(`/frigorifico/estacion/${frigorificoId}`);
    return response.data;
  } catch (error) {
    console.error('Error al crear la estación:', error);
    throw error;
  }
};

/**
 * Elimina una estación.
 * @param estacionId El ID de la estación a eliminar.
 * @returns Confirmación de eliminación.
 */
export const deleteEstacion = async (estacionId: number) => {
  try {
    const response = await api.delete(`/frigorifico/estacion/${estacionId}`);
    return response.data;
  } catch (error) {
    console.error(`Error al eliminar la estación ${estacionId}:`, error);
    throw error;
  }
};

/**
 * Elimina un frigorífico.
 * @param userId El ID del usuario.
 * @param frigorificoId El ID del frigorífico a eliminar.
 * @returns Confirmación de eliminación.
 */
export const deleteFrigorifico = async (idFrigorifico: number) => {
  try {
    const response = await api.delete('/frigorifico', {
      data: { id_frigorifico: idFrigorifico }
    });
    return response.data;
  } catch (error) {
    console.error(`Error al eliminar el frigorífico ${idFrigorifico}:`, error);
    throw error;
  }
};

/**
 * Obtiene los datos de gestión logística para el frigorífico, opcionalmente filtrado por estación.
 * @param estacionId El ID de la estación (opcional).
 * @returns Los datos de productos y empaques.
 */
export const getGestionLogistica = async (estacionId?: number) => {
  try {
    const url = estacionId ? `/frigorifico/gestion?estacionId=${estacionId}` : '/frigorifico/gestion';
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('Error al obtener los datos de gestión logística:', error);
    throw error;
  }
};

/**
 * Elimina un empaque específico.
 * @param estacionId El ID de la estación.
 * @param epc El código EPC del empaque a eliminar.
 * @returns Confirmación de eliminación.
 */
export const deleteEmpaque = async (estacionId: string, epc: string) => {
  try {
    const response = await api.delete(`/frigorifico/estacion/${estacionId}/empaque/${epc}`);
    return response.data;
  } catch (error) {
    console.error(`Error al eliminar el empaque ${epc} de la estación ${estacionId}:`, error);
    throw error;
  }
};

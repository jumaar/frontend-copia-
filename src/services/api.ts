import axios, { AxiosError } from 'axios';

const API_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Interceptor para añadir el token a las peticiones
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Variable para mantener la promesa de la operación de refresco en curso
let refreshPromise: Promise<string> | null = null;

// --- INICIO: Inyección de dependencia para Logout ---
// Creamos un contenedor para la función de logout que será proporcionada por el AuthContext.
let onAuthFailure: () => void = () => {
  console.error("Auth failure handler not set.");
};

/**
 * Permite que el AuthContext configure una función de callback para ser ejecutada
 * cuando el refresco de token falle, manejando el logout de forma centralizada.
 * @param handler La función a ejecutar en caso de fallo de autenticación.
 */
export const setAuthFailureHandler = (handler: () => void) => {
  onAuthFailure = handler;
};
// --- FIN: Inyección de dependencia para Logout ---

// Interceptor de respuesta para manejar la lógica de refresco de token
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;

    // Si el error es 401 y la petición no tiene la bandera de reintento
    // Si el error es 401, no es un reintento y NO es la propia petición de refresco la que ha fallado
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest.headers['_retry'] &&
      originalRequest.url !== '/auth/refresh'
    ) {
      originalRequest.headers['_retry'] = true; // Marcar como reintento

      // Si no hay una operación de refresco en curso, la iniciamos
      if (!refreshPromise) {
        refreshPromise = new Promise(async (resolve, reject) => {
          try {
            console.log('🔄 Iniciando refresco de token...');
            const { data } = await axios.post(`${API_URL}/auth/refresh`, {}, { withCredentials: true });
            const newAccessToken = data.accessToken;
            
            console.log('✅ Token refrescado exitosamente.');
            localStorage.setItem('authToken', newAccessToken);
            api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
            
            resolve(newAccessToken);
          } catch (e) {
            console.error('❌ Falló el refresco de token.', e);
            if (axios.isAxiosError(e)) {
              console.error('Detalles del error de Axios durante el refresco:', {
                message: e.message,
                response: e.response?.data,
                status: e.response?.status,
              });
            }
            // Si el refresco falla, limpiamos todo
            localStorage.removeItem('authToken');
            delete api.defaults.headers.common['Authorization'];
            reject(e);
          } finally {
            // Reseteamos la promesa para futuras operaciones
            refreshPromise = null;
          }
        });
      }

      try {
        // Esperamos a que la operación de refresco (nueva o en curso) termine
        const newAccessToken = await refreshPromise;
        
        // Actualizamos la cabecera de la petición original y la reintentamos
        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
        console.log('🔁 Reintentando petición original con nuevo token...');
        return api(originalRequest);
      } catch (e) {
        // Si la promesa de refresco fue rechazada, redirigimos al login
        // Si la promesa de refresco fue rechazada, redirigimos al login
        // Si la promesa de refresco fue rechazada, llamamos al manejador centralizado
        // para que el AuthContext se encargue de limpiar el estado y redirigir.
        onAuthFailure();
        return Promise.reject(e);
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
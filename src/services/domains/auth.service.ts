import apiClient from '../api-client';

export const login = async (email: string, password: string, turnstileToken?: string) => {
  const response = await apiClient.post('/auth/login', {
    email: email.trim(),
    password: password.trim(),
    ...(turnstileToken && { turnstileToken }),
  });
  return response.data;
};

export const refreshSession = async () => {
  const response = await apiClient.post('/auth/refresh', {}, { withCredentials: true });
  return response.data;
};

export const logout = async () => {
  await apiClient.post('/auth/logout');
};

export const getRegistrationTokens = async () => {
  const response = await apiClient.get('/registration-tokens');
  return response.data;
};

export const createRegistrationToken = async (role: string) => {
  const roleToIdMap: Record<string, number> = {
    superadmin: 1,
    admin: 2,
    frigorifico: 3,
    logistica: 4,
    tienda: 5,
  };

  const id_rol_nuevo_usuario = roleToIdMap[role];
  if (!id_rol_nuevo_usuario) {
    throw new Error(`El rol "${role}" no es válido.`);
  }

  const response = await apiClient.post('/registration-tokens', { id_rol_nuevo_usuario });
  return response.data;
};

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
  const response = await apiClient.post('/auth/create-user', userData);
  return response.data;
};

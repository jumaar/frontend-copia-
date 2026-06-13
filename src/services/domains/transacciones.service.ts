import apiClient from '../api-client';

export const getTransaccionesFrigorifico = async (id_usuario: number, mes?: number, año?: number) => {
  let url = `/logistica/cuentas?id_usuario=${id_usuario}`;
  if (mes && año) {
    url += `&mes=${mes}&año=${año}`;
  }
  const response = await apiClient.get(url);
  return response.data;
};

export const getTransaccionesTienda = async (id_usuario: number, id_nevera?: number, mes?: number, año?: number) => {
  let url: string;
  if (id_nevera) {
    url = `/logistica/cuentas/nevera/${id_nevera}`;
  } else {
    url = `/logistica/cuentas?id_usuario=${id_usuario}`;
  }
  if (mes && año) {
    url += `${url.includes('?') ? '&' : '?'}mes=${mes}&año=${año}`;
  }
  const response = await apiClient.get(url);
  return response.data;
};

export const procesarPago = async (id_usuario: number, monto: number, tipo_movimiento: 'egreso' | 'consolidacion', id_nevera?: number, nota_opcional?: string, empaques?: number[]) => {
  let url: string;
  if (id_nevera) {
    url = `/logistica/cuentas/nevera/${id_nevera}`;
  } else {
    url = `/logistica/cuentas?id_usuario=${id_usuario}`;
  }

  const body: any = { monto, tipo_movimiento, nota_opcional };
  if (empaques && empaques.length > 0) {
    body.empaques = empaques;
  }

  const response = await apiClient.post(url, body);
  return response.data;
};

export const getHistorialTienda = async (id_usuario: number, mes?: number, año?: number) => {
  let url = `/logistica/historial/tienda/${id_usuario}`;
  if (mes && año) {
    url += `?mes=${mes}&año=${año}`;
  }
  const response = await apiClient.get(url);
  return response.data;
};

export const getResumenFinanciero = async (mes?: number, ano?: number, id_usuario?: number) => {
  const params = new URLSearchParams();
  if (mes) params.append('mes', String(mes));
  if (ano) params.append('ano', String(ano));
  if (id_usuario) params.append('id_usuario', String(id_usuario));
  const response = await apiClient.get(`/logistica/finanzas?${params.toString()}`);
  return response.data;
};

export const registrarMovimientoAdmin = async (
  monto: number,
  tipo_movimiento: 'ingreso' | 'egreso' | 'consolidacion',
  nota_opcional?: string,
  id_logistica?: number
) => {
  const body: any = { monto, tipo_movimiento, nota_opcional };
  if (id_logistica) body.id_logistica = id_logistica;
  const response = await apiClient.post('/logistica/consolidar-admin', body);
  return response.data;
};

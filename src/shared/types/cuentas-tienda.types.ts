export interface Ciudad {
  id_ciudad: number;
  nombre_ciudad: string;
  departamento: string;
}

export interface Nevera {
  id_nevera: number;
  id_estado_nevera: number;
  pendientes_pago: boolean;
}

export interface Tienda {
  id_tienda: number;
  nombre_tienda: string;
  direccion: string;
  ciudad: string;
  departamento: string;
  neveras?: Nevera[];
}

export interface UsuarioTienda {
  id_usuario: number;
  nombre_usuario: string;
  apellido_usuario: string;
  email: string;
  celular: string;
  tiendas: Tienda[];
}

export interface NeveraInfo {
  id_nevera: number;
  id_tienda: number;
  nombre_tienda: string;
}

export interface EmpaquePendiente {
  id_empaque: number;
  precio_venta_total: number;
  id_producto: number;
  promocion: number | null;
}

export interface ProductoPendiente {
  id_producto: number;
  nombre_producto: string;
  peso_nominal_g: number;
  precio_tienda: string;
}

export interface Promocion {
  id_promocion: number;
  nombre: string;
  tipo: string;
  valor: number;
}

export interface Transaccion {
  id_transaccion: number;
  id_empaque: number | null;
  id_transaccion_rel: number | null;
  monto: number;
  costo_tienda: number;
  hora_transaccion?: string;
  nombre_tipo_transaccion: string;
  nombre_estado_transaccion?: string;
  nota_opcional: string;
  info_pago?: {
    id_usuario_pago: number;
    nombre_usuario_pago: string;
    nota_opcional_pago: string;
  };
  [key: string]: any;
}

export interface TransaccionesData {
  nevera?: NeveraInfo;
  empaques: EmpaquePendiente[];
  productos: ProductoPendiente[];
  promociones: Promocion[];
  transacciones: Transaccion[];
  fecha_creacion_usuario: string;
  nombre_usuario: string;
  apellido_usuario: string;
  periodo: { mes: number; año: number };
  total_transacciones: number;
  fecha_inicio_periodo?: string;
  fecha_fin_periodo?: string;
  parametros_usados: {
    mes_pedido: number | null;
    año_pedido: number | null;
    mes_devuelto: number | null;
    año_devuelto: number | null;
    es_periodo_actual: boolean;
  };
}

export type MesItem = {
  mes: number;
  año: number;
  fecha: string;
};

// Re-export de tipos compartidos entre logistica y frigorifico
export type { Empaque, Producto, SearchResult } from '../../../shared/scoped/admin-superadmin-frigorifico-logistica/types/shared-types';

export interface Hermano {
  id_usuario: number;
  nombre_usuario: string;
  apellido_usuario: string;
  email: string;
  celular: number;
}

export interface LogisticaData {
  id_logistica: number;
  nombre_empresa: string;
  placa_vehiculo: string;
}

export interface GestionLogisticaResponse {
  logistica: LogisticaData[] | null;
  hermanos: Hermano[];
}

export interface Estacion {
  id_estacion: string;
  clave_vinculacion: string;
  activa: boolean;
  total_empaques: number;
  peso_total_g: number;
  productos: import('../../../shared/scoped/admin-superadmin-frigorifico-logistica/types/shared-types').Producto[];
}

export interface FrigorificoBasico {
  id_frigorifico: number;
  nombre_frigorifico: string;
  direccion: string;
  ciudad: {
    id_ciudad: number;
    nombre_ciudad: string;
    departamento: {
      id__departamento: number;
      nombre_departamento: string;
    };
  };
}

export interface GestionDataBasico {
  usuario_actual: {
    id: number;
    nombre_completo: string;
    celular: string;
    rol: string;
    activo: boolean;
  };
  frigorificos: FrigorificoBasico[];
}

export interface Frigorifico extends FrigorificoBasico {
  lotes_en_stock: {
    cantidad: number;
    peso_total_g: number;
  };
  lotes_despachados: {
    cantidad: number;
    peso_total_g: number;
  };
  total_transacciones: number;
  estaciones: Estacion[];
}

export interface GestionData {
  usuario_actual: {
    id: number;
    nombre_completo: string;
    celular: string;
    rol: string;
    activo: boolean;
  };
  frigorificos: Frigorifico[];
}

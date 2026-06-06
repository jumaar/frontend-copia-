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

export interface Empaque {
  epc: string;
  peso_g: string;
  precio_venta_total: number;
  fecha_empaque: string;
  id?: number;
}

export interface Producto {
  id_producto: number;
  nombre_producto: string;
  peso_nominal_g: number;
  cantidad_total: number;
  peso_total_g: number;
  empaques: Empaque[];
}

export interface Estacion {
  id_estacion: string;
  clave_vinculacion: string;
  activa: boolean;
  total_empaques: number;
  peso_total_g: number;
  productos: Producto[];
}

export interface Frigorifico {
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
  ciudades_disponibles: Array<{
    id_ciudad: number;
    nombre_ciudad: string;
  }>;
}

export interface SearchResult {
  producto: Producto;
  estacion: string;
}

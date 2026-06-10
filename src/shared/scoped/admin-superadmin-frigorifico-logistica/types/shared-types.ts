// Tipos compartidos entre logistica y frigorifico para búsqueda y visualización de empaques

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

export interface SearchResult {
  producto: Producto;
  estacion: string;
}

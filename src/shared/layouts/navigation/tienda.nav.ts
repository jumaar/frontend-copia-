import type { NavItem } from '../Sidebar';

export const tiendaNavItems: NavItem[] = [
  { to: '/tienda',           label: 'Dashboard', end: true },
  { to: '/tienda/inventario', label: 'Inventario Tiendas' },
  { to: '/tienda/cuentas',    label: 'Mis Cuentas' },
  { to: '/tienda/historial',  label: 'Historial' },
  { to: '/trazabilidad',      label: 'Trazabilidad' },
];

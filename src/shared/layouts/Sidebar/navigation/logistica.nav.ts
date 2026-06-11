import type { NavItem } from '../Sidebar';

export const logisticaNavItems: NavItem[] = [
  { to: '/logistica',                         label: 'Dashboard', end: true },
  { to: '/logistica/inventario',              label: 'Gestión Inventario' },
  { to: '/logistica/neveras',                 label: 'Inventario Neveras' },
  { to: '/logistica/gestion',                 label: 'Gestión Frigoríficos' },
  { to: '/logistica/cuentas-frigorificos',    label: 'Cuentas Frigoríficos' },
  { to: '/logistica/cuentas-tiendas',         label: 'Cuentas Neveras' },
  { to: '/logistica/finanzas-tienda',         label: 'Finanzas Tiendas' },
  { to: '/logistica/finanzas',                label: 'Finanzas' },
  { to: '/trazabilidad',                      label: 'Trazabilidad' },
];

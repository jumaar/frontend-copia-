import type { NavItem } from '../Sidebar';

export const frigorificoNavItems: NavItem[] = [
  { to: '/frigorifico',           label: 'Dashboard', end: true },
  { to: '/frigorifico/logistica',  label: 'Gestión Frigoríficos' },
  { to: '/frigorifico/productos',  label: 'Gestión de Productos' },
  { to: '/frigorifico/finanzas',    label: 'Finanzas' },
  { to: '/trazabilidad',           label: 'Trazabilidad' },
];

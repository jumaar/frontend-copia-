import type { NavItem } from '../Sidebar';

export const adminNavItems: NavItem[] = [
  { to: '/admin/dashboard',          label: 'Dashboard' },
  { to: '/admin/users',              label: 'Gestión de Usuarios' },
  { to: '/admin/logistica',          label: 'Gestión Logística' },
  { to: '/admin/productos',          label: 'Gestión de Productos' },
  { to: '/admin/neveras',            label: 'Gestión de Neveras' },
  { to: '/admin/accounts',           label: 'Finanzas' },
  { to: '/admin/cuentas-tiendas',    label: 'Cuentas Neveras' },
  { to: '/admin/historial-tienda',   label: 'Historial Tiendas' },
  { to: '/trazabilidad',             label: 'Trazabilidad' },
  { to: '/admin/finanzas-logistica', label: 'Finanzas Logísticas' },
];

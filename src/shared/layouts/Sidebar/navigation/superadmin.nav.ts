import type { NavItem } from '../Sidebar';

export const superadminNavItems: NavItem[] = [
  { to: '/superadmin/dashboard',          label: 'Dashboard' },
  { to: '/superadmin/users',              label: 'Gestión de Usuarios' },
  { to: '/superadmin/logistica',          label: 'Gestión Logística' },
  { to: '/superadmin/productos',          label: 'Gestión de Productos' },
  { to: '/superadmin/neveras',            label: 'Gestión de Neveras' },
  { to: '/superadmin/accounts',           label: 'Cuentas Globales' },
  { to: '/superadmin/cuentas-tiendas',    label: 'Cuentas Tiendas' },
  { to: '/superadmin/historial-tienda',   label: 'Historial Tiendas' },
  { to: '/trazabilidad',                  label: 'Trazabilidad' },
  { to: '/superadmin/finanzas-logistica', label: 'Finanzas Logísticas' },
];

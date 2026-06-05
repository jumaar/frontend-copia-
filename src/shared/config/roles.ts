// ============================================================
// ÚNICA fuente de verdad para roles, rutas y permisos.
// Cualquier archivo que necesite datos de rol importa desde aquí.
// ============================================================

export const ROLES = {
  SUPERADMIN: 'superadmin',
  ADMIN: 'admin',
  FRIGORIFICO: 'frigorifico',
  LOGISTICA: 'logistica',
  TIENDA: 'tienda',
} as const;

export type RoleName = (typeof ROLES)[keyof typeof ROLES];

// ID numérico (API) → nombre de rol
export const ROLE_ID_MAP: Record<number, RoleName> = {
  1: ROLES.SUPERADMIN,
  2: ROLES.ADMIN,
  3: ROLES.FRIGORIFICO,
  4: ROLES.LOGISTICA,
  5: ROLES.TIENDA,
};

// Rol → dashboard principal
export const DASHBOARD_PATHS: Record<RoleName, string> = {
  [ROLES.SUPERADMIN]: '/superadmin/dashboard',
  [ROLES.ADMIN]: '/admin/dashboard',
  [ROLES.FRIGORIFICO]: '/frigorifico',
  [ROLES.LOGISTICA]: '/logistica',
  [ROLES.TIENDA]: '/tienda',
};

/** Convierte ID numérico de rol → nombre de rol */
export const getRoleName = (roleId: number): RoleName =>
  ROLE_ID_MAP[roleId] || ROLES.TIENDA;

/** Obtiene la ruta del dashboard para un rol dado */
export const getDashboardPath = (role: string): string =>
  (DASHBOARD_PATHS as Record<string, string>)[role] || '/sign-in';

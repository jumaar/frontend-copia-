# Reglas de ubicación de archivos

Antes de crear un archivo, determina en cuál carpeta va según quién lo usa:

## `src/apps/{app}/components/`
Componentes usados por UNA sola app.

## `src/shared/`
Código compartido entre apps:

| Carpeta | Cuándo usarla |
|---|---|
| `components/` | Componentes genéricos que usan TODAS las apps (Dropdown, Alert, Tabla, Resumen) |
| `hooks/` | Hooks globales usados por componentes/páginas de todas las apps |
| `layouts/` | Layouts compartidos (Header, Sidebar, RoleLayout) |
| `pages/` | Páginas completas compartidas entre todas las apps |

## `src/shared/scoped/{roles}/`
Código compartido por 2-4 roles específicos. La carpeta se nombra con los roles en orden alfabético separados por guiones.

**Estructura interna de cada scope:**

```
src/shared/scoped/admin-superadmin-logistica/
├── hooks/            ← hooks específicos del scope
├── components/       ← componentes reutilizables del scope
└── {Nombre}Screen/   ← páginas completas (siempre con sufijo Screen)
```

**Ejemplos:**
- `admin-superadmin-frigorifico-logistica/CuentasFrigorificoScreen/`
- `admin-superadmin-logistica/hooks/useUserManagement.ts`
- `admin-superadmin-logistica-tienda/TiendaSelector/`
- `admin-superadmin/UserManagementScreen/`

**Roles existentes**: `admin`, `superadmin`, `frigorifico`, `logistica`, `tienda`

## Regla práctica

1. ¿Lo usa solo esta app? → `src/apps/{app}/components/`
2. ¿Lo usan todas las apps? → `src/shared/components/` o `src/shared/hooks/`
3. ¿Lo comparten algunos roles? → `src/shared/scoped/{rol1}-{rol2}-.../hooks/`, `components/` o `{Screen}Screen/`

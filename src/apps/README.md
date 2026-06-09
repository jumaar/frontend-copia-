# Reglas de ubicación de componentes

Antes de crear un componente, determina en cuál de estas 3 carpetas debe ir:

## 1. `src/apps/{app}/components/`
**Cuándo**: El componente solo lo usa UNA app (ej: solo `logistica`, solo `frigorifico`).

**Ejemplo**: `src/apps/logistica/components/EmpaqueSearchResult/` — solo usado por la app logística.

```
src/apps/logistica/components/
src/apps/frigorifico/components/
src/apps/admin/components/
src/apps/superadmin/components/
src/apps/tienda/components/
```

## 2. `src/shared/components/`
**Cuándo**: El componente lo usan TODAS las apps (5/5) o es genérico (Dropdown, Alert, Tabla, Resumen).

**Ejemplo**: `src/shared/components/Dropdown/` — usado por todas las apps.

```
src/shared/components/
  Alert/
  Dropdown/
  Resumen/
  TablaTransacciones/
  TablaPendientes/
  TableEstacion/
  ProveedorSelector/
  EmpaquesPendientes/
  ConsolidatedTickets/
  SummaryCard/
  ...
```

## 3. `src/shared/componentscoped/{roles}/`
**Cuándo**: El componente lo comparten 2, 3 o 4 roles específicos, pero NO todos. El nombre de la carpeta es la lista de roles en orden alfabético separados por guiones.

**Roles existentes**: `admin`, `superadmin`, `frigorifico`, `logistica`, `tienda`

**Ejemplos reales**:
- `admin-superadmin-frigorifico-logistica/` — usado por 4 roles (cuentas frigoríficos, gestión frigoríficos)
- `admin-superadmin-logistica/` — usado por 3 roles (GestionCobro, HistorialTiendaAdminScreen)
- `admin-superadmin-logistica-tienda/` — usado por 4 roles (TiendaSelector, CuentasTiendaView)
- `admin-superadmin/` — usado por 2 roles (UserManagementScreen, FridgeManagementScreen)

**Qué va aquí**: Tanto **componentes** como **páginas completas** (Screens) que orquestan una vista para esos roles. También **hooks** específicos de ese scope (en subcarpeta `hooks/`).

```
src/shared/componentscoped/admin-superadmin-frigorifico-logistica/
  CuentasFrigorificoScreen/    ← página que orquesta la vista
  FrigorificoCard/             ← componente reutilizable
  EPCSearchBar/                ← componente reutilizable
  hooks/
    useCuentasFrigorifico.ts   ← hook específico del scope
```

## ¿Por qué importa? — Build y Lazy Loading

Cada app usa `React.lazy()` para cargar sus páginas bajo demanda. La ubicación del componente determina en qué chunk de Vite termina:

- **`apps/{app}/components/`** → el componente va en el chunk de ESA app. Solo se descarga cuando el usuario visita esa app.
- **`shared/components/`** → va en un chunk común. Se descarga una vez y lo reusan todas las apps.
- **`shared/componentscoped/`** → va en un chunk compartido entre los roles que lo importan. Si un rol nunca visita la página, ese código nunca se descarga.

**Mala práctica**: Poner un componente en `shared/components/` cuando solo lo usan 2 roles. Infla el chunk común para todos los usuarios.
**Buena práctica**: Usar `componentscoped/` para que solo los roles que lo necesitan paguen el costo de descarga.

## Regla práctica

Si al crear una página nueva te preguntas dónde poner un componente:
1. ¿Lo usa solo esta app? → `src/apps/{app}/components/`
2. ¿Lo usan todas las apps? → `src/shared/components/`
3. ¿Lo comparten algunos roles pero no todos? → `src/shared/componentscoped/{rol1}-{rol2}-.../`

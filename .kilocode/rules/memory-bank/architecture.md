# Arquitectura del Sistema

## 1. Estructura General del Frontend

La aplicación sigue una arquitectura basada en componentes, típica de proyectos React. La estructura del código fuente está organizada de la siguiente manera:

*   **`main.tsx`**: Punto de entrada de la aplicación. Aquí se renderiza el componente raíz (`App`) en el DOM.
*   **`App.tsx`**: Componente principal que define las rutas de la aplicación utilizando `react-router-dom`. Gestiona la navegación y el enrutamiento a las diferentes páginas.

## 2. Rutas del Código Fuente

### `src/components/`
Contiene componentes de React reutilizables que se utilizan en varias partes de la aplicación. Cada componente suele tener su propio archivo de estilos (`.css`). Ejemplos:
*   `AuthForm.tsx`: Formulario de inicio de sesión y registro.
*   `UserHierarchy.tsx`: Componente para visualizar la jerarquía de usuarios.
*   `ProductionHierarchy.tsx`: Componente para la jerarquía de producción maneja la msma forma que `UserHierarchy.tsx`.
*   `SummaryCard.tsx`: Tarjetas para mostrar datos de resumen.

### `src/contexts/`
Gestiona el estado global de la aplicación.
*   `AuthContext.tsx`: Proporciona información sobre el usuario autenticado y funciones de `login`/`logout` a toda la aplicación.

### `src/layouts/`
Define la estructura visual de las páginas.
*   `RootLayout.tsx`: Layout principal que incluye elementos comunes como la barra lateral (`Sidebar`) y la cabecera (`Header`).
*   `ProtectedRoute.tsx`: Un componente de orden superior que protege las rutas para que solo los usuarios autenticados puedan acceder a ellas.

### `src/pages/`
Contiene los componentes que representan las páginas completas de la aplicación. Están organizadas por roles de usuario:
*   **`pages/admin/`**: Páginas específicas para los roles de Super Admin y Admin.
*   **`pages/frigorifico/`**: Páginas para el rol de Frigorífico.
*   **`pages/logistica/`**: Páginas para el rol de Logística.
*   **`pages/tienda/`**: Páginas para el rol de Tienda.

### `src/services/`
Centraliza la comunicación con la API del backend.
*   `api.ts`: Configura una instancia de Axios con interceptores para manejar la autenticación (añadir tokens a las peticiones) y el refresco de tokens. Exporta funciones para cada endpoint de la API.

### `src/styles/`
Contiene los estilos globales de la aplicación.
*   `theme.css`: Define las variables de CSS (colores, fuentes, etc.) que se utilizan en toda la aplicación para mantener un diseño consistente.

## 3. Patrones de Diseño

*   **Componentes Reutilizables:** La aplicación se basa en la creación de componentes pequeños y reutilizables (`SummaryCard`, `TokenDisplay`) que se componen para construir interfaces más complejas.
*   **Context API para el Estado Global:** Se utiliza `AuthContext` para gestionar el estado de autenticación, evitando la necesidad de pasar props a través de múltiples niveles de componentes.
*   **Rutas Protegidas:** El componente `ProtectedRoute` encapsula la lógica de autenticación para proteger las rutas, redirigiendo a los usuarios no autorizados.
*   **Centralización de la Lógica de API:** Toda la lógica para interactuar con el backend está centralizada en `src/services/api.ts`, lo que facilita el mantenimiento y la gestión de los endpoints.
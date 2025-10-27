# Pila Tecnológica y Herramientas

## 1. Tecnologías Principales

*   **React (`^19.1.1`):** Biblioteca principal para la construcción de la interfaz de usuario.
*   **TypeScript (`~5.9.3`):** Superset de JavaScript que añade tipado estático para mejorar la robustez y mantenibilidad del código.
*   **Vite (`^7.1.7`):** Herramienta de construcción moderna que proporciona un entorno de desarrollo rápido y optimiza el empaquetado para producción.

## 2. Librerías Clave

*   **`react-router-dom` (`^6.20.0`):** Para gestionar el enrutamiento del lado del cliente y la navegación entre las diferentes páginas de la aplicación.
*   **`axios` (`^1.6.0`):** Cliente HTTP para realizar peticiones a la API del backend. Se utiliza con interceptores para manejar la autenticación y el refresco de tokens.
*   **`jwt-decode` (`^4.0.0`):** Para decodificar tokens JWT en el cliente y acceder a la información que contienen (como el rol y el ID del usuario).
*   **`@marsidev/react-turnstile` (`^1.3.1`):** Componente de React para integrar Cloudflare Turnstile, una alternativa a los CAPTCHA para proteger los formularios.

## 3. Herramientas de Desarrollo y Calidad de Código

*   **ESLint (`^9.36.0`):** Herramienta de linting para identificar y corregir problemas en el código JavaScript/TypeScript, asegurando un estilo consistente y evitando errores comunes.
*   **TypeScript ESLint (`^8.45.0`):** Plugin para que ESLint pueda analizar y aplicar reglas a código TypeScript.
*   **`eslint-plugin-react-hooks` (`^5.2.0`):** Aplica las reglas de los Hooks de React para evitar errores comunes.
*   **`eslint-plugin-react-refresh` (`^0.4.22`):** Habilita el Fast Refresh (HMR) para una experiencia de desarrollo más fluida.

## 4. Configuración del Proyecto

*   **`tsconfig.json`:** Archivo de configuración de TypeScript que define las opciones del compilador y los archivos que se deben incluir.
*   **`vite.config.ts`:** Archivo de configuración de Vite, donde se definen los plugins y las opciones de construcción.
*   **`eslint.config.js`:** Archivo de configuración de ESLint para definir las reglas de linting.
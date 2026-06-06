import React from 'react';
import { Routes, Route } from 'react-router-dom';
import RoleLayout from '../../shared/layouts/RoleLayout';
import { logisticaNavItems } from '../../shared/layouts/navigation/logistica.nav';
import LogisticaPage from './pages/LogisticaPage';
import LogisticaGestionPage from './pages/LogisticaGestionPage';
import LogisticaInventarioPage from '../../apps/logistica/pages/LogisticaInventarioSelfPage';
import LogisticaFinanzasPage from './pages/LogisticaFinanzasPage';
import CuentasTiendaPage from './pages/CuentasTiendaPage';
import HistorialTiendaPage from './pages/HistorialTiendaPage';
import CuentasFrigorificoPage from './pages/CuentasFrigorificoPage';

const logisticaRouteTitles: Record<string, string> = {
  '/logistica': 'Dashboard',
  '/logistica/gestion': 'Gestión Frigoríficos',
  '/logistica/inventario': 'Gestión Inventario',
  '/logistica/finanzas': 'Finanzas',
  '/logistica/cuentas-tiendas': 'Cuentas Tiendas',
  '/logistica/historial-tienda': 'Historial Tiendas',
  '/logistica/cuentas-frigorificos': 'Cuentas Frigoríficos',
};

const LogisticaApp: React.FC = () => {
  return (
    <RoleLayout
      category="Logística"
      navItems={logisticaNavItems}
      routeTitles={logisticaRouteTitles}
    >
      <Routes>
        <Route index element={<LogisticaPage />} />
        <Route path="gestion" element={<LogisticaGestionPage />} />
        <Route path="inventario" element={<LogisticaInventarioPage />} />
        <Route path="finanzas" element={<LogisticaFinanzasPage />} />
        <Route path="cuentas-tiendas" element={<CuentasTiendaPage />} />
        <Route path="historial-tienda" element={<HistorialTiendaPage />} />
        <Route path="cuentas-frigorificos" element={<CuentasFrigorificoPage />} />
      </Routes>
    </RoleLayout>
  );
};

export default LogisticaApp;

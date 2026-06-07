import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import RoleLayout from '../layouts/RoleLayout';
import { adminNavItems } from '../layouts/Sidebar/navigation/admin.nav';
import { superadminNavItems } from '../layouts/Sidebar/navigation/superadmin.nav';
import { logisticaNavItems } from '../layouts/Sidebar/navigation/logistica.nav';
import { frigorificoNavItems } from '../layouts/Sidebar/navigation/frigorifico.nav';
import { tiendaNavItems } from '../layouts/Sidebar/navigation/tienda.nav';
import TrazabilidadEmpaquePage from '../components/TrazabilidadEmpaque/TrazabilidadEmpaquePage';
import type { NavItem } from '../layouts/Sidebar';

const navItemsByRole: Record<string, NavItem[]> = {
  superadmin: superadminNavItems,
  admin: adminNavItems,
  logistica: logisticaNavItems,
  frigorifico: frigorificoNavItems,
  tienda: tiendaNavItems,
};

const categoryByRole: Record<string, string> = {
  superadmin: 'Super Administración',
  admin: 'Administración',
  logistica: 'Logística',
  frigorifico: 'Frigorífico',
  tienda: 'Tienda',
};

const TrazabilidadLayout: React.FC = () => {
  const { user } = useAuth();
  const currentNavItems = user ? (navItemsByRole[user.role] || []) : [];
  const currentCategory = user ? (categoryByRole[user.role] || '') : '';

  return (
    <RoleLayout category={currentCategory} navItems={currentNavItems}>
      <TrazabilidadEmpaquePage />
    </RoleLayout>
  );
};

export default TrazabilidadLayout;

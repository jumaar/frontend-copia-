import React, { useState, useEffect } from 'react';
import './ManagementPage.css';
import CreateTokenModal from '../components/CreateTokenModal/CreateTokenModal';
import TokenDisplay, { type TokenData } from '../components/TokenDisplay/TokenDisplay';
import EditUserModal from '../components/EditUserModal/EditUserModal';
import UserProfileCard from '../components/UserProfileCard/UserProfileCard';
import UserHierarchy from '../components/UserHierarchy/UserHierarchy';
import { useUserManagement, type User } from '../hooks/useUserManagement';
import { getManagementData, getUserDetails } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

function mapTiendaToUser(store: any): User {
  return {
    id: store.id_tienda * -1,
    nombre_completo: store.nombre_tienda,
    celular: store.direccion,
    rol: 'tienda-fisica',
    activo: true,
    hijos: (store.neveras || []).map((n: any) => ({
      id: n.id_nevera * -1,
      nombre_completo: `Nevera ${n.id_nevera}`,
      celular: '',
      rol: 'nevera',
      activo: n.estado === 2,
      hijos: [],
    })),
  };
}

function mapNodoToUser(node: any): User {
  const rol = node.rol.toLowerCase().replace('_', '');
  const hijos: User[] = [];

  const usuariosCreados = node.usuarios_creados || [];
  for (const child of usuariosCreados) {
    const childUser = mapNodoToUser(child);
    hijos.push(childUser);
  }

  const tiendas = node.tiendas || [];
  for (const store of tiendas) {
    hijos.push(mapTiendaToUser(store));
  }

  return {
    id: node.id || node.id_usuario,
    nombre_completo: node.nombre_completo || node.nombre_tienda || '',
    celular: node.celular || node.direccion || '',
    rol,
    activo: node.activo !== undefined ? node.activo : true,
    hijos,
  };
}

const UserManagementPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [activeTokens, setActiveTokens] = useState<TokenData[]>([]);
  const [hierarchyUsers, setHierarchyUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [usuarioActual, setUsuarioActual] = useState<{ id: number; nombre_completo: string; celular: string; rol: string; activo: boolean } | null>(null);

  const { handleToggleStatus, handleUserUpdated, handleDeleteUser } = useUserManagement({
    currentUser,
    setUsers: setHierarchyUsers,
  });

  const isSuperAdmin = currentUser?.role?.toLowerCase().replace('_', '') === 'superadmin';

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const data = await getManagementData();
        setUsuarioActual(data.usuario_actual || null);
        setActiveTokens(data.tokens || []);

        const hierarchy = (data.jerarquia || []).map((nodo: any) => mapNodoToUser(nodo));
        setHierarchyUsers(hierarchy);
      } catch (error) {
        console.error("No se pudieron cargar los datos de gestión:", error);
        setHierarchyUsers([]);
        setActiveTokens([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (currentUser) {
      fetchData();
    } else {
      setIsLoading(false);
    }
  }, [currentUser]);

  const handleOpenCreateModal = () => setCreateModalOpen(true);
  const handleCloseCreateModal = () => setCreateModalOpen(false);

  const handleOpenEditModal = async (userId: number) => {
    try {
      const userData = await getUserDetails(userId);
      setSelectedUser(userData);
      setEditModalOpen(true);
    } catch (error) {
      console.error("Error fetching user details for editing.");
    }
  };
  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setSelectedUser(null);
  };

  const handleTokenCreated = (newToken: TokenData) => {
    setActiveTokens(prevTokens => [...prevTokens, newToken]);
  };

  const handleTokenExpired = (expiredToken: string) => {
    setActiveTokens(prevTokens => prevTokens.filter(t => t.token !== expiredToken));
  };

  return (
    <>
      <div className="management-page">
        <div className="cuentas-header">
          <h1>Gestión de Usuarios</h1>
          <p>Administrar todos los usuarios del sistema.</p>
        </div>

        <div className="active-tokens-section" style={{ marginTop: 'calc(var(--spacing-unit) * -4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'calc(var(--spacing-unit) * 3)' }}>
            <h2>Tokens Activos</h2>
            <button className="button button-primary" onClick={handleOpenCreateModal}>
              Crear Token de Registro
            </button>
          </div>
          <div className="tokens-grid">
            {activeTokens.length > 0 ? (
              activeTokens.map(tokenData => (
                <TokenDisplay key={tokenData.token} tokenData={tokenData} onExpire={handleTokenExpired} />
              ))
            ) : (
              <p>No hay tokens de registro activos en este momento.</p>
            )}
          </div>
        </div>

        {usuarioActual && (
          <UserProfileCard
            role={usuarioActual.rol}
            fullName={usuarioActual.nombre_completo}
            phone={usuarioActual.celular}
            onEditClick={() => handleOpenEditModal(usuarioActual.id)}
          />
        )}

        {isLoading ? (
          <p>Cargando datos...</p>
        ) : isSuperAdmin ? (
          hierarchyUsers.map((adminNode) => (
            <UserHierarchy
              key={adminNode.id}
              users={[adminNode]}
              currentUserRole={currentUser?.role}
              currentUserId={currentUser?.id}
              onEditUser={handleOpenEditModal}
              onToggleStatus={handleToggleStatus}
              onDeleteUser={handleDeleteUser}
            />
          ))
        ) : (
          <UserHierarchy
            users={hierarchyUsers}
            currentUserRole={currentUser?.role}
            currentUserId={currentUser?.id}
            onEditUser={handleOpenEditModal}
            onToggleStatus={handleToggleStatus}
            onDeleteUser={handleDeleteUser}
          />
        )}
      </div>
      <CreateTokenModal isOpen={isCreateModalOpen} onClose={handleCloseCreateModal} onTokenCreated={handleTokenCreated} />
      <EditUserModal isOpen={isEditModalOpen} onClose={handleCloseEditModal} userData={selectedUser} onUserUpdated={handleUserUpdated} />
    </>
  );
};

export default UserManagementPage;

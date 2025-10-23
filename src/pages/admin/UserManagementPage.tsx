import React, { useState, useEffect } from 'react';
import './ManagementPage.css';
import CreateTokenModal from '../../components/CreateTokenModal';
import TokenDisplay, { type TokenData } from '../../components/TokenDisplay';
import EditUserModal from '../../components/EditUserModal';
import UserHierarchy from '../../components/UserHierarchy';
import { getManagementData, toggleUserStatus, getUserDetails, deleteUser } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface User {
  id: number;
  nombre_completo: string;
  celular: string;
  rol: string;
  activo: boolean;
  hijos?: User[];
}

const UserManagementPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [activeTokens, setActiveTokens] = useState<TokenData[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const data = await getManagementData();
        console.log('Datos recibidos del backend:', data);

        const transformedHierarchy: User[] = [];

        if (data.usuario_actual) {
          const rootUser: User = {
            id: data.usuario_actual.id,
            nombre_completo: data.usuario_actual.nombre_completo || 'Usuario Actual',
            celular: data.usuario_actual.celular || 'N/A',
            rol: data.usuario_actual.rol.toLowerCase().replace('_', ''),
            activo: data.usuario_actual.activo,
            hijos: (data.admins_creados || []).map((admin: any) => ({
              id: admin.id,
              nombre_completo: admin.nombre_completo || 'Admin sin nombre',
              celular: admin.celular || 'N/A',
              rol: admin.rol.toLowerCase().replace('_', ''),
              activo: admin.activo,
              hijos: (admin.usuarios_creados || []).map((child: any) => ({
                id: child.id,
                nombre_completo: child.nombre_completo || 'Usuario sin nombre',
                celular: child.celular || 'N/A',
                rol: child.rol.toLowerCase().replace('_', ''),
                activo: child.activo,
              })),
            })),
          };
          transformedHierarchy.push(rootUser);
        }
        
        console.log('Jerarquía transformada:', transformedHierarchy);
        setUsers(transformedHierarchy);
        setActiveTokens(data.tokens || []);

      } catch (error) {
        console.error("No se pudieron cargar los datos de gestión:", error);
        setUsers([]); // En caso de error, la lista queda vacía
        setActiveTokens([]);
      } finally {
        setIsLoading(false);
      }
    };

    // Solo llamar a fetchData si tenemos un usuario autenticado
    if (currentUser) {
      fetchData();
    } else {
      setIsLoading(false); // Si no hay usuario, no hay nada que cargar
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

  const handleToggleStatus = async (userId: number, userName: string, currentStatus: boolean) => {
    const action = currentStatus ? 'desactivar' : 'activar';
    const isConfirmed = window.confirm(
      `¿Estás seguro de que quieres ${action} al usuario "${userName}"?`
    );

    if (isConfirmed) {
      try {
        const updatedUser = await toggleUserStatus(userId);
        // Mapear la respuesta del backend al formato esperado por el frontend
        const mappedUser: User = {
          id: updatedUser.id_usuario || updatedUser.id,
          nombre_completo: updatedUser.nombre_completo || `${updatedUser.nombre_usuario || ''} ${updatedUser.apellido_usuario || ''}`.trim(),
          celular: updatedUser.celular,
          rol: updatedUser.rol,
          activo: updatedUser.activo
        };
        setUsers(prevUsers =>
          prevUsers.map(user => user.id === userId ? mappedUser : user)
        );
      } catch (error) {
        console.error(`Error al cambiar el estado del usuario ${userId}.`);
        alert('No se pudo cambiar el estado del usuario. Inténtalo de nuevo.');
      }
    }
  };

  const handleUserUpdated = (updatedUser: any) => {
    setUsers(prevUsers =>
      prevUsers.map(user => user.id === updatedUser.id_usuario ? {
        ...user,
        nombre_completo: `${updatedUser.nombre_usuario} ${updatedUser.apellido_usuario}`,
        celular: updatedUser.celular
      } : user)
    );
  };

  const handleDeleteUser = async (userId: number, userName: string) => {
    if (userId.toString() === currentUser?.id) {
      alert('No puedes eliminar tu propio usuario.');
      return;
    }

    const isConfirmed = window.confirm(
      `¿Estás seguro de que quieres eliminar al usuario "${userName}"? Esta acción no se puede deshacer.`
    );

    if (isConfirmed) {
      try {
        await deleteUser(userId);
        setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
        alert('Usuario eliminado exitosamente.');
      } catch (error) {
        console.error(`Error al eliminar el usuario ${userId}.`);
        alert('No se pudo eliminar el usuario. Inténtalo de nuevo.');
      }
    }
  };


  return (
    <>
      <div className="management-page">
        <header className="management-header">
          <h1>Gestión de Usuarios</h1>
          <p>Administrar todos los usuarios del sistema.</p>
          <button className="button button-primary" onClick={handleOpenCreateModal}>
            Crear Token de Registro
          </button>
        </header>

        <div className="active-tokens-section">
          <h2>Tokens Activos</h2>
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

        <div className="management-table-container card">
        {isLoading ? (
          <p>Cargando datos...</p>
        ) : users.length > 0 ? (
          <UserHierarchy users={users} currentUserRole={currentUser?.role} currentUserId={currentUser?.id} onEditUser={handleOpenEditModal} onToggleStatus={handleToggleStatus} onDeleteUser={handleDeleteUser} />
        ) : (
          <p>No hay usuarios para mostrar.</p>
        )}
      </div>
    </div>
    <CreateTokenModal isOpen={isCreateModalOpen} onClose={handleCloseCreateModal} onTokenCreated={handleTokenCreated} />
    <EditUserModal isOpen={isEditModalOpen} onClose={handleCloseEditModal} userData={selectedUser} onUserUpdated={handleUserUpdated} />
  </>
  );
};

export default UserManagementPage;
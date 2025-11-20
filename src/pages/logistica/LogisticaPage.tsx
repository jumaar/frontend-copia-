import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './LogisticaPage.css';
import CreateTokenModal from '../../components/CreateTokenModal';
import TokenDisplay, { type TokenData } from '../../components/TokenDisplay';
import EditLogisticaModal from '../../components/EditLogisticaModal';
import EditUserModal from '../../components/EditUserModal';
import UserHierarchy from '../../components/UserHierarchy';
import Alert from '../../components/Alert';
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

const LogisticaPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isEditLogisticaModalOpen, setEditLogisticaModalOpen] = useState(false);
  const [isEditUserModalOpen, setEditUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [activeTokens, setActiveTokens] = useState<TokenData[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [tiendasData, setTiendasData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showProfileAlert, setShowProfileAlert] = useState(false);
  const [userProfileData, setUserProfileData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const data = await getManagementData();
        console.log('Datos recibidos del backend:', data);

        // Set user data for the profile section
        setUsers(data.usuario_actual ? [data.usuario_actual] : []);

        // Set tiendas data for individual components
        setTiendasData(data.tiendas_creadas || []);
        setActiveTokens(data.tokens || []);

        // Verificar si el usuario actual de logística necesita completar perfil
        if (data.usuario_actual?.rol === 'Logistica' &&
            !data.usuario_actual.logistica) {
          setUserProfileData(data.usuario_actual);
          setShowProfileAlert(true);
        }

      } catch (error) {
        console.error("No se pudieron cargar los datos de gestión:", error);
        setUsers([]);
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
      
      // Verificar si es el usuario de logística (padre) o una tienda (hijo)
      // El usuario de logística tiene ID igual al usuario actual, las tiendas tienen IDs diferentes
      if (userId === parseInt(currentUser?.id || '0')) {
        setEditLogisticaModalOpen(true);
      } else {
        setEditUserModalOpen(true);
      }
    } catch (error) {
      console.error("Error fetching user details for editing.");
    }
  };
  
  const handleCloseEditLogisticaModal = () => {
    setEditLogisticaModalOpen(false);
    setSelectedUser(null);
  };

  const handleCloseEditUserModal = () => {
    setEditUserModalOpen(false);
    setSelectedUser(null);
  };

  const handleAlertAccept = () => {
    setShowProfileAlert(false);
    if (userProfileData) {
      handleOpenEditModal(userProfileData.id);
    }
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

        // Actualizar el estado del usuario y sus hijos recursivamente
        const updateUserInHierarchy = (users: User[]): User[] => {
          return users.map(user => {
            if (user.id === userId) {
              // Actualizar nombre, celular y estado activo, pero mantener el rol original
              return {
                ...user,
                nombre_completo: mappedUser.nombre_completo,
                celular: mappedUser.celular,
                activo: mappedUser.activo
              };
            }
            if (user.hijos) {
              return {
                ...user,
                hijos: updateUserInHierarchy(user.hijos)
              };
            }
            return user;
          });
        };

        setUsers(prevUsers => updateUserInHierarchy(prevUsers));
      } catch (error) {
        console.error(`Error al cambiar el estado del usuario ${userId}.`);
        alert('No se pudo cambiar el estado del usuario. Inténtalo de nuevo.');
      }
    }
  };

  const handleUserUpdated = (updatedUser: any) => {
    // Función recursiva para actualizar usuario editado en la jerarquía
    const updateUserInHierarchy = (users: User[]): User[] => {
      return users.map(user => {
        if (user.id === updatedUser.id_usuario) {
          // Actualizar nombre y celular, pero mantener rol y estado activo originales
          return {
            ...user,
            nombre_completo: `${updatedUser.nombre_usuario} ${updatedUser.apellido_usuario}`,
            celular: updatedUser.celular
          };
        }
        if (user.hijos) {
          return {
            ...user,
            hijos: updateUserInHierarchy(user.hijos)
          };
        }
        return user;
      });
    };

    setUsers(prevUsers => updateUserInHierarchy(prevUsers));
  };

  const handleDeleteUser = async (userId: number, userName: string) => {
    const isConfirmed = window.confirm(
      `¿Estás seguro de que quieres eliminar al usuario "${userName}"? Esta acción no se puede deshacer.`
    );

    if (isConfirmed) {
      try {
        const response = await deleteUser(userId);

        // Función recursiva para eliminar usuario de la jerarquía
        const removeUserFromHierarchy = (users: User[]): User[] => {
          return users
            .filter(user => user.id !== userId) // Filtrar el usuario a eliminar
            .map(user => ({
              ...user,
              hijos: user.hijos ? removeUserFromHierarchy(user.hijos) : undefined
            }));
        };

        setUsers(prevUsers => removeUserFromHierarchy(prevUsers));
        
        // Mostrar mensaje de éxito
        alert(response.message || 'Usuario eliminado exitosamente.');
      } catch (error: any) {
        console.error(`Error al eliminar el usuario ${userId}.`, error);
        
        // Manejar diferentes tipos de errores según la respuesta del backend
        if (error.response) {
          const { status, data } = error.response;
          
          switch (status) {
            case 401:
              alert('Sesión expirada. Por favor, inicie sesión nuevamente.');
              // Opcional: redirigir al login
              // window.location.href = '/login';
              break;
            case 403:
              alert(data.message || 'No tienes permiso para eliminar a este usuario.');
              break;
            case 404:
              alert(data.message || `Usuario con ID ${userId} no encontrado.`);
              break;
            default:
              alert(data.message || 'No se pudo eliminar el usuario. Inténtalo de nuevo.');
          }
        } else {
          alert('No se pudo eliminar el usuario. Inténtalo de nuevo.');
        }
      }
    }
  };

  return (
    <>
      <div className="management-page">
        <div className="cuentas-header">
          <h1>Gestión de Logística</h1>
          <p>Administrar usuarios de logística y sus tiendas asignadas.</p>
        </div>

        <div className="active-tokens-section">
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

        {users.length > 0 && (
          <div className="user-main-row">
            <div className="user-info">
              <span className="user-role">{users[0].rol}</span>
              <span className="user-name">{users[0].nombre_completo} (Mi Perfil)</span>
              <span className="user-phone">{users[0].celular}</span>
            </div>
            <div className="user-actions">
              <button className="action-button" onClick={() => handleOpenEditModal(users[0].id)}>Editar</button>
            </div>
          </div>
        )}

        <div className="tiendas-section">
          {isLoading ? (
            <p>Cargando datos...</p>
          ) : tiendasData.length > 0 ? (
            tiendasData.map((tiendaUser: any) => {
              const tiendaHierarchy: User[] = [{
                id: tiendaUser.id_usuario,
                nombre_completo: tiendaUser.nombre_completo,
                celular: tiendaUser.celular,
                rol: 'tienda',
                activo: tiendaUser.activo,
                hijos: tiendaUser.tiendas_creadas.map((store: any) => ({
                  id: store.id_tienda * -1,
                  nombre_completo: store.nombre_tienda,
                  celular: store.direccion,
                  rol: 'tienda-fisica',
                  activo: true,
                  hijos: store.neveras.map((nevera: any) => ({
                    id: nevera.id_nevera * -1,
                    nombre_completo: `Nevera ${nevera.id_nevera}`,
                    celular: '',
                    rol: 'nevera',
                    activo: nevera.estado === 2,
                    hijos: []
                  }))
                }))
              }];

              return (
                <div key={tiendaUser.id_usuario} className="tienda-component card">
                  <UserHierarchy
                    users={tiendaHierarchy}
                    currentUserRole={currentUser?.role}
                    currentUserId={currentUser?.id}
                    onEditUser={handleOpenEditModal}
                    onToggleStatus={handleToggleStatus}
                    onDeleteUser={handleDeleteUser}
                    onSurtir={() => navigate('/logistica/inventario')}
                  />
                </div>
              );
            })
          ) : (
            <p>No hay tiendas para mostrar.</p>
          )}
        </div>
      </div>
      <CreateTokenModal isOpen={isCreateModalOpen} onClose={handleCloseCreateModal} onTokenCreated={handleTokenCreated} />
      <EditLogisticaModal 
        isOpen={isEditLogisticaModalOpen} 
        onClose={handleCloseEditLogisticaModal} 
        userData={selectedUser} 
        onUserUpdated={handleUserUpdated} 
      />
      <EditUserModal 
        isOpen={isEditUserModalOpen} 
        onClose={handleCloseEditUserModal} 
        userData={selectedUser} 
        onUserUpdated={handleUserUpdated} 
      />
      
      {showProfileAlert && (
        <Alert
          message="Debe completar los datos de su perfil de logística para continuar."
          onDismiss={handleAlertAccept}
          type="welcome"
        />
      )}
    </>
  );
};

export default LogisticaPage;
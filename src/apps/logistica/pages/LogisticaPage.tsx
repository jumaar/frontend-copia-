import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './LogisticaPage.css';
import CreateTokenModal from '../../../shared/components/CreateTokenModal/CreateTokenModal';
import TokenDisplay, { type TokenData } from '../../../shared/components/TokenDisplay/TokenDisplay';
import EditLogisticaModal from '../../../shared/components/EditLogisticaModal/EditLogisticaModal';
import EditUserModal from '../../../shared/components/EditUserModal/EditUserModal';
import UserProfileCard from '../../../shared/components/UserProfileCard/UserProfileCard';
import UserHierarchy from '../../../shared/components/UserHierarchy/UserHierarchy';
import Alert from '../../../shared/components/Alert/Alert';
import { useUserManagement, type User } from '../../../shared/hooks/useUserManagement';
import { getManagementData, getUserDetails } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';

function buildTiendaHierarchy(item: any, creadoPor: string): User[] {
  return [{
    id: item.id_usuario,
    nombre_completo: item.nombre_completo,
    celular: item.celular,
    rol: 'tienda',
    activo: item.activo,
    creadoPor,
    hijos: (item.tiendas || []).map((store: any) => ({
      id: store.id_tienda * -1,
      nombre_completo: store.nombre_tienda,
      celular: store.direccion,
      rol: 'tienda-fisica',
      activo: true,
      hijos: (store.neveras || []).map((nevera: any) => ({
        id: nevera.id_nevera * -1,
        nombre_completo: `Nevera ${nevera.id_nevera}`,
        celular: '',
        rol: 'nevera',
        activo: nevera.estado === 2,
        hijos: [],
      })),
    })),
  }];
}

const LogisticaPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isEditLogisticaModalOpen, setEditLogisticaModalOpen] = useState(false);
  const [isEditUserModalOpen, setEditUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [activeTokens, setActiveTokens] = useState<TokenData[]>([]);
  const [jerarquiaItems, setJerarquiaItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showProfileAlert, setShowProfileAlert] = useState(false);
  const [userProfileData, setUserProfileData] = useState<any>(null);
  const [usuarioActual, setUsuarioActual] = useState<any>(null);

  const { handleToggleStatus, handleUserUpdated } = useUserManagement({
    currentUser,
    setUsers: () => {},
  });

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const data = await getManagementData();
        setUsuarioActual(data.usuario_actual || null);
        setJerarquiaItems(data.jerarquia || []);
        setActiveTokens(data.tokens || []);

        if (data.usuario_actual?.rol === 'Logistica' &&
            !data.usuario_actual.logistica) {
          setUserProfileData(data.usuario_actual);
          setShowProfileAlert(true);
        }
      } catch (error) {
        console.error("No se pudieron cargar los datos de gestión:", error);
        setJerarquiaItems([]);
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

  const jerarquias = useMemo(() => {
    return jerarquiaItems.map((item: any) => {
      const creadoPor = item.tipo === 'sobrina'
        ? (item.creado_por || 'Otro logística')
        : (usuarioActual?.nombre_completo || '');
      return buildTiendaHierarchy(item, creadoPor);
    });
  }, [jerarquiaItems, usuarioActual]);

  return (
    <>
      <div className="management-page">
        <div className="cuentas-header">
          <h1>Gestión de Usuarios</h1>
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

        {usuarioActual && (
          <UserProfileCard
            role={usuarioActual.rol}
            fullName={usuarioActual.nombre_completo}
            phone={usuarioActual.celular}
            onEditClick={() => handleOpenEditModal(usuarioActual.id)}
          />
        )}

        <div className="tiendas-section">
          {isLoading ? (
            <p>Cargando datos...</p>
          ) : jerarquias.length > 0 ? (
            jerarquias.map((hierarchy) => (
              <UserHierarchy
                key={hierarchy[0]?.id}
                users={hierarchy}
                currentUserRole={currentUser?.role}
                currentUserId={currentUser?.id}
                onEditUser={handleOpenEditModal}
                onToggleStatus={handleToggleStatus}
                onDeleteUser={() => {}}
                onSurtir={() => navigate('/logistica/inventario')}
              />
            ))
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

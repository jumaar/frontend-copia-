import React, { useState, useEffect } from 'react';
import SummaryCard from '../../components/SummaryCard';
import ProductionHierarchy from '../../components/ProductionHierarchy';
import type { ProductionItem } from '../../components/ProductionHierarchy';
import StationModal from '../../components/StationModal';
import type { StationData } from '../../components/StationModal';
import EditUserModal from '../../components/EditUserModal';
import CreateNeveraModal from '../../components/CreateNeveraModal';
import PasswordConfirmationModal from '../../components/PasswordConfirmationModal';
import { getTiendas, createTienda, updateTienda, deleteTienda, getUserDetails, createNevera, deleteNevera } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import './TiendaDashboardPage.css';

interface Nevera {
  id_nevera: number;
  id_tienda: number;
  id_estado_nevera: number;
  contraseña?: string;
}

interface Tienda {
  id_tienda: number;
  nombre_tienda: string;
  direccion: string;
  ciudad: string;
  departamento: string;
  neveras?: Nevera[];
}

interface UsuarioData {
  id_usuario: number;
  nombre_usuario: string;
  apellido_usuario: string;
  identificacion_usuario: string;
  celular: string;
  email: string;
  activo: boolean;
  fecha_creacion: string;
  fecha_ultima_modifi: string;
  id_rol: number;
  rol: {
    id_rol: number;
    nombre_rol: string;
  };
}




const TiendaDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [productionItems, setProductionItems] = useState<ProductionItem[]>([
    {
      id: 'loading',
      type: 'station',
      name: 'Cargando tiendas...',
      details: { address: '', city: '' },
      children: []
    }
  ]);
  const [isStationModalOpen, setStationModalOpen] = useState(false);
  const [editingStation, setEditingStation] = useState<ProductionItem | null>(null);
  const [userData, setUserData] = useState<UsuarioData | null>(null);
  const [tiendasData, setTiendasData] = useState<Tienda[]>([]);
  const [ciudadesDisponibles, setCiudadesDisponibles] = useState<Array<{
    id_ciudad: number;
    nombre_ciudad: string;
    departamento: string;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isEditUserModalOpen, setEditUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isCreateNeveraModalOpen, setCreateNeveraModalOpen] = useState(false);
  const [selectedTiendaForNevera, setSelectedTiendaForNevera] = useState<ProductionItem | null>(null);
  const [isPasswordModalOpen, setPasswordModalOpen] = useState(false);
  const [newNeveraPassword, setNewNeveraPassword] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (user?.id) {
        try {
          const [userResponse, tiendasResponse] = await Promise.all([
            getUserDetails(Number(user.id)),
            getTiendas(Number(user.id))
          ]);

          setUserData(userResponse);
          setTiendasData(tiendasResponse.tiendas || []);
          setCiudadesDisponibles(tiendasResponse.ciudades_disponibles || []);

          // Convertir datos reales a formato ProductionItem
          if (tiendasResponse.tiendas && tiendasResponse.tiendas.length > 0) {
            const realProductionItems: ProductionItem[] = tiendasResponse.tiendas.map((tienda: Tienda) => ({
              id: tienda.id_tienda.toString(),
              type: 'station',
              name: tienda.nombre_tienda,
              details: {
                address: tienda.direccion,
                city: tienda.ciudad
              },
              children: tienda.neveras ? tienda.neveras.map(nevera => ({
                id: nevera.id_nevera.toString(),
                type: 'scale',
                name: `Nevera ${nevera.id_nevera}`,
                details: {
                  key: `Estado: ${nevera.id_estado_nevera === 2 ? 'Activa' : 'Inactiva'}`,
                  value: nevera.contraseña // Usamos value para pasar la contraseña si está disponible
                },
                isActive: nevera.id_estado_nevera === 2
              })) : []
            }));
            setProductionItems(realProductionItems);
          } else {
            // Si no hay tiendas, mostrar array vacío
            setProductionItems([]);
          }
        } catch (error) {
          console.error('Error fetching nevera data:', error);
          setProductionItems([]);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [user?.id, refreshTrigger]);

  const handleOpenCreateStationModal = () => {
    setEditingStation(null);
    setStationModalOpen(true);
  };

  const handleCreateScale = async (station: ProductionItem) => {
    // station es la tienda, crear nevera para esa tienda
    try {
      // Abrir modal para pedir codigo_activacion
      setSelectedTiendaForNevera(station);
      setCreateNeveraModalOpen(true);
    } catch (error: any) {
      console.error('Error creating nevera:', error);
      alert('Error al crear la nevera. Inténtalo de nuevo.');
    }
  };

  const handleOpenEditStationModal = (station: ProductionItem) => {
    setEditingStation(station);
    setStationModalOpen(true);
  };

  const handleCloseStationModal = () => {
    setStationModalOpen(false);
    setEditingStation(null);
  };

  const handleSaveStation = async (stationData: StationData) => {
    try {
      // Find the selected city ID
      const selectedCity = ciudadesDisponibles.find(
        ciudad => ciudad.nombre_ciudad === stationData.city
      );

      if (!selectedCity) {
        console.error('Ciudad no encontrada');
        return;
      }

      if (editingStation) {
        // Update existing tienda
        await updateTienda(parseInt(editingStation.id.toString()), {
          nombre_tienda: stationData.name,
          direccion: stationData.address,
          id_ciudad: selectedCity.id_ciudad
        });
        // Refresh data
        setRefreshTrigger(prev => prev + 1);
      } else {
        // Create new tienda
        await createTienda({
          nombre_tienda: stationData.name,
          direccion: stationData.address,
          id_ciudad: selectedCity.id_ciudad
        });
        // Refresh data
        setRefreshTrigger(prev => prev + 1);
      }
    } catch (error: any) {
      console.error('Error saving tienda:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);

      // Manejar error específico de creación de tienda bloqueada
      if (error.response?.status === 403 && error.response?.data?.code === 'TIENDA_CREATION_BLOCKED') {
        alert(error.response.data.message);
      } else {
        alert('Error al guardar la tienda. Inténtalo de nuevo.');
      }
    }
  };

  const handleSaveNevera = async () => {
    if (!selectedTiendaForNevera) return;

    try {
      const response = await createNevera({
        id_tienda: Number(selectedTiendaForNevera.id)
      });

      // Mostrar modal de confirmación de contraseña
      if (response && response.nevera) {
        setNewNeveraPassword(response.nevera.contraseña);
        setPasswordModalOpen(true);

        // Actualizar el estado localmente para mostrar la contraseña sin recargar
        setProductionItems(prevItems => {
          return prevItems.map(item => {
            if (item.id === selectedTiendaForNevera.id) {
              const newNevera: ProductionItem = {
                id: response.nevera.id_nevera.toString(),
                type: 'scale',
                name: `Nevera ${response.nevera.id_nevera}`,
                details: {
                  key: `Estado: ${response.nevera.id_estado_nevera === 2 ? 'Activa' : 'Inactiva'}`,
                  value: response.nevera.contraseña
                },
                isActive: response.nevera.id_estado_nevera === 2
              };
              return {
                ...item,
                children: [...(item.children || []), newNevera]
              };
            }
            return item;
          });
        });
      } else {
        // Si no hay respuesta con nevera, refrescar datos
        setRefreshTrigger(prev => prev + 1);
      }

      setCreateNeveraModalOpen(false);
      setSelectedTiendaForNevera(null);
    } catch (error: any) {
      console.error('Error saving nevera:', error);

      // Manejar error específico de creación bloqueada
      if (error.response?.status === 403 && error.response?.data?.code === 'NEVERA_CREATION_BLOCKED') {
        alert(error.response.data.message);
      } else {
        alert('Error al crear la nevera. Inténtalo de nuevo.');
      }

      // Cerrar el modal en caso de error
      setCreateNeveraModalOpen(false);
      setSelectedTiendaForNevera(null);
    }
  };

  const handleCloseNeveraModal = () => {
    setCreateNeveraModalOpen(false);
    setSelectedTiendaForNevera(null);
  };

  const handleClosePasswordModal = () => {
    setPasswordModalOpen(false);
    setNewNeveraPassword('');
    setCreateNeveraModalOpen(false);
    setSelectedTiendaForNevera(null);
  };

  const handleDeleteStation = async (station: ProductionItem) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar la tienda "${station.name}"? Esta acción no se puede deshacer.`)) {
      try {
        await deleteTienda(Number(station.id));
        // Refresh data
        setRefreshTrigger(prev => prev + 1);
      } catch (error: any) {
        console.error('Error deleting tienda:', error);

        // Manejar errores específicos
        if (error.response?.status === 403 && error.response?.data?.code === 'TIENDA_HAS_NEVERAS_ACTIVAS') {
          alert(error.response.data.message);
        } else if (error.response?.status === 404) {
          alert('Tienda no encontrada o no tienes permisos para eliminarla.');
        } else {
          alert('Error al eliminar la tienda. Inténtalo de nuevo.');
        }
      }
    }
  };

  const handleDeleteScale = async (scale: ProductionItem) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar la nevera "${scale.name}"? Esta acción no se puede deshacer.`)) {
      try {
        await deleteNevera(Number(scale.id));
        // Refresh data
        setRefreshTrigger(prev => prev + 1);
      } catch (error: any) {
        console.error('Error deleting nevera:', error);
        alert('Error al eliminar la nevera. Inténtalo de nuevo.');
      }
    }
  };

  const handleOpenEditUserModal = async () => {
    if (userData?.id_usuario) {
      try {
        const userDetails = await getUserDetails(userData.id_usuario);
        setSelectedUser(userDetails);
        setEditUserModalOpen(true);
      } catch (error) {
        console.error("Error fetching user details for editing.");
      }
    }
  };

  const handleCloseEditUserModal = () => {
    setEditUserModalOpen(false);
    setSelectedUser(null);
  };

  const handleUserUpdated = () => {
    // Refresh data to update user info
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <>
       <div className="frigorifico-page">
        <div className="cuentas-header">
          <h1>Portal de la Tienda</h1>
          <p>Registro y gestión de tiendas.</p>
        </div>

        <section className="dashboard-summary" style={{ marginTop: 'calc(var(--spacing-unit) * -4)' }}>
          <SummaryCard
            title="Total Transacciones"
            value={loading ? "Cargando..." : "$0"} // TODO: implementar transacciones
            description="Saldo total de la tienda"
          />
          <SummaryCard
            title="Tiendas Activas"
            value={loading ? "Cargando..." : tiendasData.length.toString()}
            description="Tiendas registradas"
          />
         
        </section>

        {userData && (
          <div className="user-main-row">
            <div className="user-info">
              <div>
                <span className="user-role">{userData.rol.nombre_rol}</span>
                <span className="user-name">{userData.nombre_usuario} {userData.apellido_usuario} (Mi Perfil)</span>
                <span className="user-phone">{userData.celular}</span>
              </div>
            </div>
            <div className="user-actions">
              <button className="action-button" onClick={handleOpenEditUserModal}>Editar</button>
            </div>
          </div>
        )}

        <section className="production-section card">
          <div className="card-header">
            <h2>Gestión de Producción</h2>
            <button className="button button-primary" onClick={handleOpenCreateStationModal}>
              Crear Tienda
            </button>
          </div>
          <ProductionHierarchy
            items={productionItems}
            onEditStation={handleOpenEditStationModal}
            onCreateScale={handleCreateScale}
            onDeleteScale={handleDeleteScale}
            onDeleteStation={handleDeleteStation}
            userRole={user?.role}
            stationLabel="Tienda"
            createScaleLabel="Crear Nevera"
          />
        </section>
      </div>
      <StationModal
        isOpen={isStationModalOpen}
        onClose={handleCloseStationModal}
        stationData={editingStation ? {
          id: editingStation.id,
          name: editingStation.name,
          address: editingStation.details.address,
          city: editingStation.details.city
        } : null}
        availableCities={ciudadesDisponibles}
        onSave={handleSaveStation}
        title={editingStation ? "Tienda" : "Tienda"}
      />
      <CreateNeveraModal
        isOpen={isCreateNeveraModalOpen}
        onClose={handleCloseNeveraModal}
        onConfirm={handleSaveNevera}
        tiendaName={selectedTiendaForNevera?.name || ''}
      />
      <EditUserModal
        isOpen={isEditUserModalOpen}
        onClose={handleCloseEditUserModal}
        userData={selectedUser}
        onUserUpdated={handleUserUpdated}
      />
      <PasswordConfirmationModal
        isOpen={isPasswordModalOpen}
        onClose={handleClosePasswordModal}
        password={newNeveraPassword}
        title="Contraseña de Nevera Creada"
      />
    </>
  );
};

export default TiendaDashboardPage;
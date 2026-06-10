import React, { useState, useEffect } from 'react';
import SummaryCard from '../../../shared/components/SummaryCard/SummaryCard';
import ProductionHierarchy from '../../../shared/scoped/tienda-frigorifico/components/ProductionHierarchy/ProductionHierarchy';
import type { ProductionItem } from '../../../shared/scoped/tienda-frigorifico/components/ProductionHierarchy/ProductionHierarchy';
import StationModal from '../../../shared/scoped/tienda-frigorifico/components/StationModal/StationModal';
import type { StationData } from '../../../shared/scoped/tienda-frigorifico/components/StationModal/StationModal';
import EditUserModal from '../../../shared/components/EditUserModal/EditUserModal';
import UserProfileCard from '../../../shared/components/UserProfileCard/UserProfileCard';
import CreateNeveraModal from '../components/CreateNeveraModal/CreateNeveraModal';
import PasswordConfirmationModal from '../components/PasswordConfirmationModal/PasswordConfirmationModal';
import { createTienda, updateTienda, deleteTienda, getUserDetails, createNevera, deleteNevera } from '../../../services/api';
import { getManagementData } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';

function mapTiendaToProductionItem(tienda: any): ProductionItem {
  return {
    id: tienda.id_tienda.toString(),
    type: 'station',
    name: tienda.nombre_tienda,
    details: {
      address: tienda.direccion,
      city: tienda.ciudad,
    },
    children: (tienda.neveras || []).map((n: any) => ({
      id: n.id_nevera.toString(),
      type: 'scale' as const,
      name: `Nevera ${n.id_nevera}`,
      details: {
        key: `Estado: ${n.estado === 2 ? 'Activa' : 'Inactiva'}`,
        value: '',
        isActive: n.estado === 2,
      },
      isActive: n.estado === 2,
    })),
  };
}

const TiendaDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [productionItems, setProductionItems] = useState<ProductionItem[]>([
    { id: 'loading', type: 'station', name: 'Cargando tiendas...', details: { address: '', city: '' }, children: [] },
  ]);
  const [isStationModalOpen, setStationModalOpen] = useState(false);
  const [editingStation, setEditingStation] = useState<ProductionItem | null>(null);
  const [usuarioActual, setUsuarioActual] = useState<any>(null);
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
      if (!user?.id) return;
      setLoading(true);
      try {
        const data = await getManagementData();
        setUsuarioActual(data.usuario_actual || null);

        const tiendas = (data.jerarquia || []) as any[];
        if (tiendas.length > 0) {
          setProductionItems(tiendas.map((t: any) => mapTiendaToProductionItem(t)));
        } else {
          setProductionItems([]);
        }
      } catch (error) {
        console.error('Error fetching management data:', error);
        setProductionItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.id, refreshTrigger]);

  const handleOpenCreateStationModal = () => {
    setEditingStation(null);
    setStationModalOpen(true);
  };

  const handleCreateScale = (station: ProductionItem) => {
    setSelectedTiendaForNevera(station);
    setCreateNeveraModalOpen(true);
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
      if (editingStation) {
        await updateTienda(parseInt(editingStation.id.toString()), {
          nombre_tienda: stationData.name,
          direccion: stationData.address,
          id_ciudad: 0,
        });
      } else {
        await createTienda({
          nombre_tienda: stationData.name,
          direccion: stationData.address,
          id_ciudad: 0,
        });
      }
      setRefreshTrigger(prev => prev + 1);
    } catch (error: any) {
      console.error('Error saving tienda:', error);
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
      const response = await createNevera({ id_tienda: Number(selectedTiendaForNevera.id) });
      if (response?.nevera) {
        setNewNeveraPassword(response.nevera.contraseña);
        setPasswordModalOpen(true);
        setProductionItems(prev => prev.map(item => {
          if (item.id === selectedTiendaForNevera.id) {
            return {
              ...item,
              children: [...(item.children || []), {
                id: response.nevera.id_nevera.toString(),
                type: 'scale' as const,
                name: `Nevera ${response.nevera.id_nevera}`,
                details: {
                  key: `Estado: ${response.nevera.id_estado_nevera === 2 ? 'Activa' : 'Inactiva'}`,
                  value: response.nevera.contraseña,
                },
                isActive: response.nevera.id_estado_nevera === 2,
              }],
            };
          }
          return item;
        }));
      } else {
        setRefreshTrigger(prev => prev + 1);
      }
    } catch (error: any) {
      console.error('Error saving nevera:', error);
      if (error.response?.status === 403 && error.response?.data?.code === 'NEVERA_CREATION_BLOCKED') {
        alert(error.response.data.message);
      } else {
        alert('Error al crear la nevera. Inténtalo de nuevo.');
      }
    }
    setCreateNeveraModalOpen(false);
    setSelectedTiendaForNevera(null);
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
    if (!window.confirm(`¿Estás seguro de que quieres eliminar la tienda "${station.name}"?`)) return;
    try {
      await deleteTienda(Number(station.id));
      setRefreshTrigger(prev => prev + 1);
    } catch (error: any) {
      if (error.response?.status === 403) {
        alert(error.response.data.message);
      } else {
        alert('Error al eliminar la tienda.');
      }
    }
  };

  const handleDeleteScale = async (scale: ProductionItem) => {
    if (!window.confirm(`¿Eliminar nevera "${scale.name}"?`)) return;
    try {
      await deleteNevera(Number(scale.id));
      setRefreshTrigger(prev => prev + 1);
    } catch (error: any) {
      alert('Error al eliminar la nevera.');
    }
  };

  const handleOpenEditUserModal = async () => {
    if (!usuarioActual?.id) return;
    try {
      const userDetails = await getUserDetails(usuarioActual.id);
      setSelectedUser(userDetails);
      setEditUserModalOpen(true);
    } catch (error) {
      console.error("Error fetching user details.");
    }
  };

  const handleCloseEditUserModal = () => {
    setEditUserModalOpen(false);
    setSelectedUser(null);
  };

  const handleUserUpdated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const tiendasCount = loading ? '...' : productionItems.length.toString();

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'calc(var(--spacing-unit) * 4)' }}>
        <div className="cuentas-header">
          <h1>Dashboard</h1>
          <p>Registro y gestión de tiendas.</p>
        </div>

        <section className="dashboard-summary" style={{ marginTop: 'calc(var(--spacing-unit) * -4)' }}>
          <SummaryCard title="Total Transacciones" value={loading ? "Cargando..." : "$0"} description="Saldo total de la tienda" />
          <SummaryCard title="Tiendas Activas" value={tiendasCount} description="Tiendas registradas" />
        </section>

        {usuarioActual && (
          <UserProfileCard
            role={usuarioActual.rol}
            fullName={usuarioActual.nombre_completo}
            phone={usuarioActual.celular}
            onEditClick={handleOpenEditUserModal}
          />
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
        stationData={editingStation ? { id: editingStation.id, name: editingStation.name, address: editingStation.details.address, city: editingStation.details.city } : null}
        availableCities={[]}
        onSave={handleSaveStation}
        title="Tienda"
      />
      <CreateNeveraModal isOpen={isCreateNeveraModalOpen} onClose={handleCloseNeveraModal} onConfirm={handleSaveNevera} tiendaName={selectedTiendaForNevera?.name || ''} />
      <EditUserModal isOpen={isEditUserModalOpen} onClose={handleCloseEditUserModal} userData={selectedUser} onUserUpdated={handleUserUpdated} />
      <PasswordConfirmationModal isOpen={isPasswordModalOpen} onClose={handleClosePasswordModal} password={newNeveraPassword} title="Contraseña de Nevera Creada" />
    </>
  );
};

export default TiendaDashboardPage;

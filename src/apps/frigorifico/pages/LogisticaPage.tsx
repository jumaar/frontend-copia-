import React, { useState, useEffect } from 'react';
import { getGestionLogisticaByUser, getGestionLogisticaByFrigorifico, deleteEmpaque } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import ProveedorSelector from '../../../shared/components/ProveedorSelector/ProveedorSelector';
import FrigorificoCard from '../../../shared/scoped/admin-superadmin-frigorifico-logistica/FrigorificoCard/FrigorificoCard';
import EPCSearchBar from '../../../shared/scoped/admin-superadmin-frigorifico-logistica/EPCSearchBar/EPCSearchBar';
import EmpaqueSearchResult from '../../logistica/components/EmpaqueSearchResult/EmpaqueSearchResult';
import Alert from '../../../shared/components/Alert/Alert';
import './FrigorificoPage.css';

const LogisticaPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [frigorificos, setFrigorificos] = useState<any[]>([]);
  const [frigorificoSeleccionado, setFrigorificoSeleccionado] = useState<number | null>(null);
  const [frigorificoDetallado, setFrigorificoDetallado] = useState<any>(null);
  const [searchEPC, setSearchEPC] = useState('');
  const [searchResult, setSearchResult] = useState<any>(null);
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());
  const [confirmedProducts, setConfirmedProducts] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchFrigorificos = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getGestionLogisticaByUser(parseInt(user?.id || '0'));
        setFrigorificos(data.frigorificos || []);
      } catch (err: any) {
        console.error('Error fetching frigorificos:', err);
        setError('Error al cargar los frigoríficos.');
      } finally {
        setLoading(false);
      }
    };
    if (user?.id) fetchFrigorificos();
  }, [user?.id]);

  const cargarDetalle = async (idFrigorifico: number) => {
    try {
      setLoadingDetalle(true);
      setError(null);
      setFrigorificoDetallado(null);
      setSearchResult(null);
      setExpandedProducts(new Set());
      setConfirmedProducts(new Set());

      setFrigorificoSeleccionado(idFrigorifico);
      const data = await getGestionLogisticaByFrigorifico(parseInt(user?.id || '0'), idFrigorifico);
      setFrigorificoDetallado(data.frigorificos?.[0] ?? null);
    } catch (err: any) {
      console.error('Error fetching detalle:', err);
      setError('Error al cargar el detalle del frigorífico.');
    } finally {
      setLoadingDetalle(false);
    }
  };

  const handleSearch = () => {
    if (!frigorificoDetallado) {
      alert('Primero selecciona un frigorífico.');
      return;
    }
    if (searchEPC.length < 10) {
      alert('El EPC debe tener al menos 10 caracteres.');
      return;
    }

    let found: any = null;
    let foundEstacion: string = '';
    for (const estacion of frigorificoDetallado.estaciones) {
      for (const producto of estacion.productos) {
        const empaque = producto.empaques.find((e: any) => e.epc === searchEPC);
        if (empaque) {
          found = { ...producto, empaques: [empaque] };
          foundEstacion = estacion.id_estacion;
          break;
        }
      }
      if (found) break;
    }

    if (found) {
      setSearchResult({ producto: found, estacion: foundEstacion });
      setError(null);
      setSearchEPC('');
    } else {
      setSearchResult(null);
      setError('No se encontró ningún empaque con ese EPC.');
      setSearchEPC('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const toggleProduct = (productId: number) => {
    setExpandedProducts(prev => {
      const next = new Set(prev);
      if (next.has(productId.toString())) next.delete(productId.toString());
      else next.add(productId.toString());
      return next;
    });
  };

  const handleDeleteEmpaque = async (estacionId: string, epc: string) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este empaque? Esta acción no se puede deshacer.')) return;
    try {
      await deleteEmpaque(estacionId, epc);
      if (frigorificoDetallado && user?.id) {
        const data = await getGestionLogisticaByFrigorifico(parseInt(user.id), frigorificoDetallado.id_frigorifico);
        setFrigorificoDetallado(data.frigorificos?.[0] ?? null);
      }
      setSearchResult(null);
      alert('Empaque eliminado exitosamente.');
    } catch (err: any) {
      console.error('Error deleting empaque:', err);
      if (err.response?.status === 404) {
        alert('El empaque no existe, no pertenece a esta estación o ya fue vendido.');
      } else {
        alert('Error al eliminar el empaque. Inténtalo de nuevo.');
      }
    }
  };

  if (loading && frigorificos.length === 0) {
    return <div className="frigorifico-page">Cargando...</div>;
  }

  return (
    <div className="frigorifico-page">
      <div className="cuentas-header">
        <h1>Gestión Frigoríficos</h1>
        <p>Empaques por estación pendientes de recogida</p>
      </div>

      {error && (
        <Alert type="error" message={error} onDismiss={() => setError(null)} />
      )}

      {frigorificos.length > 0 && (
        <ProveedorSelector
          title="SELECCIONAR FRIGORÍFICO:"
          options={frigorificos.map(f => ({
            id: f.id_frigorifico,
            label: `${f.nombre_frigorifico} — ${f.ciudad?.nombre_ciudad || 'Sin ciudad'}`,
          }))}
          selectedId={frigorificoSeleccionado}
          onSelect={(id) => cargarDetalle(Number(id))}
          placeholder="Selecciona un frigorífico..."
          loading={loadingDetalle}
          actionLabel="Ver"
        />
      )}

      {searchResult && (
        <EmpaqueSearchResult
          result={searchResult}
          userName={user?.name || ''}
          onDelete={handleDeleteEmpaque}
        />
      )}

      {frigorificoDetallado && (
        <>
          <EPCSearchBar
            searchEPC={searchEPC}
            onSearchEPCChange={setSearchEPC}
            onSearch={handleSearch}
            onKeyPress={handleKeyPress}
            disabled={loading || loadingDetalle}
            label="Búsqueda por EPC"
            proveedorNombre={user?.name}
            frigorificoNombre={frigorificoDetallado.nombre_frigorifico}
            frigorificoDireccion={frigorificoDetallado.direccion}
          />

          <FrigorificoCard
            frigorifico={frigorificoDetallado}
            expandedProducts={expandedProducts}
            confirmedProducts={confirmedProducts}
            onToggleProduct={toggleProduct}
            onConfirmar={() => {}}
          />
        </>
      )}
    </div>
  );
};

export default LogisticaPage;

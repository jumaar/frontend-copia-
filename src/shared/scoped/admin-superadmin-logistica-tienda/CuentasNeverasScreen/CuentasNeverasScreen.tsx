import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../../../contexts/AuthContext';
import { useCuentasTienda } from '../hooks/useCuentasTienda';
import { procesarPago } from '../../../../services/api';
import CuentasTiendaView from '../components/CuentasTiendaView/CuentasTiendaView';
import GestionCobro from '../../admin-superadmin-logistica/components/GestionCobro/GestionCobro';
import ConfirmacionTransaccionModal from '../../admin-superadmin-logistica/components/ConfirmacionTransaccionModal/ConfirmacionTransaccionModal';
import TiendaSelector from '../components/TiendaSelector/TiendaSelector';
import Alert from '../../../components/Alert/Alert';

const CuentasNeverasScreen: React.FC = () => {
  const { user } = useAuth();
  const role = user?.role;
  const isTienda = role === 'tienda';
  const puedeCobrar = role === 'admin' || role === 'logistica';
  const mode = isTienda ? 'self' : 'admin';

  const {
    usuariosTienda,
    ciudades,
    transacciones,
    loading,
    loadingUsuarios,
    error,
    successMessage,
    ciudadSeleccionada,
    tiendaSeleccionada,
    neveraSeleccionada,
    busquedaNevera,
    mesesHistoricos,
    mesSeleccionado,
    tipoPago,
    montoPago,
    notaPago,
    procesandoPago,
    setProcesandoPago,
    saldoTotalLiquidar,
    showTiendaMenu,
    showCiudadMenu,
    showTipoMenu,
    expandedProductos,
    setCiudadSeleccionada,
    setBusquedaNevera,
    setShowTiendaMenu,
    setShowCiudadMenu,
    setShowTipoMenu,
    setTipoPago,
    setMontoPago,
    setNotaPago,
    setExpandedProductos,
    setError,
    setSuccessMessage,
    setTiendaSeleccionada,
    setNeveraSeleccionada,
    buscarNevera,
    consultarMesEspecifico,
    cargarTransacciones,
  } = useCuentasTienda({ mode });

  const [showModal, setShowModal] = useState(false);
  const [codigo, setCodigo] = useState('');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!(event.target as Element).closest('.dropdown')) {
        setShowCiudadMenu(false);
        setShowTiendaMenu(false);
        setShowTipoMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setShowCiudadMenu, setShowTiendaMenu, setShowTipoMenu]);

  const toggleProducto = (id: number) => {
    const next = new Set(expandedProductos);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedProductos(next);
  };

  const handleSeleccionarNevera = (idUsuario: number, idNevera: number) => {
    setExpandedProductos(new Set());
    setNeveraSeleccionada(idNevera);
    cargarTransacciones(idUsuario, idNevera);
  };

  const handleTiendaSelect = (idTienda: number) => {
    setTiendaSeleccionada(idTienda);
    setNeveraSeleccionada(null);
  };

  const ahora = new Date();
  const mesActual = ahora.getMonth() + 1;
  const añoActual = ahora.getFullYear();
  const esMesActual = mesSeleccionado?.mes === mesActual && mesSeleccionado?.año === añoActual;

  const entidadNombre = useMemo(() => {
    if (!neveraSeleccionada || !usuariosTienda.length) return '';
    for (const usuario of usuariosTienda) {
      for (const tienda of usuario.tiendas) {
        const nevera = tienda.neveras?.find(n => n.id_nevera === neveraSeleccionada);
        if (nevera) {
          return `${tienda.nombre_tienda} — Nevera #${nevera.id_nevera}`;
        }
      }
    }
    return '';
  }, [neveraSeleccionada, usuariosTienda]);

  const handleProcesarPago = () => {
    if (!tiendaSeleccionada || !neveraSeleccionada) return;
    if (tipoPago === 'abono' && (!montoPago || montoPago <= 0)) return;
    setCodigo('');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setCodigo('');
  };

  const handleConfirmar = async () => {
    if (!tiendaSeleccionada || !neveraSeleccionada) return;

    let montoFinal: number;
    const notaFinal = notaPago.trim() || undefined;

    if (tipoPago === 'pago') {
      montoFinal = saldoTotalLiquidar;
    } else {
      montoFinal = montoPago;
      if (!montoFinal || montoFinal <= 0) return;
    }

    let userId: number | null = null;
    for (const u of usuariosTienda) {
      const found = u.tiendas?.find(t => t.id_tienda === tiendaSeleccionada);
      if (found) {
        userId = u.id_usuario;
        break;
      }
    }
    if (!userId) {
      alert('Error: No se pudo encontrar el usuario de la tienda.');
      return;
    }

    const empaquesAfectados = transacciones?.empaques?.map((e: any) => e.id_empaque) || [];

    try {
      setProcesandoPago(true);
      const montoRedondeado = Math.ceil(montoFinal);
      const respuesta = await procesarPago(
        userId,
        montoRedondeado,
        neveraSeleccionada,
        notaFinal,
        empaquesAfectados.length > 0 ? empaquesAfectados : undefined
      );

      setTipoPago('');
      setMontoPago(0);
      setNotaPago('');
      setShowModal(false);
      setCodigo('');
      setSuccessMessage(respuesta.message || 'Cobro procesado exitosamente.');
      await cargarTransacciones(userId, neveraSeleccionada);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError('Error al procesar el cobro: ' + (err.response?.data?.message || err.message));
      setTimeout(() => setError(null), 5000);
    } finally {
      setProcesandoPago(false);
    }
  };

  if (loadingUsuarios) {
    return (
      <div className="cuentas-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando usuarios de tienda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="cuentas-page">
      <div className="cuentas-header">
        <h1>Cuentas de Neveras</h1>
        <p className="subtitle">
          Consulta las transacciones de productos pendientes y consolidados por nevera específica
        </p>

        <TiendaSelector
          title="SELECCIONAR NEVERA:"
          busquedaNevera={busquedaNevera}
          onBusquedaChange={setBusquedaNevera}
          onBuscar={buscarNevera}
          searchLoading={loading}
          ciudades={ciudades}
          ciudadSeleccionada={ciudadSeleccionada}
          onCiudadSelect={(c) => { setCiudadSeleccionada(c); setShowCiudadMenu(false); }}
          showCiudadMenu={showCiudadMenu}
          onToggleCiudadMenu={() => { setShowCiudadMenu(!showCiudadMenu); setShowTiendaMenu(false); setShowTipoMenu(false); }}
          loading={loadingUsuarios}
          usuariosTienda={usuariosTienda}
          tiendaSeleccionada={tiendaSeleccionada}
          neveraSeleccionada={neveraSeleccionada}
          showTiendaMenu={showTiendaMenu}
          showUserInfo={!isTienda}
          onToggleTiendaMenu={() => setShowTiendaMenu(!showTiendaMenu)}
          onTiendaSelect={handleTiendaSelect}
          onNeveraConsultar={handleSeleccionarNevera}
        />
      </div>

      {successMessage && (
        <Alert message={successMessage} onDismiss={() => setSuccessMessage(null)} type="success" />
      )}

      {error && (
        <Alert message={error} onDismiss={() => setError(null)} type="error" />
      )}

      {transacciones && (
        <CuentasTiendaView
          transacciones={transacciones}
          loading={loading}
          error={error}
          neveraSeleccionada={neveraSeleccionada}
          tiendaSeleccionada={tiendaSeleccionada}
          expandedProductos={expandedProductos}
          mesesHistoricos={mesesHistoricos}
          mesSeleccionado={mesSeleccionado}
          saldoTotalLiquidar={saldoTotalLiquidar}
          onToggleProducto={toggleProducto}
          onConsultarMes={consultarMesEspecifico}
        />
      )}

      {puedeCobrar && tiendaSeleccionada && neveraSeleccionada && transacciones && esMesActual && (
        <GestionCobro
          tipoPago={tipoPago}
          setTipoPago={setTipoPago}
          montoPago={montoPago}
          setMontoPago={setMontoPago}
          notaPago={notaPago}
          setNotaPago={setNotaPago}
          procesandoPago={procesandoPago}
          onProcesarPago={handleProcesarPago}
          userName={entidadNombre}
          saldoTotalLiquidar={saldoTotalLiquidar}
        />
      )}

      <ConfirmacionTransaccionModal
        isOpen={showModal}
        onClose={handleCloseModal}
        onConfirm={handleConfirmar}
        processing={procesandoPago}
        title={tipoPago === 'pago' ? 'Confirmar Cobro Total' : 'Confirmar Abono'}
        origen={entidadNombre}
        destino={user?.name || ''}
        monto={
          tipoPago === 'pago'
            ? saldoTotalLiquidar
            : montoPago
        }
        codigo={codigo}
        setCodigo={setCodigo}
        disabled={tipoPago === 'pago' ? saldoTotalLiquidar <= 0 : montoPago <= 0}
      />
    </div>
  );
};

export default CuentasNeverasScreen;

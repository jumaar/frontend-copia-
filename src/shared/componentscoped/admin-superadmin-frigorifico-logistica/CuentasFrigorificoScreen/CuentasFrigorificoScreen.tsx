import React, { useMemo } from 'react';
import { useAuth } from '../../../../contexts/AuthContext';
import { useCuentasFrigorifico } from '../useCuentasFrigorifico';
import CuentasFrigorificoView from '../CuentasFrigorificoView/CuentasFrigorificoView';
import GestionCobro from '../GestionCobro/GestionCobro';
import Dropdown from '../../../components/Dropdown/Dropdown';
import './CuentasFrigorificoScreen.css';

const CuentasFrigorificoPage: React.FC = () => {
  const { user } = useAuth();
  const isFrigorifico = user?.role === 'frigorifico';
  const isAdmin = !isFrigorifico;

  const {
    usuariosHermanos,
    usuarioSeleccionado,
    setUsuarioSeleccionado,
    transacciones,
    loading,
    loadingUsuarios,
    error,
    setError,
    successMessage,
    setSuccessMessage,
    mesesHistoricos,
    mesSeleccionado,
    tipoPago,
    setTipoPago,
    montoPago,
    setMontoPago,
    notaPago,
    setNotaPago,
    procesandoPago,
    esFrigorifico: _esFrigoHook,
    cargarTransacciones,
    consultarMesEspecifico,
    manejarPago,
    formatMoneda,
  } = useCuentasFrigorifico({ mode: isFrigorifico ? 'self' : 'admin' });

  const saldoPendientes = useMemo(() => {
    if (!transacciones?.transacciones) return 0;
    return transacciones.transacciones
      .filter((t: any) => t.nombre_estado_transaccion === 'PENDIENTE')
      .reduce((sum: number, t: any) => sum + t.monto, 0);
  }, [transacciones]);

  if (loadingUsuarios && isAdmin) {
    return (
      <div className="cuentas-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando usuarios frigorífico...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="cuentas-page">
      <div className="cuentas-header">
        {isFrigorifico ? (
          <>
            <h1>Mis Cuentas Globales</h1>
            <p className="subtitle">
              Revisa tus transacciones de productos pendientes y consolidados
            </p>
          </>
        ) : (
          <>
            <h1>Cuentas Frigoríficos</h1>
            <p className="subtitle">
              Consulta las transacciones de productos pendientes y consolidados por frigorífico
            </p>

            <div className="usuario-selector" style={{ marginTop: '1.5rem' }}>
              <div className="selector-container">
                <h3>SELECCIONAR FRIGORÍFICO:</h3>
                <Dropdown
                  options={usuariosHermanos.map(u => ({ id: u.id_usuario, label: `${u.nombre_usuario} ${u.apellido_usuario}` }))}
                  selectedId={usuarioSeleccionado}
                  onSelect={(id) => {
                    const numId = Number(id);
                    setUsuarioSeleccionado(numId);
                    cargarTransacciones(numId);
                  }}
                  placeholder="Selecciona un frigorífico..."
                  disabled={loadingUsuarios}
                  loading={loading}
                  variant="block"
                  actionLabel="Seleccionar"
                  renderLabel={(option, _isSelected) => {
                    const usuario = usuariosHermanos.find(u => u.id_usuario === option.id);
                    return (
                      <span className="dropdown-item-label">
                        ❄️ {option.label}
                        {usuario?.email && <span style={{ color: '#666', fontSize: '0.8rem' }}> ({usuario.email})</span>}
                      </span>
                    );
                  }}
                />
              </div>
            </div>
          </>
        )}

        {loading && !usuarioSeleccionado && isAdmin && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#666', marginTop: '1rem' }}>
            <div className="loading-spinner" style={{ width: '16px', height: '16px' }}></div>
            <span>Consultando transacciones...</span>
          </div>
        )}
      </div>

      {successMessage && (
        <div className="success-message">
          <div className="success-content">
            <span className="success-icon">✅</span>
            <p>{successMessage}</p>
            <button className="success-close-btn" onClick={() => setSuccessMessage(null)}>Cerrar</button>
          </div>
        </div>
      )}

      {error && (
        <div className="error-message">
          <div className="error-content">
            <span className="error-icon">⚠️</span>
            <p>{error}</p>
            <button className="error-retry-btn" onClick={() => setError(null)}>Cerrar</button>
          </div>
        </div>
      )}

      {(isFrigorifico || usuarioSeleccionado) && (
        <CuentasFrigorificoView
          transacciones={transacciones}
          loading={loading}
          error={error}
          successMessage={successMessage}
          mesesHistoricos={mesesHistoricos}
          mesSeleccionado={mesSeleccionado}
          consultarMesEspecifico={consultarMesEspecifico}
          setError={setError}
          setSuccessMessage={setSuccessMessage}
          esFrigorifico={isFrigorifico}
          formatMoneda={formatMoneda}
          hideHeader={true}
        />
      )}

      {isAdmin && usuarioSeleccionado && (
        <GestionCobro
          mode="entregar"
          tipoPago={tipoPago}
          setTipoPago={setTipoPago}
          montoPago={montoPago}
          setMontoPago={setMontoPago}
          notaPago={notaPago}
          setNotaPago={setNotaPago}
          procesandoPago={procesandoPago}
          onProcesarPago={manejarPago}
          userName={user?.name || ''}
          saldoTotalLiquidar={saldoPendientes}
        />
      )}
    </div>
  );
};

export default CuentasFrigorificoPage;

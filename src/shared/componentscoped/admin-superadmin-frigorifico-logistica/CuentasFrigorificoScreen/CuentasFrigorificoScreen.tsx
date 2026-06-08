import React, { useEffect, useMemo } from 'react';
import { useAuth } from '../../../../contexts/AuthContext';
import { useCuentasFrigorifico } from '../useCuentasFrigorifico';
import CuentasFrigorificoView from '../CuentasFrigorificoView/CuentasFrigorificoView';
import GestionCobro from '../GestionCobro/GestionCobro';
import type { UsuarioHermano } from '../../../types/cuentas-frigorifico.types';
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
    showMesesMenu,
    setShowMesesMenu,
    tipoPago,
    setTipoPago,
    montoPago,
    setMontoPago,
    notaPago,
    setNotaPago,
    procesandoPago,
    showTipoMenu,
    setShowTipoMenu,
    esFrigorifico: _esFrigoHook,
    cargarTransacciones,
    consultarMesEspecifico,
    manejarPago,
    formatMoneda,
  } = useCuentasFrigorifico({ mode: isFrigorifico ? 'self' : 'admin' });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!(event.target as Element).closest('.meses-dropdown')) {
        setShowMesesMenu(false);
        setShowTipoMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setShowMesesMenu, setShowTipoMenu]);

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
                <div className="meses-dropdown">
                  <button
                    className="dropdown-toggle"
                    onClick={() => setShowMesesMenu(!showMesesMenu)}
                    disabled={loadingUsuarios}
                  >
                    {usuarioSeleccionado
                      ? (() => { const u = usuariosHermanos.find((h: UsuarioHermano) => h.id_usuario === usuarioSeleccionado); return u ? `${u.nombre_usuario} ${u.apellido_usuario}` : `Usuario #${usuarioSeleccionado}`; })()
                      : <span>Selecciona un frigorífico...</span>}
                    <span className="dropdown-arrow">▼</span>
                  </button>
                  {showMesesMenu && (
                    <div className="dropdown-menu">
                      {usuariosHermanos.map((usuario: UsuarioHermano) => (
                        <div key={usuario.id_usuario} className="dropdown-item">
                          <span className="mes-fecha">
                            ❄️ {usuario.nombre_usuario} {usuario.apellido_usuario}
                            {usuario.email && <span style={{ color: '#666', fontSize: '0.8rem' }}> ({usuario.email})</span>}
                          </span>
                          <button
                            className={`btn-consultar ${usuarioSeleccionado === usuario.id_usuario ? 'activo' : ''}`}
                            onClick={() => { setUsuarioSeleccionado(usuario.id_usuario); setShowMesesMenu(false); cargarTransacciones(usuario.id_usuario); }}
                            disabled={loading}
                          >
                            Seleccionar
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
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
          showMesesMenu={showMesesMenu}
          consultarMesEspecifico={consultarMesEspecifico}
          setShowMesesMenu={setShowMesesMenu}
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
          showTipoMenu={showTipoMenu}
          setShowTipoMenu={setShowTipoMenu}
          onProcesarPago={manejarPago}
          userName={user?.name || ''}
          saldoTotalLiquidar={saldoPendientes}
        />
      )}
    </div>
  );
};

export default CuentasFrigorificoPage;

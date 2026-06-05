import React, { useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useCuentasFrigorifico } from '../hooks/useCuentasFrigorifico';
import CuentasFrigorificoView from '../components/CuentasFrigorificoView/CuentasFrigorificoView';
import type { UsuarioHermano } from '../types/cuentas-frigorifico.types';
import '../../apps/frigorifico/pages/CuentasPage.css';

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
        <div className="pago-abono-section" style={{ marginTop: '2rem', padding: '1.5rem', backgroundColor: 'var(--color-card-bg)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
          <h3 style={{ marginBottom: '1rem' }}>💰 Gestión de Cobro</h3>

          <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <label>Tipo de Transacción:</label>
            <div className="meses-dropdown">
              <button className="dropdown-toggle" onClick={() => setShowTipoMenu(!showTipoMenu)}>
                <span>{tipoPago === 'pago' ? 'Cobro Total' : tipoPago === 'abono' ? 'Abono' : 'Seleccionar tipo...'}</span>
                <span className="dropdown-arrow">▼</span>
              </button>
              {showTipoMenu && (
                <div className="dropdown-menu">
                  <div className="dropdown-item">
                    <span className="mes-fecha">Cobro Total</span>
                    <button className={`btn-consultar ${tipoPago === 'pago' ? 'activo' : ''}`} onClick={() => { setTipoPago('pago'); setShowTipoMenu(false); }}>Seleccionar</button>
                  </div>
                  <div className="dropdown-item">
                    <span className="mes-fecha">Abono</span>
                    <button className={`btn-consultar ${tipoPago === 'abono' ? 'activo' : ''}`} onClick={() => { setTipoPago('abono'); setShowTipoMenu(false); }}>Seleccionar</button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {tipoPago && (
            <div style={{ marginTop: '1rem' }}>
              {tipoPago === 'pago' ? (
                <div style={{ marginBottom: '1rem' }}>
                  <strong>Nota:</strong>
                  <input type="text" value={notaPago} onChange={e => setNotaPago(e.target.value)}
                    placeholder={`cobro total por ${user?.name || ''}`}
                    style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)' }}
                  />
                </div>
              ) : (
                <>
                  <div style={{ marginBottom: '1rem' }}>
                    <strong>Monto del Abono:</strong>
                    <input type="number" value={montoPago || ''} onChange={e => setMontoPago(parseFloat(e.target.value) || 0)}
                      min="0" style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)' }}
                    />
                  </div>
                  <div style={{ marginBottom: '1rem' }}>
                    <strong>Nota:</strong>
                    <input type="text" value={notaPago} onChange={e => setNotaPago(e.target.value)}
                      placeholder="Nota opcional"
                      style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)' }}
                    />
                  </div>
                </>
              )}
              <button
                className="btn-consultar"
                onClick={manejarPago}
                disabled={procesandoPago}
                style={{ padding: '0.5rem 1.5rem', fontSize: '1rem', marginTop: '0.5rem' }}
              >
                {procesandoPago ? 'Procesando...' : tipoPago === 'pago' ? 'Cobrar Total' : 'Realizar Abono'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CuentasFrigorificoPage;

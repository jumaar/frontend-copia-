import React, { useState, useEffect, useRef } from 'react';
import {
  getTiendasNeveras,
  iniciarSurtidoNevera,
  finalizarSurtidoNevera,
  retirarEmpaquesEstado5,
  validacionDosaTres,
} from '../services/api';
import { useSurtido } from '../contexts/SurtidoContext';

interface EmpaqueCambio {
  id_empaque: number;
  epc: string;
  peso_exacto_g: number;
  id_producto: number;
  fecha_vencimiento: string;
  porcentaje_vida: number;
}

interface ParaCambio5 {
  para_cambio: EmpaqueCambio[];
  vencidos: EmpaqueCambio[];
}

interface ProductoNevera {
  id_producto: number;
  nombre_producto: string;
  descripcion_producto: string;
  peso_nominal_g: number;
  tiene_stock: boolean;
  id_stock: number | null;
  stock_minimo: number;
  stock_maximo: number;
  venta_semanal: number;
  stock_ideal_final: number;
  calificacion_surtido: string;
  mensaje_sistema: string;
  stock_en_tiempo_real: number;
  activo: boolean;
  cantidad_a_surtir: number;
  empaques_disponibles_logistica: number;
  empaques_prioritarios_asignados: number;
}

interface NeveraCompletaData {
  nevera: {
    id_nevera: number;
    id_tienda: number;
    nombre_tienda: string;
    hora_ultimo_surtido?: string;
  };
  estadisticas: {
    total_productos: number;
    productos_con_stock: number;
    productos_sin_stock: number;
  };
  productos: ProductoNevera[];
  para_cambio_5?: ParaCambio5;
  resumen_logistica?: {
    id_logistica: number;
    total_empaques_estado_2: number;
    total_empaques_prioritarios_estado_6: number;
    neveras_competidoras_consideradas: number;
    neveras_excluidas_por_surtido_reciente: number;
    parametros: {
      dias_excluir: number;
      modo: string;
    };
  };
}

interface SurtirFlujoModalProps {
  isOpen: boolean;
  onClose: () => void;
  idNevera: number;
  nombreTienda: string;
}

type FaseType = 'review' | 'removal' | 'scanning';

const SurtirFlujoModal: React.FC<SurtirFlujoModalProps> = ({ isOpen, onClose, idNevera, nombreTienda }) => {
  const { surtidoEnCurso, iniciarSurtido, finalizarSurtido, actualizarFase, setScannedEpcs, actualizarConfirmations } = useSurtido();

  const [neveraData, setNeveraData] = useState<NeveraCompletaData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fase, setFase] = useState<FaseType>('review');
  const [confirmations, setConfirmations] = useState<Record<number, boolean>>({});

  const [scanningSearch, setScanningSearch] = useState('');
  const [scannedItems, setScannedItems] = useState<Array<{ epc: string; id_empaque?: number }>>([]);
  const scanningInputRef = useRef<HTMLInputElement | null>(null);
  const [validacionResult, setValidacionResult] = useState<{
    empaques_procesados: any[];
    empaques_no_procesados: any[];
  } | null>(null);
  const [retiroResult, setRetiroResult] = useState<{
    message: string;
    empaques_procesados: any[];
    empaques_no_procesados: any[];
  } | null>(null);
  const [removalScanned, setRemovalScanned] = useState<Set<number>>(new Set());
  const [removalSearch, setRemovalSearch] = useState('');
  const removalInputRef = useRef<HTMLInputElement | null>(null);
  const [validando, setValidando] = useState(false);
  const [finalizando, setFinalizando] = useState(false);
  const [retirando, setRetirando] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmInput, setConfirmInput] = useState("");
  const [expandedAlerts, setExpandedAlerts] = useState<Set<number>>(new Set());


  const isFromContext = !!(surtidoEnCurso && surtidoEnCurso.idNevera === idNevera);

  useEffect(() => {
    if (isOpen && idNevera) {
      if (isFromContext && surtidoEnCurso) {
        setFase(surtidoEnCurso.phase);
        setConfirmations(surtidoEnCurso.confirmations || {});
        setScannedItems(surtidoEnCurso.scannedEpcs || []);
        if (surtidoEnCurso.neveraData) {
          setNeveraData(surtidoEnCurso.neveraData);
        } else {
          fetchNeveraData();
        }
      } else {
        setFase('review');
        setConfirmations({});
        setScannedItems([]);
        setScanningSearch('');
        setValidacionResult(null);
        setRetiroResult(null);
        setRemovalScanned(new Set());
        setRemovalSearch('');
        setNeveraData(null);
        fetchNeveraData();
      }
    }
  }, [isOpen, idNevera]);

  const fetchNeveraData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data: NeveraCompletaData = await getTiendasNeveras(idNevera);
      setNeveraData(data);
    } catch (err: any) {
      console.error('Error fetching nevera data:', err);
      setError('Error al cargar los datos de la nevera');
    } finally {
      setLoading(false);
    }
  };

  const productosASurtir = neveraData
    ? neveraData.productos.filter((p) => p.cantidad_a_surtir > 0)
    : [];

  const allConfirmed = productosASurtir.length > 0 && productosASurtir.every((p) => confirmations[p.id_producto]);

  const getCalificacionColor = (calificacion: string) => {
    switch (calificacion.toLowerCase()) {
      case 'crítica': return '#ef4444';
      case 'baja': return '#f97316';
      case 'media': return '#f59e0b';
      case 'alta': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getCalificacionOrder = (calificacion: string) => {
    switch (calificacion.toLowerCase()) {
      case 'crítica': return 1;
      case 'baja': return 2;
      case 'media': return 3;
      case 'alta': return 4;
      default: return 5;
    }
  };

  interface AlertaBadge {
    count: number;
    color: string;
    bg: string;
    tooltip: string[];
    label: string;
  }

  const getAlertaBadge = (producto: ProductoNevera): AlertaBadge | null => {
    const tooltips: string[] = [];
    let maxSeverity = 0;
    let color = '#dc2626';
    let bg = '#fef2f2';
    let label = 'VENCIDO';

    const vencidos = neveraData?.para_cambio_5?.vencidos?.filter(
      (e) => e.id_producto === producto.id_producto
    ) || [];
    vencidos.forEach((e) => {
      tooltips.push(`VENCIDO — Retirar #${e.id_empaque}: ${e.epc}`);
      if (4 > maxSeverity) { maxSeverity = 4; color = '#dc2626'; bg = '#fef2f2'; label = 'VENCIDO'; }
    });

    const paraCambio = neveraData?.para_cambio_5?.para_cambio?.filter(
      (e) => e.id_producto === producto.id_producto
    ) || [];
    paraCambio.forEach((e) => {
      tooltips.push(`PRIORITARIO — Retirar #${e.id_empaque}: ${e.epc}`);
      if (3 > maxSeverity) { maxSeverity = 3; color = '#f59e0b'; bg = '#fef3c7'; label = 'PRIORITARIO'; }
    });

    if (producto.empaques_prioritarios_asignados > 0) {
      tooltips.push(`RESURTIDO — Recibir ${producto.empaques_prioritarios_asignados} prioritario(s)`);
      if (2 > maxSeverity) { maxSeverity = 2; color = '#3b82f6'; bg = '#eff6ff'; label = 'RESURTIDO'; }
    }

    if (producto.mensaje_sistema) {
      tooltips.push(`AVISO — ${producto.mensaje_sistema}`);
      if (2 > maxSeverity) { maxSeverity = 2; color = '#f59e0b'; bg = '#fef3c7'; label = 'AVISO'; }
    }

    if (tooltips.length === 0) return null;

    return { count: tooltips.length, color, bg, tooltip: tooltips, label };
  };

  const sortedProductos = productosASurtir.slice().sort((a, b) => {
    return getCalificacionOrder(a.calificacion_surtido) - getCalificacionOrder(b.calificacion_surtido);
  });

  const handleToggleConfirm = (idProducto: number) => {
    setConfirmations((prev) => {
      const updated = { ...prev, [idProducto]: !prev[idProducto] };
      actualizarConfirmations(updated);
      return updated;
    });
    if (!confirmations[idProducto]) {
      setExpandedAlerts((prev) => {
        const next = new Set(prev);
        next.delete(idProducto);
        return next;
      });
    }
  };

  const handleToggleAlertExpand = (idProducto: number) => {
    setExpandedAlerts((prev) => {
      const next = new Set(prev);
      if (next.has(idProducto)) {
        next.delete(idProducto);
      } else {
        next.add(idProducto);
      }
      return next;
    });
  };

  const handleConfirmarInicio = () => {
    setShowConfirmModal(true);
    setConfirmInput("");
  };

  const ejecutarConfirmarInicio = async () => {
    try {
      setLoading(true);
      const response = await iniciarSurtidoNevera(idNevera);

      const stockData = response.stock_nevera || neveraData?.productos.map((p) => ({
        id_nevera: idNevera,
        id_producto: p.id_producto,
        nombre_producto: p.nombre_producto,
        peso_nominal_g: p.peso_nominal_g,
        stock_ideal_final: p.stock_ideal_final,
        stock_en_tiempo_real: p.stock_en_tiempo_real,
        calificacion_surtido: p.calificacion_surtido,
      })) || [];

      iniciarSurtido({
        idNevera,
        nombreTienda: neveraData?.nevera.nombre_tienda || nombreTienda,
        stockData,
        phase: 'removal',
        neveraData,
        scannedEpcs: [],
        confirmations,
      });

      setFase('removal');
      actualizarFase('removal');
      alert(`✅ ${response.message || 'Surtido iniciado exitosamente'}`);
    } catch (err: any) {
      console.error('Error al iniciar surtido:', err);
      if (err.response?.data?.message === 'Primero debe distribuir el inventario antes de surtir') {
        alert('⚠️ Primero debes distribuir el inventario antes de surtir.');
      } else {
        alert('❌ Error al iniciar el surtido. Inténtelo de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmarInicioConValidacion = () => {
    if (confirmInput.trim() !== idNevera.toString()) {
      alert('⚠️ Número de nevera incorrecto. Por favor escribe el número correcto de la nevera para confirmar.');
      return;
    }
    setShowConfirmModal(false);
    setConfirmInput("");
    ejecutarConfirmarInicio();
  };

  const handleCancelarConfirmacion = () => {
    setShowConfirmModal(false);
    setConfirmInput("");
  };

  const playBeep = (type: 'success' | 'error') => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'square';
      if (type === 'success') {
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.25);
      } else {
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch (_) {}
  };

  const getProductoNombre = (idProducto: number): string => {
    if (!neveraData) return '';
    const p = neveraData.productos.find((pr) => pr.id_producto === idProducto);
    return p?.nombre_producto || '';
  };

  const handleRemovalSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const query = removalSearch.trim();
    if (!query || !neveraData?.para_cambio_5) return;

    const isId = /^\d+$/.test(query);
    let foundId: number | null = null;

    for (const item of neveraData.para_cambio_5.para_cambio) {
      if (isId && item.id_empaque === parseInt(query)) { foundId = item.id_empaque; break; }
      if (!isId && item.epc.toLowerCase() === query.toLowerCase()) { foundId = item.id_empaque; break; }
    }
    if (foundId === null) {
      for (const item of neveraData.para_cambio_5.vencidos) {
        if (isId && item.id_empaque === parseInt(query)) { foundId = item.id_empaque; break; }
        if (!isId && item.epc.toLowerCase() === query.toLowerCase()) { foundId = item.id_empaque; break; }
      }
    }

    if (foundId !== null) {
      setRemovalScanned((prev) => new Set(prev).add(foundId!));
      playBeep('success');
    } else {
      playBeep('error');
    }
    setRemovalSearch('');
    setTimeout(() => removalInputRef.current?.focus(), 50);
  };

  const handleCancelarRemoval = async () => {
    try {
      await finalizarSurtidoNevera(idNevera);
      finalizarSurtido();
      onClose();
    } catch (_) {
      alert('❌ Error al cancelar el surtido. Inténtelo de nuevo.');
    }
  };

  const handleRetirarEmpaques = async () => {
    if (!neveraData?.para_cambio_5) return;

    const totalEmpaques: Array<{ epc: string; id_empaque: number }> = [
      ...neveraData.para_cambio_5.para_cambio.map((e) => ({ epc: e.epc, id_empaque: e.id_empaque })),
      ...neveraData.para_cambio_5.vencidos.map((e) => ({ epc: e.epc, id_empaque: e.id_empaque })),
    ];

    if (totalEmpaques.length === 0) {
      setFase('scanning');
      actualizarFase('scanning');
      setScanningSearch('');
      return;
    }

    const scannedPackages = totalEmpaques.filter((e) => removalScanned.has(e.id_empaque));

    if (scannedPackages.length === 0) {
      alert('⚠️ No se ha escaneado ningún empaque. Se pasará al escaneo sin confirmar retiros.');
      setFase('scanning');
      actualizarFase('scanning');
      setScanningSearch('');
      return;
    }

    const unscannedCount = totalEmpaques.length - scannedPackages.length;
    if (unscannedCount > 0) {
      alert(`⚠️ ${unscannedCount} empaque(s) no fueron escaneados y NO serán retirados. Solo se confirmarán los ${scannedPackages.length} empaques marcados en gris.`);
    }

    try {
      setRetirando(true);
      setRetiroResult(null);
      const timestamp = Math.floor(Date.now() / 1000);
      const result = await retirarEmpaquesEstado5({ timestamp, pending_packages: scannedPackages });
      setRetiroResult({
        message: result.message || 'Cambio de estado completado',
        empaques_procesados: result.empaques_procesados || [],
        empaques_no_procesados: result.empaques_no_procesados || [],
      });
      setFase('scanning');
      actualizarFase('scanning');
      setScanningSearch('');
    } catch (err: any) {
      console.error('Error al retirar empaques:', err);
      if (err.response?.status === 400 && err.response?.data?.empaques_no_procesados) {
        setRetiroResult({
          message: err.response.data.error || 'Ningún empaque pudo ser procesado',
          empaques_procesados: [],
          empaques_no_procesados: err.response.data.empaques_no_procesados,
        });
      } else {
        alert('❌ Error al retirar empaques. Inténtelo de nuevo.');
      }
    } finally {
      setRetirando(false);
    }
  };

  const handleScanningKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const query = scanningSearch.trim();
    if (!query) return;

    const duplicate = scannedItems.some(
      (item) => item.epc.toLowerCase() === query.toLowerCase() ||
                (item.id_empaque && String(item.id_empaque) === query)
    );
    if (duplicate) {
      playBeep('error');
      setScanningSearch('');
      setTimeout(() => scanningInputRef.current?.focus(), 50);
      return;
    }

    const isId = /^\d+$/.test(query);
    const newItem: { epc: string; id_empaque?: number } = isId
      ? { epc: query, id_empaque: parseInt(query) }
      : { epc: query };

    const updated = [...scannedItems, newItem];
    setScannedItems(updated);
    setScannedEpcs(updated);
    playBeep('success');
    setScanningSearch('');
    setTimeout(() => scanningInputRef.current?.focus(), 50);
  };

  const handleValidarEmpaques = async () => {
    if (scannedItems.length === 0) {
      alert('No hay EPCs escaneados para validar.');
      return;
    }

    try {
      setValidando(true);
      setValidacionResult(null);
      const timestamp = Math.floor(Date.now() / 1000);
      const result = await validacionDosaTres({
        id_nevera: idNevera,
        timestamp,
        pending_packages: scannedItems.map((item) => ({
          epc: item.epc,
          id_empaque: item.id_empaque,
        })),
      });
      setValidacionResult({
        empaques_procesados: result.empaques_procesados || [],
        empaques_no_procesados: result.empaques_no_procesados || [],
      });
    } catch (err: any) {
      console.error('Error en validación:', err);
      alert(err.response?.data?.message || '❌ Error en la validación de empaques.');
    } finally {
      setValidando(false);
    }
  };

  const handleFinalizarSurtido = async () => {
    try {
      setFinalizando(true);
      const response = await finalizarSurtidoNevera(idNevera);
      alert(`✅ ${response.message || 'Surtido finalizado exitosamente'}`);
      finalizarSurtido();
      onClose();
    } catch (err: any) {
      console.error('Error al finalizar surtido:', err);
      if (err.response?.status === 404) {
        alert('❌ Nevera no encontrada.');
      } else if (err.response?.status === 403) {
        alert('❌ No tienes permisos para finalizar este surtido.');
      } else if (err.response?.status === 400) {
        alert('❌ Error en los datos. El surtido no puede ser finalizado en este momento.');
      } else if (err.response?.status === 401) {
        alert('⚠️ Sesión expirada. Redirigiendo al login...');
        window.location.href = '/login';
      } else {
        alert('❌ Error al finalizar el surtido.');
      }
    } finally {
      setFinalizando(false);
    }
  };

  if (!isOpen) return null;

  const paraCambio5 = neveraData?.para_cambio_5;
  const hasCambio5 = !!(paraCambio5 && (paraCambio5.para_cambio.length > 0 || paraCambio5.vencidos.length > 0));

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'var(--color-modal-bg)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        padding: '20px 30px',
        borderBottom: '2px solid var(--color-table-border)',
        backgroundColor: 'var(--color-modal-header-bg)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ margin: '0 0 5px 0', color: 'var(--color-text-primary)', fontSize: '24px', fontWeight: 'bold' }}>
            🏪 Nevera ID: {idNevera} — {neveraData?.nevera.nombre_tienda || nombreTienda}
          </h1>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '12px',
            marginTop: '12px',
          }}>
            {['review', 'removal', 'scanning'].map((f, _i) => {
              const stepLabels = ['1. Revisión Inventario', '2. Retirar Cambio/Vencidos', '3. Escaneo EPCs'];
              const currentIdx = f === 'review' ? 0 : f === 'removal' ? 1 : 2;
              const activeIdx = fase === 'review' ? 0 : fase === 'removal' ? 1 : 2;
              const isActive = currentIdx === activeIdx;
              const isDone = currentIdx < activeIdx;
              return (
                <div key={f} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  backgroundColor: isActive ? '#667eea' : isDone ? '#10b981' : 'var(--color-badge-inactive)',
                  color: isActive || isDone ? 'white' : 'var(--color-text-secondary)',
                  fontWeight: 'bold',
                  fontSize: '13px',
                }}>
                  {isDone ? '✓' : ''} {stepLabels[currentIdx]}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: '40px', fontSize: '18px' }}>
            Cargando datos de la nevera...
          </div>
        )}

        {error && (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: '#ef4444',
            backgroundColor: 'var(--color-alert-error-bg)',
            border: '1px solid var(--color-alert-error-border)',
            borderRadius: '8px',
          }}>
            {error}
          </div>
        )}

        {/* ============ FASE REVIEW ============ */}
        {fase === 'review' && neveraData && (
          <>
            <div style={{
              backgroundColor: 'var(--color-alert-warning-bg)',
              border: '2px solid #f59e0b',
              borderRadius: '10px',
              padding: '15px',
              marginBottom: '20px',
            }}>
              <h3 style={{ margin: '0 0 8px 0', color: 'var(--color-alert-warning-text)', fontSize: '16px', fontWeight: 'bold' }}>
                📋 Revisión de Inventario Sugerido
              </h3>
              <p style={{ margin: 0, color: 'var(--color-alert-warning-text)', fontSize: '14px' }}>
                Revisa los productos a surtir. Activa los toggles para cada producto que vas a cargar.
              </p>
            </div>

            {productosASurtir.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-secondary)', fontSize: '16px' }}>
                🎉 Todos los productos están al nivel ideal. No hay nada que surtir.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '14px',
                  backgroundColor: 'var(--color-modal-bg)',
                }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--color-table-header-bg)' }}>
                      <th style={thStyle}>Confirmación</th>
                      <th style={thStyle}>Producto</th>
                      <th style={thStyle}>Total a Surtir</th>
                      <th style={thStyle}>Stock Actual</th>
                      <th style={thStyle}>Stock Ideal</th>
                      <th style={thStyle}>Disp. Logística</th>
                      <th style={thStyle}>Prioritarios</th>
                      <th style={thStyle}>Calificación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedProductos.map((producto) => {
                      const badge = getAlertaBadge(producto);
                      const estaConfirmado = !!confirmations[producto.id_producto];
                      const mostrarBadge = badge && !estaConfirmado;
                      const estaExpandido = expandedAlerts.has(producto.id_producto);
                      return (
                        <React.Fragment key={producto.id_producto}>
                          <tr>
                          <td style={tdStyleCenter}>
                            <div style={{
                              position: 'relative',
                              width: '50px',
                              height: '24px',
                              backgroundColor: estaConfirmado ? '#10b981' : '#e5e7eb',
                              borderRadius: '12px',
                              cursor: 'pointer',
                              margin: '0 auto',
                            }} onClick={() => handleToggleConfirm(producto.id_producto)}>
                              <div style={{
                                position: 'absolute',
                                top: '2px',
                                left: estaConfirmado ? '26px' : '2px',
                                width: '20px',
                                height: '20px',
                                backgroundColor: 'var(--color-modal-bg)',
                                borderRadius: '50%',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                              }} />
                            </div>
                            <div style={{ fontSize: '10px', marginTop: '2px', color: estaConfirmado ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>
                              {estaConfirmado ? 'CONFIRMADO' : 'PENDIENTE'}
                            </div>
                          </td>
                          <td style={tdStyle}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <div>
                                <div style={{ fontWeight: 'bold' }}>{producto.nombre_producto}</div>
                                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{producto.peso_nominal_g}g</div>
                              </div>
                              {mostrarBadge && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleAlertExpand(producto.id_producto);
                                  }}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '5px 12px',
                                    backgroundColor: badge.bg,
                                    border: `2px solid ${badge.color}`,
                                    borderRadius: '14px',
                                    fontSize: '11px',
                                    fontWeight: 'bold',
                                    color: badge.color,
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap',
                                    flexShrink: 0,
                                    WebkitTapHighlightColor: 'transparent',
                                    minWidth: '44px',
                                    minHeight: '34px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                  }}
                                >
                                  <span>{badge.label}</span>
                                  <span style={{ fontSize: '10px', marginLeft: '2px' }}>{estaExpandido ? '▲' : '▼'}</span>
                                </button>
                              )}
                            </div>
                          </td>
                          <td style={{ ...tdStyleCenter, fontWeight: 'bold', fontSize: '18px', color: '#059669' }}>
                            {producto.cantidad_a_surtir}
                          </td>
                          <td style={{ ...tdStyleCenter, fontWeight: 'bold', fontSize: '16px', color: producto.stock_en_tiempo_real === 0 ? '#ef4444' : '#10b981' }}>
                            {producto.stock_en_tiempo_real}
                          </td>
                          <td style={{ ...tdStyleCenter, fontWeight: 'bold', fontSize: '16px' }}>
                            {producto.stock_ideal_final}
                          </td>
                          <td style={{ ...tdStyleCenter, fontWeight: 'bold', fontSize: '16px', color: producto.empaques_disponibles_logistica > 0 ? '#059669' : '#ef4444' }}>
                            {producto.empaques_disponibles_logistica}
                          </td>
                          <td style={{ ...tdStyleCenter, fontWeight: 'bold', fontSize: '16px', color: producto.empaques_prioritarios_asignados > 0 ? '#f59e0b' : '#6b7280' }}>
                            {producto.empaques_prioritarios_asignados}
                          </td>
                          <td style={tdStyleCenter}>
                            <span style={{
                              backgroundColor: getCalificacionColor(producto.calificacion_surtido),
                              color: 'white',
                              padding: '4px 8px',
                              borderRadius: '12px',
                              fontSize: '11px',
                              fontWeight: 'bold',
                            }}>
                              {producto.calificacion_surtido || 'Sin calificar'}
                            </span>
                          </td>
                        </tr>
                        {estaExpandido && mostrarBadge && badge && (
                          <tr>
                            <td colSpan={8} style={{ padding: '4px 12px 8px', border: 0, backgroundColor: 'var(--color-modal-header-bg)' }}>
                              {badge.tooltip.map((linea, idx) => (
                                <div key={idx} style={{
                                  padding: '6px 10px',
                                  margin: '3px 0',
                                  backgroundColor: idx === 0 ? badge.bg : '#ffffff',
                                  border: `1px solid ${badge.color}`,
                                  borderLeft: `5px solid ${badge.color}`,
                                  borderRadius: '6px',
                                  fontSize: '13px',
                                  color: badge.color,
                                  fontWeight: 'bold',
                                  wordBreak: 'break-word',
                                }}>
                                  {linea}
                                </div>
                              ))}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* ============ FASE REMOVAL ============ */}
        {fase === 'removal' && neveraData && (
          <>
            <div style={{
              backgroundColor: 'var(--color-alert-success-bg)',
              border: '2px solid #10b981',
              borderRadius: '10px',
              padding: '15px',
              marginBottom: '20px',
            }}>
              <h3 style={{ margin: '0 0 8px 0', color: 'var(--color-alert-success-text)', fontSize: '16px', fontWeight: 'bold' }}>
                ✅ Surtido Iniciado — Ahora retire los empaques para cambio o vencidos
              </h3>
              <p style={{ margin: 0, color: 'var(--color-alert-success-text)', fontSize: '14px' }}>
                Escanee el EPC o ingrese el ID de cada empaque a retirar y presione Enter. Los empaques confirmados se marcarán en gris.
              </p>
            </div>

            {/* Scanner / Buscador */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '20px',
              padding: '15px',
              backgroundColor: 'var(--color-alert-info-bg)',
              border: '2px solid #3b82f6',
              borderRadius: '10px',
            }}>
              <span style={{ fontSize: '20px' }}>🔍</span>
              <input
                ref={removalInputRef}
                type="text"
                value={removalSearch}
                placeholder="Escanee EPC o ingrese ID del empaque..."
                onChange={(e) => setRemovalSearch(e.target.value)}
                onKeyDown={handleRemovalSearchKeyDown}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  border: '2px solid var(--color-border-strong)',
                  borderRadius: '8px',
                  fontSize: '18px',
                  outline: 'none',
                }}
                onFocus={(e) => { e.target.style.borderColor = '#3b82f6'; }}
                onBlur={(e) => { e.target.style.borderColor = 'var(--color-border-strong)'; }}
              />
              <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
                Escaneados: <strong style={{ color: '#3b82f6' }}>{removalScanned.size}</strong>
                {hasCambio5 ? <> / {(paraCambio5!.para_cambio.length + paraCambio5!.vencidos.length)}</> : ''}
              </span>
            </div>

            {hasCambio5 ? (
              <div style={{ display: 'grid', gap: '20px' }}>
                {paraCambio5!.para_cambio.length > 0 && (
                  <div style={{
                    border: '1px solid #f59e0b',
                    borderRadius: '12px',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      backgroundColor: 'var(--color-alert-warning-bg)',
                      padding: '12px 20px',
                      borderBottom: '1px solid #f59e0b',
                    }}>
                      <h3 style={{ margin: 0, color: 'var(--color-alert-warning-text)', fontSize: '18px', fontWeight: 'bold' }}>
                        🔄 Empaques para Cambio ({paraCambio5!.para_cambio.length})
                      </h3>
                    </div>
                    <div style={{ overflowX: 'auto', padding: '10px' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                        <thead>
                          <tr style={{ backgroundColor: 'var(--color-modal-header-bg)' }}>
                            <th style={thStyle}>ID Emp.</th>
                            <th style={thStyle}>EPC</th>
                            <th style={thStyle}>Producto</th>
                            <th style={thStyle}>Peso (g)</th>
                            <th style={thStyle}>F. Vencimiento</th>
                            <th style={thStyle}>% Vida</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paraCambio5!.para_cambio.map((empaque) => {
                            const isScanned = removalScanned.has(empaque.id_empaque);
                            return (
                              <tr
                                key={`pc-${empaque.id_empaque}`}
                                style={{
                                  backgroundColor: isScanned ? '#4b5563' : 'transparent',
                                  color: isScanned ? 'var(--color-text-secondary)' : undefined,
                                  transition: 'background-color 0.3s ease',
                                }}
                              >
                                <td style={tdStyleCenter}>{empaque.id_empaque}</td>
                                <td style={{ ...tdStyle, fontWeight: 'bold', color: isScanned ? '#9ca3af' : '#d97706' }}>{empaque.epc}</td>
                                <td style={tdStyle}>{getProductoNombre(empaque.id_producto) || empaque.id_producto}</td>
                                <td style={tdStyleCenter}>{empaque.peso_exacto_g}</td>
                                <td style={tdStyleCenter}>{new Date(empaque.fecha_vencimiento).toLocaleDateString('es-CO')}</td>
                                <td style={tdStyleCenter}>
                                  <span style={{
                                    padding: '3px 8px',
                                    borderRadius: '6px',
                                    backgroundColor: isScanned ? 'var(--color-text-secondary)' : 'var(--color-alert-warning-bg)',
                                    color: isScanned ? 'var(--color-text-secondary)' : 'var(--color-alert-warning-text)',
                                    fontWeight: 'bold',
                                    fontSize: '13px',
                                  }}>
                                    {empaque.porcentaje_vida.toFixed(1)}%
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {paraCambio5!.vencidos.length > 0 && (
                  <div style={{
                    border: '1px solid #ef4444',
                    borderRadius: '12px',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      backgroundColor: 'var(--color-alert-error-bg)',
                      padding: '12px 20px',
                      borderBottom: '1px solid #ef4444',
                    }}>
                      <h3 style={{ margin: 0, color: 'var(--color-alert-error-text)', fontSize: '18px', fontWeight: 'bold' }}>
                        ⛔ Empaques Vencidos ({paraCambio5!.vencidos.length})
                      </h3>
                    </div>
                    <div style={{ overflowX: 'auto', padding: '10px' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                        <thead>
                          <tr style={{ backgroundColor: 'var(--color-alert-error-bg)' }}>
                            <th style={thStyle}>ID Emp.</th>
                            <th style={thStyle}>EPC</th>
                            <th style={thStyle}>Producto</th>
                            <th style={thStyle}>Peso (g)</th>
                            <th style={thStyle}>F. Vencimiento</th>
                            <th style={thStyle}>% Vida</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paraCambio5!.vencidos.map((empaque) => {
                            const isScanned = removalScanned.has(empaque.id_empaque);
                            return (
                              <tr
                                key={`ven-${empaque.id_empaque}`}
                                style={{
                                  backgroundColor: isScanned ? '#4b5563' : 'var(--color-alert-error-bg)',
                                  color: isScanned ? 'var(--color-text-secondary)' : undefined,
                                  transition: 'background-color 0.3s ease',
                                }}
                              >
                                <td style={tdStyleCenter}>{empaque.id_empaque}</td>
                                <td style={{ ...tdStyle, fontWeight: 'bold', color: isScanned ? '#9ca3af' : '#dc2626' }}>{empaque.epc}</td>
                                <td style={tdStyle}>{getProductoNombre(empaque.id_producto) || empaque.id_producto}</td>
                                <td style={tdStyleCenter}>{empaque.peso_exacto_g}</td>
                                <td style={tdStyleCenter}>{new Date(empaque.fecha_vencimiento).toLocaleDateString('es-CO')}</td>
                                <td style={tdStyleCenter}>
                                  <span style={{
                                    padding: '3px 8px',
                                    borderRadius: '6px',
                                    backgroundColor: isScanned ? 'var(--color-text-secondary)' : 'var(--color-alert-error-border)',
                                    color: isScanned ? '#e5e7eb' : '#991b1b',
                                    fontWeight: 'bold',
                                    fontSize: '13px',
                                  }}>
                                    {empaque.porcentaje_vida.toFixed(1)}%
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-secondary)', fontSize: '16px' }}>
                ✅ No hay empaques para cambio ni vencidos en esta nevera.
              </div>
            )}

            {retiroResult && (
              <div style={{
                border: '1px solid var(--color-table-border)',
                borderRadius: '12px',
                overflow: 'hidden',
                marginTop: '20px',
              }}>
                <div style={{ backgroundColor: 'var(--color-table-header-bg)', padding: '12px 20px', borderBottom: '1px solid var(--color-table-border)' }}>
                  <h3 style={{ margin: 0, color: 'var(--color-text-primary)', fontSize: '16px', fontWeight: 'bold' }}>
                    📊 Resultados del Retiro de Empaques
                  </h3>
                  <p style={{ margin: '4px 0 0 0', color: 'var(--color-text-secondary)', fontSize: '13px' }}>{retiroResult.message}</p>
                </div>
                <div style={{ padding: '15px' }}>
                  {retiroResult.empaques_procesados.length > 0 && (
                    <div style={{ marginBottom: '15px' }}>
                      <h4 style={{ margin: '0 0 8px 0', color: '#10b981' }}>
                        ✅ Procesados ({retiroResult.empaques_procesados.length})
                      </h4>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#f0fdf4' }}>
                            <th style={thStyle}>ID Emp.</th>
                            <th style={thStyle}>EPC</th>
                            <th style={thStyle}>Producto</th>
                            <th style={thStyle}>Peso (g)</th>
                            <th style={thStyle}>Nuevo Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {retiroResult.empaques_procesados.map((emp: any, i: number) => (
                            <tr key={i}>
                              <td style={tdStyleCenter}>{emp.id_empaque}</td>
                              <td style={{ ...tdStyle, fontWeight: 'bold', color: '#059669' }}>{emp.epc}</td>
                              <td style={tdStyle}>{emp.nombre_producto || '-'}</td>
                              <td style={tdStyleCenter}>{emp.peso_exacto_g || '-'}</td>
                              <td style={tdStyleCenter}>
                                <span style={{
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                  backgroundColor: 'var(--color-alert-success-bg)',
                                  color: 'var(--color-alert-success-text)',
                                  fontWeight: 'bold',
                                  fontSize: '12px',
                                }}>
                                  {emp.nuevo_estado || 6}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {retiroResult.empaques_no_procesados.length > 0 && (
                    <div>
                      <h4 style={{ margin: '0 0 8px 0', color: '#ef4444' }}>
                        ❌ No Procesados ({retiroResult.empaques_no_procesados.length})
                      </h4>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                          <tr style={{ backgroundColor: 'var(--color-alert-error-bg)' }}>
                            <th style={thStyle}>ID Emp.</th>
                            <th style={thStyle}>EPC</th>
                            <th style={thStyle}>Error</th>
                          </tr>
                        </thead>
                        <tbody>
                          {retiroResult.empaques_no_procesados.map((emp: any, i: number) => (
                            <tr key={i}>
                              <td style={tdStyleCenter}>{emp.id_empaque || '-'}</td>
                              <td style={{ ...tdStyle, color: 'var(--color-alert-error-text)' }}>{emp.epc || '-'}</td>
                              <td style={{ ...tdStyle, color: 'var(--color-alert-error-text)' }}>{emp.error}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* ============ FASE SCANNING ============ */}
        {fase === 'scanning' && (
          <>
            <div style={{
              backgroundColor: '#dbeafe',
              border: '2px solid #3b82f6',
              borderRadius: '10px',
              padding: '15px',
              marginBottom: '20px',
            }}>
              <h3 style={{ margin: '0 0 8px 0', color: '#1e40af', fontSize: '16px', fontWeight: 'bold' }}>
                🔍 Escaneo de Empaques en la Nevera
              </h3>
              <p style={{ margin: 0, color: '#1e40af', fontSize: '14px' }}>
                Escanee el EPC o ingrese el ID de cada empaque que coloca en la nevera. Presione Enter para registrar.
              </p>
            </div>

            {/* Scanner / Buscador */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '20px',
              padding: '15px',
              backgroundColor: 'var(--color-alert-info-bg)',
              border: '2px solid #3b82f6',
              borderRadius: '10px',
            }}>
              <span style={{ fontSize: '20px' }}>📱</span>
              <input
                ref={scanningInputRef}
                type="text"
                value={scanningSearch}
                placeholder="Escanee EPC o ingrese ID del empaque..."
                onChange={(e) => setScanningSearch(e.target.value)}
                onKeyDown={handleScanningKeyDown}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  border: '2px solid var(--color-border-strong)',
                  borderRadius: '8px',
                  fontSize: '18px',
                  outline: 'none',
                }}
                onFocus={(e) => { e.target.style.borderColor = '#3b82f6'; }}
                onBlur={(e) => { e.target.style.borderColor = 'var(--color-border-strong)'; }}
              />
              <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
                Escaneados: <strong style={{ color: '#3b82f6' }}>{scannedItems.length}</strong>
              </span>
            </div>

            {/* Tabla de escaneados */}
            {scannedItems.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--color-table-header-bg)' }}>
                      <th style={thStyle}>#</th>
                      <th style={thStyle}>EPC / ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scannedItems.map((item, i) => (
                      <tr key={i}>
                        <td style={{ ...tdStyleCenter, width: '60px' }}>{i + 1}</td>
                        <td style={{ ...tdStyle, fontWeight: 'bold', color: '#3b82f6' }}>
                          {item.epc}
                          {item.id_empaque && !/^\d+$/.test(item.epc) && ` (ID: ${item.id_empaque})`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Validación Results */}
            {validacionResult && (
              <div style={{
                border: '1px solid var(--color-table-border)',
                borderRadius: '12px',
                overflow: 'hidden',
                marginBottom: '20px',
              }}>
                <div style={{ backgroundColor: 'var(--color-table-header-bg)', padding: '12px 20px', borderBottom: '1px solid var(--color-table-border)' }}>
                  <h3 style={{ margin: 0, color: 'var(--color-text-primary)', fontSize: '16px', fontWeight: 'bold' }}>
                    📊 Resultados de Validación
                  </h3>
                </div>
                <div style={{ padding: '15px' }}>
                  <div style={{ marginBottom: '15px' }}>
                    <h4 style={{ margin: '0 0 8px 0', color: '#10b981' }}>
                      ✅ Procesados ({validacionResult.empaques_procesados.length})
                    </h4>
                    {validacionResult.empaques_procesados.length > 0 && (
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#f0fdf4' }}>
                            <th style={thStyle}>ID Emp.</th>
                            <th style={thStyle}>EPC</th>
                            <th style={thStyle}>Producto</th>
                            <th style={thStyle}>Peso (g)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {validacionResult.empaques_procesados.map((emp: any, i: number) => (
                            <tr key={i}>
                              <td style={tdStyleCenter}>{emp.id_empaque}</td>
                              <td style={{ ...tdStyle, fontWeight: 'bold', color: '#059669' }}>{emp.epc}</td>
                              <td style={tdStyle}>{emp.nombre_producto || '-'}</td>
                              <td style={tdStyleCenter}>{emp.peso_exacto_g || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>

                  {validacionResult.empaques_no_procesados.length > 0 && (
                    <div>
                      <h4 style={{ margin: '0 0 8px 0', color: '#ef4444' }}>
                        ❌ No Procesados ({validacionResult.empaques_no_procesados.length})
                      </h4>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                          <tr style={{ backgroundColor: 'var(--color-alert-error-bg)' }}>
                            <th style={thStyle}>ID Emp.</th>
                            <th style={thStyle}>EPC</th>
                            <th style={thStyle}>Error</th>
                          </tr>
                        </thead>
                        <tbody>
                          {validacionResult.empaques_no_procesados.map((emp: any, i: number) => (
                            <tr key={i}>
                              <td style={tdStyleCenter}>{emp.id_empaque || '-'}</td>
                              <td style={{ ...tdStyle, color: 'var(--color-alert-error-text)' }}>{emp.epc || '-'}</td>
                              <td style={{ ...tdStyle, color: 'var(--color-alert-error-text)' }}>{emp.error}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: '20px',
        borderTop: '2px solid var(--color-table-border)',
        backgroundColor: 'var(--color-modal-header-bg)',
        display: 'flex',
        justifyContent: 'center',
        gap: '15px',
      }}>
        {fase === 'review' && (
          <>
            <button onClick={onClose} disabled={loading} style={cancelBtnStyle}>
              Cancelar
            </button>
            <button
              onClick={handleConfirmarInicio}
              disabled={loading || !allConfirmed}
              style={{
                ...confirmBtnStyle,
                backgroundColor: allConfirmed ? '#059669' : '#6b7280',
                cursor: loading || !allConfirmed ? 'not-allowed' : 'pointer',
                opacity: loading || !allConfirmed ? 0.6 : 1,
              }}
            >
              {loading ? 'Iniciando...' : allConfirmed ? 'Confirmar Inicio del Surtido' : 'Confirma todos los productos'}
            </button>
          </>
        )}

        {fase === 'removal' && (
          <>
            <button onClick={handleCancelarRemoval} disabled={retirando} style={cancelBtnStyle}>
              Cancelar
            </button>
            <button
              onClick={handleRetirarEmpaques}
              disabled={retirando}
              style={{
                ...confirmBtnStyle,
                backgroundColor: hasCambio5 ? '#f97316' : '#059669',
                cursor: retirando ? 'not-allowed' : 'pointer',
                opacity: retirando ? 0.6 : 1,
              }}
            >
              {retirando ? 'Retirando...' : hasCambio5 ? 'Confirmar Retiro de Empaques' : 'Continuar al Escaneo'}
            </button>
          </>
        )}

          {fase === 'scanning' && (
          <>
            <button
              onClick={handleCancelarRemoval}
              disabled={validando || finalizando}
              style={cancelBtnStyle}
            >
              Cancelar
            </button>
            <button
              onClick={handleValidarEmpaques}
              disabled={validando || scannedItems.length === 0}
              style={{
                ...confirmBtnStyle,
                backgroundColor: '#3b82f6',
                cursor: validando || scannedItems.length === 0 ? 'not-allowed' : 'pointer',
                opacity: validando || scannedItems.length === 0 ? 0.6 : 1,
              }}
            >
              {validando ? 'Validando...' : `Validar Empaques (${scannedItems.length})`}
            </button>
            <button
              onClick={handleFinalizarSurtido}
              disabled={finalizando || !validacionResult}
              style={{
                ...confirmBtnStyle,
                backgroundColor: validacionResult ? '#dc2626' : '#6b7280',
                cursor: finalizando || !validacionResult ? 'not-allowed' : 'pointer',
                opacity: finalizando || !validacionResult ? 0.6 : 1,
              }}
            >
              {finalizando ? 'Finalizando...' : !validacionResult ? 'Valida antes de finalizar' : 'Finalizar Surtido'}
            </button>
          </>
        )}
      </div>

      {/* Modal de confirmación */}
      {showConfirmModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            backgroundColor: 'var(--color-modal-bg)',
            borderRadius: '12px',
            padding: '30px',
            maxWidth: '480px',
            width: '90%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '15px'
            }}>
              ⚠️
            </div>
            <h2 style={{
              color: 'var(--color-alert-error-text)',
              marginBottom: '15px',
              fontSize: '22px',
              fontWeight: 'bold'
            }}>
              ADVERTENCIA
            </h2>
            <p style={{
              color: 'var(--color-text-primary)',
              fontSize: '16px',
              marginBottom: '10px',
              lineHeight: '1.5'
            }}>
              Asegúrese de estar <strong>parado al frente de la nevera</strong> antes de confirmar el surtido.
            </p>
            <p style={{
              color: 'var(--color-text-secondary)',
              fontSize: '14px',
              marginBottom: '20px'
            }}>
              Verifique que el número de nevera que aparece en la etiqueta del equipo coincida con el mostrado aquí.
            </p>
            <div style={{
              backgroundColor: 'var(--color-alert-warning-bg)',
              border: '2px solid #f59e0b',
              borderRadius: '8px',
              padding: '15px',
              marginBottom: '20px'
            }}>
              <div style={{
                fontSize: '36px',
                fontWeight: 'bold',
                color: 'var(--color-alert-warning-text)',
                letterSpacing: '3px'
              }}>
                #{idNevera}
              </div>
              <p style={{
                fontSize: '12px',
                color: 'var(--color-alert-warning-text)',
                marginTop: '5px',
                marginBottom: 0
              }}>
                Número de nevera a confirmar
              </p>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 'bold',
                color: 'var(--color-text-primary)',
                marginBottom: '8px',
                textAlign: 'left'
              }}>
                Escriba el número de la nevera para confirmar:
              </label>
              <input
                type="text"
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleConfirmarInicioConValidacion();
                  }
                }}
                placeholder="Ej: 123"
                autoFocus
                style={{
                  width: '100%',
                  padding: '12px 15px',
                  fontSize: '18px',
                  border: '2px solid var(--color-border-strong)',
                  borderRadius: '8px',
                  textAlign: 'center',
                  fontWeight: 'bold',
                  letterSpacing: '2px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <div style={{
              display: 'flex',
              gap: '10px',
              justifyContent: 'center'
            }}>
              <button
                onClick={handleCancelarConfirmacion}
                style={{
                  padding: '10px 24px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmarInicioConValidacion}
                disabled={confirmInput.trim() === ""}
                style={{
                  padding: '10px 24px',
                  backgroundColor: confirmInput.trim() === "" ? '#9ca3af' : '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: confirmInput.trim() === "" ? 'not-allowed' : 'pointer',
                  boxShadow: confirmInput.trim() === "" ? 'none' : '0 2px 4px rgba(220, 38, 38, 0.3)'
                }}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const thStyle: React.CSSProperties = {
  padding: '12px 8px',
  textAlign: 'center',
  border: '1px solid var(--color-table-border)',
  fontWeight: 'bold',
  backgroundColor: 'var(--color-table-header-bg)',
  minWidth: '100px',
};

const tdStyle: React.CSSProperties = {
  padding: '12px 8px',
  border: '1px solid var(--color-table-border)',
};

const tdStyleCenter: React.CSSProperties = {
  padding: '12px 8px',
  border: '1px solid var(--color-table-border)',
  textAlign: 'center',
};

const cancelBtnStyle: React.CSSProperties = {
  padding: '12px 30px',
  backgroundColor: '#6b7280',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  fontSize: '16px',
  fontWeight: 'bold',
  cursor: 'pointer',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
};

const confirmBtnStyle: React.CSSProperties = {
  padding: '12px 30px',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  fontSize: '16px',
  fontWeight: 'bold',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  minWidth: '200px',
};

export default SurtirFlujoModal;

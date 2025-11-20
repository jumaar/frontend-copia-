import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getTiendaInventario, updateProductoStock } from '../../services/api';
import './TiendaDashboardPage.css';

interface Producto {
  id_producto: number;
  nombre_producto: string;
  peso_nominal_g: number;
  stock_minimo: number;
  stock_maximo: number;
  venta_semanal: number;
  stock_ideal_final: number;
  stock_en_tiempo_real: number;
}

interface Nevera {
  id_nevera: number;
  id_estado_nevera: number;
  temperatura_nevera: number;
  productos: Producto[];
}

interface Tienda {
  id_tienda: number;
  nombre_tienda: string;
  direccion: string;
  ciudad: string;
  neveras: Nevera[];
}

interface TiendaInventarioResponse {
  tiendas: Tienda[];
}

const TiendaInventarioPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [inventario, setInventario] = useState<TiendaInventarioResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingCell, setEditingCell] = useState<{ tiendaId: number; neveraId: number; productoId: number; field: 'stock_minimo' | 'stock_maximo' } | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  useEffect(() => {
    const fetchInventario = async () => {
      if (id) {
        try {
          const data = await getTiendaInventario(Number(id));
          setInventario(data);
        } catch (error) {
          console.error('Error fetching tienda inventario:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchInventario();
  }, [id]);

  const handleEditStart = (tiendaId: number, neveraId: number, productoId: number, field: 'stock_minimo' | 'stock_maximo', currentValue: number) => {
    setEditingCell({ tiendaId, neveraId, productoId, field });
    setEditValue(currentValue.toString());
  };

  const handleEditSave = async () => {
    if (!editingCell || !editValue) return;

    try {
      const newValue = parseInt(editValue);
      if (isNaN(newValue) || newValue < 0) {
        alert('Por favor ingrese un número válido mayor o igual a 0');
        return;
      }

      const stockData = editingCell.field === 'stock_minimo'
        ? { stock_minimo: newValue }
        : { stock_maximo: newValue };

      await updateProductoStock(editingCell.productoId, editingCell.neveraId, stockData);

      // Update local state
      setInventario(prev => {
        if (!prev) return prev;
        const newInventario = { ...prev };
        newInventario.tiendas = newInventario.tiendas.map(tienda => {
          if (tienda.id_tienda === editingCell.tiendaId) {
            tienda.neveras = tienda.neveras.map(nevera => {
              if (nevera.id_nevera === editingCell.neveraId) {
                nevera.productos = nevera.productos.map(producto => {
                  if (producto.id_producto === editingCell.productoId) {
                    return { ...producto, [editingCell.field]: newValue };
                  }
                  return producto;
                });
              }
              return nevera;
            });
          }
          return tienda;
        });
        return newInventario;
      });

      setEditingCell(null);
      setEditValue('');
    } catch (error) {
      console.error('Error updating stock:', error);
      alert('Error al actualizar el stock. Inténtalo de nuevo.');
    }
  };

  const handleEditCancel = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleEditSave();
    } else if (e.key === 'Escape') {
      handleEditCancel();
    }
  };

  if (loading) {
    return <div className="frigorifico-page"><p>Cargando inventario...</p></div>;
  }

  if (!inventario || !inventario.tiendas.length) {
    return <div className="frigorifico-page"><p>No se encontró información del inventario.</p></div>;
  }

  // Flatten the data for table display
  const tableData: Array<{
    tienda: Tienda;
    nevera: Nevera;
    producto: Producto;
  }> = [];

  inventario.tiendas.forEach(tienda => {
    tienda.neveras.forEach(nevera => {
      nevera.productos.forEach(producto => {
        tableData.push({ tienda, nevera, producto });
      });
    });
  });

  return (
    <div className="frigorifico-page">
      <div className="cuentas-header">
        <h1>Inventario de Tiendas</h1>
        <p>Gestión del inventario de productos en neveras por tienda.</p>
      </div>

      {inventario?.tiendas.map(tienda => (
        <div key={tienda.id_tienda} className="card" style={{ marginTop: 'calc(var(--spacing-unit) * -4)', marginBottom: 'var(--spacing-unit)' }}>
          <div className="card-header">
            <h2>{tienda.nombre_tienda}</h2>
            <p>{tienda.direccion} - {tienda.ciudad}</p>
          </div>

          {tienda.neveras.map(nevera => (
            <div key={nevera.id_nevera} style={{ marginLeft: 'var(--spacing-unit)', marginBottom: 'var(--spacing-unit)' }}>
              <div style={{ backgroundColor: 'var(--color-background-secondary)', padding: 'var(--spacing-unit)', borderRadius: '4px', marginBottom: 'var(--spacing-unit)' }}>
                <h3>Nevera {nevera.id_nevera}</h3>
                <p>Estado: {nevera.id_estado_nevera === 1 ? 'Activa' : 'Inactiva'} | Temperatura: {nevera.temperatura_nevera}°C</p>
              </div>

              <div className="management-table-container" style={{ marginLeft: 'var(--spacing-unit)' }}>
                {nevera.productos.length > 0 ? (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="management-table" style={{ fontSize: '0.85rem', minWidth: '800px' }}>
                      <thead>
                        <tr>
                          <th>Producto</th>
                          <th>Peso (g)</th>
                          <th>Venta Semanal</th>
                          <th>Stock Ideal</th>
                          <th>Stock Actual</th>
                          <th>Stock Mínimo</th>
                          <th>Stock Máximo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {nevera.productos.map(producto => (
                          <tr key={producto.id_producto}>
                            <td>{producto.nombre_producto}</td>
                            <td>{producto.peso_nominal_g}</td>
                            <td>{producto.venta_semanal}</td>
                            <td>{producto.stock_ideal_final}</td>
                            <td>{producto.stock_en_tiempo_real}</td>
                            <td
                              onClick={() => handleEditStart(tienda.id_tienda, nevera.id_nevera, producto.id_producto, 'stock_minimo', producto.stock_minimo)}
                              style={{ cursor: 'pointer', backgroundColor: editingCell?.productoId === producto.id_producto && editingCell?.field === 'stock_minimo' ? '#f0f8ff' : 'transparent' }}
                            >
                              {editingCell?.productoId === producto.id_producto && editingCell?.field === 'stock_minimo' ? (
                                <input
                                  type="number"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onBlur={handleEditSave}
                                  onKeyDown={handleKeyPress}
                                  autoFocus
                                  min="0"
                                  style={{ width: '60px', textAlign: 'center' }}
                                />
                              ) : (
                                producto.stock_minimo
                              )}
                            </td>
                            <td
                              onClick={() => handleEditStart(tienda.id_tienda, nevera.id_nevera, producto.id_producto, 'stock_maximo', producto.stock_maximo)}
                              style={{ cursor: 'pointer', backgroundColor: editingCell?.productoId === producto.id_producto && editingCell?.field === 'stock_maximo' ? '#f0f8ff' : 'transparent' }}
                            >
                              {editingCell?.productoId === producto.id_producto && editingCell?.field === 'stock_maximo' ? (
                                <input
                                  type="number"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onBlur={handleEditSave}
                                  onKeyDown={handleKeyPress}
                                  autoFocus
                                  min="0"
                                  style={{ width: '60px', textAlign: 'center' }}
                                />
                              ) : (
                                producto.stock_maximo
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p>No hay productos en esta nevera.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default TiendaInventarioPage;
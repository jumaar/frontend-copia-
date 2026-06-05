import React from 'react';
import './ProductosTable.css';

export interface Producto {
  id_producto: number;
  nombre_producto: string;
  descripcion_producto: string;
  peso_nominal_g: number;
  precio_venta: number;
  dias_vencimiento: number;
  precio_frigorifico: number;
  precio_tienda: number;
  media?: string;
}

interface SortConfig {
  key: keyof Producto | null;
  direction: 'asc' | 'desc';
}

interface ProductosTableProps {
  productos: Producto[];
  isLoading: boolean;
  canEdit: boolean;
  canDelete: boolean;
  sortConfig: SortConfig;
  onSort: (key: keyof Producto) => void;
  onEdit?: (producto: Producto) => void;
  onDelete?: (productoId: number, productoName: string) => void;
  onCreateClick?: () => void;
}

const getSortIndicator = (sortConfig: SortConfig, columnName: keyof Producto) => {
  if (sortConfig.key === columnName) {
    return sortConfig.direction === 'asc' ? ' ↑' : ' ↓';
  }
  return ' ⇅';
};

const ProductosTable: React.FC<ProductosTableProps> = ({
  productos,
  isLoading,
  canEdit,
  canDelete,
  sortConfig,
  onSort,
  onEdit,
  onDelete,
  onCreateClick,
}) => {
  const requestSort = (key: keyof Producto) => {
    onSort(key);
  };

  const sortedProductos = React.useMemo(() => {
    let sortableItems = [...productos];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key!] ?? '';
        const bValue = b[sortConfig.key!] ?? '';

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [productos, sortConfig]);

  return (
    <div className="management-page">
      <div className="cuentas-header">
        <h1>Gestión de Productos</h1>
        <p>Administrar el catálogo de productos del frigorífico.</p>
        {canEdit && (
          <button className="button button-success" onClick={() => onCreateClick?.()}>
            Añadir Producto
          </button>
        )}
      </div>

      <div className="management-table-container card" style={{ marginTop: 'calc(var(--spacing-unit) * -4)' }}>
        {isLoading ? (
          <p>Cargando productos...</p>
        ) : productos.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="management-table" style={{ fontSize: '0.75rem', width: '100%' }}>
              <thead>
                <tr>
                  <th onClick={() => requestSort('id_producto')} style={{ cursor: 'pointer' }}>
                    ID{getSortIndicator(sortConfig, 'id_producto')}
                  </th>
                  <th onClick={() => requestSort('nombre_producto')} style={{ cursor: 'pointer' }}>
                    Nom.{getSortIndicator(sortConfig, 'nombre_producto')}
                  </th>
                  <th onClick={() => requestSort('descripcion_producto')} style={{ cursor: 'pointer' }}>
                    Desc.{getSortIndicator(sortConfig, 'descripcion_producto')}
                  </th>
                  <th onClick={() => requestSort('media')} style={{ cursor: 'pointer' }}>
                    MEDIA{getSortIndicator(sortConfig, 'media')}
                  </th>
                  <th onClick={() => requestSort('peso_nominal_g')} style={{ cursor: 'pointer' }}>
                    Peso(g){getSortIndicator(sortConfig, 'peso_nominal_g')}
                  </th>
                  <th onClick={() => requestSort('precio_venta')} style={{ cursor: 'pointer' }}>
                    P. Venta{getSortIndicator(sortConfig, 'precio_venta')}
                  </th>
                  <th onClick={() => requestSort('dias_vencimiento')} style={{ cursor: 'pointer' }}>
                    Días{getSortIndicator(sortConfig, 'dias_vencimiento')}
                  </th>
                  <th onClick={() => requestSort('precio_frigorifico')} style={{ cursor: 'pointer' }}>
                    P. Frigo.{getSortIndicator(sortConfig, 'precio_frigorifico')}
                  </th>
                  <th onClick={() => requestSort('precio_tienda')} style={{ cursor: 'pointer' }}>
                    P. Tienda{getSortIndicator(sortConfig, 'precio_tienda')}
                  </th>
                  {canEdit && <th>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {sortedProductos.map((producto) => (
                  <tr key={producto.id_producto}>
                    <td>{producto.id_producto}</td>
                    <td>{producto.nombre_producto}</td>
                    <td>{producto.descripcion_producto}</td>
                    <td>{producto.media || '-'}</td>
                    <td>{producto.peso_nominal_g}g</td>
                    <td>${producto.precio_venta.toLocaleString()}</td>
                    <td>{producto.dias_vencimiento}</td>
                    <td>{producto.precio_frigorifico}% = ${(producto.precio_venta * (producto.precio_frigorifico / 100)).toLocaleString()}</td>
                    <td>{producto.precio_tienda}% = ${(producto.precio_venta * (producto.precio_tienda / 100)).toLocaleString()}</td>
                    {canEdit && (
                      <td>
                        <button
                          className="action-button"
                          onClick={() => onEdit?.(producto)}
                        >
                          Editar
                        </button>
                        {canDelete && (
                          <button
                            className="action-button delete"
                            onClick={() => onDelete?.(producto.id_producto, producto.nombre_producto)}
                          >
                            Eliminar
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No hay productos para mostrar.</p>
        )}
      </div>
    </div>
  );
};

export default ProductosTable;

import React, { useState, useEffect } from 'react';
import { getProductos, createProducto, updateProducto, deleteProducto } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

// Componente modal para crear producto
const CreateProductModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onProductCreated: (product: any) => void;
}> = ({ isOpen, onClose, onProductCreated }) => {
  const [formData, setFormData] = useState({
    nombre_producto: '',
    descripcion_producto: '',
    peso_nominal_g: '',
    precio_venta: '',
    dias_vencimiento: '',
    precio_frigorifico: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones: todos los campos son requeridos
    const errors: string[] = [];

    if (!formData.nombre_producto.trim()) {
      errors.push('El nombre del producto es obligatorio.');
    }
    if (!formData.descripcion_producto.trim()) {
      errors.push('La descripción del producto es obligatoria.');
    }
    if (!formData.peso_nominal_g || parseInt(formData.peso_nominal_g) <= 0) {
      errors.push('El peso nominal debe ser un número mayor a 0.');
    }
    if (!formData.precio_venta || parseFloat(formData.precio_venta) <= 0) {
      errors.push('El precio de venta debe ser un número mayor a 0.');
    }
    if (!formData.dias_vencimiento || parseInt(formData.dias_vencimiento) <= 0) {
      errors.push('Los días de vencimiento deben ser un número mayor a 0.');
    }
    if (!formData.precio_frigorifico || parseFloat(formData.precio_frigorifico) <= 0) {
      errors.push('El precio frigorífico debe ser un número mayor a 0.');
    }

    if (errors.length > 0) {
      setError(errors.join(' '));
      return;
    }

    const isConfirmed = window.confirm('¿Estás seguro de que quieres crear este producto?');

    if (isConfirmed) {
      setIsLoading(true);
      setError(null);
      try {
        const productData = {
          nombre_producto: formData.nombre_producto.trim(),
          descripcion_producto: formData.descripcion_producto.trim(),
          peso_nominal_g: parseInt(formData.peso_nominal_g),
          precio_venta: parseFloat(formData.precio_venta),
          dias_vencimiento: parseInt(formData.dias_vencimiento),
          precio_frigorifico: parseFloat(formData.precio_frigorifico)
        };


        const newProduct = await createProducto(productData);
        onProductCreated(newProduct);
        onClose();
        setFormData({
          nombre_producto: '',
          descripcion_producto: '',
          peso_nominal_g: '',
          precio_venta: '',
          dias_vencimiento: '',
          precio_frigorifico: ''
        });
      } catch (err: any) {
        if (err.response?.data?.message) {
          setError(err.response.data.message);
        } else {
          setError('No se pudo crear el producto. Inténtalo de nuevo.');
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <h2>Crear Nuevo Producto</h2>
          <button onClick={onClose} className="modal-close-button">&times;</button>
        </header>
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="nombre_producto">Nombre del Producto *</label>
              <input
                type="text"
                id="nombre_producto"
                name="nombre_producto"
                value={formData.nombre_producto}
                onChange={handleChange}
                disabled={isLoading}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="descripcion_producto">Descripción *</label>
              <textarea
                id="descripcion_producto"
                name="descripcion_producto"
                value={formData.descripcion_producto}
                onChange={handleChange}
                disabled={isLoading}
                rows={3}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="peso_nominal_g">Peso Nominal (gramos) *</label>
              <input
                type="number"
                id="peso_nominal_g"
                name="peso_nominal_g"
                value={formData.peso_nominal_g}
                onChange={handleChange}
                disabled={isLoading}
                min="1"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="precio_venta">Precio de Venta *</label>
              <input
                type="number"
                id="precio_venta"
                name="precio_venta"
                value={formData.precio_venta}
                onChange={handleChange}
                disabled={isLoading}
                min="0.01"
                step="0.01"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="dias_vencimiento">Días de Vencimiento *</label>
              <input
                type="number"
                id="dias_vencimiento"
                name="dias_vencimiento"
                value={formData.dias_vencimiento}
                onChange={handleChange}
                disabled={isLoading}
                min="1"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="precio_frigorifico">Precio Frigorífico *</label>
              <input
                type="number"
                id="precio_frigorifico"
                name="precio_frigorifico"
                value={formData.precio_frigorifico}
                onChange={handleChange}
                disabled={isLoading}
                min="0.01"
                step="0.01"
                required
              />
            </div>
            {error && <p className="modal-error">{error}</p>}
            <div className="modal-footer">
              <button type="button" className="button button-secondary" onClick={onClose} disabled={isLoading}>
                Cancelar
              </button>
              <button type="submit" className="button button-primary" disabled={isLoading}>
                {isLoading ? 'Creando...' : 'Crear Producto'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Componente modal para editar producto
const EditProductModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  productData: any;
  onProductUpdated: (product: any) => void;
}> = ({ isOpen, onClose, productData, onProductUpdated }) => {
  const [formData, setFormData] = useState({
    nombre_producto: '',
    descripcion_producto: '',
    peso_nominal_g: '',
    precio_venta: '',
    dias_vencimiento: '',
    precio_frigorifico: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (productData) {
      setFormData({
        nombre_producto: productData.nombre_producto || '',
        descripcion_producto: productData.descripcion_producto || '',
        peso_nominal_g: productData.peso_nominal_g?.toString() || '',
        precio_venta: productData.precio_venta?.toString() || '',
        dias_vencimiento: productData.dias_vencimiento?.toString() || '',
        precio_frigorifico: productData.precio_frigorifico?.toString() || ''
      });
    }
  }, [productData]);

  if (!isOpen || !productData) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones básicas
    if (!formData.nombre_producto.trim()) {
      setError('El nombre del producto es obligatorio.');
      return;
    }

    const isConfirmed = window.confirm(`¿Estás seguro de que quieres guardar los cambios para "${productData.nombre_producto}"?`);

    if (isConfirmed) {
      setIsLoading(true);
      setError(null);
      try {
        const productDataToUpdate = {
          nombre_producto: formData.nombre_producto.trim(),
          descripcion_producto: formData.descripcion_producto.trim(),
          peso_nominal_g: parseInt(formData.peso_nominal_g) || 0,
          precio_venta: parseFloat(formData.precio_venta) || 0,
          dias_vencimiento: parseInt(formData.dias_vencimiento) || 0,
          precio_frigorifico: parseFloat(formData.precio_frigorifico) || 0
        };

        const updatedProduct = await updateProducto(productData.id_producto, productDataToUpdate);
        onProductUpdated(updatedProduct);
        onClose();
      } catch (err: any) {
        if (err.response?.data?.message) {
          setError(err.response.data.message);
        } else {
          setError('No se pudieron guardar los cambios. Inténtalo de nuevo.');
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <h2>Editar Producto: {productData.nombre_producto}</h2>
          <button onClick={onClose} className="modal-close-button">&times;</button>
        </header>
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="edit_nombre_producto">Nombre del Producto *</label>
              <input
                type="text"
                id="edit_nombre_producto"
                name="nombre_producto"
                value={formData.nombre_producto}
                onChange={handleChange}
                disabled={isLoading}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="edit_descripcion_producto">Descripción</label>
              <textarea
                id="edit_descripcion_producto"
                name="descripcion_producto"
                value={formData.descripcion_producto}
                onChange={handleChange}
                disabled={isLoading}
                rows={3}
              />
            </div>
            <div className="form-group">
              <label htmlFor="edit_peso_nominal_g">Peso Nominal (gramos)</label>
              <input
                type="number"
                id="edit_peso_nominal_g"
                name="peso_nominal_g"
                value={formData.peso_nominal_g}
                onChange={handleChange}
                disabled={isLoading}
                min="0"
              />
            </div>
            <div className="form-group">
              <label htmlFor="edit_precio_venta">Precio de Venta</label>
              <input
                type="number"
                id="edit_precio_venta"
                name="precio_venta"
                value={formData.precio_venta}
                onChange={handleChange}
                disabled={isLoading}
                min="0"
                step="0.01"
              />
            </div>
            <div className="form-group">
              <label htmlFor="edit_dias_vencimiento">Días de Vencimiento</label>
              <input
                type="number"
                id="edit_dias_vencimiento"
                name="dias_vencimiento"
                value={formData.dias_vencimiento}
                onChange={handleChange}
                disabled={isLoading}
                min="0"
              />
            </div>
            <div className="form-group">
              <label htmlFor="edit_precio_frigorifico">Precio Frigorífico</label>
              <input
                type="number"
                id="edit_precio_frigorifico"
                name="precio_frigorifico"
                value={formData.precio_frigorifico}
                onChange={handleChange}
                disabled={isLoading}
                min="0"
                step="0.01"
              />
            </div>
            {error && <p className="modal-error">{error}</p>}
            <div className="modal-footer">
              <button type="button" className="button button-secondary" onClick={onClose} disabled={isLoading}>
                Cancelar
              </button>
              <button type="submit" className="button button-primary" disabled={isLoading}>
                {isLoading ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

interface Producto {
  id_producto: number;
  nombre_producto: string;
  descripcion_producto: string;
  peso_nominal_g: number;
  precio_venta: number;
  dias_vencimiento: number;
  precio_frigorifico: number;
}

const ProductosPage: React.FC = () => {
  const { user } = useAuth();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [selectedProducto, setSelectedProducto] = useState<Producto | null>(null);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Producto | null;
    direction: 'asc' | 'desc';
  }>({ key: null, direction: 'asc' });

  useEffect(() => {
    fetchProductos();
  }, []);

  const fetchProductos = async () => {
    setIsLoading(true);
    try {
      const response = await getProductos();
      console.log('Respuesta completa del backend:', response);

      // La API devuelve directamente un array de productos
      let productosData = [];
      if (Array.isArray(response)) {
        productosData = response;
      } else if (response && typeof response === 'object' && Array.isArray(response.data)) {
        productosData = response.data;
      } else {
        productosData = [];
      }

      console.log('Productos procesados:', productosData);
      setProductos(productosData);
    } catch (error) {
      console.error('Error fetching productos:', error);
      setProductos([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCreateModal = () => setCreateModalOpen(true);
  const handleCloseCreateModal = () => setCreateModalOpen(false);

  const handleOpenEditModal = (producto: Producto) => {
    setSelectedProducto(producto);
    setEditModalOpen(true);
  };
  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setSelectedProducto(null);
  };

  const handleProductoCreated = (newProducto: Producto) => {
    setProductos(prev => [...prev, newProducto]);
    setCreateModalOpen(false);
  };

  const handleProductoUpdated = (updatedProducto: Producto) => {
    setProductos(prev =>
      prev.map(p => p.id_producto === updatedProducto.id_producto ? updatedProducto : p)
    );
    setEditModalOpen(false);
    setSelectedProducto(null);
  };

  const handleDeleteProducto = async (productoId: number, productoName: string) => {
    // Verificar permisos: Solo roles 1 y 2 pueden eliminar
    if (!['superadmin', 'admin'].includes(user?.role || '')) {
      alert('No tienes permisos para eliminar productos.');
      return;
    }

    const isConfirmed = window.confirm(
      `¿Estás seguro de que quieres eliminar el producto "${productoName}"? Esta acción no se puede deshacer.`
    );

    if (isConfirmed) {
      try {
        await deleteProducto(productoId);
        setProductos(prev => prev.filter(p => p.id_producto !== productoId));
        alert('Producto eliminado exitosamente.');
      } catch (error) {
        console.error(`Error al eliminar el producto ${productoId}:`, error);
        alert('No se pudo eliminar el producto. Inténtalo de nuevo.');
      }
    }
  };

  const canEdit = ['superadmin', 'admin'].includes(user?.role || '');
  const canDelete = ['superadmin', 'admin'].includes(user?.role || '');

  // Función para ordenar productos
  const sortedProductos = React.useMemo(() => {
    let sortableItems = [...productos];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key!];
        const bValue = b[sortConfig.key!];

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

  // Función para manejar el click en el header de la tabla
  const requestSort = (key: keyof Producto) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Función para obtener la clase CSS del header ordenable
  const getSortIndicator = (columnName: keyof Producto) => {
    if (sortConfig.key === columnName) {
      return sortConfig.direction === 'asc' ? ' ↑' : ' ↓';
    }
    return ' ⇅';
  };

  return (
    <div className="management-page">
      <header className="management-header">
        <h1>Gestión de Productos</h1>
        <p>Administrar el catálogo de productos del frigorífico.</p>
        {canEdit && (
          <button className="button button-primary" onClick={handleOpenCreateModal}>
            Añadir Producto
          </button>
        )}
      </header>

      <div className="management-table-container card">
        {isLoading ? (
          <p>Cargando productos...</p>
        ) : productos.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="management-table" style={{ fontSize: '0.85rem', minWidth: '800px' }}>
              <thead>
                <tr>
                  <th onClick={() => requestSort('id_producto')} style={{ cursor: 'pointer' }}>
                    ID{getSortIndicator('id_producto')}
                  </th>
                  <th onClick={() => requestSort('nombre_producto')} style={{ cursor: 'pointer' }}>
                    Nombre{getSortIndicator('nombre_producto')}
                  </th>
                  <th onClick={() => requestSort('descripcion_producto')} style={{ cursor: 'pointer' }}>
                    Descripción{getSortIndicator('descripcion_producto')}
                  </th>
                  <th onClick={() => requestSort('peso_nominal_g')} style={{ cursor: 'pointer' }}>
                    Peso (g){getSortIndicator('peso_nominal_g')}
                  </th>
                  <th onClick={() => requestSort('precio_venta')} style={{ cursor: 'pointer' }}>
                    Precio Venta{getSortIndicator('precio_venta')}
                  </th>
                  <th onClick={() => requestSort('dias_vencimiento')} style={{ cursor: 'pointer' }}>
                    Días Venc.{getSortIndicator('dias_vencimiento')}
                  </th>
                  <th onClick={() => requestSort('precio_frigorifico')} style={{ cursor: 'pointer' }}>
                    Precio Frigo.{getSortIndicator('precio_frigorifico')}
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
                    <td>{producto.peso_nominal_g}g</td>
                    <td>${producto.precio_venta.toLocaleString()}</td>
                    <td>{producto.dias_vencimiento}</td>
                    <td>${producto.precio_frigorifico.toLocaleString()}</td>
                    {canEdit && (
                      <td>
                        <button
                          className="action-button"
                          onClick={() => handleOpenEditModal(producto)}
                        >
                          Editar
                        </button>
                        {canDelete && (
                          <button
                            className="action-button delete"
                            onClick={() => handleDeleteProducto(producto.id_producto, producto.nombre_producto)}
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

      {/* Modal para crear producto */}
      <CreateProductModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseCreateModal}
        onProductCreated={handleProductoCreated}
      />

      {/* Modal para editar producto */}
      <EditProductModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        productData={selectedProducto}
        onProductUpdated={handleProductoUpdated}
      />
    </div>
  );
};

export default ProductosPage;
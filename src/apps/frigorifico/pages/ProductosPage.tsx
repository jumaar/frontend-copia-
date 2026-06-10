import React, { useState, useEffect } from 'react';
import { getProductos } from '../../../services/api';
import ProductosTable from '../../../shared/scoped/admin-superadmin-frigorifico/components/ProductosTable/ProductosTable';
import type { Producto } from '../../../shared/scoped/admin-superadmin-frigorifico/components/ProductosTable/ProductosTable';

const ProductosPage: React.FC = () => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
      let data: Producto[] = [];
      if (Array.isArray(response)) {
        data = response;
      } else if (response && typeof response === 'object' && Array.isArray(response.data)) {
        data = response.data;
      }
      setProductos(data);
    } catch (error) {
      console.error('Error fetching productos:', error);
      setProductos([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSort = (key: keyof Producto) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  return (
    <ProductosTable
      productos={productos}
      isLoading={isLoading}
      canEdit={false}
      canDelete={false}
      sortConfig={{ key: sortConfig.key!, direction: sortConfig.direction }}
      onSort={handleSort}
    />
  );
};

export default ProductosPage;

import React from 'react';
import type { Empaque, SearchResult } from '../../types/logistica.types';

interface EmpaqueSearchResultProps {
  result: SearchResult;
  userName: string;
}

const EmpaqueSearchResult: React.FC<EmpaqueSearchResultProps> = ({ result, userName }) => (
  <div style={{
    marginBottom: '2rem',
    padding: '1rem',
    backgroundColor: 'var(--color-card-bg)',
    border: '1px solid var(--color-border)',
    borderRadius: '4px'
  }}>
    <h3 style={{ margin: '0 0 1rem 0', color: 'var(--color-text-primary)' }}>
      Resultado de Búsqueda - Estación {result.estacion} - {userName}
    </h3>
    <div className="products-container" style={{ overflowX: 'auto' }}>
      <table className="products-table" style={{ minWidth: '950px' }}>
        <thead>
          <tr>
            <th>ID Producto</th>
            <th>Producto</th>
            <th>Peso (g)</th>
            <th>EPC</th>
            <th>Fecha</th>
          </tr>
        </thead>
        <tbody>
          {result.producto.empaques.map((empaque: Empaque) => (
            <tr key={empaque.epc}>
              <td>{result.producto.id_producto}</td>
              <td>{result.producto.nombre_producto}</td>
              <td>{empaque.peso_g}</td>
              <td style={{ fontWeight: 'bold', color: '#ff6b35' }}>⭐ {empaque.epc}</td>
              <td>{new Date(empaque.fecha_empaque).toLocaleString('es-CO')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default EmpaqueSearchResult;

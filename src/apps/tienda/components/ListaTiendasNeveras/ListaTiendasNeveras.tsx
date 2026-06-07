import React, { useState, useMemo } from 'react';
import './ListaTiendasNeveras.css';

interface NeveraData {
  id_nevera: number;
  id_estado_nevera: number;
}

interface TiendaData {
  id_tienda: number;
  nombre_tienda: string;
  direccion: string;
  ciudad: string;
  departamento: string;
  neveras: NeveraData[];
}

interface ListaTiendasNeverasProps {
  tiendas: TiendaData[];
  onSurtir: (neveraId: number) => void;
}

const ListaTiendasNeveras: React.FC<ListaTiendasNeverasProps> = ({ tiendas, onSurtir }) => {
  const [busqueda, setBusqueda] = useState('');

  const tiendasFiltradas = useMemo(() => {
    if (!busqueda.trim()) return tiendas;
    const id = parseInt(busqueda.trim());
    if (isNaN(id)) return tiendas;
    return tiendas.filter(tienda =>
      tienda.neveras.some(n => n.id_nevera === id && n.id_estado_nevera === 2)
    );
  }, [tiendas, busqueda]);

  if (tiendas.length === 0) {
    return (
      <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)', padding: '2rem' }}>
        No tienes tiendas asignadas.
      </p>
    );
  }

  return (
    <div>
      <div className="lista-tiendas-search">
        <input
          type="text"
          placeholder="Buscar por ID de nevera..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="lista-tiendas-search-input"
        />
      </div>

      {tiendasFiltradas.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)', padding: '2rem' }}>
          No se encontraron neveras con ese ID.
        </p>
      ) : (
        <div className="lista-tiendas-grid">
          {tiendasFiltradas.map((tienda) => {
            const neverasActivas = tienda.neveras.filter(n => n.id_estado_nevera === 2);

            return (
              <div key={tienda.id_tienda} className="lista-tiendas-item">
                <div className="lista-tiendas-info">
                  <h4 className="lista-tiendas-nombre">{tienda.nombre_tienda}</h4>
                  <p className="lista-tiendas-direccion">
                    {tienda.direccion} — {tienda.ciudad}, {tienda.departamento}
                  </p>
                  <p className="lista-tiendas-neveras-count">
                    Neveras activas: {neverasActivas.length}
                  </p>
                </div>
                <div className="lista-tiendas-actions">
                  {neverasActivas.map((nevera) => (
                    <button
                      key={nevera.id_nevera}
                      className="action-button lista-nevera-btn"
                      onClick={() => onSurtir(nevera.id_nevera)}
                    >
                      Surtir Nevera {nevera.id_nevera}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export type { TiendaData, NeveraData, ListaTiendasNeverasProps };
export default ListaTiendasNeveras;

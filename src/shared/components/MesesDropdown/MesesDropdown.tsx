import React, { useState, useEffect } from 'react';

interface MesItem {
  mes: number;
  año: number;
  fecha: string;
}

interface MesesDropdownProps {
  meses: MesItem[];
  seleccionado: { mes: number; año: number } | null;
  onSelect: (mes: number, año: number) => void;
  loading?: boolean;
  label?: string;
}

const MesesDropdown: React.FC<MesesDropdownProps> = ({
  meses,
  seleccionado,
  onSelect,
  loading = false,
  label = 'Consultar Meses Anteriores',
}) => {
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!(event.target as Element).closest('.meses-dropdown')) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="meses-dropdown">
      <button
        className="dropdown-toggle"
        onClick={() => setShowMenu(!showMenu)}
      >
        {label}
        <span className={`dropdown-arrow ${showMenu ? 'open' : ''}`}>▼</span>
      </button>

      {showMenu && (
        <div className="dropdown-menu">
          {meses.map((mesItem) => (
            <div key={`${mesItem.mes}-${mesItem.año}`} className="dropdown-item">
              <span className="mes-fecha">{mesItem.fecha}</span>
              <button
                className={`btn-consultar ${seleccionado?.mes === mesItem.mes && seleccionado?.año === mesItem.año ? 'activo' : ''}`}
                onClick={() => {
                  onSelect(mesItem.mes, mesItem.año);
                  setShowMenu(false);
                }}
                disabled={loading}
              >
                {loading && seleccionado?.mes === mesItem.mes && seleccionado?.año === mesItem.año ? 'Consultando...' : 'Consultar'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export type { MesItem, MesesDropdownProps };
export default MesesDropdown;

import React from 'react';
import './EPCSearchBar.css';

interface EPCSearchBarProps {
  searchEPC: string;
  onSearchEPCChange: (value: string) => void;
  onSearch: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  disabled: boolean;
  label?: string;
}

const EPCSearchBar: React.FC<EPCSearchBarProps> = ({
  searchEPC,
  onSearchEPCChange,
  onSearch,
  onKeyPress,
  disabled,
  label,
}) => (
  <section className="busqueda-empaque-container card" style={{ marginBottom: '2rem' }}>
    <div className="card-header">
      <h2>{label || 'Búsqueda por EPC'}</h2>
    </div>
    <div style={{ padding: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
      <input
        type="text"
        placeholder="Ingrese EPC (máximo 24 caracteres)"
        value={searchEPC}
        onChange={(e) => onSearchEPCChange(e.target.value)}
        onKeyPress={onKeyPress}
        maxLength={24}
        style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)' }}
      />
      <button
        onClick={onSearch}
        disabled={disabled}
        style={{
          padding: '0.5rem 1rem',
          backgroundColor: 'var(--color-primary)',
          color: 'white',
          border: 'none',
          borderRadius: 'var(--border-radius-md)',
          cursor: 'pointer'
        }}
      >
        Buscar
      </button>
    </div>
  </section>
);

export default EPCSearchBar;

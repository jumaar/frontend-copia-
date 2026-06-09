import React from 'react';
import './EPCSearchBar.css';

interface EPCSearchBarProps {
  searchEPC: string;
  onSearchEPCChange: (value: string) => void;
  onSearch: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  disabled: boolean;
  label?: string;
  proveedorNombre?: string;
  proveedorEmail?: string;
  proveedorCelular?: string;
  frigorificoNombre?: string;
  frigorificoDireccion?: string;
}

const EPCSearchBar: React.FC<EPCSearchBarProps> = ({
  searchEPC,
  onSearchEPCChange,
  onSearch,
  onKeyPress,
  disabled,
  label,
  proveedorNombre,
  proveedorEmail,
  proveedorCelular,
  frigorificoNombre,
  frigorificoDireccion,
}) => (
  <section className="busqueda-empaque-container card" style={{ marginBottom: '2rem' }}>
    {(proveedorNombre || frigorificoNombre) && (
      <div className="epc-header-info">
        {proveedorNombre && <span className="epc-header-proveedor">{proveedorNombre}</span>}
        {(proveedorEmail || proveedorCelular) && (
          <span className="epc-header-contacto">
            {proveedorEmail && <span>{proveedorEmail}</span>}
            {proveedorEmail && proveedorCelular && <span className="epc-header-sep">|</span>}
            {proveedorCelular && <span>{proveedorCelular}</span>}
          </span>
        )}
        {frigorificoNombre && (
          <span className="epc-header-frigo">
            {frigorificoNombre}
            {frigorificoDireccion && <> — {frigorificoDireccion}</>}
          </span>
        )}
      </div>
    )}
    <div className="epc-search-row">
      <label className="epc-search-label">{label || 'Búsqueda por EPC'}</label>
      <div className="epc-search-input-group">
        <input
          type="text"
          placeholder="Ingrese EPC (máximo 24 caracteres)"
          value={searchEPC}
          onChange={(e) => onSearchEPCChange(e.target.value)}
          onKeyPress={onKeyPress}
          maxLength={24}
        />
        <button
          className="btn-consultar"
          onClick={onSearch}
          disabled={disabled}
        >
          Buscar
        </button>
      </div>
    </div>
  </section>
);

export default EPCSearchBar;

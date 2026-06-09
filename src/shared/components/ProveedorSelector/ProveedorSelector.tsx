import React from 'react';
import Dropdown from '../Dropdown/Dropdown';
import type { DropdownOption } from '../Dropdown/Dropdown';
import './ProveedorSelector.css';

interface ProveedorSelectorProps {
  title: string;
  options: DropdownOption[];
  selectedId: string | number | null;
  onSelect: (id: string | number) => void;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  actionLabel?: string;
  renderLabel?: (option: DropdownOption, isSelected: boolean) => React.ReactNode;
}

const ProveedorSelector: React.FC<ProveedorSelectorProps> = ({
  title,
  options,
  selectedId,
  onSelect,
  placeholder = 'Seleccionar...',
  disabled = false,
  loading = false,
  actionLabel = 'Seleccionar',
  renderLabel,
}) => {
  return (
    <div className="proveedor-selector">
      <div className="proveedor-selector-card">
        <h3 className="proveedor-selector-title">{title}</h3>
        <Dropdown
          options={options}
          selectedId={selectedId}
          onSelect={onSelect}
          placeholder={placeholder}
          disabled={disabled}
          loading={loading}
          variant="block"
          actionLabel={actionLabel}
          renderLabel={renderLabel}
        />
      </div>
    </div>
  );
};

export type { ProveedorSelectorProps };
export default ProveedorSelector;

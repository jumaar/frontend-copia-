import React, { useState, useEffect, useCallback } from 'react';
import './Dropdown.css';

export interface DropdownOption {
  id: string | number;
  label: string;
}

interface DropdownProps {
  options: DropdownOption[];
  selectedId: string | number | null;
  onSelect: (id: string | number) => void;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'inline' | 'block';
  renderLabel?: (option: DropdownOption, isSelected: boolean) => React.ReactNode;
  renderToggleContent?: (selectedOption: DropdownOption | undefined) => React.ReactNode;
  actionLabel?: string;
  className?: string;
}

const Dropdown: React.FC<DropdownProps> = ({
  options,
  selectedId,
  onSelect,
  placeholder = 'Seleccionar...',
  disabled = false,
  loading = false,
  variant = 'inline',
  renderLabel,
  renderToggleContent,
  actionLabel = 'Seleccionar',
  className,
}) => {
  const [showMenu, setShowMenu] = useState(false);

  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (!(event.target as Element).closest('.dropdown')) {
      setShowMenu(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [handleClickOutside]);

  const selectedOption = options.find(o => o.id === selectedId);

  return (
    <div className={`dropdown${variant === 'block' ? ' dropdown--block' : ''}${className ? ` ${className}` : ''}`}>
      <button
        className="dropdown-toggle"
        onClick={() => setShowMenu(!showMenu)}
        disabled={disabled || loading}
        type="button"
      >
        {renderToggleContent
          ? renderToggleContent(selectedOption)
          : selectedOption
            ? <span>{selectedOption.label}</span>
            : <span>{placeholder}</span>}
        <span className={`dropdown-arrow${showMenu ? ' open' : ''}`}>▼</span>
      </button>

      {showMenu && (
        <div className="dropdown-menu">
          {options.map(option => {
            const isSelected = selectedId === option.id;
            return (
              <div key={option.id} className="dropdown-item">
                {renderLabel
                  ? renderLabel(option, isSelected)
                  : <span className="dropdown-item-label">{option.label}</span>}
                <button
                  className={`btn-consultar${isSelected ? ' activo' : ''}`}
                  onClick={() => {
                    onSelect(option.id);
                    setShowMenu(false);
                  }}
                  disabled={loading}
                  type="button"
                >
                  {loading && isSelected ? `${actionLabel}...` : actionLabel}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export type { DropdownProps };
export default Dropdown;

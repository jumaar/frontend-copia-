import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  const updateMenuPosition = useCallback(() => {
    if (toggleRef.current) {
      const rect = toggleRef.current.getBoundingClientRect();
      setMenuStyle({
        position: 'fixed',
        top: rect.bottom + 4,
        left: rect.left,
        minWidth: rect.width,
      });
    }
  }, []);

  const handleToggle = useCallback(() => {
    if (!showMenu) {
      updateMenuPosition();
    }
    setShowMenu(prev => !prev);
  }, [showMenu, updateMenuPosition]);

  const handleClickOutside = useCallback((event: MouseEvent) => {
    const target = event.target as Element;
    if (!target.closest('.dropdown') && !target.closest('.dropdown-menu-portal')) {
      setShowMenu(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [handleClickOutside]);

  useEffect(() => {
    if (showMenu) {
      window.addEventListener('scroll', updateMenuPosition, true);
      window.addEventListener('resize', updateMenuPosition);
      return () => {
        window.removeEventListener('scroll', updateMenuPosition, true);
        window.removeEventListener('resize', updateMenuPosition);
      };
    }
  }, [showMenu, updateMenuPosition]);

  const selectedOption = options.find(o => o.id === selectedId);

  const menuContent = showMenu && (
    <div className="dropdown-menu-portal" style={menuStyle}>
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
  );

  return (
    <div
      ref={containerRef}
      className={`dropdown${variant === 'block' ? ' dropdown--block' : ''}${className ? ` ${className}` : ''}`}
    >
      <button
        ref={toggleRef}
        className="dropdown-toggle"
        onClick={handleToggle}
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

      {showMenu && createPortal(menuContent, document.body)}
    </div>
  );
};

export type { DropdownProps };
export default Dropdown;

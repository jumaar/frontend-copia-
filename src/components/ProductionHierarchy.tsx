import React, { useState } from 'react';
import './ProductionHierarchy.css';

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    alert('¡Clave copiada al portapapeles!');
  } catch (err) {
    console.error('Failed to copy text: ', err);
    alert('Error al copiar la clave');
  }
};

export interface ProductionItem {
  id: string | number;
  type: 'station' | 'scale';
  name: string;
  details: Record<string, any>;
  children?: ProductionItem[];
  isActive?: boolean;
}

interface ProductionHierarchyProps {
  items: ProductionItem[];
  onEditStation: (station: ProductionItem) => void;
  onCreateScale: (station: ProductionItem) => void;
  onDeleteScale?: (scale: ProductionItem) => void;
  onDeleteStation?: (station: ProductionItem) => void;
  userRole?: string;
  stationLabel?: string;
  createScaleLabel?: string;
}

const ProductionHierarchy: React.FC<ProductionHierarchyProps> = ({
  items,
  onEditStation,
  onCreateScale,
  onDeleteScale,
  onDeleteStation,
  userRole,
  stationLabel = "Frigorífico",
  createScaleLabel = "Crear Estación",
}) => {
  const [expandedIds, setExpandedIds] = useState<Set<string | number>>(new Set(items.map(i => i.id)));

  const toggleExpanded = (itemId: string | number) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedIds(newExpanded);
  };

  const renderItem = (item: ProductionItem, level: number = 0) => {
    const isExpanded = expandedIds.has(item.id);
    const hasChildren = item.children && item.children.length > 0;

    return (
      <div key={item.id} className={`hierarchy-item level-${level}`}>
        <div className="item-main-row">
          <div className="item-info">
            {hasChildren && (
              <button className="expand-button" onClick={() => toggleExpanded(item.id)}>
                {isExpanded ? '▼' : '▶'}
              </button>
            )}
            <span className="item-role">{item.type === 'station' ? `${stationLabel} ${item.id}` : 'Nevera'}</span>
            <span className="item-name">{item.type === 'scale' ? item.id : item.name}</span>
            <div className="item-details">
              {item.type === 'station' && item.details.address && item.details.city && (
                <span>{item.details.address}, {item.details.city}</span>
              )}
              {item.type === 'scale' && (
                <>
                  <span>{item.details.key}</span>
                  {item.details.value && (
                    <>
                      <span className="item-password">Clave: {item.details.value}</span>
                      <button
                        className="button button-secondary"
                        onClick={() => copyToClipboard(item.details.value)}
                        title="Copiar clave"
                      >
                        Copiar
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
          <div className="item-actions">
            {item.type === 'station' && (
              <>
                <button type="button" className="action-button" onClick={() => onEditStation(item)}>Editar</button>
                <button type="button" className="action-button" onClick={() => onCreateScale(item)}>{createScaleLabel}</button>
                {(userRole === 'frigorifico' || userRole === 'tienda') && onDeleteStation && (
                  <button type="button" className="action-button delete-button" onClick={() => onDeleteStation(item)}>Eliminar</button>
                )}
              </>
            )}
            {item.type === 'scale' && onDeleteScale && !item.isActive && (
              <button type="button" className="action-button delete-button" onClick={() => onDeleteScale(item)}>Eliminar</button>
            )}
          </div>
        </div>

        {isExpanded && hasChildren && (
          <div className="item-children">
            {item.children!.map(child => renderItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="production-hierarchy">
      {items.map(item => renderItem(item))}
    </div>
  );
};

export default ProductionHierarchy;
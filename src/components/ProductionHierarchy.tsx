import React, { useState } from 'react';
import type { ReactNode } from 'react';
import './ProductionHierarchy.css';

export interface ProductionItem {
  id: string | number;
  type: 'station' | 'scale';
  name: string;
  details: Record<string, any>;
  children?: ProductionItem[];
}

interface ProductionHierarchyProps {
  items: ProductionItem[];
  onEditStation: (station: ProductionItem) => void;
  onCreateScale: (station: ProductionItem) => void;
}

const ProductionHierarchy: React.FC<ProductionHierarchyProps> = ({
  items,
  onEditStation,
  onCreateScale,
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
            <span className="item-role">{item.type === 'station' ? 'Estación' : 'Báscula'}</span>
            <span className="item-name">{item.name}</span>
            {item.type === 'scale' && (
              <span className="item-details">Clave: {item.details.key}</span>
            )}
          </div>
          <div className="item-actions">
            {item.type === 'station' && (
              <>
                <button className="action-button" onClick={() => onEditStation(item)}>Editar</button>
                <button className="action-button" onClick={() => onCreateScale(item)}>Crear Báscula</button>
              </>
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
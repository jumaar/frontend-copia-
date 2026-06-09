import React from 'react';
import './Resumen.css';

export interface ResumenItem {
  label: string;
  value: string;
  icon?: string;
}

interface ResumenProps {
  items: ResumenItem[];
}

const Resumen: React.FC<ResumenProps> = ({ items }) => {
  if (!items.length) return null;

  return (
    <div className="resumen-financiero">
      {items.map((item, idx) => (
        <div key={idx} className="resumen-item">
          {item.icon && <span className="resumen-icon">{item.icon}</span>}
          <span className="resumen-label">{item.label}</span>
          <span className="resumen-value">{item.value}</span>
        </div>
      ))}
    </div>
  );
};

export type { ResumenProps };
export default Resumen;

import React from 'react';
import './SummaryCard.css';

interface SummaryCardProps {
  title: string;
  value: string;
  description: string;
  variant?: 'default' | 'success' | 'danger';
}

const SummaryCard: React.FC<SummaryCardProps> = ({ title, value, description, variant = 'default' }) => {
  return (
    <div className={`summary-card summary-card--${variant}`}>
      <h3 className="card-title">{title}</h3>
      <p className={`card-value card-value--${variant}`}>{value}</p>
      <p className="card-description">{description}</p>
    </div>
  );
};

export default SummaryCard;
import React from 'react';
import './SummaryCard.css';

interface SummaryCardProps {
  title: string;
  value: string;
  description: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ title, value, description }) => {
  return (
    <div className="summary-card">
      <h3 className="card-title">{title}</h3>
      <p className="card-value">{value}</p>
      <p className="card-description">{description}</p>
    </div>
  );
};

export default SummaryCard;
import React from 'react';
import type { Frigorifico } from '../../types/logistica.types';

interface FrigorificoHeaderProps {
  frigorifico: Frigorifico;
  userName: string;
}

const FrigorificoHeader: React.FC<FrigorificoHeaderProps> = ({ frigorifico, userName }) => (
  <div style={{
    marginBottom: '2rem',
    textAlign: 'center',
    padding: '1.5rem',
    backgroundColor: 'var(--color-card-bg)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--border-radius-lg)'
  }}>
    <h1 style={{
      margin: 0,
      color: 'var(--color-primary)',
      fontSize: '2.5rem',
      fontWeight: 'bold'
    }}>
      {frigorifico.nombre_frigorifico}
    </h1>
    <p style={{
      margin: '0.5rem 0 0 0',
      color: 'var(--color-text-secondary)',
      fontSize: '1.1rem'
    }}>
      {userName} - {frigorifico.ciudad.nombre_ciudad}, {frigorifico.ciudad.departamento.nombre_departamento}
    </p>
  </div>
);

export default FrigorificoHeader;

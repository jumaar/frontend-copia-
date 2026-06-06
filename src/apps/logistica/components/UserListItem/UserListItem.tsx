import React from 'react';
import type { Hermano } from '../../types/logistica.types';

interface UserListItemProps {
  hermano: Hermano;
  onConsult: (userId: number, userName: string) => void;
  consultingUser: number | null;
  hasLogisticaData: boolean;
}

const UserListItem: React.FC<UserListItemProps> = ({ hermano, onConsult, consultingUser, hasLogisticaData }) => {
  const isLoading = consultingUser === hermano.id_usuario;
  const disabled = isLoading || !hasLogisticaData;

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1rem',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--border-radius-md)',
        backgroundColor: 'var(--color-card-bg)'
      }}
    >
      <div>
        <h4 style={{ margin: '0 0 0.25rem 0', color: 'var(--color-text-primary)' }}>
          {hermano.nombre_usuario} {hermano.apellido_usuario}
        </h4>
        <p style={{ margin: '0', color: 'var(--color-text-secondary)' }}>
          Email: {hermano.email} | Celular: {hermano.celular}
        </p>
        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
          ID: {hermano.id_usuario}
        </p>
      </div>
      <button
        className="action-button"
        onClick={() => onConsult(hermano.id_usuario, `${hermano.nombre_usuario} ${hermano.apellido_usuario}`)}
        disabled={disabled}
        style={{
          padding: '0.5rem 1rem',
          backgroundColor: !hasLogisticaData ? '#64748b' : '#667eea',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          minWidth: '120px',
          opacity: !hasLogisticaData ? 0.6 : 1
        }}
        title={!hasLogisticaData ? 'Completa tus datos de empresa logística primero' : ''}
      >
        {isLoading ? 'Consultando...' : 'Consultar'}
      </button>
    </div>
  );
};

export default UserListItem;

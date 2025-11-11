import React, { useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { createRegistrationToken } from '../services/api';
import './CreateTokenModal.css';

import { type TokenData } from './TokenDisplay';

interface CreateTokenModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTokenCreated: (newToken: TokenData) => void;
}

type UserRole = 'superadmin' | 'admin' | 'frigorifico' | 'logistica' | 'tienda';


const CreateTokenModal: React.FC<CreateTokenModalProps> = ({ isOpen, onClose, onTokenCreated }) => {
  const { user } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole | ''>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableRoles = useMemo(() => {
    if (!user) return [];
    switch (user.role) {
      case 'superadmin':
        return ['admin'] as UserRole[];
      case 'admin':
        return ['frigorifico', 'logistica'] as UserRole[];
      case 'logistica':
        return ['tienda'] as UserRole[];
      default:
        return [];
    }
  }, [user]);

  const handleRoleChange = (role: UserRole) => {
    setSelectedRole(role);
    setError(null); // Limpiar errores al cambiar la selección
  };

  const handleSubmit = async () => {
    if (!selectedRole || isLoading) return;

    const isConfirmed = window.confirm(
      `¿Estás seguro de que quieres crear un token de registro para el rol "${selectedRole}"?`
    );

    if (!isConfirmed) {
      return; // Si cancela, no hacer nada más
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const data = await createRegistrationToken(selectedRole);
      onTokenCreated(data);
      handleClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ocurrió un error al crear el token. Por favor, inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  // Resetear estado al cerrar
  const handleClose = () => {
    setSelectedRole('');
    setError(null);
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-backdrop" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <h2>Crear Token de Registro</h2>
          <button onClick={handleClose} className="modal-close-button">&times;</button>
        </header>
        <div className="modal-body">
          <p className="modal-instructions">Selecciona el tipo de usuario para el que deseas crear un token de registro.</p>
          <div className="role-selection-list">
            {availableRoles.map((role) => (
              <label key={role} className="role-selection-item">
                <input
                  type="radio"
                  name="role"
                  value={role}
                  checked={selectedRole === role}
                  onChange={() => handleRoleChange(role)}
                  disabled={isLoading}
                />
                <span className="role-name">{role.charAt(0).toUpperCase() + role.slice(1)}</span>
              </label>
            ))}
          </div>
          {error && <p className="modal-error">{error}</p>}
        </div>
        <footer className="modal-footer">
          <button className="button button-secondary" onClick={handleClose} disabled={isLoading}>
            Cancelar
          </button>
          <button
            className="button button-primary"
            disabled={!selectedRole || isLoading}
            onClick={handleSubmit}
          >
            {isLoading ? 'Creando...' : 'Confirmar'}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default CreateTokenModal;
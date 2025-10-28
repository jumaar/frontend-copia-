import React, { useState, useEffect } from 'react';
import { createRegistrationToken } from '../../services/api';
import './CreateUserTokenPage.css';

interface Token {
  token: string;
  expiresAt: string;
  role: {
    nombre_rol: string;
  };
}

const CreateUserTokenPage: React.FC = () => {
  const [role, setRole] = useState('Tienda');
  const [existingTokens, setExistingTokens] = useState<Token[]>([]);
  const [newToken, setNewToken] = useState<Token | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    const fetchTokens = async () => {
      try {
        // Usar la función de la API que ya maneja la autenticación con cookies
        const response = await fetch('/api/registration-tokens', {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          setExistingTokens(data);
        } else {
          throw new Error('Error al cargar tokens');
        }
      } catch (err) {
        setError('Error al cargar los tokens existentes.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTokens();
  }, []);

  const handleGenerateClick = () => {
    setShowConfirmation(true);
  };

  const handleConfirmGenerate = async () => {
    setShowConfirmation(false);
    setError(null);
    setNewToken(null);

    try {
      // Usar la función de la API que ya maneja la autenticación con cookies
      const roleMap: { [key: string]: 'superadmin' | 'admin' | 'frigorifico' | 'logistica' | 'tienda' } = {
        'Admin': 'admin',
        'Frigorifico': 'frigorifico',
        'Logistica': 'logistica',
        'Tienda': 'tienda'
      };

      const tokenData = await createRegistrationToken(roleMap[role] || 'tienda');
      setNewToken(tokenData);
      // Refresh the list of existing tokens
      setExistingTokens(prev => [...prev, tokenData]);
    } catch (err) {
      setError('Error al generar el token. Inténtelo de nuevo.');
      console.error(err);
    }
  };

  const handleCancelGenerate = () => {
    setShowConfirmation(false);
  };

  const availableRoles = ['Admin', 'Frigorifico', 'Logistica', 'Tienda'];

  return (
    <div className="token-page">
      <header className="management-header">
        <h1>Crear Token de Registro</h1>
        <p>Generar un nuevo token de invitación para un rol de usuario específico.</p>
      </header>

      <div className="card">
        <div className="token-creation-form">
          <div className="input-group">
            <label htmlFor="role-select">Seleccionar Rol:</label>
            <select id="role-select" value={role} onChange={(e) => setRole(e.target.value)}>
              {availableRoles.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <button className="button button-primary" onClick={handleGenerateClick}>
            Generar Token
          </button>
        </div>
      </div>

      {showConfirmation && (
        <div className="confirmation-modal-overlay">
          <div className="confirmation-modal card">
            <h3>Confirmar Creación de Token</h3>
            <p>¿Está seguro de que desea crear un token para el rol de <strong>{role}</strong>?</p>
            <div className="modal-actions">
              <button className="button button-secondary" onClick={handleCancelGenerate}>
                Cancelar
              </button>
              <button className="button button-primary" onClick={handleConfirmGenerate}>
                Aceptar y Crear
              </button>
            </div>
          </div>
        </div>
      )}

      {newToken && (
        <div className="new-token-display card">
          <h3>Token Generado Exitosamente</h3>
          <div className="token-info">
            <p><strong>Token:</strong> <code>{newToken.token}</code></p>
            <p><strong>Rol:</strong> {newToken.role.nombre_rol}</p>
            <p><strong>Expira:</strong> {new Date(newToken.expiresAt).toLocaleString()}</p>
          </div>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}

      <div className="existing-tokens-section card">
        <h2>Tokens de Registro Activos</h2>
        {isLoading ? (
          <p>Cargando tokens...</p>
        ) : existingTokens.length > 0 ? (
          <table className="management-table">
            <thead>
              <tr>
                <th>Token</th>
                <th>Rol</th>
                <th>Expira</th>
              </tr>
            </thead>
            <tbody>
              {existingTokens.map((token) => (
                <tr key={token.token}>
                  <td><code>{token.token}</code></td>
                  <td>{token.role.nombre_rol}</td>
                  <td>{new Date(token.expiresAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No hay tokens activos en este momento.</p>
        )}
      </div>
    </div>
  );
};

export default CreateUserTokenPage;
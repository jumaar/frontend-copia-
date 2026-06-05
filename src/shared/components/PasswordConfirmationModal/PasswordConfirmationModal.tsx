import React, { useState } from 'react';
import '../CreateTokenModal/CreateTokenModal.css'; // Reutilizamos los estilos
import './PasswordConfirmationModal.css';

interface PasswordConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  password: string;
  title?: string;
}

const PasswordConfirmationModal: React.FC<PasswordConfirmationModalProps> = ({
  isOpen,
  onClose,
  password,
  title = "Confirmación de Contraseña"
}) => {
  const [copiedPassword, setCopiedPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(password);
      alert('¡Contraseña copiada al portapapeles!');
    } catch (err) {
      console.error('Error al copiar:', err);
      alert('Error al copiar la contraseña');
    }
  };

  const handleConfirm = () => {
    if (copiedPassword.trim() === password) {
      setError(null);
      setCopiedPassword('');
      onClose();
    } else {
      setError('La contraseña ingresada no coincide. Por favor, cópiela y péguela correctamente.');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleConfirm();
    }
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.stopPropagation()}>
      <div className="modal-content password-modal">
        <header className="modal-header">
          <h2>{title}</h2>
        </header>
        <div className="modal-body">
          <div className="password-confirmation-content">
            <div className="password-warning">
              <strong>⚠️ IMPORTANTE:</strong> Esta es la única vez que verá esta contraseña.
              Asegúrese de copiarla y guardarla en un lugar seguro.
            </div>

            <div className="password-display">
              {password}
            </div>

            <div className="password-actions">
              <button
                type="button"
                className="button button-secondary"
                onClick={copyToClipboard}
              >
                Copiar Contraseña
              </button>
            </div>

            <div className="form-group">
              <label htmlFor="password-confirm">
                Confirme que copió la contraseña pegándola aquí:
              </label>
              <input
                type="text"
                id="password-confirm"
                value={copiedPassword}
                onChange={(e) => {
                  setCopiedPassword(e.target.value);
                  setError(null);
                }}
                onKeyPress={handleKeyPress}
                placeholder="Pegue la contraseña aquí"
                autoFocus
              />
            </div>

            {error && <p className="modal-error">{error}</p>}
          </div>
        </div>
        <footer className="modal-footer">
          <button
            type="button"
            className="button button-primary"
            onClick={handleConfirm}
            disabled={!copiedPassword.trim()}
          >
            Confirmar y Cerrar
          </button>
        </footer>
      </div>
    </div>
  );
};

export default PasswordConfirmationModal;
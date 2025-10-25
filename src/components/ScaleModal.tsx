import React from 'react';
import './CreateTokenModal.css'; // Reusing styles

interface ScaleModalProps {
  isOpen: boolean;
  onClose: (newScale?: { id: string; key: string }) => void;
  stationName: string;
}

const ScaleModal: React.FC<ScaleModalProps> = ({ isOpen, onClose, stationName }) => {
  if (!isOpen) {
    return null;
  }

  // Simulate generating a new scale ID and key
  const scaleId = `EST-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  const linkingKey = Math.random().toString(36).substr(2, 16).toUpperCase();

  return (
    <div className="modal-backdrop" onClick={() => onClose()}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <header className="modal-header">
          <h2>Crear Nueva Estación para "{stationName}"</h2>
          <button onClick={() => onClose()} className="modal-close-button">&times;</button>
        </header>
        <div className="modal-body">
          <p>Se ha generado una nueva estación. Utiliza la siguiente clave para vincularla:</p>
          <div className="token-display">
            <div className="token-info">
              <strong>ID de Estación:</strong>
              <span>{scaleId}</span>
            </div>
            <div className="token-info">
              <strong>Clave de Vinculación:</strong>
              <span>{linkingKey}</span>
            </div>
          </div>
          <p className="modal-note">Esta clave es de un solo uso y expirará si no se utiliza.</p>
        </div>
        <footer className="modal-footer">
          <button type="button" className="button button-secondary" onClick={() => onClose()}>
            Cerrar
          </button>
          <button type="button" className="button button-primary" onClick={() => onClose({ id: scaleId, key: linkingKey })}>
            Vincular
          </button>
        </footer>
      </div>
    </div>
  );
};

export default ScaleModal;
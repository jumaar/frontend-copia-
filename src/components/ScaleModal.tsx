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
          <h2>Nueva Estación para "{stationName}"</h2>
          <button onClick={() => onClose()} className="modal-close-button">&times;</button>
        </header>
        <div className="modal-body">
          <p>Se creara una clave de vinculacion para la estacion. Utiliza la  clave para vincular el dispositivo:</p>
          
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
import React, { useState } from 'react';
import './ConfirmarSurtidoModal.css';

interface ConfirmarSurtidoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (idNevera: number) => Promise<void>;
  idNevera: number;
  nombreTienda?: string;
}

const ConfirmarSurtidoModal: React.FC<ConfirmarSurtidoModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  idNevera,
  nombreTienda = 'Cargando...'
}) => {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    try {
      setLoading(true);
      await onConfirm(idNevera);
      // El modal se cierra automáticamente después del éxito en la función handleRealizarSurtido
    } catch (error) {
      console.error('Error al confirmar surtido:', error);
      // El error ya se maneja en handleRealizarSurtido con alert
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="confirmar-surtido-overlay">
      <div className="confirmar-surtido-card">
        <div className="confirmar-surtido-header">
          <div className="confirmar-surtido-icon">⚠️</div>
          <h1>CONFIRMACIÓN CRÍTICA</h1>
          <h2>¿Estás seguro de surtir esta nevera?</h2>
        </div>

        <div className="confirmar-surtido-body">
          <div className="confirmar-surtido-id-box">
            <h3>ID DE LA NEVERA:</h3>
            <div className="confirmar-surtido-id-number">{idNevera}</div>
            <div className="confirmar-surtido-id-name">{nombreTienda}</div>
          </div>

          <div className="confirmar-surtido-warning-box">
            <div className="confirmar-surtido-warning-icon">🚨</div>
            <h3>IMPORTANTE - DEBES ESTAR PRESENTE</h3>
            <p>⚠️ Debes estar presente o estar junto a la nevera para poder surtirla. ⚠️</p>
          </div>

          <div className="confirmar-surtido-info-box">
            <p>Esta acción <strong>no se puede deshacer</strong> y registrará el surtido de la nevera. Asegúrate de estar físicamente junto a la nevera antes de confirmar.</p>
          </div>
        </div>

        <div className="confirmar-surtido-footer">
          <button className="confirmar-surtido-btn-cancel" onClick={onClose} disabled={loading}>Cancelar</button>
          <button className="confirmar-surtido-btn-confirm" onClick={handleConfirm} disabled={loading}>{loading ? 'Procesando...' : 'Confirmar Surtido'}</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmarSurtidoModal;
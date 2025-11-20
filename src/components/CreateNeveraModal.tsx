import React from 'react';
import './CreateTokenModal.css'; // Reutilizamos los estilos del otro modal

interface CreateNeveraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  tiendaName: string;
}

const CreateNeveraModal: React.FC<CreateNeveraModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  tiendaName
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Confirmar Creación</h2>
          <button className="modal-close-button" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <p>¿Estás seguro de que deseas crear una nueva nevera para la tienda <strong>{tiendaName}</strong>?</p>
        </div>
        <div className="modal-footer">
          <button type="button" className="button button-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button type="button" className="button button-primary" onClick={onConfirm}>
            Confirmar y Crear
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateNeveraModal;
import React, { useState } from 'react';

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
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      zIndex: 1000,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        maxWidth: '700px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        border: '3px solid #ef4444'
      }}>
        {/* Header */}
        <div style={{
          backgroundColor: '#fef2f2',
          padding: '30px',
          borderBottom: '2px solid #fecaca',
          borderRadius: '12px 12px 0 0',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '60px',
            marginBottom: '15px'
          }}>
            ⚠️
          </div>
          <h1 style={{
            margin: '0 0 10px 0',
            color: '#dc2626',
            fontSize: '32px',
            fontWeight: 'bold'
          }}>
            CONFIRMACIÓN CRÍTICA
          </h1>
          <h2 style={{
            margin: '0',
            color: '#374151',
            fontSize: '20px',
            fontWeight: '600'
          }}>
            ¿Estás seguro de surtir esta nevera?
          </h2>
        </div>

        {/* Content */}
        <div style={{
          padding: '40px',
          textAlign: 'center'
        }}>
          {/* ID Nevera muy grande y explícito */}
          <div style={{
            backgroundColor: '#fef2f2',
            border: '3px solid #ef4444',
            borderRadius: '12px',
            padding: '30px',
            marginBottom: '30px'
          }}>
            <h3 style={{
              margin: '0 0 15px 0',
              color: '#7f1d1d',
              fontSize: '24px',
              fontWeight: 'bold'
            }}>
              ID DE LA NEVERA:
            </h3>
            <div style={{
              fontSize: '72px',
              fontWeight: 'bold',
              color: '#dc2626',
              marginBottom: '10px',
              textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
            }}>
              {idNevera}
            </div>
            <div style={{
              fontSize: '18px',
              color: '#374151',
              fontWeight: '600'
            }}>
              {nombreTienda}
            </div>
          </div>

          {/* Mensaje importante */}
          <div style={{
            backgroundColor: '#fef3c7',
            border: '2px solid #f59e0b',
            borderRadius: '8px',
            padding: '25px',
            marginBottom: '30px'
          }}>
            <div style={{
              fontSize: '28px',
              marginBottom: '15px'
            }}>
              🚨
            </div>
            <h3 style={{
              margin: '0 0 15px 0',
              color: '#92400e',
              fontSize: '22px',
              fontWeight: 'bold'
            }}>
              IMPORTANTE - DEBES ESTAR PRESENTE
            </h3>
            <p style={{
              margin: '0',
              color: '#92400e',
              fontSize: '18px',
              lineHeight: '1.6',
              fontWeight: '600'
            }}>
              ⚠️ Debes estar presente o estar junto a la nevera para poder surtirla. ⚠️
            </p>
          </div>

          {/* Mensaje de advertencia */}
          <div style={{
            backgroundColor: '#f3f4f6',
            borderRadius: '8px',
            padding: '20px',
            border: '1px solid #d1d5db'
          }}>
            <p style={{
              margin: '0',
              color: '#374151',
              fontSize: '16px',
              lineHeight: '1.5'
            }}>
              Esta acción <strong>no se puede deshacer</strong> y registrará el surtido de la nevera. 
              Asegúrate de estar físicamente junto a la nevera antes de confirmar.
            </p>
          </div>
        </div>

        {/* Footer con botones */}
        <div style={{
          padding: '30px',
          borderTop: '2px solid #e5e7eb',
          backgroundColor: '#f9fafb',
          display: 'flex',
          justifyContent: 'center',
          gap: '20px',
          borderRadius: '0 0 12px 12px'
        }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              padding: '15px 40px',
              backgroundColor: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            style={{
              padding: '15px 40px',
              backgroundColor: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            {loading ? 'Procesando...' : 'Confirmar Surtido'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmarSurtidoModal;
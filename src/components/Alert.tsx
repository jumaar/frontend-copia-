import React, { useEffect } from 'react';
import './Alert.css';

interface AlertProps {
  message: string;
  onDismiss: () => void;
  type?: 'welcome' | 'default';
}

const Alert: React.FC<AlertProps> = ({ message, onDismiss, type = 'default' }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 5000); // La alerta se oculta después de 5 segundos

    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className="alert-container">
      <div className={`alert-content ${type === 'welcome' ? 'welcome' : ''}`}>
        {type === 'welcome' && (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        )}
        <span>{message}</span>
        <button onClick={onDismiss} className="alert-dismiss-button">
          &times;
        </button>
      </div>
    </div>
  );
};

export default Alert;
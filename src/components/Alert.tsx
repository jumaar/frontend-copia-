import React, { useEffect } from 'react';
import './Alert.css';

interface AlertProps {
  message: string;
  onDismiss: () => void;
  type?: 'welcome' | 'error' | 'default';
}

const Alert: React.FC<AlertProps> = ({ message, onDismiss, type = 'default' }) => {
  useEffect(() => {
    // Si es un error, dejarlo más tiempo (5s) o hasta que el usuario lo cierre
    const duration = type === 'error' ? 5000 : 2500;
    
    const timer = setTimeout(() => {
      onDismiss();
    }, duration);

    return () => clearTimeout(timer);
  }, [onDismiss, type]);

  return (
    <div className="alert-container">
      <div className={`alert-content ${type}`}>
        {type === 'welcome' && (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        )}
        {type === 'error' && (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
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
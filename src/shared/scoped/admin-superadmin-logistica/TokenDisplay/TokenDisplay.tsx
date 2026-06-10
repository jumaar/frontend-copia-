import React, { useState, useEffect } from 'react';
import './TokenDisplay.css';

export interface TokenData {
  token: string;
  expira_en: string;
  rol_nuevo_usuario: {
    nombre_rol: string;
  };
}

interface TokenDisplayProps {
  tokenData: TokenData;
  onExpire: (token: string) => void;
}

const TokenDisplay: React.FC<TokenDisplayProps> = ({ tokenData, onExpire }) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const expirationDate = new Date(tokenData.expira_en).getTime();
      const now = new Date().getTime();
      const distance = expirationDate - now;

      if (distance < 0) {
        setTimeLeft('Expirado');
        onExpire(tokenData.token);
        return;
      }

      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      if (newTimeLeft) {
        setTimeLeft(newTimeLeft);
      } else {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [tokenData, onExpire]);

  const handleCopy = () => {
    navigator.clipboard.writeText(tokenData.token).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000); // Reset after 2 seconds
    });
  };

  return (
    <div className="token-display-card card">
      <div className="token-info">
        <span className="token-role">Rol: {tokenData.rol_nuevo_usuario.nombre_rol}</span>
        <code className="token-code">{tokenData.token}</code>
      </div>
      <div className="token-actions">
        <span className="token-timer">Expira en: {timeLeft}</span>
        <button onClick={handleCopy} className="button button-secondary">
          {copySuccess ? '¡Copiado!' : 'Copiar'}
        </button>
      </div>
    </div>
  );
};

export default TokenDisplay;
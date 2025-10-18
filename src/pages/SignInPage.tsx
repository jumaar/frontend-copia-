import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Turnstile } from '@marsidev/react-turnstile';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Validar que el Turnstile esté completado
    if (!turnstileToken) {
      setError('Por favor, completa la verificación de seguridad');
      setIsLoading(false);
      return;
    }

    try {
      await login(email, password, turnstileToken); // Pasar el token al login
      navigate('/dashboard');
    } catch (err) {
      setError('Credenciales inválidas. Por favor, intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="center-content">
      <div className="auth-container">
        <h2>Iniciar Sesión</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Correo electrónico:
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="form-input"
              placeholder="superadmin@vorak.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Contraseña:
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="form-input"
              placeholder="Contraseña del superadmin"
            />
          </div>

          {/* Cloudflare Turnstile Widget */}
          <div className="form-group">
            <Turnstile
              siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
              onSuccess={(token) => setTurnstileToken(token)}
              onError={() => setError('Error en la verificación de seguridad')}
              onExpire={() => setTurnstileToken('')}
            />
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={`btn btn-primary ${isLoading ? 'disabled' : ''}`}
            style={{ width: '100%', cursor: isLoading ? 'not-allowed' : 'pointer' }}
          >
            {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
          <button
            onClick={() => navigate('/sign-up')}
            style={{
              background: 'none',
              border: 'none',
              color: '#e57373',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            ¿No tienes cuenta? Regístrate
          </button>
        </div>
      </div>
    </div>
  );
}

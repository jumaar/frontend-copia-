import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Turnstile } from '@marsidev/react-turnstile';

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roleToken, setRoleToken] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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
      console.log('📝 Intentando registro con:', {
        email,
        password: '***',
        roleToken: roleToken ? 'presente' : 'ausente',
        turnstileToken: 'presente'
      });

      // Comunicación con backend en localhost:3000
      const response = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, roleToken, turnstileToken }),
      });

      console.log('📡 Respuesta del registro:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Error en registro:', errorData);
        throw new Error(errorData.message || 'Error en el registro');
      }

      const data = await response.json();
      console.log('✅ Registro exitoso:', data);

      alert('Usuario registrado exitosamente. Ahora puedes iniciar sesión.');
      navigate('/sign-in');
    } catch (err) {
      console.error('💥 Error en registro:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="center-content">
      <div className="auth-container">
        <h2>Registro de Usuario</h2>

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
            />
          </div>

          <div className="form-group">
            <label htmlFor="roleToken" className="form-label">
              Token de Rol:
            </label>
            <input
              type="text"
              id="roleToken"
              value={roleToken}
              onChange={(e) => setRoleToken(e.target.value)}
              required
              className="form-input"
              placeholder="Token proporcionado por administrador"
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
            {isLoading ? 'Registrando...' : 'Registrar'}
          </button>
        </form>

        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
          <button
            onClick={() => navigate('/sign-in')}
            style={{
              background: 'none',
              border: 'none',
              color: '#e57373',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            ¿Ya tienes cuenta? Inicia sesión
          </button>
        </div>
      </div>
    </div>
  );
}
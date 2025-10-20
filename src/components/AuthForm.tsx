import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Turnstile } from '@marsidev/react-turnstile';
import './AuthForm.css';

interface AuthFormProps {
  formType: 'signIn' | 'signUp';
  onSubmit: (formData: any) => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ formType, onSubmit }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    token: '',
    turnstileToken: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const isSignUp = formType === 'signUp';

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">{isSignUp ? 'Crear Cuenta' : 'Iniciar Sesión'}</h2>
        <p className="auth-subtitle">
          {isSignUp ? 'Ingrese su token y credenciales.' : 'Bienvenido de nuevo.'}
        </p>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="input-group">
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>
          {isSignUp && (
            <>
              <div className="input-group">
                <label htmlFor="confirmPassword">Confirmar Contraseña</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="input-group">
                <label htmlFor="token">Token de Registro</label>
                <input
                  type="text"
                  id="token"
                  name="token"
                  value={formData.token}
                  onChange={handleChange}
                  required
                />
              </div>
            </>
          )}
          <Turnstile
            siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
            onSuccess={(token) => setFormData(prev => ({ ...prev, turnstileToken: token }))}
            options={{ theme: 'light' }}
          />
          <button type="submit" className="button button-primary auth-button">
            {isSignUp ? 'Registrarse' : 'Continuar'}
          </button>
        </form>
        <div className="auth-footer">
          {isSignUp ? (
            <p>
              ¿Ya tienes una cuenta?{' '}
              <Link to="/sign-in">Inicia Sesión</Link>
            </p>
          ) : (
            <p>
              ¿No tienes una cuenta?{' '}
              <Link to="/sign-up">Regístrate</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthForm;
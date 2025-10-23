import React, { useState, useEffect, useRef } from 'react';
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
    nombre_usuario: '',
    apellido_usuario: '',
    identificacion_usuario: '',
    celular: '',
  });

  const turnstileRef = useRef<any>(null);

  const sanitizeInput = (value: string, fieldName: string): string => {
    let sanitized = value;

    // Remover caracteres de control y espacios extra
    sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '').trim();

    // Para campos de texto (nombre, apellido): permitir solo letras, espacios y algunos caracteres especiales
    if (['nombre_usuario', 'apellido_usuario'].includes(fieldName)) {
      sanitized = sanitized.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s'-]/g, '');
    }

    // Para identificación y celular: solo números
    if (['identificacion_usuario', 'celular'].includes(fieldName)) {
      sanitized = sanitized.replace(/[^\d]/g, '');
    }

    // Para email: caracteres permitidos en emails
    if (fieldName === 'email') {
      sanitized = sanitized.replace(/[^a-zA-Z0-9@._-]/g, '');
    }

    // Para token: alfanumérico y algunos símbolos seguros
    if (fieldName === 'token') {
      sanitized = sanitized.replace(/[^a-zA-Z0-9_-]/g, '');
    }

    // Limitar longitud máxima por campo
    const maxLengths: Record<string, number> = {
      nombre_usuario: 50,
      apellido_usuario: 50,
      identificacion_usuario: 20,
      celular: 10,
      email: 100,
      token: 100,
      password: 128,
      confirmPassword: 128,
    };

    if (maxLengths[fieldName] && sanitized.length > maxLengths[fieldName]) {
      sanitized = sanitized.substring(0, maxLengths[fieldName]);
    }

    return sanitized;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const sanitizedValue = sanitizeInput(value, name);
    setFormData(prev => ({ ...prev, [name]: sanitizedValue }));
  };

  // Escuchar eventos de error de Turnstile para refrescar el widget
  useEffect(() => {
    const handleTurnstileError = (event: CustomEvent) => {
      if (event.detail?.refresh && turnstileRef.current) {
        // Resetear el token y forzar refresh del widget
        setFormData(prev => ({ ...prev, turnstileToken: '' }));
        // El componente Turnstile se refresca automáticamente cuando el token se resetea
      }
    };

    window.addEventListener('turnstile-error', handleTurnstileError as EventListener);

    return () => {
      window.removeEventListener('turnstile-error', handleTurnstileError as EventListener);
    };
  }, []);

  const validateForm = () => {
    const errors: string[] = [];

    // Validar campos requeridos para ambos formularios
    if (!formData.email) {
      errors.push("El email es requerido.");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.push("El email no tiene un formato válido.");
    }

    if (!formData.password) {
      errors.push("La contraseña es requerida.");
    }

    // Validar token de Turnstile para ambos formularios
    if (!formData.turnstileToken) {
      errors.push("Por favor, completa la verificación de seguridad.");
    }

    // Validaciones adicionales para registro
    if (isSignUp) {
      // Validar nombre
      if (!formData.nombre_usuario) {
        errors.push("El nombre es requerido.");
      } else if (formData.nombre_usuario.length < 2) {
        errors.push("El nombre debe tener al menos 2 caracteres.");
      } else if (formData.nombre_usuario.length > 50) {
        errors.push("El nombre no puede exceder 50 caracteres.");
      }

      // Validar apellido
      if (!formData.apellido_usuario) {
        errors.push("El apellido es requerido.");
      } else if (formData.apellido_usuario.length < 2) {
        errors.push("El apellido debe tener al menos 2 caracteres.");
      } else if (formData.apellido_usuario.length > 50) {
        errors.push("El apellido no puede exceder 50 caracteres.");
      }

      // Validar identificación
      if (!formData.identificacion_usuario) {
        errors.push("La identificación es requerida.");
      } else if (!/^\d{6,20}$/.test(formData.identificacion_usuario)) {
        errors.push("La identificación debe contener entre 6 y 20 números.");
      }

      // Validar celular
      if (!formData.celular) {
        errors.push("El celular es requerido.");
      } else if (!/^\d{10}$/.test(formData.celular)) {
        errors.push("El celular debe contener exactamente 10 números.");
      }

      // Validar token
      if (!formData.token) {
        errors.push("El token de registro es requerido.");
      } else if (formData.token.length < 5) {
        errors.push("El token debe tener al menos 5 caracteres.");
      }

      // Validar contraseña
      if (formData.password.length < 10) {
        errors.push("La contraseña debe tener al menos 10 caracteres.");
      } else if (formData.password.length > 128) {
        errors.push("La contraseña no puede exceder 128 caracteres.");
      }
      if (!/(?=.*[a-z])/.test(formData.password)) {
        errors.push("La contraseña debe contener al menos una letra minúscula.");
      }
      if (!/(?=.*[A-Z])/.test(formData.password)) {
        errors.push("La contraseña debe contener al menos una letra mayúscula.");
      }
      if (!/(?=.*\d)/.test(formData.password)) {
        errors.push("La contraseña debe contener al menos un número.");
      }
      if (!/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(formData.password)) {
        errors.push("La contraseña debe contener al menos un símbolo especial.");
      }
      if (formData.password !== formData.confirmPassword) {
        errors.push("Las contraseñas no coinciden.");
      }

      // Validar confirmación de contraseña
      if (!formData.confirmPassword) {
        errors.push("La confirmación de contraseña es requerida.");
      }
    }

    return errors;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      alert(validationErrors.join("\n"));
      return;
    }

    // El token de Turnstile ya se valida en validateForm()

    // Crear una copia limpia de los datos para enviar
    const dataToSubmit = {
      ...formData,
      // Asegurar que el token de Turnstile esté presente
      turnstileToken: formData.turnstileToken
    };

    onSubmit(dataToSubmit);

    // Resetear el token de Turnstile después del envío para forzar una nueva verificación
    setFormData(prev => ({ ...prev, turnstileToken: '' }));
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
          {isSignUp && (
            <>
              <div className="input-group">
                <label htmlFor="nombre_usuario">Nombre</label>
                <input
                  type="text"
                  id="nombre_usuario"
                  name="nombre_usuario"
                  value={formData.nombre_usuario}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="input-group">
                <label htmlFor="apellido_usuario">Apellido</label>
                <input
                  type="text"
                  id="apellido_usuario"
                  name="apellido_usuario"
                  value={formData.apellido_usuario}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="input-group">
                <label htmlFor="identificacion_usuario">Identificación</label>
                <input
                  type="text"
                  id="identificacion_usuario"
                  name="identificacion_usuario"
                  value={formData.identificacion_usuario}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="input-group">
                <label htmlFor="celular">Celular</label>
                <input
                  type="text"
                  id="celular"
                  name="celular"
                  value={formData.celular}
                  onChange={handleChange}
                  required
                />
              </div>
            </>
          )}
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
            ref={turnstileRef}
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
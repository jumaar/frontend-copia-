import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthForm from '../components/AuthForm/AuthForm';
import { useAuth } from '../../contexts/AuthContext';
import Alert from '../components/Alert/Alert';
import { getDashboardPath } from '../config/roles';

const SignInPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async (formData: any) => {
    try {
      setError(null);
      const user = await login(formData.email, formData.password, formData.turnstileToken);

      if (user) {
        navigate(getDashboardPath(user.role));
      }
    } catch (error: any) {
      console.error('Login failed:', error);

      // Refrescar Turnstile en cualquier error de login para forzar nueva verificación
      const turnstileEvent = new CustomEvent('turnstile-error', {
        detail: { refresh: true }
      });
      window.dispatchEvent(turnstileEvent);

      // Mostrar el mensaje de error específico al usuario
      setError(error.message || 'Error al iniciar sesión. Inténtalo de nuevo.');
    }
  };

  return (
    <>
      {error && <Alert message={error} onDismiss={() => setError(null)} type="error" />}
      <AuthForm formType="signIn" onSubmit={handleSignIn} />
    </>
  );
};

export default SignInPage;
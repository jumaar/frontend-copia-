import React from 'react';
import { useNavigate } from 'react-router-dom';
import AuthForm from '../components/AuthForm';
import { useAuth } from '../contexts/AuthContext';

const SignInPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSignIn = async (formData: any) => {
    try {
      const user = await login(formData.email, formData.password, formData.turnstileToken);

      if (user) {
        switch (user.role) {
          case 'superadmin':
          case 'admin':
            navigate('/admin/dashboard');
            break;
          case 'frigorifico':
            navigate('/frigorifico');
            break;
          case 'logistica':
            navigate('/logistica');
            break;
          case 'tienda':
            navigate('/tienda');
            break;
          default:
            navigate('/admin/dashboard');
        }
      }
    } catch (error: any) {
      console.error('Login failed:', error);
      // Mostrar el mensaje de error específico al usuario
      alert(error.message || 'Error al iniciar sesión. Inténtalo de nuevo.');
    }
  };

  return <AuthForm formType="signIn" onSubmit={handleSignIn} />;
};

export default SignInPage;
import React from 'react';
import { useNavigate } from 'react-router-dom';
import AuthForm from '../components/AuthForm';
import { useAuth } from '../contexts/AuthContext';

const SignInPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSignIn = async (formData: any) => {
    console.log('Sign In submitted', formData);
    try {
      const user = await login(formData.email, formData.password, formData.turnstileToken);
      console.log('Login successful, navigating to dashboard...');
      
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
            navigate('/store/inventory');
            break;
          default:
            navigate('/admin/dashboard');
        }
      } else {
        // Fallback por si el usuario no se establece correctamente
        navigate('/admin/dashboard');
      }
    } catch (error) {
      console.error('Login failed:', error);
      // Aquí podrías mostrar un mensaje de error al usuario
    }
  };

  return <AuthForm formType="signIn" onSubmit={handleSignIn} />;
};

export default SignInPage;
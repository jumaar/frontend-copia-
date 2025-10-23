import React from 'react';
import { useNavigate } from 'react-router-dom';
import AuthForm from '../components/AuthForm';
import { createUserWithToken } from '../services/api';

const SignUpPage: React.FC = () => {
  const navigate = useNavigate();

  const handleSignUp = async (formData: any) => {
    try {
      console.log('Sign Up submitted', formData);
      const result = await createUserWithToken({
        email: formData.email,
        password: formData.password,
        turnstileToken: formData.turnstileToken,
        registrationToken: formData.token,
        nombre_usuario: formData.nombre_usuario,
        apellido_usuario: formData.apellido_usuario,
        identificacion_usuario: formData.identificacion_usuario,
        celular: formData.celular,
      });
      console.log('User created successfully:', result);
      // Aquí podrías mostrar un mensaje de éxito o redirigir automáticamente
      alert('Usuario creado exitosamente. Ahora puedes iniciar sesión.');
      navigate('/sign-in');
    } catch (error: any) {
      console.error('Error creating user:', error);
      alert(error.response?.data?.message || 'Error al crear el usuario. Verifica los datos e intenta nuevamente.');
    }
  };

  return <AuthForm formType="signUp" onSubmit={handleSignUp} />;
};

export default SignUpPage;
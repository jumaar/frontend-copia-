import React from 'react';
import AuthForm from '../components/AuthForm';

const SignUpPage: React.FC = () => {

  const handleSignUp = (formData: any) => {
    console.log('Sign Up submitted', formData);
    // Here you would typically call a registration service
  };

  return <AuthForm formType="signUp" onSubmit={handleSignUp} />;
};

export default SignUpPage;
import React from 'react';
import AuthForm from '../components/AuthForm';

const SignInPage: React.FC = () => {

  const handleSignIn = (formData: any) => {
    console.log('Sign In submitted', formData);
    // Here you would typically call an authentication service
  };

  return <AuthForm formType="signIn" onSubmit={handleSignIn} />;
};

export default SignInPage;
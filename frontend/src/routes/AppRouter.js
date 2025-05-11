import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from '../pages/HomePage';
import AuthCallbackHandler from '../components/Auth/AuthCallbackHandler';
import AuthCallbackLoadingPage from '../pages/AuthCallbackLoadingPage';

const AppRouter = () => {
  return (
    <Routes>
      <Route path="/home" element={<HomePage />} />
      <Route path="/auth/google/callback" element={<AuthCallbackHandler />} />
      <Route path="/auth/callback-loading" element={<AuthCallbackLoadingPage />} />
      <Route path="/" element={<HomePage />} />
    </Routes>
  );
};

export default AppRouter;
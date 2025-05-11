import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from '../pages/HomePage';
import AuthCallbackHandler from '../components/Auth/AuthCallbackHandler';

const AppRouter = () => {
  return (
    <Router>
      <Routes>
        <Route path="/home" element={<HomePage />} />
        <Route path="/auth/google/callback" element={<AuthCallbackHandler />} />
        <Route path="/" element={<HomePage />} /> {/* Default route is now HomePage */}
      </Routes>
    </Router>
  );
};

export default AppRouter;
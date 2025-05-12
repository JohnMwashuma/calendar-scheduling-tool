import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from '../pages/HomePage';
import AuthCallbackHandler from '../components/Auth/AuthCallbackHandler';
import AuthCallbackLoadingPage from '../pages/AuthCallbackLoadingPage';
import CalendarEventsPage from '../pages/CalendarEventsPage';
import PublicSchedulePage from '../pages/PublicSchedulePage';
const AppRouter = () => {
  return (
    <Routes>
      <Route path="/home" element={<HomePage />} />
      <Route path="/auth/google/callback" element={<AuthCallbackHandler />} />
      <Route path="/auth/callback-loading" element={<AuthCallbackLoadingPage />} />
      <Route path="/calendar-events" element={<CalendarEventsPage />} />
      <Route path="/" element={<HomePage />} />
      <Route path="/book/:link_id" element={<PublicSchedulePage />} />
    </Routes>
  );
};

export default AppRouter;
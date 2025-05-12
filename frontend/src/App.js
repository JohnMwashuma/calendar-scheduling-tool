import React, { useEffect } from 'react';
import AppRouter from './routes/AppRouter';
import { Provider, useDispatch } from 'react-redux';
import store from './store';
import 'antd/dist/reset.css'; 
import { loginSuccess, loginFailure, loginRequest } from './store/actions/authActions';
import * as api from './services/api';

// Simple cookie getter
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}

const AuthInitializer = ({ children }) => {
  const dispatch = useDispatch();
  useEffect(() => {
    const checkAuth = async () => {
      const token = getCookie('google_access_token');
      if (token) {
        dispatch(loginRequest());
        try {
          const response = await api.get('/auth/me', {
            headers: { Authorization: `Bearer ${token}` },
            withCredentials: true,
          });
          dispatch(loginSuccess(response.data.user));
        } catch (err) {
          dispatch(loginFailure('Session expired or invalid.'));
        }
      }
    };
    checkAuth();
  }, [dispatch]);
  return children;
};

const App = () => {
  return (
    <Provider store={store}>
      <AuthInitializer>
        <AppRouter />
      </AuthInitializer>
    </Provider>
  );
};

export default App;
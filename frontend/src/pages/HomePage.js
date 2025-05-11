import React from 'react';
import { Layout, Button } from 'antd';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/actions/authActions';
import GoogleLoginButton from '../components/Auth/GoogleLoginButton';

const HomePage = () => {
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();

  const handleLogout = () => {
    document.cookie =  `google_access_token=; path=/; max-age=0; domain=${process.env.REACT_APP_FRONTEND_DOMAIN};`;
    dispatch(logout());
  };

  return (
    <Layout className="layout" style={{ minHeight: '100vh' }}>
      <Layout.Content style={{ padding: '50px' }}>
        <div className="site-layout-content" style={{ textAlign: 'center' }}>
          <h1>Welcome to the Scheduling Tool</h1>
          {user ? (
            <div>
              <p>Logged in as: {user.name} ({user.email})</p>
              <Button onClick={handleLogout}>Logout</Button>
            </div>
          ) : (
            <div>
              <p>Please log in to continue.</p>
              <GoogleLoginButton />
            </div>
          )}
        </div>
      </Layout.Content>
    </Layout>
  );
};

export default HomePage;
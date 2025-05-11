import React, { useEffect, useState } from 'react';
import { Layout, Button, List, Typography, message, Menu } from 'antd';
import { useSelector, useDispatch } from 'react-redux';
import { logout as logoutAction } from '../store/actions/authActions';
import GoogleLoginButton from '../components/Auth/GoogleLoginButton';
import * as api from '../services/api'; // Import your API service
import CalendarEventsPage from './CalendarEventsPage';
const { Title } = Typography;

const HomePage = () => {
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();
  const [connectedAccounts, setConnectedAccounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [activeTab, setActiveTab] = useState('accounts');

  // Fetch connected Google accounts
  const fetchConnectedAccounts = async () => {
    setLoadingAccounts(true);
    try {
      const response = await api.get('/calendars/connected', { withCredentials: true });
      setConnectedAccounts(response.data);
    } catch (error) {
      message.error('Failed to fetch connected accounts');
      setConnectedAccounts([]);
    } finally {
      setLoadingAccounts(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchConnectedAccounts();
    }
    if (window.location.search.includes('status=connect_success')) {
      fetchConnectedAccounts();
      message.success('Google account connected successfully!');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    if (window.location.search.includes('status=connect_error')) {
      message.error('Failed to connect Google account.');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    // eslint-disable-next-line
  }, [user]);

  const handleConnectGoogleAccount = () => {
    window.location.href = `${process.env.REACT_APP_API_BASE_URL}calendars/connect/new`;
  };

  const handleLogout = async () => {
    try {
      const response = await api.post('/auth/logout', {}, { withCredentials: true });
      if (response.status === 200 && response.data.message === 'Logout successful') {
        dispatch(logoutAction());
        document.cookie = `google_access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${process.env.REACT_APP_FRONTEND_DOMAIN};`;
        document.cookie = `session_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${process.env.REACT_APP_FRONTEND_DOMAIN};`;
      } else {
        message.error('Logout failed');
      }
    } catch (error) {
      message.error('Error during logout');
    }
  };

  return (
    <Layout className="layout" style={{ minHeight: '100vh' }}>
      <Layout.Header>
        <div style={{ float: 'right' }}>
          {user && (
            <Button onClick={handleLogout} type="primary">
              Logout
            </Button>
          )}
        </div>
        <Menu
          theme="dark"
          mode="horizontal"
          selectedKeys={[activeTab]}
          onClick={e => setActiveTab(e.key)}
        >
          <Menu.Item key="accounts">Connected Accounts</Menu.Item>
          <Menu.Item key="events">Events</Menu.Item>
        </Menu>
      </Layout.Header>
      <Layout.Content style={{ padding: '50px' }}>
        <div className="site-layout-content" style={{ textAlign: 'center' }}>
          <Title>Welcome to the Scheduling Tool</Title>
          {user ? (
            <>
              <p>Logged in as: {user.name} ({user.email})</p>
              {activeTab === 'accounts' && (
                <>
                  <div style={{ margin: '24px 0' }}>
                    <Button type="primary" onClick={handleConnectGoogleAccount}>
                      Connect Another Google Account
                    </Button>
                  </div>
                  <Title level={4}>Connected Google Accounts</Title>
                  <List
                    bordered
                    loading={loadingAccounts}
                    dataSource={connectedAccounts}
                    renderItem={item => (
                      <>
                        <List.Item>
                          <span>
                            <b>Google Account ID:</b> {item.google_account_id}
                          </span>
                        </List.Item>
                        <List.Item>
                          <span>
                            <b>Email:</b> {item.email}
                          </span>
                        </List.Item>
                      </>
                    )}
                    locale={{ emptyText: 'No connected Google accounts.' }}
                    style={{ maxWidth: 600, margin: '0 auto' }}
                  />
                </>
              )}
              {activeTab === 'events' && (
                <>
                  <CalendarEventsPage />
                </>
              )}
            </>
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
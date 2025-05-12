import React, { useEffect, useState } from 'react';
import { Layout, Button, List, Typography, message, Menu, Spin } from 'antd';
import { useSelector, useDispatch } from 'react-redux';
import { logout as logoutAction } from '../store/actions/authActions';
import GoogleLoginButton from '../components/Auth/GoogleLoginButton';
import * as api from '../services/api';
import CalendarEventsPage from './CalendarEventsPage';
import SchedulingWindowsPage from './SchedulingWindowsPage';
import SchedulingLinksPage from './SchedulingLinksPage';
import PublicLinksPage from './PublicLinksPage';
import MeetingsPage from './MeetingsPage';
const { Title } = Typography;

const HomePage = () => {
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();
  const [connectedAccounts, setConnectedAccounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [activeTab, setActiveTab] = useState('accounts');
  const [hubspotStatus, setHubspotStatus] = useState({ loading: false, connected: false, error: null });

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

  const fetchHubspotStatus = async () => {
    setHubspotStatus({ loading: true, connected: false, error: null });
    try {
      const response = await api.get('/hubspot/connection/status', { withCredentials: true });
      setHubspotStatus({
        loading: false,
        connected: response.data.connected,
        error: null,
        details: response.data.details || null,
      });
    } catch (error) {
      setHubspotStatus({ loading: false, connected: false, error: 'Failed to check Hubspot connection' });
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
    if (user && activeTab === 'hubspot') {
      fetchHubspotStatus();
    }
    // eslint-disable-next-line
  }, [user, activeTab]);

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

  const handleConnectHubspot = () => {
    window.location.href = `${process.env.REACT_APP_API_BASE_URL}hubspot/connect/new`;
  };

  return (
    <Layout className="layout" style={{ minHeight: '100vh' }}>
      <Layout.Header>
        <div style={{ float: 'right' }}>
          {user ? (
            <Button onClick={handleLogout} type="primary">
              Logout
            </Button>
          ) : (
            <GoogleLoginButton />
          )}
        </div>
        <Menu
          theme="dark"
          mode="horizontal"
          selectedKeys={[activeTab]}
          onClick={e => setActiveTab(e.key)}
        >
          {user ? (
            <>
              <Menu.Item key="accounts">Connected Accounts</Menu.Item>
              <Menu.Item key="events">Events</Menu.Item>
              <Menu.Item key="hubspot">Hubspot</Menu.Item>
              <Menu.Item key="scheduling">Scheduling Windows</Menu.Item>
              <Menu.Item key="links">Scheduling Links</Menu.Item>
              <Menu.Item key="meetings">Meetings</Menu.Item>
            </>
          ) : (
            <Menu.Item key="public-links">Advisors Scheduling Links</Menu.Item>
          )}
        </Menu>
      </Layout.Header>
      <Layout.Content style={{ padding: '50px' }}>
        <div className="site-layout-content" style={{ textAlign: 'center' }}>
          <Title>Welcome to the Advisor Scheduling Tool</Title>
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
              {activeTab === 'hubspot' && (
                <div>
                  <Title level={4}>Hubspot Connection</Title>
                  {hubspotStatus.loading ? (
                    <Spin />
                  ) : hubspotStatus.error ? (
                    <div style={{ color: 'red' }}>{hubspotStatus.error}</div>
                  ) : hubspotStatus.connected ? (
                    <>
                      <div style={{ color: 'green', margin: '24px 0' }}>
                        Hubspot Connected!
                      </div>
                      <Button danger onClick={async () => {
                        try {
                          const response = await api.post('/hubspot/disconnect', {}, { withCredentials: true });
                          if (response.data.success) {
                            message.success('Hubspot disconnected');
                            setHubspotStatus({ loading: false, connected: false, error: null });
                          } else {
                            message.error('Failed to disconnect Hubspot');
                          }
                        } catch (e) {
                          message.error('Error disconnecting Hubspot');
                        }
                      }}>
                        Disconnect Hubspot
                      </Button>
                    </>
                  ) : (
                    <Button type="primary" onClick={handleConnectHubspot}>
                      Connect Hubspot
                    </Button>
                  )}
                </div>
              )}
              {activeTab === 'scheduling' && (
                <SchedulingWindowsPage />
              )}
              {activeTab === 'links' && (
                <SchedulingLinksPage />
              )}
              {activeTab === 'meetings' && (
                <MeetingsPage />
              )}
            </>
          ) : (
            <PublicLinksPage />
          )}
        </div>
      </Layout.Content>
    </Layout>
  );
};

export default HomePage;
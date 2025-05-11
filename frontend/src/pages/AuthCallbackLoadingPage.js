import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loginSuccess, loginFailure } from '../store/actions/authActions';
import * as api from '../services/api';
import { Spin, Result, message } from 'antd';

const AuthCallbackLoadingPage = () => {
  const [searchParams] = useSearchParams();
  const accessToken = searchParams.get('accessToken');
  const userId = searchParams.get('userId');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    if (accessToken && userId && !hasFetched) {
      setHasFetched(true);
      document.cookie = `google_access_token=${accessToken}; path=/; max-age=3600; domain=${process.env.REACT_APP_FRONTEND_DOMAIN};`;
      const fetchUserDetails = async () => {
        try {
          const response = await api.get('/auth/me', {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
            withCredentials: true,
          });
          dispatch(loginSuccess(response.data.user));
          navigate('/home');
        } catch (err) {
          console.error('Error fetching user details:', err);
        //   dispatch(loginFailure(err.response ? err.response.data : 'Failed to fetch user details.'));
          message.error('Failed to fetch user details. Please try again.');
        }
      };
      fetchUserDetails();
    } else if (error) {
      console.error('Google login error:', error, errorDescription);
      dispatch(loginFailure(errorDescription || 'Google authentication failed.'));
      message.error('Google authentication failed.');
      navigate('/login');
    }
  }, [accessToken, userId, dispatch, navigate, searchParams, hasFetched, error, errorDescription]);

  if (accessToken && userId) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" tip="Fetching user details..." />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Result
          status="error"
          title="Google Authentication Failed"
          subTitle={errorDescription || 'Something went wrong during Google login.'}
        />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <Spin size="large" tip="Processing Google authentication..." />
    </div>
  );
};

export default AuthCallbackLoadingPage;
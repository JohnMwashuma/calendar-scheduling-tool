import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loginFailure } from '../../store/actions/authActions';
import { Result, Spin, message } from 'antd';

const AuthCallbackHandler = () => {
  const [searchParams] = useSearchParams();
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    if (code) {
      // Redirect to the loading page to fetch user details
      navigate('/auth/callback-loading');
    } else if (error) {
      console.error('Google login error:', error, errorDescription);
      dispatch(loginFailure(errorDescription || 'Google authentication failed.'));
      message.error(errorDescription || 'Google authentication failed.');
    }
  }, [code, error, errorDescription, dispatch, navigate]);

  if (code) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" tip="Processing authentication..." />
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

export default AuthCallbackHandler;
import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loginWithGoogle } from '../../store/thunks/authThunks';
import { Result, Spin, message } from 'antd';

const AuthCallbackHandler = () => {
  const [searchParams] = useSearchParams();
  const code = searchParams.get('code');
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    if (code) {
      dispatch(loginWithGoogle(code))
        .then(() => {
          navigate('/home');
        })
        .catch((error) => {
          console.error('Google login callback error:', error);
          message.error('Google login failed');
        });
    } else if (searchParams.get('error')) {
      console.error('Google login error:', searchParams.get('error'));
      message.error('Google login failed');
    }
  }, [code, dispatch, navigate, searchParams]);

  if (code) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" tip="Authenticating with Google..." />
      </div>
    );
  }

  if (searchParams.get('error')) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Result
          status="error"
          title="Google Authentication Failed"
          subTitle={searchParams.get('error_description') || 'Something went wrong during Google login.'}
        />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <p>Processing Google authentication...</p>
    </div>
  );
};

export default AuthCallbackHandler;
import { loginRequest, loginSuccess, loginFailure } from '../actions/authActions';
import * as api from '../../services/api';

export const loginWithGoogle = (code) => async (dispatch) => {
  dispatch(loginRequest());
  try {
    const response = await api.post('/auth/google/callback', { code });
    dispatch(loginSuccess(response.data.user));
  } catch (error) {
    dispatch(loginFailure(error.response ? error.response.data : 'Login failed'));
  }
};
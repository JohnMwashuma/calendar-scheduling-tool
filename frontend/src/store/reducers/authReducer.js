// frontend/src/store/reducers/authReducer.js
import { LOGIN_REQUEST, LOGIN_SUCCESS, LOGIN_FAILURE, LOGOUT } from '../actions/authActions';

const initialState = {
  isLoggedIn: false,
  user: null,
  loggingIn: false,
  error: null,
};

const authReducer = (state = initialState, action) => {
  switch (action.type) {
    case LOGIN_REQUEST:
      return {
        ...state,
        loggingIn: true,
        error: null,
      };
    case LOGIN_SUCCESS:
      return {
        ...state,
        isLoggedIn: true,
        user: action.payload,
        loggingIn: false,
        error: null,
      };
    case LOGIN_FAILURE:
      return {
        ...state,
        isLoggedIn: false,
        user: null,
        loggingIn: false,
        error: action.payload,
      };
    case LOGOUT:
      return initialState;
    default:
      return state;
  }
};

export default authReducer;
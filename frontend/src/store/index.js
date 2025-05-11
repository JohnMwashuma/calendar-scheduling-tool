// frontend/src/store/index.js
import { configureStore, combineReducers } from '@reduxjs/toolkit';
import authReducer from './reducers/authReducer';

const rootReducer = combineReducers({
  auth: authReducer,
  // Add other reducers here as your application grows
});

const store = configureStore({
  reducer: rootReducer,
});

export default store;
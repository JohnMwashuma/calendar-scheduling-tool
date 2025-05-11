import React from 'react';
import AppRouter from './routes/AppRouter';
import { Provider } from 'react-redux';
import store from './store';
import 'antd/dist/reset.css'; 

const App = () => {
  return (
    <Provider store={store}>
      <AppRouter />
    </Provider>
  );
};

export default App;
import axios from 'axios';

const instance = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL,
});

// Helper to get a cookie value by name
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}

// Add a request interceptor to always set X-Session-Token if present
instance.interceptors.request.use(
  (config) => {
    const sessionToken = getCookie('session_token');
    if (sessionToken) {
      config.headers['X-Session-Token'] = sessionToken;
    }
    const googleAccessToken = getCookie('google_access_token');
    if (googleAccessToken) {
      config.headers['X-Google-Access-Token'] = googleAccessToken;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const post = async (url, data, config = {}) => {
  try {
    const response = await instance.post(url, data, {
      withCredentials: true,
      ...config,
    });
    return response;
  } catch (error) {
    throw error;
  }
};

const get = async (url, config = {}) => {
  try {
    const response = await instance.get(url, config);
    return response;
  } catch (error) {
    throw error;
  }
};

const put = async (url, data) => {
  try {
    const response = await instance.put(url, data, {
      withCredentials: true,
    });
    return response;
  } catch (error) {
    throw error;
  }
};

const del = async (url) => {
  try {
    const response = await instance.delete(url, {
      withCredentials: true,
    });
    return response;
  } catch (error) {
    throw error;
  }
};

export { post, get, put, del };
import axios from 'axios';

const instance = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL,
});

const post = async (url, data) => {
  try {
    const response = await instance.post(url, data, {
      withCredentials: true,
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
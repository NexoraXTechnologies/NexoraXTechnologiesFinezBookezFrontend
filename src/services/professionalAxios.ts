// src/services/professionalAxios.js
import axios from "axios";
import { toast } from 'react-toastify';

const LOCAL_URL = 'https://api.e-taxsolutions.in/SandBox';
const PROD_URL = 'https://api.e-taxsolutions.in';

const BASE_URL = import.meta.env.MODE === 'development' ? LOCAL_URL : PROD_URL;
const professionalAxios = axios.create({
  baseURL: BASE_URL,
  timeout: 0,
  headers: { "Content-Type": "application/json" },
});


// REQUEST interceptor (already you have)
professionalAxios.interceptors.request.use(
  (config) => {
    try {
      const storedHeaders = JSON.parse(localStorage.getItem("professionalHeaders"));
      if (storedHeaders && typeof storedHeaders === "object") {
        config.headers = { ...config.headers, ...storedHeaders };
      }
    } catch (error) {
      console.warn("[professionalAxios] Failed to parse professionalHeaders:", error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// RESPONSE interceptor
professionalAxios.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const errorCode = error.response?.data?.errorCode || error.response?.data?.code;
    const requestUrl = error.config?.url || '';

    const isGmailApi = requestUrl.includes('/gmailExtract/');

    // Gmail-specific unauthorized -> do NOT logout user
    if (isGmailApi && status === 401) {
      return Promise.reject(error);
    }

    // Real app auth/session expired
    if (status === 401 || status === 403) {
      console.warn('⚠️ Professional auth failed — clearing professional session.');

      localStorage.removeItem('professionalHeaders');
      localStorage.removeItem('professionalUser');

      toast.error('Session expired. Please login again.');

      setTimeout(() => {
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }, 1500);
    } else if (status === 500) {
      console.error('[professionalAxios] Server error — please try again later.');
    }

    return Promise.reject(error);
  }
);

export default professionalAxios;
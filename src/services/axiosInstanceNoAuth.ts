// src/services/axiosInstanceNoAuth.js
import axios from 'axios';

const axiosInstanceNoAuth = axios.create({
  baseURL: 'https://api.e-taxsolutions.in',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default axiosInstanceNoAuth;

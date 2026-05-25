import axios from "axios";
import { toast } from "react-toastify";

const LOCAL_URL = 'https://api.e-taxsolutions.in/SandBox';
const PROD_URL = 'https://api.e-taxsolutions.in';

const BASE_URL = import.meta.env.MODE === 'development' ? LOCAL_URL : PROD_URL;

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
    "x-db-name": "NexoraX-RegisteredUsers",
  },
});

axiosInstance.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.authtoken = token;
      }
    } catch (err) {
      console.error("Error retrieving token from localStorage:", err);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    if (status === 401 || status === 403) {
      console.warn("⚠️ Auth failed — clearing token.");

      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("profile");
      toast.error("Your Token has Expired Or Unauthorized")
      setTimeout(() => {
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }, 2000); // 1.5 sec delay for smooth UX
    } else if (status === 500) {
      console.error("Server error — please try again later.");
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;

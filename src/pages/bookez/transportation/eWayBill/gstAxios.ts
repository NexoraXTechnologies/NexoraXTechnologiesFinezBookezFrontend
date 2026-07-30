import axios from "axios";

const gstAxios = axios.create({
    baseURL: "https://gstsandbox.charteredinfo.com/ewaybillapi/dec/v1.03",
    timeout: 30000,
    headers: {
        "Content-Type": "application/json",
    },
});

gstAxios.interceptors.response.use(
    response => response,
    error => {
        console.log("GST API Error:", error?.response?.data || error.message);
        return Promise.reject(error);
    }
);

export default gstAxios;
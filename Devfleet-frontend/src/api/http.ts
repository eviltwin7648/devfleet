import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL; // Update this to match your backend URL

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // This ensures cookies are sent with every request
  timeout: 10000, // 10 second timeout
});

// Add request interceptor to debug cookies
api.interceptors.request.use(
  (config) => {
    console.log("🔍 API Request:", {
      url: config.url,
      method: config.method,
      withCredentials: config.withCredentials,
      cookies: document.cookie,
      headers: config.headers,
    });
    return config;
  },
  (error) => {
    console.error("❌ Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Add response interceptor to debug responses
api.interceptors.response.use(
  (response) => {
    console.log("✅ API Response:", {
      url: response.config.url,
      status: response.status,
      data: response.data,
    });
    return response;
  },
  (error) => {
    console.error("❌ API Error:", {
      url: error.config?.url,
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
    });
    return Promise.reject(error);
  }
);

// Utility function to debug cookies
export const debugCookies = () => {
  const cookies = document.cookie
    .split(";")
    .reduce((acc: Record<string, string>, cookie) => {
      const [name, value] = cookie.trim().split("=");
      if (name && value) {
        acc[name] = value;
      }
      return acc;
    }, {});

  console.log("🍪 Current cookies:", cookies);
  console.log("🍪 Raw cookie string:", document.cookie);
  return cookies;
};

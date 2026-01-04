import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// For Android Emulator, use 10.0.2.2 to access localhost
// For iOS Simulator, use localhost
// For physical devices, use your computer's local IP
const getBaseURL = () => {
  if (__DEV__) {
    if (Platform.OS === 'android') {
      return process.env.EXPO_PUBLIC_API_URL_ANDROID || 'http://10.0.2.2:3000'; // Android emulator
    }
    // For iOS simulator or physical device testing on same network
    return process.env.EXPO_PUBLIC_API_URL_IOS || 'http://localhost:3000';
  }
  // Production URL - for physical devices
  return process.env.EXPO_PUBLIC_API_URL_PHYSICAL || 'https://your-production-api.com';
};

const baseURL = getBaseURL();
console.log(`[API] Using base URL: ${baseURL} (Platform: ${Platform.OS})`);

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

export const saveToken = async (token: string) => {
  try {
    await AsyncStorage.setItem('authToken', token);
  } catch (error) {
    console.error('Error saving token:', error);
  }
};

export const getToken = async () => {
  try {
    return await AsyncStorage.getItem('authToken');
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

export const clearToken = async () => {
  try {
    await AsyncStorage.removeItem('authToken');
  } catch (error) {
    console.error('Error clearing token:', error);
  }
};

api.interceptors.request.use(
  async (config) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url} - Status: ${response.status}`);
    return response;
  },
  (error) => {
    if (error.response) {
      console.error(`[API Error] ${error.response.status} - ${error.response.data?.message || error.message}`);
    } else if (error.request) {
      console.error('[API Error] No response received - Check if backend is running and accessible');
      console.error('[API Error] Request URL:', error.config?.url);
    } else {
      console.error('[API Error]', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;

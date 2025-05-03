import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { backendUrl } from '../utils/constants';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const decodePayload = (token) => {
    try {
      const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const json = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(json);
    } catch {
      return {};
    }
  };


  const loginWithTokenResponse = useCallback((tokens) => {
    const { accessToken, refreshToken } = tokens;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    const claims = decodePayload(accessToken);
    setUser({
      id: claims.sub,
      email: claims.email,
      firstName: claims.firstName,
      lastName: claims.lastName,
      isTrainer: claims.isTrainer,
    });
  }, []);


  const handleAuthError = useCallback((err, email) => {
    const status = err.response?.data?.statusCode;
    const message = err.response?.data?.message || err.response?.data?.error?.message;
    if (status === 400) {
      return { success: false, message, statusCode: 400 };
    }
    if (status === 401) {
      if (message.startsWith('Email not verified')||message.startsWith('Social email not verified')) {
        toast.error('Please verify your email', { duration: 2000 });
        setTimeout(() => {
          navigate('/verify-email', { state: { email } });
        }, 2000);
      }else {
        toast.error(message || 'Invalid credentials');
      }
      return { success: false, message };
    }
    if (status === 403) {
      navigate('/error', { state: { message: message || 'Access denied.' } });
      return { success: false, message, statusCode: 403 };
    }

    toast.error(message || 'An unexpected error occurred');
    return { success: false, message };
  }, [navigate]);

  
  const login = useCallback(
    async (email, password) => {
      try {
        const { data } = await axios.post(`${backendUrl}/auth/login`, { email, password });
        if (!data.success) {
          toast.error(data.message || 'Login failed');
          return { success: false, message: data.message };
        }
        loginWithTokenResponse(data.data);
        return { success: true };
      } catch (err) {
        return handleAuthError(err, email);
      }
    },
    [loginWithTokenResponse, handleAuthError]
  );

 
  const socialLogin = useCallback(
    async (provider, token) => {
      try {
        const { data } = await axios.post(`${backendUrl}/auth/social-login`, { provider, token });
        if (!data.success) {
          toast.error(data.message || 'Social login failed');
          return { success: false, message: data.message };
        }
        loginWithTokenResponse(data.data);
        return { success: true };
      } catch (err) {
        return handleAuthError(err,err.response?.data?.message.split(',')[1]);
      }
    },
    [loginWithTokenResponse, handleAuthError]
  );


  const logout = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await axios.post(
          `${backendUrl}/auth/logout`,
          { refreshToken },
          { headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` } }
        );
      }
    } catch {}
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    navigate('/login');
  }, [navigate]);


  useEffect(() => {
    const at = localStorage.getItem('accessToken');
    const rt = localStorage.getItem('refreshToken');
    if (at && rt) {
      const claims = decodePayload(at);
      if (claims.sub) {
        setUser({
          id: claims.sub,
          email: claims.email,
          isTrainer: claims.isTrainer,
          firstName: claims.firstName,
          lastName: claims.lastName,
        });
      }
    }
    setLoading(false);
  }, []);


  useEffect(() => {
    const reqId = axios.interceptors.request.use((config) => {
      const token = localStorage.getItem('accessToken');
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });

    const resId = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const original = error.config;
        if (
          error.response?.status === 401 &&
          !original._retry &&
          !original.url.includes('/auth/login') &&
          !original.url.includes('/auth/refresh')&&
          !original.url.includes('/auth/social-login')
        ) {
          original._retry = true;
          try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (!refreshToken) throw new Error('No refresh token');
            const { data } = await axios.post(
              `${backendUrl}/auth/refresh`,
              { refreshToken }
            );
            loginWithTokenResponse(data.data);
            original.headers.Authorization = `Bearer ${data.data.accessToken}`;
            return axios(original);
          } catch(err){
            toast.error('Session expired, please log in again');
            logout();
            return Promise.reject(error);
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(reqId);
      axios.interceptors.response.eject(resId);
    };
  }, [loginWithTokenResponse, logout]);

  if (loading) {
    return <Box sx={{ textAlign: 'center', mt: 4 }}>Loading session...</Box>;
  }

  return (
    <AuthContext.Provider
      value={{ user, login, logout, socialLogin }}
    >
      {children}
    </AuthContext.Provider>
  );
};

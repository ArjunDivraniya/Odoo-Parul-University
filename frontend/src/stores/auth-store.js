"use client";

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001') + '/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState(null);

  // Restore session on mount — verify token and fetch user profile
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
      // Verify token by fetching user profile
      axios.get(`${API_URL}/me`, {
        headers: { Authorization: `Bearer ${storedToken}` }
      })
        .then((res) => {
          setUser(res.data.user);
        })
        .catch(() => {
          // Token is invalid/expired — clear it
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        })
        .finally(() => {
          setIsInitializing(false);
        });
    } else {
      setIsInitializing(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.post(`${API_URL}/login`, { email, password });
      const { token: newToken, user: newUser } = response.data;
      
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(newUser);
      setIsLoading(false);
      return newUser;
    } catch (err) {
      setIsLoading(false);
      const errorMsg = err.response?.data?.error;
      if (typeof errorMsg === 'string') {
        setError(errorMsg);
      } else if (Array.isArray(errorMsg)) {
        setError(errorMsg.map((e) => e.message).join(', '));
      } else {
        setError("Login failed");
      }
      return null;
    }
  }, []);

  const signup = useCallback(async (data) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.post(`${API_URL}/register`, {
        shopName: data.shopName,
        email: data.email,
        password: data.password,
        name: `${data.firstName} ${data.lastName}`.trim(),
      });
      const { token: newToken, user: newUser } = response.data;
      
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(newUser);
      setIsLoading(false);
      return true;
    } catch (err) {
      setIsLoading(false);
      const errorMsg = err.response?.data?.error;
      if (typeof errorMsg === 'string') {
        setError(errorMsg);
      } else if (Array.isArray(errorMsg)) {
        setError(errorMsg.map((e) => e.message).join(', '));
      } else {
        setError("Signup failed");
      }
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, isInitializing, error, login, signup, logout, setError }}>
      {children}
    </AuthContext.Provider>
  );
};

// Export hook with SAME name as previous Zustand store to minimize changes
export const useAuthStore = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthStore must be used within an AuthProvider');
  }
  return context;
};

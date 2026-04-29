import { useState, useEffect } from 'react';

interface User {
  name: string;
  phone: string;
  loginTime: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem('metroUser');
    const authToken = localStorage.getItem('metroAuthToken');
    
    if (userData) {
      try {
        setUser(JSON.parse(userData));
        setToken(authToken);
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('metroUser');
        localStorage.removeItem('metroAuthToken');
      }
    }
    setLoading(false);
  }, []);

  const login = (userData: User, authToken: string) => {
    localStorage.setItem('metroUser', JSON.stringify(userData));
    localStorage.setItem('metroAuthToken', authToken);
    setUser(userData);
    setToken(authToken);
  };

  const logout = () => {
    localStorage.removeItem('metroUser');
    localStorage.removeItem('metroAuthToken');
    setUser(null);
    setToken(null);
  };

  const isAuthenticated = !!user && !!token;

  return { user, token, loading, isAuthenticated, login, logout };
}

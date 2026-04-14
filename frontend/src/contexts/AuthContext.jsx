import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 menit
const HEARTBEAT_INTERVAL_MS = 20000; // 20 detik
const IDLE_EVENTS = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
const ANONYMOUS_SESSION_KEY = 'auditee_is_anonymous';
const REALTIME_CONFIG_KEY = 'sikona_realtime_config';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [passwordExpired, setPasswordExpired] = useState(false);
  const idleTimerRef = useRef(null);

  const persistRealtimeConfig = useCallback((realtime) => {
    if (!realtime || typeof realtime !== 'object') return;

    const key = typeof realtime.key === 'string' ? realtime.key.trim() : '';
    const host = typeof realtime.host === 'string' ? realtime.host.trim() : '';
    const portCandidate = Number(realtime.port);
    const port = Number.isFinite(portCandidate) && portCandidate > 0 ? portCandidate : 443;
    const scheme = realtime.scheme === 'http' ? 'http' : 'https';

    if (!key || !host) return;

    localStorage.setItem(REALTIME_CONFIG_KEY, JSON.stringify({
      key,
      host,
      port,
      scheme,
    }));
  }, []);

  // Idle timeout — auto logout after 30 min of inactivity
  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      // Only logout if user is authenticated
      const hasUser = !!localStorage.getItem('token');
      if (hasUser) {
        console.warn('[Security] Session idle timeout — auto logout');
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        setMustChangePassword(false);
        setPasswordExpired(false);
        // Redirect to login with timeout message
        window.location.href = '/login?timeout=1';
      }
    }, IDLE_TIMEOUT_MS);
  }, []);

  // Setup and cleanup idle event listeners
  useEffect(() => {
    const isAuthenticated = !!token || !!user;
    if (!isAuthenticated) {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      return;
    }

    // Start tracking
    resetIdleTimer();
    IDLE_EVENTS.forEach(evt => window.addEventListener(evt, resetIdleTimer, { passive: true }));

    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      IDLE_EVENTS.forEach(evt => window.removeEventListener(evt, resetIdleTimer));
    };
  }, [token, user, resetIdleTimer]);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      
      if (storedToken) {
        setToken(storedToken);
        
        // Verify token is still valid
        try {
          const response = await authAPI.me();
          const userData = response.data.user;
          const isAnonymous = userData?.role === 'auditee' && localStorage.getItem(ANONYMOUS_SESSION_KEY) === '1';
          setUser(userData);
          if (isAnonymous) {
            setUser({ ...userData, isAnonymous: true });
          }
          // Check password flags
          if (response.data.must_change_password) setMustChangePassword(true);
          if (response.data.password_expired) setPasswordExpired(true);
          persistRealtimeConfig(response.data.realtime);
        } catch (error) {
          // Token invalid, clear storage
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, [persistRealtimeConfig]);

  useEffect(() => {
    if (!token) return;

    const heartbeat = async () => {
      try {
        const response = await authAPI.me();
        if (response?.data?.user) {
          const userData = response.data.user;
          const isAnonymous = userData?.role === 'auditee' && localStorage.getItem(ANONYMOUS_SESSION_KEY) === '1';
          setUser(isAnonymous ? { ...userData, isAnonymous: true } : userData);
          persistRealtimeConfig(response.data.realtime);
        }
      } catch (error) {
        // 401 is handled by interceptor and will redirect to login
        console.error('Heartbeat failed:', error);
      }
    };

    const timer = setInterval(heartbeat, HEARTBEAT_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [token, persistRealtimeConfig]);

  const login = async (payload) => {
    try {
      const response = await authAPI.login(payload);
      const { user, token } = response.data;
      const isAnonymous = user?.role === 'auditee' && payload?.is_anonymous === true;
      
      localStorage.setItem('token', token);
      if (isAnonymous) {
        localStorage.setItem(ANONYMOUS_SESSION_KEY, '1');
      } else {
        localStorage.removeItem(ANONYMOUS_SESSION_KEY);
      }
      setToken(token);
      setUser(isAnonymous ? { ...user, isAnonymous: true } : user);
      setMustChangePassword(!!response.data.must_change_password);
      setPasswordExpired(!!response.data.password_expired);
      persistRealtimeConfig(response.data.realtime);
      
      return user;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await authAPI.logout();
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      localStorage.removeItem('token');
      localStorage.removeItem(ANONYMOUS_SESSION_KEY);
      localStorage.removeItem(REALTIME_CONFIG_KEY);
      setToken(null);
      setUser(null);
      setMustChangePassword(false);
      setPasswordExpired(false);
    }
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  const toggleOnlineStatus = async () => {
    try {
      const response = await authAPI.toggleOnline();
      const updatedUser = { ...user, is_online: response.data.is_online };
      updateUser(updatedUser);
      return response.data.is_online;
    } catch (error) {
      console.error('Toggle online error:', error);
      throw error;
    }
  };

  const clearPasswordFlags = () => {
    setMustChangePassword(false);
    setPasswordExpired(false);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token,
      loading, 
      isAuthenticated: !!token,
      mustChangePassword,
      passwordExpired,
      login, 
      logout,
      updateUser,
      toggleOnlineStatus,
      clearPasswordFlags,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

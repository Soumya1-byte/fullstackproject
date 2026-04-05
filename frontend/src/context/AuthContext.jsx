import { createContext, useEffect, useMemo, useState } from 'react';
import { authService } from '../services/authService';
import { clearAccessToken, setAccessToken } from '../services/apiClient';

export const AuthContext = createContext(null);
const ROLE_KEY = 'role';
const USER_KEY = 'user';

function normalizeRole(value) {
  const role = value?.toLowerCase();
  if (role === 'admin' || role === 'student') {
    return role;
  }
  return null;
}

function readJson(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || 'null');
  } catch {
    return null;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function clearSessionStorage() {
  localStorage.removeItem(ROLE_KEY);
  localStorage.removeItem(USER_KEY);
}

function normalizeUser(user) {
  if (!user) return null;
  return {
    ...user,
    _id: user._id || user.id || null,
    role: normalizeRole(user.role)
  };
}

export function AuthProvider({ children }) {
  const [role, setRole] = useState(() => normalizeRole(localStorage.getItem(ROLE_KEY)));
  const [user, setUser] = useState(() => normalizeUser(readJson(USER_KEY)));
  const [loading, setLoading] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(true);

  useEffect(() => {
    let active = true;

    const restoreSession = async () => {
      try {
        const profile = normalizeUser(await authService.me());
        if (!active || !profile) return;
        setUser(profile);
        setRole(profile.role);
        localStorage.setItem(ROLE_KEY, profile.role);
        writeJson(USER_KEY, profile);
      } catch {
        if (!active) return;
        clearAccessToken();
        clearSessionStorage();
        setUser(null);
        setRole(null);
      } finally {
        if (active) {
          setBootstrapping(false);
        }
      }
    };

    restoreSession();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (bootstrapping) return;

    if (!role) {
      clearSessionStorage();
      return;
    }
    localStorage.setItem(ROLE_KEY, role);
  }, [role, bootstrapping]);

  useEffect(() => {
    if (bootstrapping) return;

    if (user) {
      writeJson(USER_KEY, user);
    } else {
      localStorage.removeItem(USER_KEY);
    }
  }, [user, bootstrapping]);

  const login = async (payload) => {
    setLoading(true);
    try {
      const auth = await authService.login(payload);
      const normalizedUser = normalizeUser(auth?.user);
      setAccessToken(auth?.token || null);
      setRole(normalizedUser?.role || null);
      setUser(normalizedUser);
      return { user: normalizedUser };
    } catch (error) {
      throw new Error(error.response?.data?.error?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const register = async (payload) => {
    setLoading(true);
    try {
      const auth = await authService.register(payload);
      const normalizedUser = normalizeUser(auth?.user);
      setAccessToken(auth?.token || null);
      setRole(normalizedUser?.role || null);
      setUser(normalizedUser);
      return { user: normalizedUser };
    } catch (error) {
      throw new Error(error.response?.data?.error?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch {
      // Clear local session state even if the server request fails.
    }
    clearAccessToken();
    clearSessionStorage();
    setRole(null);
    setUser(null);
    window.location.assign('/');
  };

  const updateUser = (patch) => {
    const nextRole = normalizeRole(patch?.role);
    if (nextRole) {
      setRole(nextRole);
    }
    setUser((prev) => (prev ? normalizeUser({ ...prev, ...patch }) : prev));
  };

  const value = useMemo(
    () => ({ role, user, loading, bootstrapping, isAuthenticated: Boolean(role), login, register, logout, updateUser }),
    [role, user, loading, bootstrapping]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

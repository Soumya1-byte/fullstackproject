import { createContext, useEffect, useMemo, useState } from 'react';

export const AuthContext = createContext(null);
const MOCK_USERS_KEY = 'mock_users';
const DEFAULT_ADMIN = {
  name: 'Demo Admin',
  email: 'admin@demo.com',
  password: 'admin123',
  role: 'admin'
};

function normalizeRole(value) {
  const role = value?.toLowerCase();
  if (role === 'admin' || role === 'student') {
    return role;
  }
  return null;
}

function readMockUsers() {
  try {
    const parsed = JSON.parse(localStorage.getItem(MOCK_USERS_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeMockUsers(users) {
  localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users));
}

function ensureDefaultUsers() {
  const existing = readMockUsers();
  const hasAdmin = existing.some((entry) => entry?.email?.toLowerCase() === DEFAULT_ADMIN.email);
  if (hasAdmin) return existing;
  const updated = [DEFAULT_ADMIN, ...existing];
  writeMockUsers(updated);
  return updated;
}

function resolveRoleFromEmail(email) {
  return email.toLowerCase().includes('admin') ? 'admin' : 'student';
}

export function AuthProvider({ children }) {
  const [role, setRole] = useState(() => normalizeRole(localStorage.getItem('role')));
  const [user, setUser] = useState(() => {
    const savedUser = JSON.parse(localStorage.getItem('user') || 'null');
    if (!savedUser) return null;
    return { ...savedUser, role: normalizeRole(savedUser.role) || normalizeRole(localStorage.getItem('role')) };
  });
  const [loading, setLoading] = useState(false);
  const [bootstrapping] = useState(false);

  useEffect(() => {
    ensureDefaultUsers();
  }, []);

  useEffect(() => {
    if (!role) {
      setUser(null);
      localStorage.removeItem('role');
      localStorage.removeItem('user');
      return;
    }
    localStorage.setItem('role', role);
    setUser((prev) => (prev ? { ...prev, role } : prev));
  }, [role]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  const login = async (payload) => {
    setLoading(true);
    try {
      const email = payload?.email?.trim() || '';
      const password = payload?.password?.trim() || '';
      if (!email || !password) {
        throw new Error('Email and password are required.');
      }

      const users = ensureDefaultUsers();
      const existing = users.find((entry) => entry.email.toLowerCase() === email.toLowerCase());
      if (existing && existing.password !== password) {
        throw new Error('Invalid credentials.');
      }

      const selectedRole = normalizeRole(existing?.role) || resolveRoleFromEmail(email);
      const mockUser = {
        name: existing?.name || payload?.name?.trim() || (selectedRole === 'admin' ? 'Admin User' : 'Student User'),
        email,
        role: selectedRole
      };

      localStorage.setItem('role', selectedRole);
      setRole(selectedRole);
      setUser(mockUser);
      return { user: mockUser };
    } finally {
      setLoading(false);
    }
  };

  const register = async (payload) => {
    setLoading(true);
    try {
      const name = payload?.name?.trim() || 'New User';
      const email = payload?.email?.trim() || '';
      const password = payload?.password?.trim() || '';
      if (!email || !password) {
        throw new Error('Email and password are required.');
      }

      const users = ensureDefaultUsers();
      if (users.some((entry) => entry.email.toLowerCase() === email.toLowerCase())) {
        throw new Error('User already exists. Please sign in.');
      }

      const selectedRole = normalizeRole(payload?.role) || resolveRoleFromEmail(email);
      const nextUsers = [...users, { name, email, password, role: selectedRole }];
      writeMockUsers(nextUsers);

      const mockUser = { name, email, role: selectedRole };
      localStorage.setItem('role', selectedRole);
      setRole(selectedRole);
      setUser(mockUser);
      return { user: mockUser };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    localStorage.clear();
    setRole(null);
    setUser(null);
    window.location.assign('/');
  };

  const updateUser = (patch) => {
    setUser((prev) => (prev ? { ...prev, ...patch } : prev));
  };

  const value = useMemo(
    () => ({ role, user, loading, bootstrapping, isAuthenticated: Boolean(role), login, register, logout, updateUser }),
    [role, user, loading, bootstrapping]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

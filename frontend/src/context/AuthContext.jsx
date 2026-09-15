import { createContext, useContext, useState, useCallback } from 'react';
import { setAuthToken } from '../api/client';
import * as authApi from '../api/auth';

const AuthContext = createContext(null);

const STORAGE_KEY = 'campusync_session';

// Reads localStorage AND attaches the token to axios synchronously, both inside the
// same call. This matters: it runs inside useState's lazy initializer below, during
// the render phase - before any effect fires, including a child component's (e.g.
// NotificationBell's useQuery firing on mount). Attaching the token from a useEffect
// here instead would run too late: child effects fire before parent effects on
// initial mount, so a query could already be in flight, unauthenticated, by the time
// this provider's own effect got around to setting the header. Caught exactly this
// way live - see README.
const readStoredSession = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (parsed?.token) setAuthToken(parsed.token);
    return parsed;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(() => readStoredSession());

  const persist = useCallback((next) => {
    setSession(next);
    if (next) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setAuthToken(next.token);
    } else {
      localStorage.removeItem(STORAGE_KEY);
      setAuthToken(null);
    }
  }, []);

  const studentLogin = useCallback(
    async (collegeId, password) => {
      const { token, user } = await authApi.studentLogin(collegeId, password);
      persist({ token, user });
    },
    [persist]
  );

  const facultyLogin = useCallback(
    async (email, password) => {
      const { token, user } = await authApi.facultyLogin(email, password);
      persist({ token, user });
    },
    [persist]
  );

  const adminLogin = useCallback(
    async (email, password) => {
      const { token, user } = await authApi.adminLogin(email, password);
      persist({ token, user });
    },
    [persist]
  );

  const updateStoredUser = useCallback(
    (partialUser) => {
      if (!session) return;
      persist({ ...session, user: { ...session.user, ...partialUser } });
    },
    [session, persist]
  );

  const updateStudentAccount = useCallback(
    async (updates) => {
      const user = await authApi.updateStudentMe(updates);
      updateStoredUser(user);
    },
    [updateStoredUser]
  );

  const logout = useCallback(() => {
    persist(null);
  }, [persist]);

  const value = {
    token: session?.token ?? null,
    user: session?.user ?? null,
    role: session?.user?.role ?? null,
    isAuthenticated: !!session?.token,
    studentLogin,
    facultyLogin,
    adminLogin,
    updateStoredUser,
    updateStudentAccount,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

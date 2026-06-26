import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  clearSession,
  fetchMe,
  getStoredUser,
  getToken,
  loginUser,
  registerUser,
  saveSession
} from "../utils/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser());
  const [token, setToken] = useState(getToken());
  const [loading, setLoading] = useState(Boolean(getToken()));

  useEffect(() => {
    const storedToken = getToken();
    if (!storedToken) {
      setLoading(false);
      return;
    }

    fetchMe()
      .then(({ user: profile }) => {
        setUser(profile);
        setToken(storedToken);
        saveSession(storedToken, profile);
      })
      .catch(() => {
        clearSession();
        setUser(null);
        setToken(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: Boolean(token),
      async login(email, password) {
        const data = await loginUser({ email, password });
        saveSession(data.token, data.user);
        setToken(data.token);
        setUser(data.user);
        return data.user;
      },
      async register(fullName, email, password, phone) {
        const data = await registerUser({ fullName, email, password, phone });
        saveSession(data.token, data.user);
        setToken(data.token);
        setUser(data.user);
        return data.user;
      },
      logout() {
        clearSession();
        setUser(null);
        setToken(null);
      }
    }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

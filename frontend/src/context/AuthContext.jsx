import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../utils/api";

const AuthContext = createContext();
const TOKEN_KEY = "cinema_token";
const USER_KEY = "cinema_user";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || "");
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  });

  async function login(email, password) {
    const data = await api("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    return data.user;
  }

  async function register(fullName, email, password, mobileNumber) {
    const data = await api("/auth/register", {
      method: "POST",
      body: JSON.stringify({ fullName, email, password, mobileNumber })
    });
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    return data.user;
  }

  function logout() {
    setToken("");
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  useEffect(() => {
    if (!token || user) return;
    api("/auth/me")
      .then((data) => {
        setUser(data.user);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      })
      .catch(() => {
        logout();
      });
  }, [token, user]);

  const value = useMemo(
    () => ({
      token,
      user,
      isLoggedIn: Boolean(token),
      isAdmin: user?.role === "admin",
      login,
      register,
      logout
    }),
    [token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

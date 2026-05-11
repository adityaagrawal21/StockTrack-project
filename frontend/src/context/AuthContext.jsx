import { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../utils/api";
import { errMsg } from "../utils/helpers";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("stocktrack_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  // Persist user
  useEffect(() => {
    if (user) localStorage.setItem("stocktrack_user", JSON.stringify(user));
    else localStorage.removeItem("stocktrack_user");
  }, [user]);

  const login = async (username, password) => {
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { username, password });
      localStorage.setItem("stocktrack_token", data.token);
      setUser(data.user);
      return { success: true };
    } catch (error) {
      return { success: false, message: errMsg(error) };
    } finally {
      setLoading(false);
    }
  };

  const logout = useCallback(() => {
    localStorage.removeItem("stocktrack_token");
    localStorage.removeItem("stocktrack_user");
    setUser(null);
  }, []);

  const updateUser = (updated) => setUser((prev) => ({ ...prev, ...updated }));

  const isAdmin = user?.role === "admin";
  const isManager = user?.role === "manager";
  const isStaff = user?.role === "staff";
  const canViewReports = isAdmin || isManager;
  const canManageProducts = isAdmin;
  const canManageUsers = isAdmin;
  const canViewSuppliers = isAdmin;

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser, isAdmin, isManager, isStaff, canViewReports, canManageProducts, canManageUsers, canViewSuppliers }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
};

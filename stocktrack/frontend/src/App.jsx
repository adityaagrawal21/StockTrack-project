import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import Suppliers from "./pages/Suppliers";
import Users from "./pages/Users";
import Purchases from "./pages/Purchases";
import Sales from "./pages/Sales";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";

export default function App() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" replace />} />
      <Route path="/register" element={!user ? <Register /> : <Navigate to="/" replace />} />
      <Route path="/forgot-password" element={!user ? <ForgotPassword /> : <Navigate to="/" replace />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={user?.role==="staff" ? <Navigate to="/inventory" replace /> : <Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<ProtectedRoute allowedRoles={["admin","manager"]}><Dashboard /></ProtectedRoute>} />
          <Route path="/inventory"  element={<Inventory />} />
          <Route path="/suppliers"  element={<ProtectedRoute allowedRoles={["admin"]}><Suppliers /></ProtectedRoute>} />
          <Route path="/users"      element={<ProtectedRoute allowedRoles={["admin"]}><Users /></ProtectedRoute>} />
          <Route path="/purchases"  element={<Purchases />} />
          <Route path="/sales"      element={<Sales />} />
          <Route path="/reports"    element={<ProtectedRoute allowedRoles={["admin","manager"]}><Reports /></ProtectedRoute>} />
          <Route path="/settings"   element={<Settings />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

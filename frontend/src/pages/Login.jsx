import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function Login() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState("");

  const F = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const submit = async () => {
    setErr("");
    if (!form.username || !form.password) { setErr("Please fill in all fields."); return; }
    const res = await login(form.username, form.password);
    if (res.success) {
      toast.success("Welcome back!");
      navigate("/");
    } else {
      setErr(res.message);
    }
  };

  return (
    <div className="login-bg">
      {/* Decorative blobs */}
      <div style={{ position: "absolute", top: "10%", right: "8%", width: 200, height: 200, borderRadius: "50%", background: "rgba(99,102,241,.05)", border: "1px solid rgba(99,102,241,.1)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "15%", left: "6%", width: 140, height: 140, borderRadius: "50%", background: "rgba(245,158,11,.05)", border: "1px solid rgba(245,158,11,.1)", pointerEvents: "none" }} />

      <div className="login-card animate-fadeUp">
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
          <div style={{ width: 46, height: 46, background: "linear-gradient(135deg,#6366f1,#818cf8)", borderRadius: 13, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, boxShadow: "0 6px 18px rgba(99,102,241,.35)" }}>📦</div>
          <div>
            <p style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 800, fontSize: 20, color: "#111827" }}>Stock<span style={{ color: "#6366f1" }}>Track</span></p>
            <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>Inventory Management Platform</p>
          </div>
        </div>

        <h2 style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 800, fontSize: 24, color: "#111827", marginBottom: 4 }}>Welcome back</h2>
        <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 26 }}>Sign in to your workspace</p>

        {/* Username */}
        <div style={{ marginBottom: 14 }}>
          <label className="field-label">Username</label>
          <div className="inp-icon">
            <span className="icon">👤</span>
            <input className="inp" type="text" placeholder="Enter your username" value={form.username} onChange={F("username")} onKeyDown={(e) => e.key === "Enter" && submit()} />
          </div>
        </div>

        {/* Password */}
        <div style={{ marginBottom: 8 }}>
          <label className="field-label">Password</label>
          <div style={{ position: "relative" }}>
            <div className="inp-icon">
              <span className="icon">🔒</span>
              <input className="inp" type={showPw ? "text" : "password"} placeholder="Enter your password" value={form.password} onChange={F("password")} onKeyDown={(e) => e.key === "Enter" && submit()} style={{ paddingRight: 42 }} />
            </div>
            <button onClick={() => setShowPw(!showPw)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 15, color: "#9ca3af" }}>
              {showPw ? "🙈" : "👁"}
            </button>
          </div>
        </div>

        <div style={{ textAlign: "right", marginBottom: 22 }}>
          <Link to="/forgot-password" style={{ color: "#6366f1", fontSize: 12.5, fontWeight: 600, textDecoration: "none" }}>Forgot password?</Link>
        </div>

        {err && <div className="alert-error" style={{ marginBottom: 14 }}>{err}</div>}

        <button className="btn btn-primary" onClick={submit} disabled={loading} style={{ width: "100%", padding: "13px", fontSize: 14.5, borderRadius: 11 }}>
          {loading ? "Signing in…" : "Sign in →"}
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "18px 0" }}>
          <div style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
          <span style={{ fontSize: 12, color: "#9ca3af" }}>or</span>
          <div style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
        </div>

        <Link to="/register">
          <button className="btn btn-ghost" style={{ width: "100%", padding: "12px", fontSize: 13.5, justifyContent: "center" }}>Create new account</button>
        </Link>
      </div>
    </div>
  );
}

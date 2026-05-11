import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../utils/api";
import { errMsg } from "../utils/helpers";
import toast from "react-hot-toast";

export default function Register() {
  const [form, setForm] = useState({ name: "", username: "", email: "", password: "", cpass: "", role: "staff" });
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const navigate = useNavigate();

  const F = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const submit = async () => {
    setErr("");
    if (!form.name || !form.username || !form.email || !form.password) { setErr("All fields are required."); return; }
    if (form.password.length < 6) { setErr("Password must be at least 6 characters."); return; }
    if (form.password !== form.cpass) { setErr("Passwords do not match."); return; }
    if (!/^[a-z0-9_]+$/.test(form.username)) { setErr("Username: lowercase letters, numbers, underscores only."); return; }
    setLoading(true);
    try {
      await api.post("/auth/register", { name: form.name, username: form.username, email: form.email, password: form.password, role: form.role });
      setDone(true);
    } catch (e) {
      setErr(errMsg(e));
    } finally {
      setLoading(false);
    }
  };

  if (done) return (
    <div className="login-bg">
      <div className="login-card animate-fadeUp" style={{ textAlign: "center" }}>
        <div style={{ width: 72, height: 72, background: "linear-gradient(135deg,#6366f1,#818cf8)", borderRadius: 20, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34, margin: "0 auto 18px", boxShadow: "0 8px 24px rgba(99,102,241,.35)" }}>🎉</div>
        <h2 style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 800, fontSize: 22, marginBottom: 10 }}>Request Submitted!</h2>
        <div style={{ background: "linear-gradient(135deg,#f8f9ff,#fefce8)", border: "1px solid #e5e7eb", borderRadius: 12, padding: "14px 16px", marginBottom: 20, textAlign: "left" }}>
          <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 5 }}>Registered as</p>
          <p style={{ fontWeight: 700, fontSize: 15 }}>{form.name}</p>
          <p style={{ fontSize: 12, color: "#6b7280", marginTop: 3 }}>@{form.username} · <span style={{ color: form.role === "manager" ? "#d97706" : "#059669" }}>{form.role}</span></p>
        </div>
        <p style={{ color: "#6b7280", fontSize: 13, lineHeight: 1.7, marginBottom: 22 }}>Your account is <strong style={{ color: "#d97706" }}>pending admin approval</strong>. You'll gain access once an administrator reviews your request.</p>
        <Link to="/login"><button className="btn btn-primary" style={{ width: "100%", padding: "12px" }}>Back to Login</button></Link>
      </div>
    </div>
  );

  return (
    <div className="login-bg">
      <div className="login-card animate-fadeUp" style={{ maxWidth: 480 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <div style={{ width: 42, height: 42, background: "linear-gradient(135deg,#6366f1,#818cf8)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>📦</div>
          <p style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 800, fontSize: 18 }}>Stock<span style={{ color: "#6366f1" }}>Track</span></p>
        </div>
        <h2 style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 800, fontSize: 22, marginBottom: 4 }}>Create Account</h2>
        <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 22 }}>Request access — admin must approve before you can log in</p>

        <div className="grid-2" style={{ marginBottom: 0 }}>
          <div style={{ gridColumn: "1/-1", marginBottom: 13 }}>
            <label className="field-label">Full Name</label>
            <input className="inp" placeholder="John Doe" value={form.name} onChange={F("name")} />
          </div>
          <div style={{ marginBottom: 13 }}>
            <label className="field-label">Username <span style={{ color: "#9ca3af", fontSize: 10, fontWeight: 400 }}>(unique, no spaces)</span></label>
            <input className="inp" placeholder="john_doe" value={form.username} onChange={(e) => setForm(p => ({ ...p, username: e.target.value.toLowerCase().replace(/\s/g, "_") }))} />
          </div>
          <div style={{ marginBottom: 13 }}>
            <label className="field-label">Email Address</label>
            <input className="inp" type="email" placeholder="you@company.com" value={form.email} onChange={F("email")} />
          </div>
          <div style={{ marginBottom: 13, position: "relative" }}>
            <label className="field-label">Password</label>
            <input className="inp" type={showPw ? "text" : "password"} placeholder="Min. 6 characters" value={form.password} onChange={F("password")} style={{ paddingRight: 38 }} />
            <button onClick={() => setShowPw(!showPw)} style={{ position: "absolute", right: 11, bottom: 11, background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#9ca3af" }}>{showPw ? "🙈" : "👁"}</button>
          </div>
          <div style={{ marginBottom: 13 }}>
            <label className="field-label">Confirm Password</label>
            <input className="inp" type="password" placeholder="Repeat password" value={form.cpass} onChange={F("cpass")} />
          </div>
          <div style={{ gridColumn: "1/-1", marginBottom: 6 }}>
            <label className="field-label">Register as</label>
            <div className="grid-2">
              {["staff", "manager"].map((r) => (
                <label key={r} onClick={() => setForm(p => ({ ...p, role: r }))} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", borderRadius: 10, border: `1.5px solid ${form.role === r ? "#6366f1" : "#e5e7eb"}`, background: form.role === r ? "#eef0ff" : "#f9fafb", cursor: "pointer", transition: "all .15s" }}>
                  <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${form.role === r ? "#6366f1" : "#d1d5db"}`, background: form.role === r ? "#6366f1" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {form.role === r && <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#fff" }} />}
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#111827", textTransform: "capitalize" }}>{r}</p>
                    <p style={{ fontSize: 11, color: "#6b7280" }}>{r === "staff" ? "Purchases & Sales" : "+ Reports & Inventory"}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {err && <div className="alert-error" style={{ marginTop: 14, marginBottom: 6 }}>{err}</div>}
        <button className="btn btn-primary" onClick={submit} disabled={loading} style={{ width: "100%", padding: "12px", marginTop: 16, fontSize: 14 }}>
          {loading ? "Submitting…" : "Create Account →"}
        </button>
        <p style={{ textAlign: "center", marginTop: 14, fontSize: 13, color: "#6b7280" }}>
          Already registered? <Link to="/login" style={{ color: "#6366f1", fontWeight: 600, textDecoration: "none" }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}

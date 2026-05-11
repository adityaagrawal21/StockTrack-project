import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../utils/api";
import { errMsg } from "../utils/helpers";

export default function ForgotPassword() {
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState("");
  const [otp, setOtp] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confPw, setConfPw] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const STEPS = ["Find Account", "Verify OTP", "New Password", "Done"];

  const step1 = async () => {
    setErr(""); setLoading(true);
    try {
      const { data } = await api.post("/auth/forgot-password", { username });
      setGeneratedOtp(data.otp); // demo only
      setStep(2);
    } catch (e) { setErr(errMsg(e)); }
    finally { setLoading(false); }
  };

  const step2 = async () => {
    setErr(""); setLoading(true);
    try {
      await api.post("/auth/verify-otp", { username, otp });
      setStep(3);
    } catch (e) { setErr(errMsg(e)); }
    finally { setLoading(false); }
  };

  const step3 = async () => {
    setErr("");
    if (newPw.length < 6) { setErr("Min 6 characters."); return; }
    if (newPw !== confPw) { setErr("Passwords don't match."); return; }
    setLoading(true);
    try {
      await api.post("/auth/reset-password", { username, otp, newPassword: newPw });
      setStep(4);
    } catch (e) { setErr(errMsg(e)); }
    finally { setLoading(false); }
  };

  return (
    <div className="login-bg">
      <div className="login-card animate-fadeUp" style={{ maxWidth: 420 }}>
        {/* Step indicator */}
        <div className="steps-row">
          {STEPS.map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center" }}>
              <div className="step-dot" style={{
                background: i + 1 < step ? "#6366f1" : i + 1 === step ? "#eef0ff" : "#f3f4f6",
                color: i + 1 < step ? "#fff" : i + 1 === step ? "#6366f1" : "#9ca3af",
                border: i + 1 === step ? "2px solid #6366f1" : "2px solid transparent",
              }}>
                {i + 1 < step ? "✓" : i + 1}
              </div>
              {i < STEPS.length - 1 && <div className="step-line" style={{ background: i + 1 < step ? "#6366f1" : "#e5e7eb" }} />}
            </div>
          ))}
        </div>

        {/* Step 1 */}
        {step === 1 && <>
          <h2 style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 800, fontSize: 22, marginBottom: 4 }}>Forgot Password</h2>
          <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 22 }}>Enter your username to get a recovery code</p>
          <div style={{ marginBottom: 18 }}>
            <label className="field-label">Username</label>
            <input className="inp" placeholder="your_username" value={username} onChange={(e) => setUsername(e.target.value)} onKeyDown={(e) => e.key === "Enter" && step1()} />
          </div>
          {err && <div className="alert-error" style={{ marginBottom: 14 }}>{err}</div>}
          <button className="btn btn-primary" onClick={step1} disabled={loading} style={{ width: "100%", padding: "12px" }}>
            {loading ? "Sending…" : "Send Recovery Code →"}
          </button>
        </>}

        {/* Step 2 */}
        {step === 2 && <>
          <h2 style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 800, fontSize: 22, marginBottom: 4 }}>Enter Recovery Code</h2>
          <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 18 }}>Check the code generated for your account</p>
          {/* Simulated OTP display */}
          <div style={{ background: "linear-gradient(135deg,#eef0ff,#f8f9ff)", border: "2px dashed #a5b4fc", borderRadius: 14, padding: "16px 20px", marginBottom: 20, textAlign: "center" }}>
            <p style={{ fontSize: 11, color: "#6b7280", marginBottom: 8, fontWeight: 600 }}>📧 Recovery code for <strong>@{username}</strong></p>
            <p style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 800, fontSize: 32, letterSpacing: 6, color: "#4f46e5" }}>{generatedOtp}</p>
            <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 6 }}>Simulated OTP — enter this code below</p>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label className="field-label">Enter the 6-digit code</label>
            <input className="inp" placeholder="______" value={otp} onChange={(e) => setOtp(e.target.value)} style={{ textAlign: "center", letterSpacing: 6, fontFamily: "'Manrope',sans-serif", fontWeight: 700, fontSize: 20 }} maxLength={6} />
          </div>
          {err && <div className="alert-error" style={{ marginBottom: 14 }}>{err}</div>}
          <button className="btn btn-primary" onClick={step2} disabled={loading} style={{ width: "100%", padding: "12px" }}>
            {loading ? "Verifying…" : "Verify Code →"}
          </button>
        </>}

        {/* Step 3 */}
        {step === 3 && <>
          <h2 style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 800, fontSize: 22, marginBottom: 4 }}>Set New Password</h2>
          <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 20 }}>Choose a strong, unique password</p>
          {[["New Password", newPw, setNewPw], ["Confirm Password", confPw, setConfPw]].map(([l, v, s], i) => (
            <div key={i} style={{ marginBottom: 14 }}>
              <label className="field-label">{l}</label>
              <input className="inp" type="password" placeholder="••••••••" value={v} onChange={(e) => s(e.target.value)} />
            </div>
          ))}
          {err && <div className="alert-error" style={{ marginBottom: 14 }}>{err}</div>}
          <button className="btn btn-primary" onClick={step3} disabled={loading} style={{ width: "100%", padding: "12px" }}>
            {loading ? "Resetting…" : "Reset Password"}
          </button>
        </>}

        {/* Step 4 */}
        {step === 4 && (
          <div style={{ textAlign: "center", padding: "10px 0" }}>
            <div style={{ width: 70, height: 70, background: "linear-gradient(135deg,#6366f1,#818cf8)", borderRadius: 18, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, margin: "0 auto 16px" }}>✅</div>
            <h2 style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 800, fontSize: 22, marginBottom: 10 }}>Password Updated!</h2>
            <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 24 }}>Sign in with your new password.</p>
            <Link to="/login"><button className="btn btn-primary" style={{ width: "100%", padding: "12px" }}>Back to Login</button></Link>
          </div>
        )}

        {step < 4 && (
          <p style={{ textAlign: "center", marginTop: 16, fontSize: 13 }}>
            <Link to="/login" style={{ color: "#6366f1", fontWeight: 600, textDecoration: "none" }}>← Back to Login</Link>
          </p>
        )}
      </div>
    </div>
  );
}

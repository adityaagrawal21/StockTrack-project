export default function StatCard({ label, value, sub, icon, iconBg, valueColor, alert, onClick }) {
  return (
    <div className="stat-card" onClick={onClick} style={{ cursor: onClick ? "pointer" : "default" }}>
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase", color: "#6b7280", marginBottom: 7 }}>{label}</p>
        <p style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 800, fontSize: 26, color: alert && valueColor ? valueColor : "#111827" }}>{value}</p>
        {sub && <p style={{ fontSize: 11, fontWeight: 600, color: alert ? valueColor : "#059669", marginTop: 3 }}>{sub}</p>}
      </div>
      <div className="ic-wrap" style={{ background: iconBg }}>{icon}</div>
    </div>
  );
}

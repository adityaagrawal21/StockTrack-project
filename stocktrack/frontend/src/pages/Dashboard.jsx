import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import { fmt, fmtDate, fmtTime, greeting, errMsg } from "../utils/helpers";
import Modal from "../components/Modal";
import toast from "react-hot-toast";

export default function Dashboard() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [trend, setTrend] = useState([]);
  const [logs, setLogs] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [products, setProducts] = useState([]);
  const [logFilter, setLogFilter] = useState("all");
  const [qaModal, setQaModal] = useState(null);
  const [qForm, setQForm] = useState({ productId: "", quantity: "" });
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      const [sumRes, trendRes, logsRes, lowRes, prodsRes] = await Promise.all([
        api.get("/reports/summary"),
        api.get("/reports/sales-trend"),
        api.get("/transactions/recent?limit=10"),
        api.get("/reports/low-stock"),
        api.get("/products"),
      ]);
      setSummary(sumRes.data.summary);
      // Build 7-day trend chart data
      const days = buildTrend(trendRes.data.trend);
      setTrend(days);
      setLogs(logsRes.data.transactions);
      setLowStock(lowRes.data.products);
      setProducts(prodsRes.data.products);
      if (isAdmin) {
        const pc = await api.get("/users/pending-count");
        setPendingCount(pc.data.count);
      }
    } catch (e) {
      toast.error("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => { load(); }, [load]);

  const buildTrend = (raw) => {
    const map = {};
    raw.forEach((r) => { map[r._id] = r.revenue; });
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      const label = `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
      days.push({ date: label, rev: map[key] || 0 });
    }
    return days;
  };

  const openQA = (type) => { setQForm({ productId: "", quantity: "" }); setQaModal(type); };

  const confirmQA = async () => {
    if (!qForm.productId || !qForm.quantity) { toast.error("Select product and quantity"); return; }
    setSubmitting(true);
    try {
      await api.post(`/transactions/${qaModal}`, { productId: qForm.productId, quantity: Number(qForm.quantity) });
      toast.success(`${qaModal === "sale" ? "Sale" : "Purchase"} recorded!`);
      setQaModal(null);
      load();
    } catch (e) { toast.error(errMsg(e)); }
    finally { setSubmitting(false); }
  };

  const filteredLogs = logs.filter((t) =>
    logFilter === "all" ? true : t.type === (logFilter === "sales" ? "sale" : "purchase")
  );

  const selectedProduct = products.find((p) => p._id === qForm.productId);
  const total = selectedProduct && qForm.quantity ? Number(qForm.quantity) * selectedProduct.price : 0;

  const pctChange = (() => {
    const half = Math.floor(trend.length / 2);
    const prev = trend.slice(0, half).reduce((s, t) => s + t.rev, 0);
    const cur = trend.slice(half).reduce((s, t) => s + t.rev, 0);
    return prev > 0 ? Math.round(((cur - prev) / prev) * 100) : 0;
  })();

  if (loading) return <div className="loader"><div className="spinner" /></div>;

  return (
    <div>
      {/* Greeting */}
      <div style={{ marginBottom: 22 }}>
        <h2 style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 800, fontSize: 22 }}>
          {greeting()}, {user?.name?.split(" ")[0]}! 👋
        </h2>
        <p style={{ fontSize: 13, color: "#6b7280", marginTop: 3 }}>Here's what's happening with your inventory today.</p>
      </div>

      {/* Pending banner */}
      {isAdmin && pendingCount > 0 && (
        <div className="alert-warn animate-fadeUp" style={{ marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span>⏳ <strong>{pendingCount} user{pendingCount > 1 ? "s" : ""}</strong> awaiting your approval</span>
          <button className="btn btn-amber btn-sm" onClick={() => navigate("/users")}>Review →</button>
        </div>
      )}

      {/* Quick Actions */}
      <div className="animate-fadeUp delay-1" style={{ marginBottom: 22 }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "#6b7280", marginBottom: 12 }}>Quick Actions</p>
        <div className="grid-3">
          {[
            { ico: "➕", lbl: "Add Product", sub: "New inventory item", c: "#6366f1", bg: "#eef0ff", act: () => navigate("/inventory") },
            { ico: "🛒", lbl: "New Purchase", sub: "Restock inventory",  c: "#059669", bg: "#ecfdf5", act: () => openQA("purchase") },
            { ico: "🏷️", lbl: "New Sale",     sub: "Record a sale",      c: "#e11d48", bg: "#fff1f2", act: () => openQA("sale") },
          ].map((q, i) => (
            <button key={i} className="qa-card" onClick={q.act}
              style={{ background: q.bg, borderColor: q.bg }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = q.c; e.currentTarget.style.boxShadow = `0 6px 20px ${q.c}22`; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = q.bg; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; }}>
              <div style={{ width: 42, height: 42, borderRadius: 11, background: "rgba(255,255,255,.7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{q.ico}</div>
              <div>
                <p style={{ fontWeight: 700, fontSize: 13, color: "#111827" }}>{q.lbl}</p>
                <p style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>{q.sub}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr 1fr 1fr", gap: 14, marginBottom: 22 }}>
        {/* Hero */}
        <div className="stat-hero animate-fadeUp delay-2">
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase", opacity: .8, marginBottom: 10 }}>Total Revenue</p>
          <p style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 800, fontSize: 28, position: "relative", zIndex: 1 }}>{fmt(summary?.totalRevenue || 0)}</p>
          <p style={{ fontSize: 11, opacity: .65, marginTop: 6 }}>All-time sales</p>
          {pctChange !== 0 && (
            <div style={{ marginTop: 10, display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,.15)", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 600 }}>
              {pctChange > 0 ? "↑" : "↓"} {Math.abs(pctChange)}% vs prior period
            </div>
          )}
        </div>
        {[
          { lbl: "Total Orders",   val: summary?.totalSales || 0,          sub: "Sales recorded",  ico: "🛒", bg: "#eef0ff", vc: "#6366f1", alert: false, click: false },
          { lbl: "Low Stock",      val: summary?.lowStockItems || 0,        sub: summary?.lowStockItems > 0 ? "Action required" : "All good", ico: "⚠️", bg: summary?.lowStockItems > 0 ? "#fef9c3" : "#f0fdf4", vc: "#d97706", alert: (summary?.lowStockItems || 0) > 0, click: true },
          { lbl: "Out of Stock",   val: summary?.outOfStockItems || 0,      sub: summary?.outOfStockItems > 0 ? "Critical!" : "All stocked",  ico: "📭", bg: summary?.outOfStockItems > 0 ? "#fff1f2" : "#f0fdf4", vc: "#e11d48", alert: (summary?.outOfStockItems || 0) > 0, click: true },
        ].map((s, i) => (
          <div key={i} className={`stat-card animate-fadeUp delay-${i + 3}`} onClick={s.click ? () => navigate("/inventory") : undefined} style={{ cursor: s.click ? "pointer" : "default" }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase", color: "#6b7280", marginBottom: 7 }}>{s.lbl}</p>
              <p style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 800, fontSize: 26, color: s.alert ? s.vc : "#111827" }}>{s.val}</p>
              <p style={{ fontSize: 11, fontWeight: 600, color: s.alert ? s.vc : "#059669", marginTop: 3 }}>{s.sub}</p>
            </div>
            <div className="ic-wrap" style={{ background: s.bg }}>{s.ico}</div>
          </div>
        ))}
      </div>

      {/* Chart + Logs */}
      <div className="grid-2" style={{ marginBottom: 22 }}>
        {/* Sales Trend */}
        <div className="card animate-fadeUp delay-3">
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
            <div>
              <p className="section-title">Sales Trend</p>
              <p className="section-sub">Daily revenue — last 7 days</p>
            </div>
            {pctChange !== 0 && (
              <div style={{ background: pctChange > 0 ? "#ecfdf5" : "#fff1f2", border: `1px solid ${pctChange > 0 ? "#a7f3d0" : "#fecdd3"}`, borderRadius: 8, padding: "4px 10px", fontSize: 12, fontWeight: 700, color: pctChange > 0 ? "#059669" : "#e11d48" }}>
                {pctChange > 0 ? "↑" : "↓"} {Math.abs(pctChange)}% this week
              </div>
            )}
          </div>
          <ResponsiveContainer width="100%" height={210}>
            <LineChart data={trend} margin={{ top: 10, right: 5, left: -22, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f8" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} tickFormatter={(v) => v > 0 ? `₹${(v / 1000).toFixed(0)}k` : ""} />
              <Tooltip formatter={(v) => [fmt(v), "Revenue"]} contentStyle={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, fontSize: 12, boxShadow: "0 4px 16px rgba(0,0,0,.08)" }} labelStyle={{ fontWeight: 700, color: "#111827" }} />
              <Line type="monotone" dataKey="rev" stroke="#6366f1" strokeWidth={2.5} dot={{ fill: "#6366f1", r: 4, strokeWidth: 0 }} activeDot={{ r: 6, strokeWidth: 0 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* System Logs */}
        <div className="card animate-fadeUp delay-4" style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <p className="section-title">System Logs</p>
            <div style={{ display: "flex", gap: 4 }}>
              {[["all", "All"], ["sales", "Sales"], ["purchases", "Buys"]].map(([v, l]) => (
                <button key={v} onClick={() => setLogFilter(v)} style={{ padding: "3px 9px", borderRadius: 7, border: "1px solid", borderColor: logFilter === v ? "#6366f1" : "#e5e7eb", background: logFilter === v ? "#eef0ff" : "transparent", color: logFilter === v ? "#6366f1" : "#6b7280", cursor: "pointer", fontSize: 11, fontWeight: 600, transition: "all .15s" }}>{l}</button>
              ))}
            </div>
          </div>
          <div style={{ flex: 1, overflowY: "auto", maxHeight: 230 }}>
            {filteredLogs.length === 0 ? (
              <p style={{ color: "#9ca3af", fontSize: 13, textAlign: "center", paddingTop: 30 }}>No transactions yet</p>
            ) : filteredLogs.map((t) => (
              <div key={t._id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 0", borderBottom: "1px solid #f3f4f8" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: t.type === "sale" ? "#6366f1" : "#f59e0b", flexShrink: 0, marginTop: 5 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                    <p style={{ fontSize: 12.5, fontWeight: 600, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {t.type === "sale" ? `Sale: ${t.productName}` : `Purchased: ${t.quantity} SKUs`}
                    </p>
                    <span className={`badge badge-${t.type === "sale" ? "sale" : "purchase"}`} style={{ fontSize: 9, padding: "2px 7px", flexShrink: 0, marginLeft: 6 }}>
                      {t.type.toUpperCase()}
                    </span>
                  </div>
                  <p style={{ fontSize: 11, color: "#9ca3af" }}>{t.type === "sale" ? `${t.quantity} units` : t.productName?.slice(0, 24)} · {fmt(t.total)}</p>
                  <p style={{ fontSize: 10, color: "#c0c4ce", marginTop: 1 }}>⏱ {fmtTime(t.createdAt)} · {t.performedBy?.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Low Stock Table */}
      {lowStock.length > 0 && (
        <div className="card animate-fadeUp delay-5">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <p className="section-title" style={{ color: "#e11d48" }}>● Low Stock Alerts</p>
              <p className="section-sub">{lowStock.length} item{lowStock.length !== 1 ? "s" : ""} need attention</p>
            </div>
            <button className="btn btn-amber btn-sm" onClick={() => navigate("/inventory")}>View All →</button>
          </div>
          <div className="tbl-wrap">
            <table>
              <thead><tr><th>Product</th><th>Current Stock</th><th>Reorder Level</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                {lowStock.slice(0, 5).map((p) => (
                  <tr key={p._id}>
                    <td>
                      <p style={{ fontWeight: 600 }}>{p.name}</p>
                      <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{p.category} · {p.supplier}</p>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 800, fontSize: 18, color: p.quantity === 0 ? "#e11d48" : "#d97706" }}>{p.quantity}</span>
                        {p.quantity > 0 && <div style={{ width: 50 }}><div className="prog-wrap"><div className="prog-fill" style={{ width: `${Math.min(100, (p.quantity / p.reorderLevel) * 100)}%`, background: "#f59e0b" }} /></div></div>}
                      </div>
                    </td>
                    <td style={{ color: "#6b7280" }}>{p.reorderLevel}</td>
                    <td><span className={p.quantity === 0 ? "badge badge-out" : "badge badge-low"}>{p.quantity === 0 ? "Out of Stock" : "Low Stock"}</span></td>
                    <td><button className="btn btn-amber btn-xs" onClick={() => navigate("/purchases")}>Restock</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quick Action Modal */}
      {qaModal && (
        <Modal title={qaModal === "sale" ? "🏷️ Record Sale" : "🛒 New Purchase"} onClose={() => setQaModal(null)} maxWidth={370}>
          <div style={{ marginBottom: 14 }}>
            <label className="field-label">Product</label>
            <select className="inp" value={qForm.productId} onChange={(e) => setQForm((p) => ({ ...p, productId: e.target.value }))}>
              <option value="">Select product…</option>
              {products.filter((p) => qaModal === "purchase" || p.quantity > 0).map((p) => (
                <option key={p._id} value={p._id}>{p.name} (Qty: {p.quantity})</option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label className="field-label">Quantity</label>
            <input className="inp" type="number" min="1" placeholder="Enter quantity" value={qForm.quantity} onChange={(e) => setQForm((p) => ({ ...p, quantity: e.target.value }))} />
          </div>
          {total > 0 && (
            <div style={{ background: "#f8f9fc", borderRadius: 10, padding: "10px 14px", marginBottom: 14, fontSize: 13 }}>
              Total: <strong style={{ color: "#111827" }}>{fmt(total)}</strong>
            </div>
          )}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button className="btn btn-ghost" onClick={() => setQaModal(null)}>Cancel</button>
            <button className={`btn ${qaModal === "sale" ? "btn-primary" : "btn-amber"}`} onClick={confirmQA} disabled={submitting}>
              {submitting ? "Processing…" : "Confirm"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

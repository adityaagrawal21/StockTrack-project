import { useState, useEffect, useCallback } from "react";
import api from "../utils/api";
import { fmtDate, errMsg } from "../utils/helpers";
import Modal from "../components/Modal";
import toast from "react-hot-toast";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: "", username: "", email: "", password: "" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try { const { data } = await api.get("/users"); setUsers(data.users); }
    catch { toast.error("Failed to load users"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const approve = async (id) => {
    try { await api.patch(`/users/${id}/approve`); toast.success("User approved"); load(); }
    catch (e) { toast.error(errMsg(e)); }
  };

  const reject = async (id) => {
    if (!window.confirm("Reject this user?")) return;
    try { await api.patch(`/users/${id}/reject`); toast.success("User rejected"); load(); }
    catch (e) { toast.error(errMsg(e)); }
  };

  const del = async (id) => {
    if (!window.confirm("Delete this user permanently?")) return;
    try { await api.delete(`/users/${id}`); toast.success("User deleted"); load(); }
    catch (e) { toast.error(errMsg(e)); }
  };

  const createAdmin = async () => {
    if (!form.name || !form.username || !form.password) { toast.error("Name, username and password required"); return; }
    setSaving(true);
    try {
      await api.post("/users", form);
      toast.success("Admin user created");
      setModal(false);
      setForm({ name: "", username: "", email: "", password: "" });
      load();
    } catch (e) { toast.error(errMsg(e)); }
    finally { setSaving(false); }
  };

  const pendingCount = users.filter((u) => u.status === "pending").length;
  const FILTERS = [["all", "All Users"], ["pending", "Pending"], ["admin", "Admins"], ["manager", "Managers"], ["staff", "Staff"]];

  const rows = filter === "all" ? users
    : filter === "pending" ? users.filter((u) => u.status === "pending")
      : users.filter((u) => u.role === filter);

  if (loading) return <div className="loader"><div className="spinner" /></div>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
        <p style={{ fontSize: 13, color: "#6b7280" }}>{users.length} users · {pendingCount} pending</p>
        <button className="btn btn-primary" onClick={() => setModal(true)}>+ Add Admin</button>
      </div>

      {pendingCount > 0 && (
        <div className="alert-warn" style={{ marginBottom: 16 }}>
          ⏳ <strong>{pendingCount} user{pendingCount > 1 ? "s" : ""}</strong> awaiting approval
        </div>
      )}

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {FILTERS.map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)} style={{ padding: "6px 14px", borderRadius: 8, border: "1.5px solid", borderColor: filter === v ? "#6366f1" : "#e5e7eb", background: filter === v ? "#eef0ff" : "#fff", color: filter === v ? "#6366f1" : "#4b5563", cursor: "pointer", fontSize: 12, fontWeight: 600, transition: "all .15s" }}>
            {l}{v === "pending" && pendingCount > 0 ? ` (${pendingCount})` : ""}
          </button>
        ))}
      </div>

      <div className="tbl-wrap">
        <table>
          <thead><tr><th>Name</th><th>Username</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u._id}>
                <td style={{ fontWeight: 600 }}>{u.name}</td>
                <td style={{ fontFamily: "monospace", fontSize: 12, color: "#6b7280" }}>@{u.username}</td>
                <td style={{ fontSize: 12, color: "#6b7280" }}>{u.email || "—"}</td>
                <td><span className={`badge badge-${u.role}`}>{u.role}</span></td>
                <td><span className={`badge badge-${u.status}`}>{u.status}</span></td>
                <td style={{ fontSize: 12, color: "#6b7280" }}>{fmtDate(u.createdAt)}</td>
                <td>
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                    {u.status === "pending" && <>
                      <button className="btn btn-success btn-xs" onClick={() => approve(u._id)}>✓ Approve</button>
                      <button className="btn btn-danger btn-xs" onClick={() => reject(u._id)}>✗ Reject</button>
                    </>}
                    {u.status === "active" && u.role !== "admin" && (
                      <button className="btn btn-danger btn-xs" onClick={() => del(u._id)}>Remove</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={7} style={{ textAlign: "center", color: "#9ca3af", padding: 30 }}>No users in this category</td></tr>}
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal title="Add Admin User" onClose={() => setModal(false)} maxWidth={390}>
          {[["Full Name", "text", "name"], ["Username", "text", "username"], ["Email (optional)", "email", "email"], ["Password", "password", "password"]].map(([l, t, k]) => (
            <div key={k} style={{ marginBottom: 13 }}>
              <label className="field-label">{l}</label>
              <input className="inp" type={t} value={form[k]} onChange={(e) => setForm((p) => ({ ...p, [k]: e.target.value }))} />
            </div>
          ))}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
            <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={createAdmin} disabled={saving}>{saving ? "Creating…" : "Create Admin"}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

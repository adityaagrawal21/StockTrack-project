import { useState, useEffect, useCallback } from "react";
import api from "../utils/api";
import { errMsg } from "../utils/helpers";
import Modal from "../components/Modal";
import toast from "react-hot-toast";

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ name: "", contact: "", phone: "", email: "", category: "", status: "active" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try { const { data } = await api.get("/suppliers"); setSuppliers(data.suppliers); }
    catch { toast.error("Failed to load suppliers"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => {
    setSelected(null);
    setForm({ name: "", contact: "", phone: "", email: "", category: "", status: "active" });
    setModal("form");
  };

  const openEdit = (s) => { setSelected(s); setForm({ name: s.name, contact: s.contact, phone: s.phone, email: s.email, category: s.category, status: s.status }); setModal("form"); };

  const save = async () => {
    if (!form.name || !form.contact) { toast.error("Company name and contact are required"); return; }
    setSaving(true);
    try {
      if (selected) { await api.put(`/suppliers/${selected._id}`, form); toast.success("Supplier updated"); }
      else { await api.post("/suppliers", form); toast.success("Supplier added"); }
      setModal(null); load();
    } catch (e) { toast.error(errMsg(e)); }
    finally { setSaving(false); }
  };

  const del = async (id) => {
    if (!window.confirm("Remove this supplier?")) return;
    try { await api.delete(`/suppliers/${id}`); toast.success("Supplier removed"); load(); }
    catch (e) { toast.error(errMsg(e)); }
  };

  if (loading) return <div className="loader"><div className="spinner" /></div>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <p style={{ fontSize: 13, color: "#6b7280" }}>{suppliers.length} suppliers</p>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Supplier</button>
      </div>

      <div className="tbl-wrap">
        <table>
          <thead><tr><th>Company</th><th>Contact</th><th>Phone</th><th>Email</th><th>Category</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {suppliers.map((s) => (
              <tr key={s._id}>
                <td style={{ fontWeight: 600 }}>{s.name}</td>
                <td>{s.contact}</td>
                <td style={{ fontSize: 12, color: "#6b7280" }}>{s.phone || "—"}</td>
                <td style={{ fontSize: 12, color: "#6b7280" }}>{s.email || "—"}</td>
                <td><span className="badge badge-neutral">{s.category || "—"}</span></td>
                <td><span className={`badge badge-${s.status === "active" ? "active" : "rejected"}`}>{s.status}</span></td>
                <td>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button className="btn btn-ghost btn-xs" onClick={() => openEdit(s)}>Edit</button>
                    <button className="btn btn-danger btn-xs" onClick={() => del(s._id)}>Remove</button>
                  </div>
                </td>
              </tr>
            ))}
            {suppliers.length === 0 && <tr><td colSpan={7} style={{ textAlign: "center", color: "#9ca3af", padding: 30 }}>No suppliers yet</td></tr>}
          </tbody>
        </table>
      </div>

      {modal === "form" && (
        <Modal title={selected ? "Edit Supplier" : "Add Supplier"} onClose={() => setModal(null)}>
          <div className="grid-2">
            {[["Company Name", "text", "name", true], ["Contact Person", "text", "contact", false], ["Phone", "text", "phone", false], ["Email", "email", "email", false], ["Category", "text", "category", false]].map(([l, t, k, span]) => (
              <div key={k} style={{ gridColumn: span ? "1/-1" : "auto", marginBottom: 13 }}>
                <label className="field-label">{l}</label>
                <input className="inp" type={t} value={form[k]} onChange={(e) => setForm((p) => ({ ...p, [k]: e.target.value }))} />
              </div>
            ))}
            <div style={{ marginBottom: 13 }}>
              <label className="field-label">Status</label>
              <select className="inp" value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
            <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? "Saving…" : selected ? "Update" : "Add Supplier"}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

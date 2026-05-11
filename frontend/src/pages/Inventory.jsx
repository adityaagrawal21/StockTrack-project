import { useState, useEffect, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import api from "../utils/api";
import { fmt, fmtDate, errMsg } from "../utils/helpers";
import { useAuth } from "../context/AuthContext";
import Modal from "../components/Modal";
import toast from "react-hot-toast";

export default function Inventory() {
  const { canManageProducts } = useAuth();
  const ctx = useOutletContext();
  const globalSearch = ctx?.search || "";

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [catFilter, setCatFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modal, setModal] = useState(null); // "add" | "edit"
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ name: "", category: "", quantity: "", price: "", supplier: "", expiryDate: "", reorderLevel: 10 });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [pRes, cRes] = await Promise.all([api.get("/products"), api.get("/products/categories")]);
      setProducts(pRes.data.products);
      setCategories(cRes.data.categories);
    } catch (e) { toast.error("Failed to load products"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = products.filter((p) => {
    const q = globalSearch.toLowerCase();
    const mSearch = !q || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) || p.supplier.toLowerCase().includes(q);
    const mCat = catFilter === "all" || p.category === catFilter;
    const mStatus = statusFilter === "all" ||
      (statusFilter === "ok" && p.quantity > p.reorderLevel) ||
      (statusFilter === "low" && p.quantity > 0 && p.quantity <= p.reorderLevel) ||
      (statusFilter === "out" && p.quantity === 0);
    return mSearch && mCat && mStatus;
  });

  const openAdd = () => {
    setSelected(null);
    setForm({ name: "", category: "", quantity: "", price: "", supplier: "", expiryDate: "", reorderLevel: 10 });
    setModal("add");
  };

  const openEdit = (p) => {
    setSelected(p);
    setForm({ name: p.name, category: p.category, quantity: p.quantity, price: p.price, supplier: p.supplier, expiryDate: p.expiryDate ? p.expiryDate.split("T")[0] : "", reorderLevel: p.reorderLevel });
    setModal("edit");
  };

  const save = async () => {
    if (!form.name || !form.category || !form.quantity || !form.price || !form.supplier) {
      toast.error("Please fill all required fields"); return;
    }
    setSaving(true);
    try {
      if (modal === "edit") {
        await api.put(`/products/${selected._id}`, { ...form, quantity: Number(form.quantity), price: Number(form.price), reorderLevel: Number(form.reorderLevel) });
        toast.success("Product updated");
      } else {
        await api.post("/products", { ...form, quantity: Number(form.quantity), price: Number(form.price), reorderLevel: Number(form.reorderLevel) });
        toast.success("Product added");
      }
      setModal(null);
      load();
    } catch (e) { toast.error(errMsg(e)); }
    finally { setSaving(false); }
  };

  const del = async (id) => {
    if (!window.confirm("Delete this product? This cannot be undone.")) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success("Product deleted");
      load();
    } catch (e) { toast.error(errMsg(e)); }
  };

  if (loading) return <div className="loader"><div className="spinner" /></div>;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
        <p style={{ fontSize: 13, color: "#6b7280" }}>{products.length} products · {products.filter((p) => p.quantity <= p.reorderLevel).length} alerts</p>
        {canManageProducts && <button className="btn btn-primary" onClick={openAdd}>+ Add Product</button>}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <select className="inp" value={catFilter} onChange={(e) => setCatFilter(e.target.value)} style={{ width: "auto", minWidth: 170 }}>
          <option value="all">All Categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="inp" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ width: "auto", minWidth: 150 }}>
          <option value="all">All Status</option>
          <option value="ok">In Stock</option>
          <option value="low">Low Stock</option>
          <option value="out">Out of Stock</option>
        </select>
      </div>

      {/* Table */}
      <div className="tbl-wrap">
        <table>
          <thead>
            <tr><th>Product</th><th>Category</th><th>Stock</th><th>Price</th><th>Supplier</th><th>Status</th>{canManageProducts && <th>Actions</th>}</tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p._id}>
                <td>
                  <p style={{ fontWeight: 600, color: "#111827" }}>{p.name}</p>
                  {p.expiryDate && <p style={{ fontSize: 11, color: "#d97706", marginTop: 2 }}>Exp: {fmtDate(p.expiryDate)}</p>}
                </td>
                <td><span className="badge badge-neutral">{p.category}</span></td>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 800, fontSize: 17, color: p.quantity === 0 ? "#e11d48" : p.quantity <= p.reorderLevel ? "#d97706" : "#059669" }}>{p.quantity}</span>
                    {p.quantity > 0 && p.quantity <= p.reorderLevel && (
                      <div style={{ width: 40 }}>
                        <div className="prog-wrap"><div className="prog-fill" style={{ width: `${Math.min(100, (p.quantity / p.reorderLevel) * 100)}%`, background: "#f59e0b" }} /></div>
                      </div>
                    )}
                  </div>
                </td>
                <td style={{ fontWeight: 500 }}>{fmt(p.price)}</td>
                <td style={{ fontSize: 12, color: "#6b7280" }}>{p.supplier}</td>
                <td>
                  {p.quantity === 0 ? <span className="badge badge-out">Out</span>
                    : p.quantity <= p.reorderLevel ? <span className="badge badge-low">Low</span>
                      : <span className="badge badge-ok">OK</span>}
                </td>
                {canManageProducts && (
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="btn btn-ghost btn-xs" onClick={() => openEdit(p)}>Edit</button>
                      <button className="btn btn-danger btn-xs" onClick={() => del(p._id)}>Delete</button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={canManageProducts ? 7 : 6} style={{ textAlign: "center", color: "#9ca3af", padding: 30 }}>No products match your filters</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {modal && (
        <Modal title={modal === "edit" ? "Edit Product" : "Add New Product"} onClose={() => setModal(null)}>
          <div className="grid-2">
            {[
              ["Product Name", "text", "name", true],
              ["Category", "text", "category", false],
              ["Supplier", "text", "supplier", false],
              ["Unit Price (₹)", "number", "price", false],
              ["Quantity", "number", "quantity", false],
              ["Min Reorder Level", "number", "reorderLevel", false],
              ["Expiry Date (optional)", "date", "expiryDate", true],
            ].map(([label, type, key, span]) => (
              <div key={key} style={{ gridColumn: span ? "1/-1" : "auto", marginBottom: 13 }}>
                <label className="field-label">{label}</label>
                <input className="inp" type={type} value={form[key]} onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))} />
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
            <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? "Saving…" : modal === "edit" ? "Update Product" : "Add Product"}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

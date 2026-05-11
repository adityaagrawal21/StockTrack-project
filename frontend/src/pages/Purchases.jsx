import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import api from "../utils/api";
import { fmt, fmtDate, errMsg } from "../utils/helpers";
import Modal from "../components/Modal";
import toast from "react-hot-toast";

export default function Purchases() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const preselect = params.get("productId") || "";

  const [txs, setTxs] = useState([]);
  const [products, setProducts] = useState([]);
  const [modal, setModal] = useState(!!preselect);
  const [form, setForm] = useState({ productId: preselect, quantity: "", note: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const load = async () => {
    try {
      const [txRes, prodRes] = await Promise.all([
        api.get("/transactions?type=purchase&limit=100"),
        api.get("/products"),
      ]);
      setTxs(txRes.data.transactions);
      setProducts(prodRes.data.products);
    } catch (e) { toast.error(errMsg(e)); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  // Pre-select product from URL param
  useEffect(() => {
    if (preselect) { setForm(f => ({ ...f, productId: preselect })); setModal(true); }
  }, [preselect]);

  const selProd = products.find(p => p._id === form.productId);

  const confirm = async () => {
    setErr("");
    if (!form.productId || !form.quantity || Number(form.quantity) < 1) { setErr("Select a product and enter a valid quantity."); return; }
    setSaving(true);
    try {
      await api.post("/transactions/purchase", { productId: form.productId, quantity: Number(form.quantity), note: form.note });
      toast.success("Purchase recorded! Stock updated.");
      setModal(false); setForm({ productId: "", quantity: "", note: "" });
      load();
    } catch (e) { setErr(errMsg(e)); }
    finally { setSaving(false); }
  };

  const totalCost = txs.reduce((s, t) => s + t.total, 0);

  if (loading) return <div className="loader"><div className="spinner"/></div>;

  return (
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20,flexWrap:"wrap",gap:10}}>
        <div>
          <p style={{fontSize:13,color:"#6b7280"}}>{txs.length} purchase orders · Total cost: <strong style={{color:"#111827"}}>{fmt(totalCost)}</strong></p>
        </div>
        <button className="btn btn-amber" onClick={()=>{setForm({productId:"",quantity:"",note:""});setErr("");setModal(true);}}>+ New Purchase</button>
      </div>

      <div className="tbl-wrap">
        <table>
          <thead>
            <tr><th>Product</th><th>Qty</th><th>Unit Cost</th><th>Total Cost</th><th>Date</th><th>By</th><th>Note</th></tr>
          </thead>
          <tbody>
            {txs.map(t => (
              <tr key={t._id}>
                <td style={{fontWeight:600}}>{t.productName}</td>
                <td>{t.quantity}</td>
                <td style={{fontSize:12,color:"#6b7280"}}>{fmt(t.unitPrice)}</td>
                <td style={{fontWeight:700,color:"#059669"}}>{fmt(t.total)}</td>
                <td style={{fontSize:12,color:"#6b7280"}}>{fmtDate(t.createdAt)}</td>
                <td style={{fontSize:12,color:"#6b7280"}}>{t.performedByName}</td>
                <td style={{fontSize:11,color:"#9ca3af"}}>{t.note||"—"}</td>
              </tr>
            ))}
            {txs.length===0 && <tr><td colSpan={7} style={{textAlign:"center",color:"#9ca3af",padding:32}}>No purchases recorded yet</td></tr>}
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal title="🛒 New Purchase Order" onClose={()=>setModal(false)} maxWidth={420}>
          <div style={{marginBottom:14}}>
            <label className="field-label">Product</label>
            <select className="inp" value={form.productId} onChange={e=>setForm(f=>({...f,productId:e.target.value}))}>
              <option value="">Select a product…</option>
              {products.map(p=>(
                <option key={p._id} value={p._id}>{p.name} (In stock: {p.quantity})</option>
              ))}
            </select>
          </div>

          {/* Show product details */}
          {selProd && (
            <div style={{background:"linear-gradient(135deg,#f8f9ff,#fefce8)",border:"1px solid #e5e7eb",borderRadius:12,padding:"12px 14px",marginBottom:14,display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
              {[["Selling Price",fmt(selProd.price),"#6366f1"],["Cost Price",fmt(selProd.costPrice??Math.round(selProd.price*0.8)),"#059669"],["In Stock",selProd.quantity,"#d97706"]].map(([l,v,c])=>(
                <div key={l} style={{textAlign:"center"}}>
                  <p style={{fontSize:10,color:"#6b7280",fontWeight:600,textTransform:"uppercase",letterSpacing:".04em",marginBottom:3}}>{l}</p>
                  <p style={{fontFamily:"'Manrope',sans-serif",fontWeight:800,fontSize:16,color:c}}>{v}</p>
                </div>
              ))}
            </div>
          )}

          <div style={{marginBottom:14}}>
            <label className="field-label">Quantity to Purchase</label>
            <input className="inp" type="number" min="1" placeholder="e.g. 50" value={form.quantity} onChange={e=>setForm(f=>({...f,quantity:e.target.value}))}/>
          </div>
          <div style={{marginBottom:14}}>
            <label className="field-label">Note (optional)</label>
            <input className="inp" placeholder="Restock reason…" value={form.note} onChange={e=>setForm(f=>({...f,note:e.target.value}))}/>
          </div>

          {selProd && form.quantity && Number(form.quantity)>0 && (
            <div style={{background:"#ecfdf5",border:"1.5px solid #a7f3d0",borderRadius:10,padding:"11px 14px",marginBottom:14}}>
              <p style={{fontSize:12,color:"#059669",fontWeight:600}}>Total Cost: <span style={{fontFamily:"'Manrope',sans-serif",fontSize:18}}>{fmt(Number(form.quantity)*(selProd.costPrice??Math.round(selProd.price*0.8)))}</span></p>
            </div>
          )}

          {err && <div className="alert-error" style={{marginBottom:12}}>{err}</div>}
          <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
            <button className="btn btn-ghost" onClick={()=>setModal(false)}>Cancel</button>
            <button className="btn btn-amber" onClick={confirm} disabled={saving}>{saving?"Processing…":"Confirm Purchase"}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

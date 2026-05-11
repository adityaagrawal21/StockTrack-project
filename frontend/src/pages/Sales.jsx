import { useState, useEffect } from "react";
import api from "../utils/api";
import { fmt, fmtDate, errMsg } from "../utils/helpers";
import Modal from "../components/Modal";
import toast from "react-hot-toast";

export default function Sales() {
  const [txs, setTxs] = useState([]);
  const [products, setProducts] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ productId:"", quantity:"", note:"" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const load = async () => {
    try {
      const [txRes, prodRes] = await Promise.all([
        api.get("/transactions?type=sale&limit=100"),
        api.get("/products"),
      ]);
      setTxs(txRes.data.transactions);
      setProducts(prodRes.data.products);
    } catch (e) { toast.error(errMsg(e)); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const selProd = products.find(p => p._id === form.productId);

  const confirm = async () => {
    setErr("");
    if (!form.productId || !form.quantity || Number(form.quantity)<1) { setErr("Select a product and enter a valid quantity."); return; }
    if (selProd && Number(form.quantity) > selProd.quantity) { setErr(`Only ${selProd.quantity} units available.`); return; }
    setSaving(true);
    try {
      await api.post("/transactions/sale", { productId:form.productId, quantity:Number(form.quantity), note:form.note });
      toast.success("Sale recorded successfully!");
      setModal(false); setForm({productId:"",quantity:"",note:""});
      load();
    } catch (e) { setErr(errMsg(e)); }
    finally { setSaving(false); }
  };

  const totalRev = txs.reduce((s,t)=>s+t.total,0);
  const totalProfit = txs.reduce((s,t)=>s+(t.profit||0),0);

  if (loading) return <div className="loader"><div className="spinner"/></div>;

  return (
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20,flexWrap:"wrap",gap:10}}>
        <div style={{display:"flex",gap:20}}>
          <p style={{fontSize:13,color:"#6b7280"}}>{txs.length} sales · Revenue: <strong style={{color:"#6366f1"}}>{fmt(totalRev)}</strong></p>
          <p style={{fontSize:13,color:"#6b7280"}}>Profit: <strong style={{color:"#059669"}}>{fmt(totalProfit)}</strong></p>
        </div>
        <button className="btn btn-primary" onClick={()=>{setForm({productId:"",quantity:"",note:""});setErr("");setModal(true);}}>+ New Sale</button>
      </div>

      <div className="tbl-wrap">
        <table>
          <thead>
            <tr><th>Product</th><th>Qty</th><th>Unit Price</th><th>Revenue</th><th>Profit</th><th>Margin</th><th>Date</th><th>By</th></tr>
          </thead>
          <tbody>
            {txs.map(t => (
              <tr key={t._id}>
                <td style={{fontWeight:600}}>{t.productName}</td>
                <td>{t.quantity}</td>
                <td style={{fontSize:12,color:"#6b7280"}}>{fmt(t.unitPrice)}</td>
                <td style={{fontWeight:700,color:"#6366f1"}}>{fmt(t.total)}</td>
                <td style={{fontWeight:600,color:"#059669"}}>{fmt(t.profit||0)}</td>
                <td><span style={{fontSize:11,background:"#ecfdf5",color:"#059669",padding:"2px 7px",borderRadius:20,fontWeight:600}}>{t.profitMargin||0}%</span></td>
                <td style={{fontSize:12,color:"#6b7280"}}>{fmtDate(t.createdAt)}</td>
                <td style={{fontSize:12,color:"#6b7280"}}>{t.performedByName}</td>
              </tr>
            ))}
            {txs.length===0 && <tr><td colSpan={8} style={{textAlign:"center",color:"#9ca3af",padding:32}}>No sales recorded yet</td></tr>}
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal title="🏷️ Record Sale" onClose={()=>setModal(false)} maxWidth={420}>
          <div style={{marginBottom:14}}>
            <label className="field-label">Product</label>
            <select className="inp" value={form.productId} onChange={e=>setForm(f=>({...f,productId:e.target.value}))}>
              <option value="">Select a product…</option>
              {products.filter(p=>p.quantity>0).map(p=>(
                <option key={p._id} value={p._id}>{p.name} (Available: {p.quantity})</option>
              ))}
            </select>
          </div>

          {selProd && (
            <div style={{background:"linear-gradient(135deg,#f8f9ff,#fdf8ff)",border:"1px solid #e5e7eb",borderRadius:12,padding:"12px 14px",marginBottom:14,display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
              {[["Selling Price",fmt(selProd.price),"#6366f1"],["Cost Price",fmt(selProd.costPrice??Math.round(selProd.price*0.8)),"#d97706"],["Available",selProd.quantity,"#059669"]].map(([l,v,c])=>(
                <div key={l} style={{textAlign:"center"}}>
                  <p style={{fontSize:10,color:"#6b7280",fontWeight:600,textTransform:"uppercase",letterSpacing:".04em",marginBottom:3}}>{l}</p>
                  <p style={{fontFamily:"'Manrope',sans-serif",fontWeight:800,fontSize:16,color:c}}>{v}</p>
                </div>
              ))}
            </div>
          )}

          <div style={{marginBottom:14}}>
            <label className="field-label">Quantity</label>
            <input className="inp" type="number" min="1" max={selProd?.quantity||9999} placeholder="e.g. 3" value={form.quantity} onChange={e=>setForm(f=>({...f,quantity:e.target.value}))}/>
          </div>
          <div style={{marginBottom:14}}>
            <label className="field-label">Note (optional)</label>
            <input className="inp" placeholder="Sale note…" value={form.note} onChange={e=>setForm(f=>({...f,note:e.target.value}))}/>
          </div>

          {selProd && form.quantity && Number(form.quantity)>0 && (
            <div style={{background:"#eef0ff",border:"1.5px solid #c7d2fe",borderRadius:10,padding:"11px 14px",marginBottom:14,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <p style={{fontSize:11,color:"#6366f1",fontWeight:600}}>Revenue</p>
                <p style={{fontFamily:"'Manrope',sans-serif",fontWeight:800,fontSize:18,color:"#4f46e5"}}>{fmt(Number(form.quantity)*selProd.price)}</p>
              </div>
              <div style={{textAlign:"right"}}>
                <p style={{fontSize:11,color:"#059669",fontWeight:600}}>Est. Profit</p>
                <p style={{fontFamily:"'Manrope',sans-serif",fontWeight:800,fontSize:18,color:"#059669"}}>{fmt(Number(form.quantity)*(selProd.price-(selProd.costPrice??Math.round(selProd.price*0.8))))}</p>
              </div>
            </div>
          )}

          {err && <div className="alert-error" style={{marginBottom:12}}>{err}</div>}
          <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
            <button className="btn btn-ghost" onClick={()=>setModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={confirm} disabled={saving}>{saving?"Processing…":"Confirm Sale"}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

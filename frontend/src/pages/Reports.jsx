import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import api from "../utils/api";
import { fmt, fmtDate, errMsg } from "../utils/helpers";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const RANGES = [
  { value:"today", label:"Today" },
  { value:"7days", label:"Last 7 Days" },
  { value:"30days",label:"Last 30 Days" },
  { value:"month", label:"This Month" },
  { value:"all",   label:"All Time" },
];

const PURPLE = "#6366f1", GREEN = "#22c55e", AMBER = "#f59e0b", RED = "#ef4444";
const BAR_COLORS = ["#6366f1","#818cf8","#a5b4fc","#c7d2fe","#e0e7ff","#4f46e5","#4338ca","#3730a3"];

export default function Reports() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("overview");
  const [range, setRange] = useState("7days");
  const [summary, setSummary] = useState(null);
  const [trend, setTrend] = useState([]);
  const [topProds, setTopProds] = useState([]);
  const [catVal, setCatVal] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sumRes, trendRes, topRes, catRes, lowRes] = await Promise.all([
        api.get(`/reports/summary?range=${range}`),
        api.get(`/reports/sales-trend?range=${range}`),
        api.get(`/reports/top-products?range=${range}`),
        api.get(`/reports/category-value`),
        api.get(`/reports/low-stock`),
      ]);
      setSummary(sumRes.data.summary);
      // Build full trend array filling missing days
      const trendMap = {};
      trendRes.data.trend.forEach(t => { trendMap[t._id] = { revenue: t.revenue, profit: t.profit||0 }; });
      // Show last N days based on range
      const days = range==="today"?1:range==="7days"?7:range==="30days"?30:30;
      const filled = Array.from({length:Math.min(days,30)},(_,i)=>{
        const d = new Date(); d.setDate(d.getDate()-(days-1-i));
        const key = d.toISOString().split("T")[0];
        const label = `${String(d.getMonth()+1).padStart(2,"0")}/${String(d.getDate()).padStart(2,"0")}`;
        return { date:label, revenue:trendMap[key]?.revenue||0, profit:trendMap[key]?.profit||0 };
      });
      setTrend(filled);
      setTopProds(topRes.data.topProducts);
      setCatVal(catRes.data.categoryValue);
      setLowStock(lowRes.data.products);
    } catch(e) { toast.error(errMsg(e)); }
    finally { setLoading(false); }
  }, [range]);

  useEffect(() => { load(); }, [load]);

  const totalCatVal = catVal.reduce((s,c)=>s+c.totalValue,0);

  const exportPDF = () => {
    const w = window.open("","_blank");
    const now = new Date().toLocaleString("en-IN");
    w.document.write(`<!DOCTYPE html><html><head><title>StockTrack Report</title>
<style>body{font-family:Arial,sans-serif;padding:30px;color:#111;margin:0}
h1{color:#6366f1;font-size:22px;margin-bottom:4px}
.meta{color:#6b7280;font-size:12px;margin-bottom:20px}
.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:16px 0}
.box{background:#f8f9fc;border-radius:8px;padding:14px;text-align:center}
.box-label{font-size:10px;text-transform:uppercase;color:#6b7280;letter-spacing:.06em}
.box-val{font-size:20px;font-weight:800;margin-top:4px}
table{width:100%;border-collapse:collapse;margin:14px 0;font-size:12px}
th{background:#6366f1;color:#fff;padding:8px 12px;text-align:left}
td{border:1px solid #e5e7eb;padding:7px 12px}
tr:nth-child(even){background:#f9fafb}
h2{color:#374151;font-size:15px;margin:20px 0 8px;border-bottom:2px solid #e5e7eb;padding-bottom:6px}
@media print{body{padding:15px}}</style></head><body>
<h1>📦 StockTrack Inventory Report</h1>
<p class="meta">Generated: ${now} · By: ${user?.name} · Range: ${RANGES.find(r=>r.value===range)?.label}</p>
<div class="grid">
<div class="box"><div class="box-label">Revenue</div><div class="box-val" style="color:#6366f1">${fmt(summary?.totalRevenue||0)}</div></div>
<div class="box"><div class="box-label">Profit</div><div class="box-val" style="color:#059669">${fmt(summary?.totalProfit||0)}</div></div>
<div class="box"><div class="box-label">Purchase Cost</div><div class="box-val" style="color:#d97706">${fmt(summary?.totalPurchaseCost||0)}</div></div>
<div class="box"><div class="box-label">Inventory Value</div><div class="box-val" style="color:#374151">${fmt(summary?.inventoryValue||0)}</div></div>
</div>
<h2>⚠️ Low Stock Items (${lowStock.length})</h2>
<table><tr><th>Product</th><th>Category</th><th>Stock</th><th>Reorder Level</th><th>Supplier</th><th>Status</th></tr>
${lowStock.map(p=>`<tr><td>${p.name}</td><td>${p.category}</td><td style="color:${p.quantity===0?"#dc2626":"#d97706"};font-weight:700">${p.quantity}</td><td>${p.reorderLevel}</td><td>${p.supplier}</td><td>${p.quantity===0?"Out of Stock":"Low Stock"}</td></tr>`).join("")}
</table>
<h2>🏆 Top Products by Revenue</h2>
<table><tr><th>Product</th><th>Units Sold</th><th>Revenue</th><th>Profit</th></tr>
${topProds.map(p=>`<tr><td>${p._id}</td><td>${p.units}</td><td>${fmt(p.revenue)}</td><td>${fmt(p.profit||0)}</td></tr>`).join("")}
</table>
</body></html>`);
    w.document.close(); w.print();
  };

  const exportCSV = () => {
    const rows = [
      ["Product","Units Sold","Revenue","Profit"],
      ...topProds.map(p=>[p._id,p.units,p.revenue,p.profit||0]),
    ];
    const csv = rows.map(r=>r.map(v=>`"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv],{type:"text/csv"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href=url; a.download="stocktrack_report.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const SUMMARY_CARDS = summary ? [
    { label:"Sales Revenue", val:fmt(summary.totalRevenue), color:PURPLE, bg:"#eef0ff" },
    { label:"Total Profit",  val:fmt(summary.totalProfit),  color:"#059669", bg:"#ecfdf5", sub:`${summary.profitMargin}% margin` },
    { label:"Purchase Cost", val:fmt(summary.totalPurchaseCost), color:AMBER, bg:"#fef3c7" },
    { label:"Inventory Value",val:fmt(summary.inventoryValue), color:"#374151", bg:"#f3f4f8" },
    { label:"Low Stock", val:summary.lowStockItems, color:summary.lowStockItems>0?RED:"#059669", bg:summary.lowStockItems>0?"#fff1f2":"#ecfdf5", sub:summary.lowStockItems>0?"Need restocking":"All good" },
  ] : [];

  // Prepare stock vs reorder data — sorted by stock level asc
  const stockData = lowStock.slice(0,8).map(p=>({
    name: p.name.length>14 ? p.name.slice(0,14)+"…" : p.name,
    stock: p.quantity, reorder: p.reorderLevel,
  }));

  const TABS = [["overview","📊 Overview"],["inventory","📦 Inventory"],["export","📄 Export"]];

  return (
    <div>
      {/* Header row */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20,flexWrap:"wrap",gap:12}}>
        {/* Tab switcher */}
        <div style={{display:"flex",gap:0,background:"#fff",borderRadius:12,padding:4,border:"1px solid #e9eaf0",boxShadow:"0 1px 4px rgba(0,0,0,.04)"}}>
          {TABS.map(([v,l])=>(
            <button key={v} onClick={()=>setTab(v)} style={{padding:"8px 20px",borderRadius:9,border:"none",background:tab===v?"#6366f1":"transparent",color:tab===v?"#fff":"#6b7280",cursor:"pointer",fontSize:13,fontWeight:tab===v?700:400,transition:"all .18s"}}>{l}</button>
          ))}
        </div>

        {/* Date range + export */}
        <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
          <span style={{fontSize:12,color:"#6b7280"}}>📅</span>
          {RANGES.map(r=>(
            <button key={r.value} onClick={()=>setRange(r.value)} style={{padding:"5px 12px",borderRadius:8,border:"1px solid",borderColor:range===r.value?"#6366f1":"#e5e7eb",background:range===r.value?"#eef0ff":"#fff",color:range===r.value?"#6366f1":"#6b7280",cursor:"pointer",fontSize:12,fontWeight:range===r.value?700:400,transition:"all .15s"}}>{r.label}</button>
          ))}
          <button className="btn btn-ghost btn-sm" onClick={exportCSV} style={{fontSize:12}}>⬇ CSV</button>
          <button className="btn btn-primary btn-sm" onClick={exportPDF} style={{fontSize:12}}>🖨 PDF</button>
        </div>
      </div>

      {loading ? <div className="loader"><div className="spinner"/></div> : <>

      {/* Summary cards */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12,marginBottom:22}}>
        {SUMMARY_CARDS.map((c,i)=>(
          <div key={i} style={{background:c.bg,borderRadius:14,padding:"14px 16px"}}>
            <p style={{fontSize:10,fontWeight:700,color:c.color,textTransform:"uppercase",letterSpacing:".06em",opacity:.8,marginBottom:6}}>{c.label}</p>
            <p style={{fontFamily:"'Manrope',sans-serif",fontWeight:800,fontSize:20,color:c.color}}>{c.val}</p>
            {c.sub && <p style={{fontSize:11,color:c.color,opacity:.7,marginTop:3}}>{c.sub}</p>}
          </div>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {tab==="overview" && (
        <div>
          <div className="grid-2" style={{marginBottom:20}}>
            {/* Sales trend line chart */}
            <div className="card">
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                <div>
                  <p style={{fontFamily:"'Manrope',sans-serif",fontWeight:700,fontSize:15}}>Sales Trend</p>
                  <p style={{fontSize:12,color:"#6b7280",marginTop:2}}>Revenue & Profit · {RANGES.find(r=>r.value===range)?.label}</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={trend} margin={{top:10,right:5,left:-20,bottom:0}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f8" vertical={false}/>
                  <XAxis dataKey="date" tick={{fontSize:10,fill:"#9ca3af"}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fontSize:9,fill:"#9ca3af"}} axisLine={false} tickLine={false} tickFormatter={v=>v>0?`₹${(v/1000).toFixed(0)}k`:""}/>
                  <Tooltip formatter={(v,n)=>[fmt(v),n==="revenue"?"Revenue":"Profit"]} contentStyle={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:10,fontSize:12}} labelStyle={{fontWeight:700}}/>
                  <Legend wrapperStyle={{fontSize:11,paddingTop:8}}/>
                  <Line type="monotone" dataKey="revenue" name="Revenue" stroke={PURPLE} strokeWidth={2.5} dot={{fill:PURPLE,r:3,strokeWidth:0}} activeDot={{r:5}}/>
                  <Line type="monotone" dataKey="profit" name="Profit" stroke={GREEN} strokeWidth={2} dot={{fill:GREEN,r:3,strokeWidth:0}} activeDot={{r:5}} strokeDasharray="4 2"/>
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Top products — horizontal bar with full names */}
            <div className="card">
              <p style={{fontFamily:"'Manrope',sans-serif",fontWeight:700,fontSize:15,marginBottom:4}}>Top Products by Revenue</p>
              <p style={{fontSize:12,color:"#6b7280",marginBottom:14}}>Best-selling items · {RANGES.find(r=>r.value===range)?.label}</p>
              {topProds.length===0
                ? <p style={{color:"#9ca3af",textAlign:"center",paddingTop:30,fontSize:13}}>No sales data for this period</p>
                : (
                <div>
                  {topProds.slice(0,6).map((p,i)=>{
                    const maxRev = topProds[0]?.revenue||1;
                    const pct = Math.max(4,Math.round((p.revenue/maxRev)*100));
                    return (
                      <div key={i} style={{marginBottom:12}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                          <p style={{fontSize:12.5,fontWeight:600,color:"#111827",flex:1,paddingRight:8}}>{p._id}</p>
                          <p style={{fontSize:12,fontWeight:700,color:PURPLE,flexShrink:0}}>{fmt(p.revenue)}</p>
                        </div>
                        <div style={{height:6,background:"#f3f4f8",borderRadius:99,overflow:"hidden"}}>
                          <div style={{height:"100%",width:`${pct}%`,background:`linear-gradient(90deg,${BAR_COLORS[i%BAR_COLORS.length]},${BAR_COLORS[(i+2)%BAR_COLORS.length]})`,borderRadius:99,transition:"width .4s ease"}}/>
                        </div>
                        <p style={{fontSize:10,color:"#9ca3af",marginTop:2}}>{p.units} units · Profit: {fmt(p.profit||0)}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Category value */}
          <div className="card">
            <p style={{fontFamily:"'Manrope',sans-serif",fontWeight:700,fontSize:15,marginBottom:4}}>Inventory Value by Category</p>
            <p style={{fontSize:12,color:"#6b7280",marginBottom:16}}>Current stock valuation breakdown</p>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:16}}>
              {catVal.map((c,i)=>(
                <div key={i} style={{marginBottom:4}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:5,fontSize:13}}>
                    <span style={{fontWeight:600,color:"#111827"}}>{c._id}</span>
                    <span style={{color:"#6b7280",fontWeight:600}}>{fmt(c.totalValue)}</span>
                  </div>
                  <div className="prog-wrap">
                    <div className="prog-fill" style={{width:`${totalCatVal>0?Math.min(100,(c.totalValue/totalCatVal)*100):0}%`,background:BAR_COLORS[i%BAR_COLORS.length]}}/>
                  </div>
                  <p style={{fontSize:10,color:"#9ca3af",marginTop:3}}>{totalCatVal>0?((c.totalValue/totalCatVal)*100).toFixed(1):0}% of total · {c.count} product{c.count!==1?"s":""}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* INVENTORY TAB */}
      {tab==="inventory" && (
        <div>
          <div className="grid-2" style={{marginBottom:20}}>
            {/* Stock vs Reorder — FIXED: horizontal grouped bar, no overlapping labels */}
            <div className="card">
              <p style={{fontFamily:"'Manrope',sans-serif",fontWeight:700,fontSize:15,marginBottom:4}}>Stock vs Reorder Level</p>
              <p style={{fontSize:12,color:"#6b7280",marginBottom:4}}>Low & out-of-stock items — purple=stock, amber=reorder</p>
              {stockData.length===0
                ? <p style={{color:"#059669",fontWeight:600,textAlign:"center",padding:"24px 0"}}>✅ All items well stocked</p>
                : <>
                  <div style={{marginBottom:10,display:"flex",gap:16,fontSize:11,fontWeight:600}}>
                    <span style={{display:"flex",alignItems:"center",gap:5}}><span style={{width:10,height:10,borderRadius:2,background:PURPLE,display:"inline-block"}}/> Current Stock</span>
                    <span style={{display:"flex",alignItems:"center",gap:5}}><span style={{width:10,height:10,borderRadius:2,background:AMBER,display:"inline-block"}}/> Reorder Level</span>
                  </div>
                  {stockData.map((p,i)=>{
                    const maxVal = Math.max(...stockData.map(d=>Math.max(d.stock,d.reorder)),1);
                    const stockW = Math.max(2,Math.round((p.stock/maxVal)*200));
                    const reorderW = Math.max(2,Math.round((p.reorder/maxVal)*200));
                    return (
                      <div key={i} style={{display:"flex",alignItems:"center",gap:10,marginBottom:10,padding:"6px 0",borderBottom:"1px solid #f3f4f8"}}>
                        <div style={{width:110,fontSize:11,color:"#374151",fontWeight:500,flexShrink:0,textAlign:"right",paddingRight:6}}>{p.name}</div>
                        <div style={{flex:1}}>
                          <div style={{display:"flex",alignItems:"center",gap:4,marginBottom:3}}>
                            <div style={{height:8,width:stockW,background:p.stock===0?RED:p.stock<=p.reorder?AMBER:PURPLE,borderRadius:99,minWidth:4,transition:"width .3s"}}/>
                            <span style={{fontSize:11,fontWeight:700,color:p.stock===0?RED:p.stock<=p.reorder?AMBER:PURPLE}}>{p.stock}</span>
                          </div>
                          <div style={{display:"flex",alignItems:"center",gap:4}}>
                            <div style={{height:8,width:reorderW,background:AMBER,opacity:.5,borderRadius:99,minWidth:4}}/>
                            <span style={{fontSize:10,color:"#9ca3af"}}>{p.reorder}</span>
                          </div>
                        </div>
                        <span className={`badge ${p.stock===0?"badge-out":"badge-low"}`} style={{flexShrink:0,fontSize:9}}>{p.stock===0?"Out":"Low"}</span>
                      </div>
                    );
                  })}
                </>
              }
            </div>

            {/* Category value pie-style */}
            <div className="card">
              <p style={{fontFamily:"'Manrope',sans-serif",fontWeight:700,fontSize:15,marginBottom:16}}>Value by Category</p>
              {catVal.map((c,i)=>(
                <div key={i} style={{marginBottom:16}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:5,fontSize:13}}>
                    <span style={{fontWeight:600,color:"#111827"}}>{c._id}</span>
                    <span style={{color:"#6b7280",fontWeight:600}}>{fmt(c.totalValue)}</span>
                  </div>
                  <div className="prog-wrap" style={{height:8}}>
                    <div className="prog-fill" style={{width:`${totalCatVal>0?Math.min(100,(c.totalValue/totalCatVal)*100):0}%`,background:BAR_COLORS[i%BAR_COLORS.length],height:"100%"}}/>
                  </div>
                  <p style={{fontSize:10,color:"#9ca3af",marginTop:3}}>{totalCatVal>0?((c.totalValue/totalCatVal)*100).toFixed(1):0}% of ₹{(totalCatVal/1000).toFixed(0)}k total</p>
                </div>
              ))}
            </div>
          </div>

          {/* Low stock table */}
          <div className="card">
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
              <div>
                <p style={{fontFamily:"'Manrope',sans-serif",fontWeight:700,fontSize:15}}>⚠️ Low Stock Table</p>
                <p style={{fontSize:12,color:"#6b7280",marginTop:2}}>{lowStock.length} item{lowStock.length!==1?"s":""} at or below reorder level</p>
              </div>
            </div>
            {lowStock.length===0
              ? <p style={{color:"#059669",fontWeight:600,textAlign:"center",padding:"20px 0"}}>✅ All items well stocked</p>
              : <div className="tbl-wrap" style={{border:"none"}}>
                <table>
                  <thead><tr><th>Product</th><th>Category</th><th>Stock</th><th>Reorder Level</th><th>Supplier</th><th>Status</th><th>Action</th></tr></thead>
                  <tbody>
                    {lowStock.map(p=>(
                      <tr key={p._id}>
                        <td style={{fontWeight:600}}>{p.name}</td>
                        <td><span className="badge badge-neutral">{p.category}</span></td>
                        <td><strong style={{fontFamily:"'Manrope',sans-serif",fontSize:17,color:p.quantity===0?RED:AMBER}}>{p.quantity}</strong></td>
                        <td style={{color:"#6b7280"}}>{p.reorderLevel}</td>
                        <td style={{fontSize:12,color:"#6b7280"}}>{p.supplier}</td>
                        <td><span className={`badge ${p.quantity===0?"badge-out":"badge-low"}`}>{p.quantity===0?"Out":"Low"}</span></td>
                        <td>
                          <button className="btn btn-amber btn-xs"
                            onClick={()=>navigate(`/purchases?productId=${p._id}`)}>
                            Create PO
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            }
          </div>
        </div>
      )}

      {/* EXPORT TAB */}
      {tab==="export" && (
        <div className="card" style={{maxWidth:500}}>
          <div style={{textAlign:"center",padding:"10px 0 20px"}}>
            <div style={{width:68,height:68,background:"linear-gradient(135deg,#6366f1,#818cf8)",borderRadius:18,display:"flex",alignItems:"center",justifyContent:"center",fontSize:32,margin:"0 auto 16px"}}>📄</div>
            <p style={{fontFamily:"'Manrope',sans-serif",fontWeight:700,fontSize:18,marginBottom:6}}>Export Report</p>
            <p style={{fontSize:13,color:"#6b7280",lineHeight:1.7}}>Generate a full report for the selected date range: <strong>{RANGES.find(r=>r.value===range)?.label}</strong></p>
          </div>
          <div style={{background:"#f8f9fc",borderRadius:12,padding:"16px 20px",marginBottom:22,display:"grid",gap:10}}>
            {[
              ["📈 Revenue",fmt(summary?.totalRevenue||0)],
              ["💰 Profit",`${fmt(summary?.totalProfit||0)} (${summary?.profitMargin||0}% margin)`],
              ["🛒 Purchases",fmt(summary?.totalPurchaseCost||0)],
              ["⚠️ Low Stock",`${summary?.lowStockItems||0} items`],
              ["📦 Products",`${summary?.totalProducts||0} total`],
            ].map(([l,v])=>(
              <div key={l} style={{display:"flex",justifyContent:"space-between",fontSize:13,borderBottom:"1px solid #e9eaf0",paddingBottom:8}}>
                <span style={{color:"#6b7280"}}>{l}</span><strong>{v}</strong>
              </div>
            ))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <button className="btn btn-ghost" onClick={exportCSV} style={{padding:"12px",fontSize:13.5,justifyContent:"center"}}>⬇ Export CSV</button>
            <button className="btn btn-primary" onClick={exportPDF} style={{padding:"12px",fontSize:13.5}}>🖨 Download PDF</button>
          </div>
        </div>
      )}

      </>}
    </div>
  );
}

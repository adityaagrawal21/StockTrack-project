import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../utils/api";
import { errMsg } from "../utils/helpers";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function Settings() {
  const { user, updateUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const initTab = params.get("tab") || "profile";

  const [sect, setSect] = useState(initTab);
  const [profile, setProfile] = useState({ name: user?.name||"", email: user?.email||"", phone: user?.phone||"" });
  const [pw, setPw] = useState({ old:"", np:"", cp:"" });
  const [pwErr, setPwErr] = useState(""); const [pwOk, setPwOk] = useState(false);
  const [notif, setNotif] = useState({ lowStock:true, purchase:true, sales:true });
  const [inv, setInv] = useState({ minStock:10, unit:"pcs" });
  const [biz, setBiz] = useState({ storeName:"StockTrack Pvt. Ltd.", currency:"₹", gst:18, address:"" });
  const [pending, setPending] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.role === "admin") {
      api.get("/users?status=pending").then(r => setPending(r.data.users)).catch(()=>{});
    }
  }, [sect]);

  useEffect(() => { setSect(initTab); }, [initTab]);

  const saveProfile = async () => {
    setSaving(true);
    try {
      const { data } = await api.put("/auth/me", { name:profile.name, email:profile.email, phone:profile.phone });
      updateUser(data.user);
      toast.success("Profile updated!");
    } catch(e) { toast.error(errMsg(e)); }
    finally { setSaving(false); }
  };

  const savePw = async () => {
    setPwErr(""); setPwOk(false);
    if (!pw.old) { setPwErr("Enter current password."); return; }
    if (pw.np.length < 6) { setPwErr("New password min 6 characters."); return; }
    if (pw.np !== pw.cp) { setPwErr("Passwords don't match."); return; }
    setSaving(true);
    try {
      await api.put("/auth/change-password", { currentPassword:pw.old, newPassword:pw.np });
      setPwOk(true); setPw({old:"",np:"",cp:""});
      toast.success("Password changed!");
    } catch(e) { setPwErr(errMsg(e)); }
    finally { setSaving(false); }
  };

  const approveUser = async (id) => {
    try { await api.patch(`/users/${id}/approve`); setPending(p=>p.filter(u=>u._id!==id)); toast.success("User approved!"); }
    catch(e) { toast.error(errMsg(e)); }
  };
  const rejectUser = async (id) => {
    try { await api.patch(`/users/${id}/reject`); setPending(p=>p.filter(u=>u._id!==id)); toast.success("User rejected."); }
    catch(e) { toast.error(errMsg(e)); }
  };

  const T = ({on, onChange}) => (
    <label className="toggle" style={{cursor:"pointer"}}>
      <input type="checkbox" checked={on} onChange={e=>onChange(e.target.checked)}/>
      <span className="toggle-slider"/>
    </label>
  );

  // Role-based sections
  const SECTS = [
    { id:"profile", ico:"👤", lbl:"Profile" },
    { id:"security", ico:"🔐", lbl:"Security & Password" },
    ...(user?.role!=="staff"?[{ id:"notifications", ico:"🔔", lbl:"Notifications" }]:[{ id:"notifications", ico:"🔔", lbl:"Notifications" }]),
    ...(user?.role==="admin"||user?.role==="manager"?[{ id:"inventory", ico:"📦", lbl:"Inventory Defaults" }]:[]),
    ...(user?.role==="admin"?[
      { id:"business", ico:"🏢", lbl:"Business Settings" },
      { id:"approvals", ico:"✅", lbl:`User Approvals${pending.length>0?` (${pending.length})`:""}` },
    ]:[]),
  ];

  const SCard = ({title,sub,children}) => (
    <div className="card" style={{marginBottom:16}}>
      <div style={{marginBottom:16}}>
        <p style={{fontFamily:"'Manrope',sans-serif",fontWeight:700,fontSize:16,color:"#111827"}}>{title}</p>
        {sub && <p style={{fontSize:12,color:"#6b7280",marginTop:3}}>{sub}</p>}
      </div>
      {children}
    </div>
  );

  return (
    <div className="settings-layout">
      {/* Left nav */}
      <div className="settings-nav">
        {SECTS.map(s=>(
          <button key={s.id} onClick={()=>{setSect(s.id);navigate(`/settings?tab=${s.id}`,{replace:true});}} className={`settings-item${sect===s.id?" active":""}`}>
            <span style={{fontSize:17}}>{s.ico}</span>{s.lbl}
          </button>
        ))}
      </div>

      {/* Content */}
      <div>
        {/* PROFILE */}
        {sect==="profile" && (
          <SCard title="Profile Information" sub="Your personal details (read-only username)">
            <div style={{background:"#f8f9fc",border:"1px solid #e9eaf0",borderRadius:10,padding:"12px 14px",marginBottom:16,display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:46,height:46,borderRadius:12,background:"linear-gradient(135deg,#6366f1,#818cf8)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Manrope',sans-serif",fontWeight:800,fontSize:18,color:"#fff",flexShrink:0}}>
                {user?.name?.[0]}
              </div>
              <div>
                <p style={{fontWeight:700,fontSize:14,color:"#111827"}}>@{user?.username}</p>
                <span className={`badge badge-${user?.role}`}>{user?.role}</span>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:13}}>
              <div style={{gridColumn:"1/-1"}}>
                <label className="field-label">Full Name</label>
                <input className="inp" value={profile.name} onChange={e=>setProfile(p=>({...p,name:e.target.value}))}/>
              </div>
              <div>
                <label className="field-label">Email Address</label>
                <input className="inp" type="email" value={profile.email} onChange={e=>setProfile(p=>({...p,email:e.target.value}))}/>
              </div>
              <div>
                <label className="field-label">Phone (optional)</label>
                <input className="inp" value={profile.phone} onChange={e=>setProfile(p=>({...p,phone:e.target.value}))}/>
              </div>
            </div>
            <div style={{display:"flex",justifyContent:"flex-end",marginTop:16}}>
              <button className="btn btn-primary" onClick={saveProfile} disabled={saving}>{saving?"Saving…":"Save Profile"}</button>
            </div>
          </SCard>
        )}

        {/* SECURITY */}
        {sect==="security" && (
          <SCard title="Change Password" sub="Use a strong password you don't use elsewhere">
            <div style={{display:"grid",gap:13}}>
              <div>
                <label className="field-label">Current Password</label>
                <input className="inp" type="password" placeholder="••••••••" value={pw.old} onChange={e=>setPw(p=>({...p,old:e.target.value}))}/>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:13}}>
                <div>
                  <label className="field-label">New Password</label>
                  <input className="inp" type="password" placeholder="Min. 6 chars" value={pw.np} onChange={e=>setPw(p=>({...p,np:e.target.value}))}/>
                </div>
                <div>
                  <label className="field-label">Confirm Password</label>
                  <input className="inp" type="password" placeholder="Repeat" value={pw.cp} onChange={e=>setPw(p=>({...p,cp:e.target.value}))}/>
                </div>
              </div>
            </div>
            {pwErr && <div className="alert-error" style={{marginTop:12}}>{pwErr}</div>}
            {pwOk  && <div className="alert-success" style={{marginTop:12}}>✅ Password changed successfully!</div>}
            <div style={{textAlign:"right",marginTop:14}}>
              <button className="btn btn-primary" onClick={savePw} disabled={saving}>{saving?"Updating…":"Update Password"}</button>
            </div>
          </SCard>
        )}

        {/* NOTIFICATIONS */}
        {sect==="notifications" && (
          <SCard title="Notification Preferences" sub="Choose which alerts you want to receive">
            {[
              ["Low Stock Alerts","Get alerted when items fall below reorder level","lowStock"],
              ["Purchase Notifications","Alert when a purchase order is created","purchase"],
              ["Sales Notifications","Alert when a sale is recorded","sales"],
            ].map(([l,sub,k])=>(
              <div key={k} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 0",borderBottom:"1px solid #f3f4f8"}}>
                <div>
                  <p style={{fontSize:13,fontWeight:600,color:"#111827"}}>{l}</p>
                  <p style={{fontSize:12,color:"#6b7280",marginTop:2}}>{sub}</p>
                </div>
                <T on={notif[k]} onChange={v=>setNotif(p=>({...p,[k]:v}))}/>
              </div>
            ))}
            <div style={{textAlign:"right",marginTop:14}}>
              <button className="btn btn-primary" onClick={()=>toast.success("Preferences saved!")}>Save Preferences</button>
            </div>
          </SCard>
        )}

        {/* INVENTORY DEFAULTS */}
        {(sect==="inventory") && (user?.role==="admin"||user?.role==="manager") && (
          <SCard title="Inventory Defaults" sub="Default thresholds applied to new products">
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:13}}>
              <div>
                <label className="field-label">Default Min Stock Level</label>
                <input className="inp" type="number" min="1" value={inv.minStock} onChange={e=>setInv(p=>({...p,minStock:Number(e.target.value)}))}/>
              </div>
              <div>
                <label className="field-label">Default Unit</label>
                <select className="inp" value={inv.unit} onChange={e=>setInv(p=>({...p,unit:e.target.value}))}>
                  <option value="pcs">pcs (Pieces)</option>
                  <option value="boxes">Boxes</option>
                  <option value="kg">kg</option>
                  <option value="litres">Litres</option>
                  <option value="sets">Sets</option>
                </select>
              </div>
            </div>
            <div className="alert-info" style={{marginTop:14}}>
              ℹ️ Items with quantity ≤ <strong>{inv.minStock} {inv.unit}</strong> will be flagged as low stock.
            </div>
            <div style={{textAlign:"right",marginTop:14}}>
              <button className="btn btn-primary" onClick={()=>toast.success("Inventory defaults saved!")}>Save</button>
            </div>
          </SCard>
        )}

        {/* BUSINESS */}
        {sect==="business" && user?.role==="admin" && (
          <SCard title="Business Settings" sub="Company and financial configuration">
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:13}}>
              <div style={{gridColumn:"1/-1"}}>
                <label className="field-label">Company Name</label>
                <input className="inp" value={biz.storeName} onChange={e=>setBiz(p=>({...p,storeName:e.target.value}))}/>
              </div>
              <div>
                <label className="field-label">Currency</label>
                <select className="inp" value={biz.currency} onChange={e=>setBiz(p=>({...p,currency:e.target.value}))}>
                  <option value="₹">₹ Indian Rupee</option>
                  <option value="$">$ US Dollar</option>
                  <option value="€">€ Euro</option>
                  <option value="£">£ British Pound</option>
                </select>
              </div>
              <div>
                <label className="field-label">GST Rate (%)</label>
                <input className="inp" type="number" min="0" max="100" value={biz.gst} onChange={e=>setBiz(p=>({...p,gst:Number(e.target.value)}))}/>
              </div>
              <div style={{gridColumn:"1/-1"}}>
                <label className="field-label">Business Address</label>
                <input className="inp" value={biz.address} onChange={e=>setBiz(p=>({...p,address:e.target.value}))}/>
              </div>
            </div>
            <div style={{textAlign:"right",marginTop:14}}>
              <button className="btn btn-primary" onClick={()=>toast.success("Business settings saved!")}>Save Settings</button>
            </div>
          </SCard>
        )}

        {/* USER APPROVALS */}
        {sect==="approvals" && user?.role==="admin" && (
          <SCard title="Pending User Approvals" sub={`${pending.length} user${pending.length!==1?"s":""} waiting for access`}>
            {pending.length===0
              ? <p style={{color:"#059669",fontWeight:600,textAlign:"center",padding:"20px 0"}}>✅ No pending requests</p>
              : <div className="tbl-wrap" style={{border:"none"}}>
                <table>
                  <thead><tr><th>Name</th><th>Username</th><th>Role</th><th>Joined</th><th>Actions</th></tr></thead>
                  <tbody>
                    {pending.map(u=>(
                      <tr key={u._id}>
                        <td style={{fontWeight:600}}>{u.name}</td>
                        <td style={{fontFamily:"monospace",fontSize:12,color:"#6b7280"}}>@{u.username}</td>
                        <td><span className={`badge badge-${u.role}`}>{u.role}</span></td>
                        <td style={{fontSize:12,color:"#6b7280"}}>{new Date(u.createdAt).toLocaleDateString("en-IN")}</td>
                        <td>
                          <div style={{display:"flex",gap:6}}>
                            <button className="btn btn-success btn-xs" onClick={()=>approveUser(u._id)}>✓ Approve</button>
                            <button className="btn btn-danger btn-xs" onClick={()=>rejectUser(u._id)}>✗ Reject</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            }
          </SCard>
        )}
      </div>
    </div>
  );
}

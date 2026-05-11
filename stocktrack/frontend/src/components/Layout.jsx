import { useState, useRef, useEffect } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { initials } from "../utils/helpers";

const SIDEBAR_ADMIN = [
  { to:"/dashboard", ico:"⊞", lbl:"Dashboard" },
  { to:"/inventory",  ico:"📦", lbl:"Inventory" },
  { to:"/suppliers",  ico:"🏭", lbl:"Suppliers" },
  { to:"/users",      ico:"👥", lbl:"User Management", badge:true },
  { section:"OPERATIONS" },
  { to:"/purchases",  ico:"🛒", lbl:"Purchases" },
  { to:"/sales",      ico:"🏷️", lbl:"Sales" },
  { section:"ANALYTICS" },
  { to:"/reports",    ico:"📊", lbl:"Reports" },
];
const SIDEBAR_MANAGER = [
  { to:"/dashboard",ico:"⊞",lbl:"Dashboard" },
  { to:"/inventory",ico:"📦",lbl:"Inventory" },
  { section:"OPERATIONS" },
  { to:"/purchases",ico:"🛒",lbl:"Purchases" },
  { to:"/sales",    ico:"🏷️",lbl:"Sales" },
  { section:"ANALYTICS" },
  { to:"/reports",  ico:"📊",lbl:"Reports" },
];
const SIDEBAR_STAFF = [
  { to:"/inventory",ico:"📦",lbl:"Inventory" },
  { section:"OPERATIONS" },
  { to:"/purchases",ico:"🛒",lbl:"Purchases" },
  { to:"/sales",    ico:"🏷️",lbl:"Sales" },
];

const PAGE_TITLES = {
  "/dashboard":"Dashboard","/inventory":"Inventory","/suppliers":"Suppliers",
  "/users":"User Management","/purchases":"Purchases","/sales":"Sales",
  "/reports":"Reports","/settings":"Settings",
};

export default function Layout() {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [lowCount, setLowCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const dropRef = useRef(null);
  const notifRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const nav = user?.role==="admin"?SIDEBAR_ADMIN:user?.role==="manager"?SIDEBAR_MANAGER:SIDEBAR_STAFF;
  const title = PAGE_TITLES[location.pathname] || "";

  // Load notification counts
  useEffect(() => {
    const loadCounts = async () => {
      try {
        const { default: api } = await import("../utils/api.js");
        const [lowRes] = await Promise.all([api.get("/reports/low-stock")]);
        const lc = lowRes.data.products?.length || 0;
        setLowCount(lc);

        const notifs = [];
        if (user?.role === "admin") {
          const pendRes = await api.get("/users/pending-count");
          const pc = pendRes.data.count || 0;
          setPendingCount(pc);
          if (pc > 0) notifs.push({ id:"pend", type:"warn", msg:`${pc} user${pc>1?"s":""} awaiting approval`, action:()=>navigate("/users") });
        }
        lowRes.data.products?.slice(0,5).forEach(p => {
          notifs.push({ id:p._id, type:"err", msg:`${p.name}: only ${p.quantity} left (reorder: ${p.reorderLevel})`, action:()=>navigate(`/purchases?productId=${p._id}`) });
        });
        setNotifications(notifs);
      } catch {}
    };
    loadCounts();
  }, [location.pathname]);

  // Close dropdowns on outside click
  useEffect(() => {
    const h = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const totalNotifs = notifications.length;

  return (
    <div className="app-shell">
      {/* ── SIDEBAR ── */}
      <aside className={`sidebar${collapsed?" collapsed":""}`} style={{display:"flex",flexDirection:"column",height:"100vh",position:"sticky",top:0}}>
        <div className="sb-brand" onClick={()=>setCollapsed(!collapsed)}>
          <div className="sb-logo">📦</div>
          {!collapsed && <span className="sb-name">Stock<span>Track</span></span>}
        </div>

        {/* Nav — scrollable area */}
        <nav style={{padding:"8px 0",flex:1,overflowY:"auto",overflowX:"hidden"}}>
          {nav.map((item,i) => {
            if (item.section) return !collapsed ? <div key={i} className="sb-section">{item.section}</div> : <div key={i} style={{height:8}}/>;
            return (
              <NavLink key={item.to} to={item.to} className={({isActive})=>`nav-item${isActive?" active":""}`} title={collapsed?item.lbl:""}>
                <span className="nav-ico">{item.ico}</span>
                {!collapsed && <span style={{flex:1}}>{item.lbl}</span>}
                {!collapsed && item.badge && pendingCount>0 && (
                  <span className="nav-badge">{pendingCount}</span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom — always visible */}
        <div style={{padding:"8px 6px 16px",flexShrink:0,borderTop:"1px solid rgba(255,255,255,.06)"}}>
          {!collapsed && (
            <div style={{padding:"8px 10px",marginBottom:4,fontSize:11,color:"rgba(255,255,255,.25)",letterSpacing:".04em",textTransform:"uppercase",fontWeight:600}}>
              {user?.role}
            </div>
          )}
          <div className={`nav-item${collapsed?" ":" "}`} style={{color:"rgba(255,255,255,.35)",fontSize:collapsed?14:12,gap:collapsed?0:8,justifyContent:collapsed?"center":"flex-start",padding:collapsed?"10px 0":"8px 12px",cursor:"default"}}>
            {!collapsed && <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1}}>{user?.name}</span>}
            {collapsed && <span>{initials(user?.name)}</span>}
          </div>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="main-content">
        {/* Topbar */}
        <div className="topbar" style={{gap:12}}>
          <span className="topbar-title">{title}</span>

          <div style={{display:"flex",alignItems:"center",gap:10,marginLeft:"auto"}}>
            {/* Notification bell */}
            <div ref={notifRef} style={{position:"relative"}}>
              <button onClick={()=>setNotifOpen(!notifOpen)} style={{width:38,height:38,borderRadius:10,background:"#f4f5f9",border:"1.5px solid #e5e7eb",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:17,position:"relative"}}>
                🔔
                {totalNotifs>0 && <span style={{position:"absolute",top:-4,right:-4,width:17,height:17,borderRadius:"50%",background:"#ef4444",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,color:"#fff",border:"2px solid #f0f2f8"}}>{totalNotifs}</span>}
              </button>
              {notifOpen && (
                <div style={{position:"absolute",top:46,right:0,background:"#fff",borderRadius:14,boxShadow:"0 12px 40px rgba(0,0,0,.15)",border:"1px solid #e5e7eb",width:320,zIndex:200,overflow:"hidden"}}>
                  <div style={{padding:"14px 16px",borderBottom:"1px solid #f3f4f8",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <p style={{fontFamily:"'Manrope',sans-serif",fontWeight:700,fontSize:14}}>Notifications</p>
                    <span style={{fontSize:11,color:"#9ca3af"}}>{totalNotifs} alert{totalNotifs!==1?"s":""}</span>
                  </div>
                  {notifications.length===0
                    ? <p style={{padding:"20px 16px",fontSize:13,color:"#9ca3af",textAlign:"center"}}>All clear! No alerts.</p>
                    : notifications.map(n=>(
                      <div key={n.id} onClick={()=>{n.action?.();setNotifOpen(false);}} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"12px 16px",borderBottom:"1px solid #f9fafb",cursor:"pointer",transition:"background .15s"}}
                        onMouseEnter={e=>e.currentTarget.style.background="#fafbff"}
                        onMouseLeave={e=>e.currentTarget.style.background="#fff"}>
                        <span style={{fontSize:15,marginTop:1}}>{n.type==="err"?"🔴":"🟡"}</span>
                        <p style={{fontSize:12,color:"#374151",lineHeight:1.5}}>{n.msg}</p>
                      </div>
                    ))
                  }
                </div>
              )}
            </div>

            {/* User avatar + dropdown */}
            <div ref={dropRef} style={{position:"relative"}}>
              <button onClick={()=>setDropOpen(!dropOpen)} className="top-avatar" style={{cursor:"pointer",border:"none"}}>
                {initials(user?.name)}
              </button>
              {dropOpen && (
                <div style={{position:"absolute",top:46,right:0,background:"#fff",borderRadius:14,boxShadow:"0 12px 40px rgba(0,0,0,.15)",border:"1px solid #e5e7eb",width:230,zIndex:200,overflow:"hidden"}}>
                  {/* Header */}
                  <div style={{padding:"14px 16px",borderBottom:"1px solid #f3f4f8",background:"linear-gradient(135deg,#eef0ff,#f8f9ff)"}}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <div style={{width:38,height:38,borderRadius:10,background:"linear-gradient(135deg,#6366f1,#818cf8)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Manrope',sans-serif",fontWeight:800,fontSize:15,color:"#fff"}}>{initials(user?.name)}</div>
                      <div>
                        <p style={{fontWeight:700,fontSize:13,color:"#111827"}}>{user?.name}</p>
                        <span className={`badge badge-${user?.role}`} style={{fontSize:10}}>{user?.role}</span>
                      </div>
                    </div>
                  </div>
                  {/* Menu items */}
                  {[
                    {ico:"👤",lbl:"Profile",sub:"View your details",to:"/settings?tab=profile"},
                    {ico:"⚙️",lbl:"Account Settings",sub:"Manage preferences",to:"/settings?tab=profile"},
                  ].map(item=>(
                    <button key={item.lbl} onClick={()=>{navigate(item.to);setDropOpen(false);}} style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"11px 16px",border:"none",background:"transparent",cursor:"pointer",transition:"background .15s",textAlign:"left"}}
                      onMouseEnter={e=>e.currentTarget.style.background="#fafbff"}
                      onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                      <span style={{fontSize:17}}>{item.ico}</span>
                      <div>
                        <p style={{fontSize:13,fontWeight:600,color:"#111827"}}>{item.lbl}</p>
                        <p style={{fontSize:11,color:"#9ca3af",marginTop:1}}>{item.sub}</p>
                      </div>
                    </button>
                  ))}
                  <div style={{height:1,background:"#f3f4f8",margin:"2px 0"}}/>
                  <button onClick={()=>{logout();setDropOpen(false);}} style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"11px 16px",border:"none",background:"transparent",cursor:"pointer",transition:"background .15s"}}
                    onMouseEnter={e=>e.currentTarget.style.background="#fff1f2"}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <span style={{fontSize:17}}>🚪</span>
                    <p style={{fontSize:13,fontWeight:600,color:"#e11d48"}}>Sign Out</p>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Page content */}
        <div className="page-body">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

import type { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Bell, CalendarDays, CircleHelp, FileText, Inbox, LayoutDashboard, LogOut, Menu, Search, Sparkles } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const nav = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/inbox", label: "Universal Inbox", icon: Inbox },
  { to: "/documents", label: "Documents", icon: FileText },
  { to: "/events", label: "Life Events", icon: CalendarDays },
  { to: "/reminders", label: "Reminders", icon: Bell },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const initials = (user?.user_metadata?.full_name || user?.email || "L").slice(0, 1).toUpperCase();
  async function logout() { await signOut(); navigate("/login"); }
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-inline sidebar-brand"><div className="brand-mark small"><Sparkles size={17} /></div><strong>LIFEHUB <span>AI</span></strong></div>
        <div className="workspace-label">WORKSPACE</div>
        <nav>{nav.map(item => <NavLink key={item.to} to={item.to} className={({isActive}) => isActive ? "nav-item active" : "nav-item"}><item.icon size={18} /><span>{item.label}</span></NavLink>)}</nav>
        <div className="sidebar-bottom">
          <div className="help-link"><CircleHelp size={17} /> Help & support</div>
          <button className="profile-row" onClick={logout}><div className="avatar">{initials}</div><div className="profile-text"><strong>{user?.user_metadata?.full_name || "Your account"}</strong><span>{user?.email}</span></div><LogOut size={16} /></button>
        </div>
      </aside>
      <main className="main-area">
        <header className="topbar"><div className="mobile-brand"><Menu size={19}/><strong>LIFEHUB <span>AI</span></strong></div><div className="search-box"><Search size={16}/><span>Search your life hub</span><kbd>⌘ K</kbd></div><button className="icon-button" aria-label="Notifications"><Bell size={18}/></button><div className="avatar top-avatar">{initials}</div></header>
        <div className="page-content">{children}</div>
      </main>
    </div>
  );
}
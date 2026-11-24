import { ArrowUpRight, CalendarDays, CheckCircle2, Clock3, FileText, Inbox, Plus, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();
  const name = user?.user_metadata?.full_name?.split(" ")[0] || "there";
  const today = new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric" }).format(new Date());
  return (
    <>
      <div className="page-heading"><div><div className="eyebrow">{today.toUpperCase()}</div><h1>Good morning, {name} <span className="wave">✦</span></h1><p className="muted">Here's your personal space. Let's make today feel a little lighter.</p></div><Link to="/inbox" className="primary-button compact"><Plus size={17}/> Add to inbox</Link></div>
      <section className="welcome-card"><div className="welcome-copy"><div className="welcome-kicker"><Sparkles size={15}/> YOUR LIFE, IN ONE PLACE</div><h2>Clarity for everything<br/>life puts on your plate.</h2><p>Capture the details. We'll help you turn them into next steps.</p><Link to="/inbox" className="text-link light">Open your inbox <ArrowUpRight size={16}/></Link></div><div className="welcome-art"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="orb-core"><Sparkles size={31}/></div><div className="float-card float-top"><CheckCircle2 size={15}/> One place to begin</div><div className="float-card float-bottom"><Clock3 size={15}/> Your next step, made clear</div></div></section>
      <div className="section-heading"><div><h2>Your overview</h2><p className="muted">A quick look at what's happening.</p></div></div>
      <section className="stats-grid">
        <div className="stat-card"><div className="stat-top"><span>Inbox items</span><Inbox size={18}/></div><strong>—</strong><small>Things you've captured</small><Link to="/inbox">View inbox <ArrowUpRight size={13}/></Link></div>
        <div className="stat-card"><div className="stat-top"><span>Upcoming events</span><CalendarDays size={18}/></div><strong>—</strong><small>Important dates ahead</small><Link to="/events">View events <ArrowUpRight size={13}/></Link></div>
        <div className="stat-card"><div className="stat-top"><span>Reminders</span><Clock3 size={18}/></div><strong>—</strong><small>Actions to keep in sight</small><Link to="/reminders">View reminders <ArrowUpRight size={13}/></Link></div>
      </section>
      <section className="content-grid">
        <div className="surface-card"><div className="card-heading"><div><h3>Start with your inbox</h3><p className="muted">Capture something you don't want to forget.</p></div><Inbox size={19}/></div><div className="empty-state"><div className="empty-icon"><FileText size={22}/></div><strong>Your inbox is ready</strong><p>Add a bill, booking, document or any detail you want LIFEHUB to help organize.</p><Link className="primary-button compact" to="/inbox"><Plus size={16}/> Add your first item</Link></div></div>
        <div className="surface-card assistant-card"><div className="assistant-icon"><Sparkles size={19}/></div><div className="eyebrow">LIFEHUB ASSISTANT</div><h3>Your life, a little more organized.</h3><p className="muted">AI-powered extraction and proactive suggestions are coming next. You'll stay in control of every action.</p><div className="coming-soon">AI assistant · Coming next</div></div>
      </section>
    </>
  );
}
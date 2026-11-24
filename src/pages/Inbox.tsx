import { type FormEvent, useEffect, useState } from "react";
import { FilePlus2, Inbox as InboxIcon, Plus, Search } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

type Item = { id: string; title: string; source_type: string; status: string; created_at: string };
export default function Inbox() {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [title, setTitle] = useState("");
  const [source, setSource] = useState("manual");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function load() {
    if (!supabase || !user) return;
    const { data, error: loadError } = await supabase.from("life_items").select("id,title,source_type,status,created_at").order("created_at", { ascending: false });
    if (loadError) setError(loadError.message); else setItems((data || []) as Item[]);
  }
  useEffect(() => { void load(); }, [user]);
  async function add(event: FormEvent) {
    event.preventDefault(); setError("");
    if (!supabase || !user) return;
    setBusy(true);
    const { error: insertError } = await supabase.from("life_items").insert({ user_id: user.id, title, source_type: source });
    setBusy(false);
    if (insertError) setError(insertError.message);
    else { setTitle(""); await load(); }
  }
  return <><div className="page-heading"><div><div className="eyebrow">CAPTURE & ORGANIZE</div><h1>Universal Inbox</h1><p className="muted">One place for the details you want to keep track of.</p></div></div>
    <div className="surface-card form-card"><div className="card-heading"><div><h3>Capture something</h3><p className="muted">Start with a title. More intelligent capture comes next.</p></div><FilePlus2 size={20}/></div><form className="capture-form" onSubmit={add}><input value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Renew car insurance in September" required maxLength={180}/><select value={source} onChange={e=>setSource(e.target.value)}><option value="manual">Manual note</option><option value="bill">Bill</option><option value="booking">Booking</option><option value="receipt">Receipt</option><option value="document">Document</option><option value="other">Other</option></select><button className="primary-button compact" disabled={busy}><Plus size={16}/>{busy ? "Adding…" : "Add item"}</button></form>{error && <div className="notice">{error}</div>}</div>
    <div className="list-toolbar"><div><h2>Your captured items</h2><p className="muted">{items.length} items</p></div><div className="search-box small-search"><Search size={15}/><span>Your inbox</span></div></div>
    <div className="surface-card list-card">{items.length ? items.map(item=><div className="list-row" key={item.id}><div className="list-icon"><InboxIcon size={18}/></div><div className="list-main"><strong>{item.title}</strong><span>{item.source_type} · {new Date(item.created_at).toLocaleDateString()}</span></div><span className="status-pill">{item.status}</span></div>) : <div className="empty-state"><div className="empty-icon"><InboxIcon size={22}/></div><strong>Nothing here yet</strong><p>When you add something, it will appear here.</p></div>}</div>
  </>;
}
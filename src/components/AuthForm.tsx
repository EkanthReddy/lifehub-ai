import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { supabase } from "../lib/supabase";

export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  async function submit(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    if (!supabase) {
      setMessage("Connect Supabase by adding the Netlify environment variables first.");
      return;
    }
    setBusy(true);
    const result = mode === "signup"
      ? await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } })
      : await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (result.error) setMessage(result.error.message);
    else if (mode === "signup" && !result.data.session) setMessage("Account created. Check your email to confirm your account, then sign in.");
    else navigate("/dashboard");
  }

  return (
    <main className="auth-shell">
      <section className="auth-brand">
        <div className="brand-mark"><Sparkles size={22} /></div>
        <div className="eyebrow">YOUR PERSONAL LIFE ADMINISTRATION AGENT</div>
        <h1>Make room for<br /><span>what matters.</span></h1>
        <p>Bring your important information, dates and everyday responsibilities into one calm, organized space.</p>
        <div className="brand-note"><span className="pulse" /> A clearer picture of your day starts here.</div>
      </section>
      <section className="auth-panel">
        <div className="auth-card">
          <div className="brand-inline"><div className="brand-mark small"><Sparkles size={17} /></div><strong>LIFEHUB <span>AI</span></strong></div>
          <h2>{mode === "login" ? "Welcome back" : "Create your account"}</h2>
          <p className="muted">{mode === "login" ? "Sign in to pick up where you left off." : "Start organizing your life with more clarity."}</p>
          <form onSubmit={submit}>
            {mode === "signup" && <label>Full name<input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" autoComplete="name" required /></label>}
            <label>Email address<input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" required /></label>
            <label>Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters" minLength={8} autoComplete={mode === "login" ? "current-password" : "new-password"} required /></label>
            {message && <div className="notice">{message}</div>}
            <button className="primary-button" disabled={busy}>{busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"} <ArrowRight size={17} /></button>
          </form>
          <p className="switch-auth">{mode === "login" ? "New to LIFEHUB AI?" : "Already have an account?"} <Link to={mode === "login" ? "/signup" : "/login"}>{mode === "login" ? "Create an account" : "Sign in"}</Link></p>
          <p className="fine-print">By continuing, you agree to use LIFEHUB AI responsibly. Your private information should only be added after reviewing our privacy and security practices.</p>
        </div>
      </section>
    </main>
  );
}
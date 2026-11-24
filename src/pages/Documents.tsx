import { ChangeEvent, useEffect, useState } from "react";
import { FileText, FileUp, Loader2, Sparkles, CalendarDays, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

type KeyDate = { label: string; date: string; description?: string };
type Amount = { label: string; value: string };
type Extraction = {
  document_type: string;
  title: string;
  summary: string;
  key_dates: KeyDate[];
  amounts: Amount[];
  suggested_actions: string[];
};
type DocumentRow = { id: string; file_name: string; storage_path: string; mime_type: string | null; created_at: string };

const BUCKET = "lifehub-documents";
const MAX_BYTES = 10 * 1024 * 1024;

export default function Documents() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [extraction, setExtraction] = useState<Extraction | null>(null);
  const [selectedDates, setSelectedDates] = useState<number[]>([]);
  const [saved, setSaved] = useState(false);

  async function loadDocuments() {
    if (!supabase) return;
    const { data, error: listError } = await supabase
      .from("documents")
      .select("id,file_name,storage_path,mime_type,created_at")
      .order("created_at", { ascending: false });
    if (listError) setError(listError.message);
    else setDocuments((data || []) as DocumentRow[]);
  }

  useEffect(() => { void loadDocuments(); }, [user]);

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    setError(""); setMessage(""); setExtraction(null); setSaved(false);
    const chosen = event.target.files?.[0] || null;
    if (!chosen) { setFile(null); return; }
    if (chosen.type !== "application/pdf" && !chosen.name.toLowerCase().endsWith(".pdf")) {
      setError("For this first version, please upload a PDF document.");
      setFile(null); event.target.value = ""; return;
    }
    if (chosen.size > MAX_BYTES) {
      setError("The PDF must be 10 MB or smaller.");
      setFile(null); event.target.value = ""; return;
    }
    setFile(chosen);
  }

  async function uploadAndExtract() {
    setError(""); setMessage(""); setExtraction(null); setSaved(false);
    if (!supabase || !user || !file) return;
    setBusy(true);
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100);
    const storagePath = `${user.id}/${crypto.randomUUID()}-${safeName}`;
    try {
      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(storagePath, file, {
        contentType: "application/pdf", upsert: false
      });
      if (uploadError) throw uploadError;

      const { data: documentRow, error: insertError } = await supabase.from("documents").insert({
        user_id: user.id,
        file_name: file.name,
        storage_path: storagePath,
        mime_type: "application/pdf",
        size_bytes: file.size
      }).select("id,file_name,storage_path,mime_type,created_at").single();

      if (insertError) {
        await supabase.storage.from(BUCKET).remove([storagePath]);
        throw insertError;
      }

      const { data, error: functionError } = await supabase.functions.invoke("extract-document", {
        body: { storagePath, documentId: documentRow.id }
      });
      if (functionError) throw new Error(functionError.message || "Document extraction failed.");
      if (!data?.extraction) throw new Error(data?.error || "The AI did not return extracted document details.");

      setExtraction(data.extraction as Extraction);
      setSelectedDates((data.extraction.key_dates || []).map((_: KeyDate, index: number) => index));
      setMessage("Document uploaded. Review the extracted details below before saving any actions.");
      setFile(null);
      await loadDocuments();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong while processing the PDF.");
      await loadDocuments();
    } finally {
      setBusy(false);
    }
  }

  function toggleDate(index: number) {
    setSelectedDates(current => current.includes(index) ? current.filter(i => i !== index) : [...current, index]);
  }

  async function approveAndSave() {
    if (!supabase || !user || !extraction) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const { data: item, error: itemError } = await supabase.from("life_items").insert({
        user_id: user.id,
        title: extraction.title || extraction.document_type || "Processed document",
        source_type: "document",
        raw_text: extraction.summary || "",
        extracted_data: extraction,
        status: "processed"
      }).select("id").single();
      if (itemError) throw itemError;

      const chosen = selectedDates.map(i => extraction.key_dates[i]).filter(Boolean);
      for (const dateEntry of chosen) {
        // Store the extracted date as a life event. The user explicitly selected it above.
        const dateValue = new Date(`${dateEntry.date}T09:00:00`);
        if (Number.isNaN(dateValue.getTime())) continue;
        const { data: event, error: eventError } = await supabase.from("life_events").insert({
          user_id: user.id,
          life_item_id: item.id,
          title: dateEntry.label || extraction.title,
          description: dateEntry.description || extraction.summary,
          starts_at: dateValue.toISOString(),
          event_type: extraction.document_type || "document",
          status: "upcoming"
        }).select("id").single();
        if (eventError) throw eventError;

        const { error: reminderError } = await supabase.from("reminders").insert({
          user_id: user.id,
          life_item_id: item.id,
          life_event_id: event.id,
          title: `Reminder: ${dateEntry.label || extraction.title}`,
          remind_at: dateValue.toISOString(),
          status: "pending"
        });
        if (reminderError) throw reminderError;
      }
      setSaved(true);
      setMessage(`Saved the document details and ${chosen.length} selected date(s) as events with reminders.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save the approved details.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="page-heading">
        <div><div className="eyebrow">YOUR IMPORTANT INFORMATION</div><h1>Documents</h1><p className="muted">Upload a PDF, let LIFEHUB understand it, then approve the actions you want.</p></div>
      </div>

      <section className="surface-card form-card">
        <div className="card-heading"><div><h3>Upload a document</h3><p className="muted">PDF only · Maximum 10 MB · Private storage</p></div><FileUp size={21}/></div>
        <div className="upload-panel">
          <div className="upload-symbol"><FileText size={25}/></div>
          <div className="upload-copy"><strong>{file ? file.name : "Choose a PDF to get started"}</strong><span>{file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : "Bills, insurance policies, bookings, receipts and appointment letters"}</span></div>
          <label className="secondary-button">Choose PDF<input type="file" accept="application/pdf,.pdf" onChange={onFileChange} hidden /></label>
          <button className="primary-button compact" disabled={!file || busy || !supabase} onClick={uploadAndExtract}>{busy ? <><Loader2 size={15} className="spin"/> Processing…</> : <><Sparkles size={15}/> Upload & extract</>}</button>
        </div>
        {!supabase && <div className="notice">Supabase is not configured. Check the Netlify environment variables.</div>}
        {error && <div className="notice error-notice"><AlertCircle size={15}/>{error}</div>}
        {message && <div className="success-notice"><CheckCircle2 size={15}/>{message}</div>}
      </section>

      {extraction && (
        <section className="surface-card extraction-card">
          <div className="card-heading"><div><div className="eyebrow">AI EXTRACTION PREVIEW</div><h3>{extraction.title || "Extracted document details"}</h3><p className="muted">{extraction.document_type}</p></div><Sparkles size={21}/></div>
          <p className="summary-text">{extraction.summary}</p>
          {extraction.amounts?.length > 0 && <><h4>Detected amounts</h4><div className="detail-grid">{extraction.amounts.map((a,i)=><div className="detail-chip" key={i}><span>{a.label}</span><strong>{a.value}</strong></div>)}</div></>}
          <h4>Dates and deadlines</h4>
          {extraction.key_dates?.length ? extraction.key_dates.map((d,i)=><label className="date-choice" key={i}><input type="checkbox" checked={selectedDates.includes(i)} onChange={()=>toggleDate(i)}/><span><strong>{d.label}</strong><small>{d.date}{d.description ? ` · ${d.description}` : ""}</small></span><CalendarDays size={17}/></label>) : <p className="muted">No dates were confidently identified.</p>}
          {extraction.suggested_actions?.length > 0 && <><h4>Suggested next steps</h4><ul className="suggestion-list">{extraction.suggested_actions.map((a,i)=><li key={i}>{a}</li>)}</ul></>}
          <div className="approval-row"><span className="muted">Nothing is added to your timeline until you approve.</span><button className="primary-button compact" disabled={busy || saved} onClick={approveAndSave}>{saved ? "Saved" : busy ? "Saving…" : "Approve & save selected dates"}</button></div>
        </section>
      )}

      <button className="icon-button" onClick={loadDocuments} aria-label="Refresh documents"><RefreshCw size={16}/></button>
      <section className="surface-card list-card">
        {documents.length ? documents.map(doc=><div className="list-row" key={doc.id}><div className="list-icon"><FileText size={18}/></div><div className="list-main"><strong>{doc.file_name}</strong><span>{new Date(doc.created_at).toLocaleString()} · PDF</span></div><span className="status-pill">Uploaded</span></div>) : <div className="empty-state"><div className="empty-icon"><FileText size={22}/></div><strong>No documents uploaded yet</strong><p>Your private document library will appear here.</p></div>}
      </section>
    </>
  );
}

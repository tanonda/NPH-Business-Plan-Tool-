'use client';

import { ChangeEvent, useState } from 'react';

type ImportType = 'strategic-plan' | 'job-description';

type Preview = {
  sourceReference: string;
  characterCount: number;
  candidate: { code: string; title: string; purpose?: string; description?: string; status: string };
  text: string;
};

export function DocumentImportPanel({ canManage }: { canManage: boolean }) {
  const [type, setType] = useState<ImportType>('strategic-plan');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(commit: boolean) {
    if (!file) { setMessage('Choose a DOCX or PDF document first.'); return; }
    setLoading(true); setMessage('');
    const formData = new FormData();
    formData.append('file', file); formData.append('type', type); formData.append('commit', String(commit));
    try {
      const response = await fetch('/api/import-document', { method: 'POST', body: formData });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Document import failed.');
      if (commit) { setPreview(null); setMessage(`Imported ${data.sourceReference || file.name} as a draft record.`); }
      else { setPreview(data); setMessage(`Extracted ${data.characterCount} characters from ${data.sourceReference}. Review the draft candidate before importing.`); }
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Document import failed.'); }
    finally { setLoading(false); }
  }

  function onFileChange(event: ChangeEvent<HTMLInputElement>) { setFile(event.target.files?.[0] || null); setPreview(null); setMessage(''); }

  return <section className="panel document-import-panel">
    <div className="panel-title-row"><div><p className="eyebrow">Source-controlled intake</p><h2>Import a strategy or JD document</h2><p className="muted">Extract text from a DOCX or PDF, review the proposed draft, then import it for normal governance review.</p></div></div>
    <div className="grid cols-3">
      <label>Document type<select value={type} onChange={(event) => { setType(event.target.value as ImportType); setPreview(null); }}><option value="strategic-plan">Strategic plan</option><option value="job-description">Job description</option></select></label>
      <label className="wide-field">DOCX or PDF file<input type="file" accept=".docx,.pdf,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={onFileChange} disabled={!canManage} /></label>
      <div className="actions"><button type="button" onClick={() => void submit(false)} disabled={!canManage || !file || loading}>Extract preview</button>{preview && <button type="button" className="secondary" onClick={() => void submit(true)} disabled={loading}>Import as draft</button>}</div>
    </div>
    {message && <p className="notice" role="status">{message}</p>}
    {preview && <div className="record-detail"><div className="detail-body"><p><strong>Candidate:</strong> {preview.candidate.code} · {preview.candidate.title} · {preview.candidate.status}</p><p className="muted">Source: {preview.sourceReference} · {preview.characterCount} extracted characters</p><label>Extracted text<textarea value={preview.text} readOnly /></label></div></div>}
  </section>;
}

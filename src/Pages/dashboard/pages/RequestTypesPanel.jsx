import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, ClipboardList, Pencil, Plus, RefreshCw, Trash2, X } from 'lucide-react';
import { requestTypesApi } from '../../../services/dashboard/request-types.api.js';

const emptyForm = { name: '', details_to_collect: '', next_step_text: '' };
const rowsFrom = (data) => Array.isArray(data) ? data :
  (Array.isArray(data?.items) ? data.items : Array.isArray(data?.request_types) ? data.request_types : []);
const errorText = (error) => (Array.isArray(error?.errors) && error.errors.length
  ? error.errors.map(({ field, message }) => `${field ? `${field}: ` : ''}${message}`).join(' · ')
  : error?.message || 'Request failed.');

export default function RequestTypesPanel({ readOnly = false, notify }) {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [includeArchived, setIncludeArchived] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const response = await requestTypesApi.list(includeArchived);
      setTypes(rowsFrom(response));
      setError('');
    } catch (failure) { setError(errorText(failure)); }
    finally { setLoading(false); }
  }, [includeArchived]);
  useEffect(() => { reload(); }, [reload]);

  const startCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setFieldErrors({});
    setShowForm(true);
  };
  const startEdit = async (item) => {
    setBusy(true);
    try {
      // GET detail ensures version is fresh when opening an edit.
      const current = await requestTypesApi.get(item.id);
      if (current.archived_at) throw new Error('Archived request types are read-only.');
      setEditing(current);
      setForm({ name: current.name || '', details_to_collect: current.details_to_collect || '', next_step_text: current.next_step_text || '' });
      setFieldErrors({});
      setShowForm(true);
    } catch (failure) { notify(errorText(failure), 'error'); }
    finally { setBusy(false); }
  };

  const save = async (event) => {
    event.preventDefault();
    if (readOnly || busy) return;
    const body = {
      name: form.name.trim(),
      details_to_collect: form.details_to_collect.trim(),
      next_step_text: form.next_step_text.trim(),
    };
    const errors = {};
    if (body.name.length < 2 || body.name.length > 100) errors.name = 'Use 2–100 characters.';
    if (body.details_to_collect.length < 2 || body.details_to_collect.length > 1000) errors.details_to_collect = 'Use 2–1,000 characters.';
    if (body.next_step_text.length < 2 || body.next_step_text.length > 500) errors.next_step_text = 'Use 2–500 characters.';
    const detailCount = body.details_to_collect.split(/[,،;\n•]+/).map((part) => part.trim()).filter(Boolean).length;
    if (detailCount > 10) errors.details_to_collect = 'Maximum 10 details. Separate them using commas.';
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;
    setBusy(true);
    try {
      const saved = editing
        ? await requestTypesApi.update(editing.id, { ...body, expected_version: editing.version })
        : await requestTypesApi.create(body);
      setTypes((prev) => {
        const filtered = prev.filter((item) => item.id !== saved.id);
        return [...filtered, saved].sort((a, b) => String(a.name).localeCompare(String(b.name)));
      });
      setShowForm(false);
      setEditing(null);
      setForm({ ...emptyForm });
      notify(editing ? 'Request type updated.' : 'Request type created.', 'success');
      await reload();
    } catch (failure) {
      const fieldErrorMap = {};
      (failure?.errors || []).forEach((entry) => { if (entry.field) fieldErrorMap[entry.field] = entry.message; });
      setFieldErrors(fieldErrorMap);
      if (failure?.code === 'REQUEST_TYPE_409_STALE' && editing) {
        try {
          const fresh = await requestTypesApi.get(editing.id);
          setEditing(fresh);
          setForm({ name: fresh.name || '', details_to_collect: fresh.details_to_collect || '', next_step_text: fresh.next_step_text || '' });
          notify('Another change was saved. Latest values loaded; review and Save again.', 'error');
        } catch { notify(errorText(failure), 'error'); }
      } else notify(errorText(failure), 'error');
    } finally { setBusy(false); }
  };

  const toggle = async (item) => {
    if (readOnly || busy) return;
    setBusy(true);
    try {
      const saved = await requestTypesApi.update(item.id, { expected_version: item.version, is_enabled: item.is_enabled === false });
      setTypes((prev) => prev.map((row) => row.id === item.id ? saved : row));
      notify(saved.is_enabled ? 'Request type enabled.' : 'Request type disabled.', 'success');
    } catch (failure) {
      notify(failure?.code === 'REQUEST_TYPE_409_STALE' ? 'This type changed. Refresh the list and retry.' : errorText(failure), 'error');
      reload();
    } finally { setBusy(false); }
  };

  const remove = async (item) => {
    if (readOnly || busy || !window.confirm(`Delete or archive “${item.name}”? Existing customer requests will be preserved.`)) return;
    setBusy(true);
    try {
      const result = await requestTypesApi.remove(item.id, item.version);
      setTypes((prev) => prev.filter((row) => row.id !== item.id));
      if (editing?.id === item.id) { setEditing(null); setShowForm(false); }
      notify(result?.archived ? 'Request type archived; existing requests preserved.' : 'Request type deleted.', 'success');
      await reload();
    } catch (failure) {
      notify(failure?.code === 'REQUEST_TYPE_409_STALE' ? 'This type changed. Refresh and retry.' : errorText(failure), 'error');
      reload();
    } finally { setBusy(false); }
  };

  return (
    <section className="kr-request-types">
      <div className="kr-toolbar">
        <div>
          <h2>Request types</h2>
          <p>Teach your AI what customer requests to collect and what happens after confirmation.</p>
        </div>
        <div className="kr-tools">
          <label className="kr-inline-check"><input type="checkbox" checked={includeArchived} onChange={(e) => setIncludeArchived(e.target.checked)} /> Show archived</label>
          <button type="button" className="kr-secondary" disabled={loading || busy} onClick={reload}><RefreshCw size={15} /> Refresh</button>
          {!readOnly && <button type="button" className="kr-primary" disabled={busy} onClick={startCreate}><Plus size={15} /> Add Request Type</button>}
        </div>
      </div>
      {error && <p role="alert" className="kr-error">{error}</p>}
      {showForm && !readOnly && (
        <form onSubmit={save} className="kr-form" noValidate>
          <div className="kr-toolbar"><h3>{editing ? 'Edit request type' : 'Add request type'}</h3><button type="button" className="kr-icon" onClick={() => setShowForm(false)} aria-label="Close"><X size={17} /></button></div>
          <label>Name <input required maxLength={100} minLength={2} value={form.name} onChange={(e) => setForm((old) => ({ ...old, name: e.target.value }))} placeholder="Project Picture Request" />{fieldErrors.name && <small className="kr-error">{fieldErrors.name}</small>}</label>
          <label>Details to collect <textarea required rows={3} maxLength={1000} value={form.details_to_collect} onChange={(e) => setForm((old) => ({ ...old, details_to_collect: e.target.value }))} placeholder="Name, project category, reply email" />{fieldErrors.details_to_collect && <small className="kr-error">{fieldErrors.details_to_collect}</small>}</label>
          <label>What happens next <textarea required rows={2} maxLength={500} value={form.next_step_text} onChange={(e) => setForm((old) => ({ ...old, next_step_text: e.target.value }))} placeholder="Our team will contact you within one working day" />{fieldErrors.next_step_text && <small className="kr-error">{fieldErrors.next_step_text}</small>}</label>
          <p className="kr-hint">Separate details with commas. The backend derives the question fields and asks customers to confirm before saving. Maximum 20 request types per workspace.</p>
          <div className="kr-tools"><button type="button" className="kr-secondary" onClick={() => setShowForm(false)}>Cancel</button><button className="kr-primary" disabled={busy}>{busy ? 'Saving…' : editing ? 'Save changes' : 'Create request type'}</button></div>
        </form>
      )}
      {loading ? <p className="kr-muted">Loading request types…</p> : types.length === 0 ? <div className="kr-empty"><ClipboardList size={24}/><strong>No request types found</strong><span>Add one so the AI can recognise and collect customer enquiries.</span></div> : (
        <div className="kr-type-grid">{types.map((item) => (
          <article className="kr-card" key={item.id}>
            <div className="kr-toolbar"><div><strong>{item.name}</strong><p className="kr-muted">{item.archived_at ? 'Archived' : item.is_enabled ? 'Enabled for the AI' : 'Disabled'}</p></div>{item.is_enabled && !item.archived_at && <CheckCircle2 size={17} className="kr-check" />}</div>
            <p><b>The AI will ask for:</b> {(item.fields || []).map((field) => field.label).join(', ') || item.details_to_collect || '—'}</p>
            <p><b>What happens next:</b> {item.next_step_text || '—'}</p>
            <div className="kr-tools">
              {!readOnly && !item.archived_at && <>
                <label className="kr-inline-check"><input type="checkbox" checked={item.is_enabled !== false} disabled={busy} onChange={() => toggle(item)}/> Enabled</label>
                <button type="button" className="kr-secondary" disabled={busy} onClick={() => startEdit(item)}><Pencil size={14}/> Edit</button>
                <button type="button" className="kr-secondary" disabled={busy} onClick={() => remove(item)}><Trash2 size={14}/> Delete</button>
              </>}
              {item.archived_at && <span className="kr-muted">Read-only archive</span>}
            </div>
          </article>
        ))}</div>
      )}
    </section>
  );
}
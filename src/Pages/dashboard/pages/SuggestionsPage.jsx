import { suggestionsApi } from '../../../services/dashboard/suggestions.api.js';
import './SuggestionsPage.css';
import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronUp, Lightbulb, Plus, Send } from 'lucide-react';
import { EmptyState, FieldInput, FieldSelect, FieldTextarea, FormField, Modal, PageHeader, Panel, Tabs, useNotice } from '../../../components/dashboard/common/DashboardUI';
const suggestionTabs = [{ label: 'All Suggestions', value: 'all' }, { label: 'My Suggestions', value: 'mine' }];
const types = ['Feature Request', 'Improvement', 'Bug', 'Other'];

function suggestionRecords(response) {
  return Array.isArray(response) ? response : response?.items || response?.results || response?.suggestions || [];
}

// Displays shared product ideas and sends submissions and votes through the suggestions API.
export default function SuggestionsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') === 'mine' ? 'mine' : 'all';
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({ type: 'Feature Request', title: '', description: '' });
  const [votingId, setVotingId] = useState('');
  const { showNotice, Notice } = useNotice();

  const loadSuggestions = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      const response = await suggestionsApi.request({ query: { mine: activeTab === 'mine' } });
      setSuggestions(suggestionRecords(response));
    } catch (error) {
      setSuggestions([]);
      setLoadError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  useEffect(() => { loadSuggestions(); }, [loadSuggestions]);

  const setTab = (label) => {
    const value = label === 'My Suggestions' ? 'mine' : 'all';
    const params = new URLSearchParams(searchParams);
    if (value === 'all') params.delete('tab');
    else params.set('tab', value);
    setSearchParams(params, { replace: true });
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!form.title.trim() || !form.description.trim()) return;
    setIsSubmitting(true);
    try {
      const response = await suggestionsApi.request({ method: 'POST', body: { ...form, title: form.title.trim(), description: form.description.trim() } });
      const created = response?.suggestion || response;
      if (created && (created.id || created.suggestion_id)) setSuggestions((current) => [created, ...current]);
      setForm({ type: 'Feature Request', title: '', description: '' });
      setIsOpen(false);
      showNotice('Your idea has been submitted.');
      loadSuggestions();
    } catch (error) {
      showNotice(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleVote = async (suggestion) => {
    const id = suggestion.id || suggestion.suggestion_id;
    const nextVote = !suggestion.has_voted;
    setVotingId(String(id));
    try {
      const response = await suggestionsApi.request({ method: 'PATCH', id, body: { has_voted: nextVote } });
      const updated = response?.suggestion || response;
      setSuggestions((current) => current.map((item) => String(item.id || item.suggestion_id) === String(id)
        ? { ...item, ...updated, has_voted: nextVote, vote_count: updated?.vote_count ?? item.vote_count }
        : item));
    } catch (error) {
      showNotice(error.message);
    } finally {
      setVotingId('');
    }
  };

  return (
    <>
      <PageHeader title="Suggestion Box" description="Tell us what to add, change, or remove, and upvote what other businesses have suggested." actions={<button type="button" className="dp-primary-button" onClick={() => setIsOpen(true)}><Plus size={15} /> Submit idea</button>} />
      {Notice}
      {loadError && <div className="dp-inline-notice dp-api-error" role="status">{loadError}</div>}
      <Panel className="dp-suggestions-panel">
        <Tabs items={suggestionTabs.map((tab) => tab.label)} active={suggestionTabs.find((tab) => tab.value === activeTab)?.label || 'All Suggestions'} onChange={setTab} />
        {isLoading ? <div className="dp-api-empty-state">Loading suggestions…</div> : suggestions.length ? (
          <div className="dp-suggestion-list">
            {suggestions.map((suggestion) => {
              const id = suggestion.id || suggestion.suggestion_id;
              return (
                <article className="dp-suggestion-card" key={id}>
                  <button type="button" className={`dp-suggestion-vote ${suggestion.has_voted ? 'voted' : ''}`} onClick={() => toggleVote(suggestion)} disabled={votingId === String(id)} aria-pressed={Boolean(suggestion.has_voted)} aria-label={`Upvote suggestion, ${suggestion.vote_count ?? 'unknown'} votes`}>
                    <ChevronUp size={20} /><strong>{suggestion.vote_count ?? '—'}</strong>
                  </button>
                  <div className="dp-suggestion-card-content"><span className="dp-suggestion-type">{suggestion.type || 'Other'}</span><h3>{suggestion.title}</h3><p>{suggestion.description}</p></div>
                </article>
              );
            })}
          </div>
        ) : loadError ? (
          <div className="dp-api-empty-state"><Lightbulb size={22} /><strong>Suggestion Box is ready to connect</strong><p>Connect the suggestions API to load ideas from other businesses and record votes.</p></div>
        ) : activeTab === 'mine' ? (
          <EmptyState icon={Lightbulb} title="No suggestions yet" description="Ideas you submit will appear here." buttonText="Submit idea" onAction={() => setIsOpen(true)} />
        ) : (
          <EmptyState icon={Lightbulb} title="No suggestions yet" description="Be the first to share an idea with the Bellbee community." buttonText="Submit idea" onAction={() => setIsOpen(true)} />
        )}
      </Panel>

      {isOpen && <Modal
        title="Submit idea"
        description="Tell us what would make Bellbee more useful for your business."
        onClose={() => setIsOpen(false)}
        footer={(
          <>
            <button type="button" className="dp-secondary-button" onClick={() => setIsOpen(false)} disabled={isSubmitting}>Cancel</button>
            <button type="submit" form="suggestion-form" className="dp-primary-button" disabled={isSubmitting || !form.title.trim() || !form.description.trim()}>{isSubmitting ? 'Submitting…' : 'Submit idea'} <Send size={14} /></button>
          </>
        )}
      >
        <form id="suggestion-form" className="dp-form-grid" onSubmit={submit}>
          <FormField label="Type" className="dp-form-full"><FieldSelect value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}>{types.map((type) => <option key={type}>{type}</option>)}</FieldSelect></FormField>
          <FormField label="Title" className="dp-form-full"><FieldInput value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="A short title for your idea" maxLength={120} required /></FormField>
          <FormField label="Description" className="dp-form-full"><FieldTextarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} rows={5} maxLength={2000} placeholder="Explain what you would like to see…" required /></FormField>
        </form>
      </Modal>}
    </>
  );
}

import { useState } from 'react';
import { Lightbulb, Send } from 'lucide-react';
import { PageHeader, Panel, useNotice } from '../../../components/dashboard/common/DashboardUI';

// Collects a suggestion in local UI state; delivery will be added with the backend.
export default function SuggestionsPage() {
  const [suggestion, setSuggestion] = useState('');
  const { showNotice, Notice } = useNotice();
  const submit = (event) => {
    event.preventDefault();
    if (!suggestion.trim()) return;
    setSuggestion('');
    showNotice('Thanks for your suggestion. Sending it to the Bellbee team requires backend integration.');
  };
  return <><PageHeader eyebrow="YOUR FEEDBACK" title="Suggestion Box" description="Help us make Bellbee better. Tell us what would make your daily work easier." />{Notice}<Panel className="dp-suggestion-panel"><div className="dp-empty-icon"><Lightbulb size={25} /></div><h2>Have an idea for Bellbee?</h2><p>Share a feature request, improvement, or anything that could help your business.</p><form onSubmit={submit}><textarea className="dp-textarea" rows={5} maxLength={2000} placeholder="Write your suggestion..." value={suggestion} onChange={(event) => setSuggestion(event.target.value)} /><div className="dp-suggestion-footer"><small>{suggestion.length}/2000</small><button type="submit" className="dp-primary-button" disabled={!suggestion.trim()}><Send size={14} /> Send suggestion</button></div></form></Panel></>;
}

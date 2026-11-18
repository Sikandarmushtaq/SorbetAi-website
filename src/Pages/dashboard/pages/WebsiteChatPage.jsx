import { useCallback, useEffect, useState } from 'react';
import { FileDown, FileText, Globe, MessageSquare, RefreshCw, Save, Settings, ShieldCheck } from 'lucide-react';
import { FieldInput, FieldSelect, FormField, PageHeader, Panel, useNotice } from '../../../components/dashboard/common/DashboardUI';
import { isResourceConfigured, resourceRequest } from '../../../services/dashboardApi';

// Loads website-chat widget settings and saves them only through the configured backend resource.
export default function WebsiteChatPage() {
  const [settings, setSettings] = useState({ domain: '', greeting: '', accent: 'green', position: 'right', enabled: false });
  const [embedCode, setEmbedCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const { showNotice, Notice } = useNotice();

  const loadSettings = useCallback(async () => {
    if (!isResourceConfigured('websiteChat')) return;
    setLoading(true);
    setError('');
    try {
      const response = await resourceRequest('websiteChat');
      const value = response?.widget || response?.settings || response || {};
      setSettings({
        domain: value.domain || value.website_url || '', greeting: value.greeting || value.welcome_message || '',
        accent: value.accent || 'green', position: value.position || 'right', enabled: Boolean(value.enabled || value.is_enabled),
      });
      setEmbedCode(value.embed_code || value.install_snippet || '');
    } catch (requestError) { setError(requestError.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  // Saves the widget's website domain, welcome message, appearance and enabled state.
  const saveSettings = async (event) => {
    event.preventDefault();
    if (!isResourceConfigured('websiteChat')) return showNotice('Website Chat API is not configured yet.');
    setSaving(true);
    try {
      const response = await resourceRequest('websiteChat', { method: 'PATCH', body: {
        domain: settings.domain.trim(), greeting: settings.greeting.trim(), accent: settings.accent,
        position: settings.position, enabled: settings.enabled,
      } });
      const value = response?.widget || response?.settings || response || {};
      if (value.embed_code || value.install_snippet) setEmbedCode(value.embed_code || value.install_snippet);
      showNotice('Website Chat settings saved.');
    } catch (requestError) { showNotice(requestError.message); }
    finally { setSaving(false); }
  };

  // Copies only the real installation snippet returned by the backend.
  const copySnippet = async () => {
    if (!embedCode) return showNotice('The embed snippet will appear after the widget is created by the backend.');
    try { await navigator.clipboard.writeText(embedCode); showNotice('Embed code copied.'); }
    catch { showNotice('Clipboard access is unavailable in this browser.'); }
  };

  return (
    <>
      <PageHeader eyebrow="CHANNELS / WEBSITE CHAT" title="Website Chat" description="Set up the Bellbee chat widget for your website." actions={<button type="button" className="dp-secondary-button" onClick={loadSettings} disabled={loading}><RefreshCw size={14} /> Refresh</button>} />
      {Notice}
      {error && <div className="dp-inline-notice dp-api-error" role="status">{error}</div>}
      <div className="dp-website-chat-layout">
        <form onSubmit={saveSettings}>
          <Panel className="dp-profile-panel"><div className="dp-panel-heading"><div><span className="dp-section-kicker">WIDGET SETUP</span><h2>Website details</h2></div><Globe size={20} /></div><div className="dp-form-grid"><FormField label="Website URL"><FieldInput type="url" value={settings.domain} onChange={(event) => setSettings((current) => ({ ...current, domain: event.target.value }))} placeholder="https://yourbusiness.com" required /></FormField><FormField label="Widget position"><FieldSelect value={settings.position} onChange={(event) => setSettings((current) => ({ ...current, position: event.target.value }))}><option value="right">Bottom right</option><option value="left">Bottom left</option></FieldSelect></FormField><FormField label="Welcome message" className="dp-form-full"><FieldInput value={settings.greeting} onChange={(event) => setSettings((current) => ({ ...current, greeting: event.target.value }))} placeholder="Hi there! How can we help?" /></FormField><FormField label="Widget accent"><FieldSelect value={settings.accent} onChange={(event) => setSettings((current) => ({ ...current, accent: event.target.value }))}><option value="green">Bellbee green</option><option value="coral">Coral</option><option value="lavender">Lavender</option></FieldSelect></FormField></div><label className="dp-profile-toggle"><span><strong>Enable website chat</strong><small>Allow visitors to start a conversation from your website.</small></span><input type="checkbox" checked={settings.enabled} onChange={(event) => setSettings((current) => ({ ...current, enabled: event.target.checked }))} /></label><button type="submit" className="dp-primary-button" disabled={saving || !isResourceConfigured('websiteChat')}>{saving ? 'Saving…' : 'Save widget settings'} <Save size={14} /></button>{!isResourceConfigured('websiteChat') && <p className="dp-form-note">Configure REACT_APP_API_WEBSITE_CHAT_PATH to save widget settings and retrieve the installation code.</p>}</Panel>
          <Panel className="dp-profile-panel"><div className="dp-panel-heading"><div><span className="dp-section-kicker">INSTALLATION</span><h2>Add Bellbee to your website</h2></div><FileText size={20} /></div><p className="dp-panel-description">After your widget is created, the backend will provide a site-specific embed snippet. Copy it into your website before the closing body tag.</p><div className="dp-code-snippet">{embedCode || 'Your website-specific installation code will appear here after the widget is saved.'}</div><button type="button" className="dp-secondary-button" onClick={copySnippet} disabled={!embedCode}><FileDown size={14} /> Copy embed code</button></Panel>
        </form>
        <Panel className="dp-website-chat-preview"><div className="dp-panel-heading"><div><span className="dp-section-kicker">PREVIEW</span><h2>Chat widget</h2></div><Settings size={20} /></div><div className="dp-widget-preview-window"><div className="dp-widget-preview-header"><span className="dp-widget-preview-mark"><MessageSquare size={17} /></span><div><strong>Bellbee Assistant</strong><small>Typically replies instantly</small></div><span className="dp-widget-preview-online" /></div><div className="dp-widget-preview-message">{settings.greeting || 'Hi there! How can we help you today?'}</div><div className="dp-widget-preview-composer">Write a message… <span>↑</span></div></div><div className="dp-channel-safety-note"><ShieldCheck size={17} /><div><strong>Backend-powered conversations</strong><p>Real visitor chats and AI replies will run through your connected Bellbee services.</p></div></div></Panel>
      </div>
    </>
  );
}

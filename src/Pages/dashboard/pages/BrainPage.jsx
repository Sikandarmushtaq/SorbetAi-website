import { useState } from 'react';
import { Bot, Building2, CalendarDays, Clock3, FileText, Lightbulb, Package, Send, Sparkles, Users } from 'lucide-react';
import { PageHeader, Panel, Tabs, useNotice } from '../../../components/dashboard/common/DashboardUI';

const brainTabs = ['What AI knows', 'Setup', 'Hours & Staff', 'Locations', 'Knowledge', 'Requests', 'Test AI'];

// Shows AI knowledge sections and a local Brain Assistant conversation preview.
export default function BrainPage() {
  const [tab, setTab] = useState('What AI knows');
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([{ role: 'assistant', text: 'Hi! I can see what your AI knows about your business. Tell me what has changed, or pick a place to start.' }]);
  const { showNotice, Notice } = useNotice();

  const sendMessage = (event) => {
    event.preventDefault();
    if (!question.trim()) return;
    setMessages((current) => [...current, { role: 'user', text: question.trim() }, { role: 'assistant', text: 'The Brain Assistant needs the Bellbee backend and AI service to suggest and apply changes. Your message is visible here in this local preview.' }]);
    setQuestion('');
  };

  return <>
    <PageHeader eyebrow="MANAGE YOUR AI" title="AI Brain" description="See what your AI knows, teach it about your business, and test it before customers do." />
    {Notice}
    <Panel className="dp-brain-panel">
      <Tabs items={brainTabs} active={tab} onChange={setTab} />
      {tab === 'What AI knows' && <>
        <div className="dp-brain-summary"><div><span className="dp-section-kicker">YOUR AI KNOWLEDGE</span><h2>Your AI knowledge overview</h2><p>Core knowledge is included in every conversation. Reference material is looked up when a customer asks a related question.</p></div><span className="dp-count-badge">Needs attention · 4</span></div>
        <div className="dp-attention-list">{['Add a business description so the AI can explain what you do.', 'Add services or products so the AI can answer questions and take bookings or orders.', 'Review the example opening hours and set your real availability.', 'Add FAQs to help the AI answer common questions in your preferred way.'].map((item) => <div className="dp-attention-item" key={item}><span><Lightbulb size={16} /></span><p>{item}</p></div>)}</div>
        <div className="dp-section-heading"><div><span className="dp-section-kicker">CORE KNOWLEDGE</span><h2>Always knows</h2><p>Your AI sees this information in every conversation.</p></div></div>
        <div className="dp-knowledge-grid">
          <KnowledgeCard icon={Building2} title="Business profile" value="Not configured" detail="Add a description, business type and contact details." />
          <KnowledgeCard icon={Clock3} title="Opening hours" value="Monday – Saturday, 09:00–18:00" detail="Sunday: Closed · Review these example hours." />
          <KnowledgeCard icon={BriefcaseIcon} title="Services · 0" value="Nothing here yet" detail="Add services before offering appointment booking." />
          <KnowledgeCard icon={Package} title="Products · 0" value="Nothing here yet" detail="Add products before offering order placement." />
          <KnowledgeCard icon={FileText} title="Documents · 0" value="Nothing here yet" detail="Add menus, price lists or documents the AI can share." />
          <KnowledgeCard icon={Sparkles} title="Personality & instructions" value="Assistant" detail="Customer's language · Friendly · Medium replies." />
        </div>
        <div className="dp-section-heading"><div><span className="dp-section-kicker">REFERENCE MATERIAL</span><h2>Looks up when relevant</h2><p>The AI searches this information when a customer asks something related.</p></div></div>
        <div className="dp-knowledge-empty"><FileText size={21} /><div><strong>Nothing to look up yet</strong><p>Add FAQs, documents or promotions to give your AI more context.</p></div><button type="button" className="dp-secondary-button" onClick={() => setTab('Knowledge')}>Add knowledge</button></div>
      </>}
      {tab === 'Test AI' && <div className="dp-test-ai"><span className="dp-section-kicker">AI PLAYGROUND</span><h2>Try a customer question</h2><p>Test AI responses after your business knowledge and backend connection are configured.</p><form className="dp-test-ai-form" onSubmit={(event) => { event.preventDefault(); showNotice('Testing requires the connected AI service. Your question has not been sent.'); }}><input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask your AI a question..." /><button type="submit" disabled={!question.trim()}><Send size={15} /> Test AI</button></form></div>}
      {tab === 'Setup' && <PlaceholderBrain icon={Bot} title="AI setup" description="Set your assistant name, preferred language, tone, response length and business instructions." action="Open business profile" onAction={() => showNotice('Business profile editing is available on the Profile page in this frontend preview.')} />}
      {tab === 'Hours & Staff' && <PlaceholderBrain icon={CalendarDays} title="Hours & Staff" description="Set business hours, staff availability, breaks and appointment capacity." action="Add staff member" onAction={() => showNotice('Staff management form will be connected with the scheduling backend.')} />}
      {tab === 'Locations' && <PlaceholderBrain icon={Building2} title="Business locations" description="Add branches and tell the AI which services are available at each location." action="Add location" onAction={() => showNotice('Location management requires backend storage.')} />}
      {tab === 'Knowledge' && <PlaceholderBrain icon={FileText} title="Knowledge library" description="Upload documents, create FAQs and add promotions that your AI can reference." action="Add knowledge" onAction={() => showNotice('Document uploads and knowledge indexing require backend integration.')} />}
      {tab === 'Requests' && <PlaceholderBrain icon={Users} title="AI knowledge requests" description="Review questions your AI could not confidently answer and use them to improve its knowledge." action="No requests yet" onAction={() => showNotice('New AI knowledge requests will appear here after conversations are connected.')} />}
      <div className="dp-rules-card"><Sparkles size={18} /><div><h3>Rules your AI always follows</h3><p>Your business instructions and safety rules will apply to every connected customer conversation.</p></div></div>
    </Panel>
    <Panel className="dp-brain-assistant"><div className="dp-panel-heading"><div><span className="dp-section-kicker">BELLBEE BRAIN ASSISTANT</span><h2>Teach your AI in a conversation</h2><p className="dp-panel-description">Tell it what changed. It can suggest an update for your approval once the AI service is connected.</p></div><span className="dp-assistant-status">Preview</span></div>
      <div className="dp-assistant-messages">{messages.map((message, index) => <div className={`dp-assistant-message ${message.role}`} key={`${message.role}-${index}`}><span>{message.role === 'assistant' ? 'B' : 'You'}</span><p>{message.text}</p></div>)}</div>
      <form className="dp-assistant-compose" onSubmit={sendMessage}><input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Tell your AI about your business..." /><button type="submit" disabled={!question.trim()} aria-label="Send message"><Send size={16} /></button></form>
    </Panel>
  </>;
}

function KnowledgeCard({ icon: Icon, title, value, detail }) {
  return <article className="dp-knowledge-card"><Icon size={19} /><h3>{title}</h3><p>{value}</p><small>{detail}</small></article>;
}

function PlaceholderBrain({ icon: Icon, title, description, action, onAction }) {
  return <div className="dp-brain-placeholder"><div className="dp-empty-icon"><Icon size={26} /></div><h3>{title}</h3><p>{description}</p><button type="button" className="dp-primary-button" onClick={onAction}>{action}</button></div>;
}

function BriefcaseIcon(props) {
  return <Package {...props} />;
}

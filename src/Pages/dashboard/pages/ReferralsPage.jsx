import { useState } from 'react';
import { Check, Gift, Link2, Users } from 'lucide-react';
import { PageHeader, Panel, StatCard, StatGrid, useNotice } from '../../../components/dashboard/common/DashboardUI';

// Displays referral information and lets the user copy or locally enter a referral code.
export default function ReferralsPage() {
  const [code, setCode] = useState('');
  const [copied, setCopied] = useState(false);
  const { showNotice, Notice } = useNotice();
  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText('XHX7T');
      setCopied(true);
    } catch {
      showNotice('Clipboard access is unavailable. Select and copy the code manually: XHX7T');
    }
  };
  return <><PageHeader eyebrow="SYSTEM" title="Referrals" description="Invite other businesses to Bellbee and track your referrals." />{Notice}<section className="dp-referral-hero"><div className="dp-referral-icon"><Gift size={24} /></div><span className="dp-section-kicker">REFERRAL PROGRAMME</span><h2>Share Bellbee. Grow together.</h2><p>Referral rewards are starting soon. Your link works, and friends who sign up with it can receive 20% off their first month.</p></section><div className="dp-referral-grid"><Panel className="dp-referral-code-card"><span className="dp-section-kicker">YOUR REFERRAL CODE</span><h2>XHX7T</h2><button type="button" className="dp-primary-button" onClick={copyCode}>{copied ? <Check size={15} /> : <Link2 size={15} />}{copied ? 'Copied' : 'Copy code'}</button><p>Friends get 20% off their first month.</p></Panel><Panel><span className="dp-section-kicker">INVITED BY A FRIEND?</span><h2>Have a referral code?</h2><p className="dp-panel-description">Add their code within 72 hours of signing up.</p><form className="dp-inline-form" onSubmit={(event) => { event.preventDefault(); showNotice(code.trim() ? 'Referral code validation will be enabled with account services.' : 'Enter a referral code first.'); }}><input value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} placeholder="Enter referral code" /><button type="submit" className="dp-secondary-button">Apply</button></form></Panel></div><StatGrid columns={3}><StatCard label="Businesses you brought" value="0" icon={Users} /><StatCard label="Subscribed" value="0" icon={Check} accent="green" /><StatCard label="You saved" value="PKR 0" icon={Gift} accent="yellow" /></StatGrid></>;
}

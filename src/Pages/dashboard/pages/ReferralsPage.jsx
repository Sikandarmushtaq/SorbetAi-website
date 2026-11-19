import { referralsApi } from '../../../services/dashboard/referrals.api.js';
import './ReferralsPage.css';
import { useCallback, useEffect, useState } from 'react';
import { Check, Gift, Link2, Users } from 'lucide-react';
import { PageHeader, Panel, StatCard, StatGrid, useNotice } from '../../../components/dashboard/common/DashboardUI';
// Displays referral code, link, rewards and statistics only when returned by the referrals API.
export default function ReferralsPage() {
  const [referral, setReferral] = useState(null);
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [copied, setCopied] = useState(false);
  const { showNotice, Notice } = useNotice();

  const loadReferral = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      const response = await referralsApi.request();
      setReferral(response?.referral || response);
    } catch (error) {
      setReferral(null);
      setLoadError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadReferral(); }, [loadReferral]);

  const codeValue = referral?.code || referral?.referral_code || '';
  const linkValue = referral?.referral_link || referral?.link || '';

  const copyReferral = async () => {
    const value = linkValue || codeValue;
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      showNotice(linkValue ? 'Referral link copied.' : 'Referral code copied.');
    } catch {
      showNotice('Clipboard access is unavailable. Select and copy the referral details manually.');
    }
  };

  const applyCode = async (event) => {
    event.preventDefault();
    if (!code.trim()) return;
    setIsApplying(true);
    try {
      await referralsApi.request({ method: 'POST', action: 'apply', body: { referral_code: code.trim().toUpperCase() } });
      setCode('');
      showNotice('Referral code applied.');
      await loadReferral();
    } catch (error) {
      showNotice(error.message);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <>
      <PageHeader eyebrow="SYSTEM" title="Referrals" description="Invite other businesses to Bellbee and track your referrals." />
      {Notice}
      {loadError && <div className="dp-inline-notice dp-api-error" role="status">{loadError}</div>}
      <section className="dp-referral-hero"><div className="dp-referral-icon"><Gift size={24} /></div><span className="dp-section-kicker">REFERRAL PROGRAMME</span><h2>{referral?.headline || 'Share Bellbee. Grow together.'}</h2><p>{referral?.description || (isLoading ? 'Loading referral programme details…' : 'Referral programme details will appear when the referrals API is connected.')}</p></section>
      <div className="dp-referral-grid">
        <Panel className="dp-referral-code-card"><span className="dp-section-kicker">YOUR REFERRAL CODE</span><h2>{isLoading ? '…' : codeValue || 'Not available'}</h2>{linkValue && <p className="dp-referral-link-value">{linkValue}</p>}<button type="button" className="dp-primary-button" onClick={copyReferral} disabled={!codeValue && !linkValue}>{copied ? <Check size={15} /> : <Link2 size={15} />}{copied ? 'Copied' : linkValue ? 'Copy referral link' : 'Copy code'}</button><p>{referral?.reward_description || ''}</p></Panel>
        <Panel><span className="dp-section-kicker">INVITED BY A FRIEND?</span><h2>Have a referral code?</h2><p className="dp-panel-description">Enter your invitation code to apply it to your account.</p><form className="dp-inline-form" onSubmit={applyCode}><input value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} placeholder="Enter referral code" maxLength={60} /><button type="submit" className="dp-secondary-button" disabled={isApplying || !code.trim()}>{isApplying ? 'Applying…' : 'Apply'}</button></form></Panel>
      </div>
      <StatGrid columns={3}>
        <StatCard label="Businesses you brought" value={isLoading ? '—' : referral?.businesses_invited ?? referral?.invited_count ?? '—'} icon={Users} />
        <StatCard label="Subscribed" value={isLoading ? '—' : referral?.subscribed_count ?? referral?.subscribed ?? '—'} icon={Check} accent="green" />
        <StatCard label="You saved" value={isLoading ? '—' : referral?.total_savings != null ? `${referral.currency || 'PKR'} ${Number(referral.total_savings).toLocaleString()}` : '—'} icon={Gift} accent="yellow" />
      </StatGrid>
    </>
  );
}

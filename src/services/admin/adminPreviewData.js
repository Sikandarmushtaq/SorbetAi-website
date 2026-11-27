/**
 * LOCAL, FICTIONAL ADMIN DESIGN DATA.
 * This module is ONLY used by the admin hook when:
 *   NODE_ENV === 'development' && REACT_APP_ADMIN_UI_PREVIEW === 'true'
 * Nothing in this file comes from the backend; no user records are read or saved.
 */

export const isAdminPreviewEnabled =
  process.env.NODE_ENV === 'development' &&
  process.env.REACT_APP_ADMIN_UI_PREVIEW === 'true';

const users = [
  {
    id: 'demo-user-101', first_name: 'Ayesha', last_name: 'Malik',
    email: 'ayesha@example.com', phone: '+1 202-555-0101',
    status: 'active', country: 'United States', is_active: true,
    is_email_verified: true, is_onboarded: true, two_factor_enabled: false,
    created_at: '2026-10-02T10:20:00Z', last_login_at: '2026-11-24T15:05:00Z',
    referral_code: 'DEMO-AYESHA', workspace_count: 1,
    plan: { name: 'Bellbee Pro' },
    subscription: { plan: { name: 'Bellbee Pro' }, status: 'active' },
    workspaces: [{ id: 'demo-workspace-201', name: 'Northstar Studio', role: 'owner', status: 'active' }],
    billing: {
      plan: { name: 'Bellbee Pro' }, status: 'active', billing_cycle: 'monthly',
      current_period_end: '2026-12-02T00:00:00Z', cancel_at_period_end: false,
      credits_balance: 1260, total_paid_minor: 9998, currency: 'GBP',
      invoices: [
        { id: 'demo-invoice-1', invoice_number: 'DEMO-INV-001', created_at: '2026-11-02T00:00:00Z', amount_minor: 4999, currency: 'GBP', status: 'paid' },
        { id: 'demo-invoice-2', invoice_number: 'DEMO-INV-002', created_at: '2026-10-02T00:00:00Z', amount_minor: 4999, currency: 'GBP', status: 'paid' },
      ],
    },
    ai_usage: { ai_replies: 1842, ai_requests: 1976, tokens_used: 236410,
      credits_used: 740, credits_remaining: 1260, brain_status: 'configured', period: 'November 2026' },
    channels: [
      { id: 'demo-channel-1', name: 'WhatsApp', workspace_name: 'Northstar Studio', status: 'connected', updated_at: '2026-11-23T16:15:00Z' },
      { id: 'demo-channel-2', name: 'Instagram', workspace_name: 'Northstar Studio', status: 'connected', updated_at: '2026-11-22T14:15:00Z' },
    ],
    activity: [
      { id: 'demo-activity-1', action: 'Signed in', summary: 'Successful login', created_at: '2026-11-24T15:05:00Z' },
      { id: 'demo-activity-2', action: 'Subscription renewed', summary: 'Bellbee Pro monthly plan', created_at: '2026-11-02T08:00:00Z' },
    ],
  },
  {
    id: 'demo-user-102', first_name: 'Hamza', last_name: 'Ali',
    email: 'hamza@example.com', phone: '+1 202-555-0102',
    status: 'active', country: 'United States', is_active: true,
    is_email_verified: true, is_onboarded: true,
    created_at: '2026-11-08T09:15:00Z', last_login_at: '2026-11-23T11:00:00Z',
    workspace_count: 1, plan: { name: 'Free' },
    subscription: { plan: { name: 'Free' }, status: 'trial' },
    workspaces: [{ id: 'demo-workspace-202', name: 'Evergreen Salon', role: 'owner', status: 'active' }],
    billing: { plan: { name: 'Free' }, status: 'trial', billing_cycle: 'none',
      credits_balance: 400, total_paid_minor: 0, currency: 'GBP', invoices: [] },
    ai_usage: { ai_replies: 232, ai_requests: 259, tokens_used: 22500,
      credits_used: 100, credits_remaining: 400, brain_status: 'configured', period: 'November 2026' },
    channels: [{ id: 'demo-channel-3', name: 'WhatsApp', workspace_name: 'Evergreen Salon', status: 'connected', updated_at: '2026-11-23T11:00:00Z' }],
    activity: [{ id: 'demo-activity-3', action: 'AI Brain updated', summary: 'Business hours saved', created_at: '2026-11-21T12:00:00Z' }],
  },
  {
    id: 'demo-user-103', first_name: 'Sara', last_name: 'Khan',
    email: 'sara@example.com', phone: '+1 202-555-0103',
    status: 'pending', country: 'United States', is_active: true,
    is_email_verified: false, is_onboarded: false,
    created_at: '2026-11-22T18:30:00Z', workspace_count: 1,
    plan: { name: 'Free' }, subscription: { plan: { name: 'Free' }, status: 'trial' },
    workspaces: [{ id: 'demo-workspace-203', name: 'Harbor Market', role: 'owner', status: 'pending' }],
    billing: { plan: { name: 'Free' }, status: 'trial', credits_balance: 500,
      total_paid_minor: 0, currency: 'GBP', invoices: [] },
    ai_usage: { ai_replies: 0, ai_requests: 0, tokens_used: 0,
      credits_used: 0, credits_remaining: 500, brain_status: 'not configured', period: 'November 2026' },
    channels: [], activity: [{ id: 'demo-activity-4', action: 'Account created', summary: 'Verification pending', created_at: '2026-11-22T18:30:00Z' }],
  },
];

const businesses = [
  { id: 'demo-workspace-201', name: 'Northstar Studio', owner: { email: 'ayesha@example.com' },
    plan: { name: 'Bellbee Pro' }, status: 'active', onboarding_status: 'completed', created_at: '2026-10-02T10:20:00Z' },
  { id: 'demo-workspace-202', name: 'Evergreen Salon', owner: { email: 'hamza@example.com' },
    plan: { name: 'Free' }, status: 'active', onboarding_status: 'completed', created_at: '2026-11-08T09:15:00Z' },
  { id: 'demo-workspace-203', name: 'Harbor Market', owner: { email: 'sara@example.com' },
    plan: { name: 'Free' }, status: 'pending', onboarding_status: 'incomplete', created_at: '2026-11-22T18:30:00Z' },
];

const leads = [
  { id: 'demo-lead-301', full_name: 'Taylor Example', email: 'taylor@example.com', phone: '+1 202-555-0104',
    source: 'Landing chatbot', interest: 'Pricing and free credit', status: 'new', assigned_to: 'Support queue',
    created_at: '2026-11-24T14:20:00Z', updated_at: '2026-11-24T14:20:00Z' },
  { id: 'demo-lead-302', full_name: 'Jordan Example', email: 'jordan@example.com', phone: '+1 202-555-0105',
    source: 'Landing chatbot', interest: 'WhatsApp setup', status: 'contacted', assigned_to: 'Demo admin',
    created_at: '2026-11-23T10:10:00Z', updated_at: '2026-11-24T12:00:00Z' },
];

const conversations = [
  {
    id: 'demo-conversation-401', visitor_name: 'Taylor Example',
    visitor: { full_name: 'Taylor Example', email: 'taylor@example.com', phone: '+1 202-555-0104' },
    source: 'Landing chatbot', status: 'open', message_count: 3,
    started_at: '2026-11-24T14:20:00Z', last_message_at: '2026-11-24T14:22:00Z', interest: 'Pricing',
    messages: [
      { id: 'demo-msg-1', sender: 'visitor', text: 'Does Bellbee support WhatsApp?', created_at: '2026-11-24T14:20:00Z' },
      { id: 'demo-msg-2', sender: 'assistant', text: 'Yes. Bellbee can answer customer messages on supported WhatsApp connections.', created_at: '2026-11-24T14:21:00Z' },
      { id: 'demo-msg-3', sender: 'visitor', text: 'How much does it cost?', created_at: '2026-11-24T14:22:00Z' },
    ],
  },
  {
    id: 'demo-conversation-402', visitor_name: 'Jordan Example',
    visitor: { full_name: 'Jordan Example', email: 'jordan@example.com', phone: '+1 202-555-0105' },
    source: 'Landing chatbot', status: 'resolved', message_count: 2,
    started_at: '2026-11-23T10:10:00Z', interest: 'Setup',
    messages: [
      { id: 'demo-msg-4', sender: 'visitor', text: 'Can I try the AI before connecting my number?', created_at: '2026-11-23T10:10:00Z' },
      { id: 'demo-msg-5', sender: 'assistant', text: 'You can test your AI replies in the dashboard before publishing them.', created_at: '2026-11-23T10:11:00Z' },
    ],
  },
];

const others = {
  billing: [
    { id: 'demo-billing-1', workspace_name: 'Northstar Studio', plan: { name: 'Bellbee Pro' }, billing_cycle: 'monthly', status: 'active', current_period_end: '2026-12-02T00:00:00Z' },
    { id: 'demo-billing-2', workspace_name: 'Evergreen Salon', plan: { name: 'Free' }, billing_cycle: 'none', status: 'trial' },
  ],
  ai: [
    { id: 'demo-ai-1', workspace_name: 'Northstar Studio', ai_replies: 1842, credits_used: 740, model: 'Configured model', status: 'healthy', updated_at: '2026-11-24T15:00:00Z' },
    { id: 'demo-ai-2', workspace_name: 'Evergreen Salon', ai_replies: 232, credits_used: 100, model: 'Configured model', status: 'healthy', updated_at: '2026-11-23T11:00:00Z' },
  ],
  channels: [
    { id: 'demo-channel-summary-1', workspace_name: 'Northstar Studio', platform: 'WhatsApp', connection_status: 'connected', last_sync_at: '2026-11-24T15:00:00Z' },
    { id: 'demo-channel-summary-2', workspace_name: 'Evergreen Salon', platform: 'Instagram', connection_status: 'pending', last_sync_at: '2026-11-22T12:00:00Z' },
  ],
  orders: [
    { id: 'demo-order-1', workspace_name: 'Northstar Studio', order_number: 'DEMO-ORD-1001', product_name: 'Canvas tote', status: 'pending', created_at: '2026-11-24T12:00:00Z' },
    { id: 'demo-order-2', workspace_name: 'Northstar Studio', order_number: 'DEMO-ORD-1002', product_name: 'Mug', status: 'completed', created_at: '2026-11-23T12:00:00Z' },
  ],
  appointments: [
    { id: 'demo-appointment-1', workspace_name: 'Evergreen Salon', service_name: 'Haircut', start_at: '2026-11-28T11:00:00Z', status: 'confirmed' },
    { id: 'demo-appointment-2', workspace_name: 'Evergreen Salon', service_name: 'Consultation', start_at: '2026-11-29T14:00:00Z', status: 'pending' },
  ],
  campaigns: [
    { id: 'demo-campaign-1', workspace_name: 'Northstar Studio', name: 'Weekend offers', audience_size: 120, status: 'draft', created_at: '2026-11-22T10:00:00Z' },
  ],
  templates: [
    { id: 'demo-template-1', workspace_name: 'Northstar Studio', name: 'Appointment reminder', language: 'en', status: 'approved' },
    { id: 'demo-template-2', workspace_name: 'Evergreen Salon', name: 'Holiday offer', language: 'en', status: 'pending' },
  ],
  support: [
    { id: 'demo-ticket-1', subject: 'WhatsApp connection question', workspace_name: 'Evergreen Salon', priority: 'medium', assigned_to: 'Demo agent', status: 'open', created_at: '2026-11-23T14:00:00Z' },
  ],
  analytics: [
    { id: 'demo-metric-1', name: 'Website leads', value: 2, period: 'Demo month', change: '+1' },
    { id: 'demo-metric-2', name: 'Chat conversations', value: 2, period: 'Demo month', change: '+1' },
    { id: 'demo-metric-3', name: 'Registered users', value: 3, period: 'Demo month', change: '+2' },
  ],
  referrals: [
    { id: 'demo-referral-1', code: 'DEMO-REF-01', referrer_name: 'Ayesha Malik', referred_name: 'Hamza Ali', status: 'completed', created_at: '2026-11-08T09:15:00Z' },
  ],
  system: [
    { id: 'demo-system-1', name: 'Public website', region: 'Example region', status: 'healthy', last_checked_at: '2026-11-24T15:30:00Z' },
    { id: 'demo-system-2', name: 'Messaging service', region: 'Example region', status: 'healthy', last_checked_at: '2026-11-24T15:30:00Z' },
  ],
  audit: [
    { id: 'demo-audit-1', action: 'Account viewed', actor_email: 'demo-admin@example.com', target_type: 'User', status: 'success', created_at: '2026-11-24T15:00:00Z' },
  ],
};

const demoCollections = { users, businesses, leads, conversations, ...others };

export function getAdminPreviewData(key, { id, list = true } = {}) {
  if (key === 'overview') {
    return {
      stats: {
        users: users.length,
        businesses: businesses.length,
        website_leads: leads.length,
        website_conversations: conversations.length,
        active_subscriptions: 1,
        open_support_tickets: 1,
      },
    };
  }

  const userId = id == null ? null : String(id);
  const foundUser = userId ? users.find((user) => user.id === userId) : null;

  if (key === 'userBilling') return foundUser?.billing ?? null;
  if (key === 'userUsage') return foundUser?.ai_usage ?? null;
  if (key === 'userChannels') return foundUser?.channels ?? [];
  if (key === 'userActivity') return foundUser?.activity ?? [];

  const collection = demoCollections[key] || [];
  if (list) return collection;
  return collection.find((row) => String(row.id) === userId) ?? null;
}

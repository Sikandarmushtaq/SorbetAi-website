import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowLeft, MessageCircle, Paperclip, Search, Send } from 'lucide-react';
import { EmptyState, PageHeader, Panel, Tabs, useNotice } from '../../../components/dashboard/common/DashboardUI';
import { isResourceConfigured, resourceRequest } from '../../../services/dashboardApi';

const channelTabs = [
  { label: 'All', value: 'all' },
  { label: 'WhatsApp', value: 'whatsapp' },
  { label: 'Website Chat', value: 'website' },
];

function chatRecords(response) {
  return Array.isArray(response) ? response : response?.items || response?.results || response?.conversations || response?.chats || [];
}

function chatId(chat) {
  return String(chat.id || chat.chat_id || chat.conversation_id || '');
}

function customerId(chat) {
  return String(chat.customer_id || chat.customer?.id || '');
}

function chatName(chat) {
  return chat.customer_name || chat.customer?.full_name || chat.customer?.name || chat.name || 'Customer';
}

function lastMessage(chat) {
  const message = chat.last_message || chat.latest_message || chat.messages?.[chat.messages.length - 1];
  return typeof message === 'string' ? message : message?.text || message?.body || message?.content || 'No messages yet';
}

function formatChatTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

// Loads real customer conversations and keeps channel, search and selected chat in the URL.
export default function ChatsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const channel = channelTabs.some((tab) => tab.value === searchParams.get('channel')) ? searchParams.get('channel') : 'all';
  const query = searchParams.get('q') || '';
  const requestedCustomerId = searchParams.get('customer') || '';
  const selectedChatId = searchParams.get('chat') || '';
  const [conversations, setConversations] = useState([]);
  const [selectedDetails, setSelectedDetails] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [sendError, setSendError] = useState('');
  const { showNotice, Notice } = useNotice();

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setLoadError('');
    if (!isResourceConfigured('chats')) {
      setConversations([]);
      setLoadError('The chats API is not configured yet. Connect the conversations endpoint to load customer messages.');
      setIsLoading(false);
      return () => { active = false; };
    }

    resourceRequest('chats', {
      query: {
        channel: channel === 'all' ? undefined : channel,
        search: query || undefined,
        customer_id: requestedCustomerId || undefined,
      },
    })
      .then((response) => {
        if (!active) return;
        const records = chatRecords(response);
        setConversations(records);
        if (requestedCustomerId && !selectedChatId) {
          const match = records.find((chat) => customerId(chat) === requestedCustomerId);
          if (match && chatId(match)) {
            const next = new URLSearchParams(searchParams);
            next.set('chat', chatId(match));
            setSearchParams(next, { replace: true });
          }
        }
      })
      .catch((error) => { if (active) { setConversations([]); setLoadError(error.message); } })
      .finally(() => { if (active) setIsLoading(false); });

    return () => { active = false; };
  }, [channel, query, requestedCustomerId, selectedChatId, searchParams, setSearchParams]);

  const selectedConversation = useMemo(() => {
    return conversations.find((chat) => chatId(chat) === selectedChatId) ||
      conversations.find((chat) => requestedCustomerId && customerId(chat) === requestedCustomerId) || null;
  }, [conversations, selectedChatId, requestedCustomerId]);

  useEffect(() => {
    let active = true;
    setSelectedDetails(null);
    setSendError('');
    setMessageText('');
    if (!selectedChatId || !isResourceConfigured('chats')) return undefined;
    resourceRequest('chats', { id: selectedChatId })
      .then((response) => { if (active) setSelectedDetails(response?.conversation || response?.chat || response); })
      .catch((error) => { if (active) setSendError(error.message); });
    return () => { active = false; };
  }, [selectedChatId]);

  const activeConversation = selectedDetails || selectedConversation;
  const messages = activeConversation?.messages || activeConversation?.message_items || [];

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (!value || (key === 'channel' && value === 'all')) next.delete(key);
    else next.set(key, value);
    if (key === 'customer' || key === 'channel' || key === 'q') next.delete('chat');
    setSearchParams(next, { replace: true });
  };

  const selectConversation = (chat) => {
    const next = new URLSearchParams(searchParams);
    next.set('chat', chatId(chat));
    if (customerId(chat)) next.set('customer', customerId(chat));
    setSearchParams(next, { replace: true });
  };

  const sendMessage = async (event) => {
    event.preventDefault();
    if (!messageText.trim() || !activeConversation || isSending) return;
    const id = chatId(activeConversation);
    setIsSending(true);
    setSendError('');
    try {
      await resourceRequest('chats', { method: 'POST', id, action: 'messages', body: { text: messageText.trim() } });
      setMessageText('');
      const response = await resourceRequest('chats', { id });
      const latest = response?.conversation || response?.chat || response;
      setSelectedDetails(latest);
      setConversations((current) => current.map((chat) => chatId(chat) === id ? { ...chat, ...latest } : chat));
    } catch (error) {
      setSendError(error.message);
    } finally {
      setIsSending(false);
    }
  };

  const activeChannelLabel = channelTabs.find((tab) => tab.value === channel)?.label || 'All';

  return (
    <>
      <PageHeader eyebrow="COMMUNICATE" title="Chats" description="Manage customer conversations from your connected channels." actions={<span className="dp-count-badge">{conversations.length} conversations</span>} />
      {Notice}
      {loadError && <div className="dp-inline-notice dp-api-error" role="status">{loadError}</div>}
      <section className={`dp-chat-layout ${activeConversation ? 'has-chat-selection' : ''}`}>
        <Panel className="dp-chat-list">
          <div className="dp-chat-list-top">
            <label className="dp-search-input"><Search size={16} /><input type="search" placeholder="Search conversations..." value={query} onChange={(event) => updateParam('q', event.target.value)} /></label>
          </div>
          <Tabs items={channelTabs.map((tab) => tab.label)} active={activeChannelLabel} onChange={(label) => updateParam('channel', channelTabs.find((tab) => tab.label === label)?.value || 'all')} />
          <div className="dp-chat-rows">
            {isLoading ? <div className="dp-api-empty-state">Loading conversations…</div> : conversations.length ? conversations.map((chat) => {
              const id = chatId(chat);
              const unread = Number(chat.unread_count || 0) > 0 || chat.is_read === false;
              return (
                <button type="button" className={`dp-chat-row ${id === selectedChatId ? 'active' : ''}`} key={id} onClick={() => selectConversation(chat)}>
                  <span className="dp-customer-avatar">{chatName(chat).charAt(0).toUpperCase()}</span>
                  <span className="dp-chat-row-copy"><strong>{chatName(chat)}</strong><small>{lastMessage(chat)}</small></span>
                  <span className="dp-chat-row-meta"><time>{formatChatTime(chat.last_message_at || chat.updated_at || chat.created_at)}</time>{unread && <i aria-label="Unread" />}</span>
                </button>
              );
            }) : loadError ? <div className="dp-api-empty-state"><MessageCircle size={22} /><strong>Conversations are not connected</strong><p>Connect the chats API to load conversations from your channels.</p></div> : <EmptyState icon={MessageCircle} title="No chats yet" description="Customer chats from your connected channels will show up here." />}
          </div>
        </Panel>

        <Panel className="dp-chat-conversation">
          {activeConversation ? (
            <div className="dp-chat-active-view">
              <div className="dp-chat-active-header">
                <button type="button" className="dp-chat-back-button" onClick={() => { const next = new URLSearchParams(searchParams); next.delete('chat'); next.delete('customer'); setSearchParams(next, { replace: true }); }}><ArrowLeft size={15} /> Back to chats</button>
                <span className="dp-customer-avatar">{chatName(activeConversation).charAt(0).toUpperCase()}</span>
                <div><strong>{chatName(activeConversation)}</strong><small>{activeConversation.phone || activeConversation.customer?.phone || activeConversation.channel || 'Customer conversation'}</small></div>
              </div>
              <div className="dp-chat-message-list">
                {messages.length ? messages.map((message, index) => <article className={`dp-chat-message-bubble ${message.direction === 'outbound' || message.role === 'assistant' || message.is_from_business ? 'outbound' : 'inbound'}`} key={message.id || message.message_id || index}><p>{message.text || message.body || message.content || ''}</p><time>{formatChatTime(message.created_at || message.sent_at)}</time></article>) : <div className="dp-chat-placeholder"><div className="dp-empty-icon"><MessageCircle size={27} /></div><h3>No messages in this conversation</h3><p>Messages will appear here after they are received from the connected channel.</p></div>}
              </div>
              <form className="dp-chat-compose" onSubmit={sendMessage}>
                <button type="button" className="dp-icon-action" aria-label="Attach a file" onClick={() => showNotice('File attachments need to be enabled by the chat messages API.')}><Paperclip size={16} /></button>
                <input value={messageText} onChange={(event) => setMessageText(event.target.value)} placeholder="Write a reply…" aria-label="Write a reply" />
                <button type="submit" className="dp-primary-button" disabled={!messageText.trim() || isSending}>{isSending ? 'Sending…' : <Send size={15} />}</button>
              </form>
              {sendError && <p className="dp-form-note dp-api-error" role="alert">{sendError}</p>}
            </div>
          ) : (
            <div className="dp-chat-placeholder"><div className="dp-empty-icon"><MessageCircle size={27} /></div><h3>Select a conversation</h3><p>Pick a chat from the list to start replying.</p></div>
          )}
        </Panel>
      </section>
    </>
  );
}

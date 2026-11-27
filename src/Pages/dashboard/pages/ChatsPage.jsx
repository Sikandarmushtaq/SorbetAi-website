
import './ChatsPage.css';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { useSearchParams } from 'react-router-dom';

import {
  ArrowLeft,
  FileText,
  MessageCircle,
  Paperclip,
  Search,
  Send,
  X,
} from 'lucide-react';

import { chatsApi } from '../../../services/dashboard/chats.api.js';

import {
  useNotice,
} from '../../../components/dashboard/common/DashboardUI';

const CHANNEL_TABS = [
  { label: 'All', value: 'all' },
  { label: 'WhatsApp', value: 'whatsapp' },
  { label: 'Website Chat', value: 'website' },
];

/* ==========================================
   API RESPONSE HELPERS
========================================== */

function unwrapResponse(response) {
  return response?.data?.data ?? response?.data ?? response;
}

function getChatRecords(response) {
  const data = unwrapResponse(response);

  if (Array.isArray(data)) return data;

  const records =
    data?.items ??
    data?.results ??
    data?.conversations ??
    data?.chats ??
    [];

  return Array.isArray(records) ? records : [];
}

function getChatDetails(response) {
  const data = unwrapResponse(response);

  return data?.conversation ?? data?.chat ?? data ?? {};
}

function getChatId(chat) {
  return String(
    chat?.id ??
    chat?.chat_id ??
    chat?.conversation_id ??
    ''
  );
}

function getCustomerId(chat) {
  return String(
    chat?.customer_id ??
    chat?.customer?.id ??
    ''
  );
}

function getCustomerName(chat) {
  return (
    chat?.customer_name ||
    chat?.customer?.full_name ||
    chat?.customer?.name ||
    chat?.name ||
    'Customer'
  );
}

function getCustomerInitial(chat) {
  const name = getCustomerName(chat);
  return name.trim().charAt(0).toUpperCase() || 'C';
}

function messageContent(message) {
  if (typeof message === 'string') return message;

  const content =
    message?.text ??
    message?.body ??
    message?.content ??
    message?.message ??
    '';

  return typeof content === 'string' ? content : '';
}

function getLastMessage(chat) {
  const messages = Array.isArray(chat?.messages)
    ? chat.messages
    : [];

  const last =
    chat?.last_message ??
    chat?.latest_message ??
    messages[messages.length - 1];

  return (
    messageContent(last) ||
    (last?.attachment ? 'Attachment' : 'No messages yet')
  );
}

function getChatChannel(chat) {
  const source =
    chat?.channel ??
    chat?.channel_type ??
    chat?.provider ??
    '';

  return String(
    typeof source === 'object'
      ? source?.type || source?.name || ''
      : source
  ).toLowerCase();
}

function formatTime(value) {
  if (!value) return '';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getMessages(conversation) {
  const records =
    conversation?.messages ??
    conversation?.message_items ??
    [];

  return Array.isArray(records) ? records : [];
}

/* ==========================================
   EMPTY STATES
========================================== */

function NoChatsState({ error }) {
  return (
    <div className="dp-chat-empty-list">
      <div className="dp-chat-empty-icon">
        <MessageCircle size={23} strokeWidth={1.7} />
      </div>

      <h3>
        {error ? 'Chats unavailable' : 'No chats yet'}
      </h3>

      <p>
        {error ||
          'Customer chats from your connected channels show up here.'}
      </p>
    </div>
  );
}

function NoConversationState() {
  return (
    <div className="dp-chat-placeholder">
      <div className="dp-chat-placeholder-icon">
        <MessageCircle size={27} strokeWidth={1.8} />
      </div>

      <h3>Select a conversation</h3>

      <p>
        Pick a chat from the list to start replying
      </p>
    </div>
  );
}

/* ==========================================
   MAIN CHATS PAGE
========================================== */

export default function ChatsPage() {
  const [searchParams, setSearchParams] =
    useSearchParams();

  const requestedChannel =
    searchParams.get('channel') || 'all';

  const channel = CHANNEL_TABS.some(
    (tab) => tab.value === requestedChannel
  )
    ? requestedChannel
    : 'all';

  const query = searchParams.get('q') || '';

  const selectedChatId =
    searchParams.get('chat') || '';

  const requestedCustomerId =
    searchParams.get('customer') || '';

  const [conversations, setConversations] =
    useState([]);

  const [selectedDetails, setSelectedDetails] =
    useState(null);

  const [isLoading, setIsLoading] = useState(true);

  const [isDetailLoading, setIsDetailLoading] =
    useState(false);

  const [isSending, setIsSending] = useState(false);

  const [loadError, setLoadError] = useState('');

  const [sendError, setSendError] = useState('');

  const [messageText, setMessageText] = useState('');

  const [attachment, setAttachment] = useState(null);

  const attachmentInputRef = useRef(null);

  const messagesContainerRef = useRef(null);

  const { Notice, showNotice } = useNotice();

  /* ========================================
     LOAD CUSTOMER CONVERSATIONS
  ======================================== */

  const loadChats = useCallback(async () => {
    if (!chatsApi.isConfigured()) {
      setConversations([]);
      setLoadError(
        'Connect the Chats API to load customer conversations.'
      );
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError('');

    try {
      const response = await chatsApi.request({
        query: {
          channel:
            channel === 'all' ? undefined : channel,
          search: query || undefined,
          customer_id:
            requestedCustomerId || undefined,
        },
      });

      setConversations(getChatRecords(response));
    } catch (error) {
      setLoadError(error.message);
      setConversations([]);
    } finally {
      setIsLoading(false);
    }
  }, [channel, query, requestedCustomerId]);

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  /* ========================================
     FILTER CONVERSATIONS
  ======================================== */

  const visibleConversations = useMemo(() => {
    const normalizedQuery = query
      .trim()
      .toLowerCase();

    return conversations.filter((chat) => {
      const chatChannel = getChatChannel(chat);

      let matchesChannel = true;

      if (channel !== 'all' && chatChannel) {
        if (channel === 'website') {
          matchesChannel =
            chatChannel.includes('website') ||
            chatChannel.includes('webchat') ||
            chatChannel.includes('web_chat');
        } else {
          matchesChannel =
            chatChannel.includes(channel);
        }
      }

      const searchable = [
        getCustomerName(chat),
        getLastMessage(chat),
        chat?.phone,
        chat?.customer?.phone,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const matchesSearch =
        !normalizedQuery ||
        searchable.includes(normalizedQuery);

      return matchesChannel && matchesSearch;
    });
  }, [conversations, channel, query]);

  /* ========================================
     AUTO SELECT CUSTOMER FROM URL
  ======================================== */

  useEffect(() => {
    if (
      !requestedCustomerId ||
      selectedChatId ||
      conversations.length === 0
    ) {
      return;
    }

    const matchingChat = conversations.find(
      (chat) =>
        getCustomerId(chat) === requestedCustomerId
    );

    if (!matchingChat || !getChatId(matchingChat)) {
      return;
    }

    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);

        next.set('chat', getChatId(matchingChat));

        return next;
      },
      { replace: true }
    );
  }, [
    conversations,
    requestedCustomerId,
    selectedChatId,
    setSearchParams,
  ]);

  /* ========================================
     UPDATE URL FILTER
  ======================================== */

  const updateFilter = (key, value) => {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);

        if (
          !value ||
          (key === 'channel' && value === 'all')
        ) {
          next.delete(key);
        } else {
          next.set(key, value);
        }

        if (key === 'channel' || key === 'q') {
          next.delete('chat');
          next.delete('customer');
        }

        return next;
      },
      { replace: true }
    );
  };

  /* ========================================
     SELECT A CONVERSATION
  ======================================== */

  const selectConversation = (chat) => {
    const id = getChatId(chat);

    if (!id) {
      showNotice(
        'This conversation has no valid ID.'
      );
      return;
    }

    setSelectedDetails(null);
    setSendError('');
    setAttachment(null);
    setMessageText('');

    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);

        next.set('chat', id);

        if (getCustomerId(chat)) {
          next.set('customer', getCustomerId(chat));
        } else {
          next.delete('customer');
        }

        return next;
      },
      { replace: true }
    );
  };

  const backToChats = () => {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);

        next.delete('chat');
        next.delete('customer');

        return next;
      },
      { replace: true }
    );
  };

  /* ========================================
     SELECTED CHAT
  ======================================== */

  const selectedConversation = useMemo(() => {
    return (
      conversations.find(
        (chat) =>
          getChatId(chat) === selectedChatId
      ) || null
    );
  }, [conversations, selectedChatId]);

  /* ========================================
     LOAD SELECTED CHAT DETAILS
  ======================================== */

  useEffect(() => {
    let active = true;

    setSelectedDetails(null);
    setSendError('');

    if (!selectedChatId || !chatsApi.isConfigured()) {
      setIsDetailLoading(false);
      return undefined;
    }

    setIsDetailLoading(true);

    chatsApi
      .request({ id: selectedChatId })
      .then((response) => {
        if (!active) return;

        const details = getChatDetails(response);

        setSelectedDetails({
          ...details,
          id: getChatId(details) || selectedChatId,
        });
      })
      .catch((error) => {
        if (active) {
          setSendError(error.message);
        }
      })
      .finally(() => {
        if (active) {
          setIsDetailLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [selectedChatId]);

  const activeConversation = selectedChatId
    ? (
        selectedDetails &&
        getChatId(selectedDetails) === selectedChatId
          ? {
              ...selectedConversation,
              ...selectedDetails,
            }
          : selectedConversation
      )
    : null;

  const messages = getMessages(activeConversation);

  /* ========================================
     SCROLL TO LATEST MESSAGE
  ======================================== */

  useEffect(() => {
    const container = messagesContainerRef.current;

    if (!container) return;

    container.scrollTop = container.scrollHeight;
  }, [selectedChatId, messages.length]);

  /* ========================================
     REFRESH INCOMING MESSAGES
  ======================================== */

  useEffect(() => {
    if (!chatsApi.isConfigured()) return undefined;

    let active = true;

    const refresh = async () => {
      if (document.visibilityState !== 'visible') {
        return;
      }

      try {
        const [listResponse, detailResponse] =
          await Promise.all([
            chatsApi.request({
              query: {
                channel:
                  channel === 'all'
                    ? undefined
                    : channel,
                search: query || undefined,
                customer_id:
                  requestedCustomerId || undefined,
              },
            }),

            selectedChatId
              ? chatsApi.request({
                  id: selectedChatId,
                })
              : Promise.resolve(null),
          ]);

        if (!active) return;

        setConversations(
          getChatRecords(listResponse)
        );

        if (detailResponse && selectedChatId) {
          const details =
            getChatDetails(detailResponse);

          setSelectedDetails({
            ...details,
            id:
              getChatId(details) ||
              selectedChatId,
          });
        }
      } catch {
        // Keep the latest successfully loaded data.
      }
    };

    const interval = window.setInterval(
      refresh,
      30000
    );

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [
    channel,
    query,
    requestedCustomerId,
    selectedChatId,
  ]);

  /* ========================================
     ATTACH FILE
  ======================================== */

  const chooseAttachment = (event) => {
    const file = event.target.files?.[0] || null;

    if (!file) return;

    const maximumSize = 10 * 1024 * 1024;

    if (file.size > maximumSize) {
      showNotice(
        'Maximum attachment size is 10 MB.'
      );

      event.target.value = '';
      return;
    }

    const allowedTypes = [
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    const isImage = file.type.startsWith('image/');

    const allowed =
      isImage || allowedTypes.includes(file.type);

    if (!allowed) {
      showNotice(
        'Select an image, PDF, TXT, DOC or DOCX file.'
      );

      event.target.value = '';
      return;
    }

    setAttachment(file);
  };

  /* ========================================
     SEND MESSAGE
  ======================================== */

  const sendMessage = async (event) => {
    event.preventDefault();

    const text = messageText.trim();

    if (
      (!text && !attachment) ||
      !selectedChatId ||
      isSending
    ) {
      return;
    }

    setIsSending(true);
    setSendError('');

    try {
      let body;

      if (attachment) {
        body = new FormData();

        body.append('text', text);
        body.append('attachment', attachment);
      } else {
        body = { text };
      }

      await chatsApi.request({
        method: 'POST',
        id: selectedChatId,
        action: 'messages',
        body,
      });

      setMessageText('');
      setAttachment(null);

      if (attachmentInputRef.current) {
        attachmentInputRef.current.value = '';
      }

      try {
        const response = await chatsApi.request({
          id: selectedChatId,
        });

        const details = getChatDetails(response);

        setSelectedDetails({
          ...details,
          id:
            getChatId(details) ||
            selectedChatId,
        });
      } catch {
        showNotice(
          'Message sent. The conversation will refresh shortly.'
        );
      }
    } catch (error) {
      setSendError(
        error.message || 'Unable to send message.'
      );
    } finally {
      setIsSending(false);
    }
  };

  /* ========================================
     RENDER
  ======================================== */

  return (
    <div className="dp-chats-screen">
      {Notice}

      <div
        className={`dp-chat-layout ${
          selectedChatId
            ? 'has-chat-selection'
            : ''
        }`}
      >
        {/* LEFT SIDE: CHAT LIST */}

        <aside className="dp-chat-list">
          <div className="dp-chat-list-heading">
            <h2>Chats</h2>

            <span>
              {isLoading
                ? '...'
                : `${visibleConversations.length} total`}
            </span>
          </div>

          {/* SEARCH */}

          <div className="dp-chat-search-area">
            <label className="dp-chat-search">
              <Search size={17} />

              <input
                type="search"
                placeholder="Search customers..."
                value={query}
                onChange={(event) =>
                  updateFilter(
                    'q',
                    event.target.value
                  )
                }
                aria-label="Search customers"
              />
            </label>
          </div>

          {/* CHANNEL FILTERS */}

          <div
            className="dp-chat-channel-tabs"
            role="tablist"
            aria-label="Chat channels"
          >
            {CHANNEL_TABS.map((tab) => (
              <button
                type="button"
                role="tab"
                key={tab.value}
                aria-selected={
                  channel === tab.value
                }
                className={
                  channel === tab.value
                    ? 'active'
                    : ''
                }
                onClick={() =>
                  updateFilter(
                    'channel',
                    tab.value
                  )
                }
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* CONVERSATION RECORDS */}

          <div className="dp-chat-rows">
            {isLoading ? (
              <div className="dp-chat-loading">
                Loading conversations...
              </div>
            ) : loadError ? (
              <NoChatsState error={loadError} />
            ) : visibleConversations.length === 0 ? (
              <NoChatsState />
            ) : (
              visibleConversations.map((chat, index) => {
                const id = getChatId(chat);

                const unread =
                  Number(chat?.unread_count || 0) > 0 ||
                  chat?.is_read === false;

                const active =
                  id === selectedChatId;

                return (
                  <button
                    type="button"
                    key={id || `chat-${index}`}
                    className={`dp-chat-row ${
                      active ? 'active' : ''
                    }`}
                    onClick={() =>
                      selectConversation(chat)
                    }
                  >
                    <span className="dp-chat-avatar">
                      {getCustomerInitial(chat)}
                    </span>

                    <span className="dp-chat-row-copy">
                      <strong>
                        {getCustomerName(chat)}
                      </strong>

                      <small>
                        {getLastMessage(chat)}
                      </small>
                    </span>

                    <span className="dp-chat-row-meta">
                      <time>
                        {formatTime(
                          chat?.last_message_at ||
                          chat?.updated_at ||
                          chat?.created_at
                        )}
                      </time>

                      {unread && (
                        <i
                          aria-label="Unread message"
                        />
                      )}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* RIGHT SIDE: CONVERSATION */}

        <main className="dp-chat-conversation">
          {!selectedChatId ? (
            <NoConversationState />
          ) : activeConversation ? (
            <div className="dp-chat-active-view">
              {/* CUSTOMER HEADER */}

              <header className="dp-chat-active-header">
                <button
                  type="button"
                  className="dp-chat-back-button"
                  onClick={backToChats}
                  aria-label="Back to chats"
                >
                  <ArrowLeft size={19} />
                </button>

                <span className="dp-chat-avatar">
                  {getCustomerInitial(
                    activeConversation
                  )}
                </span>

                <div className="dp-chat-header-user">
                  <strong>
                    {getCustomerName(
                      activeConversation
                    )}
                  </strong>

                  <small>
                    {activeConversation?.phone ||
                      activeConversation?.customer
                        ?.phone ||
                      getChatChannel(
                        activeConversation
                      ) ||
                      'Customer conversation'}
                  </small>
                </div>
              </header>

              {/* MESSAGES */}

              <div
                className="dp-chat-message-list"
                ref={messagesContainerRef}
              >
                {isDetailLoading &&
                  messages.length === 0 && (
                    <div className="dp-chat-loading">
                      Loading messages...
                    </div>
                  )}

                {!isDetailLoading &&
                  messages.length === 0 && (
                    <div className="dp-chat-message-empty">
                      <MessageCircle size={29} />

                      <h3>No messages yet</h3>

                      <p>
                        Customer messages will appear
                        here.
                      </p>
                    </div>
                  )}

                {messages.map((message, index) => {
                  const outbound =
                    message?.direction ===
                      'outbound' ||
                    message?.role ===
                      'assistant' ||
                    message?.role === 'agent' ||
                    message?.is_from_business ===
                      true;

                  return (
                    <article
                      key={
                        message?.id ||
                        message?.message_id ||
                        `message-${index}`
                      }
                      className={`dp-chat-message-bubble ${
                        outbound
                          ? 'outbound'
                          : 'inbound'
                      }`}
                    >
                      <p>
                        {messageContent(message) ||
                          (message?.attachment
                            ? 'Attachment'
                            : '')}
                      </p>

                      <time>
                        {formatTime(
                          message?.created_at ||
                          message?.sent_at
                        )}
                      </time>
                    </article>
                  );
                })}
              </div>

              {/* ATTACHMENT PREVIEW */}

              {attachment && (
                <div className="dp-chat-file-pill">
                  <FileText size={16} />

                  <span>{attachment.name}</span>

                  <button
                    type="button"
                    onClick={() =>
                      setAttachment(null)
                    }
                    aria-label="Remove attachment"
                  >
                    <X size={17} />
                  </button>
                </div>
              )}

              {/* MESSAGE COMPOSER */}

              <form
                className="dp-chat-compose"
                onSubmit={sendMessage}
              >
                <input
                  ref={attachmentInputRef}
                  type="file"
                  className="dp-chat-hidden-input"
                  accept="image/*,.pdf,.txt,.doc,.docx"
                  onChange={chooseAttachment}
                />

                <button
                  type="button"
                  className="dp-chat-attach-button"
                  title="Attach file"
                  aria-label="Attach file"
                  onClick={() =>
                    attachmentInputRef.current?.click()
                  }
                >
                  <Paperclip size={18} />
                </button>

                <input
                  type="text"
                  value={messageText}
                  onChange={(event) =>
                    setMessageText(
                      event.target.value
                    )
                  }
                  placeholder="Write a reply..."
                  aria-label="Write a reply"
                />

                <button
                  type="submit"
                  className="dp-chat-send-button"
                  disabled={
                    isSending ||
                    (!messageText.trim() &&
                      !attachment)
                  }
                  aria-label="Send message"
                >
                  {isSending ? (
                    <span className="dp-chat-sending">
                      ...
                    </span>
                  ) : (
                    <Send size={19} />
                  )}
                </button>
              </form>

              {sendError && (
                <div
                  className="dp-chat-send-error"
                  role="alert"
                >
                  {sendError}
                </div>
              )}
            </div>
          ) : (
            <div className="dp-chat-placeholder">
              <MessageCircle size={29} />

              <h3>Conversation unavailable</h3>

              <p>
                {sendError ||
                  'Unable to load this conversation.'}
              </p>

              <button
                type="button"
                className="dp-chat-back-inline"
                onClick={backToChats}
              >
                Back to chats
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
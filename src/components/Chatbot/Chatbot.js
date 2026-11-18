
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { X } from 'lucide-react';

import ChatbotHeader from './ChatbotHeader';
import ChatbotForm from './ChatbotForm';
import ChatWindow from './ChatWindow';

import {
  startConversation,
  sendMessage,
  endConversation,
  isChatbotApiConfigured,
} from '../../components/services/chatbotService.js';

import './Chatbot.css';

gsap.registerPlugin(useGSAP);

export default function Chatbot() {
  const widgetRef = useRef(null);
  const panelRef = useRef(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const [isOpen, setIsOpen] = useState(false);
  const [screen, setScreen] = useState('form');
  const [customer, setCustomer] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [apiError, setApiError] = useState('');

  useGSAP(
    () => {
      if (!isOpen || !panelRef.current) return;

      gsap.fromTo(
        panelRef.current,
        { y: 22, opacity: 0, scale: 0.96 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.4,
          ease: 'back.out(1.4)',
        }
      );
    },
    {
      scope: widgetRef,
      dependencies: [isOpen, screen],
      revertOnUpdate: true,
    }
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'end',
    });
  }, [messages]);

  useEffect(() => {
    if (isOpen && screen === 'chat') {
      inputRef.current?.focus();
    }
  }, [isOpen, screen]);

  // Opens a conversation and creates the initial welcome message.
  const handleStartChat = (details) => {
    setCustomer(details);
    setApiError('');
    setConversationId(null);

    setMessages([
      {
        id: 'welcome',
        sender: 'assistant',
        text: 'S',
        createdAt: new Date(),
      },
    ]);

    setScreen('chat');

    if (isChatbotApiConfigured) {
      startConversation(details)
        .then((result) => {
          setConversationId(
            result.conversationId ||
            result.conversation_id ||
            result.id
          );
        })
        .catch((error) => {
          setApiError(error.message);
        });
    }
  };

  // Displays the customer message immediately and requests an API reply if available.
  const handleSendMessage = async (text, attachment) => {
    const messageText = text.trim();

    if (!messageText && !attachment) return;

    const userMessage = {
      id: `user-${Date.now()}-${Math.random()}`,
      sender: 'user',
      text: messageText,
      fileName: attachment?.name || '',
      createdAt: new Date(),
    };

    setMessages((previousMessages) => [
      ...previousMessages,
      userMessage,
    ]);

    setApiError('');

    if (!isChatbotApiConfigured || !conversationId) {
      return;
    }

    setIsSending(true);

    try {
      const result = await sendMessage(
        conversationId,
        messageText,
        attachment
      );

      const reply = result?.reply || result?.message;

      if (reply) {
        setMessages((previousMessages) => [
          ...previousMessages,
          {
            id: `assistant-${Date.now()}`,
            sender: 'assistant',
            text: typeof reply === 'string' ? reply : reply.text,
            createdAt: new Date(),
          },
        ]);
      }
    } catch (error) {
      setApiError(error.message);
    } finally {
      setIsSending(false);
    }
  };

  // Ends the conversation and resets the chat.
  const handleEndChat = async () => {
    if (isChatbotApiConfigured && conversationId) {
      try {
        await endConversation(conversationId);
      } catch (error) {
        setApiError(error.message);
      }
    }

    setConversationId(null);
    setCustomer(null);
    setMessages([]);
    setApiError('');
    setIsSending(false);
    setScreen('form');
  };

  return (
    <div ref={widgetRef} className="bellbee-chatbot">
      {isOpen && (
        <div ref={panelRef} className="chatbot-panel">
          <ChatbotHeader
            screen={screen}
            onEndChat={handleEndChat}
          />

          {screen === 'form' ? (
            <ChatbotForm onStartChat={handleStartChat} />
          ) : (
            <ChatWindow
              customer={customer}
              messages={messages}
              messagesEndRef={messagesEndRef}
              inputRef={inputRef}
              isSending={isSending}
              apiError={apiError}
              apiConnected={isChatbotApiConfigured}
              onSendMessage={handleSendMessage}
            />
          )}
        </div>
      )}

      <button
        type="button"
        className={`chatbot-launcher ${isOpen ? 'is-open' : ''}`}
        onClick={() => setIsOpen((previous) => !previous)}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <X size={27} strokeWidth={1.8} />
        ) : (
          <span>S</span>
        )}
      </button>
    </div>
  );
}

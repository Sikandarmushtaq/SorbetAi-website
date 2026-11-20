
import { channelsApi } from '../../../services/dashboard/channels.api.js';
import './ChannelsPage.css';

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CirclePlus, Globe } from 'lucide-react';

import {
  PageHeader,
  Panel,
} from '../../../components/dashboard/common/DashboardUI';

/* WhatsApp brand icon */
function WhatsAppMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="25"
      height="25"
      role="img"
      aria-label="WhatsApp"
    >
      <path
        fill="#25D366"
        d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5.1-1.3A10 10 0 1 0 12 2Z"
      />
      <path
        fill="#fff"
        d="M17.1 14.1c-.28-.14-1.63-.8-1.89-.89-.25-.09-.44-.14-.63.14-.19.28-.72.89-.88 1.07-.16.19-.32.21-.6.07-.28-.14-1.18-.44-2.25-1.4-.83-.74-1.39-1.65-1.55-1.93-.16-.28-.02-.43.12-.57.12-.12.28-.32.42-.48.14-.16.19-.28.28-.47.09-.19.05-.35-.02-.49-.07-.14-.63-1.52-.86-2.08-.23-.54-.46-.47-.63-.48h-.54c-.19 0-.49.07-.75.35-.26.28-.98.96-.98 2.34s1 2.72 1.14 2.91c.14.19 1.97 3.01 4.77 4.22.67.29 1.19.46 1.6.59.67.21 1.28.18 1.76.11.54-.08 1.63-.67 1.86-1.32.23-.65.23-1.21.16-1.32-.07-.12-.25-.19-.54-.33Z"
      />
    </svg>
  );
}

/* Messenger brand icon */
function MessengerMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="25"
      height="25"
      role="img"
      aria-label="Facebook Messenger"
    >
      <path
        fill="#1877F2"
        d="M12 2C6.48 2 2 6.15 2 11.27c0 2.91 1.44 5.5 3.7 7.19V22l3.38-1.85c.93.26 1.91.39 2.92.39 5.52 0 10-4.15 10-9.27S17.52 2 12 2Z"
      />
      <path
        fill="#fff"
        d="m5.5 14.5 5.25-5.6 3.1 3.1 4.65-3.1-5.25 5.6-3.1-3.1-4.65 3.1Z"
      />
    </svg>
  );
}

/* Instagram brand icon */
function InstagramMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="25"
      height="25"
      role="img"
      aria-label="Instagram"
    >
      <rect
        x="2.5"
        y="2.5"
        width="19"
        height="19"
        rx="5.5"
        fill="none"
        stroke="#E1306C"
        strokeWidth="2.1"
      />
      <circle
        cx="12"
        cy="12"
        r="4.2"
        fill="none"
        stroke="#E1306C"
        strokeWidth="2.1"
      />
      <circle cx="18" cy="6.3" r="1.35" fill="#E1306C" />
    </svg>
  );
}

/* Read channel records from the existing API */
function channelRecords(response) {
  const data = response?.data || response;

  const records = Array.isArray(data)
    ? data
    : data?.items || data?.channels || [];

  return Array.isArray(records) ? records : [];
}

function isConnected(channel) {
  if (!channel) return false;

  return (
    channel.connected === true ||
    channel.is_connected === true ||
    ['connected', 'active'].includes(
      String(channel.status || '').toLowerCase()
    )
  );
}

function findChannel(channels, names) {
  return channels.find((channel) => {
    const value = [
      channel.type,
      channel.name,
      channel.channel,
      channel.provider,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .replaceAll('_', ' ');

    return names.some((name) => value.includes(name));
  });
}

export default function ChannelsPage() {
  const navigate = useNavigate();

  const [channels, setChannels] = useState([]);
  const [isLoading, setIsLoading] = useState(
    channelsApi.isConfigured()
  );
  const [loadError, setLoadError] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;

    if (!channelsApi.isConfigured()) {
      setIsLoading(false);
      return undefined;
    }

    channelsApi.request()
      .then((response) => {
        if (!active) return;

        setChannels(channelRecords(response));
        setLoaded(true);
      })
      .catch((error) => {
        if (!active) return;

        setLoadError(error.message);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const whatsapp = findChannel(channels, [
    'whatsapp',
  ]);

  const website = findChannel(channels, [
    'website',
    'web chat',
    'webchat',
  ]);

  const facebook = findChannel(channels, [
    'facebook',
    'messenger',
  ]);

  const instagram = findChannel(channels, [
    'instagram',
  ]);

  const socialConnected =
    isConnected(facebook) || isConnected(instagram);

  function getChannelStatus(channel, type) {
    if (isLoading) return 'Checking status…';

    if (loadError || !channelsApi.isConfigured() || !loaded) {
      return 'Status unavailable';
    }

    if (type === 'social') {
      return socialConnected ? 'Connected' : 'Not connected';
    }

    if (type === 'website') {
      const subscribed =
        channel?.is_subscribed ??
        channel?.subscribed ??
        channel?.addon_active;

      if (subscribed === false) return 'Not subscribed';

      if (
        ['not_subscribed', 'inactive', 'cancelled'].includes(
          String(
            channel?.subscription_status ||
            channel?.addon_status ||
            ''
          ).toLowerCase()
        )
      ) {
        return 'Not subscribed';
      }

      if (!channel) return 'Not subscribed';
    }

    if (isConnected(channel)) return 'Connected';

    return channel?.status || 'Not connected';
  }

  const cards = [
    {
      key: 'whatsapp',
      title: 'WhatsApp',
      description:
        'Your AI assistant replies to customers automatically on WhatsApp.',
      status: getChannelStatus(whatsapp, 'whatsapp'),
      route: '/dashboard/whatsapp',
      button: 'Manage Channel',
    },
    {
      key: 'website',
      title: 'Website Chat',
      description:
        'Embed the same AI assistant directly on your website to capture leads and resolve queries instantly.',
      status: getChannelStatus(website, 'website'),
      route: '/dashboard/website-chat',
      button: 'Manage Widget',
    },
    {
      key: 'social',
      title: 'Facebook & Instagram',
      description:
        'Answer Messenger and Instagram messages and comments with the same AI assistant.',
      status: getChannelStatus(null, 'social'),
      route: '/dashboard/facebook-instagram',
      button: 'Connect Page',
    },
  ];

  function renderIcon(key) {
    if (key === 'whatsapp') {
      return (
        <span className="dp-channels-icon dp-channels-icon-whatsapp">
          <WhatsAppMark />
        </span>
      );
    }

    if (key === 'website') {
      return (
        <span className="dp-channels-icon dp-channels-icon-website">
          <Globe size={23} />
        </span>
      );
    }

    return (
      <div className="dp-channels-social-icons">
        <span className="dp-channels-icon dp-channels-icon-messenger">
          <MessengerMark />
        </span>

        <span className="dp-channels-icon dp-channels-icon-instagram">
          <InstagramMark />
        </span>
      </div>
    );
  }

  return (
    <main className="dp-channels-page">
      <PageHeader
        title="Channels"
        description="Connect and manage every way customers reach your business."
      />

      {loadError && (
        <div
          className="dp-inline-notice dp-api-error"
          role="status"
        >
          {loadError}
        </div>
      )}

      <div className="dp-channels-section-heading">
        LIVE CHANNELS
      </div>

      <div className="dp-channels-cards">
        {cards.map((card) => {
          const connected = card.status === 'Connected';

          return (
            <Panel
              className="dp-channels-card"
              key={card.key}
            >
              <div className="dp-channels-card-top">
                {renderIcon(card.key)}

                <span
                  className={`dp-channels-status ${
                    connected
                      ? 'dp-channels-status-connected'
                      : ''
                  }`}
                >
                  {card.status}
                </span>
              </div>

              <div className="dp-channels-card-body">
                <h2>{card.title}</h2>

                <p>{card.description}</p>
              </div>

              <button
                type="button"
                className="dp-primary-button dp-channels-manage-button"
                onClick={() => navigate(card.route)}
              >
                <span>{card.button}</span>
                <ArrowRight size={15} />
              </button>
            </Panel>
          );
        })}
      </div>

      <button
        type="button"
        className="dp-channels-request"
        onClick={() => navigate('/dashboard/support')}
      >
        <CirclePlus size={21} />
        <span>Request a new channel</span>
      </button>
    </main>
  );
}

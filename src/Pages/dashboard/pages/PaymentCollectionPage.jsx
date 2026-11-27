
import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  ArrowUpRight,
  CreditCard,
  Link2,
  LockKeyhole,
  Plus,
  RefreshCw,
  ShieldCheck,
  Wallet,
} from 'lucide-react';

import {
  paymentCollectionApi,
} from '../../../services/dashboard/payment-collection.api.js';

import {
  EmptyState,
  PageHeader,
  Panel,
} from '../../../components/dashboard/common/DashboardUI';

import {
  useDashboardToast,
} from '../../../components/dashboard/common/DashboardToastProvider';

import './PaymentCollectionPage.css';

function connectionsFrom(response) {
  const data = response?.data || response;

  const records = Array.isArray(data)
    ? data
    : data?.connections ||
      data?.payment_methods ||
      data?.items ||
      [];

  return Array.isArray(records)
    ? records
    : [];
}

function connectedProvider(connection) {
  return (
    connection.connected === true ||
    connection.is_connected === true ||
    String(
      connection.status || ''
    ).toLowerCase() === 'connected'
  );
}

function providerId(connection) {
  return (
    connection.provider ||
    connection.id ||
    ''
  );
}

export default function PaymentCollectionPage() {
  const toast = useDashboardToast();

  const [
    connections,
    setConnections,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    busyProvider,
    setBusyProvider,
  ] = useState('');

  const [
    error,
    setError,
  ] = useState('');

  const loadConnections = useCallback(
    async ({ notify = false } = {}) => {
      if (!paymentCollectionApi.isConfigured()) {
        setError(
          'Payment collection API is not configured yet.'
        );

        if (notify) {
          toast.warning(
            'Payment providers unavailable',
            'Configure the existing payment collection endpoint.'
          );
        }

        return;
      }

      setLoading(true);
      setError('');

      try {
        const response =
          await paymentCollectionApi.request();

        setConnections(
          connectionsFrom(response)
        );

        if (notify) {
          toast.success(
            'Payment connections refreshed',
            'Latest provider statuses were loaded.'
          );
        }
      } catch (requestError) {
        setError(
          requestError?.message ||
            'Unable to load payment connections.'
        );

        if (notify) {
          toast.error(
            'Could not load providers',
            requestError?.message ||
              'Please try again.'
          );
        }
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    loadConnections();
  }, [loadConnections]);

  const connectProvider = async (provider) => {
    if (!paymentCollectionApi.isConfigured()) {
      toast.warning(
        'Payment connection unavailable',
        'Payment collection API is not configured.'
      );

      return;
    }

    if (!provider || busyProvider) return;

    setBusyProvider(provider);

    const pendingId = toast.loading(
      'Starting secure connection',
      'Requesting the provider connection link…'
    );

    try {
      const result =
        await paymentCollectionApi.request({
          method: 'POST',
          id: provider,
          action: 'connect',
          body: {},
        });

      const redirect =
        result?.authorization_url ||
        result?.connect_url ||
        result?.checkout_url;

      if (redirect) {
        let safeUrl;

        try {
          safeUrl = new URL(redirect);
        } catch {
          throw new Error(
            'The payment provider returned an invalid connection link.'
          );
        }

        if (
          !['https:', 'http:'].includes(
            safeUrl.protocol
          )
        ) {
          throw new Error(
            'The payment provider returned an unsupported connection link.'
          );
        }

        toast.update(
          pendingId,
          'info',
          'Opening secure provider setup',
          'Finish connecting your account on the provider website.'
        );

        window.location.assign(
          safeUrl.href
        );

        return;
      }

      toast.update(
        pendingId,
        'info',
        'Connection request submitted',
        result?.message ||
          'Check the connection status for further updates.'
      );

      await loadConnections();
    } catch (requestError) {
      toast.update(
        pendingId,
        'error',
        'Unable to start connection',
        requestError?.message ||
          'Please try again.'
      );
    } finally {
      setBusyProvider('');
    }
  };

  const disconnectProvider = async (
    connection
  ) => {
    const provider =
      providerId(connection);

    if (!provider || busyProvider) return;

    if (!paymentCollectionApi.isConfigured()) {
      toast.warning(
        'Payment connection unavailable',
        'Payment collection API is not configured.'
      );

      return;
    }

    setBusyProvider(provider);

    const pendingId = toast.loading(
      'Disconnecting payment provider',
      'Updating your account securely…'
    );

    try {
      await paymentCollectionApi.request({
        method: 'POST',
        id: provider,
        action: 'disconnect',
        body: {},
      });

      toast.update(
        pendingId,
        'success',
        'Payment provider disconnected',
        'The backend confirmed disconnection.'
      );

      await loadConnections();
    } catch (requestError) {
      toast.update(
        pendingId,
        'error',
        'Could not disconnect provider',
        requestError?.message ||
          'Please try again.'
      );
    } finally {
      setBusyProvider('');
    }
  };

  const connectedCount =
    connections.filter(
      connectedProvider
    ).length;

  return (
    <main className="bb-payment-premium">
      <PageHeader
        eyebrow="BILLING / PAYMENT COLLECTION"
        title="Payment collection"
        description="Connect payment providers so your business can collect payments securely."
        actions={
          <button
            type="button"
            className="dp-secondary-button"
            onClick={() =>
              loadConnections({
                notify: true,
              })
            }
            disabled={loading}
          >
            <RefreshCw size={15} />

            {loading
              ? 'Refreshing…'
              : 'Refresh'}
          </button>
        }
      />

      {error && (
        <div
          className="dp-inline-notice dp-api-error"
          role="alert"
        >
          {error}
        </div>
      )}

      <Panel className="dp-payment-hero">
        <div className="dp-billing-hero-icon">
          <Wallet size={23} />
        </div>

        <span className="dp-section-kicker">
          PAYMENTS FOR YOUR BUSINESS
        </span>

        <h2>
          Take payments with confidence
        </h2>

        <p>
          Connect a supported payment
          provider to enable payment
          collection across conversations,
          bookings and orders. Bellbee's
          backend confirms provider
          availability and account status.
        </p>

        <div className="dp-payment-security">
          <ShieldCheck size={17} />

          Payment credentials stay with
          your provider and Bellbee backend.
        </div>
      </Panel>

      <div className="dp-section-heading bb-payment-section-heading">
        <div>
          <span className="dp-section-kicker">
            YOUR ACCOUNTS
          </span>

          <h2>
            Payment connections
          </h2>
        </div>

        <span
          className={`dp-status-pill ${
            connectedCount
              ? 'success'
              : 'neutral'
          }`}
        >
          {connectedCount} connected
        </span>
      </div>

      {loading && !connections.length ? (
        <div
          className="dp-api-empty-state"
          role="status"
        >
          Loading payment connections…
        </div>
      ) : connections.length ? (
        <div className="dp-payment-provider-grid">
          {connections.map(
            (connection, index) => {
              const name =
                connection.display_name ||
                connection.name ||
                connection.provider ||
                'Payment provider';

              const connected =
                connectedProvider(connection);

              const provider =
                providerId(connection);

              const busy =
                Boolean(busyProvider);

              return (
                <Panel
                  className="dp-payment-provider-card"
                  key={
                    connection.id ||
                    provider ||
                    index
                  }
                >
                  <div className="dp-payment-provider-top">
                    <span className="dp-connection-icon">
                      <CreditCard size={20} />
                    </span>

                    <span
                      className={`dp-status-pill ${
                        connected
                          ? 'success'
                          : 'neutral'
                      }`}
                    >
                      {connected
                        ? 'Connected'
                        : connection.status ||
                          'Not connected'}
                    </span>
                  </div>

                  <h3>{name}</h3>

                  <p>
                    {connection.description ||
                      'Collect customer payments securely through Bellbee.'}
                  </p>

                  {connected ? (
                    <button
                      type="button"
                      className="dp-secondary-button"
                      onClick={() =>
                        disconnectProvider(
                          connection
                        )
                      }
                      disabled={
                        busy ||
                        !provider
                      }
                    >
                      {busyProvider === provider
                        ? 'Disconnecting…'
                        : 'Disconnect'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="dp-primary-button"
                      onClick={() =>
                        connectProvider(
                          provider
                        )
                      }
                      disabled={
                        busy ||
                        !provider
                      }
                    >
                      {busyProvider === provider
                        ? 'Connecting…'
                        : 'Connect provider'}

                      <ArrowUpRight size={15} />
                    </button>
                  )}
                </Panel>
              );
            }
          )}
        </div>
      ) : (
        <Panel>
          {!paymentCollectionApi.isConfigured() ? (
            <EmptyState
              icon={LockKeyhole}
              title="Payment providers not configured"
              description="Configure the existing payment collection API to load enabled providers."
            />
          ) : (
            <EmptyState
              icon={Link2}
              title="No providers available"
              description="When a payment provider becomes available to your workspace, it will appear here."
            />
          )}
        </Panel>
      )}

      {!paymentCollectionApi.isConfigured() && (
        <p className="dp-form-note">
          <Plus size={13} />

          Configure
          REACT_APP_API_PAYMENT_COLLECTION_PATH
          to load supported providers.
        </p>
      )}
    </main>
  );
}

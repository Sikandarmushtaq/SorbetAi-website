
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CheckCheck,
  Inbox,
  Mail,
  MailOpen,
  RefreshCw,
  Search,
  Send,
} from "lucide-react";

import {
  adminApi,
  normalizeRows,
} from "../../services/admin/adminApi";

import {
  AdminPageHeader,
  AdminFeedback,
} from "../../components/admin/AdminUI";

import {
  useAdminToast,
} from "../../components/admin/AdminToastProvider";

function messageId(item) {
  return (
    item?.id ??
    item?.message_id ??
    item?.contact_id
  );
}

function isRead(item) {
  return (
    item?.is_read === true ||
    Boolean(item?.read_at) ||
    [
      "read",
      "resolved",
    ].includes(
      String(
        item?.status || ""
      ).toLowerCase()
    )
  );
}

function displayDate(value) {
  if (!value) {
    return "Date unavailable";
  }

  const date = new Date(value);

  return Number.isNaN(
    date.getTime()
  )
    ? String(value)
    : date.toLocaleString(
        undefined,
        {
          dateStyle: "medium",
          timeStyle: "short",
        }
      );
}

function readRows(response) {
  if (Array.isArray(response)) {
    return response;
  }

  for (const value of [
    response?.messages,
    response?.contact_messages,
    response?.data?.messages,
    response?.data?.contact_messages,
  ]) {
    if (Array.isArray(value)) {
      return value;
    }
  }

  return normalizeRows(
    response,
    "messages"
  );
}

export default function AdminContactMessagesPage() {
  const toast = useAdminToast();

  const [messages, setMessages] =
    useState([]);

  const [selectedId, setSelectedId] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [query, setQuery] =
    useState("");

  const [filter, setFilter] =
    useState("all");

  const [updatingId, setUpdatingId] =
    useState(null);

  const configured =
    adminApi.isConfigured(
      "contactMessages"
    );

  const loadMessages = useCallback(
    async (
      notify = false
    ) => {
      if (!configured) {
        setLoading(false);

        setError(
          "Contact Messages API is not configured. Set REACT_APP_API_ADMIN_CONTACT_MESSAGES_PATH."
        );

        return;
      }

      setLoading(true);
      setError("");

      try {
        const response =
          await adminApi.list(
            "contactMessages"
          );

        const rows =
          readRows(response);

        setMessages(rows);

        setSelectedId(
          (previous) =>
            rows.some(
              (row) =>
                String(
                  messageId(row)
                ) === String(previous)
            )
              ? previous
              : (
                  messageId(rows[0]) ??
                  null
                )
        );

        if (notify) {
          toast.success(
            "Inbox refreshed",
            "Latest website contact messages loaded."
          );
        }
      } catch (failure) {
        const message =
          failure?.message ||
          "Unable to load website messages.";

        setError(message);

        if (notify) {
          toast.error(
            "Could not refresh inbox",
            message
          );
        }
      } finally {
        setLoading(false);
      }
    },
    [configured, toast]
  );

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const filtered = useMemo(() => {
    const search =
      query.trim().toLowerCase();

    return messages.filter((item) => {
      const statusMatch =
        filter === "all" ||
        (
          filter === "unread"
            ? !isRead(item)
            : isRead(item)
        );

      const text = [
        item.name,
        item.full_name,
        item.email,
        item.message,
        item.created_at,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (
        statusMatch &&
        (
          !search ||
          text.includes(search)
        )
      );
    });
  }, [
    messages,
    filter,
    query,
  ]);

  const selected =
    messages.find(
      (row) =>
        String(
          messageId(row)
        ) === String(selectedId)
    ) || null;

  const unreadCount =
    messages.filter(
      (item) => !isRead(item)
    ).length;

  async function setRead(
    item,
    nextValue
  ) {
    const id = messageId(item);

    if (
      id == null ||
      updatingId !== null
    ) {
      return;
    }

    setUpdatingId(String(id));

    const pending = toast.loading(
      "Updating message",
      "Saving read status…"
    );

    try {
      await adminApi.markContactMessage(
        id,
        nextValue
      );

      setMessages((current) =>
        current.map((row) =>
          String(
            messageId(row)
          ) === String(id)
            ? {
                ...row,

                is_read:
                  nextValue,

                read_at:
                  nextValue
                    ? new Date()
                        .toISOString()
                    : null,

                status:
                  nextValue
                    ? "read"
                    : "unread",
              }
            : row
        )
      );

      toast.update(
        pending,
        "success",
        nextValue
          ? "Marked as read"
          : "Marked as unread",
        "Inbox status saved."
      );
    } catch (failure) {
      toast.update(
        pending,
        "error",
        "Could not update message",
        failure?.message ||
          "Please try again."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <main className="bb-admin-contact">
      <AdminPageHeader
        eyebrow="WEBSITE / INBOX"
        title="Contact Messages"
        description="Review Name, Email and Message submissions from your public Contact page."
      >
        <button
          className="bb-admin-btn bb-admin-btn-light"
          type="button"
          onClick={() =>
            loadMessages(true)
          }
          disabled={
            loading || !configured
          }
        >
          <RefreshCw size={15} />

          {loading
            ? "Refreshing…"
            : "Refresh inbox"}
        </button>
      </AdminPageHeader>

      <div className="bb-admin-contact-stats">
        <div className="bb-admin-contact-stat">
          <span className="bb-admin-contact-stat-icon">
            <Inbox size={19} />
          </span>

          <div>
            <small>
              Messages loaded
            </small>

            <strong>
              {messages.length}
            </strong>
          </div>
        </div>

        <div className="bb-admin-contact-stat">
          <span className="bb-admin-contact-stat-icon coral">
            <Mail size={19} />
          </span>

          <div>
            <small>
              Unread messages
            </small>

            <strong>
              {unreadCount}
            </strong>
          </div>
        </div>
      </div>

      <div className="bb-admin-contact-grid">
        <section
          className="dp-panel bb-admin-panel bb-admin-contact-list-panel"
          aria-label="Contact messages"
        >
          <div className="bb-admin-panel-heading">
            <h2>
              Inbox

              <small>
                {filtered.length}
              </small>
            </h2>
          </div>

          <label className="bb-admin-filter-search bb-admin-contact-search">
            <Search size={17} />

            <input
              value={query}
              onChange={(event) =>
                setQuery(
                  event.target.value
                )
              }
              placeholder="Search name, email or message…"
              aria-label="Search contact messages"
            />
          </label>

          <div
            className="bb-admin-contact-filters"
            role="group"
            aria-label="Filter messages"
          >
            {[
              ["all", "All"],
              ["unread", "Unread"],
              ["read", "Read"],
            ].map(
              ([
                value,
                label,
              ]) => (
                <button
                  key={value}
                  type="button"
                  className={
                    filter === value
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setFilter(value)
                  }
                  aria-pressed={
                    filter === value
                  }
                >
                  {label}
                </button>
              )
            )}
          </div>

          <AdminFeedback
            loading={loading}
            error={error}
            empty={
              !filtered.length
            }
            onRetry={() =>
              loadMessages(true)
            }
            emptyTitle={
              messages.length
                ? "No matching messages"
                : "No contact messages yet"
            }
            emptyDescription={
              messages.length
                ? "Try changing the search or filter."
                : "When the public Contact API saves messages, they will appear here."
            }
          />

          {!loading &&
            !error &&
            filtered.length > 0 && (
              <div className="bb-admin-contact-list">
                {filtered.map(
                  (
                    item,
                    index
                  ) => {
                    const id =
                      messageId(item);

                    const active =
                      String(selectedId) ===
                      String(id);

                    return (
                      <button
                        key={
                          id ??
                          index
                        }
                        type="button"
                        className={`bb-admin-contact-row ${
                          active
                            ? "active"
                            : ""
                        } ${
                          !isRead(item)
                            ? "unread"
                            : ""
                        }`}
                        onClick={() =>
                          setSelectedId(id)
                        }
                      >
                        <span className="bb-admin-contact-row-avatar">
                          {String(
                            item.name ||
                            item.full_name ||
                            item.email ||
                            "?"
                          )
                            .charAt(0)
                            .toUpperCase()}
                        </span>

                        <span className="bb-admin-contact-row-body">
                          <strong>
                            {item.name ||
                              item.full_name ||
                              "Website visitor"}
                          </strong>

                          <small>
                            {item.email ||
                              "Email unavailable"}
                          </small>

                          <span>
                            {item.message ||
                              "No message text"}
                          </span>
                        </span>

                        {!isRead(item) && (
                          <i
                            className="bb-admin-contact-dot"
                            aria-label="Unread"
                          />
                        )}
                      </button>
                    );
                  }
                )}
              </div>
            )}
        </section>

        <section
          className="dp-panel bb-admin-panel bb-admin-contact-detail"
          aria-label="Selected contact message"
        >
          {selected ? (
            <>
              <div className="bb-admin-contact-detail-top">
                <div>
                  <span className="dp-eyebrow">
                    MESSAGE DETAILS
                  </span>

                  <h2>
                    {selected.name ||
                      selected.full_name ||
                      "Website visitor"}
                  </h2>

                  <p>
                    {displayDate(
                      selected.created_at ||
                        selected.submitted_at
                    )}
                  </p>
                </div>

                <span
                  className={`bb-admin-pill ${
                    isRead(selected)
                      ? "good"
                      : "warn"
                  }`}
                >
                  {isRead(selected)
                    ? "Read"
                    : "Unread"}
                </span>
              </div>

              <div className="bb-admin-contact-email">
                <Mail size={17} />

                <a
                  href={`mailto:${encodeURIComponent(
                    String(
                      selected.email || ""
                    )
                  )}`}
                >
                  {selected.email ||
                    "No email supplied"}
                </a>
              </div>

              <div className="bb-admin-contact-message">
                <small>
                  MESSAGE
                </small>

                <p>
                  {selected.message ||
                    "No message text returned."}
                </p>
              </div>

              <div className="bb-admin-contact-detail-actions">
                {selected.email && (
                  <a
                    className="bb-admin-btn bb-admin-btn-primary"
                    href={`mailto:${encodeURIComponent(
                      selected.email
                    )}?subject=${encodeURIComponent(
                      "Re: Your Bellbee enquiry"
                    )}`}
                  >
                    <Send size={15} />

                    Reply by email
                  </a>
                )}

                {messageId(selected) != null && (
                  <button
                    type="button"
                    className="bb-admin-btn bb-admin-btn-light"
                    disabled={
                      updatingId !== null ||
                      !configured
                    }
                    onClick={() =>
                      setRead(
                        selected,
                        !isRead(selected)
                      )
                    }
                  >
                    {isRead(selected) ? (
                      <Mail size={15} />
                    ) : (
                      <CheckCheck size={15} />
                    )}

                    {updatingId !== null
                      ? "Saving…"
                      : isRead(selected)
                      ? "Mark unread"
                      : "Mark read"}
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="bb-admin-contact-empty-detail">
              <MailOpen size={27} />

              <strong>
                Select a message
              </strong>

              <p>
                Choose an inbox entry
                to read the visitor's
                complete enquiry.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

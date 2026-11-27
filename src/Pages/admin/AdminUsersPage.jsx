import { useCallback, useMemo, useState } from "react";

import {
  Link,
  useSearchParams,
} from "react-router-dom";

import {
  ArrowUpRight,
  RefreshCw,
  Search,
  Sparkles,
  Users,
} from "lucide-react";

import {
  AdminPageHeader,
  AdminFeedback,
  AdminStatus,
  useAdminResource,
  getName,
  formatDate,
} from "../../components/admin/AdminUI";

import {
  useAdminToast,
} from "../../components/admin/AdminToastProvider";

import {
  isAdminPreviewEnabled,
} from "../../services/admin/adminPreviewData";

function getBusinessCount(item) {
  if (item?.workspace_count !== undefined) {
    return item.workspace_count;
  }

  if (Array.isArray(item?.workspaces)) {
    return item.workspaces.length;
  }

  return "—";
}

export default function AdminUsersPage() {
  const toast = useAdminToast();

  const [searchParams, setSearchParams] =
    useSearchParams();

  const [status, setStatus] = useState("all");

  const [previewChanges, setPreviewChanges] =
    useState({});

  const q = searchParams.get("q") ?? "";

  const {
    rows,
    loading,
    error,
    reload,
  } = useAdminResource("users");

  const getStatus = useCallback(
    (row) =>
      previewChanges[row.id ?? row.user_id] ||
      row.status ||
      row.account_status ||
      (row.is_active === false
        ? "inactive"
        : "active"),
    [previewChanges]
  );

  const matching = useMemo(
    () =>
      rows.filter((row) => {
        const text = [
          getName(row),
          row?.email,
          row?.phone,
          row?.id,
          row?.plan?.name,
          row?.subscription?.plan?.name,
        ]
          .join(" ")
          .toLowerCase();

        return (
          text.includes(q.trim().toLowerCase()) &&
          (status === "all" ||
            String(getStatus(row)).toLowerCase() ===
              status)
        );
      }),
    [rows, q, status, getStatus]
  );

  function changePreviewStatus(id, next) {
    setPreviewChanges((current) => ({
      ...current,
      [id]: next,
    }));

    toast.preview(
      "Preview status updated",
      `Status set to ${next}. This change is local to this page and was NOT saved to a server.`
    );
  }

  function refresh() {
    setPreviewChanges({});
    reload();
  }

  return (
    <>
      <AdminPageHeader
        title="Users management"
        eyebrow="PLATFORM / REGISTERED MEMBERS"
        description="Explore every Bellbee account and open individual profiles to review businesses, subscriptions, AI usage, channels and activity."
      >
        <button
          type="button"
          className="bb-admin-btn bb-admin-btn-light"
          onClick={refresh}
        >
          <RefreshCw size={15} />
          Refresh
        </button>
      </AdminPageHeader>

      <section className="dp-panel bb-admin-panel">
        <div className="bb-admin-panel-heading">
          <div>
            <span className="dp-eyebrow">
              PEOPLE & ACCOUNTS
            </span>

            <h2>
              All registered users
              <small>
                {loading ? "…" : matching.length}
              </small>
            </h2>
          </div>

          <Users size={23} />
        </div>

        <div className="bb-admin-toolbar">
          <label className="bb-admin-filter-search">
            <Search size={17} />

            <input
              value={q}
              onChange={(event) =>
                setSearchParams(
                  event.target.value
                    ? { q: event.target.value }
                    : {}
                )
              }
              placeholder="Search name, email, phone or user ID"
              aria-label="Filter users"
            />
          </label>

          <select
            aria-label="Filter account status"
            value={status}
            onChange={(event) =>
              setStatus(event.target.value)
            }
            className="bb-admin-select"
          >
            <option value="all">
              All statuses
            </option>

            <option value="active">
              Active
            </option>

            <option value="inactive">
              Inactive
            </option>

            <option value="suspended">
              Suspended
            </option>

            <option value="pending">
              Pending
            </option>
          </select>
        </div>

        <AdminFeedback
          loading={loading}
          error={error}
          onRetry={refresh}
          empty={!matching.length}
          emptyTitle={
            rows.length
              ? "No matching users"
              : "No registered users returned"
          }
          emptyDescription={
            rows.length
              ? "Change your search or status filter."
              : "When the authorized users API is connected, accounts will appear here."
          }
        />

        {!loading &&
          !error &&
          matching.length > 0 && (
            <div className="bb-admin-table-wrap">
              <table className="bb-admin-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Phone</th>
                    <th>Businesses</th>
                    <th>Plan</th>
                    <th>Status</th>
                    <th>Joined</th>

                    {isAdminPreviewEnabled && (
                      <th>Try demo action</th>
                    )}

                    <th>Details</th>
                  </tr>
                </thead>

                <tbody>
                  {matching.map((person, index) => {
                    const id =
                      person.id ??
                      person.user_id;

                    const plan =
                      person?.subscription?.plan?.name ||
                      person?.plan?.name ||
                      person?.plan_name ||
                      "—";

                    const currentStatus =
                      getStatus(person);

                    return (
                      <tr key={String(id ?? index)}>
                        <td>
                          <div className="bb-admin-user-cell">
                            <span className="bb-admin-avatar">
                              {getName(person)
                                .slice(0, 1)
                                .toUpperCase()}
                            </span>

                            <div>
                              <strong>
                                {getName(person)}
                              </strong>

                              <small>
                                {person.email ||
                                  "Email not provided"}
                              </small>
                            </div>
                          </div>
                        </td>

                        <td>
                          {person.phone || "—"}
                        </td>

                        <td>
                          {getBusinessCount(person)}
                        </td>

                        <td>{plan}</td>

                        <td>
                          <AdminStatus
                            value={currentStatus}
                          />
                        </td>

                        <td>
                          {formatDate(
                            person.created_at ||
                              person.joined_at
                          )}
                        </td>

                        {isAdminPreviewEnabled && (
                          <td>
                            <select
                              className="bb-admin-preview-select"
                              aria-label={`Preview status for ${getName(person)}`}
                              value={currentStatus}
                              onChange={(event) =>
                                changePreviewStatus(
                                  id,
                                  event.target.value
                                )
                              }
                            >
                              <option value="active">
                                Active
                              </option>

                              <option value="pending">
                                Pending
                              </option>

                              <option value="suspended">
                                Suspended
                              </option>

                              <option value="inactive">
                                Inactive
                              </option>
                            </select>
                          </td>
                        )}

                        <td>
                          {id == null ? (
                            <span className="bb-admin-muted">
                              No ID
                            </span>
                          ) : (
                            <Link
                              className="bb-admin-view"
                              to={`/admin/users/${encodeURIComponent(id)}`}
                            >
                              View Details
                              <ArrowUpRight size={14} />
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

        {isAdminPreviewEnabled && (
          <div className="bb-admin-demo-hint">
            <Sparkles size={14} />
            Demo status changes are local to this
            page; refresh restores the original
            sample data.
          </div>
        )}
      </section>

      <p className="bb-admin-page-note">
        <Users size={14} />

        {isAdminPreviewEnabled
          ? "UI-ONLY DEMO: All users, emails and billing records are fictional examples."
          : "Only backend-authorized platform records appear here."}
      </p>
    </>
  );
}

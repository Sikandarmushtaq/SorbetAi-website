
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  AlertCircle,
  RefreshCw,
  DatabaseZap,
} from "lucide-react";

import {
  adminApi,
  normalizeRows,
} from "../../services/admin/adminApi";

import {
  getAdminPreviewData,
  isAdminPreviewEnabled,
} from "../../services/admin/adminPreviewData";

import {
  useAdminToast,
} from "./AdminToastProvider";

export function useAdminResource(
  key,
  {
    id,
    query,
    list = true,
    enabled = true,
  } = {}
) {
  const toast = useAdminToast();

  const [state, setState] = useState({
    loading: true,
    data: null,
    error: "",
  });

  const [revision, setRevision] = useState(0);
  const userRefresh = useRef(false);

  const reload = useCallback(() => {
    userRefresh.current = true;
    setRevision((n) => n + 1);
  }, []);

  const queryKey = JSON.stringify(query || {});

  useEffect(() => {
    let active = true;

    const refreshed = userRefresh.current;
    userRefresh.current = false;

    if (!enabled) {
      setState({
        loading: false,
        data: null,
        error: "",
      });

      return undefined;
    }

    // Demo mode never calls the backend.
    if (isAdminPreviewEnabled) {
      const previewData = getAdminPreviewData(
        key,
        { id, list }
      );

      setState({
        loading: false,
        data: previewData,
        error: "",
      });

      if (refreshed) {
        toast.preview(
          "Preview refreshed",
          "Sample data was reloaded. Nothing was saved to the server."
        );
      }

      return undefined;
    }

    setState({
      loading: true,
      data: null,
      error: "",
    });

    const params = JSON.parse(queryKey);

    try {
      const request = list
        ? adminApi.list(key, params)
        : adminApi.get(key, id);

      Promise.resolve(request)
        .then((data) => {
          if (!active) return;

          setState({
            loading: false,
            data,
            error: "",
          });

          if (refreshed) {
            toast.success(
              "Data refreshed",
              "Latest platform records loaded successfully."
            );
          }
        })
        .catch((error) => {
          if (!active) return;

          const message =
            error?.message ||
            "Unable to load data.";

          setState({
            loading: false,
            data: null,
            error: message,
          });

          if (refreshed) {
            toast.error(
              "Refresh failed",
              message
            );
          }
        });
    } catch (error) {
      const message =
        error?.message ||
        "Unable to load data.";

      if (active) {
        setState({
          loading: false,
          data: null,
          error: message,
        });
      }

      if (refreshed) {
        toast.error("Refresh failed", message);
      }
    }

    return () => {
      active = false;
    };
  }, [
    key,
    id,
    list,
    queryKey,
    revision,
    enabled,
    toast,
  ]);

  return {
    ...state,
    rows: normalizeRows(state.data, key),
    reload,
  };
}

export function AdminPageHeader({
  title,
  description,
  eyebrow = "PLATFORM CONTROL CENTER",
  children,
}) {
  return (
    <div className="dp-page-header bb-admin-page-header">
      <div className="dp-page-heading-copy">
        <p className="dp-eyebrow">
          {eyebrow}
        </p>

        <h1>{title}</h1>

        <p className="dp-page-description">
          {description}
        </p>
      </div>

      {children && (
        <div className="dp-header-actions">
          {children}
        </div>
      )}
    </div>
  );
}

export function AdminStatus({ value }) {
  if (!value) {
    return (
      <span className="bb-admin-pill">
        Not reported
      </span>
    );
  }

  const safe = String(value).toLowerCase();

  const tone =
    /active|verified|paid|connected|completed|success|resolved|healthy|open/.test(
      safe
    )
      ? "good"
      : /pending|trial|new|draft|review/.test(safe)
        ? "warn"
        : /failed|rejected|blocked|cancelled|suspended|overdue|error/.test(
              safe
            )
          ? "bad"
          : "";

  return (
    <span className={`bb-admin-pill ${tone}`}>
      {String(value).replace(/_/g, " ")}
    </span>
  );
}

export function AdminFeedback({
  loading,
  error,
  empty,
  onRetry,
  emptyTitle = "No records available",
  emptyDescription =
    "No data was returned by the configured endpoint.",
}) {
  if (loading) {
    return (
      <div
        className="bb-admin-feedback"
        role="status"
      >
        <RefreshCw
          className="bb-admin-spin"
          size={23}
        />

        <strong>Loading platform data…</strong>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="bb-admin-feedback"
        role="alert"
      >
        <AlertCircle size={25} />

        <strong>
          Unable to display records
        </strong>

        <p>{error}</p>

        {onRetry && (
          <button
            className="bb-admin-btn bb-admin-btn-light"
            type="button"
            onClick={onRetry}
          >
            <RefreshCw size={14} />
            Retry
          </button>
        )}
      </div>
    );
  }

  if (empty) {
    return (
      <div className="bb-admin-feedback">
        <DatabaseZap size={26} />

        <strong>{emptyTitle}</strong>

        <p>{emptyDescription}</p>
      </div>
    );
  }

  return null;
}

export function AdminStat({
  label,
  value,
  icon: Icon,
  tone = "coral",
  caption,
}) {
  return (
    <div className="dp-stat-card bb-admin-stat">
      <span className={`dp-stat-icon ${tone}`}>
        <Icon size={19} />
      </span>

      <p>{label}</p>

      <strong>{value ?? "—"}</strong>

      <small>
        {caption ||
          (isAdminPreviewEnabled
            ? "Example data • preview"
            : "Live admin data")}
      </small>
    </div>
  );
}

export function formatDate(value) {
  if (!value) return "—";

  const d = new Date(value);

  return Number.isNaN(d.getTime())
    ? String(value)
    : new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
      }).format(d);
}

export function getName(record) {
  return (
    record?.full_name ||
    record?.name ||
    [record?.first_name, record?.last_name]
      .filter(Boolean)
      .join(" ") ||
    record?.email ||
    "Unnamed"
  );
}

export function valueOrDash(value) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return "—";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (Array.isArray(value)) {
    return value.join(", ") || "—";
  }

  return String(value);
}

export function formatMinorMoney(
  amountMinor,
  currency = "USD"
) {
  if (
    amountMinor === undefined ||
    amountMinor === null ||
    amountMinor === ""
  ) {
    return "—";
  }

  const amount = Number(amountMinor);

  if (!Number.isFinite(amount)) {
    return "—";
  }

  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
    }).format(amount / 100);
  } catch {
    return `${currency} ${(amount / 100).toFixed(2)}`;
  }
}

export function InfoItem({ label, value }) {
  return (
    <div className="bb-admin-info-item">
      <span>{label}</span>

      <strong>{valueOrDash(value)}</strong>
    </div>
  );
}

export function normalizeCounter(value) {
  if (
    value === undefined ||
    value === null
  ) {
    return "—";
  }

  const n = Number(value);

  return Number.isFinite(n)
    ? new Intl.NumberFormat().format(n)
    : String(value);
}

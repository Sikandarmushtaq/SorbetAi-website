
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  AlertCircle,
  CheckCircle2,
  Info,
  LoaderCircle,
  Sparkles,
  TriangleAlert,
  X,
} from "lucide-react";

import "./DashboardToast.css";

const ToastContext = createContext(null);

const icons = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: TriangleAlert,
  info: Info,
  loading: LoaderCircle,
};

export function noticeType(message) {
  const text = String(message || "").toLowerCase();

  if (
    /\b(error|failed|failure|unable|could not|can't|cannot|rejected|denied|invalid|timed out|network error|not found)\b/.test(
      text
    )
  ) {
    return "error";
  }

  if (
    /\b(required|enter |choose |select |please |maximum|minimum|not configured|read.only|not available|missing)\b/.test(
      text
    )
  ) {
    return "warning";
  }

  if (
    /\b(success|saved|updated|created|deleted|removed|imported|sent|marked complete|confirmed|connected|disconnected|completed|activated|resolved)\b/.test(
      text
    )
  ) {
    return "success";
  }

  return "info";
}

export function DashboardToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);

    setToasts((current) =>
      current.filter((toast) => toast.id !== id)
    );
  }, []);

  const push = useCallback(
    (type, title, detail = "", duration) => {
      const id = ++idRef.current;

      const timeout =
        duration ??
        (type === "error"
          ? 6000
          : type === "loading"
            ? 0
            : 4200);

      setToasts((current) =>
        [
          ...current,
          {
            id,
            type,
            title: String(title || ""),
            detail: String(detail || ""),
            timeout,
          },
        ].slice(-5)
      );

      if (timeout > 0) {
        timers.current.set(
          id,
          setTimeout(() => dismiss(id), timeout)
        );
      }

      return id;
    },
    [dismiss]
  );

  const update = useCallback(
    (id, type, title, detail = "", duration) => {
      clearTimeout(timers.current.get(id));
      timers.current.delete(id);

      const timeout =
        duration ?? (type === "error" ? 6000 : 4200);

      setToasts((current) =>
        current.map((item) =>
          item.id === id
            ? {
                id,
                type,
                title: String(title || ""),
                detail: String(detail || ""),
                timeout,
              }
            : item
        )
      );

      if (timeout > 0) {
        timers.current.set(
          id,
          setTimeout(() => dismiss(id), timeout)
        );
      }
    },
    [dismiss]
  );

  useEffect(
    () => () => {
      timers.current.forEach((timer) =>
        clearTimeout(timer)
      );

      timers.current.clear();
    },
    []
  );

  const toast = useMemo(
    () => ({
      success: (title, detail, duration) =>
        push("success", title, detail, duration),

      error: (title, detail, duration) =>
        push("error", title, detail, duration),

      warning: (title, detail, duration) =>
        push("warning", title, detail, duration),

      info: (title, detail, duration) =>
        push("info", title, detail, duration),

      loading: (title, detail) =>
        push("loading", title, detail, 0),

      auto: (message, type) =>
        push(
          type || noticeType(message),
          message
        ),

      update,
      dismiss,

      async track(
        action,
        {
          loading = "Saving changes…",
          success = "Changes saved successfully",
          error = "Unable to save changes",
        } = {}
      ) {
        const id = push(
          "loading",
          loading,
          "Please keep this page open.",
          0
        );

        try {
          const result = await (
            typeof action === "function"
              ? action()
              : action
          );

          update(id, "success", success);
          return result;
        } catch (failure) {
          update(
            id,
            "error",
            error,
            failure?.message ||
              "Please try again."
          );

          throw failure;
        }
      },
    }),
    [push, update, dismiss]
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}

      <div
        className="bb-user-toast-stack"
        aria-label="Dashboard notifications"
        aria-live="polite"
      >
        {toasts.map((item) => {
          const Icon =
            icons[item.type] || Sparkles;

          return (
            <div
              className={`bb-user-toast bb-user-toast-${item.type}`}
              key={item.id}
              role={
                item.type === "error"
                  ? "alert"
                  : "status"
              }
            >
              <span className="bb-user-toast-icon">
                <Icon
                  className={
                    item.type === "loading"
                      ? "bb-user-toast-spin"
                      : ""
                  }
                  size={21}
                />
              </span>

              <div className="bb-user-toast-text">
                <strong>{item.title}</strong>

                {item.detail && (
                  <p>{item.detail}</p>
                )}
              </div>

              <button
                type="button"
                className="bb-user-toast-close"
                onClick={() =>
                  dismiss(item.id)
                }
                aria-label="Dismiss notification"
              >
                <X size={17} />
              </button>

              {item.timeout > 0 && (
                <span
                  className="bb-user-toast-progress"
                  style={{
                    animationDuration: `${item.timeout}ms`,
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useDashboardToast() {
  const value = useContext(ToastContext);

  if (!value) {
    throw new Error(
      "useDashboardToast must be used inside DashboardToastProvider"
    );
  }

  return value;
}

export function useOptionalDashboardToast() {
  return useContext(ToastContext);
}

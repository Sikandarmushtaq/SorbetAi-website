
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

import "./AdminToast.css";

const ToastContext = createContext(null);

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: TriangleAlert,
  info: Info,
  preview: Sparkles,
  loading: LoaderCircle,
};

const DEFAULT_MS = {
  success: 4200,
  info: 4200,
  preview: 5000,
  warning: 5200,
  error: 6500,
  loading: 20000,
};

function resolveDuration(type, duration) {
  if (
    !Number.isFinite(duration) ||
    duration <= 0
  ) {
    return DEFAULT_MS[type] || 4200;
  }

  return Math.min(duration, 30000);
}

export function AdminToastProvider({
  children,
}) {
  const [items, setItems] = useState([]);

  const nextId = useRef(0);

  const dismiss = useCallback((id) => {
    setItems((current) =>
      current.filter((item) => item.id !== id)
    );
  }, []);

  const push = useCallback(
    (
      type,
      title,
      description = "",
      duration
    ) => {
      const id = ++nextId.current;
      const ms = resolveDuration(
        type,
        duration
      );

      const item = {
        id,
        type,
        title,
        description,
        ms,
        expiresAt: Date.now() + ms,
      };

      setItems((current) =>
        [...current, item].slice(-4)
      );

      return id;
    },
    []
  );

  const update = useCallback(
    (
      id,
      type,
      title,
      description = "",
      duration
    ) => {
      const ms = resolveDuration(
        type,
        duration
      );

      setItems((current) =>
        current.map((item) =>
          item.id === id
            ? {
                ...item,
                type,
                title,
                description,
                ms,
                expiresAt:
                  Date.now() + ms,
              }
            : item
        )
      );
    },
    []
  );

  // State-based timers survive React
  // Strict Mode development effect replay.
  useEffect(() => {
    const handles = items.map((item) =>
      setTimeout(
        () => dismiss(item.id),
        Math.max(
          0,
          item.expiresAt - Date.now()
        )
      )
    );

    return () =>
      handles.forEach(clearTimeout);
  }, [items, dismiss]);

  const toast = useMemo(
    () => ({
      success: (
        title,
        description,
        ms
      ) =>
        push(
          "success",
          title,
          description,
          ms
        ),

      error: (
        title,
        description,
        ms
      ) =>
        push(
          "error",
          title,
          description,
          ms
        ),

      warning: (
        title,
        description,
        ms
      ) =>
        push(
          "warning",
          title,
          description,
          ms
        ),

      info: (
        title,
        description,
        ms
      ) =>
        push(
          "info",
          title,
          description,
          ms
        ),

      preview: (
        title,
        description,
        ms
      ) =>
        push(
          "preview",
          title,
          description,
          ms
        ),

      loading: (
        title,
        description,
        ms
      ) =>
        push(
          "loading",
          title,
          description,
          ms
        ),

      dismiss,
      update,

      async track(
        request,
        {
          loading,
          success,
          error,
        } = {}
      ) {
        const pendingId = loading
          ? push(
              "loading",
              loading,
              "Processing your request…"
            )
          : null;

        try {
          const result = await (
            typeof request === "function"
              ? request()
              : request
          );

          if (pendingId !== null) {
            dismiss(pendingId);
          }

          if (success) {
            push("success", success);
          }

          return result;
        } catch (failure) {
          if (pendingId !== null) {
            dismiss(pendingId);
          }

          push(
            "error",
            error || "Action failed",
            failure?.message ||
              "Please try again."
          );

          throw failure;
        }
      },
    }),
    [push, dismiss, update]
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}

      <div
        className="bbat-stack"
        aria-label="Admin notifications"
        aria-live="polite"
      >
        {items.map((item) => {
          const Icon =
            ICONS[item.type] || Info;

          return (
            <div
              className={`bbat-toast bbat-${item.type}`}
              key={item.id}
              role={
                item.type === "error"
                  ? "alert"
                  : "status"
              }
            >
              <div className="bbat-icon">
                <Icon
                  size={21}
                  strokeWidth={2.2}
                  className={
                    item.type === "loading"
                      ? "bbat-spin"
                      : ""
                  }
                />
              </div>

              <div className="bbat-copy">
                <strong>
                  {item.title}
                </strong>

                {item.description && (
                  <p>
                    {item.description}
                  </p>
                )}
              </div>

              <button
                className="bbat-close"
                type="button"
                onClick={() =>
                  dismiss(item.id)
                }
                aria-label="Dismiss notification"
              >
                <X size={17} />
              </button>

              <span
                className="bbat-progress"
                style={{
                  animationDuration:
                    `${item.ms}ms`,
                }}
                aria-hidden="true"
              />
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useAdminToast() {
  const toast = useContext(
    ToastContext
  );

  if (!toast) {
    throw new Error(
      "useAdminToast must be inside AdminToastProvider"
    );
  }

  return toast;
}

// Keep raw backend validation in API errors; show compact, actionable text to users.
export function friendlyDashboardError(input) {
  const original = String(input?.message || input || '').trim();
  if (!original) return 'Please check your details and try again.';
  const text = original.toLowerCase();
  if (/breaks? must have a positive duration|breaks? .*fall within working hours|break.*(outside|working hours)/i.test(original)) {
    return 'Invalid break time. Choose a break within working hours.';
  }
  if (/break.*(end.*start|start.*end|duration)/i.test(original)) {
    return 'Invalid break time. The end must be after the start.';
  }
  if (/invalid (date|day)|date.*(invalid|format)/i.test(original)) return 'Please enter a valid date.';
  if (/invalid (time|hour)|time.*(invalid|format)/i.test(original)) return 'Please enter a valid time.';
  if (/phone.*(invalid|not valid)|invalid.*phone/i.test(original)) return 'Please enter a valid phone number.';
  if (/opening and closing times are required/i.test(original)) return 'Select opening and closing times.';
  if (/network error|failed to fetch|unable to connect/i.test(original)) return 'Connection problem. Check your internet and try again.';
  if (/^request failed \(5\d\d\)/i.test(original)) return 'Server unavailable. Please try again.';
  const parts = original.split(/\s+[·•]\s+|\s+-\s+(?=[A-Z])|;\s*/).map((p) => p.trim()).filter(Boolean);
  const seen = new Set();
  const deduped = parts.filter((part) => { const key = part.toLowerCase().replace(/[.!]+$/, ''); if (seen.has(key)) return false; seen.add(key); return true; });
  const joined = deduped.slice(0, 2).join(' · ');
  if (joined.length > 160 || /traceback|sqlalchemy|psycopg|stack trace|internal server/i.test(text)) {
    return 'Please check your details and try again.';
  }
  return joined;
}


export function getDashboardFormErrors(
  error,
  aliases = {}
) {
  const fields = {};
  const messages = [];

  const response =
    error?.response?.data ||
    error?.data ||
    {};

  const details =
    error?.errors ??
    response.errors ??
    response.detail;

  const add = (key, message) => {
    const text = Array.isArray(message)
      ? message
          .map((part) =>
            typeof part === "string"
              ? part
              : part?.message || part?.msg
          )
          .filter(Boolean)
          .join(" ")
      : typeof message === "string"
        ? message
        : message?.message ||
          message?.msg ||
          "";

    if (!text) return;
    const friendly = friendlyDashboardError(text);

    const raw = String(key || "")
      .replace(
        /^(body|data|attributes)(?:[./]|\[)*/,
        ""
      )
      .replace(/\]$/, "");

    const field = aliases[raw] || raw;

    if (
      !field ||
      [
        "detail",
        "non_field_errors",
        "general",
        "_error",
      ].includes(field)
    ) {
      if (!messages.includes(friendly)) messages.push(friendly);
    } else {
      fields[field] = fields[field] && fields[field] !== friendly
        ? `${fields[field]} · ${friendly}`
        : friendly;
    }
  };

  if (Array.isArray(details)) {
    details.forEach((item) => {
      if (typeof item === "string") {
        const friendly = friendlyDashboardError(item);
        if (!messages.includes(friendly)) messages.push(friendly);
        return;
      }

      const location = item?.loc;

      const key =
        item?.field ||
        item?.name ||
        item?.path ||
        (Array.isArray(location)
          ? location
              .filter(
                (value) =>
                  !["body", "data"].includes(value)
              )
              .join(".")
          : location);

      add(
        key,
        item?.message ||
          item?.msg ||
          item?.detail
      );
    });
  } else if (
    details &&
    typeof details === "object"
  ) {
    Object.entries(details).forEach(
      ([key, value]) => add(key, value)
    );
  } else if (typeof details === "string") {
    const friendly = friendlyDashboardError(details);
    if (!messages.includes(friendly)) messages.push(friendly);
  }

  return {
    fields,

    summary:
      messages.join(' · ') ||
      Object.values(fields)[0] ||
      friendlyDashboardError(error?.message || response.message || 'Please review the fields and try again.'),
  };
}
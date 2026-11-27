
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
      messages.push(text);
    } else {
      fields[field] = fields[field]
        ? `${fields[field]} ${text}`
        : text;
    }
  };

  if (Array.isArray(details)) {
    details.forEach((item) => {
      if (typeof item === "string") {
        messages.push(item);
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
    messages.push(details);
  }

  return {
    fields,

    summary:
      messages.join(" ") ||
      error?.message ||
      response.message ||
      "Please review the fields and try again.",
  };
}

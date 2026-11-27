
import {
  apiRequest,
  DashboardApiError,
} from "../apiClient";

/*
  Platform-admin endpoints remain separate
  from workspace endpoints.

  All admin requests use the existing
  authenticated Axios API client.
*/

const PATHS = {
  identity:
    process.env.REACT_APP_API_ADMIN_ME_PATH,

  overview:
    process.env.REACT_APP_API_ADMIN_OVERVIEW_PATH,

  users:
    process.env.REACT_APP_API_ADMIN_USERS_PATH,

  businesses:
    process.env.REACT_APP_API_ADMIN_BUSINESSES_PATH,

  leads:
    process.env.REACT_APP_API_ADMIN_WEBSITE_LEADS_PATH,

  contactMessages:
    process.env.REACT_APP_API_ADMIN_CONTACT_MESSAGES_PATH,

  conversations:
    process.env.REACT_APP_API_ADMIN_WEBSITE_CONVERSATIONS_PATH,

  billing:
    process.env.REACT_APP_API_ADMIN_BILLING_PATH,

  ai:
    process.env.REACT_APP_API_ADMIN_AI_MONITORING_PATH,

  channels:
    process.env.REACT_APP_API_ADMIN_CHANNELS_PATH,

  support:
    process.env.REACT_APP_API_ADMIN_SUPPORT_PATH,

  analytics:
    process.env.REACT_APP_API_ADMIN_ANALYTICS_PATH,

  system:
    process.env.REACT_APP_API_ADMIN_SYSTEM_PATH,

  audit:
    process.env.REACT_APP_API_ADMIN_AUDIT_PATH,

  orders:
    process.env.REACT_APP_API_ADMIN_ORDERS_PATH,

  appointments:
    process.env.REACT_APP_API_ADMIN_APPOINTMENTS_PATH,

  campaigns:
    process.env.REACT_APP_API_ADMIN_CAMPAIGNS_PATH,

  referrals:
    process.env.REACT_APP_API_ADMIN_REFERRALS_PATH,

  templates:
    process.env.REACT_APP_API_ADMIN_TEMPLATES_PATH,

  userBilling:
    process.env.REACT_APP_API_ADMIN_USER_BILLING_PATH,

  userUsage:
    process.env.REACT_APP_API_ADMIN_USER_USAGE_PATH,

  userChannels:
    process.env.REACT_APP_API_ADMIN_USER_CHANNELS_PATH,

  userActivity:
    process.env.REACT_APP_API_ADMIN_USER_ACTIVITY_PATH,
};

const missing = (key) =>
  new DashboardApiError(
    `Admin ${key} API is not configured. Add its backend-authorized endpoint to .env.`,
    "ENDPOINT_NOT_CONFIGURED"
  );

export const isAdminEndpointConfigured = (
  key
) => Boolean(PATHS[key]?.trim());

function buildPath(
  key,
  { id, query } = {}
) {
  let path = PATHS[key]?.trim();

  if (!path) {
    throw missing(key);
  }

  if (id !== undefined && id !== null) {
    const safeId = encodeURIComponent(
      String(id)
    );

    if (
      path.includes("{userId}") ||
      path.includes(":userId") ||
      path.includes("{id}")
    ) {
      path = path.replace(
        /\{userId\}|:userId|\{id\}/g,
        safeId
      );
    } else {
      path =
        `${path.replace(/\/$/, "")}/${safeId}`;
    }
  }

  if (
    !path.startsWith("/") ||
    path.startsWith("//")
  ) {
    throw new DashboardApiError(
      "Admin path must be a same-origin API path.",
      "INVALID_ADMIN_PATH"
    );
  }

  const params = new URLSearchParams();

  Object.entries(query || {}).forEach(
    ([field, value]) => {
      if (
        value !== undefined &&
        value !== null &&
        String(value).trim() !== ""
      ) {
        params.append(
          field,
          String(value)
        );
      }
    }
  );

  const qs = params.toString();

  return `${path}${
    qs
      ? `${path.includes("?")
          ? "&"
          : "?"}${qs}`
      : ""
  }`;
}

export const adminApi = {
  isConfigured:
    isAdminEndpointConfigured,

  getIdentity: () =>
    apiRequest(
      buildPath("identity")
    ),

  list: (key, query = {}) =>
    apiRequest(
      buildPath(key, { query })
    ),

  get: (key, id) =>
    apiRequest(
      buildPath(key, { id })
    ),

  getUserPart: (key, userId) =>
    apiRequest(
      buildPath(key, {
        id: userId,
      })
    ),

  /*
    CONTACT INBOX

    Uses the existing environment path.
    Supports optional search, is_read,
    page and page_size query parameters.

    Without pagination parameters,
    the backend returns the full list.
  */

  async listContactMessages(query = {}) {
    const data = await apiRequest(
      buildPath("contactMessages", {
        query,
      }),
      {
        expectedStatus: 200,
        requireSuccess: true,
      }
    );

    if (
      !Array.isArray(data?.messages) ||
      !data.messages.every(
        (row) =>
          typeof row?.id === "string" &&
          typeof row.is_read === "boolean"
      ) ||
      !Number.isInteger(data.total) ||
      data.total < 0 ||
      !Number.isInteger(data.unread_count) ||
      data.unread_count < 0 ||
      data.unread_count > data.total
    ) {
      throw new DashboardApiError(
        "Invalid contact inbox response.",
        "INVALID_CONTACT_RESPONSE"
      );
    }

    return data;
  },

  /*
    MARK READ / UNREAD

    Backend requires a strict boolean.
    Do not generate read_at on frontend.
    Return the actual updated backend record.
  */

  async markContactMessage(id, isRead) {
    if (
      id == null ||
      typeof isRead !== "boolean"
    ) {
      throw new DashboardApiError(
        "A message ID and boolean read status are required.",
        "INVALID_CONTACT_UPDATE"
      );
    }

    const data = await apiRequest(
      buildPath("contactMessages", {
        id,
      }),
      {
        method: "PATCH",

        body: {
          is_read: isRead,
        },

        expectedStatus: 200,
        requireSuccess: true,
      }
    );

    if (
      String(data?.id) !== String(id) ||
      data?.is_read !== isRead
    ) {
      throw new DashboardApiError(
        "The server did not confirm the updated message status.",
        "INVALID_CONTACT_RESPONSE"
      );
    }

    return data;
  },
};

export function isPlatformAdmin(identity) {
  const value =
    identity?.admin ??
    identity?.user ??
    identity;

  if (
    !value ||
    typeof value !== "object"
  ) {
    return false;
  }

  if (
    value.is_platform_admin === true ||
    value.is_superadmin === true
  ) {
    return true;
  }

  if (
    [
      "platform_admin",
      "superadmin",
    ].includes(
      String(
        value.role || ""
      ).toLowerCase()
    )
  ) {
    return true;
  }

  const permissions =
    Array.isArray(value.permissions)
      ? value.permissions
      : [];

  return (
    permissions.includes(
      "platform_admin"
    ) ||
    permissions.includes(
      "platform:admin"
    )
  );
}

export function normalizeRows(
  payload,
  preferred = ""
) {
  if (Array.isArray(payload)) {
    return payload;
  }

  for (const value of [
    payload?.items,
    payload?.results,
    payload?.records,
    payload?.[preferred],
    payload?.data?.items,
    payload?.data?.results,
    payload?.data?.[preferred],
    payload?.data,
  ]) {
    if (Array.isArray(value)) {
      return value;
    }
  }

  return [];
}

export function unwrapRecord(
  payload,
  kind = ""
) {
  if (!payload) {
    return null;
  }

  if (
    payload?.[kind] &&
    typeof payload[kind] === "object" &&
    !Array.isArray(payload[kind])
  ) {
    return payload[kind];
  }

  if (
    payload?.data &&
    typeof payload.data === "object" &&
    !Array.isArray(payload.data)
  ) {
    return (
      payload.data?.[kind] ??
      payload.data
    );
  }

  return payload;
}

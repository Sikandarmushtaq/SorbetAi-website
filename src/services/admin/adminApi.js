
import {
  apiRequest,
  DashboardApiError,
} from "../apiClient";

/*
  Platform-admin endpoints remain separate
  from workspace endpoints.

  All admin requests use the existing
  Axios API client with authentication
  and token refresh.
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
  {
    id,
    query,
  } = {}
) {
  let path = PATHS[key]?.trim();

  if (!path) {
    throw missing(key);
  }

  if (
    id !== undefined &&
    id !== null
  ) {
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
    apiRequest(buildPath("identity")),

  list: (
    key,
    query = {}
  ) =>
    apiRequest(
      buildPath(key, { query })
    ),

  get: (key, id) =>
    apiRequest(
      buildPath(key, { id })
    ),

  getUserPart: (
    key,
    userId
  ) =>
    apiRequest(
      buildPath(key, {
        id: userId,
      })
    ),

  // Expected backend contract:
  // PATCH /admin/contact-messages/:id
  // Body: { is_read: true/false }
  markContactMessage: (
    id,
    isRead
  ) =>
    apiRequest(
      buildPath(
        "contactMessages",
        { id }
      ),

      {
        method: "PATCH",

        body: {
          is_read:
            Boolean(isRead),
        },
      }
    ),
};

export function isPlatformAdmin(
  identity
) {
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

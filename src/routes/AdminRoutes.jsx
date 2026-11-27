
import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import AdminProtectedRoute from "../components/admin/AdminProtectedRoute";
import AdminShell from "../components/admin/AdminShell";

import AdminHomePage from "../Pages/admin/AdminHomePage";

import AdminUsersPage from "../Pages/admin/AdminUsersPage";

import AdminUserDetailsPage from "../Pages/admin/AdminUserDetailsPage";

import AdminModulePage, {
  MODULES,
} from "../Pages/admin/AdminModulePage";

import AdminRecordPage from "../Pages/admin/AdminRecordPage";

import AdminContactMessagesPage from "../Pages/admin/AdminContactMessagesPage";

const routeNames = {
  businesses: "businesses",

  "website-leads": "leads",

  "website-conversations":
    "conversations",

  billing: "billing",

  "ai-monitoring": "ai",

  channels: "channels",
  orders: "orders",

  appointments: "appointments",

  campaigns: "campaigns",
  templates: "templates",
  support: "support",

  analytics: "analytics",
  referrals: "referrals",

  system: "system",
  audit: "audit",
};

export default function AdminRoutes() {
  return (
    <Routes>
      <Route
        element={
          <AdminProtectedRoute>
            <AdminShell />
          </AdminProtectedRoute>
        }
      >
        <Route
          index
          element={<AdminHomePage />}
        />

        <Route
          path="users"
          element={<AdminUsersPage />}
        />

        <Route
          path="users/:userId"
          element={<AdminUserDetailsPage />}
        />

        <Route
          path="contact-messages"
          element={
            <AdminContactMessagesPage />
          }
        />

        {Object.entries(
          routeNames
        ).map(([segment, key]) => (
          <Route
            key={segment}
            path={segment}
            element={
              <AdminModulePage
                moduleKey={key}
                definition={
                  MODULES[key]
                }
              />
            }
          />
        ))}

        <Route
          path="businesses/:recordId"
          element={
            <AdminRecordPage
              type="businesses"
            />
          }
        />

        <Route
          path="website-leads/:recordId"
          element={
            <AdminRecordPage
              type="leads"
            />
          }
        />

        <Route
          path="website-conversations/:recordId"
          element={
            <AdminRecordPage
              type="conversations"
            />
          }
        />

        <Route
          path="*"
          element={
            <Navigate
              to="/admin"
              replace
            />
          }
        />
      </Route>
    </Routes>
  );
}

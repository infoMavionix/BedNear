
import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

import {
  LayoutDashboard,
  Building2,
  Users,
  UserRound,
  MessageSquare,
  CreditCard,
  CalendarCheck,
  BarChart3,
  Settings,
  Menu,
  Bell,
  X,
  LogOut,
  ShieldCheck,
} from "lucide-react";

import "./Admin.css";

const navigation = [
  {
    label: "Overview",
    path: "/admin",
    icon: LayoutDashboard,
    end: true,
  },
  {
    label: "PG Approvals",
    path: "/admin/listings/pending",
    icon: Building2,
  },
  {
    label: "Owner Verification",
    path: "/admin/owners/verification",
    icon: ShieldCheck,
  },
  {
    label: "Owners",
    path: "/admin/owners",
    icon: Users,
    end: true,
  },
  {
    label: "Users",
    path: "/admin/users",
    icon: UserRound,
  },
  {
    label: "Enquiries",
    path: "/admin/enquiries",
    icon: MessageSquare,
  },
  {
    label: "Payments",
    path: "/admin/payments",
    icon: CreditCard,
  },
  {
    label: "Subscriptions",
    path: "/admin/subscriptions",
    icon: CalendarCheck,
  },
  {
    label: "Reports",
    path: "/admin/reports",
    icon: BarChart3,
  },
  {
    label: "Settings",
    path: "/admin/settings",
    icon: Settings,
  },
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  function handleLogout() {
    // Clear the current BedNear session.
    sessionStorage.removeItem("bednear_token");
    sessionStorage.removeItem("jwt");
    sessionStorage.removeItem("bednear_user");

    localStorage.removeItem("jwt");
    localStorage.removeItem("bednear_token");

    // Return to login and prevent going back to admin page.
    setSidebarOpen(false);
    navigate("/login", { replace: true });
  }

  return (
    <div className="admin-shell">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <button
          type="button"
          className="admin-sidebar-overlay"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`admin-sidebar ${
          sidebarOpen ? "admin-sidebar-open" : ""
        }`}
      >
        {/* Brand */}
        <div className="admin-brand">
          <div className="admin-brand-icon">
            <Building2 size={25} />
          </div>

          <div>
            <h1>BedNear</h1>
            <p>Administration</p>
          </div>

          <button
            type="button"
            className="admin-mobile-close"
            aria-label="Close navigation"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={21} />
          </button>
        </div>

        <div className="admin-nav-label">
          WORKSPACE
        </div>

        {/* Navigation */}
        <nav className="admin-navigation">
          {navigation.map(
            ({ label, path, icon: Icon, end }) => (
              <NavLink
                key={path}
                to={path}
                end={end}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `admin-nav-link ${
                    isActive ? "admin-nav-link-active" : ""
                  }`
                }
              >
                <Icon size={19} strokeWidth={1.9} />

                <span>{label}</span>

                {label === "PG Approvals" && (
                  <span className="admin-nav-arrow">
                    ›
                  </span>
                )}
              </NavLink>
            )
          )}
        </nav>

        {/* Sidebar footer */}
        <div className="admin-sidebar-footer">
          <button
            type="button"
            className="admin-logout-button"
            onClick={handleLogout}
            title="Logout"
            aria-label="Logout"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main dashboard */}
      <div className="admin-main">
        {/* Topbar */}
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <button
              type="button"
              className="admin-menu-button"
              aria-label="Open navigation"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={23} />
            </button>

            <div>
              <h2>Admin Dashboard</h2>
              <p>Manage your BedNear platform</p>
            </div>
          </div>

          <div className="admin-topbar-right">
            <span className="admin-status">
              <span className="admin-status-dot" />
              Admin workspace
            </span>

            <button
              type="button"
              className="admin-notification-button"
              aria-label="Notifications"
              title="Notifications"
            >
              <Bell size={20} />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}


import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Building2,
  Clock3,
  IndianRupee,
  MessageSquare,
  CreditCard,
  ArrowUpRight,
  RefreshCw,
  AlertCircle,
  UserRound,
  CalendarDays,
} from "lucide-react";
import {
  getAdminDashboardStats,
  type AdminDashboardResponse,
} from "../../services/adminDashboard.service";
import "./Admin.css";

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString("en-IN")}`;
  }
}

const modules = [
  {
    title: "PG Listing Approvals",
    description: "Review PGs submitted by owners before publishing.",
    icon: Building2,
    href: "/admin/listings/pending",
    color: "purple",
  },
  {
    title: "Owner & User Management",
    description: "Manage accounts, profiles, and account status.",
    icon: Users,
    href: "/admin/owners",
    color: "blue",
  },
  {
    title: "Enquiries & Contacts",
    description: "Review tenant enquiries and recorded contact activity.",
    icon: MessageSquare,
    href: "/admin/enquiries",
    color: "orange",
  },
  {
    title: "Payments & Subscriptions",
    description: "Review transactions, plans, renewals, and payment status.",
    icon: CreditCard,
    href: "/admin/payments",
    color: "green",
  },
];

export default function AdminOverview() {
  const [dashboard, setDashboard] =
    useState<AdminDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async (manual = false) => {
    if (manual) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const data = await getAdminDashboardStats();
      setDashboard(data);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load dashboard statistics."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const stats = dashboard
    ? [
        {
          label: "Registered Users",
          value: dashboard.stats.registeredUsers.toLocaleString("en-IN"),
          note: "Owners and candidates",
          icon: Users,
          color: "purple",
        },
        {
          label: "Published PGs",
          value: dashboard.stats.publishedListings.toLocaleString("en-IN"),
          note: "Live listings on BedNear",
          icon: Building2,
          color: "blue",
        },
        {
          label: "Pending Approvals",
          value: dashboard.stats.pendingListings.toLocaleString("en-IN"),
          note: "Listings awaiting review",
          icon: Clock3,
          color: "orange",
        },
        {
          label: "Subscription Revenue",
          value:
            dashboard.revenue.length === 0
              ? formatMoney(0, "INR")
              : dashboard.revenue
                  .map((item) =>
                    formatMoney(item.totalAmount, item.currency)
                  )
                  .join(" · "),
          note: `${dashboard.revenue.reduce(
            (total, item) => total + item.successfulPaymentCount,
            0
          )} successful payments`,
          icon: IndianRupee,
          color: "green",
        },
        {
          label: "Active Owners",
          value: dashboard.stats.activeOwners.toLocaleString("en-IN"),
          note: "Active owner accounts",
          icon: UserRound,
          color: "purple",
        },
        {
          label: "Total Enquiries",
          value: dashboard.stats.totalEnquiries.toLocaleString("en-IN"),
          note: "All recorded enquiries",
          icon: MessageSquare,
          color: "blue",
        },
        {
          label: "Active Subscriptions",
          value: dashboard.stats.activeSubscriptions.toLocaleString("en-IN"),
          note: "Currently active plans",
          icon: CreditCard,
          color: "green",
        },
      ]
    : [];

  return (
    <div className="admin-overview">
      <section className="admin-page-heading">
        <div className="admin-eyebrow">
          <span className="admin-eyebrow-line" />
          BEDNEAR ADMINISTRATION
        </div>

        <div className="admin-overview-heading-row">
          <div>
            <h1>Platform Overview</h1>
            <p>
              Manage listings, accounts, enquiries, and subscriptions in one
              place.
            </p>
          </div>

          <button
            type="button"
            className="admin-refresh-button"
            onClick={() => void loadDashboard(true)}
            disabled={loading || refreshing}
          >
            <RefreshCw
              size={17}
              className={refreshing ? "admin-spin" : ""}
            />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </section>

      {error && (
        <div className="admin-dashboard-error" role="alert">
          <AlertCircle size={20} />
          <div>
            <strong>Unable to load dashboard data</strong>
            <p>{error}</p>
            <button
              type="button"
              onClick={() => void loadDashboard(true)}
              disabled={refreshing}
            >
              Try again
            </button>
          </div>
        </div>
      )}

      <section className="admin-stats-grid">
        {loading && !dashboard
          ? Array.from({ length: 7 }).map((_, index) => (
              <article
                className="admin-stat-card admin-stat-loading"
                key={index}
              >
                <span className="admin-loading-line" />
                <span className="admin-loading-value" />
                <span className="admin-loading-line short" />
              </article>
            ))
          : stats.map(({ label, value, note, icon: Icon, color }) => (
              <article className="admin-stat-card" key={label}>
                <div className="admin-stat-top">
                  <span className="admin-stat-label">{label}</span>
                  <div className={`admin-stat-icon ${color}`}>
                    <Icon size={22} />
                  </div>
                </div>

                <div className="admin-stat-value">{value}</div>
                <p className="admin-stat-note">{note}</p>
              </article>
            ))}
      </section>

      <section className="admin-modules-section">
        <div className="admin-section-heading">
          <div>
            <h2>Management Modules</h2>
            <p>Select a module to manage that part of the platform.</p>
          </div>
        </div>

        <div className="admin-modules-grid">
          {modules.map(({ title, description, icon: Icon, href, color }) => (
            <Link className="admin-module-card" key={title} to={href}>
              <div className={`admin-module-icon ${color}`}>
                <Icon size={23} />
              </div>

              <div className="admin-module-copy">
                <h3>{title}</h3>
                <p>{description}</p>
                <span className="admin-module-link">
                  Open module <ArrowUpRight size={15} />
                </span>
              </div>

              <ArrowUpRight className="admin-module-arrow" size={19} />
            </Link>
          ))}
        </div>
      </section>

      <section className="admin-activity-grid">
        <article className="admin-activity-card">
          <div className="admin-activity-heading">
            <div>
              <h2>Recent Users</h2>
              <p>Latest registered accounts</p>
            </div>
            <Users size={20} />
          </div>

          {!dashboard && loading ? (
            <p className="admin-activity-message">Loading users...</p>
          ) : dashboard?.recentUsers.length ? (
            <div className="admin-activity-list">
              {dashboard.recentUsers.map((user) => (
                <div className="admin-activity-item" key={user.id}>
                  <div className="admin-activity-avatar">
                    <UserRound size={18} />
                  </div>
                  <div className="admin-activity-copy">
                    <strong>{user.name}</strong>
                    <span>{user.email}</span>
                    <small>
                      {user.role} · {formatDate(user.createdAt)}
                    </small>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="admin-activity-message">No recent users found.</p>
          )}
        </article>

        <article className="admin-activity-card">
          <div className="admin-activity-heading">
            <div>
              <h2>Recent PG Listings</h2>
              <p>Latest listing submissions</p>
            </div>
            <Building2 size={20} />
          </div>

          {!dashboard && loading ? (
            <p className="admin-activity-message">Loading listings...</p>
          ) : dashboard?.recentListings.length ? (
            <div className="admin-activity-list">
              {dashboard.recentListings.map((listing) => (
                <div className="admin-activity-item" key={listing.id}>
                  <div className="admin-activity-avatar">
                    <Building2 size={18} />
                  </div>
                  <div className="admin-activity-copy">
                    <strong>{listing.name}</strong>
                    <span>
                      {listing.locality}, {listing.city}
                    </span>
                    <small>
                      Owner: {listing.owner.name} ·{" "}
                      {formatDate(listing.createdAt)}
                    </small>
                  </div>
                  <span
                    className={`admin-listing-status ${listing.status.toLowerCase()}`}
                  >
                    {listing.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="admin-activity-message">
              No recent PG listings found.
            </p>
          )}

          <Link className="admin-activity-footer-link" to="/admin/listings/pending">
            Review pending listings <ArrowUpRight size={15} />
          </Link>
        </article>
      </section>

      <section className="admin-info-banner">
        <div className="admin-info-icon">
          <CalendarDays size={22} />
        </div>
        <div>
          <h3>Your BedNear administration workspace</h3>
          <p>
            Dashboard values are fetched from the backend.{" "}
            {dashboard
              ? `Last updated ${new Date(
                  dashboard.generatedAt
                ).toLocaleString("en-IN")}.`
              : "Refresh to load the latest platform data."}
          </p>
        </div>
      </section>
    </div>
  );
}

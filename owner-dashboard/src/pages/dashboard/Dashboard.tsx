
import { useCallback, useEffect, useState } from "react";
import {
  Building2,
  BedDouble,
  Users,
  MessageSquare,
  Plus,
  ArrowUpRight,
  Clock3,
  MapPin,
  ChevronRight,
  CheckCircle2,
  CircleAlert,
  RefreshCw,
} from "lucide-react";
import { Link } from "react-router-dom";
import { getDashboardSummary } from "../../services/dashboard.service";
import type {
  DashboardSummary,
  DashboardEnquiry,
} from "../../services/dashboard.service";

const initialSummary: DashboardSummary = {
  totalListings: 0,
  publishedListings: 0,
  rooms: 0,
  beds: 0,
  availableBeds: 0,
  occupiedBeds: 0,
  maintenanceBeds: 0,
  enquiries: 0,
  newEnquiries: 0,
  recentEnquiries: [],
};

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getErrorMessage(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error
  ) {
    const response = (
      error as {
        response?: {
          data?: { message?: string };
          status?: number;
        };
      }
    ).response;

    if (response?.status === 401) {
      return "Your session has expired. Please log in again.";
    }

    return response?.data?.message ?? "Unable to load dashboard data.";
  }

  return "Unable to connect to the backend. Check that the API is running.";
}

export default function Dashboard() {
  const [summary, setSummary] =
    useState<DashboardSummary>(initialSummary);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getDashboardSummary();
      setSummary(data);
    } catch (err) {
      console.error("Dashboard API error:", err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const stats = [
    {
      label: "Total PG Listings",
      value: summary.totalListings,
      note: "Properties you manage",
      icon: Building2,
      color: "purple",
    },
    {
      label: "Available Beds",
      value: summary.availableBeds,
      note: "Ready for new residents",
      icon: BedDouble,
      color: "orange",
    },
    {
      label: "Total Enquiries",
      value: summary.enquiries,
      note: "Candidate enquiries received",
      icon: MessageSquare,
      color: "blue",
    },
    {
      label: "Occupied Beds",
      value: summary.occupiedBeds,
      note: "Currently occupied",
      icon: Users,
      color: "green",
    },
  ];

  const enquiries: DashboardEnquiry[] = summary.recentEnquiries ?? [];

  return (
    <div className="dashboard-page">
      <div className="dashboard-heading">
        <div>
          <p className="eyebrow">OVERVIEW</p>
          <h1>Welcome to BedNear 👋</h1>
          <p className="dashboard-subtitle">
            Manage your PG properties, vacancies and candidate enquiries in one place.
          </p>
        </div>

        <Link to="/listings/new" className="primary-button">
          <Plus size={19} />
          Add New PG
        </Link>
      </div>

      {error && (
        <div className="dashboard-notice" role="alert">
          <CircleAlert size={17} />
          <span>{error}</span>
          <button
            type="button"
            className="secondary-button"
            onClick={() => void loadDashboard()}
          >
            <RefreshCw size={15} />
            Retry
          </button>
        </div>
      )}

      <div className="dashboard-stats">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <article className="stat-card" key={stat.label}>
              <div className="stat-card-top">
                <div className={`stat-icon ${stat.color}`}>
                  <Icon size={23} />
                </div>
                <ArrowUpRight size={19} className="stat-arrow" />
              </div>

              <p className="stat-label">{stat.label}</p>
              <h2>{loading ? "…" : stat.value}</h2>
              <p className="stat-note">{stat.note}</p>
            </article>
          );
        })}
      </div>

      <div className="dashboard-grid">
        <section className="dashboard-panel">
          <div className="panel-heading">
            <div>
              <h2>Recent Enquiries</h2>
              <p>People interested in your PG properties</p>
            </div>
            <Link to="/enquiries" className="text-link">
              View all <ChevronRight size={17} />
            </Link>
          </div>

          {loading ? (
            <div className="empty-state">
              <p>Loading enquiries…</p>
            </div>
          ) : enquiries.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <MessageSquare size={27} />
              </div>
              <h3>No enquiries yet</h3>
              <p>
                Candidate enquiries will appear here when someone contacts you
                about a PG.
              </p>
              <Link to="/listings/new" className="secondary-button">
                Add your first PG
              </Link>
            </div>
          ) : (
            <div className="enquiry-list">
              {enquiries.map((enquiry) => (
                <div className="enquiry-row" key={enquiry.id}>
                  <div className="candidate-avatar">
                    {(enquiry.candidateName || "C")
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div className="enquiry-info">
                    <strong>{enquiry.candidateName}</strong>
                    <span>{enquiry.listing?.name ?? "PG listing"}</span>
                  </div>

                  <span className="enquiry-date">
                    {formatDate(enquiry.createdAt)}
                  </span>

                  <span className="status-badge">
                    {enquiry.status.replaceAll("_", " ")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="dashboard-panel">
          <div className="panel-heading">
            <div>
              <h2>Quick Actions</h2>
              <p>Manage your PG business</p>
            </div>
          </div>

          <div className="quick-actions">
            <Link to="/listings/new" className="quick-action">
              <div className="action-icon purple">
                <Plus size={21} />
              </div>
              <div className="action-copy">
                <strong>Add a PG property</strong>
                <span>Create a new property listing</span>
              </div>
              <ChevronRight size={19} />
            </Link>

            <Link to="/listings" className="quick-action">
              <div className="action-icon orange">
                <Building2 size={21} />
              </div>
              <div className="action-copy">
                <strong>Manage my PGs</strong>
                <span>Edit property details and rent</span>
              </div>
              <ChevronRight size={19} />
            </Link>

            <Link to="/beds" className="quick-action">
              <div className="action-icon green">
                <BedDouble size={21} />
              </div>
              <div className="action-copy">
                <strong>Update vacancies</strong>
                <span>Manage available beds</span>
              </div>
              <ChevronRight size={19} />
            </Link>

            <Link to="/enquiries" className="quick-action">
              <div className="action-icon blue">
                <MessageSquare size={21} />
              </div>
              <div className="action-copy">
                <strong>View enquiries</strong>
                <span>Respond to interested candidates</span>
              </div>
              <ChevronRight size={19} />
            </Link>
          </div>
        </section>
      </div>

      <section className="dashboard-panel setup-panel">
        <div className="setup-icon">
          <MapPin size={23} />
        </div>

        <div className="setup-content">
          <h2>Get your PG listed on BedNear</h2>
          <p>
            Add your property details, location, monthly rent, photos and
            available beds to help candidates discover your PG.
          </p>

          <div className="setup-tips">
            <span>
              <CheckCircle2 size={16} /> Add property details
            </span>
            <span>
              <CheckCircle2 size={16} /> Update bed availability
            </span>
            <span>
              <Clock3 size={16} /> Submit for approval
            </span>
          </div>
        </div>

        <Link to="/listings/new" className="primary-button">
          Get Started <ChevronRight size={18} />
        </Link>
      </section>

      <div className="dashboard-notice">
        <CircleAlert size={17} />
        <span>
          {loading
            ? "Loading live dashboard statistics…"
            : `Live data: ${summary.rooms} rooms and ${summary.beds} beds across your PG properties. ${summary.newEnquiries} new enquiries need your attention.`}
        </span>
      </div>
    </div>
  );
}

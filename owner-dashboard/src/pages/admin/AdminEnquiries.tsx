import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Eye,
  Filter,
  Mail,
  MessageSquare,
  Phone,
  RefreshCw,
  Search,
  Users,
  X,
} from "lucide-react";

import {
  getAdminEnquiries,
  updateAdminEnquiry,
  type AdminEnquiry,
  type AdminEnquiryStatus,
  type AdminEnquirySummary,
} from "../../services/adminEnquiry.service";

import "./Admin.css";

type StatusFilter = "ALL" | AdminEnquiryStatus;

const statusOptions: {
  value: AdminEnquiryStatus;
  label: string;
}[] = [
  { value: "NEW", label: "New" },
  { value: "CONTACTED", label: "Contacted" },
  { value: "VISIT_SCHEDULED", label: "Visit Scheduled" },
  { value: "CLOSED", label: "Closed" },
];

const emptySummary: AdminEnquirySummary = {
  total: 0,
  new: 0,
  contacted: 0,
  visits: 0,
  closed: 0,
};

function formatDate(value: string | null): string {
  if (!value) return "Not specified";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not specified";

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatRent(value: number | null): string {
  if (value == null) return "Not specified";

  return `₹${value.toLocaleString("en-IN")}`;
}

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function statusLabel(status: AdminEnquiryStatus): string {
  return (
    statusOptions.find((item) => item.value === status)?.label ?? status
  );
}

export default function AdminEnquiries() {
  const [enquiries, setEnquiries] = useState<AdminEnquiry[]>([]);
  const [summary, setSummary] =
    useState<AdminEnquirySummary>(emptySummary);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("ALL");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [selected, setSelected] = useState<AdminEnquiry | null>(null);
  const [editStatus, setEditStatus] =
    useState<AdminEnquiryStatus>("NEW");
  const [editNotes, setEditNotes] = useState("");

  const loadEnquiries = useCallback(
    async (manual = false) => {
      if (manual) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const data = await getAdminEnquiries({
          search: search || undefined,
          status: statusFilter,
        });

        setEnquiries(data.enquiries);
        setSummary(data.summary);
      } catch (err: unknown) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load platform enquiries."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [search, statusFilter]
  );

  useEffect(() => {
    void loadEnquiries();
  }, [loadEnquiries]);

  const cards = useMemo(
    () => [
      {
        label: "Total Enquiries",
        value: summary.total,
        note: "Across all PG owners",
        icon: MessageSquare,
        color: "purple",
      },
      {
        label: "New",
        value: summary.new,
        note: "Awaiting follow-up",
        icon: Clock3,
        color: "orange",
      },
      {
        label: "Contacted",
        value: summary.contacted,
        note: "Follow-up started",
        icon: Phone,
        color: "blue",
      },
      {
        label: "Visits Scheduled",
        value: summary.visits,
        note: "Prospective PG visits",
        icon: CalendarDays,
        color: "green",
      },
    ],
    [summary]
  );

  function openDetails(enquiry: AdminEnquiry) {
    setSelected(enquiry);
    setEditStatus(enquiry.status);
    setEditNotes(enquiry.ownerNotes ?? "");
    setError("");
    setNotice("");
  }

  async function saveChanges() {
    if (!selected) return;

    setSaving(true);
    setError("");
    setNotice("");

    try {
      await updateAdminEnquiry(selected.id, {
        status: editStatus,
        ownerNotes: editNotes.trim() || null,
      });

      setSelected(null);
      setNotice("Enquiry follow-up updated successfully.");

      await loadEnquiries(true);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update the enquiry."
      );
    } finally {
      setSaving(false);
    }
  }

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearch(searchInput.trim());
  }

  function clearFilters() {
    setSearchInput("");
    setSearch("");
    setStatusFilter("ALL");
  }

  return (
    <div className="admin-overview admin-enquiries-page">
      <section className="admin-page-heading">
        <div className="admin-eyebrow">
          <span className="admin-eyebrow-line" />
          BEDNEAR ADMINISTRATION
        </div>

        <div className="admin-overview-heading-row">
          <div>
            <h1>Enquiries & Contacts</h1>
            <p>
              Review candidate enquiries across all PG owners and track
              follow-up progress.
            </p>
          </div>

          <button
            type="button"
            className="admin-refresh-button"
            onClick={() => void loadEnquiries(true)}
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

      {notice && (
        <div
          className="admin-enquiry-notice success"
          role="status"
        >
          <CheckCircle2 size={19} />
          <span>{notice}</span>
          <button
            type="button"
            aria-label="Dismiss notification"
            onClick={() => setNotice("")}
          >
            <X size={17} />
          </button>
        </div>
      )}

      {error && (
        <div className="admin-dashboard-error" role="alert">
          <AlertCircle size={20} />
          <div>
            <strong>Unable to complete the request</strong>
            <p>{error}</p>
            <button
              type="button"
              onClick={() => void loadEnquiries(true)}
              disabled={refreshing}
            >
              Try again
            </button>
          </div>
        </div>
      )}

      <section className="admin-enquiry-stats">
        {cards.map(({ label, value, note, icon: Icon, color }) => (
          <article className="admin-enquiry-stat" key={label}>
            <div className={`admin-enquiry-stat-icon ${color}`}>
              <Icon size={22} />
            </div>
            <div className="admin-enquiry-stat-copy">
              <span>{label}</span>
              <strong>{loading ? "..." : value.toLocaleString("en-IN")}</strong>
              <small>{note}</small>
            </div>
          </article>
        ))}
      </section>

      <section className="admin-enquiry-panel">
        <div className="admin-enquiry-panel-heading">
          <div>
            <h2>Candidate Requests</h2>
            <p>
              Search enquiries, check the property owner, and update
              follow-up status.
            </p>
          </div>
          <span className="admin-enquiry-total">
            {enquiries.length} results
          </span>
        </div>

        <form
          className="admin-enquiry-toolbar"
          onSubmit={submitSearch}
        >
          <label className="admin-enquiry-search">
            <Search size={18} />
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search candidate, phone, PG or owner..."
              aria-label="Search platform enquiries"
            />
            {searchInput && (
              <button
                type="button"
                aria-label="Clear search input"
                onClick={() => {
                  setSearchInput("");
                  setSearch("");
                }}
              >
                <X size={16} />
              </button>
            )}
          </label>

          <button
            type="submit"
            className="admin-enquiry-search-button"
          >
            Search
          </button>

          <label className="admin-enquiry-status-filter">
            <Filter size={16} />
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as StatusFilter)
              }
              aria-label="Filter enquiries by status"
            >
              <option value="ALL">All statuses</option>
              {statusOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        </form>

        <div className="admin-enquiry-table-wrap">
          <table className="admin-enquiry-table">
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Interested PG</th>
                <th>Owner</th>
                <th>Received</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="admin-enquiry-empty">
                    <RefreshCw size={20} className="admin-spin" />
                    Loading platform enquiries...
                  </td>
                </tr>
              ) : enquiries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="admin-enquiry-empty">
                    <MessageSquare size={30} />
                    <strong>No enquiries found</strong>
                    <span>
                      Try another search or status filter. New candidate
                      enquiries will appear here.
                    </span>
                    <button
                      type="button"
                      onClick={clearFilters}
                    >
                      Clear filters
                    </button>
                  </td>
                </tr>
              ) : (
                enquiries.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="admin-enquiry-candidate">
                        <div className="admin-enquiry-avatar">
                          {initials(item.candidateName) || "C"}
                        </div>
                        <div>
                          <strong>{item.candidateName}</strong>
                          <span>{item.phone}</span>
                          <small>{item.email || "No email provided"}</small>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className="admin-enquiry-property">
                        <Building2 size={16} />
                        <div>
                          <strong>{item.listing.name}</strong>
                          <span>
                            {item.listing.locality}, {item.listing.city}
                          </span>
                          <small>
                            {formatRent(item.listing.monthlyRent)} / month
                          </small>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className="admin-enquiry-owner">
                        <strong>{item.owner.name}</strong>
                        <span>{item.owner.email}</span>
                        <small>{item.owner.phone || "No phone provided"}</small>
                      </div>
                    </td>

                    <td>{formatDate(item.createdAt)}</td>

                    <td>
                      <span
                        className={`admin-enquiry-status ${item.status.toLowerCase().replaceAll("_", "-")}`}
                      >
                        {statusLabel(item.status)}
                      </span>
                    </td>

                    <td>
                      <button
                        type="button"
                        className="admin-enquiry-view-button"
                        onClick={() => openDetails(item)}
                      >
                        <Eye size={15} />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {selected && (
        <div
          className="admin-enquiry-modal-backdrop"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !saving
            ) {
              setSelected(null);
            }
          }}
        >
          <section
            className="admin-enquiry-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-enquiry-modal-title"
          >
            <div className="admin-enquiry-modal-heading">
              <div>
                <span className="admin-eyebrow">ENQUIRY DETAILS</span>
                <h2 id="admin-enquiry-modal-title">
                  {selected.candidateName}
                </h2>
                <p>Enquiry ID: {selected.id}</p>
              </div>

              <button
                type="button"
                aria-label="Close enquiry details"
                disabled={saving}
                onClick={() => setSelected(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="admin-enquiry-contact-grid">
              <div>
                <Phone size={17} />
                <span>
                  <small>Candidate phone</small>
                  <strong>{selected.phone}</strong>
                </span>
              </div>
              <div>
                <Mail size={17} />
                <span>
                  <small>Candidate email</small>
                  <strong>{selected.email || "Not provided"}</strong>
                </span>
              </div>
              <div>
                <Building2 size={17} />
                <span>
                  <small>Interested PG</small>
                  <strong>{selected.listing.name}</strong>
                </span>
              </div>
              <div>
                <Users size={17} />
                <span>
                  <small>Property owner</small>
                  <strong>{selected.owner.name}</strong>
                  <small>{selected.owner.email}</small>
                </span>
              </div>
              <div>
                <CalendarDays size={17} />
                <span>
                  <small>Received on</small>
                  <strong>{formatDate(selected.createdAt)}</strong>
                </span>
              </div>
              <div>
                <CalendarDays size={17} />
                <span>
                  <small>Preferred visit</small>
                  <strong>{formatDate(selected.preferredVisitAt)}</strong>
                </span>
              </div>
            </div>

            <div className="admin-enquiry-message">
              <strong>Candidate message</strong>
              <p>{selected.message || "No message provided."}</p>
            </div>

            <div className="admin-enquiry-edit-fields">
              <label>
                Follow-up status
                <select
                  value={editStatus}
                  onChange={(event) =>
                    setEditStatus(
                      event.target.value as AdminEnquiryStatus
                    )
                  }
                  disabled={saving}
                >
                  {statusOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Follow-up notes
                <textarea
                  value={editNotes}
                  onChange={(event) => setEditNotes(event.target.value)}
                  rows={4}
                  maxLength={3000}
                  placeholder="Record follow-up notes..."
                  disabled={saving}
                />
              </label>
            </div>

            <div className="admin-enquiry-modal-footer">
              <button
                type="button"
                className="admin-enquiry-cancel-button"
                onClick={() => setSelected(null)}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="button"
                className="admin-enquiry-save-button"
                onClick={() => void saveChanges()}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <RefreshCw size={16} className="admin-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    Save follow-up
                  </>
                )}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
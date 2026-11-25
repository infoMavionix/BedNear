
import { useEffect, useMemo, useState } from "react";
import {
  Search,
  MessageSquare,
  Users,
  Clock3,
  CheckCircle2,
  CalendarDays,
  MapPin,
  Phone,
  X,
  Eye,
  Filter,
  MessageCircle,
  Check,
  Star,
} from "lucide-react";

import { api } from "../../services/api";

type ApiStatus =
  | "NEW"
  | "CONTACTED"
  | "VISIT_SCHEDULED"
  | "CLOSED";

type UiStatus =
  | "New"
  | "Contacted"
  | "Visit Scheduled"
  | "Closed";

type ContactMethod =
  | "INTERESTED"
  | "CALL"
  | "WHATSAPP"
  | "VISIT";

type ApiEnquiry = {
  id: string;
  candidateName: string;
  phone: string;
  email: string | null;
  message: string | null;
  preferredVisitAt: string | null;
  visitCompletedAt: string | null;
  contactMethods: ContactMethod[];
  status: ApiStatus;
  ownerNotes: string | null;
  createdAt: string;
  listing: {
    id: string;
    name: string;
    locality: string;
    monthlyRent: number | null;
  };
};

type Enquiry = {
  id: string;
  candidate: string;
  initials: string;
  phone: string;
  email: string;
  property: string;
  locality: string;
  rent: number;
  date: string;
  preferredVisitAt: string;
  visitCompletedAt: string;
  contactMethods: ContactMethod[];
  status: UiStatus;
  message: string;
  notes: string;
};

const apiToUi: Record<ApiStatus, UiStatus> = {
  NEW: "New",
  CONTACTED: "Contacted",
  VISIT_SCHEDULED: "Visit Scheduled",
  CLOSED: "Closed",
};

const uiToApi: Record<UiStatus, ApiStatus> = {
  New: "NEW",
  Contacted: "CONTACTED",
  "Visit Scheduled": "VISIT_SCHEDULED",
  Closed: "CLOSED",
};

const statuses: UiStatus[] = [
  "New",
  "Contacted",
  "Visit Scheduled",
  "Closed",
];

const filters = ["All", ...statuses] as const;

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function formatDate(value: string) {
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
}

function formatDateTime(value: string) {
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
}

function statusClass(status: UiStatus) {
  return status.toLowerCase().replaceAll(" ", "-");
}

function getErrorMessage(error: any, fallback: string) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    fallback
  );
}

const contactLabels: Record<ContactMethod, string> = {
  INTERESTED: "Interested",
  CALL: "Call",
  WHATSAPP: "WhatsApp",
  VISIT: "Book a Visit",
};

export default function Enquiries() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [completingVisit, setCompletingVisit] = useState(false);

  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [activeFilter, setActiveFilter] =
    useState<(typeof filters)[number]>("All");

  const [selected, setSelected] =
    useState<Enquiry | null>(null);

  const [editStatus, setEditStatus] =
    useState<UiStatus>("New");

  const [editNotes, setEditNotes] = useState("");
  const [notice, setNotice] = useState("");

  // --------------------------------------------------
  // LOAD ENQUIRIES
  // --------------------------------------------------

  async function loadEnquiries() {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/enquiries");

      const rows: ApiEnquiry[] =
        response.data.enquiries ?? [];

      const mapped: Enquiry[] = rows.map((item) => ({
        id: item.id,
        candidate: item.candidateName,
        initials: initials(item.candidateName),
        phone: item.phone,
        email: item.email ?? "No email provided",

        property: item.listing?.name ?? "Unknown PG",
        locality: item.listing?.locality ?? "",
        rent: item.listing?.monthlyRent ?? 0,

        date: item.createdAt,
        preferredVisitAt: item.preferredVisitAt ?? "",
        visitCompletedAt: item.visitCompletedAt ?? "",

        contactMethods: item.contactMethods ?? [],
        status: apiToUi[item.status],

        message: item.message ?? "No message provided.",
        notes: item.ownerNotes ?? "",
      }));

      setEnquiries(mapped);

      // Keep the currently opened modal synchronized.
      setSelected((current) => {
        if (!current) return null;

        return (
          mapped.find((item) => item.id === current.id) ??
          null
        );
      });
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Could not load enquiries. Check the backend and your login."
        )
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadEnquiries();
  }, []);

  // --------------------------------------------------
  // STATISTICS
  // --------------------------------------------------

  const counts = useMemo(
    () => ({
      total: enquiries.length,

      new: enquiries.filter(
        (item) => item.status === "New"
      ).length,

      contacted: enquiries.filter(
        (item) => item.status === "Contacted"
      ).length,

      visits: enquiries.filter(
        (item) => item.status === "Visit Scheduled"
      ).length,
    }),
    [enquiries]
  );

  // --------------------------------------------------
  // SEARCH AND FILTER
  // --------------------------------------------------

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return enquiries.filter(
      (item) =>
        [
          item.candidate,
          item.property,
          item.locality,
          item.id,
        ].some((value) =>
          value.toLowerCase().includes(query)
        ) &&
        (activeFilter === "All" ||
          item.status === activeFilter)
    );
  }, [enquiries, search, activeFilter]);

  // --------------------------------------------------
  // OPEN ENQUIRY DETAILS
  // --------------------------------------------------

  function openDetails(enquiry: Enquiry) {
    setSelected(enquiry);
    setEditStatus(enquiry.status);
    setEditNotes(enquiry.notes);
    setNotice("");
    setError("");
  }

  // --------------------------------------------------
  // SAVE FOLLOW-UP
  // --------------------------------------------------

  async function saveChanges() {
    if (!selected) return;

    setSaving(true);
    setError("");
    setNotice("");

    try {
      await api.patch(`/enquiries/${selected.id}`, {
        status: uiToApi[editStatus],
        ownerNotes: editNotes.trim() || null,
      });

      setNotice("Enquiry follow-up updated successfully.");

      await loadEnquiries();
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Unable to save enquiry follow-up."
        )
      );
    } finally {
      setSaving(false);
    }
  }

  // --------------------------------------------------
  // MARK VISIT COMPLETED
  // --------------------------------------------------

  async function markVisitCompleted() {
    if (!selected) return;

    if (!selected.preferredVisitAt) {
      setError(
        "This candidate has not submitted a visit request."
      );
      return;
    }

    if (selected.visitCompletedAt) {
      setNotice("This visit has already been marked completed.");
      return;
    }

    const confirmed = window.confirm(
      "Confirm that this candidate has completed the PG visit?"
    );

    if (!confirmed) return;

    setCompletingVisit(true);
    setError("");
    setNotice("");

    try {
      await api.patch(`/enquiries/${selected.id}`, {
        visitCompletedAt: new Date().toISOString(),
      });

      setNotice(
        "Visit marked as completed successfully."
      );

      await loadEnquiries();
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Unable to mark the visit as completed."
        )
      );
    } finally {
      setCompletingVisit(false);
    }
  }

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <div className="enquiries-page">
      <div className="enquiries-heading">
        <div>
          <p className="eyebrow">CANDIDATE MANAGEMENT</p>
          <h1>Enquiries</h1>
          <p className="dashboard-subtitle">
            Respond to interested candidates and manage property visits.
          </p>
        </div>
      </div>

      {(notice || error) && (
        <div className="enquiry-notice">
          <CheckCircle2 size={18} />
          <span>{error || notice}</span>

          <button
            type="button"
            onClick={() => {
              setNotice("");
              setError("");
            }}
            aria-label="Dismiss"
          >
            <X size={17} />
          </button>
        </div>
      )}

      {/* STATISTICS */}

      <div className="enquiry-stats-grid">
        <article className="enquiry-stat-card">
          <div className="enquiry-stat-icon purple">
            <MessageSquare size={22} />
          </div>

          <div>
            <span>Total Enquiries</span>
            <strong>{counts.total}</strong>
            <small>All candidate requests</small>
          </div>
        </article>

        <article className="enquiry-stat-card">
          <div className="enquiry-stat-icon orange">
            <Clock3 size={22} />
          </div>

          <div>
            <span>New Enquiries</span>
            <strong>{counts.new}</strong>
            <small>Awaiting your response</small>
          </div>
        </article>

        <article className="enquiry-stat-card">
          <div className="enquiry-stat-icon blue">
            <Users size={22} />
          </div>

          <div>
            <span>Contacted</span>
            <strong>{counts.contacted}</strong>
            <small>Follow-up in progress</small>
          </div>
        </article>

        <article className="enquiry-stat-card">
          <div className="enquiry-stat-icon green">
            <CalendarDays size={22} />
          </div>

          <div>
            <span>Visits Scheduled</span>
            <strong>{counts.visits}</strong>
            <small>Prospective PG visits</small>
          </div>
        </article>
      </div>

      {/* SEARCH AND FILTER */}

      <section className="enquiries-toolbar">
        <div className="enquiries-search">
          <Search size={18} />

          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search candidate, PG or enquiry ID..."
            aria-label="Search enquiries"
          />

          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="enquiry-filter-label">
          <Filter size={16} />
          Status
        </div>

        <div className="enquiry-filter-chips">
          {filters.map((filter) => (
            <button
              key={filter}
              type="button"
              className={
                activeFilter === filter
                  ? "enquiry-chip active"
                  : "enquiry-chip"
              }
              onClick={() => setActiveFilter(filter)}
            >
              {filter}

              {filter === "New" && counts.new > 0 && (
                <span className="enquiry-chip-count">
                  {counts.new}
                </span>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* ENQUIRY TABLE */}

      <div className="enquiries-results-heading">
        <div>
          <h2>Candidate requests</h2>
          <p>
            Review enquiries and keep your follow-ups up to date.
          </p>
        </div>

        <span>{filtered.length} results</span>
      </div>

      {loading ? (
        <div className="listings-empty">
          Loading enquiries...
        </div>
      ) : filtered.length ? (
        <section className="enquiries-table-wrap">
          <table className="enquiries-table">
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Interested Property</th>
                <th>Monthly Rent</th>
                <th>Received</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className="candidate-cell">
                      <div className="candidate-avatar">
                        {item.initials}
                      </div>

                      <div>
                        <strong>{item.candidate}</strong>
                        <small>Enquiry #{item.id}</small>
                      </div>
                    </div>
                  </td>

                  <td>
                    <div className="enquiry-property-name">
                      {item.property}
                    </div>

                    <small className="enquiry-locality">
                      <MapPin size={12} />
                      {item.locality
                        ? `${item.locality}, Bengaluru`
                        : "Bengaluru"}
                    </small>
                  </td>

                  <td>
                    <strong className="enquiry-rent">
                      ₹{item.rent.toLocaleString("en-IN")}
                    </strong>

                    <small className="enquiry-rent-note">
                      per month
                    </small>
                  </td>

                  <td>
                    <span className="enquiry-date">
                      {formatDate(item.date)}
                    </span>
                  </td>

                  <td>
                    <span
                      className={`enquiry-status ${statusClass(
                        item.status
                      )}`}
                    >
                      {item.status === "New" && (
                        <Clock3 size={13} />
                      )}

                      {item.status === "Contacted" && (
                        <Phone size={13} />
                      )}

                      {item.status === "Visit Scheduled" && (
                        <CalendarDays size={13} />
                      )}

                      {item.status === "Closed" && (
                        <CheckCircle2 size={13} />
                      )}

                      {item.status}
                    </span>
                  </td>

                  <td>
                    <button
                      type="button"
                      className="enquiry-view-button"
                      onClick={() => openDetails(item)}
                    >
                      <Eye size={15} />
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : (
        <div className="listings-empty">
          <div className="empty-icon">
            <MessageSquare size={28} />
          </div>

          <h3>No enquiries found</h3>

          <p>
            {error ||
              "No database enquiries match these filters yet."}
          </p>

          <button
            type="button"
            className="secondary-button"
            onClick={() => {
              setSearch("");
              setActiveFilter("All");
              void loadEnquiries();
            }}
          >
            Refresh / clear filters
          </button>
        </div>
      )}

      {/* ENQUIRY DETAILS MODAL */}

      {selected && (
        <div
          className="enquiry-modal-backdrop"
          onClick={() => {
            if (!saving && !completingVisit) {
              setSelected(null);
            }
          }}
        >
          <section
            className="enquiry-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="enquiry-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            {/* HEADER */}

            <div className="enquiry-modal-heading">
              <div>
                <p className="eyebrow">
                  ENQUIRY #{selected.id}
                </p>

                <h2 id="enquiry-modal-title">
                  Candidate details
                </h2>
              </div>

              <button
                type="button"
                className="room-close-button"
                onClick={() => setSelected(null)}
                aria-label="Close"
              >
                <X size={19} />
              </button>
            </div>

            {/* CANDIDATE DETAILS */}

            <div className="enquiry-candidate-summary">
              <div className="candidate-avatar large">
                {selected.initials}
              </div>

              <div>
                <h3>{selected.candidate}</h3>

                <p>{selected.email}</p>

                <p>
                  <Phone size={13} />
                  {selected.phone}
                </p>
              </div>
            </div>

            {/* PROPERTY DETAILS */}

            <div className="enquiry-detail-grid">
              <div>
                <span>Interested PG</span>
                <strong>{selected.property}</strong>
              </div>

              <div>
                <span>Locality</span>
                <strong>
                  {selected.locality || "—"}, Bengaluru
                </strong>
              </div>

              <div>
                <span>Monthly rent</span>
                <strong>
                  ₹{selected.rent.toLocaleString("en-IN")}
                </strong>
              </div>

              <div>
                <span>Received on</span>
                <strong>{formatDate(selected.date)}</strong>
              </div>
            </div>

            {/* CONTACT HISTORY */}

            <div className="enquiry-extra-card">
              <div className="enquiry-extra-heading">
                <MessageCircle size={17} />
                <strong>Candidate contact history</strong>
              </div>

              {selected.contactMethods.length > 0 ? (
                <div className="enquiry-contact-methods">
                  {selected.contactMethods.map((method) => (
                    <span
                      className="enquiry-contact-tag"
                      key={method}
                    >
                      <Check size={13} />
                      {contactLabels[method]}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="enquiry-muted">
                  No contact actions recorded.
                </p>
              )}
            </div>

            {/* VISIT DETAILS */}

            <div className="enquiry-extra-card">
              <div className="enquiry-extra-heading">
                <CalendarDays size={17} />
                <strong>Property visit details</strong>
              </div>

              <div className="enquiry-detail-grid visit-grid">
                <div>
                  <span>Preferred visit</span>
                  <strong>
                    {selected.preferredVisitAt
                      ? formatDateTime(
                          selected.preferredVisitAt
                        )
                      : "Not specified"}
                  </strong>
                </div>

                <div>
                  <span>Visit completed</span>
                  <strong>
                    {selected.visitCompletedAt
                      ? formatDateTime(
                          selected.visitCompletedAt
                        )
                      : "Not completed"}
                  </strong>
                </div>
              </div>

              {selected.visitCompletedAt ? (
                <div className="enquiry-completed-banner">
                  <CheckCircle2 size={17} />
                  Property visit completed
                </div>
              ) : selected.preferredVisitAt ? (
                <button
                  type="button"
                  className="enquiry-complete-visit"
                  onClick={() =>
                    void markVisitCompleted()
                  }
                  disabled={completingVisit}
                >
                  <CheckCircle2 size={16} />

                  {completingVisit
                    ? "Updating visit..."
                    : "Mark Visit Completed"}
                </button>
              ) : (
                <p className="enquiry-muted">
                  A visit completion option will appear after
                  the candidate submits a visit request.
                </p>
              )}
            </div>

            {/* REVIEW ELIGIBILITY */}

            <div className="enquiry-extra-card">
              <div className="enquiry-extra-heading">
                <Star size={17} />
                <strong>Candidate review eligibility</strong>
              </div>

              {selected.visitCompletedAt ? (
                <p className="enquiry-review-ready">
                  <CheckCircle2 size={16} />
                  Visit completed. This candidate can be made
                  eligible to submit a PG review.
                </p>
              ) : (
                <p className="enquiry-muted">
                  Candidate review eligibility will be enabled
                  after the owner confirms the visit.
                </p>
              )}
            </div>

            {/* CANDIDATE MESSAGE */}

            <div className="enquiry-message-box">
              <span>Candidate message</span>
              <p>{selected.message}</p>
            </div>

            {/* FOLLOW-UP EDITING */}

            <div className="enquiry-edit-fields">
              <label className="room-field">
                Follow-up status

                <select
                  value={editStatus}
                  onChange={(event) =>
                    setEditStatus(
                      event.target.value as UiStatus
                    )
                  }
                >
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>

              <label className="room-field">
                Owner follow-up notes

                <textarea
                  value={editNotes}
                  onChange={(event) =>
                    setEditNotes(event.target.value)
                  }
                  rows={3}
                  placeholder="Record call outcome, visit details or next steps..."
                />
              </label>
            </div>

            {/* FOOTER */}

            <div className="enquiry-modal-footer">
              <button
                type="button"
                className="cancel-button"
                onClick={() => setSelected(null)}
                disabled={saving || completingVisit}
              >
                Cancel
              </button>

              <button
                type="button"
                className="primary-button"
                onClick={() => void saveChanges()}
                disabled={saving || completingVisit}
              >
                {saving
                  ? "Saving..."
                  : "Save follow-up"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}


import { useCallback, useEffect, useState } from "react";
import {
  Search,
  RefreshCw,
  Users,
  UserRound,
  Building2,
  ShieldCheck,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  X,
} from "lucide-react";

import {
  getAdminUsers,
  setAdminUserStatus,
  type ManagedUser,
  type ManagedUserStatus,
} from "../../services/adminUser.service";

import "./Admin.css";

interface AdminUsersProps {
  defaultRole: "OWNER" | "CANDIDATE";
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AdminUsers({
  defaultRole,
}: AdminUsersProps) {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ManagedUserStatus>("ALL");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [selectedUser, setSelectedUser] =
    useState<ManagedUser | null>(null);
  const [pendingUser, setPendingUser] =
    useState<ManagedUser | null>(null);
  const [updating, setUpdating] = useState(false);
  const [notice, setNotice] = useState("");

  // Keep the requested role fixed to this page.
  // Owners page -> OWNER; Users page -> CANDIDATE.
  const role = defaultRole;

  const loadUsers = useCallback(
    async (manual = false) => {
      if (manual) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const data = await getAdminUsers({
          search,
          role,
          status,
          page,
          limit: 10,
        });

        // Guard against an unexpected role in the response.
        // The backend should also filter by role.
        const filteredUsers = data.users.filter(
          (user) => user.role === defaultRole
        );

        setUsers(filteredUsers);
        setTotal(data.pagination.total);
        setTotalPages(data.pagination.totalPages);
      } catch (err: unknown) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load account records."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [search, role, status, page, defaultRole]
  );

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  function changeStatus(value: ManagedUserStatus) {
    setStatus(value);
    setPage(1);
  }

  async function confirmStatusChange() {
    if (!pendingUser || pendingUser.role !== defaultRole) {
      return;
    }

    setUpdating(true);
    setError("");
    setNotice("");

    try {
      const updated = await setAdminUserStatus(
        pendingUser.id,
        !pendingUser.isActive
      );

      setUsers((current) =>
        current.map((user) =>
          user.id === updated.id && user.role === defaultRole
            ? { ...user, ...updated }
            : user
        )
      );

      setSelectedUser((current) =>
        current?.id === updated.id
          ? { ...current, ...updated }
          : current
      );

      setNotice(
        `${updated.name}'s account is now ${
          updated.isActive ? "active" : "inactive"
        }.`
      );

      setPendingUser(null);

      await loadUsers(true);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update account status."
      );
    } finally {
      setUpdating(false);
    }
  }

  const activeCount = users.filter((user) => user.isActive).length;
  const inactiveCount = users.length - activeCount;

  const isOwnerPage = defaultRole === "OWNER";

  return (
    <div className="admin-overview admin-users-page">
      {/* Page heading */}
      <section className="admin-page-heading">
        <div className="admin-eyebrow">
          <span className="admin-eyebrow-line" />
          BEDNEAR ADMINISTRATION
        </div>

        <div className="admin-overview-heading-row">
          <div>
            <h1>
              {isOwnerPage
                ? "Owner Management"
                : "User Management"}
            </h1>

            <p>
              {isOwnerPage
                ? "Manage PG owners, review their accounts, and check owner details."
                : "View and manage candidates registered on the BedNear platform."}
            </p>
          </div>

          <button
            type="button"
            className="admin-refresh-button"
            onClick={() => void loadUsers(true)}
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

      {/* Account summary */}
      <section className="admin-user-summary">
        <article className="admin-user-summary-card">
          <div className="admin-user-summary-icon purple">
            <Users size={22} />
          </div>

          <div>
            <span>Total matching accounts</span>
            <strong>
              {loading ? "—" : total.toLocaleString("en-IN")}
            </strong>
          </div>
        </article>

        <article className="admin-user-summary-card">
          <div className="admin-user-summary-icon green">
            <ShieldCheck size={22} />
          </div>

          <div>
            <span>Active on this page</span>
            <strong>{loading ? "—" : activeCount}</strong>
          </div>
        </article>

        <article className="admin-user-summary-card">
          <div className="admin-user-summary-icon orange">
            <ShieldAlert size={22} />
          </div>

          <div>
            <span>Inactive on this page</span>
            <strong>{loading ? "—" : inactiveCount}</strong>
          </div>
        </article>
      </section>

      {/* Success notification */}
      {notice && (
        <div className="admin-user-notice" role="status">
          <ShieldCheck size={18} />
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

      {/* Error notification */}
      {error && (
        <div className="admin-dashboard-error" role="alert">
          <AlertCircle size={20} />

          <div>
            <strong>Unable to complete the request</strong>
            <p>{error}</p>

            <button
              type="button"
              onClick={() => void loadUsers(true)}
              disabled={refreshing}
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Separate owner or candidate table */}
      <section className="admin-users-panel">
        <div className="admin-users-panel-heading">
          <div>
            <h2>
              {isOwnerPage
                ? "Registered Owners"
                : "Registered Candidates"}
            </h2>

            <p>
              {isOwnerPage
                ? "Manage PG owner accounts and their access."
                : "Candidate accounts registered through the BedNear mobile app appear here."}
            </p>
          </div>
        </div>

        {/* Search and filters */}
        <form
          className="admin-users-filters"
          onSubmit={submitSearch}
        >
          <label className="admin-users-search">
            <Search size={18} />

            <input
              type="search"
              value={searchInput}
              onChange={(event) =>
                setSearchInput(event.target.value)
              }
              placeholder={
                isOwnerPage
                  ? "Search owner name, email, phone or business..."
                  : "Search candidate name, email or phone..."
              }
              aria-label={`Search ${
                isOwnerPage ? "owners" : "candidates"
              }`}
            />

            {searchInput && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => {
                  setSearchInput("");
                  setSearch("");
                  setPage(1);
                }}
              >
                <X size={16} />
              </button>
            )}
          </label>

          <button
            type="submit"
            className="admin-users-search-button"
          >
            Search
          </button>

          {/* Role is fixed for this page */}
          <select
            value={defaultRole}
            disabled
            aria-label="Account role"
          >
            <option value="OWNER">Owners</option>
            <option value="CANDIDATE">Candidates</option>
          </select>

          <select
            value={status}
            onChange={(event) =>
              changeStatus(
                event.target.value as ManagedUserStatus
              )
            }
            aria-label="Filter by account status"
          >
            <option value="ALL">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </form>

        {/* Accounts table */}
        <div className="admin-users-table-wrap">
          <table className="admin-users-table">
            <thead>
              <tr>
                <th>Account</th>
                <th>Role</th>
                <th>Contact</th>
                <th>Joined</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="admin-users-empty"
                  >
                    Loading accounts...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="admin-users-empty"
                  >
                    <Users size={28} />

                    <strong>
                      {isOwnerPage
                        ? "No owners found"
                        : "No candidates registered yet"}
                    </strong>

                    <span>
                      {isOwnerPage
                        ? "Try changing your search or status filter."
                        : "Candidates will appear here after registering through the BedNear mobile app."}
                    </span>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="admin-user-identity">
                        <div className="admin-user-avatar">
                          {isOwnerPage ? (
                            <Building2 size={19} />
                          ) : (
                            <UserRound size={19} />
                          )}
                        </div>

                        <div>
                          <strong>{user.name}</strong>
                          <span>
                            {isOwnerPage
                              ? user.businessName || user.email
                              : user.email}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span
                        className={`admin-user-role ${user.role.toLowerCase()}`}
                      >
                        {isOwnerPage ? "Owner" : "Candidate"}
                      </span>
                    </td>

                    <td>
                      <div className="admin-user-contact">
                        <span>{user.email}</span>
                        <span>
                          {user.phone || "No phone provided"}
                        </span>
                      </div>
                    </td>

                    <td>{formatDate(user.createdAt)}</td>

                    <td>
                      <span
                        className={`admin-user-status ${
                          user.isActive ? "active" : "inactive"
                        }`}
                      >
                        <span />
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td>
                      <div className="admin-user-actions">
                        <button
                          type="button"
                          className="admin-user-view-button"
                          onClick={() => setSelectedUser(user)}
                        >
                          View
                        </button>

                        <button
                          type="button"
                          className={`admin-user-toggle-button ${
                            user.isActive
                              ? "deactivate"
                              : "activate"
                          }`}
                          onClick={() => setPendingUser(user)}
                        >
                          {user.isActive
                            ? "Deactivate"
                            : "Activate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="admin-users-pagination">
          <span>
            {total === 0
              ? "No accounts"
              : `Showing ${(page - 1) * 10 + 1}-${Math.min(
                  page * 10,
                  total
                )} of ${total} accounts`}
          </span>

          <div>
            <button
              type="button"
              onClick={() =>
                setPage((current) => Math.max(1, current - 1))
              }
              disabled={page <= 1 || loading}
              aria-label="Previous page"
            >
              <ChevronLeft size={18} />
              Previous
            </button>

            <span>
              Page {totalPages === 0 ? 0 : page} of {totalPages}
            </span>

            <button
              type="button"
              onClick={() =>
                setPage((current) =>
                  Math.min(totalPages, current + 1)
                )
              }
              disabled={page >= totalPages || loading}
              aria-label="Next page"
            >
              Next
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* Account details modal */}
      {selectedUser && (
        <div
          className="admin-user-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedUser(null);
            }
          }}
        >
          <section
            className="admin-user-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-user-modal-title"
          >
            <div className="admin-user-modal-heading">
              <div>
                <span className="admin-eyebrow">
                  ACCOUNT DETAILS
                </span>

                <h2 id="admin-user-modal-title">
                  {selectedUser.name}
                </h2>
              </div>

              <button
                type="button"
                aria-label="Close account details"
                onClick={() => setSelectedUser(null)}
              >
                <X size={20} />
              </button>
            </div>

            <dl className="admin-user-details">
              <div>
                <dt>Email</dt>
                <dd>{selectedUser.email}</dd>
              </div>

              <div>
                <dt>Phone</dt>
                <dd>{selectedUser.phone || "Not provided"}</dd>
              </div>

              <div>
                <dt>Business name</dt>
                <dd>
                  {selectedUser.businessName || "Not provided"}
                </dd>
              </div>

              <div>
                <dt>Account role</dt>
                <dd>{selectedUser.role}</dd>
              </div>

              <div>
                <dt>Verification</dt>
                <dd>
                  {selectedUser.isVerified
                    ? "Verified"
                    : "Not verified"}
                </dd>
              </div>

              <div>
                <dt>Account status</dt>
                <dd>
                  {selectedUser.isActive ? "Active" : "Inactive"}
                </dd>
              </div>

              <div>
                <dt>PG listings</dt>
                <dd>{selectedUser._count?.listings ?? "—"}</dd>
              </div>

              <div>
                <dt>Subscriptions</dt>
                <dd>
                  {selectedUser._count?.subscriptions ?? "—"}
                </dd>
              </div>

              <div>
                <dt>Registered</dt>
                <dd>{formatDate(selectedUser.createdAt)}</dd>
              </div>
            </dl>

            <div className="admin-user-modal-footer">
              <button
                type="button"
                className="admin-user-view-button"
                onClick={() => setSelectedUser(null)}
              >
                Close
              </button>

              <button
                type="button"
                className={`admin-user-toggle-button ${
                  selectedUser.isActive
                    ? "deactivate"
                    : "activate"
                }`}
                onClick={() => setPendingUser(selectedUser)}
              >
                {selectedUser.isActive
                  ? "Deactivate account"
                  : "Activate account"}
              </button>
            </div>
          </section>
        </div>
      )}

      {/* Confirm activation or deactivation */}
      {pendingUser && (
        <div className="admin-user-modal-backdrop">
          <section
            className="admin-user-confirm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-user-confirm-title"
          >
            <div
              className={`admin-user-confirm-icon ${
                pendingUser.isActive ? "warning" : "success"
              }`}
            >
              {pendingUser.isActive ? (
                <ShieldAlert size={25} />
              ) : (
                <ShieldCheck size={25} />
              )}
            </div>

            <h2 id="admin-user-confirm-title">
              {pendingUser.isActive
                ? "Deactivate account?"
                : "Activate account?"}
            </h2>

            <p>
              Are you sure you want to{" "}
              {pendingUser.isActive ? "deactivate" : "activate"}{" "}
              <strong>{pendingUser.name}</strong>'s account?
              {pendingUser.isActive
                ? " They may lose access to authenticated features."
                : " They will be able to access features allowed for their role."}
            </p>

            <div className="admin-user-modal-footer">
              <button
                type="button"
                className="admin-user-view-button"
                onClick={() => setPendingUser(null)}
                disabled={updating}
              >
                Cancel
              </button>

              <button
                type="button"
                className={`admin-user-toggle-button ${
                  pendingUser.isActive
                    ? "deactivate"
                    : "activate"
                }`}
                onClick={() => void confirmStatusChange()}
                disabled={updating}
              >
                {updating
                  ? "Saving..."
                  : pendingUser.isActive
                    ? "Yes, deactivate"
                    : "Yes, activate"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

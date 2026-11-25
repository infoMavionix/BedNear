
import { useCallback, useEffect, useState } from "react";
import {
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  CheckCircle,
  Clock,
  XCircle,
  CalendarDays,
} from "lucide-react";

import {
  getAdminSubscriptions,
  getAdminSubscriptionSummary,
  type AdminSubscription,
  type SubscriptionSummary,
} from "../../services/adminSubscriptions.service";

import "./Admin.css";

const PAGE_SIZE = 10;

const INITIAL_SUMMARY: SubscriptionSummary = {
  totalSubscriptions: 0,
  activeSubscriptions: 0,
  pendingSubscriptions: 0,
  expiredSubscriptions: 0,
  cancelledSubscriptions: 0,
  totalRevenue: 0,
  currency: "INR",
};

const formatMoney = (amount: number, currency = "INR") => {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  } catch {
    return `₹${amount || 0}`;
  }
};

const formatDate = (date?: string | null) => {
  if (!date) return "—";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "—";
  }

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const statusClass = (status: string) =>
  `subscription-status subscription-status-${status.toLowerCase()}`;

export default function Subscriptions() {
  const [subscriptions, setSubscriptions] = useState<AdminSubscription[]>([]);

  const [summary, setSummary] =
    useState<SubscriptionSummary>(INITIAL_SUMMARY);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSubscriptions = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [listResponse, summaryResponse] = await Promise.all([
        getAdminSubscriptions({
          page,
          limit: PAGE_SIZE,
          search: search.trim() || undefined,
          status: status === "ALL" ? undefined : status,
        }),
        getAdminSubscriptionSummary(),
      ]);

      // Normalize list response
      const listData = listResponse?.data ?? listResponse;

      // Normalize summary response
      const summaryData = summaryResponse?.data ?? summaryResponse;

      const subscriptionRecords =
        listData?.subscriptions ??
        listData?.items ??
        listData?.results ??
        [];

      setSubscriptions(
        Array.isArray(subscriptionRecords) ? subscriptionRecords : []
      );

      // Pagination
      const pagination = listData?.pagination ?? listData?.meta ?? {};

      const recordCount = Number(
        pagination.total ?? listData?.total ?? 0
      );

      setTotal(recordCount);

      setTotalPages(
        Math.max(
          1,
          Number(
            pagination.totalPages ??
              Math.ceil(recordCount / PAGE_SIZE)
          )
        )
      );

      // Subscription summary
      const summaryResult =
        summaryData?.summary ?? summaryData ?? {};

      setSummary({
        totalSubscriptions: Number(
          summaryResult?.totalSubscriptions ?? 0
        ),

        activeSubscriptions: Number(
          summaryResult?.activeSubscriptions ?? 0
        ),

        pendingSubscriptions: Number(
          summaryResult?.pendingSubscriptions ?? 0
        ),

        expiredSubscriptions: Number(
          summaryResult?.expiredSubscriptions ?? 0
        ),

        cancelledSubscriptions: Number(
          summaryResult?.cancelledSubscriptions ?? 0
        ),

        totalRevenue: Number(
          summaryResult?.totalRevenue ?? 0
        ),

        currency: summaryResult?.currency || "INR",
      });
    } catch (err: any) {
      console.error("Admin subscriptions error:", err);

      setError(
        err?.response?.data?.message ||
          "Unable to load subscriptions. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  // Load subscriptions and summary
  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadSubscriptions();
    }, 300);

    return () => window.clearTimeout(timer);
  }, [loadSubscriptions]);

  // Reset pagination when filters change
  useEffect(() => {
    setPage(1);
  }, [search, status]);

  return (
    <div className="admin-subscriptions-page">

      {/* Page heading */}
      <div className="admin-subscriptions-heading">
        <div>
          <h1>Subscriptions</h1>
          <p>
            Monitor PG listing subscriptions and their billing status.
          </p>
        </div>

        <button
          type="button"
          className="as-refresh-button"
          onClick={loadSubscriptions}
          disabled={loading}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div className="as-summary-grid">

        {/* Total subscriptions */}
        <div className="as-summary-card">
          <span className="as-summary-icon blue">
            <CreditCard size={20} />
          </span>

          <div>
            <p>Total subscriptions</p>
            <h2>{summary.totalSubscriptions}</h2>
          </div>
        </div>

        {/* Active subscriptions */}
        <div className="as-summary-card">
          <span className="as-summary-icon green">
            <CheckCircle size={20} />
          </span>

          <div>
            <p>Active PG subscriptions</p>
            <h2>{summary.activeSubscriptions}</h2>
          </div>
        </div>

        {/* Pending subscriptions */}
        <div className="as-summary-card">
          <span className="as-summary-icon orange">
            <Clock size={20} />
          </span>

          <div>
            <p>Pending</p>
            <h2>{summary.pendingSubscriptions}</h2>
          </div>
        </div>

        {/* Expired and cancelled */}
        <div className="as-summary-card">
          <span className="as-summary-icon red">
            <XCircle size={20} />
          </span>

          <div>
            <p>Expired / Cancelled</p>

            <h2>
              {summary.expiredSubscriptions +
                summary.cancelledSubscriptions}
            </h2>

            <small>
              {summary.expiredSubscriptions} expired ·{" "}
              {summary.cancelledSubscriptions} cancelled
            </small>
          </div>
        </div>
      </div>

      {/* Revenue */}
      <div className="as-revenue-card">
        <div>
          <span>Subscription revenue</span>

          <h2>
            {formatMoney(
              summary.totalRevenue,
              summary.currency || "INR"
            )}
          </h2>
        </div>

        <CalendarDays size={25} />
      </div>

      {/* Subscription table */}
      <div className="as-table-card">

        {/* Search and filters */}
        <div className="as-toolbar">

          <div className="as-search">
            <Search size={18} />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search owner, PG or plan..."
            />
          </div>

          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="ALL">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="PENDING">Pending</option>
            <option value="EXPIRED">Expired</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>

        {/* Error */}
        {error && (
          <div className="as-error">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="as-table-wrapper">
          <table className="as-table">
            <thead>
              <tr>
                <th>PG / Listing</th>
                <th>Owner</th>
                <th>Plan</th>
                <th>Billing</th>
                <th>Amount</th>
                <th>Start date</th>
                <th>Expiry date</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="as-empty">
                    Loading subscriptions...
                  </td>
                </tr>
              ) : subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="as-empty">
                    No subscriptions found.
                  </td>
                </tr>
              ) : (
                subscriptions.map((subscription) => (
                  <tr key={subscription.id}>

                    {/* PG listing */}
                    <td>
                      <strong>
                        {subscription.listing?.name ||
                          "Listing unavailable"}
                      </strong>

                      <small>{subscription.id}</small>
                    </td>

                    {/* Owner */}
                    <td>
                      <strong>
                        {subscription.user?.name || "—"}
                      </strong>

                      <small>
                        {subscription.user?.email || "—"}
                      </small>
                    </td>

                    {/* Plan */}
                    <td>
                      <strong>{subscription.planName}</strong>
                      <small>{subscription.planCode}</small>
                    </td>

                    {/* Billing */}
                    <td>{subscription.billingCycle}</td>

                    {/* Amount */}
                    <td>
                      <strong>
                        {formatMoney(
                          subscription.amount,
                          subscription.currency
                        )}
                      </strong>
                    </td>

                    {/* Start date */}
                    <td>
                      {formatDate(subscription.startsAt)}
                    </td>

                    {/* Expiry date */}
                    <td>
                      {formatDate(subscription.expiresAt)}
                    </td>

                    {/* Status */}
                    <td>
                      <span
                        className={statusClass(subscription.status)}
                      >
                        {subscription.status}
                      </span>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="as-pagination">

          <span>
            Showing{" "}
            {subscriptions.length
              ? (page - 1) * PAGE_SIZE + 1
              : 0}
            {" "}to{" "}
            {Math.min(page * PAGE_SIZE, total)}
            {" "}of {total}
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
            </button>

            <strong>
              {page} / {totalPages}
            </strong>

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
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

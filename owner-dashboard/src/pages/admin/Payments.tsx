
import { useCallback, useEffect, useState } from "react";
import {
  CreditCard,
  IndianRupee,
  RefreshCw,
  Search,
  CheckCircle2,
  Clock3,
  XCircle,
  AlertCircle,
} from "lucide-react";
import {
  getAdminPayments,
  type AdminPayment,
  type AdminPaymentsResponse,
} from "../../services/adminPayments.service";
import "./Admin.css";

function money(amount: number, currency: string) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function date(value: string | null) {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? "—"
    : parsed.toLocaleString("en-IN");
}

function Status({ value }: { value: string }) {
  const className = value.toLowerCase();
  const Icon =
    value === "SUCCESS"
      ? CheckCircle2
      : value === "PENDING"
        ? Clock3
        : XCircle;

  return (
    <span className={`payment-status ${className}`}>
      <Icon size={14} />
      {value}
    </span>
  );
}

export default function Payments() {
  const [data, setData] = useState<AdminPaymentsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);

  const loadPayments = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await getAdminPayments({
        page,
        limit: 10,
        search,
        status,
      });
      setData(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load payments."
      );
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadPayments();
    }, 300);

    return () => window.clearTimeout(timer);
  }, [loadPayments]);

  const successful = data?.summary
    .filter((item) => item.status === "SUCCESS")
    .reduce((sum, item) => sum + item.totalAmount, 0) ?? 0;

  const successfulCount = data?.summary
    .filter((item) => item.status === "SUCCESS")
    .reduce((sum, item) => sum + item.count, 0) ?? 0;

  const pendingCount = data?.summary
    .filter((item) => item.status === "PENDING")
    .reduce((sum, item) => sum + item.count, 0) ?? 0;

  return (
    <div className="admin-payments-page">
      <div className="admin-payments-heading">
        <div>
          <span className="admin-payments-eyebrow">FINANCE MANAGEMENT</span>
          <h1>Payments</h1>
          <p>Monitor BedNear subscription transactions and payment records.</p>
        </div>

        <button
          className="admin-payments-refresh"
          onClick={() => void loadPayments()}
          disabled={loading}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="admin-payments-error">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      <div className="admin-payments-stats">
        <article>
          <span>Successful Revenue</span>
          <strong>{money(successful, "INR")}</strong>
          <small><IndianRupee size={14} /> Captured payments</small>
        </article>

        <article>
          <span>Successful Transactions</span>
          <strong>{successfulCount}</strong>
          <small><CheckCircle2 size={14} /> Successful payments</small>
        </article>

        <article>
          <span>Pending Transactions</span>
          <strong>{pendingCount}</strong>
          <small><Clock3 size={14} /> Awaiting payment</small>
        </article>

        <article>
          <span>Total Transactions</span>
          <strong>{data?.pagination.total ?? 0}</strong>
          <small><CreditCard size={14} /> All payment records</small>
        </article>
      </div>

      <section className="admin-payments-panel">
        <div className="admin-payments-toolbar">
          <div>
            <h2>Transaction History</h2>
            <p>Search and review payment records.</p>
          </div>

          <div className="admin-payments-controls">
            <div className="admin-payments-search">
              <Search size={17} />
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Search owner, PG, order ID..."
              />
            </div>

            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
            >
              <option value="ALL">All statuses</option>
              <option value="SUCCESS">Success</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
              <option value="REFUNDED">Refunded</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="admin-payments-empty">Loading transactions...</div>
        ) : data?.payments.length ? (
          <>
            <div className="admin-payments-table-wrap">
              <table className="admin-payments-table">
                <thead>
                  <tr>
                    <th>Transaction</th>
                    <th>Owner / PG</th>
                    <th>Plan</th>
                    <th>Amount</th>
                    <th>Provider</th>
                    <th>Status</th>
                    <th>Payment date</th>
                  </tr>
                </thead>
                <tbody>
                  {data.payments.map((payment: AdminPayment) => (
                    <tr key={payment.id}>
                      <td>
                        <strong>{payment.id}</strong>
                        <small>
                          {payment.providerPaymentId || payment.providerOrderId || "No gateway ID"}
                        </small>
                      </td>
                      <td>
                        <strong>{payment.subscription.user.name}</strong>
                        <small>{payment.subscription.user.email}</small>
                        <small>
                          {payment.subscription.listing?.name ?? "Listing unavailable"}
                        </small>
                      </td>
                      <td>
                        <strong>{payment.subscription.planName}</strong>
                        <small>{payment.subscription.billingCycle}</small>
                      </td>
                      <td>
                        <strong>{money(payment.amount, payment.currency)}</strong>
                      </td>
                      <td>{payment.provider || "—"}</td>
                      <td><Status value={payment.status} /></td>
                      <td>{date(payment.paidAt || payment.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="admin-payments-pagination">
              <span>
                Page {data.pagination.page} of {Math.max(1, data.pagination.totalPages)}
                {" · "}{data.pagination.total} records
              </span>
              <div>
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((current) => current - 1)}
                >
                  Previous
                </button>
                <button
                  disabled={page >= data.pagination.totalPages}
                  onClick={() => setPage((current) => current + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="admin-payments-empty">
            No payment transactions found.
          </div>
        )}
      </section>
    </div>
  );
}

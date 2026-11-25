import { useCallback, useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  RefreshCw,
  X,
  Check,
  Tags,
} from "lucide-react";
import {
  getAdminSubscriptionPlans,
  createAdminSubscriptionPlan,
  updateAdminSubscriptionPlan,
  updateAdminSubscriptionPlanStatus,
  type SubscriptionPlan,
} from "../../services/adminSubscriptions.service";
import "./Admin.css";

interface PlanForm {
  code: string;
  name: string;
  description: string;
  monthlyPrice: string;
  quarterlyPrice: string;
  features: string;
}

const emptyForm: PlanForm = {
  code: "",
  name: "",
  description: "",
  monthlyPrice: "",
  quarterlyPrice: "",
  features: "",
};

const formatMoney = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

export default function SubscriptionPricing() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [form, setForm] = useState<PlanForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadPlans = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getAdminSubscriptionPlans();
      const data = response?.data ?? response;

      setPlans(data?.plans ?? data?.items ?? data ?? []);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Unable to load subscription plans."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  const openCreateModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setSuccess("");
    setModalOpen(true);
  };

  const openEditModal = (plan: SubscriptionPlan) => {
    setEditingId(plan.id);
    setForm({
      code: plan.code,
      name: plan.name,
      description: plan.description || "",
      monthlyPrice: String(plan.monthlyPrice),
      quarterlyPrice: String(plan.quarterlyPrice),
      features: (plan.features || []).join("\n"),
    });
    setError("");
    setSuccess("");
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const monthlyPrice = Number(form.monthlyPrice);
    const quarterlyPrice = Number(form.quarterlyPrice);

    if (!form.code.trim() || !form.name.trim()) {
      setError("Plan code and plan name are required.");
      return;
    }

    if (
      !Number.isInteger(monthlyPrice) ||
      !Number.isInteger(quarterlyPrice) ||
      monthlyPrice < 1 ||
      quarterlyPrice < 1
    ) {
      setError("Enter valid monthly and quarterly prices greater than zero.");
      return;
    }

    const payload = {
      code: form.code.trim().toUpperCase().replace(/\s+/g, "_"),
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      monthlyPrice,
      quarterlyPrice,
      features: form.features
        .split("\n")
        .map((feature) => feature.trim())
        .filter(Boolean),
    };

    try {
      setSaving(true);
      setError("");

      if (editingId) {
        await updateAdminSubscriptionPlan(editingId, payload);
        setSuccess("Subscription plan updated successfully.");
      } else {
        await createAdminSubscriptionPlan(payload);
        setSuccess("Subscription plan created successfully.");
      }

      setModalOpen(false);
      setEditingId(null);
      setForm(emptyForm);
      await loadPlans();
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Unable to save the subscription plan."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (plan: SubscriptionPlan) => {
    const nextStatus = !plan.isActive;
    const confirmed = window.confirm(
      `Are you sure you want to ${
        nextStatus ? "activate" : "deactivate"
      } the ${plan.name} plan?`
    );

    if (!confirmed) return;

    try {
      setError("");
      await updateAdminSubscriptionPlanStatus(plan.id, nextStatus);
      setSuccess(
        `${plan.name} plan ${
          nextStatus ? "activated" : "deactivated"
        } successfully.`
      );
      await loadPlans();
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Unable to update plan status."
      );
    }
  };

  return (
    <div className="subscription-pricing-page">
      <div className="sp-heading">
        <div>
          <h1>Subscription Pricing</h1>
          <p>Manage the plans and prices offered to PG owners.</p>
        </div>

        <div className="sp-heading-actions">
          <button
            className="sp-refresh-button"
            onClick={loadPlans}
            disabled={loading}
          >
            <RefreshCw size={16} />
            Refresh
          </button>

          <button className="sp-primary-button" onClick={openCreateModal}>
            <Plus size={17} />
            Add plan
          </button>
        </div>
      </div>

      {error && !modalOpen && <div className="sp-alert error">{error}</div>}
      {success && <div className="sp-alert success">{success}</div>}

      <div className="sp-info">
        <Tags size={19} />
        <span>
          Prices are configured in Indian Rupees (₹). Changes here affect
          the plans displayed to owners during subscription checkout.
        </span>
      </div>

      {loading ? (
        <div className="sp-loading">Loading subscription plans...</div>
      ) : plans.length === 0 ? (
        <div className="sp-empty">
          <Tags size={30} />
          <h3>No subscription plans found</h3>
          <p>Create your first subscription plan to get started.</p>
          <button className="sp-primary-button" onClick={openCreateModal}>
            <Plus size={17} />
            Add plan
          </button>
        </div>
      ) : (
        <div className="sp-plan-grid">
          {plans.map((plan) => (
            <article className="sp-plan-card" key={plan.id}>
              <div className="sp-plan-top">
                <div>
                  <span className="sp-plan-code">{plan.code}</span>
                  <h2>{plan.name}</h2>
                </div>

                <span
                  className={`sp-plan-status ${
                    plan.isActive ? "active" : "inactive"
                  }`}
                >
                  {plan.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              <p className="sp-description">
                {plan.description || "No description provided."}
              </p>

              <div className="sp-prices">
                <div>
                  <span>Monthly</span>
                  <strong>{formatMoney(plan.monthlyPrice)}</strong>
                  <small>per month</small>
                </div>

                <div>
                  <span>Quarterly</span>
                  <strong>{formatMoney(plan.quarterlyPrice)}</strong>
                  <small>per 3 months</small>
                </div>
              </div>

              <div className="sp-features">
                <h3>Plan features</h3>

                {plan.features?.length ? (
                  <ul>
                    {plan.features.map((feature, index) => (
                      <li key={`${plan.id}-${index}`}>
                        <Check size={15} />
                        {feature}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No features added.</p>
                )}
              </div>

              <div className="sp-card-actions">
                <button
                  className="sp-edit-button"
                  onClick={() => openEditModal(plan)}
                >
                  <Pencil size={15} />
                  Edit plan
                </button>

                <button
                  className={`sp-toggle-button ${
                    plan.isActive ? "deactivate" : "activate"
                  }`}
                  onClick={() => handleStatusChange(plan)}
                >
                  {plan.isActive ? "Deactivate" : "Activate"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="sp-modal-backdrop" onMouseDown={closeModal}>
          <div
            className="sp-modal"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="sp-modal-header">
              <div>
                <h2>{editingId ? "Edit subscription plan" : "Create subscription plan"}</h2>
                <p>Enter the plan details and pricing.</p>
              </div>

              <button
                className="sp-close-button"
                onClick={closeModal}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              {error && <div className="sp-alert error">{error}</div>}

              <div className="sp-form-grid">
                <label>
                  Plan code *
                  <input
                    value={form.code}
                    onChange={(event) =>
                      setForm({ ...form, code: event.target.value })
                    }
                    placeholder="STARTER"
                    required
                  />
                </label>

                <label>
                  Plan name *
                  <input
                    value={form.name}
                    onChange={(event) =>
                      setForm({ ...form, name: event.target.value })
                    }
                    placeholder="Starter"
                    required
                  />
                </label>

                <label className="sp-full">
                  Description
                  <textarea
                    value={form.description}
                    onChange={(event) =>
                      setForm({ ...form, description: event.target.value })
                    }
                    placeholder="Short description of this plan"
                    rows={2}
                  />
                </label>

                <label>
                  Monthly price (₹) *
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={form.monthlyPrice}
                    onChange={(event) =>
                      setForm({ ...form, monthlyPrice: event.target.value })
                    }
                    placeholder="99"
                    required
                  />
                </label>

                <label>
                  Quarterly price (₹) *
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={form.quarterlyPrice}
                    onChange={(event) =>
                      setForm({ ...form, quarterlyPrice: event.target.value })
                    }
                    placeholder="297"
                    required
                  />
                </label>

                <label className="sp-full">
                  Features
                  <textarea
                    value={form.features}
                    onChange={(event) =>
                      setForm({ ...form, features: event.target.value })
                    }
                    placeholder={"Add one feature per line\nExample: Listing visibility"}
                    rows={5}
                  />
                  <small>Enter each feature on a separate line.</small>
                </label>
              </div>

              <div className="sp-modal-actions">
                <button
                  type="button"
                  className="sp-cancel-button"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="sp-primary-button"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingId
                    ? "Save changes"
                    : "Create plan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
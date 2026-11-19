
import { useCallback, useEffect, useState } from "react";
import {
  RefreshCw,
  ShieldCheck,
  FileText,
  UserRound,
  MapPin,
  Mail,
  Phone,
  Building2,
  CheckCircle2,
  Clock3,
  XCircle,
  Eye,
  AlertCircle,
} from "lucide-react";

import {
  getRecentOwnerVerifications,
  getOwnerVerificationDocumentFile,
  reviewOwnerDocument,
  type PendingOwnerVerification,
  type OwnerVerificationDocument,
  type OwnerDocumentType,
} from "../../services/adminOwnerVerification.service";


import "./Admin.css";

function formatDate(value?: string | null): string {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not available";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getLatestDocument(
  documents: OwnerVerificationDocument[],
  type: OwnerDocumentType
): OwnerVerificationDocument | undefined {
  return [...documents]
    .filter((document) => document.type === type)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime()
    )[0];
}

function StatusBadge({ status }: { status: string }) {
  const className =
    status === "VERIFIED" || status === "APPROVED"
      ? "ov-status ov-status-success"
      : status === "REJECTED"
        ? "ov-status ov-status-danger"
        : "ov-status ov-status-pending";

  return <span className={className}>{status.replaceAll("_", " ")}</span>;
}

function PrivateDocumentPreview({
  document,
}: {
  document: OwnerVerificationDocument;
}) {
  const [fileUrl, setFileUrl] = useState("");
  const [fileType, setFileType] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let objectUrl: string | undefined;
    let cancelled = false;

    async function loadFile() {
      try {
        setError("");
        const blob = await getOwnerVerificationDocumentFile(document.id);

        if (cancelled) return;

        objectUrl = URL.createObjectURL(blob);
        setFileUrl(objectUrl);
        setFileType(blob.type);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Unable to load document."
          );
        }
      }
    }

    void loadFile();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [document.id]);

  if (error) {
    return (
      <div className="ov-preview-message ov-preview-error">
        <AlertCircle size={17} />
        {error}
      </div>
    );
  }

  if (!fileUrl) {
    return (
      <div className="ov-preview-message">
        <RefreshCw size={17} className="ov-spin" />
        Loading document preview...
      </div>
    );
  }

  if (fileType === "application/pdf") {
    return (
      <iframe
        className="ov-pdf-preview"
        src={fileUrl}
        title={document.originalName}
      />
    );
  }

  if (fileType.startsWith("image/")) {
    return (
      <img
        className="ov-image-preview"
        src={fileUrl}
        alt={document.originalName}
      />
    );
  }

  return (
    <div className="ov-preview-message">
      Preview is unavailable for this file format.
    </div>
  );
}

function DocumentCard({
  title,
  document,
  processing,
  onReview,
}: {
  title: string;
  document?: OwnerVerificationDocument;
  processing: boolean;
  onReview: (
    document: OwnerVerificationDocument,
    status: "VERIFIED" | "REJECTED"
  ) => void;
}) {
  const [previewOpen, setPreviewOpen] = useState(false);

  return (
    <section className="ov-document-card">
      <div className="ov-document-heading">
        <div className="ov-document-title">
          <div className="ov-document-icon">
            <FileText size={20} />
          </div>
          <div>
            <h3>{title}</h3>
            <p>
              {document?.originalName ?? "Document not uploaded"}
            </p>
          </div>
        </div>

        {document && <StatusBadge status={document.status} />}
      </div>

      {!document ? (
        <div className="ov-missing-document">
          <AlertCircle size={17} />
          This required document was not found.
        </div>
      ) : (
        <>
          {document.reviewNote && (
            <div className="ov-review-note">
              <strong>Previous review note:</strong> {document.reviewNote}
            </div>
          )}

          <button
            type="button"
            className="ov-preview-toggle"
            onClick={() => setPreviewOpen((current) => !current)}
          >
            <Eye size={17} />
            {previewOpen ? "Hide document preview" : "View document"}
          </button>

          {previewOpen && (
            <div className="ov-preview-container">
              <PrivateDocumentPreview document={document} />
            </div>
          )}

          <div className="ov-document-actions">
            <button
              type="button"
              className="ov-button ov-button-approve"
              disabled={processing || document.status === "VERIFIED"}
              onClick={() => onReview(document, "VERIFIED")}
            >
              <CheckCircle2 size={16} />
              Verify
            </button>

            <button
              type="button"
              className="ov-button ov-button-reject"
              disabled={processing || document.status === "REJECTED"}
              onClick={() => onReview(document, "REJECTED")}
            >
              <XCircle size={16} />
              Reject
            </button>
          </div>

          {document.reviewedAt && (
            <p className="ov-reviewed-date">
              Last reviewed: {formatDate(document.reviewedAt)}
            </p>
          )}
        </>
      )}
    </section>
  );
}

export default function OwnerVerification() {
  const [owners, setOwners] = useState<PendingOwnerVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadOwners = useCallback(async (showRefresh = false) => {
    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const data = await getRecentOwnerVerifications();
      setOwners(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load owner verification applications."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadOwners();
  }, [loadOwners]);

  async function handleReview(
    document: OwnerVerificationDocument,
    status: "VERIFIED" | "REJECTED"
  ) {
    let reviewNote = "";

    if (status === "REJECTED") {
      const enteredNote = window.prompt(
        "Enter the reason for rejecting this document:"
      );

      if (enteredNote === null) return;

      reviewNote = enteredNote.trim();

      if (reviewNote.length < 5) {
        setError("Please enter a rejection reason of at least 5 characters.");
        return;
      }
    } else if (
      !window.confirm(
        `Verify "${document.originalName}"?`
      )
    ) {
      return;
    }

    setProcessingId(document.id);
    setError("");
    setMessage("");

    try {
      const result = await reviewOwnerDocument(
        document.id,
        status,
        reviewNote || undefined
      );

      setMessage(result.message);

      // Refresh from the backend so the page shows the actual
      // owner and document verification status.
      await loadOwners(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update document verification."
      );
    } finally {
      setProcessingId(null);
    }
  }

  if (loading) {
    return (
      <div className="ov-loading">
        <RefreshCw size={22} className="ov-spin" />
        Loading owner verification applications...
      </div>
    );
  }

  return (
    <div className="ov-page">
      <div className="ov-page-header">
        <div>
          <div className="ov-eyebrow">
            <span />
            BEDNEAR ADMINISTRATION
          </div>

          <h1>Owner Verification</h1>
          <p>
            Review owner registration details, identity proof and PG licences.
          </p>
        </div>

        <button
          type="button"
          className="ov-refresh-button"
          onClick={() => void loadOwners(true)}
          disabled={refreshing}
        >
          <RefreshCw size={17} className={refreshing ? "ov-spin" : ""} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="ov-alert ov-alert-error">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {message && (
        <div className="ov-alert ov-alert-success">
          <CheckCircle2 size={18} />
          {message}
        </div>
      )}

      <div className="ov-summary">
        <div>
          <span>Applications displayed</span>
          <strong>{owners.length}</strong>
        </div>
        <div>
          <span>Pending review</span>
          <strong>
            {owners.filter(
              (owner) =>
                owner.verificationStatus === "PENDING_REVIEW" ||
                owner.verificationStatus === "UNDER_REVIEW"
            ).length}
          </strong>
        </div>
        <div>
          <span>Rejected</span>
          <strong>
            {
              owners.filter(
                (owner) => owner.verificationStatus === "REJECTED"
              ).length
            }
          </strong>
        </div>
      </div>

      {owners.length === 0 ? (
        <div className="ov-empty">
          <ShieldCheck size={42} />
          <h2>No pending owner applications</h2>
          <p>
            There are no recent owner applications awaiting verification.
          </p>
        </div>
      ) : (
        <div className="ov-owner-list">
          {owners.map((owner) => {
            const identity = getLatestDocument(
              owner.verificationDocuments ?? [],
              "OWNER_IDENTITY"
            );

            const license = getLatestDocument(
              owner.verificationDocuments ?? [],
              "PG_LICENSE"
            );

            return (
              <article className="ov-owner-card" key={owner.id}>
                <div className="ov-owner-header">
                  <div className="ov-owner-avatar">
                    <UserRound size={24} />
                  </div>

                  <div className="ov-owner-main">
                    <h2>{owner.name}</h2>
                    <p>{owner.businessName || "PG owner"}</p>
                    <span>Registered: {formatDate(owner.createdAt)}</span>
                  </div>

                  <StatusBadge status={owner.verificationStatus} />
                </div>

                <div className="ov-owner-details">
                  <div>
                    <Mail size={16} />
                    <span>{owner.email}</span>
                  </div>

                  <div>
                    <Phone size={16} />
                    <span>{owner.phone || "Phone not provided"}</span>
                  </div>

                  <div>
                    <Building2 size={16} />
                    <span>
                      {owner.ownerProfile?.ownerType || "Owner type not provided"}
                    </span>
                  </div>

                  <div>
                    <MapPin size={16} />
                    <span>
                      {[
                        owner.ownerProfile?.address,
                        owner.ownerProfile?.locality,
                        owner.ownerProfile?.city,
                        owner.ownerProfile?.state,
                        owner.ownerProfile?.pincode,
                      ]
                        .filter(Boolean)
                        .join(", ") || "Address not provided"}
                    </span>
                  </div>
                </div>

                <div className="ov-document-grid">
                  <DocumentCard
                    title="Owner identity proof"
                    document={identity}
                    processing={processingId !== null}
                    onReview={handleReview}
                  />

                  <DocumentCard
                    title="PG licence"
                    document={license}
                    processing={processingId !== null}
                    onReview={handleReview}
                  />
                </div>

                <div className="ov-owner-footer">
                  <div>
                    <Clock3 size={16} />
                    Account: {owner.isActive ? "Active" : "Inactive"}
                  </div>

                  <div>
                    <ShieldCheck size={16} />
                    Verified: {owner.isVerified ? "Yes" : "No"}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

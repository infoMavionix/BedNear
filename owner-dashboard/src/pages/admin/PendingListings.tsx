
import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  BedDouble,
  Building2,
  CheckCircle,
  Clock3,
  ExternalLink,
  Home,
  Image as ImageIcon,
  IndianRupee,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  ShieldCheck,
  UserRound,
  Users,
  XCircle,
} from "lucide-react";

import {
  approveListing,
  getPendingListings,
  rejectListing,
  getAdminListingImageFile,
  getAdminDocumentFile,
  reviewVerificationDocument,
  type PendingListing,
  type VerificationDocument,
} from "../../services/adminListing.service";

import "./Admin.css";

function formatMoney(value?: number | null): string {
  if (value == null) return "Not provided";
  return `₹${Number(value).toLocaleString("en-IN")}`;
}

function formatDate(value?: string | null): string {
  if (!value) return "Date unavailable";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getDocumentLabel(type: VerificationDocument["type"]): string {
  switch (type) {
    case "OWNER_IDENTITY":
      return "Owner identity document";
    case "PROPERTY_OWNERSHIP":
      return "Property ownership document";
    case "AUTHORIZATION_LETTER":
      return "Property authorization letter";
    default:
      return "Verification document";
  }
}

function getLatestDocument(
  documents: VerificationDocument[],
  type: VerificationDocument["type"]
): VerificationDocument | undefined {
  return documents
    .filter((document) => document.type === type)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
}

function getListingVerification(listing: PendingListing) {
  const documents = listing.verificationDocuments ?? [];
  const identity = getLatestDocument(documents, "OWNER_IDENTITY");
  const ownership = getLatestDocument(documents, "PROPERTY_OWNERSHIP");
  const authorization = getLatestDocument(documents, "AUTHORIZATION_LETTER");
  const identityVerified = identity?.status === "VERIFIED";
  const propertyProof =
    ownership?.status === "VERIFIED" || authorization?.status === "VERIFIED";
  const hasPhoto = (listing.images ?? []).length > 0;
  const hasCoordinates = listing.latitude != null && listing.longitude != null;

  return {
    identityVerified,
    propertyProof,
    hasPhoto,
    hasCoordinates,
    canApprove: Boolean(identityVerified && propertyProof && hasPhoto && hasCoordinates),
  };
}

function PrivateImagePreview({
  listingId,
  storageKey,
  alt,
}: {
  listingId: string;
  storageKey: string;
  alt: string;
}) {
  const [imageUrl, setImageUrl] = useState("");
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    let objectUrl: string | undefined;
    let cancelled = false;

    async function loadImage() {
      try {
        const blob = await getAdminListingImageFile(listingId, storageKey);
        if (cancelled) return;

        objectUrl = URL.createObjectURL(blob);
        setImageUrl(objectUrl);
      } catch {
        if (!cancelled) setImageError(true);
      }
    }

    void loadImage();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [listingId, storageKey]);

  if (imageError) {
    return <div className="pending-file-error">Unable to load photo</div>;
  }

  if (!imageUrl) {
    return <div className="pending-file-loading">Loading photo...</div>;
  }

  return <img src={imageUrl} alt={alt} />;
}

function PrivateDocumentPreview({
  document,
}: {
  document: VerificationDocument;
}) {
  const [fileUrl, setFileUrl] = useState("");
  const [fileError, setFileError] = useState(false);

  useEffect(() => {
    let objectUrl: string | undefined;
    let cancelled = false;

    async function loadDocument() {
      try {
        const blob = await getAdminDocumentFile(document.id);
        if (cancelled) return;

        objectUrl = URL.createObjectURL(blob);
        setFileUrl(objectUrl);
      } catch {
        if (!cancelled) setFileError(true);
      }
    }

    void loadDocument();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [document.id]);

  if (fileError) {
    return <p className="pending-file-error">Unable to load this document.</p>;
  }

  if (!fileUrl) {
    return <p className="pending-file-loading">Loading document...</p>;
  }

  if (document.mimeType === "application/pdf") {
    return (
      <iframe
        className="pending-document-frame"
        src={fileUrl}
        title={document.originalName}
      />
    );
  }

  return (
    <img
      className="pending-document-image"
      src={fileUrl}
      alt={document.originalName}
    />
  );
}

export default function PendingListings() {
  const [listings, setListings] = useState<PendingListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [rejectingListing, setRejectingListing] = useState<PendingListing | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const loadListings = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getPendingListings();
      setListings(data);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load pending PG listings."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadListings();
  }, [loadListings]);

  function toggleDetails(id: string) {
    setExpandedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  }

 async function handleDocumentReview(
  listingId: string,
  documentId: string,
  status: "VERIFIED" | "REJECTED"
) {
    const listing = listings.find((item) => item.id === listingId);
    if (!listing) return;

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
    } else {
      const confirmed = window.confirm(
        "Mark this verification document as verified?"
      );

      if (!confirmed) return;
    }

    setProcessingId(listingId);
    setError("");
    setMessage("");

    try {
      await reviewVerificationDocument(
        documentId,
        status,
        reviewNote || undefined
      );

      setListings((current) =>
        current.map((item) =>
          item.id === listingId
            ? {
                ...item,
                verificationDocuments: (
                  item.verificationDocuments ?? []
                ).map((doc) =>
                  doc.id === documentId
                    ? {
                        ...doc,
                        status,
                        reviewNote: reviewNote || null,
                        reviewedAt: new Date().toISOString(),
                      }
                    : doc
                ),
              }
            : item
        )
      );

      setMessage(
        status === "VERIFIED"
          ? "Document marked as verified."
          : "Document rejected with remarks."
      );
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update document verification."
      );
    } finally {
      setProcessingId(null);
    }
  }

   async function handleAction(
    id: string,
    action: "approve" | "reject"
  ) {
    const listing = listings.find((item) => item.id === id);
    if (!listing) return;

    if (action === "reject") {
      setRejectionReason("");
      setRejectingListing(listing);
      return;
    }

    const readiness = getListingVerification(listing);
    if (!readiness.canApprove) {
      setError(
        "This PG cannot be published yet. Verify the latest owner identity and property proof, and ensure photos and map coordinates are available."
      );
      setExpandedIds((current) =>
        current.includes(id) ? current : [...current, id]
      );
      return;
    }

    const confirmed = window.confirm(
      `Approve and publish "${listing.name}"?`
    );
    if (!confirmed) return;

    setProcessingId(id);
    setError("");
    setMessage("");

    try {
      await approveListing(id);
      setMessage(`"${listing.name}" has been approved and published.`);
      setListings((current) => current.filter((item) => item.id !== id));
      setExpandedIds((current) => current.filter((item) => item !== id));
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "The action failed. Please try again."
      );
    } finally {
      setProcessingId(null);
    }
  }

  async function submitListingRejection() {
    if (!rejectingListing) return;

    const reason = rejectionReason.trim();
    if (reason.length < 5) {
      setError("Please enter a rejection reason of at least 5 characters.");
      return;
    }

    const listing = rejectingListing;
    setProcessingId(listing.id);
    setError("");
    setMessage("");

    try {
      await rejectListing(listing.id, reason);
      setMessage(
        `"${listing.name}" has been returned to Draft. The owner can now correct the details and resubmit it.`
      );
      setListings((current) => current.filter((item) => item.id !== listing.id));
      setExpandedIds((current) => current.filter((item) => item !== listing.id));
      setRejectingListing(null);
      setRejectionReason("");
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to return this PG to Draft. Please try again."
      );
    } finally {
      setProcessingId(null);
    }
  }

  if (loading) {
    return (
      <div className="pending-loading">
        <RefreshCw className="pending-spinner" size={23} />
        <span>Loading pending listings...</span>
      </div>
    );
  }

  return (
    <div className="pending-page">
      <section className="pending-page-heading">
        <div className="pending-heading-copy">
          <div className="pending-eyebrow">
            <span />
            LISTING MANAGEMENT
          </div>

          <h1>Pending PG Approvals</h1>

          <p>
            Verify property information and owner details before publishing a
            PG on BedNear.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadListings()}
          disabled={processingId !== null}
          className="pending-refresh-button"
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </section>

      <section className="pending-summary">
        <div className="pending-summary-icon">
          <Clock3 size={24} />
        </div>

        <div className="pending-summary-copy">
          <span>Awaiting review</span>
          <strong>{listings.length}</strong>
          <small>
            {listings.length === 1
              ? "PG listing requires your attention"
              : "PG listings require your attention"}
          </small>
        </div>

        <div className="pending-summary-badge">
          <span />
          Pending review
        </div>
      </section>

      {message && (
        <div className="pending-alert pending-alert-success" role="status">
          <CheckCircle size={19} />
          <span>{message}</span>
          <button
            type="button"
            aria-label="Dismiss message"
            onClick={() => setMessage("")}
          >
            ×
          </button>
        </div>
      )}

      {error && (
        <div className="pending-alert pending-alert-error" role="alert">
          <AlertCircle size={19} />
          <span>{error}</span>
          <button
            type="button"
            aria-label="Dismiss error"
            onClick={() => setError("")}
          >
            ×
          </button>
        </div>
      )}

      {!error && listings.length === 0 ? (
        <section className="pending-empty-state">
          <div className="pending-empty-icon">
            <CheckCircle size={37} />
          </div>

          <h2>All caught up!</h2>
          <p>There are no pending PG listings to review.</p>

          <span className="pending-empty-caption">
            New owner submissions will appear here.
          </span>

          <button
            type="button"
            className="pending-empty-refresh"
            onClick={() => void loadListings()}
          >
            <RefreshCw size={15} />
            Check again
          </button>
        </section>
      ) : (
        <section className="pending-listings-section">
          <div className="pending-listings-heading">
            <div>
              <h2>Submitted properties</h2>
              <p>
                Open each property to inspect its full details before making an
                approval decision.
              </p>
            </div>

            <span className="pending-count-badge">
              {listings.length} {listings.length === 1 ? "listing" : "listings"}
            </span>
          </div>

          <div className="pending-listings-list">
            {listings.map((listing) => {
              const coverImage =
                listing.images?.find((image) => image.isCover) ??
                listing.images?.[0];

              const isExpanded = expandedIds.includes(listing.id);

              const totalBeds =
                listing.rooms?.reduce(
                  (total, room) => total + (room.beds?.length ?? 0),
                  0
                ) ?? 0;

              const documents = listing.verificationDocuments ?? [];

              return (
                <article className="pending-listing-card" key={listing.id}>
                  <div className="pending-listing-header">
                    <div className="pending-listing-title">
                      <h3>{listing.name}</h3>
                      <p>
                        {listing.category} <span>·</span> Submitted{" "}
                        {formatDate(listing.submittedAt || listing.createdAt)}
                      </p>
                    </div>

                    <span className="pending-review-badge">
                      <span />
                      Pending review
                    </span>
                  </div>

                  <div className="pending-listing-body">
                    <div className="pending-property-image">
                      {coverImage?.storageKey ? (
                        <PrivateImagePreview
                          listingId={listing.id}
                          storageKey={coverImage.storageKey}
                          alt={listing.name}
                        />
                      ) : (
                        <div className="pending-image-placeholder">
                          <Building2 size={42} />
                          <span>No property image</span>
                        </div>
                      )}
                    </div>

                    <div className="pending-property-details">
                      <div className="pending-property-facts">
                        <span>
                          <MapPin size={17} />
                          <span>
                            {listing.locality}, {listing.city}
                          </span>
                        </span>

                        <span>
                          <IndianRupee size={17} />
                          <span>{formatMoney(listing.monthlyRent)} / month</span>
                        </span>
                      </div>

                      <p className="pending-description">
                        {listing.description || "No description provided."}
                      </p>

                      <div className="pending-owner-card">
                        <div className="pending-owner-heading">
                          <div className="pending-owner-icon">
                            <UserRound size={19} />
                          </div>
                          <div>
                            <h4>Owner information</h4>
                            <span>Property submitted by</span>
                          </div>
                        </div>

                        <div className="pending-owner-details">
                          <p className="pending-owner-name">
                            {listing.owner.name}
                          </p>

                          <p>
                            <Mail size={14} />
                            {listing.owner.email}
                          </p>

                          {listing.owner.phone && (
                            <p>
                              <Phone size={14} />
                              {listing.owner.phone}
                            </p>
                          )}

                          {listing.owner.businessName && (
                            <p>Business: {listing.owner.businessName}</p>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        className="pending-details-toggle"
                        onClick={() => toggleDetails(listing.id)}
                        aria-expanded={isExpanded}
                      >
                        {isExpanded ? "Hide full PG details" : "View full PG details"}
                        <span>{isExpanded ? "−" : "+"}</span>
                      </button>

                      {isExpanded && (
                        <div className="pending-full-details">
                          <section className="pending-detail-section">
                            <h4>
                              <Home size={18} />
                              Property information
                            </h4>

                            <div className="pending-detail-grid">
                              <div>
                                <span>Property name</span>
                                <strong>{listing.name}</strong>
                              </div>
                              <div>
                                <span>Category</span>
                                <strong>{listing.category}</strong>
                              </div>
                              <div>
                                <span>Complete address</span>
                                <strong>{listing.address || "Not provided"}</strong>
                              </div>
                              <div>
                                <span>Locality</span>
                                <strong>{listing.locality || "Not provided"}</strong>
                              </div>
                              <div>
                                <span>City</span>
                                <strong>{listing.city || "Not provided"}</strong>
                              </div>
                              <div>
                                <span>State</span>
                                <strong>{listing.state || "Not provided"}</strong>
                              </div>
                              <div>
                                <span>PIN code</span>
                                <strong>{listing.pincode || "Not provided"}</strong>
                              </div>
                              <div>
                                <span>Gender policy</span>
                                <strong>{listing.genderPolicy || "Not provided"}</strong>
                              </div>
                            </div>

                            <div className="pending-detail-description">
                              <span>Property description</span>
                              <p>{listing.description || "No description provided."}</p>
                            </div>
                          </section>

                          <section className="pending-detail-section">
                            <h4>
                              <MapPin size={18} />
                              Property map location
                            </h4>

                            {listing.latitude != null &&
                            listing.longitude != null ? (
                              <>
                                <p className="pending-map-coordinates">
                                  Latitude: {listing.latitude} · Longitude:{" "}
                                  {listing.longitude}
                                </p>

                                <iframe
                                  title={`${listing.name} map location`}
                                  className="pending-map-frame"
                                  loading="lazy"
                                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${listing.longitude - 0.005}%2C${listing.latitude - 0.005}%2C${listing.longitude + 0.005}%2C${listing.latitude + 0.005}&layer=mapnik&marker=${listing.latitude}%2C${listing.longitude}`}
                                />

                                <a
                                  className="pending-map-link"
                                  href={`https://www.google.com/maps?q=${listing.latitude},${listing.longitude}`}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  <ExternalLink size={14} />
                                  Open in Google Maps
                                </a>
                              </>
                            ) : (
                              <p className="pending-no-details">
                                The owner has not provided map coordinates.
                              </p>
                            )}
                          </section>

                          <section className="pending-detail-section">
                            <h4>
                              <IndianRupee size={18} />
                              Rent and deposit
                            </h4>

                            <div className="pending-detail-grid">
                              <div>
                                <span>Monthly rent</span>
                                <strong>{formatMoney(listing.monthlyRent)}</strong>
                              </div>
                              <div>
                                <span>Security deposit</span>
                                <strong>{formatMoney(listing.deposit)}</strong>
                              </div>
                            </div>
                          </section>

                          <section className="pending-detail-section">
                            <h4>
                              <BedDouble size={18} />
                              Rooms and bed availability
                            </h4>

                            <div className="pending-room-summary">
                              <div>
                                <strong>{listing.rooms?.length ?? 0}</strong>
                                <span>Total rooms</span>
                              </div>
                              <div>
                                <strong>{totalBeds}</strong>
                                <span>Total beds</span>
                              </div>
                            </div>

                            {listing.rooms?.length ? (
                              <div className="pending-room-list">
                                {listing.rooms.map((room) => (
                                  <div className="pending-room-card" key={room.id}>
                                    <div className="pending-room-heading">
                                      <strong>{room.name}</strong>
                                      <span>Capacity: {room.capacity}</span>
                                    </div>

                                    {room.beds?.length ? (
                                      <div className="pending-bed-list">
                                        {room.beds.map((bed) => (
                                          <span
                                            key={bed.id}
                                            className={`pending-bed-status ${bed.status.toLowerCase()}`}
                                          >
                                            Bed · {bed.status}
                                          </span>
                                        ))}
                                      </div>
                                    ) : (
                                      <p>No beds added to this room.</p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="pending-no-details">
                                No room information available.
                              </p>
                            )}
                          </section>

                          <section className="pending-detail-section">
                            <h4>
                              <ShieldCheck size={18} />
                              Amenities
                            </h4>

                            {listing.amenities?.length ? (
                              <div className="pending-amenities-list">
                                {listing.amenities.map((item, index) => (
                                  <span key={`${item.amenity.name}-${index}`}>
                                    {item.amenity.name}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <p className="pending-no-details">
                                No amenities have been added.
                              </p>
                            )}
                          </section>

                          <section className="pending-detail-section">
                            <h4>
                              <ImageIcon size={18} />
                              Property photos
                            </h4>

                            {listing.images?.length ? (
                              <div className="pending-photo-grid">
                                {listing.images.map((image) => (
                                  <div className="pending-photo-item" key={image.id}>
                                    {image.storageKey ? (
                                      <PrivateImagePreview
                                        listingId={listing.id}
                                        storageKey={image.storageKey}
                                        alt={image.altText || listing.name}
                                      />
                                    ) : (
                                      <div className="pending-file-error">
                                        Photo storage information unavailable
                                      </div>
                                    )}

                                    {image.isCover && <span>Cover photo</span>}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="pending-no-details">
                                No property photos uploaded.
                              </p>
                            )}
                          </section>

                          <section className="pending-detail-section">
                            <h4>
                              <Users size={18} />
                              Owner and document verification
                            </h4>

                            <div className="pending-detail-grid">
                              <div>
                                <span>Owner name</span>
                                <strong>{listing.owner.name}</strong>
                              </div>
                              <div>
                                <span>Email address</span>
                                <strong>{listing.owner.email}</strong>
                              </div>
                              <div>
                                <span>Phone number</span>
                                <strong>{listing.owner.phone || "Not provided"}</strong>
                              </div>
                              <div>
                                <span>Business name</span>
                                <strong>
                                  {listing.owner.businessName || "Not provided"}
                                </strong>
                              </div>
                            </div>

                            {(() => {
                              const readiness = getListingVerification(listing);
                              const checks = [
                                { label: "Latest owner identity document verified", done: readiness.identityVerified },
                                { label: "Ownership document or authorization letter verified", done: readiness.propertyProof },
                                { label: "At least one property photo uploaded", done: readiness.hasPhoto },
                                { label: "Map coordinates provided", done: readiness.hasCoordinates },
                              ];
                              return (
                                <div className="pending-verification-checklist">
                                  <div className="pending-verification-checklist-heading">
                                    <strong>Approval checklist</strong>
                                    <span className={readiness.canApprove ? "ready" : "not-ready"}>
                                      {readiness.canApprove ? "Ready for approval" : "Requirements incomplete"}
                                    </span>
                                  </div>
                                  <ul>
                                    {checks.map((check) => (
                                      <li key={check.label} className={check.done ? "complete" : "incomplete"}>
                                        {check.done ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                                        <span>{check.label}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              );
                            })()}

                            <div className="pending-document-list">
                              <h5>Submitted verification documents</h5>

                              {documents.length ? (
                                documents.map((document) => (
                                  <article
                                    className="pending-document-card"
                                    key={document.id}
                                  >
                                    <div className="pending-document-heading">
                                      <div>
                                        <strong>
                                          {getDocumentLabel(document.type)}
                                        </strong>
                                        <span>{document.originalName}</span>
                                      </div>

                                      <span
                                        className={`pending-document-status ${document.status.toLowerCase()}`}
                                      >
                                        {document.status}
                                      </span>
                                    </div>

                                    <PrivateDocumentPreview document={document} />

                                    {document.reviewNote && (
                                      <p className="pending-document-remark">
                                        Previous review remark: {document.reviewNote}
                                      </p>
                                    )}

                                    <div className="pending-document-actions">
                                      <button
                                        type="button"
                                        disabled={
                                          processingId !== null ||
                                          document.status === "VERIFIED"
                                        }
                                        onClick={() =>
                                          void handleDocumentReview(
                                            listing.id,
                                            document.id,
                                            "VERIFIED"
                                          )
                                        }
                                        className="pending-document-verify"
                                      >
                                        <CheckCircle size={15} />
                                        Verify document
                                      </button>

                                      <button
                                        type="button"
                                        disabled={
                                          processingId !== null ||
                                          document.status === "REJECTED"
                                        }
                                        onClick={() =>
                                          void handleDocumentReview(
                                            listing.id,
                                            document.id,
                                            "REJECTED"
                                          )
                                        }
                                        className="pending-document-reject"
                                      >
                                        <XCircle size={15} />
                                        Reject document
                                      </button>
                                    </div>
                                  </article>
                                ))
                              ) : (
                                <p className="pending-no-details">
                                  No verification documents have been uploaded.
                                </p>
                              )}
                            </div>
                          </section>
                        </div>
                      )}

                      <div className="pending-listing-actions">
                        <button
                          type="button"
                          disabled={
                            processingId !== null ||
                            !getListingVerification(listing).canApprove
                          }
                          title={
                            getListingVerification(listing).canApprove
                              ? "Approve and publish this PG"
                              : "Complete the approval checklist before publishing"
                          }
                          onClick={() => void handleAction(listing.id, "approve")}
                          className="pending-approve-button"
                        >
                          {processingId === listing.id ? (
                            <RefreshCw size={17} className="pending-spinner" />
                          ) : (
                            <CheckCircle size={18} />
                          )}
                          {processingId === listing.id
                            ? "Processing..."
                            : "Approve & Publish"}
                        </button>

                        <button
                          type="button"
                          disabled={processingId !== null}
                          onClick={() => void handleAction(listing.id, "reject")}
                          className="pending-reject-button"
                        >
                          <XCircle size={18} />
                          Return to Draft
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {rejectingListing && (
        <div
          className="pending-rejection-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && processingId === null) {
              setRejectingListing(null);
              setRejectionReason("");
            }
          }}
        >
          <section
            className="pending-rejection-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pending-rejection-title"
          >
            <div className="pending-rejection-modal-header">
              <div className="pending-rejection-icon">
                <XCircle size={22} />
              </div>
              <button
                type="button"
                className="pending-rejection-close"
                aria-label="Close rejection dialog"
                disabled={processingId !== null}
                onClick={() => {
                  setRejectingListing(null);
                  setRejectionReason("");
                }}
              >
                ×
              </button>
            </div>

            <h2 id="pending-rejection-title">Return PG to Draft</h2>
            <p>
              Explain what the owner needs to correct for{" "}
              <strong>{rejectingListing.name}</strong>. This reason will be
              visible in the owner's dashboard.
            </p>

            <label className="pending-rejection-label" htmlFor="pending-rejection-reason">
              Rejection reason <span>*</span>
            </label>
            <textarea
              id="pending-rejection-reason"
              className="pending-rejection-textarea"
              value={rejectionReason}
              onChange={(event) => setRejectionReason(event.target.value)}
              placeholder="Example: The property address is incomplete. Please provide the building name, street and nearby landmark."
              rows={5}
              maxLength={1000}
              autoFocus
              disabled={processingId !== null}
            />
            <div className="pending-rejection-hint">
              <span>Minimum 5 characters. Be specific and helpful.</span>
              <span>{rejectionReason.length}/1000</span>
            </div>

            <div className="pending-rejection-actions">
              <button
                type="button"
                className="pending-rejection-cancel"
                disabled={processingId !== null}
                onClick={() => {
                  setRejectingListing(null);
                  setRejectionReason("");
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="pending-rejection-submit"
                disabled={processingId !== null || rejectionReason.trim().length < 5}
                onClick={() => void submitListingRejection()}
              >
                {processingId === rejectingListing.id ? (
                  <RefreshCw size={16} className="pending-spinner" />
                ) : (
                  <XCircle size={16} />
                )}
                {processingId === rejectingListing.id ? "Returning..." : "Return to Draft"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

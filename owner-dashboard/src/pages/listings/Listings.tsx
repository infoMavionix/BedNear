
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Plus,
  Search,
  MapPin,
  BedDouble,
  IndianRupee,
  MoreHorizontal,
  Pencil,
  Eye,
  Building2,
  SlidersHorizontal,
  CheckCircle2,
  Clock3,
  XCircle,
  X,
  Trash2,
   
  Images,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { api } from "../../services/api";
import { listingService } from "../../services/listing.service";

type Listing = {
  id: string;
  name: string;
  locality: string;
  rent: number;
  totalBeds: number;
  availableBeds: number;
  category: string;
  status: "Published" | "Pending" | "Draft";
  coverImageUrl?: string;
  photos: { id: string; url: string; sortOrder: number }[];
  rejectionReason?: string | null;
};

type ApiBed = {
  id: string;
  status: string;
};

type ApiRoom = {
  id: string;
  capacity?: number;
  beds?: ApiBed[];
};

type ApiListingImage = {
  id: string;
  url?: string;
  storageKey?: string;
  isCover?: boolean;
  sortOrder?: number;
};

type ApiListing = {
  id: string;
  name: string;
  locality?: string;
  city?: string;
  address?: string;
  category?: string;
  monthlyRent?: number | string | null;
  status?: string;
  rejectionReason?: string | null;
  rooms?: ApiRoom[];
  images?: ApiListingImage[];
};

const filters = ["All", "Published", "Pending", "Draft"] as const;

function mapListing(item: ApiListing): Listing {
  const rooms = item.rooms ?? [];

  const totalBeds = rooms.reduce(
    (sum, room) =>
      sum +
      (room.beds !== undefined
        ? room.beds.length
        : Number(room.capacity ?? 0)),
    0
  );

  const availableBeds = rooms.reduce(
    (sum, room) =>
      sum +
      (room.beds ?? []).filter(
        (bed) => String(bed.status).toUpperCase() === "AVAILABLE"
      ).length,
    0
  );

  const rawStatus = String(item.status ?? "DRAFT").toUpperCase();

  const status: Listing["status"] =
    rawStatus === "PUBLISHED"
      ? "Published"
      : rawStatus === "PENDING"
        ? "Pending"
        : "Draft";

  const categoryLabels: Record<string, string> = {
    MEN: "Men",
    WOMEN: "Women",
    CO_LIVING: "Co-living",
    COLIVING: "Co-living",
  };

  return {
    id: item.id,
    name: item.name,
    locality:
      [item.locality, item.city].filter(Boolean).join(", ") ||
      item.address ||
      "Location not provided",
    rent: Number(item.monthlyRent ?? 0),
    totalBeds,
    availableBeds,
    category:
      categoryLabels[String(item.category ?? "").toUpperCase()] ??
      item.category ??
      "PG",
    status,
    photos: [],
    rejectionReason: item.rejectionReason ?? null,
  };
}

export default function Listings() {
  const navigate = useNavigate();

  const [listings, setListings] = useState<Listing[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] =
    useState<(typeof filters)[number]>("All");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [successKind, setSuccessKind] = useState<"submitted" | "general">(
    "general"
  );

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [galleryListingId, setGalleryListingId] = useState<string | null>(null);
  const [galleryIndex, setGalleryIndex] = useState(0);

  // Keep track of temporary image URLs so they can be released.
  const imageObjectUrls = useRef<string[]>([]);

  // Fetch PG listings and their private cover photos.
  const fetchListings = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/listings");

      const records: ApiListing[] = Array.isArray(response.data)
        ? response.data
        : response.data?.listings ??
          response.data?.data?.listings ??
          response.data?.data ??
          [];

      if (!Array.isArray(records)) {
        throw new Error("Unexpected response received from listings API.");
      }

      // Release URLs from the previous fetch.
      imageObjectUrls.current.forEach((url) => URL.revokeObjectURL(url));
      imageObjectUrls.current = [];

      const mappedListings = records.map(mapListing);

      // Download every property photo using the authenticated Axios instance.
      // Each listing is mapped independently so photos never mix between PGs.
      const listingsWithPhotos = await Promise.all(
        records.map(async (item, index) => {
          const listing = mappedListings[index];

          const images = [...(item.images ?? [])].sort(
            (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
          );

          const loadedPhotos = await Promise.all(
            images.map(async (image) => {
              if (!image.storageKey) return null;

              try {
                const imageResponse = await api.get(
                  `/listings/${encodeURIComponent(item.id)}/images/${encodeURIComponent(
                    image.storageKey
                  )}/file`,
                  { responseType: "blob" }
                );

                const imageUrl = URL.createObjectURL(imageResponse.data);
                imageObjectUrls.current.push(imageUrl);

                return {
                  id: image.id,
                  url: imageUrl,
                  sortOrder: image.sortOrder ?? 0,
                  isCover: Boolean(image.isCover),
                };
              } catch (imageError) {
                console.error(
                  `Unable to load property photo for ${item.name}:`,
                  imageError
                );
                return null;
              }
            })
          );

          const photos = loadedPhotos.filter(
            (photo): photo is NonNullable<typeof photo> => photo !== null
          );

          const coverPhoto =
            photos.find((photo) =>
              images.some(
                (image) => image.id === photo.id && image.isCover
              )
            ) ?? photos[0];

          return {
            ...listing,
            photos: photos.map(({ id, url, sortOrder }) => ({
              id,
              url,
              sortOrder,
            })),
            coverImageUrl: coverPhoto?.url,
          };
        })
      );

      setListings(listingsWithPhotos);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.message ??
            (err.response?.status === 401
              ? "Please log in to view your PG listings."
              : "Unable to load PG listings. Check that your backend is running.")
        );
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchListings();

    return () => {
      imageObjectUrls.current.forEach((url) => URL.revokeObjectURL(url));
      imageObjectUrls.current = [];
    };
  }, [fetchListings]);

  // Search and filter listings.
  const visibleListings = useMemo(() => {
    const query = search.trim().toLowerCase();

    return listings.filter(
      (listing) =>
        (listing.name.toLowerCase().includes(query) ||
          listing.locality.toLowerCase().includes(query)) &&
        (filter === "All" || listing.status === filter)
    );
  }, [listings, search, filter]);

  const published = listings.filter(
    (item) => item.status === "Published"
  ).length;

  const availableBeds = listings.reduce(
    (sum, item) => sum + item.availableBeds,
    0
  );

  // Delete listing.
  async function handleDelete(listing: Listing) {
    if (
      !window.confirm(
        `Delete "${listing.name}"? This may also remove related rooms and beds. This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      setDeletingId(listing.id);
      setError("");
      setSuccessMessage("");

      await api.delete(`/listings/${encodeURIComponent(listing.id)}`);

      setListings((current) =>
        current.filter((item) => item.id !== listing.id)
      );

      setOpenMenuId(null);
      setSuccessKind("general");
      setSuccessMessage(`"${listing.name}" was deleted successfully.`);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.message ??
            "Unable to delete this PG. Check whether related records prevent deletion."
        );
      } else {
        setError(
          err instanceof Error
            ? err.message
            : "An unexpected error occurred while deleting the PG."
        );
      }
    } finally {
      setDeletingId(null);
    }
  }

  // Submit draft listing for admin approval.
  async function handleSubmitForReview(listing: Listing) {
    if (listing.status !== "Draft" || submittingId !== null) {
      return;
    }

    const confirmed = window.confirm(
      `Submit "${listing.name}" for admin approval?`
    );

    if (!confirmed) return;

    try {
      setSubmittingId(listing.id);
      setError("");
      setSuccessMessage("");

      const response = await listingService.submitForReview(listing.id);

      setListings((current) =>
        current.map((item) =>
          item.id === listing.id
            ? { ...item, status: "Pending", rejectionReason: null }
            : item
        )
      );

      setOpenMenuId(null);
      setSuccessKind("submitted");
      setSuccessMessage(
        response.message ||
          `"${listing.name}" was submitted for admin approval.`
      );
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.message ??
            "Unable to submit this PG for approval. Please try again."
        );
      } else {
        setError(
          err instanceof Error
            ? err.message
            : "An unexpected error occurred while submitting the PG."
        );
      }
    } finally {
      setSubmittingId(null);
    }
  }

  function statusIcon(status: Listing["status"]) {
    if (status === "Published") return <CheckCircle2 size={14} />;
    if (status === "Pending") return <Clock3 size={14} />;
    return <XCircle size={14} />;
  }

  const activeGalleryListing = listings.find(
    (listing) => listing.id === galleryListingId
  );

  function openGallery(listing: Listing) {
    if (listing.photos.length === 0) return;
    setGalleryListingId(listing.id);
    setGalleryIndex(0);
  }

  function closeGallery() {
    setGalleryListingId(null);
    setGalleryIndex(0);
  }

  function showPreviousPhoto() {
    if (!activeGalleryListing) return;
    setGalleryIndex((current) =>
      current === 0 ? activeGalleryListing.photos.length - 1 : current - 1
    );
  }

  function showNextPhoto() {
    if (!activeGalleryListing) return;
    setGalleryIndex((current) =>
      current === activeGalleryListing.photos.length - 1 ? 0 : current + 1
    );
  }

  return (
    <div className="listings-page">
      <div className="listings-heading">
        <div>
          <p className="eyebrow">PROPERTY MANAGEMENT</p>
          <h1>My PGs</h1>
          <p className="dashboard-subtitle">
            Manage your properties, rent and available beds.
          </p>
        </div>

        <Link to="/listings/new" className="primary-button">
          <Plus size={19} />
          Add New PG
        </Link>
      </div>

      <div className="listing-summary">
        <article className="listing-summary-card">
          <div className="summary-icon purple">
            <Building2 size={21} />
          </div>
          <div>
            <span>Total Properties</span>
            <strong>{listings.length}</strong>
          </div>
        </article>

        <article className="listing-summary-card">
          <div className="summary-icon green">
            <CheckCircle2 size={21} />
          </div>
          <div>
            <span>Published</span>
            <strong>{published}</strong>
          </div>
        </article>

        <article className="listing-summary-card">
          <div className="summary-icon orange">
            <BedDouble size={21} />
          </div>
          <div>
            <span>Available Beds</span>
            <strong>{availableBeds}</strong>
          </div>
        </article>
      </div>

      <section className="listing-toolbar">
        <div className="listing-search">
          <Search size={19} />

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by PG name or locality..."
            aria-label="Search PG listings"
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

        <div className="listing-filter-label">
          <SlidersHorizontal size={17} />
          <span>Status:</span>
        </div>

        <div className="listing-filters">
          {filters.map((item) => (
            <button
              key={item}
              type="button"
              className={
                filter === item ? "filter-chip active" : "filter-chip"
              }
              onClick={() => setFilter(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      {error && (
        <div className="listing-error" role="alert">
          <AlertCircle size={19} />
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Dismiss error"
          >
            <X size={17} />
          </button>
        </div>
      )}

      {successMessage && (
        <div
          className={`listing-success ${
            successKind === "submitted" ? "submission-success" : ""
          }`}
          role="status"
        >
          <div className="listing-success-icon">
            <CheckCircle2 size={22} />
          </div>

          <div className="listing-success-content">
            <strong>
              {successKind === "submitted"
                ? "PG submitted successfully"
                : "Action completed successfully"}
            </strong>

            <span>
              {successKind === "submitted"
                ? "Your property has been submitted for admin review. You can track its approval status below."
                : successMessage}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setSuccessMessage("")}
            aria-label="Dismiss success message"
          >
            <X size={18} />
          </button>
        </div>
      )}

      <div className="listings-results-heading">
        <div>
          <h2>Your properties</h2>
          <p>Manage and track all your PG properties in one place.</p>
        </div>
        <span>{visibleListings.length} results</span>
      </div>

      {loading ? (
        <div className="listings-empty">
          <p>Loading your PG listings...</p>
        </div>
      ) : visibleListings.length > 0 ? (
        <div className="pg-listing-grid">
          {visibleListings.map((listing) => (
            <article className="pg-listing-card" key={listing.id}>
              <div className="pg-card-cover">
                {listing.coverImageUrl ? (
                  <img
                    className="pg-card-cover-image"
                    src={listing.coverImageUrl}
                    alt={`${listing.name} cover`}
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <div className="pg-cover-icon">
                    <Building2 size={34} />
                  </div>
                )}

                <span
                  className={`listing-status ${listing.status.toLowerCase()}`}
                >
                  {statusIcon(listing.status)}
                  {listing.status}
                </span>

                {listing.photos.length > 0 && (
                  <button
                    type="button"
                    className="pg-photo-label pg-view-photos-button"
                    onClick={() => openGallery(listing)}
                    aria-label={`View all ${listing.photos.length} photos of ${listing.name}`}
                  >
                    <Images size={14} />
                    View photos ({listing.photos.length})
                  </button>
                )}
              </div>

              <div className="pg-card-body">
                <div className="pg-card-title-row">
                  <div>
                    <h3>{listing.name}</h3>
                    <p className="pg-locality">
                      <MapPin size={14} />
                      {listing.locality}
                    </p>
                  </div>

                  <div className="pg-card-menu">
                    <button
                      type="button"
                      className="icon-button"
                      title="Property actions"
                      aria-label={`Actions for ${listing.name}`}
                      aria-expanded={openMenuId === listing.id}
                      onClick={() =>
                        setOpenMenuId((current) =>
                          current === listing.id ? null : listing.id
                        )
                      }
                    >
                      <MoreHorizontal size={21} />
                    </button>

                    {openMenuId === listing.id && (
                      <div className="pg-card-menu-dropdown">
                        <button
                          type="button"
                          onClick={() => {
                            setOpenMenuId(null);
                            navigate(`/listings/${listing.id}/edit`);
                          }}
                        >
                          <Pencil size={15} />
                          Edit PG
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setOpenMenuId(null);
                            navigate(`/listings/${listing.id}`);
                          }}
                        >
                          <Eye size={15} />
                          View Details
                        </button>

                        <button
                          type="button"
                          className="delete-action"
                          disabled={deletingId === listing.id}
                          onClick={() => void handleDelete(listing)}
                        >
                          <Trash2 size={15} />
                          {deletingId === listing.id
                            ? "Deleting..."
                            : "Delete PG"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pg-card-meta">
                  <span className="pg-category">{listing.category}</span>

                  <span className="pg-rent">
                    <IndianRupee size={16} />
                    {listing.rent.toLocaleString("en-IN")}
                    <small>/person/month</small>
                  </span>
                </div>

                {listing.rejectionReason && listing.status === "Draft" && (
                  <div className="pg-rejection-notice">
                    <AlertCircle size={16} />
                    <div>
                      <strong>Changes requested by admin</strong>
                      <p>{listing.rejectionReason}</p>
                    </div>
                  </div>
                )}

                <div className="bed-availability">
                  <div className="bed-availability-heading">
                    <span>
                      <BedDouble size={16} />
                      Bed availability
                    </span>

                    <strong>
                      {listing.availableBeds}/{listing.totalBeds} available
                    </strong>
                  </div>

                  <div className="availability-track">
                    <div
                      className="availability-fill"
                      style={{
                        width: `${
                          listing.totalBeds > 0
                            ? Math.min(
                                100,
                                (listing.availableBeds / listing.totalBeds) *
                                  100
                              )
                            : 0
                        }%`,
                      }}
                    />
                  </div>

                  <p>
                    {listing.availableBeds === 0
                      ? "No vacant beds"
                      : `${listing.availableBeds} beds ready for residents`}
                  </p>
                </div>

                <div className="pg-card-actions">
                  <button
                    type="button"
                    className="listing-action secondary"
                    onClick={() =>
                      navigate(`/listings/${listing.id}/edit`)
                    }
                  >
                    <Pencil size={15} />
                    Edit
                  </button>

                  <button
                    type="button"
                    className="listing-action primary"
                    onClick={() => navigate(`/listings/${listing.id}`)}
                  >
                    <Eye size={15} />
                    View details
                  </button>

                  {listing.status === "Draft" && (
                    <button
                      type="button"
                      className="listing-action primary submit-listing-action"
                      disabled={submittingId !== null}
                      onClick={() => void handleSubmitForReview(listing)}
                    >
                      {submittingId === listing.id ? (
                        <Clock3 size={15} />
                      ) : (
                        <CheckCircle2 size={15} />
                      )}

                      {submittingId === listing.id
                        ? "Submitting..."
                        : "Submit for approval"}
                    </button>
                  )}

                  {listing.status === "Pending" && (
                    <span className="listing-action secondary listing-awaiting">
                      <Clock3 size={15} />
                      Awaiting approval
                    </span>
                  )}

                  {listing.status === "Published" && (
                    <span className="listing-action secondary listing-published">
                      <CheckCircle2 size={15} />
                      Published
                    </span>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="listings-empty">
          <div className="empty-icon">
            <Building2 size={29} />
          </div>

          <h3>No properties found</h3>

          <p>
            {listings.length === 0
              ? "You have not added any PGs yet."
              : "Try a different search or status filter, or add a new PG property."}
          </p>

          <button
            type="button"
            className="secondary-button"
            onClick={() => {
              setSearch("");
              setFilter("All");
            }}
          >
            Clear filters
          </button>

          <Link to="/listings/new" className="primary-button">
            <Plus size={17} />
            Add New PG
          </Link>
        </div>
      )}

      {activeGalleryListing && activeGalleryListing.photos.length > 0 && (
        <div
          className="pg-gallery-overlay"
          role="presentation"
          onClick={closeGallery}
        >
          <section
            className="pg-gallery-modal"
            role="dialog"
            aria-modal="true"
            aria-label={`${activeGalleryListing.name} photo gallery`}
            onClick={(event) => event.stopPropagation()}
          >
            <header className="pg-gallery-header">
              <div>
                <h2>{activeGalleryListing.name}</h2>
                <p>
                  Photo {galleryIndex + 1} of {activeGalleryListing.photos.length}
                </p>
              </div>
              <button
                type="button"
                className="pg-gallery-close"
                onClick={closeGallery}
                aria-label="Close photo gallery"
              >
                <X size={22} />
              </button>
            </header>

            <div className="pg-gallery-main">
              <img
                src={activeGalleryListing.photos[galleryIndex]?.url}
                alt={`${activeGalleryListing.name} photo ${galleryIndex + 1}`}
              />

              {activeGalleryListing.photos.length > 1 && (
                <>
                  <button
                    type="button"
                    className="pg-gallery-nav previous"
                    onClick={showPreviousPhoto}
                    aria-label="Previous photo"
                  >
                    <ChevronLeft size={25} />
                  </button>
                  <button
                    type="button"
                    className="pg-gallery-nav next"
                    onClick={showNextPhoto}
                    aria-label="Next photo"
                  >
                    <ChevronRight size={25} />
                  </button>
                </>
              )}
            </div>

            {activeGalleryListing.photos.length > 1 && (
              <div className="pg-gallery-thumbnails">
                {activeGalleryListing.photos.map((photo, index) => (
                  <button
                    type="button"
                    key={photo.id}
                    className={
                      galleryIndex === index
                        ? "pg-gallery-thumbnail active"
                        : "pg-gallery-thumbnail"
                    }
                    onClick={() => setGalleryIndex(index)}
                    aria-label={`Show photo ${index + 1}`}
                  >
                    <img src={photo.url} alt="" />
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Plus, Search, MapPin, BedDouble, IndianRupee, MoreHorizontal, Pencil,
  Eye, Building2, SlidersHorizontal, CheckCircle2, Clock3, XCircle, X, Trash2,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { api } from "../../services/api";

type Listing = {
  id: string; name: string; locality: string; rent: number;
  totalBeds: number; availableBeds: number; category: string;
  status: "Published" | "Pending" | "Draft";
};
type ApiBed = { id: string; status: string };
type ApiRoom = { id: string; capacity?: number; beds?: ApiBed[] };
type ApiListing = {
  id: string; name: string; locality?: string; city?: string; address?: string;
  category?: string; monthlyRent?: number | string | null; status?: string;
  rooms?: ApiRoom[];
};
const filters = ["All", "Published", "Pending", "Draft"] as const;

function mapListing(item: ApiListing): Listing {
  const rooms = item.rooms ?? [];
  const totalBeds = rooms.reduce(
    (sum, room) => sum + (room.beds !== undefined ? room.beds.length : Number(room.capacity ?? 0)),
    0
  );
  const availableBeds = rooms.reduce(
    (sum, room) => sum + (room.beds ?? []).filter(
      bed => String(bed.status).toUpperCase() === "AVAILABLE"
    ).length,
    0
  );
  const rawStatus = String(item.status ?? "DRAFT").toUpperCase();
  const status: Listing["status"] =
    rawStatus === "PUBLISHED" ? "Published" : rawStatus === "PENDING" ? "Pending" : "Draft";
  const categoryLabels: Record<string, string> = {
    MEN: "Men", WOMEN: "Women", CO_LIVING: "Co-living", COLIVING: "Co-living",
  };
  return {
    id: item.id,
    name: item.name,
    locality: [item.locality, item.city].filter(Boolean).join(", ") || item.address || "Location not provided",
    rent: Number(item.monthlyRent ?? 0),
    totalBeds,
    availableBeds,
    category: categoryLabels[String(item.category ?? "").toUpperCase()] ?? item.category ?? "PG",
    status,
  };
}

export default function Listings() {
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchListings = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get("/listings");
      const records: ApiListing[] = Array.isArray(response.data)
        ? response.data
        : response.data?.listings ?? response.data?.data?.listings ?? response.data?.data ?? [];
      if (!Array.isArray(records)) throw new Error("Unexpected response received from listings API.");
      setListings(records.map(mapListing));
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message ??
          (err.response?.status === 401 ? "Please log in to view your PG listings." :
            "Unable to load PG listings. Check that your backend is running."));
      } else if (err instanceof Error) setError(err.message);
      else setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchListings(); }, [fetchListings]);

  const visibleListings = useMemo(() => {
    const query = search.trim().toLowerCase();
    return listings.filter(listing =>
      (listing.name.toLowerCase().includes(query) || listing.locality.toLowerCase().includes(query)) &&
      (filter === "All" || listing.status === filter)
    );
  }, [listings, search, filter]);

  const published = listings.filter(item => item.status === "Published").length;
  const availableBeds = listings.reduce((sum, item) => sum + item.availableBeds, 0);

  async function handleDelete(listing: Listing) {
    if (!window.confirm(
      `Delete "${listing.name}"? This may also remove related rooms and beds. This action cannot be undone.`
    )) return;
    try {
      setDeletingId(listing.id);
      setError("");
      await api.delete(`/listings/${listing.id}`);
      setListings(current => current.filter(item => item.id !== listing.id));
      setOpenMenuId(null);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message ?? "Unable to delete this PG. Check whether related records prevent deletion.");
      } else setError("An unexpected error occurred while deleting the PG.");
    } finally {
      setDeletingId(null);
    }
  }

  function statusIcon(status: Listing["status"]) {
    if (status === "Published") return <CheckCircle2 size={14} />;
    if (status === "Pending") return <Clock3 size={14} />;
    return <XCircle size={14} />;
  }

  return (
    <div className="listings-page">
      <div className="listings-heading">
        <div>
          <p className="eyebrow">PROPERTY MANAGEMENT</p>
          <h1>My PGs</h1>
          <p className="dashboard-subtitle">Manage your properties, rent and available beds.</p>
        </div>
        <Link to="/listings/new" className="primary-button"><Plus size={19} /> Add New PG</Link>
      </div>

      <div className="listing-summary">
        <article className="listing-summary-card"><div className="summary-icon purple"><Building2 size={21} /></div><div><span>Total Properties</span><strong>{listings.length}</strong></div></article>
        <article className="listing-summary-card"><div className="summary-icon green"><CheckCircle2 size={21} /></div><div><span>Published</span><strong>{published}</strong></div></article>
        <article className="listing-summary-card"><div className="summary-icon orange"><BedDouble size={21} /></div><div><span>Available Beds</span><strong>{availableBeds}</strong></div></article>
      </div>

      <section className="listing-toolbar">
        <div className="listing-search">
          <Search size={19} />
          <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search by PG name or locality..." aria-label="Search PG listings" />
          {search && <button type="button" onClick={() => setSearch("")} aria-label="Clear search"><X size={16} /></button>}
        </div>
        <div className="listing-filter-label"><SlidersHorizontal size={17} /><span>Status:</span></div>
        <div className="listing-filters">
          {filters.map(item => <button key={item} type="button" className={filter === item ? "filter-chip active" : "filter-chip"} onClick={() => setFilter(item)}>{item}</button>)}
        </div>
      </section>

      {error && <div className="listing-error" role="alert"><span>{error}</span><button type="button" onClick={() => setError("")} aria-label="Dismiss error"><X size={16} /></button></div>}
      <div className="listings-results-heading"><h2>Your properties</h2><span>{visibleListings.length} results</span></div>

      {loading ? <div className="listings-empty"><p>Loading your PG listings...</p></div> :
        visibleListings.length > 0 ? (
          <div className="pg-listing-grid">
            {visibleListings.map(listing => (
              <article className="pg-listing-card" key={listing.id}>
                <div className="pg-card-cover">
                  <div className="pg-cover-icon"><Building2 size={34} /></div>
                  <span className={`listing-status ${listing.status.toLowerCase()}`}>{statusIcon(listing.status)}{listing.status}</span>
                </div>
                <div className="pg-card-body">
                  <div className="pg-card-title-row">
                    <div><h3>{listing.name}</h3><p className="pg-locality"><MapPin size={14} />{listing.locality}</p></div>
                    <div className="pg-card-menu">
                      <button type="button" className="icon-button" title="Property actions" aria-label={`Actions for ${listing.name}`} aria-expanded={openMenuId === listing.id} onClick={() => setOpenMenuId(current => current === listing.id ? null : listing.id)}><MoreHorizontal size={21} /></button>
                      {openMenuId === listing.id && <div className="pg-card-menu-dropdown">
                        <button type="button" onClick={() => { setOpenMenuId(null); navigate(`/listings/${listing.id}/edit`); }}><Pencil size={15} />Edit PG</button>
                        <button type="button" onClick={() => { setOpenMenuId(null); navigate(`/listings/${listing.id}`); }}><Eye size={15} />View Details</button>
                        <button type="button" className="delete-action" disabled={deletingId === listing.id} onClick={() => void handleDelete(listing)}><Trash2 size={15} />{deletingId === listing.id ? "Deleting..." : "Delete PG"}</button>
                      </div>}
                    </div>
                  </div>
                  <div className="pg-card-meta"><span className="pg-category">{listing.category}</span><span className="pg-rent"><IndianRupee size={16} />{listing.rent.toLocaleString("en-IN")}<small>/person/month</small></span></div>
                  <div className="bed-availability">
                    <div className="bed-availability-heading"><span><BedDouble size={16} /> Bed availability</span><strong>{listing.availableBeds}/{listing.totalBeds} available</strong></div>
                    <div className="availability-track"><div className="availability-fill" style={{ width: `${listing.totalBeds > 0 ? Math.min(100, listing.availableBeds / listing.totalBeds * 100) : 0}%` }} /></div>
                    <p>{listing.availableBeds === 0 ? "No vacant beds" : `${listing.availableBeds} beds ready for residents`}</p>
                  </div>
                  <div className="pg-card-actions">
                    <button type="button" className="listing-action secondary" onClick={() => navigate(`/listings/${listing.id}/edit`)}><Pencil size={15} /> Edit</button>
                    <button type="button" className="listing-action primary" onClick={() => navigate(`/listings/${listing.id}`)}><Eye size={15} /> View details</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="listings-empty">
            <div className="empty-icon"><Building2 size={29} /></div>
            <h3>No properties found</h3>
            <p>{listings.length === 0 ? "You have not added any PGs yet." : "Try a different search or status filter, or add a new PG property."}</p>
            <button type="button" className="secondary-button" onClick={() => { setSearch(""); setFilter("All"); }}>Clear filters</button>
            <Link to="/listings/new" className="primary-button"><Plus size={17} /> Add New PG</Link>
          </div>
        )}
    </div>
  );
}

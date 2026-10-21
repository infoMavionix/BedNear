import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Building2, MapPin, IndianRupee, BedDouble, Pencil, Trash2, CheckCircle2, XCircle, DoorOpen } from "lucide-react";
import { api } from "../../services/api";

type Bed = { id: string; bedNumber?: string; status?: string; monthlyRent?: number | null };
type Room = { id: string; name?: string; roomType?: string; capacity?: number; monthlyRent?: number | null; beds?: Bed[] };
type ListingDetailsData = {
  id: string; name: string; category?: string; description?: string; address?: string;
  locality?: string; city?: string; state?: string; pincode?: string; genderPolicy?: string;
  monthlyRent?: number | string | null; deposit?: number | string | null; status?: string;
  rooms?: Room[]; createdAt?: string; updatedAt?: string;
};
const money = (value: number | string | null | undefined) => Number(value ?? 0).toLocaleString("en-IN");
const label = (value?: string | null) => value ? value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase()) : "Not provided";

export default function ListingDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [listing, setListing] = useState<ListingDetailsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!id) { setError("Missing PG listing ID."); setLoading(false); return; }
      try {
        setLoading(true);
        setError("");
        const response = await api.get(`/listings/${id}`);
        const record = response.data?.listing ?? response.data?.data?.listing ?? response.data?.data;
        if (!record?.id) throw new Error("The API did not return the PG details.");
        if (!cancelled) setListing(record as ListingDetailsData);
      } catch (err: unknown) {
        if (!cancelled) {
          if (axios.isAxiosError(err)) {
            setError(err.response?.status === 401 ? "Your session has expired. Please log in again." :
              err.response?.status === 404 ? "PG listing not found, or you do not have permission to view it." :
              err.response?.data?.message ?? "Unable to load PG details. Check that the backend is running.");
          } else setError(err instanceof Error ? err.message : "Unable to load PG details.");
        }
      } finally { if (!cancelled) setLoading(false); }
    }
    void load();
    return () => { cancelled = true; };
  }, [id]);

  async function handleDelete() {
    if (!listing || !window.confirm(`Delete "${listing.name}"? This action cannot be undone.`)) return;
    try {
      setDeleting(true);
      await api.delete(`/listings/${listing.id}`);
      navigate("/listings", { replace: true });
    } catch (err: unknown) {
      setError(axios.isAxiosError(err) ? err.response?.data?.message ?? "Unable to delete this PG." : "Unable to delete this PG.");
    } finally { setDeleting(false); }
  }

  if (loading) return <div className="listing-page"><p>Loading PG details...</p></div>;
  if (error && !listing) return <div className="listing-page"><Link to="/listings" className="back-link"><ArrowLeft size={17} /> Back to My PGs</Link><div className="listings-empty"><Building2 size={30} /><h2>Unable to open PG</h2><p>{error}</p><button type="button" className="secondary-button" onClick={() => navigate("/listings")}>Back to My PGs</button></div></div>;
  if (!listing) return null;

  const rooms = listing.rooms ?? [];
  const beds = rooms.flatMap(room => room.beds ?? []);
  const totalBeds = beds.length || rooms.reduce((sum, room) => sum + Number(room.capacity ?? 0), 0);
  const availableBeds = beds.filter(bed => String(bed.status ?? "").toUpperCase() === "AVAILABLE").length;
  const status = String(listing.status ?? "DRAFT").toUpperCase();

  return (
    <div className="listing-page listing-details-page">
      <Link to="/listings" className="back-link"><ArrowLeft size={17} /> Back to My PGs</Link>
      <div className="listing-heading">
        <div><p className="eyebrow">PROPERTY MANAGEMENT</p><h1>{listing.name}</h1><p className="dashboard-subtitle"><MapPin size={15} /> {[listing.locality, listing.city, listing.state].filter(Boolean).join(", ") || listing.address || "Location not provided"}</p></div>
        <div className="form-actions">
          <button type="button" className="secondary-button" onClick={() => navigate(`/listings/${listing.id}/edit`)}><Pencil size={16} /> Edit PG</button>
          <button type="button" className="secondary-button delete-detail-button" disabled={deleting} onClick={() => void handleDelete()}><Trash2 size={16} /> {deleting ? "Deleting..." : "Delete PG"}</button>
        </div>
      </div>

      {error && <div className="listing-error" role="alert">{error}</div>}
      <section className="listing-summary">
        <article className="listing-summary-card"><div className="summary-icon purple"><Building2 size={21} /></div><div><span>Status</span><strong>{label(status)}</strong></div></article>
        <article className="listing-summary-card"><div className="summary-icon orange"><BedDouble size={21} /></div><div><span>Total Beds</span><strong>{totalBeds}</strong></div></article>
        <article className="listing-summary-card"><div className="summary-icon green"><CheckCircle2 size={21} /></div><div><span>Available Beds</span><strong>{availableBeds}</strong></div></article>
      </section>

      <section className="form-section">
        <div className="form-section-heading"><div className="form-section-icon"><Building2 size={20} /></div><div><h2>Basic Information</h2><p>Property details saved for this PG.</p></div></div>
        <div className="details-grid">
          <div><span>PG name</span><strong>{listing.name}</strong></div>
          <div><span>Category</span><strong>{label(listing.category ?? listing.genderPolicy)}</strong></div>
          <div><span>Monthly rent</span><strong className="details-rent"><IndianRupee size={16} />{money(listing.monthlyRent)} per person/month</strong></div>
          <div><span>Security deposit</span><strong>₹{money(listing.deposit)}</strong></div>
          <div className="details-full"><span>Complete address</span><strong>{listing.address || "Not provided"}</strong></div>
          <div className="details-full"><span>Description</span><p>{listing.description || "No description added."}</p></div>
        </div>
      </section>

      <section className="form-section">
        <div className="form-section-heading"><div className="form-section-icon"><DoorOpen size={20} /></div><div><h2>Rooms and Beds</h2><p>Room details and current vacancy status.</p></div></div>
        {rooms.length === 0 ? <p>No rooms have been added to this PG yet.</p> : <div className="details-room-list">
          {rooms.map(room => {
            const roomBeds = room.beds ?? [];
            const roomAvailable = roomBeds.filter(bed => String(bed.status ?? "").toUpperCase() === "AVAILABLE").length;
            return <article className="details-room-card" key={room.id}>
              <div className="details-room-heading"><div><h3>{room.name || "Room"}</h3><p>{label(room.roomType)}</p></div><span>{roomAvailable}/{roomBeds.length || Number(room.capacity ?? 0)} available</span></div>
              {roomBeds.length ? <div className="details-beds-grid">{roomBeds.map((bed, index) => {
                const isAvailable = String(bed.status ?? "").toUpperCase() === "AVAILABLE";
                return <div className={`details-bed ${isAvailable ? "available" : "occupied"}`} key={bed.id}><BedDouble size={16} /><span>{bed.bedNumber || `Bed ${index + 1}`}</span><small>{isAvailable ? <><CheckCircle2 size={12} /> Available</> : <><XCircle size={12} /> {label(bed.status)}</>}</small></div>;
              })}</div> : <p>No individual bed records returned by the API. Room capacity: {room.capacity ?? 0}.</p>}
            </article>;
          })}
        </div>}
      </section>
      <div className="form-footer"><p>Need to change property information or vacancy? Use Edit PG.</p><div className="form-actions"><Link to="/listings" className="cancel-button">Back to My PGs</Link><button type="button" className="primary-button" onClick={() => navigate(`/listings/${listing.id}/edit`)}><Pencil size={16} /> Edit PG</button></div></div>
    </div>
  );
}

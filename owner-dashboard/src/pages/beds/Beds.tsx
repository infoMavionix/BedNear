import { useEffect, useMemo, useState } from "react";
import {
  BedDouble, Search, CheckCircle2, Users, Clock3,
  RefreshCw, MapPin, Building2, X
} from "lucide-react";
import { api } from "../../services/api";

type ApiStatus = "AVAILABLE" | "OCCUPIED" | "RESERVED" | "MAINTENANCE";
type UiStatus = "Available" | "Occupied" | "Reserved" | "Maintenance";
type ApiBed = {
  id: string; bedNumber: string; status: ApiStatus; monthlyRent: number | null;
  roomId: string; room: { id: string; name: string; monthlyRent: number | null; listing: { id: string; name: string; locality?: string } };
};
type BedRecord = {
  id: string; bedName: string; room: string; property: string; locality: string;
  rent: number; status: UiStatus; apiStatus: ApiStatus;
};
const apiToUi: Record<ApiStatus, UiStatus> = {
  AVAILABLE: "Available", OCCUPIED: "Occupied", RESERVED: "Reserved", MAINTENANCE: "Maintenance",
};
const uiToApi: Record<UiStatus, ApiStatus> = {
  Available: "AVAILABLE", Occupied: "OCCUPIED", Reserved: "RESERVED", Maintenance: "MAINTENANCE",
};
function getErrorMessage(error: any, fallback: string) {
  return error?.response?.data?.message || error?.message || fallback;
}
function statusClass(status: UiStatus) { return status.toLowerCase(); }

export default function Beds() {
  const [beds, setBeds] = useState<BedRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [propertyFilter, setPropertyFilter] = useState("All Properties");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [notice, setNotice] = useState("");
  const [editingBed, setEditingBed] = useState<BedRecord | null>(null);
  const [nextStatus, setNextStatus] = useState<UiStatus>("Available");

  async function loadBeds() {
    setLoading(true); setError("");
    try {
      const response = await api.get("/beds");
      const rows: ApiBed[] = response.data.beds ?? [];
     setBeds(
  rows
    .sort((a, b) => {
      const numberA = Number(a.bedNumber.match(/\d+/)?.[0] ?? 0);
      const numberB = Number(b.bedNumber.match(/\d+/)?.[0] ?? 0);
      return numberA - numberB;
    })
    .map((bed) => ({
  id: bed.id,
  bedName: `${bed.room?.name ?? "Room"} - ${bed.bedNumber}`,
  room: bed.room?.name ?? "Unknown room",
  property: bed.room?.listing?.name ?? "Unknown PG",
  locality: bed.room?.listing?.locality ?? "",
  rent: bed.monthlyRent ?? bed.room?.monthlyRent ?? 0,
  status: apiToUi[bed.status],
  apiStatus: bed.status,
}))
);
}catch (err) {
      setError(getErrorMessage(err, "Could not load bed availability. Please sign in again or check the backend."));
    } finally { setLoading(false); }
  }
  useEffect(() => { void loadBeds(); }, []);

  const availableCount = beds.filter((bed) => bed.status === "Available").length;
  const occupiedCount = beds.filter((bed) => bed.status === "Occupied").length;
  const maintenanceCount = beds.filter((bed) => bed.status === "Maintenance").length;
  const filteredBeds = useMemo(() => {
    const query = search.trim().toLowerCase();
    return beds.filter((bed) => {
      const matchesSearch = [bed.bedName, bed.room, bed.property, bed.locality].some((value) => value.toLowerCase().includes(query));
      return matchesSearch &&
        (propertyFilter === "All Properties" || bed.property === propertyFilter) &&
        (statusFilter === "All Statuses" || bed.status === statusFilter);
    });
  }, [beds, search, propertyFilter, statusFilter]);
  const propertyOptions = ["All Properties", ...Array.from(new Set(beds.map((bed) => bed.property))).sort()];
  const statusOptions = ["All Statuses", "Available", "Occupied", "Reserved", "Maintenance"];

  function openStatusEditor(bed: BedRecord) { setEditingBed(bed); setNextStatus(bed.status); setNotice(""); setError(""); }
  async function saveStatus() {
    if (!editingBed) return;
    setSaving(true); setError(""); setNotice("");
    try {
      await api.patch(`/beds/${editingBed.id}`, { status: uiToApi[nextStatus] });
      setNotice(`${editingBed.property} · ${editingBed.room} · ${editingBed.bedName} updated to ${nextStatus}.`);
      setEditingBed(null);
      await loadBeds();
    } catch (err) {
      setError(getErrorMessage(err, "Unable to update bed status."));
    } finally { setSaving(false); }
  }
  function clearFilters() { setSearch(""); setPropertyFilter("All Properties"); setStatusFilter("All Statuses"); }

  return <div className="bed-page">
    <div className="bed-page-heading"><div><p className="eyebrow">PROPERTY MANAGEMENT</p><h1>Bed Availability</h1><p className="dashboard-subtitle">Track vacant beds and keep availability up to date across your PG properties.</p></div>
      <button className="secondary-button" type="button" onClick={() => { clearFilters(); void loadBeds(); }}><RefreshCw size={16} /> Reset filters</button></div>
    {(notice || error) && <div className="bed-notice"><CheckCircle2 size={18} /><span>{error || notice}</span><button type="button" onClick={() => { setNotice(""); setError(""); }} aria-label="Dismiss"><X size={17} /></button></div>}
    <div className="bed-stats-grid">
      <article className="bed-stat-card"><div className="bed-stat-icon purple"><BedDouble size={22} /></div><div><span>Total Beds</span><strong>{beds.length}</strong><small>Across your properties</small></div></article>
      <article className="bed-stat-card"><div className="bed-stat-icon green"><CheckCircle2 size={22} /></div><div><span>Available</span><strong>{availableCount}</strong><small>Ready for new residents</small></div></article>
      <article className="bed-stat-card"><div className="bed-stat-icon blue"><Users size={22} /></div><div><span>Occupied</span><strong>{occupiedCount}</strong><small>Currently occupied</small></div></article>
      <article className="bed-stat-card"><div className="bed-stat-icon orange"><Clock3 size={22} /></div><div><span>Maintenance</span><strong>{maintenanceCount}</strong><small>Unavailable for now</small></div></article>
    </div>
    <section className="bed-filter-panel"><div className="bed-search"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search bed, room, PG or locality..." aria-label="Search beds" />{search && <button type="button" onClick={() => setSearch("")} aria-label="Clear search"><X size={16} /></button>}</div>
      <select aria-label="Filter by PG property" value={propertyFilter} onChange={(event) => setPropertyFilter(event.target.value)}>{propertyOptions.map((option) => <option key={option} value={option}>{option}</option>)}</select>
      <select aria-label="Filter by bed status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>{statusOptions.map((option) => <option key={option} value={option}>{option}</option>)}</select>
    </section>
    <div className="bed-results-heading"><div><h2>Individual beds</h2><p>Review availability by property and room.</p></div><span>{filteredBeds.length} beds</span></div>
    {loading ? <div className="listings-empty">Loading beds...</div> : filteredBeds.length ? <section className="bed-table-wrap"><table className="bed-table"><thead><tr><th>Bed</th><th>PG Property</th><th>Room</th><th>Monthly Rent</th><th>Status</th><th>Update</th></tr></thead>
      <tbody>{filteredBeds.map((bed) => <tr key={bed.id}><td><div className="bed-name-cell"><div className="bed-row-icon"><BedDouble size={18} /></div><div><strong>{bed.bedName}</strong><small>Bed ID: {bed.id}</small></div></div></td>
        <td><div className="bed-property-cell"><Building2 size={15} /><span>{bed.property}</span></div><small className="bed-locality"><MapPin size={12} />{bed.locality ? `${bed.locality}, Bengaluru` : "Bengaluru"}</small></td>
        <td><span className="bed-room-label">{bed.room}</span></td><td><strong className="bed-rent">₹{bed.rent.toLocaleString("en-IN")}</strong><small className="bed-rent-note">per month</small></td>
        <td><span className={`bed-status ${statusClass(bed.status)}`}>{bed.status === "Available" && <CheckCircle2 size={14} />}{bed.status === "Occupied" && <Users size={14} />}{(bed.status === "Maintenance" || bed.status === "Reserved") && <Clock3 size={14} />}{bed.status}</span></td>
        <td><button type="button" className="bed-update-button" onClick={() => openStatusEditor(bed)}>Update status</button></td></tr>)}</tbody></table></section> : <div className="listings-empty"><div className="empty-icon"><BedDouble size={28} /></div><h3>No beds found</h3><p>{error || "No bed records match these filters."}</p><button type="button" className="secondary-button" onClick={clearFilters}>Clear filters</button></div>}
    {editingBed && <div className="bed-modal-backdrop" onClick={() => !saving && setEditingBed(null)}><section className="bed-status-modal" role="dialog" aria-modal="true" aria-labelledby="bed-modal-title" onClick={(event) => event.stopPropagation()}>
      <div className="bed-modal-heading"><div><p className="eyebrow">UPDATE AVAILABILITY</p><h2 id="bed-modal-title">{editingBed.room} · {editingBed.bedName}</h2><p>{editingBed.property}</p></div><button type="button" className="room-close-button" onClick={() => setEditingBed(null)} aria-label="Close"><X size={19} /></button></div>
      <label className="room-field">Bed status<select value={nextStatus} onChange={(event) => setNextStatus(event.target.value as UiStatus)}><option value="Available">Available</option><option value="Occupied">Occupied</option><option value="Reserved">Reserved</option><option value="Maintenance">Maintenance</option></select></label>
      <p className="bed-modal-help">This status is saved to the database and affects the availability counts.</p>
      <div className="room-form-actions"><button type="button" className="cancel-button" onClick={() => setEditingBed(null)}>Cancel</button><button type="button" className="primary-button" onClick={() => void saveStatus()} disabled={saving}>{saving ? "Saving..." : "Save status"}</button></div>
    </section></div>}
  </div>;
}

import { useEffect, useMemo, useState } from "react";
import {
  BedDouble, Search, CheckCircle2, Users, Clock3, RefreshCw,
  MapPin, Building2, X, ChevronDown, ChevronUp
} from "lucide-react";
import { api } from "../../services/api";

type ApiStatus = "AVAILABLE" | "OCCUPIED" | "RESERVED" | "MAINTENANCE";
type UiStatus = "Available" | "Occupied" | "Reserved" | "Maintenance";
type ApiBed = {
  id: string; bedNumber: string; status: ApiStatus; monthlyRent: number | null;
  roomId: string;
  room: {
    id: string; name: string; roomType?: string; monthlyRent: number | null;
    listing: { id: string; name: string; locality?: string; city?: string }
  };
};
type BedRecord = {
  id: string; bedNumber: string; roomId: string; room: string;
  roomType: string; propertyId: string; property: string; locality: string;
  rent: number; status: UiStatus; apiStatus: ApiStatus;
};
type RoomGroup = {
  roomId: string; room: string; roomType: string; propertyId: string;
  property: string; locality: string; beds: BedRecord[];
};
type PropertyGroup = {
  propertyId: string; property: string; locality: string; rooms: RoomGroup[];
  total: number; available: number; occupied: number; reserved: number; maintenance: number;
};
const apiToUi: Record<ApiStatus, UiStatus> = {
  AVAILABLE: "Available", OCCUPIED: "Occupied", RESERVED: "Reserved", MAINTENANCE: "Maintenance"
};
const uiToApi: Record<UiStatus, ApiStatus> = {
  Available: "AVAILABLE", Occupied: "OCCUPIED", Reserved: "RESERVED", Maintenance: "MAINTENANCE"
};
function getErrorMessage(error: any, fallback: string) {
  return error?.response?.data?.message || error?.message || fallback;
}
function statusClass(status: UiStatus) { return status.toLowerCase(); }
function numberFromBedName(value: string) {
  return Number(value.match(/\d+/)?.[0] ?? 0);
}

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
  const [expandedProperties, setExpandedProperties] = useState<string[]>([]);

  async function loadBeds() {
    setLoading(true); setError("");
    try {
      const response = await api.get("/beds");
      const rows: ApiBed[] = response.data.beds ?? [];
      const mapped = rows.map(bed => ({
        id: bed.id, bedNumber: bed.bedNumber,
        roomId: bed.room?.id ?? bed.roomId,
        room: bed.room?.name ?? "Unknown room",
        roomType: bed.room?.roomType ?? "Shared",
        propertyId: bed.room?.listing?.id ?? "",
        property: bed.room?.listing?.name ?? "Unknown PG",
        locality: bed.room?.listing?.locality ?? "",
        rent: bed.monthlyRent ?? bed.room?.monthlyRent ?? 0,
        status: apiToUi[bed.status], apiStatus: bed.status
      }));
      setBeds(mapped);
      setExpandedProperties(current => current.length ? current : Array.from(new Set(mapped.map(b => b.propertyId))));
    } catch (err) {
      setError(getErrorMessage(err, "Could not load bed availability. Please sign in again or check the backend."));
    } finally { setLoading(false); }
  }
  useEffect(() => { void loadBeds(); }, []);

  const availableCount = beds.filter(b => b.status === "Available").length;
  const occupiedCount = beds.filter(b => b.status === "Occupied").length;
  const reservedCount = beds.filter(b => b.status === "Reserved").length;
  const maintenanceCount = beds.filter(b => b.status === "Maintenance").length;

  const filteredBeds = useMemo(() => {
    const query = search.trim().toLowerCase();
    return beds.filter(bed =>
      (!query || [bed.bedNumber, bed.room, bed.property, bed.locality].some(v => v.toLowerCase().includes(query))) &&
      (propertyFilter === "All Properties" || bed.propertyId === propertyFilter) &&
      (statusFilter === "All Statuses" || bed.status === statusFilter)
    );
  }, [beds, search, propertyFilter, statusFilter]);

  const propertyGroups: PropertyGroup[] = useMemo(() => {
    const propertyMap = new Map<string, PropertyGroup>();
    filteredBeds.forEach(bed => {
      if (!propertyMap.has(bed.propertyId)) {
        propertyMap.set(bed.propertyId, {
          propertyId: bed.propertyId, property: bed.property, locality: bed.locality,
          rooms: [], total: 0, available: 0, occupied: 0, reserved: 0, maintenance: 0
        });
      }
      const property = propertyMap.get(bed.propertyId)!;
      let room = property.rooms.find(item => item.roomId === bed.roomId);
      if (!room) {
        room = {roomId:bed.roomId,room:bed.room,roomType:bed.roomType,propertyId:bed.propertyId,property:bed.property,locality:bed.locality,beds:[]};
        property.rooms.push(room);
      }
      room.beds.push(bed);
      property.total++;
      if (bed.status === "Available") property.available++;
      if (bed.status === "Occupied") property.occupied++;
      if (bed.status === "Reserved") property.reserved++;
      if (bed.status === "Maintenance") property.maintenance++;
    });
    propertyMap.forEach(property => property.rooms.forEach(room => room.beds.sort((a,b) => numberFromBedName(a.bedNumber)-numberFromBedName(b.bedNumber))));
    return Array.from(propertyMap.values()).sort((a,b)=>a.property.localeCompare(b.property));
  }, [filteredBeds]);

  function openStatusEditor(bed: BedRecord) {
    setEditingBed(bed); setNextStatus(bed.status); setNotice(""); setError("");
  }
  async function saveStatus() {
    if (!editingBed) return;
    setSaving(true); setError(""); setNotice("");
    try {
      await api.patch(`/beds/${editingBed.id}`, {status:uiToApi[nextStatus]});
      setNotice(`${editingBed.property} · ${editingBed.room} · ${editingBed.bedNumber} updated to ${nextStatus}.`);
      setEditingBed(null);
      await loadBeds();
    } catch (err) {
      setError(getErrorMessage(err, "Unable to update bed status."));
    } finally { setSaving(false); }
  }
  function clearFilters() { setSearch(""); setPropertyFilter("All Properties"); setStatusFilter("All Statuses"); }
  function toggleProperty(id:string) {
    setExpandedProperties(current=>current.includes(id)?current.filter(v=>v!==id):[...current,id]);
  }

  return <div className="bed-page bed-grouped-page">
    <div className="bed-page-heading"><div><p className="eyebrow">PROPERTY MANAGEMENT</p><h1>Bed Availability</h1><p className="dashboard-subtitle">Beds are grouped by PG and room, so repeated room and bed numbers are easy to distinguish.</p></div>
      <button className="secondary-button" type="button" onClick={()=>{clearFilters();void loadBeds();}}><RefreshCw size={16}/> Reset filters</button></div>
    {(notice || error) && <div className="bed-notice"><CheckCircle2 size={18}/><span>{error || notice}</span><button type="button" onClick={()=>{setNotice("");setError("");}} aria-label="Dismiss"><X size={17}/></button></div>}
    <div className="bed-stats-grid">
      <article className="bed-stat-card"><div className="bed-stat-icon purple"><BedDouble size={22}/></div><div><span>Total Beds</span><strong>{beds.length}</strong><small>Across your properties</small></div></article>
      <article className="bed-stat-card"><div className="bed-stat-icon green"><CheckCircle2 size={22}/></div><div><span>Available</span><strong>{availableCount}</strong><small>Ready for new residents</small></div></article>
      <article className="bed-stat-card"><div className="bed-stat-icon blue"><Users size={22}/></div><div><span>Occupied</span><strong>{occupiedCount}</strong><small>Currently occupied</small></div></article>
      <article className="bed-stat-card"><div className="bed-stat-icon orange"><Clock3 size={22}/></div><div><span>Reserved / Maintenance</span><strong>{reservedCount + maintenanceCount}</strong><small>{reservedCount} reserved · {maintenanceCount} maintenance</small></div></article>
    </div>
    <section className="bed-filter-panel">
      <div className="bed-search"><Search size={18}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search PG, room or bed number..." aria-label="Search beds"/>{search && <button type="button" onClick={()=>setSearch("")} aria-label="Clear search"><X size={16}/></button>}</div>
      <select aria-label="Filter by PG property" value={propertyFilter} onChange={e=>setPropertyFilter(e.target.value)}><option value="All Properties">All Properties</option>{Array.from(new Map(beds.map(b=>[b.propertyId,{id:b.propertyId,name:b.property}])).values()).map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select>
      <select aria-label="Filter by bed status" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}><option>All Statuses</option><option>Available</option><option>Occupied</option><option>Reserved</option><option>Maintenance</option></select>
    </section>
    <div className="bed-results-heading"><div><h2>Beds by PG and room</h2><p>Each bed is shown inside its own room and property.</p></div><span>{filteredBeds.length} beds · {propertyGroups.length} properties</span></div>
    {loading ? <div className="listings-empty">Loading beds...</div> : propertyGroups.length ? <div className="bed-property-groups">
      {propertyGroups.map(property=><section className="bed-property-group" key={property.propertyId}>
        <button type="button" className="bed-property-header" onClick={()=>toggleProperty(property.propertyId)}>
          <span className="bed-property-heading-main"><span className="bed-property-icon"><Building2 size={20}/></span><span><strong>{property.property}</strong><small><MapPin size={12}/> {property.locality || "Bengaluru"} · {property.rooms.length} rooms</small></span></span>
          <span className="bed-property-heading-stats"><strong>{property.total} beds</strong><span>{property.available} available · {property.occupied} occupied</span>{expandedProperties.includes(property.propertyId)?<ChevronUp size={18}/>:<ChevronDown size={18}/>}</span>
        </button>
        {expandedProperties.includes(property.propertyId) && <div className="bed-property-content">
          {property.rooms.map(room=><section className="bed-room-group" key={room.roomId}>
            <div className="bed-room-heading"><div><strong>{room.room}</strong><small>{room.roomType.replace(/_/g," ")} · {room.beds.length} {room.beds.length===1?"bed":"beds"}</small></div><span>{room.beds.filter(b=>b.status==="Available").length} available</span></div>
            <div className="bed-card-grid">
              {room.beds.map(bed=><article className={`bed-individual-card ${statusClass(bed.status)}`} key={bed.id}>
                <div className="bed-individual-top"><span className="bed-individual-icon"><BedDouble size={20}/></span><span className={`bed-status ${statusClass(bed.status)}`}>{bed.status}</span></div>
                <strong className="bed-individual-name">{bed.bedNumber}</strong>
                <span className="bed-individual-rent">₹{bed.rent.toLocaleString("en-IN")} <small>/ month</small></span>
                <button type="button" className="bed-update-button" onClick={()=>openStatusEditor(bed)}>Update status</button>
              </article>)}
            </div>
          </section>)}
        </div>}
      </section>)}
    </div> : <div className="listings-empty"><div className="empty-icon"><BedDouble size={28}/></div><h3>No beds found</h3><p>{error || "No bed records match these filters."}</p><button type="button" className="secondary-button" onClick={clearFilters}>Clear filters</button></div>}
    {editingBed && <div className="bed-modal-backdrop" onClick={()=>!saving&&setEditingBed(null)}><section className="bed-status-modal" role="dialog" aria-modal="true" aria-labelledby="bed-modal-title" onClick={e=>e.stopPropagation()}>
      <div className="bed-modal-heading"><div><p className="eyebrow">UPDATE AVAILABILITY</p><h2 id="bed-modal-title">{editingBed.property} · {editingBed.room} · {editingBed.bedNumber}</h2><p>{editingBed.locality}</p></div><button type="button" className="room-close-button" onClick={()=>setEditingBed(null)} aria-label="Close"><X size={19}/></button></div>
      <label className="room-field">Bed status<select value={nextStatus} onChange={e=>setNextStatus(e.target.value as UiStatus)}><option value="Available">Available</option><option value="Occupied">Occupied</option><option value="Reserved">Reserved</option><option value="Maintenance">Maintenance</option></select></label>
      <p className="bed-modal-help">This status is saved to the database and updates the availability counts for this PG and room.</p>
      <div className="room-form-actions"><button type="button" className="cancel-button" onClick={()=>setEditingBed(null)}>Cancel</button><button type="button" className="primary-button" onClick={()=>void saveStatus()} disabled={saving}>{saving?"Saving...":"Save status"}</button></div>
    </section></div>}
  </div>;
}

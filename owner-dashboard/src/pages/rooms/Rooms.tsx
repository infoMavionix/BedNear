import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  Plus, Search, BedDouble, Building2, Users, DoorOpen,
  Pencil, X, CheckCircle2, Clock3, RefreshCw, ChevronDown, ChevronUp
} from "lucide-react";
import { api } from "../../services/api";

type ApiBed = { id: string; status: "AVAILABLE" | "OCCUPIED" | "RESERVED" | "MAINTENANCE" };
type ApiListing = { id: string; name: string; locality?: string };
type ApiRoom = {
  id: string; name: string; roomType: string; capacity: number;
  monthlyRent: number | null; listingId: string; listing: ApiListing; beds: ApiBed[];
};
type ListingOption = { id: string; name: string; locality?: string };
type RoomView = ApiRoom & {
  propertyName: string; occupied: number; available: number;
  reserved: number; maintenance: number;
};
type PropertyGroup = {
  listingId: string; propertyName: string; locality: string;
  rooms: RoomView[]; totalBeds: number; available: number;
  occupied: number; reserved: number; maintenance: number;
};

function getErrorMessage(error: any, fallback: string) {
  return error?.response?.data?.message || error?.message || fallback;
}
const roomTypeLabel = (value: string) => {
  const normalized = (value || "").toUpperCase();
  if (normalized === "SINGLE") return "Single";
  if (normalized === "SHARED") return "Shared";
  if (normalized === "DOUBLE_SHARING") return "Double Sharing";
  if (normalized === "TRIPLE_SHARING") return "Triple Sharing";
  if (normalized === "FOUR_SHARING") return "Four Sharing";
  return value ? value.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, char => char.toUpperCase()) : "Not specified";
};

export default function Rooms() {
  const [rooms, setRooms] = useState<ApiRoom[]>([]);
  const [properties, setProperties] = useState<ListingOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [propertyFilter, setPropertyFilter] = useState("All Properties");
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedProperties, setExpandedProperties] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [listingId, setListingId] = useState("");
  const [type, setType] = useState("SHARED");
  const [capacity, setCapacity] = useState("4");
  const [monthlyRent, setMonthlyRent] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const [roomResponse, listingResponse] = await Promise.all([
        api.get("/rooms"), api.get("/listings")
      ]);
      const roomData: ApiRoom[] = roomResponse.data.rooms ?? [];
      const listingData: ListingOption[] = listingResponse.data.listings ?? [];
      setRooms(roomData);
      setProperties(listingData);
      setListingId(current => current || listingData[0]?.id || "");
      setExpandedProperties(current =>
        current.length ? current : Array.from(new Set(roomData.map(room => room.listingId)))
      );
    } catch (err) {
      setError(getErrorMessage(err, "Could not load rooms. Please check the backend and sign in again."));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { void loadData(); }, []);

  const roomViews: RoomView[] = useMemo(() => rooms.map(room => ({
    ...room,
    propertyName: room.listing?.name ?? properties.find(p => p.id === room.listingId)?.name ?? "Unknown PG",
    available: room.beds.filter(b => b.status === "AVAILABLE").length,
    occupied: room.beds.filter(b => b.status === "OCCUPIED").length,
    reserved: room.beds.filter(b => b.status === "RESERVED").length,
    maintenance: room.beds.filter(b => b.status === "MAINTENANCE").length,
  })), [rooms, properties]);

  const propertyGroups: PropertyGroup[] = useMemo(() => {
    const grouped = new Map<string, PropertyGroup>();
    roomViews.forEach(room => {
      if (!grouped.has(room.listingId)) {
        grouped.set(room.listingId, {
          listingId: room.listingId, propertyName: room.propertyName,
          locality: room.listing?.locality ?? "", rooms: [],
          totalBeds: 0, available: 0, occupied: 0, reserved: 0, maintenance: 0
        });
      }
      const group = grouped.get(room.listingId)!;
      group.rooms.push(room);
      group.totalBeds += room.beds.length;
      group.available += room.available;
      group.occupied += room.occupied;
      group.reserved += room.reserved;
      group.maintenance += room.maintenance;
    });
    return Array.from(grouped.values()).sort((a,b) => a.propertyName.localeCompare(b.propertyName));
  }, [roomViews]);

  const filteredGroups = useMemo(() => {
    const q = search.trim().toLowerCase();
    return propertyGroups.map(group => ({
      ...group,
      rooms: group.rooms.filter(room =>
        (!q || [room.name, group.propertyName, group.locality, room.roomType].some(v => v.toLowerCase().includes(q))) &&
        (typeFilter === "All Types" || roomTypeLabel(room.roomType) === typeFilter)
      )
    })).filter(group =>
      group.rooms.length > 0 &&
      (propertyFilter === "All Properties" || group.listingId === propertyFilter)
    );
  }, [propertyGroups, search, typeFilter, propertyFilter]);

  const totalBeds = roomViews.reduce((sum, room) => sum + room.beds.length, 0);
  const availableBeds = roomViews.reduce((sum, room) => sum + room.available, 0);
  const occupiedBeds = roomViews.reduce((sum, room) => sum + room.occupied, 0);
  const reservedBeds = roomViews.reduce((sum, room) => sum + room.reserved, 0);

  function resetForm() {
    setName(""); setListingId(properties[0]?.id ?? ""); setType("SHARED");
    setCapacity("4"); setMonthlyRent(""); setEditingId(null); setShowForm(false);
  }
  function startEdit(room: RoomView) {
    setName(room.name); setListingId(room.listingId); setType(room.roomType.toUpperCase());
    setCapacity(String(room.capacity));
    setMonthlyRent(room.monthlyRent == null ? "" : String(room.monthlyRent));
    setEditingId(room.id); setShowForm(true); setNotice(""); setError("");
  }
  async function saveRoom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const total = Number(capacity);
    const rent = monthlyRent.trim() === "" ? null : Number(monthlyRent);
    if (!name.trim() || !listingId || !Number.isInteger(total) || total < 1 ||
        (rent !== null && (!Number.isFinite(rent) || rent < 0))) {
      setError("Enter a room name, choose a PG, and provide valid capacity and rent.");
      return;
    }
    const payload = {
      name: name.trim(), roomType: type, capacity: total, monthlyRent: rent,
      ...(editingId ? {} : { listingId })
    };
    setSaving(true); setError(""); setNotice("");
    try {
      if (editingId) {
        await api.patch(`/rooms/${editingId}`, payload);
        setNotice("Room updated successfully.");
      } else {
        await api.post("/rooms", payload);
        setNotice("Room added successfully.");
      }
      resetForm();
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err, "Unable to save the room."));
    } finally {
      setSaving(false);
    }
  }
  function toggleProperty(id: string) {
    setExpandedProperties(current =>
      current.includes(id) ? current.filter(item => item !== id) : [...current, id]
    );
  }

  return <div className="rooms-page rooms-grouped-page">
    <div className="rooms-heading">
      <div><p className="eyebrow">PROPERTY MANAGEMENT</p><h1>Rooms</h1>
        <p className="dashboard-subtitle">View rooms grouped under each PG property. Room numbers can repeat across different PGs.</p></div>
      <button className="primary-button" type="button" onClick={() => { resetForm(); setShowForm(true); setError(""); setNotice(""); }}>
        <Plus size={18} /> Add Room
      </button>
    </div>

    {(notice || error) && <div className={error ? "rooms-notice error" : "rooms-notice"}>
      {error ? <X size={18} /> : <CheckCircle2 size={18} />}<span>{error || notice}</span>
      <button type="button" onClick={() => { setError(""); setNotice(""); }} aria-label="Dismiss"><X size={17} /></button>
    </div>}

    <div className="room-stat-grid">
      <article className="room-stat-card"><div className="room-stat-icon purple"><DoorOpen size={22} /></div><div><span>Total Rooms</span><strong>{rooms.length}</strong></div></article>
      <article className="room-stat-card"><div className="room-stat-icon orange"><BedDouble size={22} /></div><div><span>Total Beds</span><strong>{totalBeds}</strong></div></article>
      <article className="room-stat-card"><div className="room-stat-icon green"><CheckCircle2 size={22} /></div><div><span>Available Beds</span><strong>{availableBeds}</strong></div></article>
      <article className="room-stat-card"><div className="room-stat-icon blue"><Users size={22} /></div><div><span>Occupied Beds</span><strong>{occupiedBeds}</strong></div></article>
    </div>

    {showForm && <section className="room-form-panel">
      <div className="room-form-heading"><div><h2>{editingId ? "Edit Room" : "Add a Room"}</h2><p>Each room belongs to one PG property and has its own bed capacity.</p></div>
        <button type="button" className="room-close-button" onClick={resetForm} aria-label="Close form"><X size={20} /></button></div>
      <form onSubmit={saveRoom}>
        <div className="room-form-grid">
          <label className="room-field">Room Name / Number *<input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Room 101" required /></label>
          <label className="room-field">PG Property *<select value={listingId} onChange={e => setListingId(e.target.value)} required disabled={!!editingId || properties.length === 0}>
            {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select></label>
          <label className="room-field">Room Type *<select value={type} onChange={e => setType(e.target.value)}><option value="SINGLE">Single</option><option value="SHARED">Shared</option><option value="DOUBLE_SHARING">Double Sharing</option><option value="TRIPLE_SHARING">Triple Sharing</option><option value="FOUR_SHARING">Four Sharing</option></select></label>
          <label className="room-field">Total Bed Capacity *<input type="number" min={1} value={capacity} onChange={e => setCapacity(e.target.value)} required /></label>
          <label className="room-field">Monthly Rent per Bed (₹)<input type="number" min={0} value={monthlyRent} onChange={e => setMonthlyRent(e.target.value)} placeholder="Optional" /></label>
        </div>
        {editingId && <p className="bed-modal-help">Bed availability is managed separately. Capacity cannot be reduced below the number of existing beds, and occupied/reserved beds are protected.</p>}
        <div className="room-form-actions"><button type="button" className="cancel-button" onClick={resetForm}>Cancel</button><button type="submit" className="primary-button" disabled={saving || properties.length === 0}>{saving ? "Saving..." : editingId ? "Save Changes" : "Add Room"}</button></div>
      </form>
    </section>}

    <section className="rooms-toolbar rooms-grouped-toolbar">
      <div className="rooms-search"><Search size={18} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search PG, locality or room number..." aria-label="Search rooms" /></div>
      <select aria-label="Filter by property" value={propertyFilter} onChange={e => setPropertyFilter(e.target.value)}><option value="All Properties">All Properties</option>{properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
      <select aria-label="Filter by room type" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}><option>All Types</option><option>Single</option><option>Shared</option><option>Double Sharing</option><option>Triple Sharing</option><option>Four Sharing</option></select>
      <button className="secondary-button" type="button" onClick={() => { setSearch(""); setPropertyFilter("All Properties"); setTypeFilter("All Types"); void loadData(); }}><RefreshCw size={15} /> Refresh</button>
    </section>

    <div className="rooms-results-heading"><h2>Rooms by PG property</h2><span>{filteredGroups.reduce((sum,g) => sum + g.rooms.length, 0)} rooms · {filteredGroups.length} properties</span></div>
    {loading ? <div className="listings-empty">Loading rooms...</div> : filteredGroups.length ? <div className="rooms-property-groups">
      {filteredGroups.map(group => <section className="rooms-property-group" key={group.listingId}>
        <button className="rooms-property-group-header" type="button" onClick={() => toggleProperty(group.listingId)}>
          <span className="rooms-property-title"><span className="rooms-property-icon"><Building2 size={20}/></span><span><strong>{group.propertyName}</strong><small>{group.locality || "PG property"} · {group.rooms.length} {group.rooms.length === 1 ? "room" : "rooms"}</small></span></span>
          <span className="rooms-property-summary"><strong>{group.totalBeds} beds</strong><span>{group.available} available · {group.occupied} occupied</span>{expandedProperties.includes(group.listingId) ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}</span>
        </button>
        {expandedProperties.includes(group.listingId) && <div className="rooms-property-content">
          {group.rooms.map(room => {
            const occupiedLike = room.occupied + room.reserved;
            const pct = room.beds.length ? (occupiedLike / room.beds.length) * 100 : 0;
            return <article className="room-detail-card" key={room.id}>
              <div className="room-detail-main">
                <span className="room-detail-icon"><DoorOpen size={20}/></span>
                <div className="room-detail-title"><strong>{room.name}</strong><small>{roomTypeLabel(room.roomType)} · {room.capacity} bed capacity</small></div>
                <span className="room-type-badge">{roomTypeLabel(room.roomType)}</span>
                <button type="button" className="room-edit-button" onClick={() => startEdit(room)}><Pencil size={14}/> Edit</button>
              </div>
              <div className="room-detail-stats">
                <span><strong>{room.available}</strong><small>Available</small></span>
                <span><strong>{room.occupied}</strong><small>Occupied</small></span>
                <span><strong>{room.reserved}</strong><small>Reserved</small></span>
                <span><strong>{room.maintenance}</strong><small>Maintenance</small></span>
                <span className="room-detail-rent"><strong>₹{(room.monthlyRent ?? 0).toLocaleString("en-IN")}</strong><small>per bed / month</small></span>
              </div>
              <div className="room-detail-progress"><span style={{width:`${pct}%`}}/></div>
            </article>;
          })}
        </div>}
      </section>)}
    </div> : <div className="listings-empty"><div className="empty-icon"><DoorOpen size={28}/></div><h3>No rooms found</h3><p>{error || "Try changing your filters or add a room to a PG."}</p></div>}
  </div>;
}

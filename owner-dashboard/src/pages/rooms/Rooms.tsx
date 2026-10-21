import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  Plus, Search, BedDouble, Building2, Users, DoorOpen,
  Pencil, X, CheckCircle2, Clock3, RefreshCw
} from "lucide-react";
import { api } from "../../services/api";

type ApiBed = { id: string; status: "AVAILABLE" | "OCCUPIED" | "RESERVED" | "MAINTENANCE" };
type ApiListing = { id: string; name: string; locality?: string };
type ApiRoom = {
  id: string; name: string; roomType: string; capacity: number;
  monthlyRent: number | null; listingId: string; listing: ApiListing; beds: ApiBed[];
  createdAt?: string;
};
type ListingOption = { id: string; name: string; locality?: string };
type RoomStatus = "Active" | "Maintenance";
type RoomView = ApiRoom & {
  propertyName: string; typeLabel: "Single" | "Shared";
  occupied: number; available: number; roomStatus: RoomStatus;
};

const roomTypeToApi = (type: "Single" | "Shared") => type === "Single" ? "SINGLE" : "SHARED";
const roomTypeFromApi = (value: string): "Single" | "Shared" =>
  value.toUpperCase() === "SINGLE" ? "Single" : "Shared";

function getErrorMessage(error: any, fallback: string) {
  return error?.response?.data?.message || error?.message || fallback;
}

export default function Rooms() {
  const [rooms, setRooms] = useState<ApiRoom[]>([]);
  const [properties, setProperties] = useState<ListingOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [propertyFilter, setPropertyFilter] = useState("All Properties");
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [showForm, setShowForm] = useState(false);
  const [notice, setNotice] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [listingId, setListingId] = useState("");
  const [type, setType] = useState<"Single" | "Shared">("Shared");
  const [capacity, setCapacity] = useState("4");
  const [monthlyRent, setMonthlyRent] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const [roomResponse, listingResponse] = await Promise.all([
        api.get("/rooms"),
        api.get("/listings"),
      ]);
      const roomData: ApiRoom[] = roomResponse.data.rooms ?? [];
      const listingData = (listingResponse.data.listings ?? []) as ListingOption[];
      setRooms(roomData);
      setProperties(listingData);
      setListingId((current) => current || listingData[0]?.id || "");
    } catch (err) {
      setError(getErrorMessage(err, "Could not load rooms. Please check the backend and sign in again."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadData(); }, []);

  const roomViews: RoomView[] = rooms.map((room) => {
    const occupied = room.beds.filter((bed) => bed.status === "OCCUPIED" || bed.status === "RESERVED").length;
    const available = room.beds.filter((bed) => bed.status === "AVAILABLE").length;
    const maintenance = room.beds.length > 0 && room.beds.every((bed) => bed.status === "MAINTENANCE");
    return {
      ...room,
      propertyName: room.listing?.name ?? "Unknown PG",
      typeLabel: roomTypeFromApi(room.roomType),
      occupied,
      available,
      roomStatus: maintenance ? "Maintenance" : "Active",
    };
  });

  const totalBeds = roomViews.reduce((sum, room) => sum + room.capacity, 0);
  const occupiedBeds = roomViews.reduce((sum, room) => sum + room.occupied, 0);
  const availableBeds = roomViews.reduce((sum, room) => sum + room.available, 0);

  const filteredRooms = useMemo(() => {
    const query = search.trim().toLowerCase();
    return roomViews.filter((room) =>
      (room.name.toLowerCase().includes(query) || room.propertyName.toLowerCase().includes(query)) &&
      (propertyFilter === "All Properties" || room.listingId === propertyFilter) &&
      (typeFilter === "All Types" || room.typeLabel === typeFilter) &&
      (statusFilter === "All Statuses" || room.roomStatus === statusFilter)
    );
  }, [roomViews, search, propertyFilter, typeFilter, statusFilter]);

  function resetForm() {
    setName(""); setListingId(properties[0]?.id ?? ""); setType("Shared");
    setCapacity("4"); setMonthlyRent(""); setEditingId(null); setShowForm(false);
  }

  function startEdit(room: RoomView) {
    setName(room.name); setListingId(room.listingId); setType(room.typeLabel);
    setCapacity(String(room.capacity)); setMonthlyRent(room.monthlyRent == null ? "" : String(room.monthlyRent));
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
      name: name.trim(),
      roomType: roomTypeToApi(type),
      capacity: total,
      monthlyRent: rent,
      ...(editingId ? {} : { listingId }),
    };
    setSaving(true); setError(""); setNotice("");
    try {
      if (editingId) {
        await api.patch(`/rooms/${editingId}`, payload);
        setNotice("Room updated successfully.");
      } else {
        await api.post("/rooms", payload);
        setNotice("Room created successfully.");
      }
      resetForm();
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err, "Unable to save the room."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rooms-page">
      <div className="rooms-heading">
        <div><p className="eyebrow">PROPERTY MANAGEMENT</p><h1>Rooms</h1>
          <p className="dashboard-subtitle">Organize rooms, manage capacity and track occupancy across your PGs.</p></div>
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
        <article className="room-stat-card"><div className="room-stat-icon orange"><BedDouble size={22} /></div><div><span>Total Bed Capacity</span><strong>{totalBeds}</strong></div></article>
        <article className="room-stat-card"><div className="room-stat-icon green"><CheckCircle2 size={22} /></div><div><span>Available Beds</span><strong>{availableBeds}</strong></div></article>
        <article className="room-stat-card"><div className="room-stat-icon blue"><Users size={22} /></div><div><span>Occupied Beds</span><strong>{occupiedBeds}</strong></div></article>
      </div>

      {showForm && <section className="room-form-panel">
        <div className="room-form-heading"><div><h2>{editingId ? "Edit Room" : "Add a Room"}</h2><p>Room changes are saved to your database.</p></div>
          <button type="button" className="room-close-button" onClick={resetForm} aria-label="Close form"><X size={20} /></button></div>
        <form onSubmit={saveRoom}>
          <div className="room-form-grid">
            <label className="room-field">Room Name / Number *<input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Room 301" required /></label>
            <label className="room-field">PG Property *<select value={listingId} onChange={(e) => setListingId(e.target.value)} required disabled={!!editingId || properties.length === 0}>
              {properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select></label>
            <label className="room-field">Room Type *<select value={type} onChange={(e) => setType(e.target.value as "Single" | "Shared")}><option value="Shared">Shared Room</option><option value="Single">Single Room</option></select></label>
            <label className="room-field">Total Bed Capacity *<input type="number" min={1} value={capacity} onChange={(e) => setCapacity(e.target.value)} required /></label>
            <label className="room-field">Monthly Rent (₹)<input type="number" min={0} value={monthlyRent} onChange={(e) => setMonthlyRent(e.target.value)} placeholder="Optional" /></label>
          </div>
          {editingId && <p className="bed-modal-help">Occupied/available counts are calculated from individual bed records. Manage each bed from Bed Availability.</p>}
          <div className="room-form-actions"><button type="button" className="cancel-button" onClick={resetForm}>Cancel</button><button type="submit" className="primary-button" disabled={saving || properties.length === 0}>{saving ? "Saving..." : editingId ? "Save Changes" : "Add Room"}</button></div>
        </form>
      </section>}

      <section className="rooms-toolbar">
        <div className="rooms-search"><Search size={18} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search room or PG name..." aria-label="Search rooms" /></div>
        <select aria-label="Filter by property" value={propertyFilter} onChange={(e) => setPropertyFilter(e.target.value)}><option value="All Properties">All Properties</option>{properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
        <select aria-label="Filter by room type" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}><option>All Types</option><option>Single</option><option>Shared</option></select>
        <select aria-label="Filter by status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option>All Statuses</option><option>Active</option><option>Maintenance</option></select>
        <button className="secondary-button" type="button" onClick={() => { setSearch(""); setPropertyFilter("All Properties"); setTypeFilter("All Types"); setStatusFilter("All Statuses"); void loadData(); }}><RefreshCw size={15} /> Refresh</button>
      </section>

      <div className="rooms-results-heading"><h2>Room inventory</h2><span>{filteredRooms.length} rooms</span></div>
      {loading ? <div className="listings-empty">Loading rooms...</div> : filteredRooms.length ? <div className="rooms-table-wrap"><table className="rooms-table">
        <thead><tr><th>Room</th><th>PG Property</th><th>Type</th><th>Bed Capacity</th><th>Availability</th><th>Status</th><th>Action</th></tr></thead>
        <tbody>{filteredRooms.map((room) => {
          const occupied = room.occupied; const percentage = room.capacity ? Math.min(100, (occupied / room.capacity) * 100) : 0;
          return <tr key={room.id}><td><div className="room-name-cell"><div className="room-mini-icon"><DoorOpen size={18} /></div><div><strong>{room.name}</strong><small>Room ID: {room.id}</small></div></div></td>
            <td><span className="room-property"><Building2 size={14} />{room.propertyName}</span></td><td><span className="room-type-badge">{room.typeLabel}</span></td>
            <td><strong>{room.capacity}</strong> beds</td><td><div className="room-availability"><div><strong>{room.available} available</strong><span>{occupied}/{room.capacity} occupied</span></div><div className="room-progress"><div style={{ width: `${percentage}%` }} /></div></div></td>
            <td><span className={`room-status ${room.roomStatus.toLowerCase()}`}>{room.roomStatus === "Active" ? <CheckCircle2 size={13} /> : <Clock3 size={13} />}{room.roomStatus}</span></td>
            <td><button type="button" className="room-edit-button" onClick={() => startEdit(room)}><Pencil size={14} /> Edit</button></td></tr>;
        })}</tbody></table></div> : <div className="listings-empty"><div className="empty-icon"><DoorOpen size={28} /></div><h3>No rooms found</h3><p>{error || "Try changing your search or add a room to one of your PGs."}</p><button className="secondary-button" type="button" onClick={() => { setSearch(""); setPropertyFilter("All Properties"); setTypeFilter("All Types"); setStatusFilter("All Statuses"); }}>Clear filters</button></div>}
    </div>
  );
}

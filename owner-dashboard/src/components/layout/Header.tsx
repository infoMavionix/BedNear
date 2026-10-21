
import { Bell, Search } from "lucide-react";

type OwnerUser = {
  id?: string;
  name?: string;
  email?: string;
  businessName?: string | null;
};

export default function Header() {
  let owner: OwnerUser = {};

  try {
    const savedUser = localStorage.getItem("bednear_user");

    if (savedUser) {
      owner = JSON.parse(savedUser) as OwnerUser;
    }
  } catch {
    owner = {};
  }

  const ownerName = owner.name?.trim() || "PG Owner";
  const ownerInitial = ownerName.charAt(0).toUpperCase();

  return (
    <header className="bednear-header">
      <div className="bednear-header-title">
        <h1>Owner Dashboard</h1>
        <p>Manage your PG properties and bookings</p>
      </div>

      <div className="bednear-header-actions">
        <label className="bednear-header-search">
          <Search size={18} />
          <input type="search" placeholder="Search..." />
        </label>

        <button
          type="button"
          className="bednear-notification"
          aria-label="Notifications"
        >
          <Bell size={20} />
        </button>

        <div className="bednear-header-owner">
          <div
            className="bednear-header-avatar"
            title={ownerName}
            aria-label={`Logged in as ${ownerName}`}
          >
            {ownerInitial}
          </div>

          <div className="bednear-header-owner-info">
            <strong>{ownerName}</strong>
            <span>PG Owner</span>
          </div>
        </div>
      </div>
    </header>
  );
}

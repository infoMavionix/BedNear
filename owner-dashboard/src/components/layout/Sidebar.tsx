
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  PlusCircle,
  DoorOpen,
  BedDouble,
  MessageSquare,
  UserRound,
  LogOut,
} from "lucide-react";

const navigation = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard, end: true },
  { label: "My PGs", to: "/listings", icon: Building2, end: true },
  { label: "Add PG", to: "/listings/new", icon: PlusCircle, end: true },
  { label: "Rooms", to: "/rooms", icon: DoorOpen, end: true },
  { label: "Bed Availability", to: "/beds", icon: BedDouble, end: true },
  { label: "Enquiries", to: "/enquiries", icon: MessageSquare, end: true },
  { label: "Profile", to: "/profile", icon: UserRound, end: true },
];

export default function Sidebar() {
  const navigate = useNavigate();

  function handleLogout() {
    localStorage.removeItem("jwt");
    localStorage.removeItem("bednear_token");
    localStorage.removeItem("bednear_user");

    navigate("/login", { replace: true });
  }

  return (
    <aside className="bednear-sidebar">
      <div className="bednear-sidebar-brand">
        <div className="bednear-logo">B</div>
        <div>
          <h2>BedNear</h2>
          <p>Owner Portal</p>
        </div>
      </div>

      <div className="bednear-sidebar-section">MAIN MENU</div>

      <nav className="bednear-sidebar-nav">
        {navigation.map(({ label, to, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `bednear-sidebar-link${isActive ? " active" : ""}`
            }
          >
            <Icon size={19} strokeWidth={1.8} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="bednear-sidebar-bottom">
        <div className="bednear-sidebar-footer">
          <div className="bednear-help-icon">?</div>
          <div>
            <strong>Need help?</strong>
            <p>Contact our support team</p>
          </div>
        </div>

        <button
          type="button"
          className="bednear-sidebar-logout"
          onClick={handleLogout}
        >
          <LogOut size={19} strokeWidth={1.8} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

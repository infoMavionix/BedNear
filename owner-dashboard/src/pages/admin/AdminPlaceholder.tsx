
import { useLocation } from "react-router-dom";
import {
  Users,
  UserRound,
  MessageSquare,
  CreditCard,
  CalendarCheck,
  BarChart3,
  Settings,
  Construction,
} from "lucide-react";

import "./Admin.css";

const pageDetails: Record<
  string,
  { title: string; description: string; icon: typeof Users }
> = {
  "/admin/owners": {
    title: "Owner Management",
    description: "Manage PG owners, review their accounts, and check owner details.",
    icon: Users,
  },
  "/admin/users": {
    title: "User Management",
    description: "View and manage people using the BedNear platform.",
    icon: UserRound,
  },
  "/admin/enquiries": {
    title: "Enquiries",
    description: "Review tenant enquiries and contact activity.",
    icon: MessageSquare,
  },
  "/admin/payments": {
    title: "Payments",
    description: "Review transactions and payment statuses.",
    icon: CreditCard,
  },
  "/admin/subscriptions": {
    title: "Subscriptions",
    description: "Manage owner subscription plans and renewals.",
    icon: CalendarCheck,
  },
  "/admin/reports": {
    title: "Reports",
    description: "Review platform activity and operational reports.",
    icon: BarChart3,
  },
  "/admin/settings": {
    title: "Settings",
    description: "Configure and manage BedNear administration settings.",
    icon: Settings,
  },
};

export default function AdminPlaceholder() {
  const { pathname } = useLocation();
  const page = pageDetails[pathname];
  const Icon = page?.icon ?? Construction;

  return (
    <div className="admin-overview">
      <section className="admin-page-heading">
        <div className="admin-eyebrow">
          <span className="admin-eyebrow-line" />
          BEDNEAR ADMINISTRATION
        </div>

        <h1>{page?.title ?? "Admin Module"}</h1>
        <p>{page?.description ?? "Manage your BedNear platform."}</p>
      </section>

      <section className="admin-placeholder-card">
        <div className="admin-placeholder-icon">
          <Icon size={30} />
        </div>

        <h2>{page?.title ?? "Admin Module"}</h2>
        <p>{page?.description}</p>

        <span className="admin-placeholder-status">
          <Construction size={15} />
          Module page ready for implementation
        </span>

        <p className="admin-placeholder-note">
          This page is connected to admin navigation. Its data tables,
          actions, and backend integration can be added next.
        </p>
      </section>
    </div>
  );
}


import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import ProtectedRoute from "../components/ProtectedRoute";
import DashboardLayout from "../layouts/DashboardLayout";

import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";

import Dashboard from "../pages/dashboard/Dashboard";
import Listings from "../pages/listings/Listings";
import CreateListing from "../pages/listings/CreateListing";
import ListingDetails from "../pages/listings/ListingDetails";
import Rooms from "../pages/rooms/Rooms";
import Beds from "../pages/beds/Beds";
import Enquiries from "../pages/enquiries/Enquiries";
import Profile from "../pages/profile/Profile";

import AdminLayout from "../pages/admin/AdminLayout";
import AdminOverview from "../pages/admin/AdminOverview";
import PendingListings from "../pages/admin/PendingListings";
import AdminUsers from "../pages/admin/AdminUsers";
import AdminPlaceholder from "../pages/admin/AdminPlaceholder";

import { updatePageTitle } from "../utils/updatePageTitle";
import AdminEnquiries from "../pages/admin/AdminEnquiries";

export default function AppRoutes() {
  useEffect(() => {
    try {
      const storedUser = sessionStorage.getItem("bednear_user");

      if (storedUser) {
        const user = JSON.parse(storedUser);
        updatePageTitle(user.role);
      } else {
        document.title = "BedNear";
      }
    } catch {
      document.title = "BedNear";
    }
  }, []);

  return (
    <Routes>
      {/* Public pages */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Admin pages: ADMIN role only */}
      <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminOverview />} />

          <Route
            path="listings/pending"
            element={<PendingListings />}
          />

          {/* Owner and candidate account management */}
         <Route
  path="owners"
  element={<AdminUsers key="owners" defaultRole="OWNER" />}
/>

<Route
  path="users"
  element={<AdminUsers key="candidates" defaultRole="CANDIDATE" />}
/>
          {/* Other admin modules */}
          <Route
  path="enquiries"
  element={<AdminEnquiries />}
/>
          <Route
            path="payments"
            element={<AdminPlaceholder />}
          />
          <Route
            path="subscriptions"
            element={<AdminPlaceholder />}
          />
          <Route
            path="reports"
            element={<AdminPlaceholder />}
          />
          <Route
            path="settings"
            element={<AdminPlaceholder />}
          />
        </Route>
      </Route>

      {/* Owner pages: OWNER role only */}
      <Route element={<ProtectedRoute allowedRoles={["OWNER"]} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />

          {/* PG listing management */}
          <Route path="/listings" element={<Listings />} />
          <Route
            path="/listings/new"
            element={<CreateListing />}
          />
          <Route
            path="/listings/:id/edit"
            element={<CreateListing />}
          />
          <Route
            path="/listings/:id"
            element={<ListingDetails />}
          />

          {/* Other owner pages */}
          <Route path="/rooms" element={<Rooms />} />
          <Route path="/beds" element={<Beds />} />
          <Route path="/enquiries" element={<Enquiries />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Route>

      {/* Start at login */}
      <Route
        path="/"
        element={<Navigate to="/login" replace />}
      />

      {/* Unknown URLs */}
      <Route
        path="*"
        element={<Navigate to="/login" replace />}
      />
    </Routes>
  );
}


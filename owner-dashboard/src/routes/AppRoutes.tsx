
import { Navigate, Route, Routes } from "react-router-dom";

import ProtectedRoute from "../components/ProtectedRoute";
import DashboardLayout from "../layouts/DashboardLayout";

import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import Dashboard from "../pages/dashboard/Dashboard";
import Listings from "../pages/listings/Listings";
import CreateListing from "../pages/listings/CreateListing";
import Rooms from "../pages/rooms/Rooms";
import Beds from "../pages/beds/Beds";
import Enquiries from "../pages/enquiries/Enquiries";
import Profile from "../pages/profile/Profile";
import ListingDetails from "../pages/listings/ListingDetails";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public pages */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* All owner pages require a login token */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route
            index
            element={<Navigate to="/dashboard" replace />}
          />

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
          <Route path="/listings/:id" element={<ListingDetails />} />

          {/* Other owner pages */}
          <Route path="/rooms" element={<Rooms />} />
          <Route path="/beds" element={<Beds />} />
          <Route path="/enquiries" element={<Enquiries />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Route>

      {/* Opening the website starts at Login */}
      <Route
        path="/"
        element={<Navigate to="/login" replace />}
      />

      {/* Unknown URLs return to Login */}
      <Route
        path="*"
        element={<Navigate to="/login" replace />}
      />
    </Routes>
  );
}

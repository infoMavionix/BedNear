
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import Login from "./pages/auth/Login";
import ProtectedRoute from "./components/ProtectedRoute";

import AdminLayout from "./pages/admin/AdminLayout";
import AdminOverview from "./pages/admin/AdminOverview";
import PendingListings from "./pages/admin/PendingListings";
import OwnerVerification from "./pages/admin/OwnerVerification";
import AdminPlaceholder from "./pages/admin/AdminPlaceholder";

import Payments from "./pages/admin/Payments";
import Subscriptions from "./pages/admin/Subscriptions";
import SubscriptionPricing from "./pages/admin/SubscriptionPricing";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminOverview />} />

            <Route path="listings/pending" element={<PendingListings />} />
            <Route path="owners/verification" element={<OwnerVerification />} />

            <Route path="owners" element={<AdminPlaceholder />} />
            <Route path="users" element={<AdminPlaceholder />} />
            <Route path="enquiries" element={<AdminPlaceholder />} />

            <Route path="payments" element={<Payments />} />
            <Route path="subscriptions" element={<Subscriptions />} />
            <Route path="subscription-pricing" element={<SubscriptionPricing />} />

            <Route path="reports" element={<AdminPlaceholder />} />
            <Route path="settings" element={<AdminPlaceholder />} />
          </Route>
        </Route>

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

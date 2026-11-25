
import { Outlet } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";

export default function DashboardLayout() {
  return (
    <div className="owner-layout">
      <Sidebar />

      <div className="owner-main">
        <Header />

        <main className="owner-page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

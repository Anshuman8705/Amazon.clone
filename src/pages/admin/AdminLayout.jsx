import { NavLink, Navigate, Outlet } from "react-router-dom";
import { LayoutDashboard, Package, ClipboardList, Users } from "lucide-react";
import { useUser } from "../../context/UserContext.jsx";

export default function AdminLayout() {
  const { user, ready } = useUser();
  if (ready && !user) return <Navigate to="/signin" state={{ from: "/admin" }} replace />;
  if (!user) return null;
  if (user.role !== "admin") {
    return (
      <main className="mx-auto max-w-screen-md px-3 py-16 text-center">
        <p className="text-2xl font-bold text-ink">Store admin is for administrators</p>
        <p className="mt-2 text-sm text-muted">You are signed in as {user.email}. Sign in with the admin account to manage products and orders.</p>
      </main>
    );
  }
  const link = ({ isActive }) => `flex items-center gap-2 rounded px-3 py-2 text-sm ${isActive ? "bg-slate text-white" : "text-ink hover:bg-gray-100"}`;
  return (
    <main className="mx-auto max-w-site px-3 py-4 md:px-4">
      <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
        <nav className="h-fit bg-white p-2" aria-label="Admin">
          <NavLink to="/admin" end className={link}><LayoutDashboard size={16} /> Dashboard</NavLink>
          <NavLink to="/admin/products" className={link}><Package size={16} /> Products</NavLink>
          <NavLink to="/admin/orders" className={link}><ClipboardList size={16} /> Orders</NavLink>
          <NavLink to="/admin/customers" className={link}><Users size={16} /> Customers</NavLink>
        </nav>
        <div className="min-w-0"><Outlet /></div>
      </div>
    </main>
  );
}

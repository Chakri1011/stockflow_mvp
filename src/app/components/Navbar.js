"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { logoutAction } from "../actions";
import { LayoutDashboard, Box, Settings, LogOut, Store } from "lucide-react";
import { useState } from "react";

export default function Navbar({ session }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    const res = await logoutAction();
    if (res.success) {
      router.push("/login");
      router.refresh();
    } else {
      setLoggingOut(false);
    }
  };

  if (!session) return null;

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link href="/dashboard" className="navbar-logo">
          <div className="logo-icon">SF</div>
          <span>StockFlow</span>
        </Link>

        <div className="navbar-links">
          <Link href="/dashboard" className={`nav-link ${pathname === "/dashboard" ? "active" : ""}`}>
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </Link>
          <Link href="/products" className={`nav-link ${pathname === "/products" ? "active" : ""}`}>
            <Box size={18} />
            <span>Products</span>
          </Link>
          <Link href="/settings" className={`nav-link ${pathname === "/settings" ? "active" : ""}`}>
            <Settings size={18} />
            <span>Settings</span>
          </Link>
        </div>

        <div className="navbar-user">
          <div className="user-org">
            <Store size={14} className="org-icon" />
            <span>{session.organizationName}</span>
          </div>
          <div className="user-profile">
            <div className="user-avatar">{session.name.substring(0, 2).toUpperCase()}</div>
            <div className="user-details">
              <span className="user-name">{session.name}</span>
              <span className="user-role">Owner</span>
            </div>
          </div>
          <button onClick={handleLogout} className="logout-btn" title="Logout" disabled={loggingOut}>
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </nav>
  );
}

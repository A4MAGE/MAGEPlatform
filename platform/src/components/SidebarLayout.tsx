import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import { UserAuth } from "../context/AuthContext";
// @ts-ignore
import SynthwaveBg from "@homepage/components/SynthwaveBg";
import "./Sidebar.css";

const SidebarLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { signOut } = UserAuth();

  return (
    <div className="sidebar-layout">
      <SynthwaveBg />
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <button
        type="button"
        className="sidebar-logout"
        aria-label="Log out"
        onClick={signOut}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
        <span>Log out</span>
      </button>
      <div className={collapsed ? "sidebar-content sidebar-content--collapsed" : "sidebar-content"}>
        <Outlet />
      </div>
    </div>
  );
};

export default SidebarLayout;

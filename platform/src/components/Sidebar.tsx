import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
// @ts-ignore
import MageLogo from "@homepage/assets/favicon.svg";
import "./Sidebar.css";

const tabs: { path: string; label: string; icon: ReactNode }[] = [
  {
    path: "/profile",
    label: "Profile",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
    ),
  },
  {
    path: "/explore",
    label: "Explore",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="11" cy="11" r="7" />
        <line x1="16.5" y1="16.5" x2="22" y2="22" />
        <line x1="9" y1="11" x2="13" y2="11" />
        <line x1="11" y1="9" x2="11" y2="13" />
      </svg>
    ),
  },
  { path: "/player",     label: "Player",     icon: "▶" },
  { path: "/my-presets", label: "My Presets", icon: "♫" },
  { path: "/broadcast",  label: "Broadcast",  icon: "◉" },
  { path: "/create",     label: "Create",     icon: "+" },
];

type SidebarProps = {
  collapsed: boolean;
  onToggle: () => void;
};

const Sidebar = ({ collapsed, onToggle }: SidebarProps) => {
  return (
    <nav className={collapsed ? "sidebar sidebar--collapsed" : "sidebar"}>
      <div className="sidebar-header">
        <img src={MageLogo} alt="MAGE" className="sidebar-logo-img" />
      </div>

      {!collapsed && (
        <ul className="sidebar-tabs">
          {tabs.map((tab) => (
            <li key={tab.path}>
              <NavLink
                to={tab.path}
                className={({ isActive }) =>
                  "sidebar-tab" + (isActive ? " sidebar-tab--active" : "")
                }
              >
                <span className="sidebar-tab-icon">{tab.icon}</span>
                <span className="sidebar-tab-label">{tab.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      )}

      <button className="sidebar-toggle" onClick={onToggle} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
        <span className="sidebar-toggle__icon">
          {collapsed ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          )}
        </span>
      </button>
    </nav>
  );
};

export default Sidebar;

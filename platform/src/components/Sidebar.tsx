import { NavLink } from "react-router-dom";
// @ts-ignore
import MageLogo from "@homepage/assets/favicon.svg";
import "./Sidebar.css";

const tabs = [
  { path: "/dashboard", label: "Dashboard", icon: "⊞" },
  { path: "/explore", label: "Explore", icon: "◎" },
  { path: "/player", label: "Player", icon: "▶" },
  { path: "/my-presets", label: "My Presets", icon: "♫" },
  { path: "/broadcast", label: "Broadcast", icon: "◉" },
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

      <button className="sidebar-toggle" onClick={onToggle}>
        {collapsed ? "▸" : "◂"}
      </button>
    </nav>
  );
};

export default Sidebar;

import { NavLink } from "react-router-dom";
import "./Sidebar.css";

const tabs = [
  { path: "/dashboard", label: "Dashboard", icon: "⊞" },
  { path: "/explore", label: "Explore", icon: "◎" },
  { path: "/player", label: "Player", icon: "▶" },
  { path: "/my-presets", label: "My Presets", icon: "♫" },
  { path: "/broadcast", label: "Broadcast", icon: "◉" },
];

const Sidebar = () => {
  return (
    <nav className="sidebar">
      <div className="sidebar-logo">MAGE</div>
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
    </nav>
  );
};

export default Sidebar;

import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import "./Sidebar.css";

const SidebarLayout = () => {
  return (
    <div className="sidebar-layout">
      <Sidebar />
      <div className="sidebar-content">
        <Outlet />
      </div>
    </div>
  );
};

export default SidebarLayout;

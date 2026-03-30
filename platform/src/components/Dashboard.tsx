import { UserAuth } from "../context/AuthContext";
import EnginePlayer from "./mage engine/EnginePlayer";
import PresetPreviews from "./PresetPreviews";
import { useState } from "react";

const Dashboard = () => {
  const { session, signOut } = UserAuth();
  const [presetPath, setPresetPath] = useState("");

  // We can assume session is valid because the private route protects this page from unauthorized users.
  return (
    <div className="dashboard-container">
      <div className="content-center-card">
        <h1>Dashboard</h1>
        <h2>Welcome, {session?.user?.email}</h2>
        <div onClick={signOut}>
          <button className="link-button">Sign Out</button>
        </div>
        <EnginePlayer presetPath={presetPath} />
      </div>
      <PresetPreviews setPresetPath={setPresetPath} />
    </div>
  );
};

export default Dashboard;

import { UserAuth } from "../context/AuthContext";

const Dashboard = () => {
  const { session, signOut } = UserAuth();
  // We can assume session is valid because the private route protects this page from unauthorized users.
  return (
    <div className="home-container">
      <div className="content-center-card">
        <h1>Dashboard</h1>
        <h2>Welcome, {session?.user?.email}</h2>
        <div onClick={signOut}>
          <button className="link-button">Sign Out</button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

import { Link } from "react-router-dom";

function App() {
  return (
    <div className="home-container">
      <div className="content-center-card">
        <h1>MAGE Sharing Platform</h1>
        <p>A platform for creating & sharing MAGE visualizations</p>
        <div className="account-controls">
          <Link className="link-button" to="/signin">
            Login
          </Link>
          <Link className="link-button" to="/signup">Register</Link>
        </div>
      </div>
    </div>
  );
}

export default App;

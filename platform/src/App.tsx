import { Link } from "react-router-dom";
// @ts-ignore
import Navbar from "@homepage/components/Navbar";
// @ts-ignore
import Header from "@homepage/components/Header";
import "@fontsource/michroma";
import "@fontsource/anta";

function App() {
  return (
    <div>
      <Navbar LinkComponent={Link} />
      <Header />
      <div className="account-controls" style={{ marginTop: "2rem" }}>
        <Link className="link-button" to="/signin">Login</Link>
        <Link className="link-button" to="/signup">Register</Link>
      </div>
    </div>
  );
}

export default App;

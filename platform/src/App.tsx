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
    </div>
  );
}

export default App;

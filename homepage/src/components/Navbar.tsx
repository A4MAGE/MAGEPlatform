import { NavLink } from 'react-router-dom';
import Icon from "../assets/favicon.svg"

function Navbar() {
  return(
    <>
      <div className="nav">
        <div className="mage-icon">
          <img src={Icon} />
        </div>
        <div className="list">
          <ul>
            <li><NavLink to="/">Home</NavLink></li>
            <li><NavLink to="/explore">Explore</NavLink></li>
            <li><NavLink to="/engine">Engine</NavLink></li>
            <li><NavLink to="/about">About</NavLink></li>
            <li><NavLink to="/contact">Contact</NavLink></li>
          </ul>
        </div>
        <div className="login-btn">
          <NavLink to="/signin">Log In</NavLink>
        </div>
      </div>
    </>
  )
}

export default Navbar

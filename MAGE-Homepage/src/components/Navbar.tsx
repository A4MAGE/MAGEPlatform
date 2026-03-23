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
            <li><a href="#home">Home</a></li>
            <li><a href="#explore">Exlpore</a></li>
            <li><a href="#engine">Create</a></li>
            <li><a href="#about">About</a></li>
            <li><a href="#contact">Contact</a></li>
          </ul>
        </div>
        <div className="login-btn">
          <a href="login">Log In</a>
        </div>
      </div>
    </>
  )
}

export default Navbar

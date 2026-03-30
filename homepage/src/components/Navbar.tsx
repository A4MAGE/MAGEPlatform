import Icon from "../assets/favicon.svg"

type NavbarProps = {
  LinkComponent?: React.ComponentType<{ to: string; children: React.ReactNode; className?: string }>;
};

function Navbar({ LinkComponent }: NavbarProps) {
  const NavLink = LinkComponent
    ? ({ to, children }: { to: string; children: React.ReactNode }) =>
        <LinkComponent to={to}>{children}</LinkComponent>
    : ({ to, children }: { to: string; children: React.ReactNode }) =>
        <a href={to}>{children}</a>;

  return(
    <>
      <div className="nav">
        <div className="mage-icon">
          <img src={Icon} />
        </div>
        <div className="list">
          <ul>
            <li><NavLink to="#home">Home</NavLink></li>
            <li><NavLink to="/explore">Explore</NavLink></li>
            <li><NavLink to="#engine">Create</NavLink></li>
            <li><NavLink to="#about">About</NavLink></li>
            <li><NavLink to="#contact">Contact</NavLink></li>
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

import Icon from "../assets/favicon.svg"

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <img src={Icon} className="footer-icon" />
          <span className="footer-name">MAGE</span>
        </div>

        <div className="footer-links">
          <a href="https://github.com/bsiscoe/MAGE/" target="_blank" rel="noreferrer">GitHub</a>
        </div>

        <p className="footer-copy">© {new Date().getFullYear()} MAGE. All rights reserved.</p>
      </div>
    </footer>
  )
}

export default Footer

import { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import Icon from "../assets/favicon.svg"

const sections = ['home', 'explore', 'engine']

function Navbar() {
  const [active, setActive] = useState('home')
  const location = useLocation()
  const navigate = useNavigate()
  const onHomepage = location.pathname === '/' || !['/signin', '/signup', '/login'].includes(location.pathname)
  const onAuthPage = ['/signin', '/signup', '/login'].includes(location.pathname)

  useEffect(() => {
    if (!onHomepage) return
    const observers = sections.map(id => {
      const el = document.getElementById(id)
      if (!el) return null
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActive(id) },
        { rootMargin: '-40% 0px -40% 0px', threshold: 0 }
      )
      obs.observe(el)
      return obs
    })
    return () => observers.forEach(o => o?.disconnect())
  }, [onHomepage])

  const goToSection = (id: string) => {
    if (onHomepage) {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    } else {
      navigate(`/#${id}`)
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
      }, 50)
    }
  }

  const loginLabel = onAuthPage && location.pathname === '/signup' ? 'Log In'
    : onAuthPage && location.pathname !== '/signup' ? 'Sign Up'
    : 'Log In'
  const loginTo = onAuthPage && location.pathname === '/signup' ? '/signin'
    : onAuthPage && location.pathname !== '/signup' ? '/signup'
    : '/signin'

  return (
    <>
      {/* Logo — top left */}
      <div className="nav-corner nav-corner--left">
        <a onClick={() => goToSection('home')} style={{ cursor: 'pointer' }}>
          <img src={Icon} className="mage-icon-img" />
        </a>
      </div>

      {/* Nav links — centered pill */}
      <div className="nav">
        <div className="list">
          <ul>
            {sections.map(id => (
              <li key={id}>
                <a onClick={() => goToSection(id)} className={onHomepage && active === id ? 'active' : ''} style={{ cursor: 'pointer' }}>
                  {id.charAt(0).toUpperCase() + id.slice(1)}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Login — top right */}
      <div className="nav-corner nav-corner--right">
        <Link to={loginTo} className="login-btn-link">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="8" r="4"/>
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
          </svg>
          {loginLabel}
        </Link>
      </div>
    </>
  )
}
export default Navbar

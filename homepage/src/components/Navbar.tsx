import { useEffect, useState } from 'react';
import Icon from "../assets/favicon.svg"

const sections = ['home', 'explore', 'engine']

function Navbar() {
  const [active, setActive] = useState('home')

  useEffect(() => {
    const observers = sections.map(id => {
      const el = document.getElementById(id)
      if (!el) return null
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActive(id) },
        { threshold: 0.5 }
      )
      obs.observe(el)
      return obs
    })
    return () => observers.forEach(o => o?.disconnect())
  }, [])

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <>
      <div className="nav">
        <div className="mage-icon">
          <img src={Icon} />
        </div>
        <div className="list">
          <ul>
            {sections.map(id => (
              <li key={id}>
                <a onClick={() => scrollTo(id)} className={active === id ? 'active' : ''} style={{ cursor: 'pointer' }}>
                  {id.charAt(0).toUpperCase() + id.slice(1)}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div className="login-btn">
          <a href="/signin">Log In</a>
        </div>
      </div>
    </>
  )
}
export default Navbar

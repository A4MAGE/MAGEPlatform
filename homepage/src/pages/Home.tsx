import "@fontsource/michroma"
import "../App.css"
import { Link } from "react-router-dom"

const features = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ),
    title: "Create your own visuals",
    body: "Sculpt audio-reactive environments with a live parameter editor. Every knob, shader, and effect responds to your sound in real time no two performances look the same.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
    ),
    title: "Explore community presets",
    body: "Browse presets made by other creators. Find something you love, load it into the engine instantly, and remix it into something your own.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
      </svg>
    ),
    title: "Watch live broadcast rooms",
    body: "Tune into live sessions where creators are building and performing in real time. See how others use the engine, pick up techniques, or just vibe with the visuals.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    title: "Share with your audience",
    body: "Go live yourself and broadcast your visuals to a room full of viewers. Share a link, and get to creating with viewers.",
  },
]

function Home() {
  return (
    <div className="page home-page">

      <div className="main-header">
        <h1 className="noselect">MAGE</h1>
        <p className="home-tagline noselect">
          Audio-reactive visuals, built by the community.
        </p>
      </div>

      <div className="home-features">
        {features.map(f => (
          <div key={f.title} className="home-feature-card">
            <span className="home-feature-card__icon">{f.icon}</span>
            <h3 className="home-feature-card__title">{f.title}</h3>
            <p className="home-feature-card__body">{f.body}</p>
          </div>
        ))}
        <Link to="/signup" className="home-cta-btn" style={{ gridColumn: '1 / -1', justifySelf: 'center', marginTop: '8px' }}>Get started free →</Link>
      </div>

    </div>
  )
}

export default Home

import { useEffect } from 'react'
import Home from './pages/Home.tsx'
import Explore from './pages/Explore.tsx'
import Engine from './pages/Engine.tsx'
import Help from './pages/Help.tsx'
import Navbar from './components/Navbar.tsx'
import Footer from './components/Footer.tsx'
import SynthwaveBg from './components/SynthwaveBg.tsx'

function App() {
  useEffect(() => {
    // Scroll to hash target on first mount (e.g. arriving from /signin → /#explore)
    if (window.location.hash) {
      const id = window.location.hash.slice(1)
      requestAnimationFrame(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
      })
    }
  }, [])

  return (
    <>
      <SynthwaveBg />
      <Navbar />
      <section id="home"><Home /></section>
      <section id="explore"><Explore /></section>
      <section id="engine"><Engine /></section>
      <section id="help"><Help /></section>
      <Footer />
    </>
  )
}

export default App

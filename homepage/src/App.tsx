import Home from './pages/Home.tsx'
import Explore from './pages/Explore.tsx'
import Engine from './pages/Engine.tsx'
import Navbar from './components/Navbar.tsx'

function App() {
  return (
    <>
      <Navbar />
      <section id="home"><Home /></section>
      <section id="explore"><Explore /></section>
      <section id="engine"><Engine /></section>
    </>
  )
}

export default App

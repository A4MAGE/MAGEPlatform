import { Route, Routes } from 'react-router-dom';
import Home from './pages/Home.tsx'
import Explore from './pages/Explore.tsx'
import Engine from './pages/Engine.tsx'
import Navbar from './components/Navbar.tsx'

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/explore' element={<Explore />} />
        <Route path='/Engine' element={<Engine />} />
      </Routes>
    </>
  )
}

export default App

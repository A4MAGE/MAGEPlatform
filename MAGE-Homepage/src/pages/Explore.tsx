import Carousel from "../components/Carousel.tsx"
import "../App.css"

function Explore() {
  return (
    <>
      <div className="page">
        <h1 className="explore-header">Most Downloaded Presets of the Month</h1>
        <Carousel />
        <h1 className="explore-header">Most Downloaded Presets for Dubstep</h1>
        <Carousel />
        <h1 className="explore-header">Most Downloaded Presets for Synthwave</h1>
        <Carousel />
        <h1 className="explore-header">Most Downloaded Presets for Pop</h1>
        <Carousel />
        <h1 className="explore-header">Most Dowloaded Presets for Hip Hop</h1>
        <Carousel />
      </div>
    </>
  )
}

export default Explore

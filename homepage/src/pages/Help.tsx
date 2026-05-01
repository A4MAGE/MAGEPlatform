import "../App.css"
import { Link } from "react-router-dom"

const steps = [
  { n: "01", title: "Upload audio",     body: "Hit the Upload button on the Engine section and pick any audio file from your device." },
  { n: "02", title: "Pick a preset",    body: "Browse community presets in Explore and click Try it, or load one directly in the player." },
  { n: "03", title: "Hit play",         body: "Press play in the transport bar and watch the visualizer react to your audio in real time." },
  { n: "04", title: "Make your own",    body: "Sign up to tweak parameters, save your own presets, and share them with the community." },
]

function Help() {
  return (
    <div className="page help-page">

      <div className="help-header">
        <h2 className="help-title">How it works</h2>
        <p className="help-subtitle">Get up and running in under a minute.</p>
      </div>

      <div className="help-video-wrap">
        <iframe
          className="help-video"
          src="https://www.youtube.com/embed/WGWesdaAZIg"
          title="MAGE walkthrough"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>

      <div className="help-steps">
        {steps.map(s => (
          <div key={s.n} className="help-step">
            <span className="help-step__num">{s.n}</span>
            <div>
              <p className="help-step__title">{s.title}</p>
              <p className="help-step__body">{s.body}</p>
            </div>
          </div>
        ))}
      </div>

      <Link to="/signup" className="try-btn help-cta-btn">Create a free account →</Link>

    </div>
  )
}

export default Help

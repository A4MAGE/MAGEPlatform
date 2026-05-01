import { useEffect, useRef, useState } from "react"
import { initMAGE, type MAGEEngineAPI } from "@notrac/mage"

type Props = {
  preset?: string | object | null
  audioSource?: string
  onEngineReady?: (engine: MAGEEngineAPI) => void
  onAudioLoaded?: () => void
}

const EnginePlayer = ({ preset, audioSource, onEngineReady, onAudioLoaded }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [engine, setEngine] = useState<MAGEEngineAPI | null>(null)

  useEffect(() => {
    if (!canvasRef.current) return
    // Workaround: @notrac/mage switchControls() expects id="ui_hide" to exist
    let shim: HTMLButtonElement | null = null
    if (!document.getElementById("ui_hide")) {
      shim = document.createElement("button")
      shim.id = "ui_hide"
      shim.type = "button"
      shim.setAttribute("data-mage-shim", "true")
      shim.style.display = "none"
      document.body.appendChild(shim)
    }
    const mage = initMAGE({ canvas: canvasRef.current, withControls: { active: false, integrated: false }, autoStart: true })
    setEngine(mage)
    onEngineReady?.(mage)
    return () => {
      mage.dispose()
      if (shim?.parentNode) shim.parentNode.removeChild(shim)
    }
  }, [])

  useEffect(() => {
    if (!engine || !audioSource) return
    engine.loadAudio(audioSource)
    const id = window.setInterval(() => {
      if (engine.isAudioLoaded()) {
        onAudioLoaded?.()
        window.clearInterval(id)
      }
    }, 100)
    return () => window.clearInterval(id)
  }, [audioSource, engine])

  useEffect(() => {
    if (engine && preset) engine.loadPreset(preset as any)
  }, [preset, engine])

  return (
    <div className="eng-engine-frame">
      {!engine && <div className="eng-engine-loading"><div className="eng-spinner" /></div>}
      <canvas ref={canvasRef} className="eng-canvas" style={{ display: engine ? "block" : "none" }} />
    </div>
  )
}

export default EnginePlayer

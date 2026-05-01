import { useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"
import EnginePlayer from "../components/EnginePlayer"
import type { MAGEEngineAPI } from "@notrac/mage"
import "../App.css"

const FEATURED_PRESET_URL = "presets/preset0.v2.json"

function fmt(secs: number) {
  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60)
  return `${m}:${s.toString().padStart(2, "0")}`
}

function Engine() {
  const [preset, setPreset] = useState<object | null>(null)
  const [audioSource, setAudioSource] = useState("")
  const [audioFileName, setAudioFileName] = useState("")
  const [duration, setDuration] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioLoaded, setAudioLoaded] = useState(false)

  const engineRef = useRef<MAGEEngineAPI | null>(null)
  const blobUrlRef = useRef<string | null>(null)
  const playStartRef = useRef<number | null>(null)
  const accumulatedRef = useRef(0)
  const timerRef = useRef<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    fetch(FEATURED_PRESET_URL).then(r => r.json()).then(setPreset).catch(() => {})
    return () => { if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current) }
  }, [])

  useEffect(() => {
    if (isPlaying) {
      playStartRef.current = Date.now()
      timerRef.current = window.setInterval(() => {
        const sinceStart = (Date.now() - (playStartRef.current ?? Date.now())) / 1000
        const next = accumulatedRef.current + sinceStart
        if (duration > 0 && next >= duration) {
          setElapsed(duration)
          accumulatedRef.current = duration
          playStartRef.current = null
          setIsPlaying(false)
        } else {
          setElapsed(next)
        }
      }, 250)
    } else {
      if (timerRef.current) window.clearInterval(timerRef.current)
      if (playStartRef.current !== null) {
        accumulatedRef.current += (Date.now() - playStartRef.current) / 1000
        playStartRef.current = null
      }
    }
    return () => { if (timerRef.current) window.clearInterval(timerRef.current) }
  }, [isPlaying, duration])

  const handleAudioFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current)
    const url = URL.createObjectURL(file)
    blobUrlRef.current = url
    const audio = new Audio(url)
    audio.onloadedmetadata = () => setDuration(audio.duration)
    accumulatedRef.current = 0
    setElapsed(0)
    setIsPlaying(false)
    setAudioLoaded(false)
    setAudioFileName(file.name)
    setAudioSource(url)
  }

  const handlePlay = () => {
    if (duration > 0 && accumulatedRef.current >= duration - 0.5) {
      accumulatedRef.current = 0
      setElapsed(0)
    }
    engineRef.current?.play()
    setIsPlaying(true)
  }
  const handlePause = () => { engineRef.current?.pause(); setIsPlaying(false) }
  const progress = duration > 0 ? Math.min(elapsed / duration, 1) : 0

  return (
    <div className="page eng-page">

      <div className="eng-header">
        <h2 className="eng-title">Try MAGE</h2>
        <p className="eng-subtitle">
          Upload an audio file and watch this community preset come to life.
          Want to make your own? <Link to="/signup" className="eng-inline-link">Get started →</Link>
        </p>
      </div>

      <div className="eng-shell">

        <EnginePlayer
          preset={preset}
          audioSource={audioSource}
          onEngineReady={(e) => { engineRef.current = e }}
          onAudioLoaded={() => setAudioLoaded(true)}
        />

        {/* Transport bar */}
        <div className="eng-bar">
          <button className="eng-bar__btn" onClick={handlePlay} disabled={!audioLoaded} aria-label="Play">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>
          </button>
          <button className="eng-bar__btn" onClick={handlePause} disabled={!audioLoaded} aria-label="Pause">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>
          </button>
          <div className="eng-bar__track">
            <div className="eng-bar__fill" style={{ width: `${progress * 100}%` }} />
          </div>
          <span className="eng-bar__time">
            {fmt(elapsed)}{duration > 0 ? ` / ${fmt(duration)}` : ""}
          </span>
          <button className="eng-bar__btn eng-bar__btn--ghost" onClick={() => engineRef.current?.toggleFullscreen()} disabled={!engineRef.current} aria-label="Fullscreen">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" /><line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" /></svg>
          </button>
        </div>

        {/* Audio upload */}
        <input ref={fileInputRef} type="file" accept="audio/*" style={{ display: "none" }} onChange={handleAudioFile} />
        <button className="eng-audio-btn" onClick={() => fileInputRef.current?.click()}>
          <span className="eng-audio-btn__icon">↑</span>
          <span className="eng-audio-btn__text">{audioFileName || "Upload audio file"}</span>
        </button>

      </div>


    </div>
  )
}

export default Engine

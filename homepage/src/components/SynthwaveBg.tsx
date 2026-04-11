const VP = { x: 500, y: 450 }

const H_LINES = [460, 475, 500, 535, 580, 635, 700, 775, 860, 1000]
const V_LINES = [-4000, -2000, -1200, -700, -400, -200, -50, 100, 250, 375, 500, 625, 750, 900, 1050, 1200, 1400, 1700, 2200, 3000, 5000]

function SynthwaveBg() {
  return (
    <svg
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
        mixBlendMode: 'screen',
        opacity: 0.22,
        filter: 'blur(0.6px)',
      }}
      viewBox="0 0 1000 1000"
      preserveAspectRatio="xMidYMax slice"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="gridFade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="white" stopOpacity="0" />
          <stop offset="40%"  stopColor="white" stopOpacity="0.4" />
          <stop offset="100%" stopColor="white" stopOpacity="1" />
        </linearGradient>
        <mask id="gridMask">
          <rect x="-200" y={VP.y} width="1400" height={1000 - VP.y} fill="url(#gridFade)" />
        </mask>
      </defs>

      <g mask="url(#gridMask)" stroke="white" strokeWidth="0.7" fill="none">
        {H_LINES.map((y, i) => (
          <line key={`h${i}`} x1="-200" y1={y} x2="1200" y2={y} />
        ))}
        {V_LINES.map((xBottom, i) => (
          <line key={`v${i}`} x1={VP.x} y1={VP.y} x2={xBottom} y2={1000} />
        ))}
      </g>
    </svg>
  )
}

export default SynthwaveBg

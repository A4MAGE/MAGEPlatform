import { useEffect, useState } from "react"
import Carousel from "../components/Carousel.tsx"
import "../App.css"
import { Link } from "react-router-dom"
import { supabase } from "../supabaseClient"

function gradientForName(name = "") {
  let h1 = 0, h2 = 0
  for (let i = 0; i < name.length; i++) {
    h1 = (h1 * 31 + name.charCodeAt(i)) & 0xffff
    h2 = (h2 * 17 + name.charCodeAt(i)) & 0xffff
  }
  const hue1 = h1 % 360
  const hue2 = (hue1 + 60 + (h2 % 60)) % 360
  return `linear-gradient(135deg, hsl(${hue1},55%,28%), hsl(${hue2},60%,18%))`
}

const GENRES = ["Ambient", "Synthwave", "Dubstep", "Pop", "Hip Hop", "Experimental", "Cinematic"]

function genreForName(name = "") {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff
  return GENRES[h % GENRES.length]
}

const SECTIONS = [
  { label: "Trending This Week",   accent: "#76DBCA" },
  { label: "Built for the Drop",   accent: "#A3E635" },
  { label: "Synthwave Essentials", accent: "#FACC15" },
  { label: "Pop Ready",            accent: "#F472B6" },
  { label: "Hip Hop Foundations",  accent: "#FB923C" },
]

function toCarouselItem(p: any, idx: number) {
  return {
    id: idx,
    name: p.name ?? "Untitled",
    creator: p.username ?? "unknown",
    genre: genreForName(p.name),
    downloads: p.likes != null ? `${p.likes}` : "0",
    thumbnail: p.thumbnail_url ?? undefined,
  }
}

function fill(presets: any[], count = 10): any[] {
  if (!presets.length) return []
  const out = []
  for (let i = 0; i < count; i++) out.push(presets[i % presets.length])
  return out
}

function Explore() {
  const [presets, setPresets] = useState<any[]>([])

  useEffect(() => {
    if (!supabase) return
    supabase
      .from("preset_with_username")
      .select("id, name, description, thumbnail_url, username, likes")
      .then(({ data, error }: { data: any; error: any }) => {
        if (!error && data?.length) setPresets(data)
      })
  }, [])

  const featured = presets[0]
  const sectionItems = SECTIONS.map((_, i) => {
    const offset = i * 3
    const slice = [...presets.slice(offset), ...presets.slice(0, offset)]
    return fill(slice, 10).map((p, idx) => toCarouselItem(p, idx))
  })

  return (
    <div className="page">

      {/* Title card */}
      <div className="explore-title-card">
        <h1 className="explore-title">Explore</h1>
        <p className="explore-tagline">Presets crafted by the community.</p>
      </div>

      {/* Featured */}
      {featured && (
        <div className="featured-preset">
          <div className="featured-preset__card">
            <div className="featured-preset__body">
              <span className="featured-label">Featured</span>
              <h2 className="featured-name">{featured.name}</h2>
              <p className="featured-creator">by {featured.username ?? "unknown"}</p>
              {featured.description && (
                <p className="featured-desc">{featured.description}</p>
              )}
              <div className="featured-footer">
                {featured.likes != null && (
                  <span className="preset-downloads">♥ {featured.likes}</span>
                )}
                <Link to="/signup" className="try-btn">Try it in MAGE →</Link>
              </div>
            </div>
            <div
              className="featured-preset__visual"
              style={
                featured.thumbnail_url
                  ? { backgroundImage: `url(${featured.thumbnail_url})`, backgroundSize: "cover", backgroundPosition: "center" }
                  : { background: gradientForName(featured.name) }
              }
            />
          </div>
        </div>
      )}

      {/* Genre sections */}
      {presets.length > 0 && SECTIONS.map((section, i) => (
        <div
          key={section.label}
          className="explore-section"
          style={{ '--section-accent': section.accent } as React.CSSProperties}
        >
          <div className="section-header">
            <span className="section-accent-bar" />
            <h2 className="section-title">{section.label}</h2>
          </div>
          <Carousel items={sectionItems[i]} accent={section.accent} />
        </div>
      ))}

    </div>
  )
}

export default Explore

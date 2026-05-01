import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import "../App.css"
import useEmblaCarousel from 'embla-carousel-react'

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

interface PresetItem {
  id: number
  name: string
  creator: string
  genre: string
  downloads: string
  thumbnail?: string
}

interface CarouselProps {
  items: PresetItem[]
  accent: string
}

function Carousel({ items, accent }: CarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'center' })
  const [selectedIndex, setSelectedIndex] = useState(0)

  useEffect(() => {
    if (!emblaApi) return
    emblaApi.on('select', () => setSelectedIndex(emblaApi.selectedScrollSnap()))
  }, [emblaApi])

  const scrollPrev = () => emblaApi?.scrollPrev()
  const scrollNext = () => emblaApi?.scrollNext()

  const getSlideStyle = (index: number) => {
    let distance = Math.abs(index - selectedIndex)
    if (index === items.length - 1 && selectedIndex === 0) distance = 1
    else if (index === 0 && selectedIndex === items.length - 1) distance = 1

    const scale = Math.max(0.7, 1 - distance * 0.1)
    const opacity = Math.max(0.3, 1 - distance * 0.4)
    const blur = distance * 2
    return {
      transform: `scale(${scale})`,
      opacity,
      filter: `blur(${blur}px)`,
      transition: 'transform 0.3s ease, opacity 0.3s ease, filter 0.3s ease',
    }
  }

  return (
    <div className="carousel-wrapper">
      <button className="carousel-btn" onClick={scrollPrev}>←</button>
      <div className="embla" ref={emblaRef}>
        <div className="embla__container">
          {items.map((item, index) => (
            <div className="embla__slide" key={item.id}>
              <div className="carousel-slide-content" style={getSlideStyle(index)}>
                <div className="preset-card">
                  <div className="preset-card__visual" style={
                    item.thumbnail
                      ? { backgroundImage: `url(${item.thumbnail})`, backgroundSize: 'cover', backgroundPosition: 'center', borderBottom: `1px solid ${accent}30` }
                      : { background: gradientForName(item.name), borderBottom: `1px solid ${accent}30` }
                  } />
                  <div className="preset-card__body">
                    <div className="preset-card__top">
                      <span className="preset-card__name">{item.name}</span>
                    </div>
                    <span className="preset-card__creator">by {item.creator}</span>
                    <div className="preset-card__footer">
                      <div className="preset-card__footer-left">
                        <span className="preset-downloads">↓ {item.downloads}</span>
                        <span className="preset-tag" style={{ color: accent, borderColor: `${accent}60`, background: `${accent}12` }}>{item.genre}</span>
                      </div>
                      <Link to="/signup" className="try-btn-sm" style={{ color: accent, borderColor: `${accent}60` }}>
                        Try it →
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <button className="carousel-btn" onClick={scrollNext}>→</button>
    </div>
  )
}

export default Carousel

import "../App.css"
import useEmblaCarousel from 'embla-carousel-react'

const items = [
  { id: 1, title: 'Preset 1' },
  { id: 2, title: 'Preset 2' },
  { id: 3, title: 'Preset 3' },
];

function Carousel() {
  const [emblaRef] = useEmblaCarousel({ loop: true });

  const scrollPrev = () => emblaApi?.scrollPrev();
  const scrollNext = () => emblaApi?.scrollNext();

  return(
    <>
      <div className="carousel-wrapper">
        <button onClick={scrollPrev}>←</button>
        <div className="embla" ref={emblaRef}>
          <div className="embla__container">
            {items.map(item => (
              <div className="embla__slide" key={item.id}>
                {item.title}
              </div>
            ))}
          </div>
        </div>
        <button onClick={scrollNext}>→</button>
      </div>
    </>
  )
}

export default Carousel  

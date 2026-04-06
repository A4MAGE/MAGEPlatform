import { useState, useEffect } from 'react'
import "../App.css"
import useEmblaCarousel from 'embla-carousel-react'

const items = Array.from({ length: 10 }, (_, i) => ({ id: i, title: `Preset ${i}` }));

function Carousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'center' });
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', () => setSelectedIndex(emblaApi.selectedScrollSnap()));
  }, [emblaApi]);

  const scrollPrev = () => emblaApi?.scrollPrev();
  const scrollNext = () => emblaApi?.scrollNext();

  const getSlideStyle = (index) => {
    let distance = Math.abs(index - selectedIndex);
    
    // These if statements handle the edge cases of the beginning and ending items having a correct distance.
    // We don't need to worry about the edge case of the carousel only having 1 or 2 items, as 3 is required minimum for embla.
    if (index == items.length - 1 && selectedIndex == 0) {
      distance = 1;
    } else if (index == 0 && selectedIndex == items.length - 1) {
      distance = 1;
    }

    const scale = Math.max(0.7, 1 - distance * 0.1);
    const opacity = Math.max(0.3, 1 - distance * 0.4);
    const blur = distance * 2;
    return {
      transform: `scale(${scale})`,
      opacity,
      filter: `blur(${blur}px)`,
      transition: 'transform 0.3s ease, opacity 0.3s ease, filter 0.3s ease',
    };
  };

  return(
    <>
      <div className="carousel-wrapper">
        <button className="carousel-btn" onClick={scrollPrev}>←</button>
        <div className="embla" ref={emblaRef}>
          <div className="embla__container">
            {items.map((item, index) => (
              <div className="embla__slide" key={item.id}>
                {/* Content of slide needs to be in child div so it doesn't conflict with embla styling. */}
                <div className="carousel-slide-content" style={getSlideStyle(index)}>
                  {item.title}
                </div>
              </div>
            ))}
          </div>
        </div>
        <button className="carousel-btn" onClick={scrollNext}>→</button>
      </div>
    </>
  )
}

export default Carousel

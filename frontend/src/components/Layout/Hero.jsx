import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../utils/api';
import './Hero.css';

// Slides por defecto (se usan si la API no tiene datos)
const DEFAULT_SLIDES = [
  {
    id: 'default-1',
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?q=80&w=1600&auto=format&fit=crop",
    tag: "LUXE BOUTIQUE",
    title: "Tu nueva era",
    subtitle: "Moda premium que define tendencia. Descubre el estilo que buscabas.",
    ctaText: "Explorar",
    ctaLink: "/mujer",
  },
  {
    id: 'default-2',
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1600&auto=format&fit=crop",
    tag: "Y2K COLLECTION",
    title: "Retro es futuro",
    subtitle: "Piezas que mezclan nostalgia y vanguardia. Estilo que no pasa de moda.",
    ctaText: "Ver Colección",
    ctaLink: "/mujer",
  },
  {
    id: 'default-3',
    image: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?q=80&w=1600&auto=format&fit=crop",
    tag: "JUST DROPPED",
    title: "Diseñada para brillar",
    subtitle: "Nuevas piezas que definen tendencia. Sé la primera en tenerlas.",
    ctaText: "Ver Ahora",
    ctaLink: "/mujer",
  },
  {
    id: 'default-4',
    image: "https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=1600&auto=format&fit=crop",
    tag: "UP TO 40% OFF",
    title: "Estilo en oferta",
    subtitle: "Lo que buscas, a precios que no vas a querer perderte.",
    ctaText: "Comprar Ahora",
    ctaLink: "/rebajas",
  },
  {
    id: 'default-5',
    image: "https://images.unsplash.com/photo-1611085583191-a3b181a88401?q=80&w=1600&auto=format&fit=crop",
    tag: "EXCLUSIVE",
    title: "El toque final",
    subtitle: "Bolsas, joyería y complementos que elevan cualquier outfit.",
    ctaText: "Explorar",
    ctaLink: "/accesorios",
  },
];

function Hero() {
  const [slides, setSlides] = useState(DEFAULT_SLIDES);

  useEffect(() => {
    const fetchSlides = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/carousel`);
        if (res.ok) {
          const data = await res.json();
          const activeSlides = data
            .filter(s => s.active !== false && s.image && s.title)
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
          if (activeSlides.length > 0) {
            setSlides(activeSlides);
          }
        }
      } catch {
        // Si la API falla, se mantienen los slides por defecto
      }
    };
    fetchSlides();
  }, []);

  return (
    <div id="heroCarousel" className="carousel slide carousel-fade hero-carousel" data-bs-ride="carousel">
      {/* Indicators */}
      <div className="carousel-indicators luxe-indicators">
        {slides.map((slide, i) => (
          <button
            key={slide.id}
            type="button"
            data-bs-target="#heroCarousel"
            data-bs-slide-to={i}
            className={i === 0 ? "active" : ""}
            aria-current={i === 0 ? "true" : undefined}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>

      {/* Slides */}
      <div className="carousel-inner">
        {slides.map((slide, i) => (
          <div
            key={slide.id}
            className={`carousel-item hero-slide-item ${i === 0 ? 'active' : ''}`}
            data-bs-interval="5000"
          >
            <img src={slide.image} className="d-block w-100 hero-img" alt={slide.title} />
            <div className="carousel-caption luxe-caption text-start">
              {slide.tag && <span className="luxe-tag">{slide.tag}</span>}
              <h1 className="luxe-title">{slide.title}</h1>
              {slide.subtitle && (
                <p className="luxe-desc">{slide.subtitle}</p>
              )}
              {slide.ctaText && (
                <div className="luxe-btn-group">
                  <a href={slide.ctaLink || '#'} className="btn luxe-btn-primary">
                    {slide.ctaText}
                  </a>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <button className="carousel-control-prev luxe-control" type="button" data-bs-target="#heroCarousel" data-bs-slide="prev">
        <span className="carousel-control-prev-icon" aria-hidden="true"></span>
        <span className="visually-hidden">Anterior</span>
      </button>
      <button className="carousel-control-next luxe-control" type="button" data-bs-target="#heroCarousel" data-bs-slide="next">
        <span className="carousel-control-next-icon" aria-hidden="true"></span>
        <span className="visually-hidden">Siguiente</span>
      </button>
    </div>
  );
}

export default Hero;

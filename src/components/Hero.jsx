import React from 'react';
import './Hero.css';

// Premium high-resolution Unsplash fashion images for the luxury carousel
const slide1 = "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=1600&auto=format&fit=crop";
const slide2 = "https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=1600&auto=format&fit=crop";
const slide3 = "https://images.unsplash.com/photo-1617137968427-85924c800a22?q=80&w=1600&auto=format&fit=crop";

function Hero() {
  return (
    <div id="heroCarousel" className="carousel slide carousel-fade hero-carousel" data-bs-ride="carousel">
      {/* Indicators */}
      <div className="carousel-indicators luxe-indicators">
        <button
          type="button"
          data-bs-target="#heroCarousel"
          data-bs-slide-to="0"
          className="active"
          aria-current="true"
          aria-label="Slide 1"
        ></button>
        <button
          type="button"
          data-bs-target="#heroCarousel"
          data-bs-slide-to="1"
          aria-label="Slide 2"
        ></button>
        <button
          type="button"
          data-bs-target="#heroCarousel"
          data-bs-slide-to="2"
          aria-label="Slide 3"
        ></button>
      </div>

      {/* Slides */}
      <div className="carousel-inner">
        {/* Slide 1 */}
        <div className="carousel-item active hero-slide-item" data-bs-interval="5000">
          <img src={slide1} className="d-block w-100 hero-img" alt="Nueva Colección" />
          <div className="carousel-caption luxe-caption text-start">
            <span className="luxe-tag">NUEVA COLECCIÓN</span>
            <h1 className="luxe-title">Estilo que te define</h1>
            <p className="luxe-desc">
              Descubre prendas minimalistas y suéteres de lana premium diseñados para perdurar.
            </p>
            <div className="luxe-btn-group">
              <a href="/mujer" className="btn luxe-btn-primary">
                Explorar Colección
              </a>
              <a href="/rebajas" className="btn luxe-btn-secondary">
                Ver Rebajas
              </a>
            </div>
          </div>
        </div>

        {/* Slide 2 */}
        <div className="carousel-item hero-slide-item" data-bs-interval="5000">
          <img src={slide2} className="d-block w-100 hero-img" alt="Accesorios Exclusivos" />
          <div className="carousel-caption luxe-caption text-start">
            <span className="luxe-tag">EDICIÓN LIMITADA</span>
            <h1 className="luxe-title">Detalles que marcan la diferencia</h1>
            <p className="luxe-desc">
              Complementa tu outfit con nuestra joyería geométrica y bolsos de piel italiana.
            </p>
            <div className="luxe-btn-group">
              <a href="/accesorios" className="btn luxe-btn-primary">
                Ver Accesorios
              </a>
            </div>
          </div>
        </div>

        {/* Slide 3 */}
        <div className="carousel-item hero-slide-item" data-bs-interval="5000">
          <img src={slide3} className="d-block w-100 hero-img" alt="Colección Hombre" />
          <div className="carousel-caption luxe-caption text-start">
            <span className="luxe-tag">TENDENCIAS URBANAS</span>
            <h1 className="luxe-title">Sofisticación diaria</h1>
            <p className="luxe-desc">
              Explora abrigos, chaquetas y calzado que combinan comodidad y alta costura.
            </p>
            <div className="luxe-btn-group">
              <a href="/hombre" className="btn luxe-btn-primary">
                Comprar Hombre
              </a>
            </div>
          </div>
        </div>
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
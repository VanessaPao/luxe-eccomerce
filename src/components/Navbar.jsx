import React from 'react';
import './Navbar.css';

function Navbar() {
    return (
        <nav className="navbar navbar-expand-lg luxe-navbar sticky-top">
            <div className="container-fluid">
                {/* Brand/Logo */}
                <a className="navbar-brand luxe-brand" href="/">
                    LUXE.
                </a>

                {/* Mobile Toggler */}
                <button
                    className="navbar-toggler luxe-toggler"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#navbarLuxe"
                    aria-controls="navbarLuxe"
                    aria-expanded="false"
                    aria-label="Toggle navigation"
                >
                    <span className="luxe-toggler-icon"></span>
                </button>

                {/* Collapsible Menu */}
                <div className="collapse navbar-collapse align-items-center" id="navbarLuxe">
                    {/* Navigation Links */}
                    <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                        <li className="nav-item">
                            <a className="nav-link luxe-nav-link active" aria-current="page" href="/mujer">
                                Mujer
                            </a>
                        </li>
                        <li className="nav-item">
                            <a className="nav-link luxe-nav-link" href="/hombre">
                                Hombre
                            </a>
                        </li>
                        <li className="nav-item">
                            <a className="nav-link luxe-nav-link" href="/accesorios">
                                Accesorios
                            </a>
                        </li>
                        <li className="nav-item">
                            <a className="nav-link luxe-nav-link" href="/rebajas">
                                Rebajas
                            </a>
                        </li>
                    </ul>

                {/* Search Bar */}
                <div className="d-flex luxe-search-container mx-lg-4 my-2 my-lg-0">
                    <i className="bi bi-search luxe-search-icon"></i>
                    <input
                        className="form-control luxe-search-input"
                        type="search"
                        placeholder="Buscar productos..."
                        aria-label="Search"
                    />
                </div>

                {/* Right Action Icons */}
                <div className="luxe-actions-group">
                    <a className="luxe-icon-btn" href="/favoritos" aria-label="Favoritos">
                        <i className="bi bi-heart"></i>
                    </a>
                    <a className="luxe-icon-btn" href="/cuenta" aria-label="Mi Cuenta">
                        <i className="bi bi-person"></i>
                    </a>
                    <a className="luxe-icon-btn" href="/carrito" aria-label="Carrito">
                        <i className="bi bi-bag"></i>

                    </a>
                </div>
            </div>
        </div>
        </nav >
    );
}

export default Navbar;

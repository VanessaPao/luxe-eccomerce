import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { logout } from '../../firebase/auth';
import { useTheme } from '../../context/ThemeContext';
import './Navbar.css';

function Navbar() {
    const { user, profile } = useAuth();
    const { totalItems } = useCart();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    return (
        <nav className="navbar navbar-expand-lg luxe-navbar sticky-top">
            <div className="container-fluid">
                {/* Brand/Logo */}
                <Link className="navbar-brand luxe-brand" to="/">
                    LUXE.
                </Link>

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
                            <NavLink className="nav-link luxe-nav-link" to="/mujer" aria-current="page">
                                Mujer
                            </NavLink>
                        </li>
                        <li className="nav-item">
                            <NavLink className="nav-link luxe-nav-link" to="/hombre">
                                Hombre
                            </NavLink>
                        </li>
                        <li className="nav-item">
                            <NavLink className="nav-link luxe-nav-link" to="/accesorios">
                                Accesorios
                            </NavLink>
                        </li>
                        <li className="nav-item">
                            <NavLink className="nav-link luxe-nav-link" to="/rebajas">
                                Rebajas
                            </NavLink>
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
                    <div className="luxe-actions-group d-flex align-items-center">
                        <button
                            className="luxe-icon-btn"
                            onClick={toggleTheme}
                            aria-label="Cambiar tema"
                            title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
                            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                            <i className={`bi ${theme === 'dark' ? 'bi-sun' : 'bi-moon'}`}></i>
                        </button>
                        <Link className="luxe-icon-btn position-relative" to="/favoritos" aria-label="Favoritos">
                            <i className="bi bi-heart"></i>
                        </Link>
                        
                        <Link className="luxe-icon-btn position-relative" to="/carrito" aria-label="Carrito">
                            <i className="bi bi-cart3"></i>
                            {totalItems > 0 && (
                                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '0.65rem' }}>
                                    {totalItems}
                                </span>
                            )}
                        </Link>

                        {user ? (
                            <div className="dropdown">
                                <button className="btn btn-link luxe-icon-btn dropdown-toggle text-decoration-none" type="button" id="userMenu" data-bs-toggle="dropdown" aria-expanded="false" style={{ padding: 0, border: 'none' }}>
                                    <i className="bi bi-person-check-fill" style={{ color: '#d4af37' }}></i>
                                </button>
                                <ul className="dropdown-menu dropdown-menu-end luxe-dropdown-menu" aria-labelledby="userMenu">
                                    <li><span className="dropdown-item-text luxe-dropdown-text">{profile?.firstName || user.email}</span></li>
                                    <li><hr className="dropdown-divider luxe-dropdown-divider" /></li>
                                    <li>
                                        <Link className="dropdown-item luxe-dropdown-item" to="/perfil">
                                            <i className="bi bi-person" style={{ marginRight: '8px' }}></i>Mi Perfil
                                        </Link>
                                    </li>
                                    <li>
                                        <Link className="dropdown-item luxe-dropdown-item" to="/mis-pedidos">
                                            <i className="bi bi-box" style={{ marginRight: '8px' }}></i>Mis Pedidos
                                        </Link>
                                    </li>
                                    <li>
                                        <Link className="dropdown-item luxe-dropdown-item" to="/favoritos">
                                            <i className="bi bi-heart" style={{ marginRight: '8px' }}></i>Favoritos
                                        </Link>
                                    </li>
                                    {profile?.role === 'admin' && (
                                        <li>
                                            <Link className="dropdown-item luxe-dropdown-item" to="/admin">
                                                <i className="bi bi-shield-lock" style={{ marginRight: '8px' }}></i>Panel Admin
                                            </Link>
                                        </li>
                                    )}
                                    {(profile?.role === 'support' || profile?.role === 'admin') && (
                                        <li>
                                            <Link className="dropdown-item luxe-dropdown-item" to="/soporte">
                                                <i className="bi bi-headset" style={{ marginRight: '8px' }}></i>Panel Soporte
                                            </Link>
                                        </li>
                                    )}
                                    <li>
                                        <Link className="dropdown-item luxe-dropdown-item" to="/mis-tickets">
                                            <i className="bi bi-ticket-perforated" style={{ marginRight: '8px' }}></i>Mis Tickets
                                        </Link>
                                    </li>
                                    <li><hr className="dropdown-divider luxe-dropdown-divider" /></li>
                                    <li><button className="dropdown-item luxe-dropdown-item text-danger" onClick={handleLogout}>Cerrar sesión</button></li>
                                </ul>
                            </div>
                        ) : (
                            <Link className="luxe-icon-btn" to="/login" aria-label="Perfil">
                                <i className="bi bi-person-circle"></i>
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}

export default Navbar;

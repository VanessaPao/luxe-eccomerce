import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Layout/Navbar';
import Hero from './components/Layout/Hero';
import Mujer from './pages/Catalog/Mujer';
import Hombre from './pages/Catalog/Hombre';
import Accesorios from './pages/Catalog/Accesorios';
import Rebajas from './pages/Catalog/Rebajas';
import Login from './pages/Auth/Login';
import Cart from './pages/CheckoutFlow/Cart';
import Favourites from './pages/Favourites';
import Profile from './pages/Profile/Profile';
import Checkout from './pages/CheckoutFlow/Checkout';
import PaymentSuccess from './pages/CheckoutFlow/PaymentSuccess';
import PaymentCancel from './pages/CheckoutFlow/PaymentCancel';
import ProductDetail from './pages/Catalog/ProductDetail';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminDashboard from './pages/admin/AdminDashboard';
import SupportDashboard from './pages/admin/SupportDashboard';
import ChatPopup from './components/ChatPopup';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <Router>
            <Navbar />
            <Routes>
              {/* Página de inicio — sin sidebar */}
              <Route path="/" element={<Hero />} />

              {/* Páginas de categoría — con sidebar de filtros */}
              <Route path="/mujer" element={<Mujer />} />
              <Route path="/hombre" element={<Hombre />} />
              <Route path="/accesorios" element={<Accesorios />} />
              <Route path="/rebajas" element={<Rebajas />} />

              {/* Detalle de producto — :id es el ID del documento en Firestore */}
              <Route path="/productos/:id" element={<ProductDetail />} />

              {/* Nuevas páginas */}
              <Route path="/login" element={<Login />} />
              <Route path="/carrito" element={<Cart />} />
              <Route path="/favoritos" element={<Favourites />} />

              {/* Perfil de Usuario */}
              <Route
                path="/perfil"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/mis-pedidos"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />

              {/* Checkout & Pagos */}
              <Route
                path="/checkout"
                element={
                  <ProtectedRoute>
                    <Checkout />
                  </ProtectedRoute>
                }
              />
              <Route path="/success" element={<PaymentSuccess />} />
              <Route path="/cancel" element={<PaymentCancel />} />

              {/* Admin */}
              <Route
                path="/admin/*"
                element={
                  <ProtectedRoute requireAdmin={true}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Soporte — accesible para rol 'support' y 'admin' */}
              <Route
                path="/soporte"
                element={
                  <ProtectedRoute requireSupport={true}>
                    <SupportDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Mis tickets — accesible para cualquier usuario autenticado (cliente) */}
              <Route
                path="/mis-tickets"
                element={
                  <ProtectedRoute>
                    <SupportDashboard />
                  </ProtectedRoute>
                }
              />
            </Routes>
            <ChatPopup />
            <footer className="site-footer">
              <span>LUXE. 2026</span>
            </footer>
          </Router>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

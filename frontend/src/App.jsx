import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Mujer from './pages/Mujer';
import Hombre from './pages/Hombre';
import Accesorios from './pages/Accesorios';
import Rebajas from './pages/Rebajas';
import Login from './pages/Login';
import Cart from './pages/Cart';
import Favourites from './pages/Favourites';
import Profile from './pages/Profile/Profile';
import Checkout from './pages/Checkout';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentCancel from './pages/PaymentCancel';
import ProductDetail from './pages/ProductDetail';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminDashboard from './pages/admin/AdminDashboard';

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
          </Routes>
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

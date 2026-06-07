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
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminDashboard from './pages/admin/AdminDashboard';

function App() {
  return (
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
            
            {/* Nuevas páginas */}
            <Route path="/login" element={<Login />} />
            <Route path="/carrito" element={<Cart />} />
            <Route path="/favoritos" element={<Favourites />} />
            
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
  );
}

export default App;

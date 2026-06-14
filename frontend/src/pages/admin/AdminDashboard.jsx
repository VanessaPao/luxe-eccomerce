import React, { useState } from 'react';
import ProductList from './ProductList';
import ProductForm from './ProductForm';
import SupportSupervision from './SupportSupervision';
import { useAuth } from '../../context/AuthContext';
import { BarChart3, ShoppingBag, Headphones } from 'lucide-react';
import './Admin.css';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('products');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleOpenForm = (product = null) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setEditingProduct(null);
    setIsFormOpen(false);
    setRefreshKey(k => k + 1);
  };

  return (
    <div className="admin-dashboard">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <h2>LUXE Admin</h2>
          <p className="admin-user">{user?.email}</p>
        </div>
        <nav className="admin-nav">
          <button 
            className={`admin-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <BarChart3 size={16} /> Dashboard
          </button>
          <button 
            className={`admin-nav-item ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => setActiveTab('products')}
          >
            <ShoppingBag size={16} /> Productos
          </button>
          <button 
            className={`admin-nav-item ${activeTab === 'support' ? 'active' : ''}`}
            onClick={() => setActiveTab('support')}
          >
            <Headphones size={16} /> Supervisión Soporte
          </button>
        </nav>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <h1>
            {activeTab === 'products' 
              ? 'Gestión de Productos' 
              : activeTab === 'support' 
                ? 'Supervisión de Soporte' 
                : 'Panel de Control'}
          </h1>
          {activeTab === 'products' && !isFormOpen && (
            <button className="btn-primary" onClick={() => handleOpenForm()}>
              + Añadir Producto
            </button>
          )}
        </header>

        <div className="admin-content">
          {activeTab === 'dashboard' && (
            <div className="dashboard-widgets">
              <div className="widget">
                <h3>Bienvenido a LUXE Admin</h3>
                <p>Selecciona una opción del menú lateral para comenzar a administrar tu tienda.</p>
              </div>
            </div>
          )}

          {activeTab === 'products' && (
            <>
              {isFormOpen ? (
                <ProductForm 
                  editingProduct={editingProduct} 
                  onSave={handleCloseForm} 
                  onCancel={handleCloseForm} 
                />
              ) : (
                <ProductList onEditProduct={handleOpenForm} refreshKey={refreshKey} />
              )}
            </>
          )}

          {activeTab === 'support' && <SupportSupervision />}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;

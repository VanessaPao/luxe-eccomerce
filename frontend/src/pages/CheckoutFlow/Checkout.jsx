import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { saveUserAddress } from '../../firebase/firestore';
import { functions } from '../../firebase/config';
import { httpsCallable } from 'firebase/functions';
import { API_BASE_URL } from '../../utils/api';
import { MapPin, CreditCard } from 'lucide-react';
import './Checkout.css';

export default function Checkout() {
  const { user, profile, loading: authLoading } = useAuth();
  const { items, totalPrice } = useCart();
  const navigate = useNavigate();

  // Estados locales para el formulario de dirección
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState({
    street: '',
    number: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: '',
  });

  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('stripe'); // 'stripe' | 'mercadopago'
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Sincronizar datos del perfil cuando esté cargado
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/carrito');
        return;
      }
      if (profile) {
        setPhone(profile.phone || '');
        if (profile.address) {
          setAddress({
            street: profile.address.street || '',
            number: profile.address.number || '',
            neighborhood: profile.address.neighborhood || '',
            city: profile.address.city || '',
            state: profile.address.state || '',
            zipCode: profile.address.zipCode || '',
          });
        }
      }
    }
  }, [profile, authLoading, user, navigate]);

  // Si no hay productos en el carrito, redirigir
  useEffect(() => {
    if (!authLoading && items.length === 0) {
      navigate('/carrito');
    }
  }, [items, authLoading, navigate]);

  // Verificar si ya existe una dirección completa y válida guardada
  const hasSavedAddress = 
    phone.trim() !== '' &&
    address.street.trim() !== '' &&
    address.number.trim() !== '' &&
    address.neighborhood.trim() !== '' &&
    address.city.trim() !== '' &&
    address.state.trim() !== '' &&
    address.zipCode.trim() !== '';

  const showForm = !hasSavedAddress || isEditingAddress;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      setPhone(value);
    } else {
      setAddress((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Guardar dirección en Firestore
  const handleSaveAddress = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (!phone.trim()) {
      setErrorMessage('El teléfono es obligatorio.');
      return;
    }
    // Validar que todos los campos de dirección estén llenos
    for (const key in address) {
      if (!address[key].trim()) {
        setErrorMessage('Todos los campos de la dirección son obligatorios.');
        return;
      }
    }

    try {
      await saveUserAddress(user.uid, phone, address);
      setIsEditingAddress(false);
    } catch (err) {
      console.error(err);
      setErrorMessage('Error al guardar la dirección en la base de datos.');
    }
  };

  // Procesar compra
  const handlePayment = async () => {
    setErrorMessage('');
    if (!hasSavedAddress) {
      setErrorMessage('Debes guardar una dirección de envío antes de pagar.');
      return;
    }

    setLoadingPayment(true);

    try {
      if (paymentMethod === 'stripe') {
        // En lugar de usar Cloud Functions, ahora llamamos a nuestro servidor Express
        const response = await fetch(`${API_BASE_URL}/api/checkout`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          // Pasamos los productos y la información del usuario al backend Express
          body: JSON.stringify({
            items,
            userId: user.uid,
            shippingAddress: { phone, address }
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Error al conectar con el servidor.');
        }

        const data = await response.json();

        // Redirigir a la sesión de Checkout de Stripe
        if (data.url) {
          window.location.href = data.url;
        } else {
          throw new Error('No se recibió la URL de pago de Stripe.');
        }
      } else {
        // Simulación para Mercado Pago con Express
        const checkoutItems = items.map((i) => ({
          productId: i.productId || i.id,
          name: i.name,
          price: i.price,
          quantity: i.quantity || 1,
          image: i.image,
        }));

        const response = await fetch(`${API_BASE_URL}/api/checkout/mercadopago`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: checkoutItems,
            total: totalPrice,
            userId: user.uid,
            shippingAddress: {
              phone,
              address,
            },
          }),
        });

        if (!response.ok) {
          throw new Error('Error al simular orden de Mercado Pago en el servidor.');
        }

        const data = await response.json();

        if (data.success && data.orderId) {
          navigate(`/success?order_id=${data.orderId}&method=mercadopago`);
        } else {
          throw new Error('No se generó el ID de la orden para Mercado Pago.');
        }
      }
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message || 'Ocurrió un error al procesar tu pago. Intenta de nuevo.');
      setLoadingPayment(false);
    }
  };

  if (authLoading || items.length === 0) {
    return <div className="checkout-page" style={{ textAlign: 'center', padding: '5rem 0' }}>Cargando datos del pedido...</div>;
  }

  return (
    <div className="checkout-page">
      <h1 className="checkout-title">Finalizar Compra</h1>

      <div className="checkout-layout">
        {/* Lado izquierdo: Dirección y Pago */}
        <div className="checkout-left">
          
          {/* Sección Dirección */}
          <section className="checkout-section">
            <h2>
              <span><MapPin size={18} /></span> 1. Dirección de Envío
            </h2>
            
            {showForm ? (
              <form onSubmit={handleSaveAddress} className="checkout-form">
                <div className="form-group-checkout">
                  <label>Teléfono de contacto</label>
                  <input
                    type="tel"
                    name="phone"
                    value={phone}
                    onChange={handleInputChange}
                    placeholder="Ej. +52 5512345678"
                    required
                  />
                </div>
                
                <div className="form-grid">
                  <div className="form-group-checkout">
                    <label>Calle</label>
                    <input
                      type="text"
                      name="street"
                      value={address.street}
                      onChange={handleInputChange}
                      placeholder="Calle o Av."
                      required
                    />
                  </div>
                  <div className="form-group-checkout">
                    <label>Número</label>
                    <input
                      type="text"
                      name="number"
                      value={address.number}
                      onChange={handleInputChange}
                      placeholder="Ext e Int"
                      required
                    />
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group-checkout">
                    <label>Colonia</label>
                    <input
                      type="text"
                      name="neighborhood"
                      value={address.neighborhood}
                      onChange={handleInputChange}
                      placeholder="Colonia o Sector"
                      required
                    />
                  </div>
                  <div className="form-group-checkout">
                    <label>Ciudad</label>
                    <input
                      type="text"
                      name="city"
                      value={address.city}
                      onChange={handleInputChange}
                      placeholder="Ciudad"
                      required
                    />
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group-checkout">
                    <label>Estado</label>
                    <input
                      type="text"
                      name="state"
                      value={address.state}
                      onChange={handleInputChange}
                      placeholder="Estado"
                      required
                    />
                  </div>
                  <div className="form-group-checkout">
                    <label>Código Postal</label>
                    <input
                      type="text"
                      name="zipCode"
                      value={address.zipCode}
                      onChange={handleInputChange}
                      placeholder="C.P."
                      required
                    />
                  </div>
                </div>

                {errorMessage && <div className="checkout-error">{errorMessage}</div>}

                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                  <button type="submit" className="btn-checkout-save">
                    Guardar Dirección
                  </button>
                  {hasSavedAddress && (
                    <button
                      type="button"
                      className="btn-checkout-secondary"
                      onClick={() => setIsEditingAddress(false)}
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </form>
            ) : (
              <div className="address-info-display">
                <p><strong>Teléfono:</strong> {phone}</p>
                <p>
                  <strong>Dirección:</strong> {address.street} #{address.number}, Col.{' '}
                  {address.neighborhood}, {address.city}, {address.state}, C.P.{' '}
                  {address.zipCode}
                </p>
                <button
                  type="button"
                  className="btn-checkout-secondary"
                  style={{ marginTop: '1rem' }}
                  onClick={() => setIsEditingAddress(true)}
                >
                  Modificar dirección
                </button>
              </div>
            )}
          </section>

          {/* Sección Métodos de Pago */}
          <section className="checkout-section">
            <h2>
              <span><CreditCard size={18} /></span> 2. Método de Pago
            </h2>
            
            <div className="payment-selector">
              {/* Stripe */}
              <div
                className={`payment-option ${paymentMethod === 'stripe' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('stripe')}
              >
                <div className="payment-label">
                  <div className="payment-radio">
                    <div className="payment-radio-dot" />
                  </div>
                  Stripe (Tarjeta de crédito/débito)
                </div>
                <img
                  src="https://images.unsplash.com/photo-1574634534894-89d7576c8259?w=80&auto=format&fit=crop&q=60"
                  alt="Stripe"
                  className="payment-logo"
                  style={{ borderRadius: '4px' }}
                />
              </div>

              {/* Mercado Pago */}
              <div
                className={`payment-option ${paymentMethod === 'mercadopago' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('mercadopago')}
              >
                <div className="payment-label">
                  <div className="payment-radio">
                    <div className="payment-radio-dot" />
                  </div>
                  Mercado Pago (Simulación de Orden)
                </div>
                <img
                  src="https://images.unsplash.com/photo-1627634777217-c864268db30c?w=80&auto=format&fit=crop&q=60"
                  alt="Mercado Pago"
                  className="payment-logo"
                  style={{ borderRadius: '4px' }}
                />
              </div>
            </div>
          </section>
        </div>

        {/* Lado derecho: Resumen del Pedido */}
        <div className="checkout-right">
          <aside className="checkout-section">
            <h2>Resumen del Pedido</h2>
            
            <ul className="checkout-items">
              {items.map((item) => (
                <li key={item.productId || item.id} className="checkout-item">
                  <img src={item.image} alt={item.name} className="checkout-item-img" />
                  <div className="checkout-item-info">
                    <h4 className="checkout-item-name">{item.name}</h4>
                    <span className="checkout-item-qty">Cant: {item.quantity || 1}</span>
                  </div>
                  <span className="checkout-item-price">
                    ${(item.price * (item.quantity || 1)).toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="summary-rows">
              <div className="summary-row">
                <span>Subtotal</span>
                <span>${totalPrice.toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span>Envío</span>
                <span style={{ color: '#2ec4b6', fontWeight: 'bold' }}>Gratis</span>
              </div>
              <div className="summary-row total">
                <span>Total</span>
                <span>${totalPrice.toFixed(2)}</span>
              </div>
            </div>

            {errorMessage && !showForm && (
              <div className="checkout-error" style={{ marginTop: '1rem' }}>
                {errorMessage}
              </div>
            )}

            <button
              className="btn-pay-checkout"
              onClick={handlePayment}
              disabled={loadingPayment || showForm || !hasSavedAddress}
            >
              {loadingPayment ? 'Procesando...' : `Pagar con ${paymentMethod === 'stripe' ? 'Stripe' : 'Mercado Pago'}`}
            </button>
          </aside>
        </div>
      </div>
    </div>
  );
}

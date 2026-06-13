import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../utils/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import './ChatPopup.css';

/* ─── AI Chat Tab ─────────────────────────────────────────────────────────── */
function AiChat() {
  const [messages, setMessages] = useState([
    { sender: 'bot', text: '¡Hola! Bienvenido a LUXE. Soy tu asistente virtual de estilo. ¿Te gustaría buscar alguna prenda, accesorio o tienes dudas sobre tu pedido?' }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [addedIds, setAddedIds] = useState({});
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  const { addItem } = useCart();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    const userMessage = { sender: 'user', text: inputText };
    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage.text, history: messages.slice(1) }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Error al conectar con la IA.');
      }
      const data = await response.json();
      setMessages((prev) => [...prev, { sender: 'bot', text: data.reply, products: data.products || [] }]);
    } catch (error) {
      setMessages((prev) => [...prev, { sender: 'bot', text: error.message }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCart = (product) => {
    addItem({ id: product.id, name: product.name, price: product.price, image: product.image, sale: product.sale }, 1);
    setAddedIds(prev => ({ ...prev, [product.id]: true }));
    setTimeout(() => setAddedIds(prev => ({ ...prev, [product.id]: false })), 2000);
  };

  const handleViewProduct = (productId) => {
    navigate(`/productos/${productId}`);
  };

  return (
    <>
      <div className="chat-messages">
        {messages.map((msg, index) => (
          <div key={index}>
            <div className={`chat-bubble ${msg.sender}`}>{msg.text}</div>
            {msg.sender === 'bot' && msg.products && msg.products.length > 0 && (
              <div className="chat-product-cards">
                {msg.products.map((product) => (
                  <div key={product.id} className="chat-product-card">
                    <img src={product.image} alt={product.name} className="chat-product-img" onError={e => { e.target.style.display = 'none'; }} />
                    <div className="chat-product-info">
                      <p className="chat-product-name">{product.name}</p>
                      {product.reason && <p className="chat-product-reason">{product.reason}</p>}
                      <div className="chat-product-price">
                        ${product.price.toLocaleString('es-MX')}
                        {product.sale && product.originalPrice && (
                          <span className="chat-product-original">${product.originalPrice.toLocaleString('es-MX')}</span>
                        )}
                      </div>
                    </div>
                    <div className="chat-product-actions">
                      <button className="chat-product-btn view" onClick={() => handleViewProduct(product.id)}>Ver</button>
                      <button className={`chat-product-btn add ${addedIds[product.id] ? 'added' : ''}`} onClick={() => handleAddToCart(product)}>
                        {addedIds[product.id] ? '✓' : '+'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="chat-bubble bot">
            <div className="chat-thinking"><span /><span /><span /></div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSend} className="chat-input-area">
        <input
          type="text"
          className="chat-input"
          placeholder="Pregunta sobre productos, tallas, ofertas..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={isLoading}
        />
        <button type="submit" className="chat-send-btn" disabled={isLoading || !inputText.trim()}>➔</button>
      </form>
    </>
  );
}

/* ─── Support Chat Tab ────────────────────────────────────────────────────── */
function SupportChat({ user, profile }) {
  const [tickets, setTickets] = useState([]);
  const [activeTicket, setActiveTicket] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  // ── Cargar lista de tickets vía Backend ─────────────────────────────────────
  const fetchTickets = async () => {
    if (!user) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/support/tickets/user/${user.uid}`);
      if (res.ok) {
        const list = await res.json();
        setTickets(list);
        setActiveTicket(prev => {
          if (!prev) return null;
          return list.find(t => t.id === prev.id) || prev;
        });
      }
    } catch (err) {
      console.error('Error cargando tickets:', err);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [user]);

  // ── Snapshot en tiempo real SOLO para el ticket activo (chat en vivo) ──────
  useEffect(() => {
    if (!activeTicket) return;
    const unsub = onSnapshot(doc(db, 'supportTickets', activeTicket.id), (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      const updated = {
        id: snap.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() ?? null,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() ?? null,
      };
      setActiveTicket(updated);
      setTickets(prev => prev.map(t => t.id === updated.id ? updated : t));
    });
    return () => unsub();
  }, [activeTicket?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeTicket?.messages]);

  const handleCreateTicket = async () => {
    if (!newSubject.trim() || !newMessage.trim()) return;
    setCreating(true);
    try {
      const clientName = profile?.firstName ? `${profile.firstName} ${profile.lastName || ''}`.trim() : user.displayName || 'Cliente';
      const res = await fetch(`${API_BASE_URL}/api/support/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          userName: clientName,
          userEmail: user.email || '',
          subject: newSubject.trim(),
          message: newMessage.trim(),
        }),
      });
      if (!res.ok) throw new Error('Error al crear ticket');
      const { id } = await res.json();
      setNewSubject('');
      setNewMessage('');
      setShowForm(false);
      await fetchTickets();
      setActiveTicket({ id });
    } catch (err) {
      console.error('Error creando ticket:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !activeTicket) return;
    setSending(true);
    try {
      const clientName = profile?.firstName || 'Cliente';
      await fetch(`${API_BASE_URL}/api/support/tickets/${activeTicket.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: user.uid,
          senderRole: 'user',
          senderName: clientName,
          text: replyText.trim(),
        }),
      });
      setReplyText('');
    } catch (err) {
      console.error('Error enviando mensaje:', err);
    } finally {
      setSending(false);
    }
  };

  const STATUS_COLORS = { open: '#22c55e', in_progress: '#f59e0b', resolved: '#6366f1', closed: '#6b7280' };
  const STATUS_LABELS = { open: 'Abierto', in_progress: 'En Progreso', resolved: 'Resuelto', closed: 'Cerrado' };

  if (!user) {
    return (
      <div className="support-chat-empty">
        <div className="support-chat-empty-icon">🔐</div>
        <p>Inicia sesión para contactar a soporte</p>
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="support-chat-form">
        <div className="support-chat-form-header">
          <button className="support-back-btn" onClick={() => setShowForm(false)}>← Volver</button>
          <span>Nuevo Ticket</span>
        </div>
        <div className="support-chat-form-body">
          <label>Asunto</label>
          <input
            type="text"
            placeholder="ej. Problema con mi pedido"
            value={newSubject}
            onChange={e => setNewSubject(e.target.value)}
            className="support-form-input"
          />
          <label>Describe tu problema</label>
          <textarea
            placeholder="Cuéntanos qué sucedió..."
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            className="support-form-textarea"
            rows={5}
          />
          <button
            className="support-send-btn"
            onClick={handleCreateTicket}
            disabled={creating || !newSubject.trim() || !newMessage.trim()}
          >
            {creating ? 'Enviando...' : '✦ Enviar Solicitud'}
          </button>
        </div>
      </div>
    );
  }

  if (activeTicket) {
    const ticket = tickets.find(t => t.id === activeTicket.id) || activeTicket;
    const isClosed = ticket.status === 'closed' || ticket.status === 'resolved';
    return (
      <div className="support-live-chat">
        <div className="support-live-header">
          <button className="support-back-btn" onClick={() => setActiveTicket(null)}>← Tickets</button>
          <div className="support-live-title">
            <span>{ticket.subject}</span>
            <span className="support-status-dot" style={{ background: STATUS_COLORS[ticket.status] || '#888' }}>
              {STATUS_LABELS[ticket.status] || ticket.status}
            </span>
          </div>
        </div>
        <div className="support-live-messages">
          {(ticket.messages || []).map((msg, i) => (
            <div key={i} className={`support-msg-bubble ${msg.sender === 'user' ? 'mine' : 'theirs'}`}>
              <span className="support-msg-name">
                {msg.sender === 'user' ? 'Tú' : `🎧 ${msg.senderName || 'Soporte LUXE'}`}
              </span>
              <div className="support-msg-text">{msg.text}</div>
              <span className="support-msg-time">
                {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) : ''}
              </span>
            </div>
          ))}
          {(ticket.messages || []).length === 0 && (
            <div className="support-chat-empty" style={{ marginTop: '2rem' }}>
              <p style={{ fontSize: '0.8rem', color: '#888' }}>En breve un agente atenderá tu solicitud.</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        {!isClosed ? (
          <div className="support-live-input">
            <textarea
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendReply(); } }}
              placeholder="Escribe tu mensaje..."
              rows={2}
              className="support-reply-textarea"
            />
            <button
              className="chat-send-btn"
              onClick={handleSendReply}
              disabled={sending || !replyText.trim()}
            >
              ➔
            </button>
          </div>
        ) : (
          <div className="support-closed-notice">
            Este ticket ha sido {STATUS_LABELS[ticket.status].toLowerCase()}. <br />
            <button onClick={() => setShowForm(true)} className="support-new-link">Abrir nuevo ticket</button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="support-ticket-list-view">
      <div className="support-ticket-list-header">
        <span>Mis Solicitudes</span>
        <button className="support-new-ticket-btn" onClick={() => setShowForm(true)}>+ Nuevo</button>
      </div>
      <div className="support-ticket-scroll">
        {tickets.length === 0 ? (
          <div className="support-chat-empty">
            <div className="support-chat-empty-icon">🎫</div>
            <p>No tienes tickets todavía</p>
            <button className="support-send-btn" style={{ marginTop: '1rem' }} onClick={() => setShowForm(true)}>
              Contactar Soporte
            </button>
          </div>
        ) : (
          tickets.map(ticket => (
            <div key={ticket.id} className="support-ticket-row" onClick={() => setActiveTicket(ticket)}>
              <div className="support-ticket-row-top">
                <span className="support-ticket-row-subject">{ticket.subject}</span>
                <span className="support-ticket-row-badge" style={{ background: STATUS_COLORS[ticket.status] || '#888' }}>
                  {STATUS_LABELS[ticket.status] || ticket.status}
                </span>
              </div>
              <div className="support-ticket-row-preview">
                {ticket.messages?.[ticket.messages.length - 1]?.text || '—'}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ─── Main ChatPopup ──────────────────────────────────────────────────────── */
export default function ChatPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('ai');
  const { user, profile } = useAuth();

  return (
    <>
      {/* FAB */}
      <button className="chat-fab" onClick={() => setIsOpen(!isOpen)} aria-label="Abrir chat">
        {isOpen ? '✕' : '✨'}
      </button>

      {/* Widget */}
      <div className={`chat-widget ${isOpen ? 'open' : ''}`}>
        {/* Header */}
        <div className="chat-header">
          <div className="chat-header-info">
            <div className="chat-bot-avatar">L</div>
            <div>
              <h3 className="chat-header-title">
                {activeTab === 'ai' ? 'LUXE Assistant' : 'Centro de Soporte'}
              </h3>
              <p className="chat-header-status">
                {activeTab === 'ai' ? 'Online • Inteligencia Artificial' : 'Soporte Humano • En línea'}
              </p>
            </div>
          </div>
          <button className="chat-close-btn" onClick={() => setIsOpen(false)} aria-label="Cerrar chat">✕</button>
        </div>

        {/* Tabs */}
        <div className="chat-tabs">
          <button
            className={`chat-tab-btn ${activeTab === 'ai' ? 'active' : ''}`}
            onClick={() => setActiveTab('ai')}
          >
            ✨ Asistente IA
          </button>
          <button
            className={`chat-tab-btn ${activeTab === 'support' ? 'active' : ''}`}
            onClick={() => setActiveTab('support')}
          >
            🎧 Soporte
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'ai' ? (
          <AiChat />
        ) : (
          <SupportChat user={user} profile={profile} />
        )}
      </div>
    </>
  );
}

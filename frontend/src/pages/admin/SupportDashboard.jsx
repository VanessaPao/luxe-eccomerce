import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL, authFetch } from '../../utils/api';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Headphones, Ticket, User, Send, Sparkles, X } from 'lucide-react';
import './SupportDashboard.css';

const STATUS_LABELS = {
  open: 'Abierto',
  in_progress: 'En Progreso',
  resolved: 'Resuelto',
  closed: 'Cerrado',
};

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('es-MX', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function SupportDashboard() {
  const { user, profile } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('all');
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [creatingTicket, setCreatingTicket] = useState(false);
  const messagesEndRef = useRef(null);

  const isSupport = profile?.role === 'support' || profile?.role === 'admin';

  // ── Cargar lista de tickets vía Backend ─────────────────────────────────────
  const fetchTickets = async ({ initial = false } = {}) => {
    if (!user) return;
    if (initial) setLoading(true);
    try {
      let url;
      if (isSupport) {
        url = `${API_BASE_URL}/api/support/tickets`;
      } else {
        url = `${API_BASE_URL}/api/support/tickets/user/${user.uid}`;
      }
      const res = await authFetch(url);
      if (res.ok) {
        const list = await res.json();
        setTickets(list);
        setSelected(prev => {
          if (!prev) return null;
          const updated = list.find(t => t.id === prev.id);
          return updated || prev;
        });
      }
    } catch (err) {
      console.error('Error cargando tickets:', err);
    } finally {
      if (initial) setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets({ initial: true });
  }, [user, isSupport]);

  // ── Snapshot en tiempo real SOLO para el ticket seleccionado (chat en vivo) ──
  useEffect(() => {
    if (!selected) return;
    const unsub = onSnapshot(doc(db, 'supportTickets', selected.id), (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      const updated = {
        id: snap.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() ?? data.createdAt ?? null,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() ?? data.updatedAt ?? null,
      };
      setSelected(updated);
      setTickets(prev => prev.map(t => t.id === updated.id ? updated : t));
    });
    return () => unsub();
  }, [selected?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selected?.messages]);

  // ── Filters ────────────────────────────────────────────────────────────
  const filteredTickets = tickets.filter(t =>
    filter === 'all' ? true : t.status === filter
  );

  // ── Handlers ───────────────────────────────────────────────────────────
  const handleSelectTicket = (ticket) => { setSelected(ticket); setReply(''); };

  const handleStatusChange = async (ticketId, newStatus) => {
    try {
      await authFetch(`${API_BASE_URL}/api/support/tickets/${ticketId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          changedById: user?.uid,
          changedByName: profile?.name || user?.email || 'Agente',
          changedByRole: profile?.role || 'support'
        }),
      });
      await fetchTickets();
    } catch (err) {
      console.error('Error cambiando estado:', err);
    }
  };

  const handleSendReply = async () => {
    if (!reply.trim() || !selected) return;
    setSending(true);
    try {
      await authFetch(`${API_BASE_URL}/api/support/tickets/${selected.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: user?.uid,
          senderRole: profile?.role || 'user',
          senderName: profile?.name || user?.email || 'Cliente',
          text: reply.trim(),
        }),
      });
      setReply('');
    } catch (err) {
      console.error('Error sending reply:', err);
    } finally {
      setSending(false);
    }
  };

  const handleCreateTicket = async () => {
    if (!newSubject.trim() || !newMessage.trim()) return;
    setCreatingTicket(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/api/support/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          userName: profile?.name || user?.displayName || 'Cliente',
          userEmail: user?.email || '',
          subject: newSubject.trim(),
          message: newMessage.trim(),
        }),
      });
      if (res.ok) {
        setNewSubject('');
        setNewMessage('');
        setShowNewTicket(false);
        await fetchTickets();
      }
    } catch (err) {
      console.error('Error creating ticket:', err);
    } finally {
      setCreatingTicket(false);
    }
  };

  const counts = {
    open: tickets.filter(t => t.status === 'open').length,
    in_progress: tickets.filter(t => t.status === 'in_progress').length,
    resolved: tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length,
  };

  return (
    <div className="support-dashboard">
      {/* ── New Ticket Modal ── */}
      {showNewTicket && (
        <div className="new-ticket-overlay" onClick={() => setShowNewTicket(false)}>
          <div className="new-ticket-modal" onClick={e => e.stopPropagation()}>
            <div className="new-ticket-modal-header">
              <h2>Nuevo Ticket de Soporte</h2>
              <button className="modal-close-btn" onClick={() => setShowNewTicket(false)}><X size={18} /></button>
            </div>
            <div className="new-ticket-modal-body">
              <label>Asunto</label>
              <input
                type="text"
                placeholder="ej. Problema con mi pedido #123"
                value={newSubject}
                onChange={e => setNewSubject(e.target.value)}
                className="ticket-input"
              />
              <label>Descripción del problema</label>
              <textarea
                placeholder="Cuéntanos en detalle qué sucedió..."
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                className="ticket-textarea"
                rows={5}
              />
            </div>
            <div className="new-ticket-modal-footer">
              <button className="cancel-btn" onClick={() => setShowNewTicket(false)}>Cancelar</button>
              <button
                className="reply-send-btn"
                onClick={handleCreateTicket}
                disabled={creatingTicket || !newSubject.trim() || !newMessage.trim()}
              >
                {creatingTicket ? 'Enviando...' : 'Crear Ticket'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div className="support-header">
        <div>
          <h1>{isSupport ? 'Panel de Soporte' : 'Mis Tickets'}</h1>
          <p>
            {isSupport
              ? 'Gestiona y responde los tickets de tus clientes'
              : 'Revisa el estado de tus solicitudes de soporte'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {isSupport && (
            <div className="support-stats">
              <div className="stat-chip open"><span>{counts.open}</span>Abiertos</div>
              <div className="stat-chip inprog"><span>{counts.in_progress}</span>En Progreso</div>
              <div className="stat-chip done"><span>{counts.resolved}</span>Resueltos</div>
            </div>
          )}
          {!isSupport && (
            <button className="reply-send-btn" onClick={() => setShowNewTicket(true)}>
              + Nuevo Ticket
            </button>
          )}
        </div>
      </div>

      {/* ── Layout ── */}
      <div className="support-layout">
        {/* Tickets List */}
        <div className="tickets-panel">
          {isSupport && (
            <div className="tickets-panel-header">
              {['all', 'open', 'in_progress', 'resolved', 'closed'].map(f => (
                <button
                  key={f}
                  className={`filter-btn ${filter === f ? 'active' : ''}`}
                  onClick={() => setFilter(f)}
                >
                  {f === 'all' ? 'Todos' : STATUS_LABELS[f]}
                </button>
              ))}
            </div>
          )}

          <div className="tickets-list">
            {loading ? (
              <p style={{ color: '#444', padding: '1rem', textAlign: 'center' }}>Cargando tickets...</p>
            ) : filteredTickets.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#444' }}>
                <p>No hay tickets aún.</p>
                {!isSupport && (
                  <button
                    className="reply-send-btn"
                    style={{ marginTop: '1rem', fontSize: '0.8rem' }}
                    onClick={() => setShowNewTicket(true)}
                  >
                    + Crear mi primer ticket
                  </button>
                )}
              </div>
            ) : (
              filteredTickets.map(ticket => (
                <div
                  key={ticket.id}
                  className={`ticket-card ${selected?.id === ticket.id ? 'selected' : ''}`}
                  onClick={() => handleSelectTicket(ticket)}
                >
                  <div className="ticket-card-top">
                    <strong>{ticket.subject}</strong>
                    <span className={`ticket-status-badge ${ticket.status}`}>
                      {STATUS_LABELS[ticket.status] || ticket.status}
                    </span>
                  </div>
                  <div className="ticket-card-user">
                    {isSupport
                      ? ticket.userName || ticket.userEmail || ticket.userId
                      : formatDate(ticket.createdAt)}
                  </div>
                  <div className="ticket-card-preview">
                    {ticket.messages?.[ticket.messages.length - 1]?.text || '—'}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Conversation */}
        <div className="conversation-panel">
          {!selected ? (
            <div className="conversation-empty">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#d4a847" strokeWidth="1.5">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <p>Selecciona un ticket para ver la conversación</p>
            </div>
          ) : (
            <>
              <div className="conversation-header">
                <div className="conversation-header-info">
                  <h3>{selected.subject}</h3>
                  <p>
                    {isSupport
                      ? `${selected.userName || selected.userId} · ${selected.userEmail}`
                      : `Ticket #${selected.id.slice(0, 8)}`}
                    {' · '}{formatDate(selected.createdAt)}
                  </p>
                </div>
                {isSupport && (
                  <div className="conversation-header-actions">
                    <select
                      className="status-select"
                      value={selected.status}
                      onChange={e => handleStatusChange(selected.id, e.target.value)}
                    >
                      {Object.entries(STATUS_LABELS).map(([val, label]) => (
                        <option key={val} value={val}>{label}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="conversation-messages">
                {(selected.messages || []).map((msg, i) => (
                  <div
                    key={i}
                    className={`message-bubble ${msg.senderId === user?.uid || (!msg.senderId && msg.sender === 'user') ? 'support' : 'user'}`}
                  >
                    <div className="msg-sender">{msg.senderName || msg.sender}</div>
                    {msg.text}
                    <div className="msg-time">{formatDate(msg.timestamp)}</div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {selected.status !== 'closed' && (
                <div className="reply-box">
                  <textarea
                    value={reply}
                    onChange={e => setReply(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendReply(); } }}
                    placeholder={isSupport ? 'Escribe tu respuesta al cliente...' : 'Añadir información a tu ticket...'}
                    rows={2}
                  />
                  <button
                    className="reply-send-btn"
                    onClick={handleSendReply}
                    disabled={sending || !reply.trim()}
                  >
                    {sending ? '...' : 'Enviar'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

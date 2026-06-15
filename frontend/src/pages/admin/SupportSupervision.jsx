import React, { useEffect, useState } from 'react';
import { API_BASE_URL, authFetch } from '../../utils/api';
import { Ticket, User, MessageSquare, Settings, Lock, FolderOpen, Clock, CheckCircle2, Zap, AlertTriangle, X } from 'lucide-react';
import './SupportSupervision.css';

// Formateadores de fecha y duración
function formatDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es-MX', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric',
    hour: '2-digit', 
    minute: '2-digit' 
  });
}

function formatDuration(ms) {
  if (isNaN(ms) || ms <= 0) return '—';
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m`;
  }
  return `${seconds}s`;
}

const STATUS_LABELS = {
  open: 'Abierto',
  in_progress: 'En Progreso',
  resolved: 'Resuelto',
  closed: 'Cerrado',
};

const EVENT_ICON_COMPONENTS = {
  ticket_created: Ticket,
  assigned: User,
  reply_sent: MessageSquare,
  status_changed: Settings,
  resolved: CheckCircle2,
  closed: Lock,
};

const EVENT_LABELS = {
  ticket_created: 'Ticket creado por el cliente',
  assigned: 'Ticket asignado',
  reply_sent: 'Mensaje / Respuesta enviada',
  status_changed: 'Estado del ticket modificado',
  resolved: 'Ticket marcado como Resuelto',
  closed: 'Ticket cerrado permanentemente',
};

export default function SupportSupervision() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Obtener métricas desde el Backend Express
  const fetchMetrics = async () => {
    try {
      const res = await authFetch(`${API_BASE_URL}/api/support/admin/metrics`);
      if (!res.ok) throw new Error('Error al obtener las métricas del backend.');
      const data = await res.json();
      setMetrics(data);
      setError(null);
    } catch (err) {
      console.error("Error obteniendo métricas en frontend:", err);
      setError('No se pudieron cargar las métricas de supervisión desde el servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    // Suscripción mediante sondeo (polling) cada 10 segundos para emular tiempo real
    const interval = setInterval(fetchMetrics, 10000);
    return () => clearInterval(interval);
  }, []);

  // Actualizar el ticket seleccionado en tiempo real al actualizar métricas
  useEffect(() => {
    if (selectedTicket && metrics?.tickets) {
      const updated = metrics.tickets.find(t => t.id === selectedTicket.id);
      if (updated) {
        setSelectedTicket(updated);
      }
    }
  }, [metrics, selectedTicket]);

  if (loading && !metrics) {
    return <div className="loading-text">Cargando métricas de supervisión desde el servidor...</div>;
  }

  if (error && !metrics) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: '#ff4d4d' }}>
        <p><AlertTriangle size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} />{error}</p>
        <button onClick={fetchMetrics} className="filter-select" style={{ marginTop: '1rem' }}>
          Reintentar
        </button>
      </div>
    );
  }

  const { summary = {}, agentMetrics = [], agentRanking = [], tickets = [] } = metrics || {};

  // Filtrado de la lista de auditoría de tickets
  const filteredTicketsList = tickets.filter(t => {
    const matchesSearch = 
      t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.userName && t.userName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.userEmail && t.userEmail.toLowerCase().includes(searchTerm.toLowerCase())) ||
      t.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === 'all') return matchesSearch;
    return matchesSearch && t.status === statusFilter;
  });

  return (
    <div className="supervision-container">
      {/* Resumen General */}
      <section className="metrics-summary-grid">
        <div className="metric-card open">
          <div className="metric-icon"><FolderOpen size={22} /></div>
          <div className="metric-data">
            <h3>{summary.open ?? 0}</h3>
            <p>Abiertos</p>
          </div>
        </div>
        <div className="metric-card progress">
          <div className="metric-icon"><Clock size={22} /></div>
          <div className="metric-data">
            <h3>{summary.in_progress ?? 0}</h3>
            <p>En Progreso</p>
          </div>
        </div>
        <div className="metric-card resolved">
          <div className="metric-icon"><CheckCircle2 size={22} /></div>
          <div className="metric-data">
            <h3>{summary.resolved ?? 0}</h3>
            <p>Resueltos</p>
          </div>
        </div>
        <div className="metric-card closed">
          <div className="metric-icon"><Lock size={22} /></div>
          <div className="metric-data">
            <h3>{summary.closed ?? 0}</h3>
            <p>Cerrados</p>
          </div>
        </div>
        <div className="metric-card time">
          <div className="metric-icon"><Zap size={22} /></div>
          <div className="metric-data">
            <h3>{formatDuration(summary.globalResolutionTime)}</h3>
            <p>T. Promedio Resolución</p>
          </div>
        </div>
      </section>

      <div className="supervision-split-layout">
        {/* Sección Izquierda: Rendimiento de Agentes */}
        <div className="supervision-panel-left">
          {/* Métricas por Agente */}
          <section className="supervision-section card-glass">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0 }}>Desempeño del Equipo de Soporte</h2>
              <button onClick={fetchMetrics} className="filter-select" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>
                Actualizar
              </button>
            </div>
            {agentMetrics.length === 0 ? (
              <p className="empty-text">No hay agentes de soporte registrados en el sistema o con tickets asignados.</p>
            ) : (
              <div className="table-responsive">
                <table className="supervision-table">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Asignados</th>
                      <th>Abiertos</th>
                      <th>Resueltos</th>
                      <th>Cerrados</th>
                      <th>Última Actividad</th>
                      <th>T. Promedio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agentMetrics.map(agent => (
                      <tr key={agent.uid}>
                        <td>
                          <strong>{agent.name}</strong>
                          <span className="agent-email-sub">{agent.email}</span>
                        </td>
                        <td>{agent.assignedCount}</td>
                        <td><span className="badge-stat open">{agent.openCount}</span></td>
                        <td><span className="badge-stat resolved">{agent.resolvedCount}</span></td>
                        <td><span className="badge-stat closed">{agent.closedCount}</span></td>
                        <td className="activity-cell" title={agent.lastActivityDesc}>
                          <span className="activity-desc">{agent.lastActivityDesc}</span>
                          {agent.lastActivityTime && (
                            <span className="activity-time">{formatDateTime(agent.lastActivityTime)}</span>
                          )}
                        </td>
                        <td>{formatDuration(agent.avgResTime)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Ranking de Agentes */}
          <section className="supervision-section card-glass ranking-section">
            <h2>Ranking de Rendimiento</h2>
            <div className="ranking-list">
              {agentRanking.map((agent, index) => {
                let badge = '';
                if (index === 0) badge = '#1';
                else if (index === 1) badge = '#2';
                else if (index === 2) badge = '#3';
                else badge = `#${index + 1}`;

                return (
                  <div key={agent.uid} className={`ranking-item rank-${index + 1}`}>
                    <div className="rank-badge">{badge}</div>
                    <div className="rank-name">
                      <strong>{agent.name}</strong>
                      <span>{agent.email}</span>
                    </div>
                    <div className="rank-score">
                      <strong>{agent.totalFinished}</strong>
                      <span>resueltos/cerrados</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Sección Derecha: Auditoría de Tickets */}
        <div className="supervision-panel-right card-glass">
          <h2>Auditoría e Historial de Tickets</h2>
          
          <div className="search-filter-bar">
            <input
              type="text"
              placeholder="Buscar por cliente, asunto o ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">Todos los estados</option>
              <option value="open">Abiertos</option>
              <option value="in_progress">En Progreso</option>
              <option value="resolved">Resueltos</option>
              <option value="closed">Cerrados</option>
            </select>
          </div>

          {filteredTicketsList.length === 0 ? (
            <p className="empty-text">No se encontraron tickets que coincidan con la búsqueda.</p>
          ) : (
            <div className="auditable-tickets-list">
              {filteredTicketsList.map(ticket => (
                <div
                  key={ticket.id}
                  className={`audit-ticket-card ${selectedTicket?.id === ticket.id ? 'active' : ''}`}
                  onClick={() => setSelectedTicket(ticket)}
                >
                  <div className="audit-ticket-header">
                    <strong>{ticket.subject}</strong>
                    <span className={`status-pill ${ticket.status}`}>
                      {STATUS_LABELS[ticket.status] || ticket.status}
                    </span>
                  </div>
                  <div className="audit-ticket-meta">
                    <span>{ticket.userName || ticket.userEmail || 'Cliente'}</span>
                    <span>{formatDateTime(ticket.createdAt)}</span>
                  </div>
                  {ticket.assignedToName && (
                    <div className="audit-ticket-assigned">
                      Asignado a: <strong>{ticket.assignedToName}</strong>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Cajón/Drawer de Detalle del Ticket (Auditoría e Historial completo) */}
      {selectedTicket && (
        <div className="audit-drawer-overlay" onClick={() => setSelectedTicket(null)}>
          <div className="audit-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <h2>Detalle de Auditoría</h2>
              <button className="close-btn" onClick={() => setSelectedTicket(null)}><X size={16} /></button>
            </div>
            
            <div className="drawer-body">
              {/* Información General */}
              <section className="drawer-section">
                <h3>Información General</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <span>Ticket ID:</span>
                    <strong>{selectedTicket.id}</strong>
                  </div>
                  <div className="info-item">
                    <span>Estado Actual:</span>
                    <strong className={`status-pill ${selectedTicket.status}`}>
                      {STATUS_LABELS[selectedTicket.status] || selectedTicket.status}
                    </strong>
                  </div>
                  <div className="info-item">
                    <span>Cliente:</span>
                    <strong>{selectedTicket.userName || '—'}</strong>
                    <span className="sub">{selectedTicket.userEmail || '—'}</span>
                  </div>
                  <div className="info-item">
                    <span>Agente Asignado:</span>
                    <strong>{selectedTicket.assignedToName || 'No asignado'}</strong>
                  </div>
                </div>
              </section>

              {/* Fechas de Seguimiento */}
              <section className="drawer-section">
                <h3>Fechas de Trazabilidad</h3>
                <div className="dates-grid">
                  <div className="date-item">
                    <span>Creación:</span>
                    <strong>{formatDateTime(selectedTicket.createdAt)}</strong>
                  </div>
                  <div className="date-item">
                    <span>Asignación:</span>
                    <strong>{formatDateTime(selectedTicket.assignedAt)}</strong>
                  </div>
                  <div className="date-item">
                    <span>Resolución / Cierre:</span>
                    <strong>{formatDateTime(selectedTicket.resolvedAt)}</strong>
                  </div>
                  {(selectedTicket.assignedAt && selectedTicket.resolvedAt) && (
                    <div className="date-item duration-highlight">
                      <span>Tiempo de Resolución:</span>
                      <strong>{formatDuration(new Date(selectedTicket.resolvedAt) - new Date(selectedTicket.assignedAt))}</strong>
                    </div>
                  )}
                </div>
              </section>

              {/* Historial de Auditoría (activityLog) */}
              <section className="drawer-section">
                <h3>Línea de Tiempo de Auditoría</h3>
                {(!selectedTicket.activityLog || selectedTicket.activityLog.length === 0) ? (
                  <p className="no-log-text">Este ticket no tiene un historial de auditoría disponible.</p>
                ) : (
                  <div className="audit-timeline">
                    {selectedTicket.activityLog.map((log, idx) => (
                      <div key={idx} className="timeline-node">
                        <div className="node-icon">{(() => { const Ic = EVENT_ICON_COMPONENTS[log.type] || Settings; return <Ic size={16} />; })()}</div>
                        <div className="node-content">
                          <div className="node-header">
                            <strong>{EVENT_LABELS[log.type] || log.type}</strong>
                            <span className="node-time">{formatDateTime(log.timestamp)}</span>
                          </div>
                          <p className="node-user">Responsable: {log.userName || log.userId || 'Sistema'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Auditoría de Conversación */}
              <section className="drawer-section">
                <h3>Conversación Completa</h3>
                <div className="audit-messages-list">
                  {selectedTicket.messages?.map((msg, idx) => (
                    <div key={idx} className={`audit-msg-bubble ${msg.sender}`}>
                      <div className="audit-msg-sender">
                        <strong>{msg.senderName || msg.sender}</strong>
                        <span>{formatDateTime(msg.timestamp)}</span>
                      </div>
                      <div className="audit-msg-text">{msg.text}</div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

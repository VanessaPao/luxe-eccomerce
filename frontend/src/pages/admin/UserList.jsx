import React, { useEffect, useState } from 'react';
import { API_BASE_URL, authFetch } from '../../utils/api';
import { Users, Shield, ShieldCheck, User } from 'lucide-react';

const ROLE_OPTIONS = [
  { value: 'user', label: 'Usuario', color: '#5f6368' },
  { value: 'support', label: 'Soporte', color: '#1a73e8' },
  { value: 'admin', label: 'Admin', color: '#d93025' },
];

const ROLE_ICONS = {
  user: User,
  support: Shield,
  admin: ShieldCheck,
};

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await authFetch(`${API_BASE_URL}/api/users`);
      if (!res.ok) throw new Error('Error al obtener usuarios');
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error('Error cargando usuarios:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (uid, newRole) => {
    setUpdating(uid);
    try {
      const res = await authFetch(`${API_BASE_URL}/api/users/${uid}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al actualizar rol');
      }
      setUsers(prev =>
        prev.map(u => (u.uid === uid ? { ...u, role: newRole } : u))
      );
    } catch (err) {
      console.error('Error al cambiar rol:', err);
      alert(err.message || 'No se pudo actualizar el rol.');
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return <div className="loading-spinner">Cargando usuarios...</div>;
  }

  return (
    <div className="user-list-container">
      <div className="user-list-header">
        <h2>Gestión de Usuarios ({users.length})</h2>
      </div>

      <div className="table-responsive">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Registro</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan="4" className="text-center">No hay usuarios registrados.</td>
              </tr>
            ) : (
              users.map((u) => {
                const RoleIcon = ROLE_ICONS[u.role] || User;
                const roleOpt = ROLE_OPTIONS.find(r => r.value === u.role) || ROLE_OPTIONS[0];
                return (
                  <tr key={u.uid}>
                    <td>
                      <div className="user-name-cell">
                        <div className="user-avatar" style={{ backgroundColor: roleOpt.color + '20', color: roleOpt.color }}>
                          <RoleIcon size={16} />
                        </div>
                        <span>{u.firstName || u.lastName ? `${u.firstName} ${u.lastName}`.trim() : 'Sin nombre'}</span>
                      </div>
                    </td>
                    <td>{u.email}</td>
                    <td>
                      <select
                        className="role-select"
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.uid, e.target.value)}
                        disabled={updating === u.uid}
                        style={{ borderColor: roleOpt.color + '60' }}
                      >
                        {ROLE_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      {u.createdAt
                        ? new Date(u.createdAt).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' })
                        : '-'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserList;

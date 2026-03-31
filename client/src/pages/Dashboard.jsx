import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useApp } from '../context/AppContext';
import StatusBadge from '../components/StatusBadge';

const sectorLabels = {
  toiture: 'Toiture',
  abattage: 'Abattage',
  maçonnerie: 'Maçonnerie',
  plomberie: 'Plomberie',
  électricité: 'Électricité',
  peinture: 'Peinture',
  menuiserie: 'Menuiserie',
  serrurerie: 'Serrurerie',
  climatisation: 'Climatisation',
  autre: 'Autre',
};

export default function Dashboard() {
  const { config, users, socket } = useApp();
  const [clients, setClients] = useState([]);
  const [stats, setStats] = useState({ total: 0, byStatus: {} });
  const [filters, setFilters] = useState({
    status: '',
    sector: '',
    assigned_to: '',
    search: '',
  });

  const load = useCallback(() => {
    const params = {};
    if (filters.status) params.status = filters.status;
    if (filters.sector) params.sector = filters.sector;
    if (filters.assigned_to) params.assigned_to = filters.assigned_to;
    if (filters.search) params.search = filters.search;
    api.getClients(params).then(setClients).catch(console.error);
    api.getClientStats().then(setStats).catch(console.error);
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!socket) return;
    const handler = () => load();
    socket.on('client:updated', handler);
    socket.on('task:checked', handler);
    return () => {
      socket.off('client:updated', handler);
      socket.off('task:checked', handler);
    };
  }, [socket, load]);

  const statCards = [
    { label: 'Total clients', value: stats.total, color: 'text-gray-900', bg: 'bg-white' },
    { label: 'En attente', value: stats.byStatus?.en_attente || 0, color: 'text-gray-500', bg: 'bg-white' },
    { label: 'En cours', value: stats.byStatus?.en_cours || 0, color: 'text-blue-600', bg: 'bg-white' },
    { label: 'Comptes créés', value: stats.byStatus?.compte_cree || 0, color: 'text-yellow-600', bg: 'bg-white' },
    { label: 'En ligne', value: stats.byStatus?.en_ligne || 0, color: 'text-green-600', bg: 'bg-white' },
    { label: 'Bloqués', value: stats.byStatus?.bloque || 0, color: 'text-red-600', bg: 'bg-white' },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h2>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        {statCards.map((s) => (
          <div key={s.label} className={`${s.bg} border border-gray-200 rounded-xl p-4 shadow-sm`}>
            <p className="text-xs text-gray-500 mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          placeholder="Rechercher (nom, SIRET, entreprise)..."
          value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
          className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 w-72 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
        />
        <select
          value={filters.status}
          onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
          className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <option value="">Tous les statuts</option>
          {config.statuses.map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
          ))}
        </select>
        <select
          value={filters.sector}
          onChange={(e) => setFilters((f) => ({ ...f, sector: e.target.value }))}
          className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <option value="">Tous les secteurs</option>
          {config.sectors.map((s) => (
            <option key={s} value={s}>{sectorLabels[s] || s}</option>
          ))}
        </select>
        <select
          value={filters.assigned_to}
          onChange={(e) => setFilters((f) => ({ ...f, assigned_to: e.target.value }))}
          className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <option value="">Tous les assignés</option>
          {users.map((u) => (
            <option key={u.name} value={u.name}>{u.name}</option>
          ))}
        </select>
      </div>

      {/* Client list */}
      {clients.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 text-lg">Aucun client trouvé</p>
          <Link to="/add" className="text-red-600 hover:text-red-500 text-sm mt-2 inline-block">
            + Ajouter un client
          </Link>
        </div>
      ) : (
        <div className="grid gap-3">
          {clients.map((c) => (
            <Link
              key={c.id}
              to={`/clients/${c.id}`}
              className="block bg-white border border-gray-200 rounded-xl p-4 hover:border-red-300 hover:shadow-md transition-all shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <h3 className="text-gray-900 font-semibold">{c.company_name}</h3>
                    <p className="text-sm text-gray-500">
                      {c.first_name} {c.last_name} · {sectorLabels[c.sector] || c.sector}
                      {c.siret && ` · SIRET: ${c.siret}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {c.assigned_to && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {c.assigned_to}
                    </span>
                  )}
                  <StatusBadge status={c.status} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

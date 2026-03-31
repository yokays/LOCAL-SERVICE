import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useApp } from '../context/AppContext';
import StatusBadge, { statusLabels } from '../components/StatusBadge';
import TaskChecklist from '../components/TaskChecklist';
import DocumentSection from '../components/DocumentSection';
import ActivityLog from '../components/ActivityLog';

export default function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, config, users } = useApp();
  const [client, setClient] = useState(null);
  const [editing, setEditing] = useState({});
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    api.getClient(id).then((data) => {
      setClient(data);
      setNotes(data.notes || '');
      setLoading(false);
    }).catch(() => {
      navigate('/');
    });
  }, [id, navigate]);

  useEffect(() => { load(); }, [load]);

  // Poll for updates every 10 seconds
  useEffect(() => {
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, [load]);

  async function updateField(field, value) {
    await api.updateClient(id, { [field]: value, user: currentUser });
    setEditing({});
    load();
  }

  async function saveNotes() {
    await api.updateClient(id, { notes, user: currentUser });
    load();
  }

  async function handleDelete() {
    if (!confirm(`Supprimer ${client.company_name} ?`)) return;
    await api.deleteClient(id);
    navigate('/');
  }

  if (loading) {
    return <div className="text-gray-400 py-16 text-center">Chargement...</div>;
  }
  if (!client) return null;

  function EditableField({ label, field, value }) {
    if (editing[field]) {
      return (
        <div>
          <label className="block text-xs text-gray-500 mb-1">{label}</label>
          <input
            autoFocus
            defaultValue={value}
            onBlur={(e) => updateField(field, e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && updateField(field, e.target.value)}
            className="bg-white border border-red-300 rounded px-2 py-1 text-sm text-gray-800 w-full focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>
      );
    }
    return (
      <div
        className="cursor-pointer group"
        onClick={() => setEditing({ [field]: true })}
      >
        <label className="block text-xs text-gray-500 mb-1">{label}</label>
        <p className="text-sm text-gray-800 group-hover:text-red-600 transition-colors">
          {value || <span className="text-gray-400 italic">Non renseigné</span>}
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="text-sm text-gray-500 hover:text-gray-700 mb-2 inline-block"
          >
            ← Retour
          </button>
          <h2 className="text-2xl font-bold text-gray-900">{client.company_name}</h2>
          <p className="text-gray-500">{client.first_name} {client.last_name}</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={client.status}
            onChange={(e) => updateField('status', e.target.value)}
            className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 shadow-sm"
          >
            {config.statuses.map((s) => (
              <option key={s} value={s}>{statusLabels[s] || s}</option>
            ))}
          </select>
          <StatusBadge status={client.status} />
          <button
            onClick={handleDelete}
            className="text-xs px-3 py-2 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg text-red-600"
          >
            Supprimer
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: info + docs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Client info */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations</h3>
            <div className="grid grid-cols-2 gap-4">
              <EditableField label="Prénom" field="first_name" value={client.first_name} />
              <EditableField label="Nom" field="last_name" value={client.last_name} />
              <EditableField label="Entreprise" field="company_name" value={client.company_name} />
              <div>
                <label className="block text-xs text-gray-500 mb-1">Secteur</label>
                <select
                  value={client.sector}
                  onChange={(e) => updateField('sector', e.target.value)}
                  className="bg-white border border-gray-200 rounded px-2 py-1 text-sm text-gray-800 w-full"
                >
                  {config.sectors.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <EditableField label="SIRET" field="siret" value={client.siret} />
              <EditableField label="Téléphone" field="phone" value={client.phone} />
              <EditableField label="Nom Local Service (optionnel)" field="lsa_name" value={client.lsa_name} />
              <div className="col-span-2">
                <EditableField label="Adresse" field="address" value={client.address} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Assigné à</label>
                <select
                  value={client.assigned_to}
                  onChange={(e) => updateField('assigned_to', e.target.value)}
                  className="bg-white border border-gray-200 rounded px-2 py-1 text-sm text-gray-800 w-full"
                >
                  <option value="">Non assigné</option>
                  {users.map((u) => (
                    <option key={u.name} value={u.name}>{u.name}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <EditableField label="Lien fiche Google" field="google_link" value={client.google_link} />
                {client.google_link && (
                  <a
                    href={client.google_link}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-red-600 hover:text-red-500 mt-1 inline-block"
                  >
                    Ouvrir la fiche →
                  </a>
                )}
              </div>
              <div className="col-span-2 flex gap-6 pt-2">
                <label
                  className="flex items-center gap-3 cursor-pointer group"
                  onClick={() => updateField('has_decennale', client.has_decennale ? 0 : 1)}
                >
                  <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${
                    client.has_decennale ? 'bg-green-600 border-green-600' : 'border-gray-300 group-hover:border-red-400'
                  }`}>
                    {client.has_decennale ? (
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : null}
                  </div>
                  <span className="text-sm text-gray-700">Décennale reçue</span>
                </label>
                <label
                  className="flex items-center gap-3 cursor-pointer group"
                  onClick={() => updateField('has_kbis', client.has_kbis ? 0 : 1)}
                >
                  <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${
                    client.has_kbis ? 'bg-green-600 border-green-600' : 'border-gray-300 group-hover:border-red-400'
                  }`}>
                    {client.has_kbis ? (
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : null}
                  </div>
                  <span className="text-sm text-gray-700">KBIS reçu</span>
                </label>
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <DocumentSection
              clientId={client.id}
              documents={client.documents || []}
              onUpdate={load}
            />
          </div>

          {/* Notes */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 resize-y focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Ajouter des notes..."
            />
            {notes !== (client.notes || '') && (
              <button
                onClick={saveNotes}
                className="mt-2 px-4 py-1.5 bg-red-600 hover:bg-red-500 rounded-lg text-sm text-white"
              >
                Enregistrer
              </button>
            )}
          </div>
        </div>

        {/* Right column: tasks + activity */}
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <TaskChecklist tasks={client.tasks || []} onUpdate={load} />
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <ActivityLog activity={client.activity || []} />
          </div>
        </div>
      </div>
    </div>
  );
}

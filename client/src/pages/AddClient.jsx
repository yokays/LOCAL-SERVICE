import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { api } from '../api';
import { useApp } from '../context/AppContext';

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

const inputClass = 'w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500';

export default function AddClient() {
  const navigate = useNavigate();
  const { currentUser, config, users } = useApp();
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    company_name: '',
    sector: 'toiture',
    siret: '',
    phone: '',
    address: '',
    lsa_name: '',
    assigned_to: currentUser || '',
    google_link: '',
    has_decennale: false,
    has_kbis: false,
    notes: '',
  });
  const [files, setFiles] = useState([]);
  const [docType, setDocType] = useState('autre');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (accepted) => setFiles((prev) => [...prev, ...accepted]),
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    },
    maxSize: 20 * 1024 * 1024,
  });

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.first_name || !form.last_name || !form.company_name || !form.sector) {
      setError('Prénom, nom, entreprise et secteur sont requis');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const client = await api.createClient({ ...form, user: currentUser });
      if (files.length > 0) {
        await api.uploadDocuments(client.id, files, docType, currentUser);
      }
      navigate(`/clients/${client.id}`);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <button
        onClick={() => navigate(-1)}
        className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-block"
      >
        ← Retour
      </button>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Ajouter un client</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-3 mb-6 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4 shadow-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Prénom *</label>
              <input value={form.first_name} onChange={set('first_name')} className={inputClass} placeholder="Jean" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Nom *</label>
              <input value={form.last_name} onChange={set('last_name')} className={inputClass} placeholder="Dupont" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Nom de l'entreprise *</label>
              <input value={form.company_name} onChange={set('company_name')} className={inputClass} placeholder="Toitures Dupont SARL" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Secteur *</label>
              <select value={form.sector} onChange={set('sector')} className={inputClass}>
                {config.sectors.map((s) => (
                  <option key={s} value={s}>{sectorLabels[s] || s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">SIRET</label>
              <input value={form.siret} onChange={set('siret')} className={inputClass} placeholder="123 456 789 00012" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Téléphone</label>
              <input value={form.phone} onChange={set('phone')} className={inputClass} placeholder="06 12 34 56 78" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Adresse</label>
              <input value={form.address} onChange={set('address')} className={inputClass} placeholder="12 rue de la Paix, 75001 Paris" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Assigné à</label>
              <select value={form.assigned_to} onChange={set('assigned_to')} className={inputClass}>
                <option value="">Non assigné</option>
                {users.map((u) => (
                  <option key={u.name} value={u.name}>{u.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Nom Local Service (optionnel)</label>
              <input value={form.lsa_name} onChange={set('lsa_name')} className={inputClass} placeholder="Nom affiché sur LSA" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Lien fiche Google</label>
              <input value={form.google_link} onChange={set('google_link')} className={inputClass} placeholder="https://www.google.com/maps/place/..." />
            </div>
            <div className="col-span-2 flex gap-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.has_decennale}
                  onChange={(e) => setForm((f) => ({ ...f, has_decennale: e.target.checked }))}
                  className="w-5 h-5 rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <span className="text-sm text-gray-700">Décennale reçue</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.has_kbis}
                  onChange={(e) => setForm((f) => ({ ...f, has_kbis: e.target.checked }))}
                  className="w-5 h-5 rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <span className="text-sm text-gray-700">KBIS reçu</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={set('notes')}
              rows={3}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 resize-y focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Notes libres..."
            />
          </div>
        </div>

        {/* Document upload */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Documents initiaux (optionnel)
          </h3>
          <div className="mb-3">
            <label className="block text-xs text-gray-500 mb-1">Type de document</label>
            <select value={docType} onChange={(e) => setDocType(e.target.value)} className={inputClass + ' w-auto'}>
              {(config.docTypes || []).map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-red-400 bg-red-50' : 'border-gray-300 hover:border-red-300'
            }`}
          >
            <input {...getInputProps()} />
            <p className="text-gray-500 text-sm">
              Glissez-déposez des fichiers ici, ou cliquez pour sélectionner
            </p>
          </div>
          {files.length > 0 && (
            <div className="mt-3 space-y-1">
              {files.map((f, i) => (
                <div key={i} className="flex items-center justify-between text-sm text-gray-600 bg-gray-50 border border-gray-100 rounded px-3 py-2">
                  <span>{f.name}</span>
                  <button
                    type="button"
                    onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                    className="text-red-500 hover:text-red-600 text-xs"
                  >
                    Retirer
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 bg-red-600 hover:bg-red-500 disabled:bg-gray-300 rounded-xl text-white font-semibold transition-colors shadow-sm"
        >
          {submitting ? 'Création en cours...' : 'Créer le client'}
        </button>
      </form>
    </div>
  );
}

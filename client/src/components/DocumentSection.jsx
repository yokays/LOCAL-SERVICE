import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { api } from '../api';
import { useApp } from '../context/AppContext';

const docTypeLabels = {
  décennale: 'Décennale',
  kbis: 'KBIS',
  siret: 'SIRET',
  carte_identite: "Carte d'identité",
  autre: 'Autre',
};

export default function DocumentSection({ clientId, documents, onUpdate }) {
  const { currentUser, config } = useApp();
  const [docType, setDocType] = useState('autre');
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback(
    async (files) => {
      if (!files.length) return;
      setUploading(true);
      try {
        await api.uploadDocuments(clientId, files, docType, currentUser);
        onUpdate();
      } catch (e) {
        console.error(e);
      }
      setUploading(false);
    },
    [clientId, docType, currentUser, onUpdate]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    },
    maxSize: 20 * 1024 * 1024,
  });

  async function handleDelete(docId) {
    if (!confirm('Supprimer ce document ?')) return;
    await api.deleteDocument(docId, currentUser);
    onUpdate();
  }

  function getFileIcon(name) {
    if (name.match(/\.pdf$/i)) return '📄';
    if (name.match(/\.(jpg|jpeg|png|webp)$/i)) return '🖼️';
    return '📎';
  }

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Documents</h3>

      {/* Upload zone */}
      <div className="mb-4 flex gap-3 items-end">
        <div className="flex-1">
          <label className="block text-xs text-gray-500 mb-1">Type de document</label>
          <select
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800"
          >
            {(config.docTypes || []).map((t) => (
              <option key={t} value={t}>
                {docTypeLabels[t] || t}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors mb-6 ${
          isDragActive
            ? 'border-red-400 bg-red-50'
            : 'border-gray-300 hover:border-red-300 hover:bg-red-50/50'
        }`}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <p className="text-gray-500 text-sm">Upload en cours...</p>
        ) : isDragActive ? (
          <p className="text-red-600 text-sm">Déposez les fichiers ici</p>
        ) : (
          <div>
            <p className="text-gray-500 text-sm">
              Glissez-déposez des fichiers ici, ou cliquez pour sélectionner
            </p>
            <p className="text-gray-400 text-xs mt-1">PDF, JPG, PNG, WEBP — Max 20 Mo</p>
          </div>
        )}
      </div>

      {/* Document list */}
      {documents.length === 0 ? (
        <p className="text-gray-400 text-sm">Aucun document</p>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 rounded-lg group"
            >
              <span className="text-lg">{getFileIcon(doc.original_name)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800 truncate">{doc.original_name}</p>
                <p className="text-xs text-gray-500">
                  {docTypeLabels[doc.type] || doc.type} — par {doc.uploaded_by} —{' '}
                  {new Date(doc.uploaded_at).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <a
                  href={doc.blob_url || `/uploads/${doc.client_id}/${doc.filename}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded text-gray-700"
                >
                  Ouvrir
                </a>
                <button
                  onClick={() => handleDelete(doc.id)}
                  className="text-xs px-2 py-1 bg-red-50 hover:bg-red-100 border border-red-200 rounded text-red-600"
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

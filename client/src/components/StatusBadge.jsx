const statusLabels = {
  en_attente: 'En attente',
  en_cours: 'En cours',
  compte_cree: 'Compte créé',
  en_ligne: 'En ligne',
  bloque: 'Bloqué',
};

const statusColors = {
  en_attente: 'bg-gray-200 text-gray-700',
  en_cours: 'bg-blue-100 text-blue-700',
  compte_cree: 'bg-yellow-100 text-yellow-700',
  en_ligne: 'bg-green-100 text-green-700',
  bloque: 'bg-red-100 text-red-700',
};

export default function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
        statusColors[status] || 'bg-gray-200'
      }`}
    >
      {statusLabels[status] || status}
    </span>
  );
}

export { statusLabels };

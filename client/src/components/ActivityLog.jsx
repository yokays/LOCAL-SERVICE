const actionLabels = {
  creation: 'Création',
  update: 'Mise à jour',
  task_done: 'Tâche complétée',
  task_undone: 'Tâche décochée',
  doc_upload: 'Document uploadé',
  doc_delete: 'Document supprimé',
};

const actionColors = {
  creation: 'text-green-600',
  update: 'text-blue-600',
  task_done: 'text-emerald-600',
  task_undone: 'text-yellow-600',
  doc_upload: 'text-purple-600',
  doc_delete: 'text-red-600',
};

export default function ActivityLog({ activity }) {
  if (!activity || activity.length === 0) {
    return <p className="text-gray-400 text-sm">Aucune activité</p>;
  }

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Activité</h3>
      <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
        {activity.map((a) => (
          <div key={a.id} className="flex gap-3 text-sm">
            <div className="w-2 h-2 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
            <div>
              <span className={`font-medium ${actionColors[a.action] || 'text-gray-600'}`}>
                {actionLabels[a.action] || a.action}
              </span>
              {a.detail && <span className="text-gray-600"> — {a.detail}</span>}
              <p className="text-xs text-gray-400">
                {a.author} · {new Date(a.created_at).toLocaleString('fr-FR')}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

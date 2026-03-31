import { api } from '../api';
import { useApp } from '../context/AppContext';

export default function TaskChecklist({ tasks, onUpdate }) {
  const { currentUser } = useApp();
  const done = tasks.filter((t) => t.done).length;

  async function toggle(taskId) {
    await api.toggleTask(taskId, currentUser);
    onUpdate();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Étapes d'onboarding
        </h3>
        <span className="text-sm text-gray-500">
          {done}/{tasks.length} complétées
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
        <div
          className="bg-red-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${tasks.length ? (done / tasks.length) * 100 : 0}%` }}
        />
      </div>

      <div className="space-y-2">
        {tasks.map((task, i) => (
          <div
            key={task.id}
            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
              task.done
                ? 'bg-green-50 text-gray-500'
                : 'bg-gray-50 text-gray-800 hover:bg-red-50'
            }`}
            onClick={() => toggle(task.id)}
          >
            <div
              className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                task.done
                  ? 'bg-green-600 border-green-600'
                  : 'border-gray-300'
              }`}
            >
              {task.done ? (
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : null}
            </div>
            <div className="flex-1 min-w-0">
              <span className={`text-sm ${task.done ? 'line-through' : 'font-medium'}`}>
                {i + 1}. {task.label}
              </span>
              {task.done && task.done_by ? (
                <p className="text-xs text-gray-400 mt-0.5">
                  Par {task.done_by} — {new Date(task.done_at).toLocaleDateString('fr-FR')}
                </p>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

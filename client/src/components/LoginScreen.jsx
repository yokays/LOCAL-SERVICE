import { useApp } from '../context/AppContext';

export default function LoginScreen() {
  const { users, login } = useApp();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white border border-gray-200 rounded-2xl p-8 w-full max-w-sm shadow-lg">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-red-600 rounded-xl flex items-center justify-center mx-auto mb-3">
            <span className="text-white text-2xl font-bold">L</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">LSA Manager</h1>
          <p className="text-gray-500 text-sm mt-1">Qui êtes-vous ?</p>
        </div>
        <div className="space-y-3">
          {users.map((u) => (
            <button
              key={u.name}
              onClick={() => login(u.name)}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-red-50 border border-gray-200 hover:border-red-200 rounded-xl transition-colors text-left"
            >
              <span className="text-gray-900 font-medium">{u.name}</span>
              <span className="text-xs text-gray-400 capitalize">{u.role}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

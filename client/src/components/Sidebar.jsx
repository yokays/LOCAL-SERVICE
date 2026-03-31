import { NavLink } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const links = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/clients', label: 'Clients', icon: '👥' },
  { to: '/add', label: '+ Ajouter client', icon: '➕' },
];

export default function Sidebar() {
  const { currentUser, logout, updatedToday } = useApp();

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col min-h-screen fixed left-0 top-0 shadow-sm">
      <div className="p-6 border-b border-gray-200 bg-red-600">
        <h1 className="text-xl font-bold text-white tracking-tight">LSA Manager</h1>
        <p className="text-xs text-red-200 mt-1">Gestion Local Services Ads</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-red-50 text-red-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`
            }
          >
            <span>{link.icon}</span>
            <span>{link.label}</span>
            {link.to === '/' && updatedToday > 0 && (
              <span className="ml-auto bg-red-600 text-white text-xs px-2 py-0.5 rounded-full">
                {updatedToday}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-800">{currentUser}</p>
            <p className="text-xs text-gray-400">Connecté</p>
          </div>
          <button
            onClick={logout}
            className="text-xs text-gray-400 hover:text-red-500 transition-colors"
          >
            Déconnexion
          </button>
        </div>
      </div>
    </aside>
  );
}

import { createContext, useContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { api } from '../api';

const AppContext = createContext();

export function useApp() {
  return useContext(AppContext);
}

export function AppProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(
    () => localStorage.getItem('lsa_user') || null
  );
  const [users, setUsers] = useState([]);
  const [config, setConfig] = useState({ sectors: [], statuses: [], docTypes: [] });
  const [socket, setSocket] = useState(null);
  const [updatedToday, setUpdatedToday] = useState(0);

  useEffect(() => {
    api.getUsers().then(setUsers).catch(console.error);
    api.getConfig().then(setConfig).catch(console.error);
  }, []);

  useEffect(() => {
    const s = io(window.location.origin, { transports: ['websocket', 'polling'] });
    setSocket(s);

    s.on('client:updated', (data) => {
      if (data.type === 'created') {
        toast(`Nouveau client: ${data.client.company_name}`, { icon: '🆕' });
      } else if (data.type === 'updated') {
        toast(`Client mis à jour: ${data.client.company_name}`, { icon: '✏️' });
      }
      setUpdatedToday((c) => c + 1);
    });

    s.on('task:checked', (data) => {
      toast(`Tâche ${data.task.done ? 'complétée' : 'décochée'}: ${data.task.label}`, {
        icon: data.task.done ? '✅' : '⬜',
      });
    });

    s.on('document:uploaded', () => {
      toast('Document mis à jour', { icon: '📄' });
    });

    return () => s.disconnect();
  }, []);

  function login(name) {
    localStorage.setItem('lsa_user', name);
    setCurrentUser(name);
  }

  function logout() {
    localStorage.removeItem('lsa_user');
    setCurrentUser(null);
  }

  return (
    <AppContext.Provider
      value={{
        currentUser,
        users,
        config,
        socket,
        updatedToday,
        login,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

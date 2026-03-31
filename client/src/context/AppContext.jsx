import { createContext, useContext, useState, useEffect } from 'react';
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

  useEffect(() => {
    api.getUsers().then(setUsers).catch(console.error);
    api.getConfig().then(setConfig).catch(console.error);
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
        login,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

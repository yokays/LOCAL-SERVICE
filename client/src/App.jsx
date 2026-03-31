import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AppProvider, useApp } from './context/AppContext';
import Sidebar from './components/Sidebar';
import LoginScreen from './components/LoginScreen';
import Dashboard from './pages/Dashboard';
import ClientDetail from './pages/ClientDetail';
import AddClient from './pages/AddClient';

function Layout() {
  const { currentUser } = useApp();

  if (!currentUser) return <LoginScreen />;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/clients" element={<Dashboard />} />
          <Route path="/clients/:id" element={<ClientDetail />} />
          <Route path="/add" element={<AddClient />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Layout />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#ffffff',
              color: '#1f2937',
              border: '1px solid #e5e7eb',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            },
          }}
        />
      </AppProvider>
    </BrowserRouter>
  );
}

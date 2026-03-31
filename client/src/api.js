const BASE = '/api';

async function request(url, options = {}) {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Erreur serveur' }));
    throw new Error(err.error || 'Erreur serveur');
  }
  return res.json();
}

export const api = {
  // Clients
  getClients: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/clients${qs ? `?${qs}` : ''}`);
  },
  getClientStats: () => request('/clients/stats'),
  getClient: (id) => request(`/clients/${id}`),
  createClient: (data) =>
    request('/clients', { method: 'POST', body: JSON.stringify(data) }),
  updateClient: (id, data) =>
    request(`/clients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteClient: (id) => request(`/clients/${id}`, { method: 'DELETE' }),

  // Tasks
  toggleTask: (id, user) =>
    request(`/tasks/${id}/toggle`, {
      method: 'PUT',
      body: JSON.stringify({ user }),
    }),

  // Documents
  uploadDocuments: (clientId, files, type, user) => {
    const fd = new FormData();
    files.forEach((f) => fd.append('files', f));
    fd.append('type', type);
    fd.append('user', user);
    return fetch(`${BASE}/documents/${clientId}`, {
      method: 'POST',
      body: fd,
    }).then((r) => {
      if (!r.ok) throw new Error('Erreur upload');
      return r.json();
    });
  },
  deleteDocument: (id, user) =>
    request(`/documents/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ user }),
    }),
  getDocumentUrl: (clientId, filename) =>
    `/uploads/${clientId}/${filename}`,

  // Users & Config
  getUsers: () => request('/users'),
  getConfig: () => request('/users/config'),
};

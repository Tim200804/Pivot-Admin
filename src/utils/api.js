const API_BASE = import.meta.env.VITE_API_BASE || 'https://pivot-backend-production-690b.up.railway.app'

function getToken() {
  return localStorage.getItem('admin_token')
}

async function apiFetch(path, options = {}) {
  const url = `${API_BASE}${path}`
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }
  const token = getToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(url, {
    ...options,
    headers,
  })

  if (res.status === 401) {
    localStorage.removeItem('admin_token')
    window.location.href = '/login'
    return null
  }

  const data = await res.json().catch(() => null)
  return { ok: res.ok, status: res.status, data }
}

export const adminApi = {
  login: (username, password) =>
    apiFetch('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  me: () => apiFetch('/api/admin/me'),

  stats: () => apiFetch('/api/admin/stats'),

  listUsers: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return apiFetch(`/api/admin/users?${qs}`)
  },

  getUser: (id) => apiFetch(`/api/admin/users/${id}`),

  updateUser: (id, body) =>
    apiFetch(`/api/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  deleteUser: (id) =>
    apiFetch(`/api/admin/users/${id}`, { method: 'DELETE' }),

  previewImport: (file) => {
    const fd = new FormData()
    fd.append('file', file)
    return apiFetch('/api/admin/users/import-preview', {
      method: 'POST',
      headers: {},
      body: fd,
    })
  },

  importUsers: (file) => {
    const fd = new FormData()
    fd.append('file', file)
    return apiFetch('/api/admin/users/import', {
      method: 'POST',
      headers: {},
      body: fd,
    })
  },
}

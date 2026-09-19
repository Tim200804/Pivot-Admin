import { useEffect, useState, useCallback } from 'react'
import { Search, ChevronLeft, ChevronRight, Pencil, Trash2, X, Check, User } from 'lucide-react'
import { adminApi } from '../utils/api'

const ROLES = ['all', 'athlete', 'coach']

export default function UsersPage() {
  const [users, setUsers] = useState([])
  const [pagination, setPagination] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [deleteId, setDeleteId] = useState(null)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    const params = { page, per_page: 15 }
    if (roleFilter !== 'all') params.role = roleFilter
    if (search.trim()) params.search = search.trim()
    const res = await adminApi.listUsers(params)
    if (res?.ok) {
      setUsers(res.data.users)
      setPagination(res.data.pagination)
    }
    setLoading(false)
  }, [page, roleFilter, search])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const startEdit = (user) => {
    setEditingId(user.id)
    setEditForm({
      name: user.name || '',
      email: user.email || '',
      role: user.role || '',
      sport: user.sport || '',
      school: user.school || '',
      team_name: user.team_name || '',
      position: user.position || '',
      coach_role: user.coach_role || '',
      height: user.height || '',
      weight: user.weight || '',
    })
  }

  const saveEdit = async () => {
    const body = { ...editForm }
    if (body.height !== '') body.height = parseInt(body.height) || null
    if (body.weight !== '') body.weight = parseInt(body.weight) || null
    const res = await adminApi.updateUser(editingId, body)
    if (res?.ok) {
      setEditingId(null)
      fetchUsers()
    } else {
      alert(res?.data?.message || 'Update failed')
    }
  }

  const confirmDelete = async () => {
    const res = await adminApi.deleteUser(deleteId)
    if (res?.ok) {
      setDeleteId(null)
      fetchUsers()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-admin-900">Users</h2>
          <p className="text-sm text-admin-500 mt-1">Manage registered athletes and coaches</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search users..."
              className="input pl-9 w-64"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1) }}
            className="input w-32"
          >
            <option value="all">All Roles</option>
            <option value="athlete">Athlete</option>
            <option value="coach">Coach</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-admin-50 border-b border-admin-200">
              <tr>
                <th className="table-header">User</th>
                <th className="table-header">Role</th>
                <th className="table-header">Sport / School</th>
                <th className="table-header">Team</th>
                <th className="table-header">Created</th>
                <th className="table-header w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-4 py-4">
                      <div className="h-6 bg-admin-100 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-admin-400">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-admin-50/50 transition-colors">
                    {editingId === user.id ? (
                      <td colSpan={6} className="px-4 py-4 bg-blue-50/50">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} placeholder="Name" className="input" />
                          <input value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} placeholder="Email" className="input" />
                          <select value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })} className="input">
                            <option value="athlete">Athlete</option>
                            <option value="coach">Coach</option>
                          </select>
                          <input value={editForm.sport} onChange={(e) => setEditForm({ ...editForm, sport: e.target.value })} placeholder="Sport" className="input" />
                          <input value={editForm.school} onChange={(e) => setEditForm({ ...editForm, school: e.target.value })} placeholder="School" className="input" />
                          <input value={editForm.team_name} onChange={(e) => setEditForm({ ...editForm, team_name: e.target.value })} placeholder="Team" className="input" />
                          <input value={editForm.position} onChange={(e) => setEditForm({ ...editForm, position: e.target.value })} placeholder="Position" className="input" />
                          <div className="flex items-center gap-2">
                            <button onClick={saveEdit} className="btn-primary px-3 py-1.5 text-xs"><Check size={14} /></button>
                            <button onClick={() => setEditingId(null)} className="btn-secondary px-3 py-1.5 text-xs"><X size={14} /></button>
                          </div>
                        </div>
                      </td>
                    ) : (
                      <>
                        <td className="table-cell">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-admin-100 flex items-center justify-center">
                              <User size={14} className="text-admin-500" />
                            </div>
                            <div>
                              <p className="font-medium text-admin-900">{user.name}</p>
                              <p className="text-xs text-admin-400">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="table-cell">
                          <span className={`badge ${
                            user.role === 'athlete'
                              ? 'bg-teal-50 text-teal-700'
                              : 'bg-blue-50 text-blue-700'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="table-cell">
                          <p>{user.sport || '-'}</p>
                          <p className="text-xs text-admin-400">{user.school || '-'}</p>
                        </td>
                        <td className="table-cell">{user.team_name || '-'}</td>
                        <td className="table-cell text-admin-400">{user.created_at?.split('T')[0] || '-'}</td>
                        <td className="table-cell">
                          <div className="flex items-center gap-1">
                            <button onClick={() => startEdit(user)} className="btn-ghost p-1.5">
                              <Pencil size={14} />
                            </button>
                            <button onClick={() => setDeleteId(user.id)} className="btn-ghost p-1.5 text-accent-rose hover:text-accent-rose">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.total_pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-admin-200">
            <p className="text-sm text-admin-400">
              Page {pagination.page} of {pagination.total_pages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary px-2 py-1.5 disabled:opacity-40"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pagination.total_pages, p + 1))}
                disabled={page === pagination.total_pages}
                className="btn-secondary px-2 py-1.5 disabled:opacity-40"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirm Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-admin-900">Delete User?</h3>
            <p className="text-sm text-admin-500 mt-2">This action cannot be undone.</p>
            <div className="flex items-center justify-end gap-2 mt-6">
              <button onClick={() => setDeleteId(null)} className="btn-secondary">Cancel</button>
              <button onClick={confirmDelete} className="btn-danger">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

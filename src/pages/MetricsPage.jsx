import { useEffect, useState, useCallback } from 'react'
import { Search, ChevronLeft, ChevronRight, Pencil, Trash2, X, Check, Plus, Activity, Upload, FileSpreadsheet } from 'lucide-react'
import { adminApi } from '../utils/api'

const METRIC_FIELDS = [
  { key: 'date', label: 'Date', type: 'date', width: 'w-32' },
  { key: 'hrv', label: 'HRV', type: 'number', step: '0.1', width: 'w-24' },
  { key: 'rhr', label: 'RHR', type: 'number', step: '0.1', width: 'w-24' },
  { key: 'sleep_hours', label: 'Sleep (h)', type: 'number', step: '0.1', width: 'w-24' },
  { key: 'sleep_deep_pct', label: 'Deep %', type: 'number', step: '0.1', width: 'w-24' },
  { key: 'sleep_rem_pct', label: 'REM %', type: 'number', step: '0.1', width: 'w-24' },
  { key: 'spo2', label: 'SpO2', type: 'number', step: '0.1', width: 'w-24' },
  { key: 'respiratory_rate', label: 'Resp', type: 'number', step: '0.1', width: 'w-24' },
  { key: 'skin_temp', label: 'Temp', type: 'number', step: '0.1', width: 'w-24' },
]

export default function MetricsPage() {
  const [metrics, setMetrics] = useState([])
  const [pagination, setPagination] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [userId, setUserId] = useState('')
  const [page, setPage] = useState(1)
  const [athletes, setAthletes] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [deleteId, setDeleteId] = useState(null)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [isCreating, setIsCreating] = useState(false)
  const [createForm, setCreateForm] = useState({ user_id: '', date: new Date().toISOString().split('T')[0] })

  // Bulk import state
  const [importOpen, setImportOpen] = useState(false)
  const [importFile, setImportFile] = useState(null)
  const [importPreview, setImportPreview] = useState(null)
  const [importLoading, setImportLoading] = useState(false)
  const [importSummary, setImportSummary] = useState(null)

  const fetchMetrics = useCallback(async () => {
    setLoading(true)
    setSelectedIds(new Set())
    const params = { page, per_page: 15 }
    if (userId) params.user_id = userId
    if (search.trim()) params.search = search.trim()
    const res = await adminApi.listHealthMetrics(params)
    if (res?.ok) {
      setMetrics(res.data.metrics)
      setPagination(res.data.pagination)
    }
    setLoading(false)
  }, [page, userId, search])

  const fetchAthletes = useCallback(async () => {
    const res = await adminApi.listAthletesForMetrics()
    if (res?.ok) {
      setAthletes(res.data.athletes)
    }
  }, [])

  useEffect(() => {
    fetchAthletes()
  }, [fetchAthletes])

  useEffect(() => {
    fetchMetrics()
  }, [fetchMetrics])

  const startEdit = (metric) => {
    setEditingId(metric.id)
    setEditForm({
      date: metric.date || '',
      hrv: metric.hrv ?? '',
      rhr: metric.rhr ?? '',
      sleep_hours: metric.sleep_hours ?? '',
      sleep_deep_pct: metric.sleep_deep_pct ?? '',
      sleep_rem_pct: metric.sleep_rem_pct ?? '',
      spo2: metric.spo2 ?? '',
      respiratory_rate: metric.respiratory_rate ?? '',
      skin_temp: metric.skin_temp ?? '',
    })
  }

  const saveEdit = async () => {
    const body = { ...editForm }
    METRIC_FIELDS.forEach((f) => {
      if (f.type === 'number' && body[f.key] !== '') {
        body[f.key] = parseFloat(body[f.key])
      }
    })
    const res = await adminApi.updateHealthMetric(editingId, body)
    if (res?.ok) {
      setEditingId(null)
      fetchMetrics()
    } else {
      alert(res?.data?.message || 'Update failed')
    }
  }

  const confirmDelete = async () => {
    const res = await adminApi.deleteHealthMetric(deleteId)
    if (res?.ok) {
      setDeleteId(null)
      fetchMetrics()
    }
  }

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === metrics.length && metrics.length > 0) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(metrics.map((m) => m.id)))
    }
  }

  const batchDelete = async () => {
    if (selectedIds.size === 0) return
    if (!confirm(`Delete ${selectedIds.size} selected metric(s)? This cannot be undone.`)) return
    const res = await adminApi.batchDeleteHealthMetrics(Array.from(selectedIds))
    if (res?.ok) {
      setSelectedIds(new Set())
      fetchMetrics()
    } else {
      alert(res?.data?.message || 'Batch delete failed')
    }
  }

  const handleCreate = async () => {
    if (!createForm.user_id) {
      alert('Please select an athlete')
      return
    }
    const body = { ...createForm }
    METRIC_FIELDS.forEach((f) => {
      if (f.type === 'number' && body[f.key] !== '' && body[f.key] !== undefined) {
        body[f.key] = parseFloat(body[f.key])
      }
    })
    const res = await adminApi.createHealthMetric(body)
    if (res?.ok) {
      setIsCreating(false)
      setCreateForm({ user_id: '', date: new Date().toISOString().split('T')[0] })
      setUserId(String(res.data.metric.user_id))
      setPage(1)
      fetchMetrics()
    } else {
      alert(res?.data?.message || 'Create failed')
    }
  }

  const handleImportFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImportFile(file)
    setImportPreview(null)
    setImportSummary(null)
  }

  const previewImport = async () => {
    if (!importFile) return
    setImportLoading(true)
    const res = await adminApi.previewHealthMetricsImport(importFile)
    if (res?.ok) {
      setImportPreview(res.data)
    } else {
      alert(res?.data?.message || 'Preview failed')
    }
    setImportLoading(false)
  }

  const confirmImport = async () => {
    if (!importFile) return
    setImportLoading(true)
    const res = await adminApi.importHealthMetrics(importFile)
    if (res?.ok) {
      setImportSummary(res.data.summary)
      setImportPreview(null)
      setImportFile(null)
      fetchMetrics()
    } else {
      alert(res?.data?.message || 'Import failed')
    }
    setImportLoading(false)
  }

  const closeImport = () => {
    setImportOpen(false)
    setImportFile(null)
    setImportPreview(null)
    setImportSummary(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-admin-900">Health Metrics</h2>
          <p className="text-sm text-admin-500 mt-1">View and edit athlete-imported health data</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setImportOpen(true)} className="btn-secondary flex items-center gap-2">
            <Upload size={16} />
            Import
          </button>
          <button onClick={() => setIsCreating(true)} className="btn-primary flex items-center gap-2">
            <Plus size={16} />
            Add Metric
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search date, athlete, email..."
            className="input pl-9 w-64"
          />
        </div>
        <select
          value={userId}
          onChange={(e) => { setUserId(e.target.value); setPage(1) }}
          className="input w-56"
        >
          <option value="">All Athletes</option>
          {athletes.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name} ({a.email})
            </option>
          ))}
        </select>
      </div>

      {/* Batch actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between bg-rose-50 border border-rose-200 rounded-lg px-4 py-3">
          <p className="text-sm text-rose-700 font-medium">
            {selectedIds.size} row(s) selected
          </p>
          <button onClick={batchDelete} className="btn-danger flex items-center gap-2 text-sm">
            <Trash2 size={14} />
            Delete Selected
          </button>
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-admin-50 border-b border-admin-200">
              <tr>
                <th className="table-header w-10">
                  <input
                    type="checkbox"
                    checked={metrics.length > 0 && selectedIds.size === metrics.length}
                    onChange={toggleSelectAll}
                    className="rounded border-admin-300 text-admin-800 focus:ring-admin-500"
                  />
                </th>
                <th className="table-header">Athlete</th>
                {METRIC_FIELDS.map((f) => (
                  <th key={f.key} className="table-header whitespace-nowrap">{f.label}</th>
                ))}
                <th className="table-header w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={METRIC_FIELDS.length + 3} className="px-4 py-4">
                      <div className="h-6 bg-admin-100 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : metrics.length === 0 ? (
                <tr>
                  <td colSpan={METRIC_FIELDS.length + 3} className="px-4 py-12 text-center text-sm text-admin-400">
                    <Activity size={32} className="mx-auto mb-2 text-admin-300" />
                    No metrics found
                  </td>
                </tr>
              ) : (
                metrics.map((metric) => (
                  <tr key={metric.id} className="hover:bg-admin-50/50 transition-colors">
                    {editingId === metric.id ? (
                      <td colSpan={METRIC_FIELDS.length + 3} className="px-4 py-4 bg-blue-50/50">
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
                          {METRIC_FIELDS.map((f) => (
                            <div key={f.key}>
                              <label className="block text-xs text-admin-500 mb-1">{f.label}</label>
                              <input
                                type={f.type}
                                step={f.step}
                                value={editForm[f.key] ?? ''}
                                onChange={(e) => setEditForm({ ...editForm, [f.key]: e.target.value })}
                                className="input w-full"
                              />
                            </div>
                          ))}
                          <div className="flex items-center gap-2">
                            <button onClick={saveEdit} className="btn-primary px-3 py-1.5 text-xs"><Check size={14} /></button>
                            <button onClick={() => setEditingId(null)} className="btn-secondary px-3 py-1.5 text-xs"><X size={14} /></button>
                          </div>
                        </div>
                      </td>
                    ) : (
                      <>
                        <td className="table-cell">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(metric.id)}
                            onChange={() => toggleSelect(metric.id)}
                            className="rounded border-admin-300 text-admin-800 focus:ring-admin-500"
                          />
                        </td>
                        <td className="table-cell whitespace-nowrap">
                          <p className="font-medium text-admin-900">{metric.user_name || '-'}</p>
                          <p className="text-xs text-admin-400">{metric.user_email || '-'}</p>
                        </td>
                        {METRIC_FIELDS.map((f) => (
                          <td key={f.key} className="table-cell whitespace-nowrap text-sm text-admin-700">
                            {metric[f.key] ?? '-'}
                          </td>
                        ))}
                        <td className="table-cell">
                          <div className="flex items-center gap-1">
                            <button onClick={() => startEdit(metric)} className="btn-ghost p-1.5">
                              <Pencil size={14} />
                            </button>
                            <button onClick={() => setDeleteId(metric.id)} className="btn-ghost p-1.5 text-accent-rose hover:text-accent-rose">
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

      {/* Create Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-admin-900 mb-4">Add Health Metric</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="col-span-2 md:col-span-3">
                <label className="block text-sm text-admin-600 mb-1">Athlete</label>
                <select
                  value={createForm.user_id}
                  onChange={(e) => setCreateForm({ ...createForm, user_id: e.target.value })}
                  className="input w-full"
                >
                  <option value="">Select athlete</option>
                  {athletes.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.email})
                    </option>
                  ))}
                </select>
              </div>
              {METRIC_FIELDS.map((f) => (
                <div key={f.key}>
                  <label className="block text-sm text-admin-600 mb-1">{f.label}</label>
                  <input
                    type={f.type}
                    step={f.step}
                    value={createForm[f.key] ?? ''}
                    onChange={(e) => setCreateForm({ ...createForm, [f.key]: e.target.value })}
                    className="input w-full"
                  />
                </div>
              ))}
            </div>
            <div className="flex items-center justify-end gap-2 mt-6">
              <button onClick={() => setIsCreating(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleCreate} className="btn-primary">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {importOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl p-6 w-full max-w-3xl mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-admin-900 mb-1">Import Health Metrics</h3>
            <p className="text-sm text-admin-500 mb-4">
              Upload CSV/Excel with columns: date, user_id (or email), hrv, rhr, sleep_hours, etc.
            </p>

            {importSummary ? (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800 font-medium">Import complete</p>
                  <p className="text-sm text-green-700 mt-1">
                    Created: {importSummary.created} | Errors: {importSummary.errors.length}
                  </p>
                </div>
                {importSummary.errors.length > 0 && (
                  <div className="max-h-48 overflow-y-auto border border-admin-200 rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-admin-50">
                        <tr>
                          <th className="px-3 py-2 text-left">Row</th>
                          <th className="px-3 py-2 text-left">Reason</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-admin-100">
                        {importSummary.errors.map((err, idx) => (
                          <tr key={idx}>
                            <td className="px-3 py-2">{err.row}</td>
                            <td className="px-3 py-2 text-rose-600">{err.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <div className="flex justify-end">
                  <button onClick={closeImport} className="btn-primary">Done</button>
                </div>
              </div>
            ) : (
              <>
                <div className="border-2 border-dashed border-admin-300 rounded-lg p-6 text-center hover:bg-admin-50/50 transition-colors">
                  <FileSpreadsheet size={32} className="mx-auto text-admin-400 mb-2" />
                  <label className="block cursor-pointer">
                    <span className="text-sm text-admin-600">
                      {importFile ? importFile.name : 'Click to select CSV or Excel file'}
                    </span>
                    <input
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleImportFileChange}
                      className="hidden"
                    />
                  </label>
                </div>

                {importPreview && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm text-admin-600">
                      Total: {importPreview.total} | Valid: {importPreview.valid_count}
                    </p>
                    <div className="max-h-48 overflow-y-auto border border-admin-200 rounded-lg">
                      <table className="w-full text-sm">
                        <thead className="bg-admin-50">
                          <tr>
                            <th className="px-3 py-2 text-left">Row</th>
                            <th className="px-3 py-2 text-left">Date</th>
                            <th className="px-3 py-2 text-left">Athlete</th>
                            <th className="px-3 py-2 text-left">Status</th>
                            <th className="px-3 py-2 text-left">Issues</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-admin-100">
                          {importPreview.preview.map((row, idx) => (
                            <tr key={idx}>
                              <td className="px-3 py-2">{row.row}</td>
                              <td className="px-3 py-2">{row.date}</td>
                              <td className="px-3 py-2">{row.user_name}</td>
                              <td className="px-3 py-2">
                                <span className={`badge ${row.valid ? 'bg-green-50 text-green-700' : 'bg-rose-50 text-rose-700'}`}>
                                  {row.valid ? 'Valid' : 'Invalid'}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-rose-600">{row.issues.join(', ') || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 mt-6">
                  <button onClick={closeImport} className="btn-secondary">Cancel</button>
                  {importPreview ? (
                    <button
                      onClick={confirmImport}
                      disabled={importLoading || importPreview.valid_count === 0}
                      className="btn-primary disabled:opacity-50"
                    >
                      {importLoading ? 'Importing...' : 'Confirm Import'}
                    </button>
                  ) : (
                    <button
                      onClick={previewImport}
                      disabled={!importFile || importLoading}
                      className="btn-primary disabled:opacity-50"
                    >
                      {importLoading ? 'Previewing...' : 'Preview'}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-admin-900">Delete Metric?</h3>
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

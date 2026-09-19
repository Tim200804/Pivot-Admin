import { useState, useCallback } from 'react'
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, XCircle, Download } from 'lucide-react'
import { adminApi } from '../utils/api'

export default function ImportPage() {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState(null)

  const onDrop = useCallback((e) => {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }, [])

  const handleFile = async (f) => {
    setFile(f)
    setPreview(null)
    setResult(null)
    setPreviewLoading(true)
    const res = await adminApi.previewImport(f)
    setPreviewLoading(false)
    if (res?.ok) {
      setPreview(res.data.preview)
    } else {
      alert(res?.data?.message || 'Preview failed')
    }
  }

  const handleImport = async () => {
    if (!file) return
    setImporting(true)
    const res = await adminApi.importUsers(file)
    setImporting(false)
    if (res?.ok) {
      setResult(res.data.summary)
      setFile(null)
      setPreview(null)
    } else {
      alert(res?.data?.message || 'Import failed')
    }
  }

  const downloadTemplate = () => {
    const headers = 'email,name,role,password,sport,school,team_name,position,coach_role,height,weight\n'
    const example = 'john.doe@example.com,John Doe,athlete,Password123,rowing,UPenn,Varsity,Port,,180,75\n'
    const blob = new Blob([headers + example], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'pivot_users_template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const validCount = preview?.filter((r) => r.valid).length ?? 0
  const invalidCount = preview?.filter((r) => !r.valid).length ?? 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-admin-900">Import Users</h2>
          <p className="text-sm text-admin-500 mt-1">Bulk import athletes and coaches via CSV or Excel</p>
        </div>
        <button onClick={downloadTemplate} className="btn-secondary text-sm">
          <Download size={16} />
          Download Template
        </button>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        className="card p-8 border-2 border-dashed border-admin-200 hover:border-admin-400 transition-colors"
      >
        <div className="text-center">
          <div className="w-12 h-12 bg-admin-50 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Upload size={24} className="text-admin-500" />
          </div>
          <p className="text-sm text-admin-700 font-medium">Drag and drop your file here</p>
          <p className="text-xs text-admin-400 mt-1">or</p>
          <label className="mt-3 inline-block">
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              className="hidden"
            />
            <span className="btn-primary cursor-pointer">Browse Files</span>
          </label>
          <p className="text-xs text-admin-400 mt-3">Supported: .csv, .xlsx, .xls</p>
        </div>
      </div>

      {/* File Info */}
      {file && (
        <div className="card p-4 flex items-center gap-3">
          <FileSpreadsheet size={20} className="text-accent-teal" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-admin-900 truncate">{file.name}</p>
            <p className="text-xs text-admin-400">{(file.size / 1024).toFixed(1)} KB</p>
          </div>
          <button onClick={() => { setFile(null); setPreview(null); setResult(null) }} className="btn-ghost p-1.5">
            <XCircle size={16} />
          </button>
        </div>
      )}

      {/* Preview */}
      {previewLoading && (
        <div className="card p-8 text-center">
          <div className="w-8 h-8 border-2 border-admin-200 border-t-admin-800 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-admin-500 mt-3">Analyzing file...</p>
        </div>
      )}

      {preview && (
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-admin-200 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-admin-700">
                {preview.length} rows
              </span>
              <span className="badge bg-emerald-50 text-emerald-700">
                <CheckCircle size={12} className="mr-1" />
                {validCount} valid
              </span>
              {invalidCount > 0 && (
                <span className="badge bg-rose-50 text-rose-700">
                  <XCircle size={12} className="mr-1" />
                  {invalidCount} invalid
                </span>
              )}
            </div>
            <button
              onClick={handleImport}
              disabled={importing || validCount === 0}
              className="btn-primary disabled:opacity-40"
            >
              {importing ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Upload size={16} />
                  Import {validCount} Users
                </>
              )}
            </button>
          </div>
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full">
              <thead className="bg-admin-50 sticky top-0">
                <tr>
                  <th className="table-header w-16">Row</th>
                  <th className="table-header">Email</th>
                  <th className="table-header">Name</th>
                  <th className="table-header">Role</th>
                  <th className="table-header">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-100">
                {preview.map((row) => (
                  <tr key={row.row} className={!row.valid ? 'bg-rose-50/30' : ''}>
                    <td className="table-cell text-admin-400">{row.row}</td>
                    <td className="table-cell">{row.email || '-'}</td>
                    <td className="table-cell">{row.name || '-'}</td>
                    <td className="table-cell">{row.role || '-'}</td>
                    <td className="table-cell">
                      {row.valid ? (
                        <span className="badge bg-emerald-50 text-emerald-700">
                          <CheckCircle size={12} className="mr-1" />
                          Ready
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-accent-rose text-xs">
                          <AlertCircle size={12} />
                          {row.issues?.join(', ') || 'Invalid'}
                          {row.duplicate && ' (duplicate)'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-admin-800 mb-3">Import Complete</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-emerald-50 text-center">
              <p className="text-2xl font-bold text-emerald-700">{result.created}</p>
              <p className="text-xs text-emerald-600 mt-1">Created</p>
            </div>
            <div className="p-4 rounded-xl bg-amber-50 text-center">
              <p className="text-2xl font-bold text-amber-700">{result.skipped}</p>
              <p className="text-xs text-amber-600 mt-1">Skipped (duplicates)</p>
            </div>
            <div className="p-4 rounded-xl bg-rose-50 text-center">
              <p className="text-2xl font-bold text-rose-700">{result.errors.length}</p>
              <p className="text-xs text-rose-600 mt-1">Errors</p>
            </div>
          </div>
          {result.errors.length > 0 && (
            <div className="mt-4 space-y-2">
              {result.errors.slice(0, 5).map((err) => (
                <p key={err.row} className="text-xs text-accent-rose">
                  Row {err.row}: {err.reason}
                </p>
              ))}
              {result.errors.length > 5 && (
                <p className="text-xs text-admin-400">...and {result.errors.length - 5} more</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

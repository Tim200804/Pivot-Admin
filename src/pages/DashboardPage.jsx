import { useEffect, useState } from 'react'
import { Users, Activity, MessageSquare, AlertTriangle, TrendingUp } from 'lucide-react'
import { adminApi } from '../utils/api'

const statCards = [
  { key: 'users', label: 'Total Users', icon: Users, color: 'text-accent-blue', bg: 'bg-blue-50' },
  { key: 'checkins', label: 'Check-ins', icon: Activity, color: 'text-accent-teal', bg: 'bg-teal-50' },
  { key: 'messages', label: 'Messages', icon: MessageSquare, color: 'text-accent-amber', bg: 'bg-amber-50' },
  { key: 'alerts', label: 'Alerts', icon: AlertTriangle, color: 'text-accent-rose', bg: 'bg-rose-50' },
]

export default function DashboardPage() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminApi.stats().then((res) => {
      if (res?.ok) setStats(res.data.stats)
      setLoading(false)
    })
  }, [])

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-admin-900">Dashboard</h2>
        <p className="text-sm text-admin-500 mt-1">Overview of your platform</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ key, label, icon: Icon, color, bg }) => (
          <div key={key} className="card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-admin-500">{label}</p>
                <p className="text-2xl font-bold text-admin-900 mt-1">
                  {loading ? '-' : (stats?.[key] ?? 0).toLocaleString()}
                </p>
              </div>
              <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center`}>
                <Icon size={20} className={color} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Role Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-admin-800 mb-4">User Roles</h3>
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-8 bg-admin-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : stats?.role_breakdown ? (
            <div className="space-y-3">
              {Object.entries(stats.role_breakdown).map(([role, count]) => (
                <div key={role} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        role === 'athlete' ? 'bg-accent-teal' : 'bg-accent-blue'
                      }`}
                    />
                    <span className="text-sm text-admin-700 capitalize">{role}s</span>
                  </div>
                  <span className="text-sm font-semibold text-admin-900">{count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-admin-400">No data</p>
          )}
        </div>

        <div className="card p-6">
          <h3 className="text-sm font-semibold text-admin-800 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <TrendingUp size={16} className="text-accent-blue" />
              </div>
              <div>
                <p className="text-sm text-admin-700">
                  <span className="font-semibold">{stats?.recent_signups ?? 0}</span> new signups
                </p>
                <p className="text-xs text-admin-400">in the last 7 days</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center">
                <Activity size={16} className="text-accent-teal" />
              </div>
              <div>
                <p className="text-sm text-admin-700">
                  <span className="font-semibold">{stats?.health_metrics ?? 0}</span> health metrics
                </p>
                <p className="text-xs text-admin-400">total records stored</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                <AlertTriangle size={16} className="text-accent-amber" />
              </div>
              <div>
                <p className="text-sm text-admin-700">
                  <span className="font-semibold">{stats?.interventions ?? 0}</span> interventions
                </p>
                <p className="text-xs text-admin-400">recorded to date</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

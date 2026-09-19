import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import UsersPage from './pages/UsersPage'
import ImportPage from './pages/ImportPage'
import { adminApi } from './utils/api'

function RequireAuth({ children }) {
  const [auth, setAuth] = useState(null)
  const location = useLocation()

  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    if (!token) {
      setAuth(false)
      return
    }
    adminApi.me().then((res) => {
      setAuth(res?.ok && res?.data?.success)
    })
  }, [location.pathname])

  if (auth === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-admin-300 border-t-admin-800 rounded-full animate-spin" />
      </div>
    )
  }

  if (!auth) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/*"
        element={
          <RequireAuth>
            <Layout>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/users" element={<UsersPage />} />
                <Route path="/import" element={<ImportPage />} />
              </Routes>
            </Layout>
          </RequireAuth>
        }
      />
    </Routes>
  )
}

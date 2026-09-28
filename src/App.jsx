import { useState } from 'react'
import { BrowserRouter, Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import api from './api'
import { createToken, getValidToken, hasPermission, readToken, users } from './auth'
import './App.css'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  function handleLogin(event) {
    event.preventDefault()

    // Find a hardcoded user with the entered email and password.
    const user = users.find(
      (item) => item.email === email && item.password === password,
    )

    if (!user) {
      setError('Incorrect email or password')
      return
    }

    // Create and store the simulated JWT token.
    const token = createToken(user)
    localStorage.setItem('token', token)

    // Store basic user information for easy use on the dashboard.
    localStorage.setItem(
      'user',
      JSON.stringify({ email: user.email, role: user.role }),
    )

    navigate('/dashboard')
  }

  return (
    <main className="page">
      <form className="login-box" onSubmit={handleLogin}>
        <p className="eyebrow">Experiment 3</p>
        <h1>Role-Based Login</h1>
        <p className="intro">Sign in with one of the demo accounts.</p>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />

        {error && <p className="error">{error}</p>}
        <button type="submit">Login</button>
      </form>
    </main>
  )
}

function Navbar({ role, onLogout }) {
  return (
    <nav className="navbar">
      <Link className="brand" to="/dashboard">RBAC Demo</Link>
      <div className="nav-links">
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/admin">Admin</Link>
        <Link to="/editor">Editor</Link>
        <Link to="/viewer">Viewer</Link>
      </div>
      <div className="nav-user">
        <span className="role-badge">{role}</span>
        <button className="nav-logout" type="button" onClick={onLogout}>Logout</button>
      </div>
    </nav>
  )
}

function Dashboard() {
  const [apiMessage, setApiMessage] = useState('')
  const navigate = useNavigate()
  const token = getValidToken()
  const tokenUser = readToken(token)

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  async function testApiRequest() {
    setApiMessage('Sending request...')

    try {
      await api.get('/api/test')
      setApiMessage('Request succeeded')
    } catch (error) {
      let status = 'unknown'

      if (error.response) {
        status = error.response.status
      }

      setApiMessage(`Request failed with status ${status}`)
    }
  }

  return (
    <main className="app-shell">
      <Navbar role={tokenUser.role} onLogout={logout} />
      <section className="content">
        <div className="page-heading">
          <p className="eyebrow">Protected area</p>
          <h1>Dashboard</h1>
          <p className="intro">Your account details and available permissions.</p>
        </div>
        <div className="dashboard-grid">
          <section className="info-card">
            <h2>Account</h2>
            <p className="detail-label">Email</p>
            <p>{tokenUser.user.email}</p>
            <p className="detail-label">Role</p>
            <p className="role-text">{tokenUser.role}</p>
          </section>
          <section className="info-card">
            <h2>Available actions</h2>
            <div className="actions">
              {hasPermission(tokenUser.role, 'create') && (
                <button className="action-button" type="button">Create</button>
              )}
              {hasPermission(tokenUser.role, 'edit') && (
                <button className="action-button" type="button">Edit</button>
              )}
              {hasPermission(tokenUser.role, 'delete') && (
                <button className="action-button danger" type="button">Delete</button>
              )}
              {hasPermission(tokenUser.role, 'read') && (
                <button className="action-button" type="button">Read</button>
              )}
            </div>
            <p className="success">Login successful</p>
          </section>
        </div>
        <section className="request-panel">
          <div>
            <h2>Axios demonstration</h2>
            <p>Send a request with the simulated token.</p>
          </div>
          <button className="secondary-button" type="button" onClick={testApiRequest}>Test Request</button>
          {apiMessage && <p className="request-message">{apiMessage}</p>}
        </section>
      </section>
    </main>
  )
}

// This component allows a page only when a token exists.
function ProtectedRoute({ children }) {
  const token = getValidToken()

  if (!token) {
    return <Navigate to="/login" replace />
  }

  return children
}

function ExperimentPage({ title, requiredPermission }) {
  const navigate = useNavigate()
  const token = getValidToken()
  const tokenUser = readToken(token)

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  if (!hasPermission(tokenUser.role, requiredPermission)) {
    return (
      <main className="app-shell">
        <Navbar role={tokenUser.role} onLogout={logout} />
        <section className="content centered-content">
          <section className="info-card access-denied">
            <p className="eyebrow">Permission check</p>
            <h1>Access Denied</h1>
            <p>You do not have permission to view this page.</p>
          </section>
        </section>
      </main>
    )
  }

  return (
    <main className="app-shell">
      <Navbar role={tokenUser.role} onLogout={logout} />
      <section className="content centered-content">
        <section className="info-card">
          <p className="eyebrow">Protected page</p>
          <h1>{title}</h1>
          <p>You have the <strong>{requiredPermission}</strong> permission.</p>
        </section>
      </section>
    </main>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <ExperimentPage title="Admin Page" requiredPermission="delete" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/editor"
          element={
            <ProtectedRoute>
              <ExperimentPage title="Editor Page" requiredPermission="edit" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/viewer"
          element={
            <ProtectedRoute>
              <ExperimentPage title="Viewer Page" requiredPermission="read" />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

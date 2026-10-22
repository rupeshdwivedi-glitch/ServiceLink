import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Register from './pages/Register'
import BrowseServices from './pages/BrowseServices'
import Dashboard from './pages/Dashboard'

function NavBar() {
  const { user, logout } = useAuth()
  return (
    <nav className="flex items-center justify-between p-4 border-b">
      <Link to="/" className="font-bold text-lg">
        ServiceLink
      </Link>
      <div className="flex gap-4">
        <Link to="/">Browse</Link>
        {user ? (
          <>
            <Link to="/dashboard">Dashboard</Link>
            <button onClick={logout}>Log out</button>
          </>
        ) : (
          <>
            <Link to="/login">Log in</Link>
            <Link to="/register">Sign up</Link>
          </>
        )}
      </div>
    </nav>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NavBar />
        <Routes>
          <Route path="/" element={<BrowseServices />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App

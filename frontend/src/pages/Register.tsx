import { useState, type FormEvent } from 'react'
import { useNavigate, Link, Navigate } from 'react-router-dom'
import { getMe, login as loginApi, register } from '../api/auth'
import { useAuth } from '../context/AuthContext'
import type { Role } from '../types'

export default function Register() {
  const navigate = useNavigate()
  const { user, login } = useAuth()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Role>('customer')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      await register({ name, email, password, role })
      // Registration doesn't return a token, so log in right after to get one.
      const tokenRes = await loginApi({ email, password })
      localStorage.setItem('token', tokenRes.access_token)
      const user = await getMe()
      login(tokenRes.access_token, user)
      navigate('/dashboard')
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : undefined
      setError(message ?? 'Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (user) return <Navigate to="/dashboard" replace />

  return (
    <div className="max-w-sm mx-auto p-8">
      <h1 className="text-xl font-bold mb-4">Sign up</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          className="border rounded px-3 py-2"
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          className="border rounded px-3 py-2"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="border rounded px-3 py-2"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <select className="border rounded px-3 py-2" value={role} onChange={(e) => setRole(e.target.value as Role)}>
          <option value="customer">I'm looking for services</option>
          <option value="provider">I provide services</option>
        </select>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          className="bg-blue-600 text-white rounded px-3 py-2 disabled:opacity-50"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Signing up...' : 'Sign up'}
        </button>
      </form>
      <p className="mt-4 text-sm">
        Already have an account? <Link to="/login" className="text-blue-600">Log in</Link>
      </p>
    </div>
  )
}

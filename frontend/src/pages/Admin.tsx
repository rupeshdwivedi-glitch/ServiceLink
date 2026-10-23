import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import {
  deleteServiceAdmin,
  deleteUser,
  listAllBookingsAdmin,
  listAllServicesAdmin,
  listAllUsers,
} from '../api/admin'
import { useAuth } from '../context/AuthContext'
import type { Booking, Service, User } from '../types'

export default function Admin() {
  const { user, isLoading: isAuthLoading } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user?.role !== 'admin') return
    loadAll()
  }, [user])

  function loadAll() {
    setIsLoading(true)
    setError(null)
    Promise.all([listAllUsers(), listAllServicesAdmin(), listAllBookingsAdmin()])
      .then(([usersRes, servicesRes, bookingsRes]) => {
        setUsers(usersRes)
        setServices(servicesRes)
        setBookings(bookingsRes)
      })
      .catch(() => setError('Could not load admin data.'))
      .finally(() => setIsLoading(false))
  }

  async function handleDeleteUser(id: number) {
    if (!confirm('Delete this user?')) return
    try {
      await deleteUser(id)
      setUsers((prev) => prev.filter((u) => u.id !== id))
    } catch (err: unknown) {
      alert(getErrorMessage(err, 'Could not delete this user.'))
    }
  }

  async function handleDeleteService(id: number) {
    if (!confirm('Delete this service?')) return
    try {
      await deleteServiceAdmin(id)
      setServices((prev) => prev.filter((s) => s.id !== id))
    } catch (err: unknown) {
      alert(getErrorMessage(err, 'Could not delete this service.'))
    }
  }

  if (isAuthLoading) return <div className="p-8">Loading...</div>
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'admin') return <Navigate to="/dashboard" replace />

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-xl font-bold mb-6">Admin</h1>

      {isLoading && <p>Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!isLoading && !error && (
        <div className="flex flex-col gap-10">
          <section>
            <h2 className="font-semibold mb-2">Users ({users.length})</h2>
            <ul className="flex flex-col gap-2">
              {users.map((u) => (
                <li key={u.id} className="border rounded p-3 flex justify-between items-center text-sm">
                  <span>
                    <strong>{u.name}</strong> — {u.email} ({u.role})
                  </span>
                  <button onClick={() => handleDeleteUser(u.id)} className="text-red-600 text-sm">
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="font-semibold mb-2">Services ({services.length})</h2>
            <ul className="flex flex-col gap-2">
              {services.map((s) => (
                <li key={s.id} className="border rounded p-3 flex justify-between items-center text-sm">
                  <span>
                    <strong>{s.title}</strong> — {s.category} (${s.price}, provider #{s.provider_id})
                  </span>
                  <button onClick={() => handleDeleteService(s.id)} className="text-red-600 text-sm">
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="font-semibold mb-2">Bookings ({bookings.length})</h2>
            <ul className="flex flex-col gap-2">
              {bookings.map((b) => (
                <li key={b.id} className="border rounded p-3 text-sm">
                  Booking #{b.id} — customer #{b.customer_id}, service #{b.service_id},{' '}
                  {new Date(b.booking_date).toLocaleString()} — <strong>{b.status}</strong>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </div>
  )
}

function getErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'response' in err) {
    return (err as { response?: { data?: { detail?: string } } }).response?.data?.detail ?? fallback
  }
  return fallback
}

import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { listMyBookings, listProviderBookings, updateBookingStatus } from '../api/bookings'
import { listServices } from '../api/services'
import { useAuth } from '../context/AuthContext'
import type { Booking, BookingStatus, Service } from '../types'

const NEXT_STATUS: Partial<Record<BookingStatus, BookingStatus>> = {
  pending: 'confirmed',
  confirmed: 'completed',
}

export default function Dashboard() {
  const { user, isLoading: isAuthLoading } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    setIsLoading(true)
    setError(null)
    const bookingsPromise = user.role === 'provider' ? listProviderBookings() : listMyBookings()
    Promise.all([bookingsPromise, listServices()])
      .then(([bookingsRes, servicesRes]) => {
        setBookings(bookingsRes)
        setServices(servicesRes)
      })
      .catch(() => setError('Could not load your dashboard.'))
      .finally(() => setIsLoading(false))
  }, [user])

  function serviceTitle(serviceId: number): string {
    return services.find((s) => s.id === serviceId)?.title ?? `Service #${serviceId}`
  }

  async function handleAdvanceStatus(booking: Booking) {
    const next = NEXT_STATUS[booking.status]
    if (!next) return
    const updated = await updateBookingStatus(booking.id, next)
    setBookings((prev) => prev.map((b) => (b.id === updated.id ? updated : b)))
  }

  async function handleCancel(booking: Booking) {
    const updated = await updateBookingStatus(booking.id, 'cancelled')
    setBookings((prev) => prev.map((b) => (b.id === updated.id ? updated : b)))
  }

  if (isAuthLoading) return <div className="p-8">Loading...</div>
  if (!user) return <Navigate to="/login" replace />

  return (
    <div className="max-w-3xl mx-auto p-8">
      <h1 className="text-xl font-bold mb-4">
        {user.role === 'provider' ? 'Bookings for your services' : 'Your bookings'}
      </h1>

      {isLoading && <p>Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!isLoading && !error && bookings.length === 0 && <p>No bookings yet.</p>}

      <ul className="flex flex-col gap-3">
        {bookings.map((booking) => (
          <li key={booking.id} className="border rounded p-4 flex justify-between items-center">
            <div>
              <p className="font-semibold">{serviceTitle(booking.service_id)}</p>
              <p className="text-sm text-gray-500">{new Date(booking.booking_date).toLocaleString()}</p>
              <p className="text-sm">
                Status: <span className="font-medium">{booking.status}</span>
              </p>
            </div>
            {user.role === 'provider' && !['completed', 'cancelled'].includes(booking.status) && (
              <div className="flex gap-2">
                {NEXT_STATUS[booking.status] && (
                  <button
                    onClick={() => handleAdvanceStatus(booking)}
                    className="bg-blue-600 text-white rounded px-3 py-1 text-sm"
                  >
                    Mark {NEXT_STATUS[booking.status]}
                  </button>
                )}
                <button onClick={() => handleCancel(booking)} className="border rounded px-3 py-1 text-sm">
                  Cancel
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

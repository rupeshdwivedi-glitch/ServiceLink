import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { createBooking } from '../api/bookings'
import { listServices } from '../api/services'
import { useAuth } from '../context/AuthContext'
import type { Service } from '../types'

const CATEGORIES = ['All', 'Plumber', 'Cleaner', 'Electrician', 'Tutor', 'Photographer']

export default function BrowseServices() {
  const [services, setServices] = useState<Service[]>([])
  const [category, setCategory] = useState('All')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setIsLoading(true)
    setError(null)
    listServices(category === 'All' ? undefined : category)
      .then(setServices)
      .catch(() => setError('Could not load services. Is the backend running?'))
      .finally(() => setIsLoading(false))
  }, [category])

  return (
    <div className="max-w-3xl mx-auto p-8">
      <h1 className="text-xl font-bold mb-4">Browse services</h1>

      <div className="flex gap-2 mb-6 flex-wrap">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`px-3 py-1 rounded border ${
              category === c ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {isLoading && <p>Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!isLoading && !error && services.length === 0 && <p>No services found in this category.</p>}

      <ul className="flex flex-col gap-3">
        {services.map((service) => (
          <ServiceCard key={service.id} service={service} />
        ))}
      </ul>
    </div>
  )
}

function ServiceCard({ service }: { service: Service }) {
  const { user } = useAuth()
  const [date, setDate] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'booked' | 'error'>('idle')

  async function handleBook() {
    if (!date) return
    setStatus('submitting')
    try {
      await createBooking(service.id, new Date(date).toISOString())
      setStatus('booked')
    } catch {
      setStatus('error')
    }
  }

  return (
    <li className="border rounded p-4">
      <div className="flex justify-between">
        <h2 className="font-semibold">{service.title}</h2>
        <span className="text-gray-600">${service.price}</span>
      </div>
      <p className="text-sm text-gray-500">{service.category}</p>
      {service.description && <p className="mt-2 text-sm">{service.description}</p>}

      {!user && (
        <p className="mt-3 text-sm">
          <Link to="/login" className="text-blue-600">
            Log in
          </Link>{' '}
          as a customer to book this service.
        </p>
      )}

      {user?.role === 'customer' && status !== 'booked' && (
        <div className="mt-3 flex gap-2 items-center">
          <input
            type="datetime-local"
            className="border rounded px-2 py-1 text-sm"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <button
            onClick={handleBook}
            disabled={!date || status === 'submitting'}
            className="bg-blue-600 text-white rounded px-3 py-1 text-sm disabled:opacity-50"
          >
            {status === 'submitting' ? 'Booking...' : 'Book'}
          </button>
          {status === 'error' && <span className="text-red-600 text-sm">Something went wrong.</span>}
        </div>
      )}

      {status === 'booked' && <p className="mt-3 text-sm text-green-700">Booked! Check your dashboard.</p>}
    </li>
  )
}

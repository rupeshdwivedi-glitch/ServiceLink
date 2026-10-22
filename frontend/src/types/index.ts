export type Role = 'customer' | 'provider'
export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled'

export interface User {
  id: number
  name: string
  email: string
  role: Role
  created_at: string
}

export interface Service {
  id: number
  provider_id: number
  title: string
  category: string
  description: string | null
  price: string
  created_at: string
}

export interface Booking {
  id: number
  customer_id: number
  service_id: number
  booking_date: string
  status: BookingStatus
  created_at: string
}

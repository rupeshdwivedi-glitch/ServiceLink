import { apiClient } from './client'
import type { Booking, BookingStatus } from '../types'

export async function createBooking(serviceId: number, bookingDate: string): Promise<Booking> {
  const res = await apiClient.post<Booking>('/bookings', { service_id: serviceId, booking_date: bookingDate })
  return res.data
}

export async function listMyBookings(): Promise<Booking[]> {
  const res = await apiClient.get<Booking[]>('/bookings/me')
  return res.data
}

export async function listProviderBookings(): Promise<Booking[]> {
  const res = await apiClient.get<Booking[]>('/bookings/provider')
  return res.data
}

export async function updateBookingStatus(bookingId: number, status: BookingStatus): Promise<Booking> {
  const res = await apiClient.put<Booking>(`/bookings/${bookingId}/status`, { status })
  return res.data
}

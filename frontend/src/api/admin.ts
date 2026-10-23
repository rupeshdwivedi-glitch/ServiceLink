import { apiClient } from './client'
import type { Booking, Service, User } from '../types'

export async function listAllUsers(): Promise<User[]> {
  const res = await apiClient.get<User[]>('/admin/users')
  return res.data
}

export async function deleteUser(userId: number): Promise<void> {
  await apiClient.delete(`/admin/users/${userId}`)
}

export async function listAllServicesAdmin(): Promise<Service[]> {
  const res = await apiClient.get<Service[]>('/admin/services')
  return res.data
}

export async function deleteServiceAdmin(serviceId: number): Promise<void> {
  await apiClient.delete(`/admin/services/${serviceId}`)
}

export async function listAllBookingsAdmin(): Promise<Booking[]> {
  const res = await apiClient.get<Booking[]>('/admin/bookings')
  return res.data
}

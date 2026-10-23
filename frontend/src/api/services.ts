import { apiClient } from './client'
import type { Service } from '../types'

export async function listServices(category?: string): Promise<Service[]> {
  const res = await apiClient.get<Service[]>('/services', {
    params: category ? { category } : undefined,
  })
  return res.data
}

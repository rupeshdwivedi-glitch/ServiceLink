import { apiClient } from './client'
import type { Role, User } from '../types'

interface RegisterPayload {
  name: string
  email: string
  password: string
  role: Role
}

interface LoginPayload {
  email: string
  password: string
}

interface TokenResponse {
  access_token: string
  token_type: string
}

export async function register(payload: RegisterPayload): Promise<User> {
  const res = await apiClient.post<User>('/auth/register', payload)
  return res.data
}

export async function login(payload: LoginPayload): Promise<TokenResponse> {
  const res = await apiClient.post<TokenResponse>('/auth/login', payload)
  return res.data
}

export async function getMe(): Promise<User> {
  const res = await apiClient.get<User>('/auth/me')
  return res.data
}

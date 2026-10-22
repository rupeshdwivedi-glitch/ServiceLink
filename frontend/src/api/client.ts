import axios from 'axios'

export const API_BASE_URL = 'http://localhost:8000'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
})

// Attach the saved JWT (if any) to every outgoing request.
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

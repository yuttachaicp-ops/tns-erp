import AsyncStorage from '@react-native-async-storage/async-storage'

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://your-backend.onrender.com'

async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem('tns-token')
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const token = await getToken()
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    }
    if (token) headers['Authorization'] = `Bearer ${token}`

    const res = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers })
    const json = await res.json()
    return json
  } catch (err) {
    return { success: false, error: 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้' }
  }
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  logout: () => request('/api/auth/logout', { method: 'POST' }),
  me: () => request('/api/auth/me'),

  // Dashboard
  dashboard: () => request('/api/dashboard'),

  // Photo Queue
  getPhotoQueue: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : ''
    return request(`/api/photo-queue${q}`)
  },
  createPhoto: (data: Record<string, unknown>) =>
    request('/api/photo-queue', { method: 'POST', body: JSON.stringify(data) }),
  updatePhoto: (id: string, data: Record<string, unknown>) =>
    request(`/api/photo-queue/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePhoto: (id: string) =>
    request(`/api/photo-queue/${id}`, { method: 'DELETE' }),

  // Listing Queue
  getListingQueue: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : ''
    return request(`/api/listing-queue${q}`)
  },
  createListing: (data: Record<string, unknown>) =>
    request('/api/listing-queue', { method: 'POST', body: JSON.stringify(data) }),
  updateListing: (id: string, data: Record<string, unknown>) =>
    request(`/api/listing-queue/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteListing: (id: string) =>
    request(`/api/listing-queue/${id}`, { method: 'DELETE' }),

  // Daily Logs
  getDailyLogs: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : ''
    return request(`/api/daily-logs${q}`)
  },
  createLog: (data: Record<string, unknown>) =>
    request('/api/daily-logs', { method: 'POST', body: JSON.stringify(data) }),
  updateLog: (id: string, data: Record<string, unknown>) =>
    request(`/api/daily-logs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteLog: (id: string) =>
    request(`/api/daily-logs/${id}`, { method: 'DELETE' }),

  // Activity Logs
  getActivityLogs: () => request('/api/activity-logs'),
}

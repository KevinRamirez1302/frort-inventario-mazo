import axios from 'axios'

export const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const msg = error.response?.data?.message ?? error.message ?? 'Error desconocido'
    return Promise.reject(new Error(Array.isArray(msg) ? msg.join(', ') : msg))
  }
)

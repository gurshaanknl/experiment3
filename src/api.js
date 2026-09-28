import axios from 'axios'
import { getValidToken } from './auth'

// Create one simple Axios instance for API requests.
const api = axios.create()

// This runs before every request.
api.interceptors.request.use((config) => {
  // This also creates a new token when the old one has expired.
  const token = getValidToken()

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

// This runs when the server sends a response.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }

    return Promise.reject(error)
  },
)

export default api
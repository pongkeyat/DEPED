import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'

axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')

  config.withCredentials = true

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
    <App />
    </AuthProvider>
  </StrictMode>,
)
import axios from 'axios'

export const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

const ACCESS_TOKEN_KEY = 'kurio:demo:access-token:v1'

api.interceptors.request.use(config => {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY)
  if (token) config.headers.set('Authorization', `Bearer ${token}`)
  return config
})

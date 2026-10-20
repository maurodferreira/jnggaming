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


// Session failures from protected endpoints invalidate the local account view.
// Login errors are regular form-validation responses and must not trigger this.
api.interceptors.response.use(
  response => response,
  error => {
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      localStorage.getItem(ACCESS_TOKEN_KEY) &&
      !/^\\/auth\\/(login|register)$/.test(error.config?.url ?? '')
    ) {
      localStorage.removeItem(ACCESS_TOKEN_KEY)
      window.dispatchEvent(new Event('kurio:session-expired'))
    }
    return Promise.reject(error)
  },
)

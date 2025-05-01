import axios from 'axios'

// Create axios instance with base URL
const api = axios.create({
	baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
	headers: {
		'Content-Type': 'application/json',
	},
})

// Add request interceptor to add auth token to all requests
api.interceptors.request.use(
	config => {
		// Get token from local storage
		const token = localStorage.getItem('token')

		// If token exists, add it to request headers
		if (token) {
			config.headers.Authorization = `Bearer ${token}`
		}

		return config
	},
	error => {
		return Promise.reject(error)
	}
)

// Add response interceptor to handle token expiration
api.interceptors.response.use(
	response => {
		return response
	},
	async error => {
		const originalRequest = error.config

		// If error is 401 (Unauthorized) and we haven't tried to refresh token yet
		if (error.response?.status === 401 && !originalRequest._retry) {
			originalRequest._retry = true

			try {
				// Try to refresh token
				const refreshToken = localStorage.getItem('refreshToken')

				if (refreshToken) {
					const response = await axios.post(
						`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/auth/refresh-token`,
						{ refreshToken }
					)

					// If refresh successful, save new tokens
					if (response.data.success) {
						localStorage.setItem('token', response.data.token)
						localStorage.setItem('refreshToken', response.data.refreshToken)

						// Update original request with new token
						originalRequest.headers.Authorization = `Bearer ${response.data.token}`

						// Retry the original request
						return api(originalRequest)
					}
				}

				// If we can't refresh, log out
				localStorage.removeItem('token')
				localStorage.removeItem('refreshToken')
				window.location.href = '/login'
			} catch (refreshError) {
				console.error('Token refresh failed:', refreshError)
				localStorage.removeItem('token')
				localStorage.removeItem('refreshToken')
				window.location.href = '/login'
			}
		}

		return Promise.reject(error)
	}
)

export default api

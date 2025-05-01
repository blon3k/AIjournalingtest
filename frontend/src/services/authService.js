import api from './api'

// Register user
const register = async userData => {
	const response = await api.post('/auth/register', userData)
	return response.data
}

// Login user
const login = async credentials => {
	const response = await api.post('/auth/login', credentials)
	return response.data
}

// Logout user
const logout = async () => {
	const response = await api.post('/auth/logout')
	return response.data
}

// Get current user
const getCurrentUser = async () => {
	const response = await api.get('/auth/me')
	return response.data.data
}

// Refresh token
const refreshToken = async refreshToken => {
	const response = await api.post('/auth/refresh-token', { refreshToken })
	return response.data
}

// Forgot password
const forgotPassword = async email => {
	const response = await api.post('/auth/forgot-password', { email })
	return response.data
}

// Reset password
const resetPassword = async (resetToken, password) => {
	const response = await api.post(`/auth/reset-password/${resetToken}`, { password })
	return response.data
}

// Verify email
const verifyEmail = async verificationToken => {
	const response = await api.get(`/auth/verify-email/${verificationToken}`)
	return response.data
}

const authService = {
	register,
	login,
	logout,
	getCurrentUser,
	refreshToken,
	forgotPassword,
	resetPassword,
	verifyEmail,
}

export default authService

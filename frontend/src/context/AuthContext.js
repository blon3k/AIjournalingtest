import React, { createContext, useContext, useState, useEffect } from 'react'
import authService from '../services/authService'

// Create the auth context
const AuthContext = createContext()

// AuthProvider component
export const AuthProvider = ({ children }) => {
	const [user, setUser] = useState(null)
	const [isAuthenticated, setIsAuthenticated] = useState(false)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState(null)

	// Initialize auth state on mount
	useEffect(() => {
		const initAuth = async () => {
			try {
				// Check if token exists in localStorage
				const token = localStorage.getItem('token')

				if (!token) {
					setLoading(false)
					return
				}

				// Validate token and get user data
				const userData = await authService.getCurrentUser()

				if (userData) {
					setUser(userData)
					setIsAuthenticated(true)
				}
			} catch (err) {
				console.error('Auth initialization error:', err)
				// Clear invalid tokens
				localStorage.removeItem('token')
				localStorage.removeItem('refreshToken')
			} finally {
				setLoading(false)
			}
		}

		initAuth()
	}, [])

	// Register user
	const register = async userData => {
		setLoading(true)
		setError(null)

		try {
			const response = await authService.register(userData)

			// Set token and user data
			localStorage.setItem('token', response.token)
			localStorage.setItem('refreshToken', response.refreshToken)

			setUser(response.user)
			setIsAuthenticated(true)

			return response.user
		} catch (err) {
			setError(err.response?.data?.message || 'Registration failed')
			throw err
		} finally {
			setLoading(false)
		}
	}

	// Login user
	const login = async credentials => {
		setLoading(true)
		setError(null)

		try {
			const response = await authService.login(credentials)

			// Set token and user data
			localStorage.setItem('token', response.token)
			localStorage.setItem('refreshToken', response.refreshToken)

			setUser(response.user)
			setIsAuthenticated(true)

			return response.user
		} catch (err) {
			setError(err.response?.data?.message || 'Login failed')
			throw err
		} finally {
			setLoading(false)
		}
	}

	// Logout user
	const logout = async () => {
		setLoading(true)

		try {
			await authService.logout()
		} catch (err) {
			console.error('Logout error:', err)
		} finally {
			// Clear auth state regardless of API success
			localStorage.removeItem('token')
			localStorage.removeItem('refreshToken')
			setUser(null)
			setIsAuthenticated(false)
			setLoading(false)
		}
	}

	// Refresh token
	const refreshToken = async () => {
		try {
			const refreshTokenValue = localStorage.getItem('refreshToken')

			if (!refreshTokenValue) {
				throw new Error('No refresh token available')
			}

			const response = await authService.refreshToken(refreshTokenValue)

			// Update access token
			localStorage.setItem('token', response.token)

			return response.token
		} catch (err) {
			// If refresh fails, logout user
			console.error('Token refresh failed:', err)
			logout()
			throw err
		}
	}

	// Update user data (e.g., after profile update)
	const updateUserData = updatedUser => {
		setUser(updatedUser)
	}

	return (
		<AuthContext.Provider
			value={{
				isAuthenticated,
				user,
				loading,
				error,
				register,
				login,
				logout,
				refreshToken,
				updateUserData,
			}}>
			{children}
		</AuthContext.Provider>
	)
}

// Custom hook to use auth context
export const useAuth = () => {
	const context = useContext(AuthContext)

	if (!context) {
		throw new Error('useAuth must be used within an AuthProvider')
	}

	return context
}

export default AuthContext

const User = require('../models/User')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
	try {
		const { name, email, password } = req.body

		// Check if user exists
		const userExists = await User.findOne({ email })
		if (userExists) {
			return res.status(400).json({
				success: false,
				message: 'User already exists',
			})
		}

		// Create new user
		const user = await User.create({
			name,
			email,
			password,
		})

		// Generate verification token
		const verificationToken = crypto.randomBytes(20).toString('hex')
		user.emailVerificationToken = verificationToken
		await user.save()

		// In a real app, send verification email here
		// sendVerificationEmail(user.email, verificationToken);

		// Generate JWT token
		const token = generateToken(user._id)
		const refreshToken = generateRefreshToken(user._id)

		// Save refresh token in user document
		user.refreshToken = refreshToken
		await user.save()

		// Remove password from response
		user.password = undefined

		res.status(201).json({
			success: true,
			token,
			refreshToken,
			user,
		})
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		})
	}
}

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
	try {
		const { email, password } = req.body

		// Check for user
		const user = await User.findOne({ email })
		if (!user) {
			return res.status(401).json({
				success: false,
				message: 'Invalid credentials',
			})
		}

		// Check if password matches
		const isMatch = await user.isPasswordMatch(password)
		if (!isMatch) {
			return res.status(401).json({
				success: false,
				message: 'Invalid credentials',
			})
		}

		// Generate JWT token
		const token = generateToken(user._id)
		const refreshToken = generateRefreshToken(user._id)

		// Save refresh token in user document
		user.refreshToken = refreshToken
		await user.save()

		// Remove password from response
		user.password = undefined

		res.status(200).json({
			success: true,
			token,
			refreshToken,
			user,
		})
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		})
	}
}

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
	try {
		// Clear refresh token in DB
		req.user.refreshToken = undefined
		await req.user.save()

		res.status(200).json({
			success: true,
			message: 'User logged out successfully',
		})
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		})
	}
}

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
	try {
		// User is already available in req.user from auth middleware
		res.status(200).json({
			success: true,
			data: req.user,
		})
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		})
	}
}

// @desc    Refresh access token using refresh token
// @route   POST /api/auth/refresh-token
// @access  Public
exports.refreshToken = async (req, res) => {
	try {
		const { refreshToken } = req.body

		if (!refreshToken) {
			return res.status(401).json({
				success: false,
				message: 'Refresh token is required',
			})
		}

		// Find user with this refresh token
		const user = await User.findOne({ refreshToken })
		if (!user) {
			return res.status(401).json({
				success: false,
				message: 'Invalid refresh token',
			})
		}

		try {
			// Verify refresh token
			jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET)

			// Generate new access token
			const token = generateToken(user._id)

			res.status(200).json({
				success: true,
				token,
			})
		} catch (error) {
			// If refresh token is expired, clear it
			user.refreshToken = undefined
			await user.save()

			return res.status(401).json({
				success: false,
				message: 'Refresh token expired, please login again',
			})
		}
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		})
	}
}

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
	try {
		const { email } = req.body

		const user = await User.findOne({ email })
		if (!user) {
			return res.status(404).json({
				success: false,
				message: 'User not found',
			})
		}

		// Generate reset token
		const resetToken = crypto.randomBytes(20).toString('hex')

		// Set reset token and expiry on user document
		user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex')
		user.passwordResetExpires = Date.now() + 30 * 60 * 1000 // 30 minutes

		await user.save()

		// In a real app, send password reset email here
		// sendPasswordResetEmail(user.email, resetToken);

		res.status(200).json({
			success: true,
			message: 'Password reset email sent',
		})
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		})
	}
}

// @desc    Reset password
// @route   POST /api/auth/reset-password/:resetToken
// @access  Public
exports.resetPassword = async (req, res) => {
	try {
		// Get token from params
		const { resetToken } = req.params
		const { password } = req.body

		// Hash token
		const passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex')

		// Find user with this token and check if token is still valid
		const user = await User.findOne({
			passwordResetToken,
			passwordResetExpires: { $gt: Date.now() },
		})

		if (!user) {
			return res.status(400).json({
				success: false,
				message: 'Invalid or expired token',
			})
		}

		// Set new password
		user.password = password
		user.passwordResetToken = undefined
		user.passwordResetExpires = undefined
		await user.save()

		// Generate new tokens
		const token = generateToken(user._id)
		const refreshToken = generateRefreshToken(user._id)

		// Save new refresh token
		user.refreshToken = refreshToken
		await user.save()

		res.status(200).json({
			success: true,
			message: 'Password reset successful',
			token,
			refreshToken,
		})
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		})
	}
}

// @desc    Verify email
// @route   GET /api/auth/verify-email/:verificationToken
// @access  Public
exports.verifyEmail = async (req, res) => {
	try {
		const { verificationToken } = req.params

		const user = await User.findOne({ emailVerificationToken: verificationToken })
		if (!user) {
			return res.status(400).json({
				success: false,
				message: 'Invalid verification token',
			})
		}

		// Mark email as verified
		user.emailVerified = true
		user.emailVerificationToken = undefined
		await user.save()

		res.status(200).json({
			success: true,
			message: 'Email verified successfully',
		})
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		})
	}
}

// Generate JWT token
const generateToken = id => {
	return jwt.sign({ id }, process.env.JWT_SECRET || process.env.ACCESS_TOKEN_SECRET, {
		expiresIn: process.env.JWT_EXPIRE || '1d',
	})
}

// Generate refresh token
const generateRefreshToken = id => {
	return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET || process.env.REFRESH_TOKEN_SECRET, {
		expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d',
	})
}

const express = require('express')
const router = express.Router()
const {
	register,
	login,
	logout,
	getMe,
	refreshToken,
	forgotPassword,
	resetPassword,
	verifyEmail,
} = require('../controllers/authController')
const { protect } = require('../middleware/auth')

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', register)

// @route   POST /api/auth/login
// @desc    Login user and return JWT token
// @access  Public
router.post('/login', login)

// @route   POST /api/auth/logout
// @desc    Logout user and clear cookies
// @access  Private
router.post('/logout', protect, logout)

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', protect, getMe)

// @route   POST /api/auth/refresh-token
// @desc    Refresh access token using refresh token
// @access  Public
router.post('/refresh-token', refreshToken)

// @route   POST /api/auth/forgot-password
// @desc    Send password reset email
// @access  Public
router.post('/forgot-password', forgotPassword)

// @route   POST /api/auth/reset-password/:resetToken
// @desc    Reset password
// @access  Public
router.post('/reset-password/:resetToken', resetPassword)

// @route   GET /api/auth/verify-email/:verificationToken
// @desc    Verify email address
// @access  Public
router.get('/verify-email/:verificationToken', verifyEmail)

module.exports = router

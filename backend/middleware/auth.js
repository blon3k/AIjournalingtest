const jwt = require('jsonwebtoken')
const User = require('../models/User')

// Protect routes - verify JWT token
exports.protect = async (req, res, next) => {
	let token

	// Handle preflight OPTIONS requests for CORS
	if (req.method === 'OPTIONS') {
		const origin = req.headers.origin || (req.headers.referer ? new URL(req.headers.referer).origin : '*')
		res.setHeader('Access-Control-Allow-Origin', origin)
		res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE')
		res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization')
		res.setHeader('Access-Control-Allow-Credentials', 'true')
		return res.status(200).end()
	}

	// Get token from Authorization header
	if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
		token = req.headers.authorization.split(' ')[1]
	}
	// Get token from cookie if not in header
	else if (req.cookies && req.cookies.token) {
		token = req.cookies.token
	}

	// Check if token exists
	if (!token) {
		return res.status(401).json({
			success: false,
			message: 'Not authorized to access this route',
		})
	}

	try {
		// Verify token
		const secret = process.env.JWT_SECRET || 'temporary_dev_secret_do_not_use_in_production'
		const decoded = jwt.verify(token, secret)

		// Get user from the token
		req.user = await User.findById(decoded.id).select('-password')

		if (!req.user) {
			return res.status(401).json({
				success: false,
				message: 'User not found',
			})
		}

		next()
	} catch (error) {
		console.error('Authentication error:', error)
		return res.status(401).json({
			success: false,
			message: 'Not authorized to access this route',
		})
	}
}

// Authorization middleware
exports.authorize = (...roles) => {
	return (req, res, next) => {
		if (!req.user) {
			return res.status(401).json({
				success: false,
				message: 'Not authorized to access this route',
			})
		}

		if (!roles.includes(req.user.role)) {
			return res.status(403).json({
				success: false,
				message: `User role ${req.user.role} is not authorized to access this route`,
			})
		}
		next()
	}
}

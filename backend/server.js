require('dotenv').config()
const express = require('express')
const cors = require('cors')
const connectDB = require('./config/db')
const path = require('path')

// Initialize Express
const app = express()
const PORT = process.env.PORT || 5000

// Connect to Database
connectDB()

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Import route files
const userRoutes = require('./routes/users')
const authRoutes = require('./routes/auth')
const postRoutes = require('./routes/posts')
const fileRoutes = require('./routes/files')
const chatRoutes = require('./routes/chats')
const aiRoutes = require('./routes/ai')

// Routes
app.use('/api/users', userRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/posts', postRoutes)
app.use('/api/files', fileRoutes)
app.use('/api/chats', chatRoutes)
app.use('/api/ai', aiRoutes)

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
	// Set static folder
	app.use(express.static('frontend/build'))

	app.get('*', (req, res) => {
		res.sendFile(path.resolve(__dirname, '../frontend', 'build', 'index.html'))
	})
}

// Error handling middleware
app.use((err, req, res, next) => {
	console.error(err.stack)
	res.status(500).json({
		success: false,
		message: err.message || 'Server Error',
	})
})

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))

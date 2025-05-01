const mongoose = require('mongoose')

const connectDB = async () => {
	try {
		const mongoURI = process.env.MONGODB_LOCAL

		console.log('mongoURI', mongoURI)

		if (!mongoURI) {
			throw new Error('MongoDB connection string is not defined in environment variables')
		}

		const conn = await mongoose.connect(mongoURI, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
			autoIndex: true, // Build indexes
			maxPoolSize: 10, // Maintain up to 10 socket connections
			serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
			socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
			family: 4, // Use IPv4, skip trying IPv6
		})

		console.log(`MongoDB Connected: ${conn.connection.host}`)

		// Handle errors after initial connection
		mongoose.connection.on('error', err => {
			console.error('MongoDB connection error:', err)
		})

		mongoose.connection.on('disconnected', () => {
			console.warn('MongoDB disconnected. Attempting to reconnect...')
		})

		mongoose.connection.on('reconnected', () => {
			console.log('MongoDB reconnected')
		})

		// If Node process ends, close the MongoDB connection
		process.on('SIGINT', async () => {
			try {
				await mongoose.connection.close()
				console.log('MongoDB connection closed through app termination')
				process.exit(0)
			} catch (err) {
				console.error('Error closing MongoDB connection:', err)
				process.exit(1)
			}
		})

		return conn
	} catch (error) {
		console.error('MongoDB connection error:', error)
		process.exit(1)
	}
}

module.exports = connectDB

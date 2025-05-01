const File = require('../models/File')
const User = require('../models/User')

// Define allowed text-based MIME types
const allowedMimeTypes = [
	'text/plain',
	'text/markdown',
	'text/csv',
	'text/html',
	'text/css',
	'application/javascript',
	'application/json',
	'application/xml',
	'application/x-yaml',
	'text/x-python',
	'application/x-sh',
	'text/x-java-source',
	// Add more as needed
]

// @desc    Upload a text file
// @route   POST /api/files/upload
// @access  Private
exports.uploadFile = async (req, res) => {
	try {
		// Check if file exists
		if (!req.file) {
			return res.status(400).json({ success: false, message: 'No file uploaded.' })
		}

		// Check if file type is allowed
		if (!allowedMimeTypes.includes(req.file.mimetype)) {
			return res.status(400).json({
				success: false,
				message: `Invalid file type: ${req.file.mimetype}. Only text-based files are allowed.`,
			})
		}

		// Read file content
		const fileContent = req.file.buffer.toString('utf-8')

		// Get data from request body
		const { name, description, tags } = req.body
		const fileName = name || req.file.originalname
		const fileType = req.file.originalname.split('.').pop().toLowerCase() || 'txt' // Extract extension

		// Create new File document
		const newFile = await File.create({
			user: req.user.id,
			name: fileName,
			type: fileType,
			size: req.file.size,
			content: fileContent,
			description: description || '',
			tags: tags ? tags.split(',').map(tag => tag.trim().toLowerCase()) : [],
		})

		// Add reference to user's context
		const user = await User.findById(req.user.id)
		if (!user) {
			// Should not happen if protect middleware works, but good practice
			await File.findByIdAndDelete(newFile._id) // Clean up orphaned file
			return res.status(404).json({ success: false, message: 'User not found after file upload.' })
		}

		user.context.files.push({ fileRef: newFile._id, section: 'Uploaded' })
		await user.save()

		res.status(201).json({
			success: true,
			data: newFile, // Return the full file object
		})
	} catch (error) {
		res.status(500).json({ success: false, message: error.message })
	}
}

// @desc    Get all files for the logged-in user
// @route   GET /api/files
// @access  Private
exports.getUserFiles = async (req, res) => {
	try {
		// Find files belonging to the user, include content
		const files = await File.find({ user: req.user.id }).sort({ createdAt: -1 })

		res.status(200).json({
			success: true,
			count: files.length,
			data: files,
		})
	} catch (error) {
		res.status(500).json({ success: false, message: error.message })
	}
}

// @desc    Delete a file
// @route   DELETE /api/files/:fileId
// @access  Private
exports.deleteFile = async (req, res) => {
	try {
		const fileId = req.params.fileId

		// Find the file
		const file = await File.findById(fileId)

		if (!file) {
			return res.status(404).json({ success: false, message: 'File not found.' })
		}

		// Check ownership
		if (file.user.toString() !== req.user.id) {
			return res.status(403).json({ success: false, message: 'User not authorized to delete this file.' })
		}

		// Delete the file document
		await File.findByIdAndDelete(fileId)

		// Remove the reference from the user's context
		const user = await User.findById(req.user.id)
		if (user) {
			user.context.files = user.context.files.filter(f => f.fileRef.toString() !== fileId)
			await user.save()
		}

		res.status(200).json({ success: true, message: 'File deleted successfully.' })
	} catch (error) {
		res.status(500).json({ success: false, message: error.message })
	}
}

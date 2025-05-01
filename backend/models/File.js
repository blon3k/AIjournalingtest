const mongoose = require('mongoose')

const fileSchema = new mongoose.Schema(
	{
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
			index: true,
		},
		name: {
			type: String,
			required: true,
			trim: true,
		},
		type: {
			type: String, // e.g., 'txt', 'md', 'js', 'css'
			required: true,
			lowercase: true,
			trim: true,
		},
		size: {
			type: Number, // Size in bytes
			required: true,
		},
		content: {
			type: String, // Store text content directly
			required: true,
		},
		description: {
			type: String,
			trim: true,
			default: '',
		},
		tags: [
			{
				type: String,
				trim: true,
				lowercase: true,
			},
		],
	},
	{
		timestamps: true, // Adds createdAt and updatedAt
	}
)

const File = mongoose.model('File', fileSchema)

module.exports = File

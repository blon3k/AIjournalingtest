const mongoose = require('mongoose')

/**
 * Post Schema
 * Represents a community post that can be shared among users.
 * Posts can include system prompts, assistants, or just general content.
 */
const postSchema = new mongoose.Schema(
	{
		title: {
			type: String,
			required: [true, 'Post title is required'],
			trim: true,
			maxlength: [100, 'Title cannot exceed 100 characters'],
		},
		content: {
			type: String,
			required: [true, 'Post content is required'],
			maxlength: [5000, 'Content cannot exceed 5000 characters'],
		},
		author: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		authorName: {
			type: String,
			required: true,
		},
		authorAvatar: {
			type: String,
			default: '',
		},
		tags: [
			{
				type: String,
				trim: true,
			},
		],
		hearts: {
			type: Number,
			default: 0,
		},
		likedBy: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: 'User',
			},
		],
		savedBy: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: 'User',
			},
		],
		// Optional system prompt associated with this post
		systemPrompt: {
			title: String,
			content: String,
			category: String,
		},
		// Optional assistant associated with this post
		assistant: {
			name: String,
			description: String,
			role: String,
			avatar: String,
		},
		isPublished: {
			type: Boolean,
			default: true,
		},
		publishedAt: {
			type: Date,
			default: Date.now,
		},
	},
	{
		timestamps: true,
		toJSON: { virtuals: true },
		toObject: { virtuals: true },
	}
)

// Virtual for formatted date (for display purposes)
postSchema.virtual('formattedDate').get(function () {
	const now = new Date()
	const publishedDate = this.publishedAt || this.createdAt
	const diffTime = Math.abs(now - publishedDate)
	const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
	const diffHours = Math.floor(diffTime / (1000 * 60 * 60))
	const diffMinutes = Math.floor(diffTime / (1000 * 60))

	if (diffMinutes < 60) {
		return `${diffMinutes} ${diffMinutes === 1 ? 'minutę' : 'minut'} temu`
	} else if (diffHours < 24) {
		return `${diffHours} ${diffHours === 1 ? 'godzinę' : 'godzin'} temu`
	} else if (diffDays === 1) {
		return 'Wczoraj'
	} else if (diffDays < 7) {
		return `${diffDays} dni temu`
	} else {
		return publishedDate.toLocaleDateString('pl-PL', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		})
	}
})

const Post = mongoose.model('Post', postSchema)

module.exports = Post

const Post = require('../models/Post')
const User = require('../models/User')

// @desc    Get all posts
// @route   GET /api/posts
// @access  Public
exports.getPosts = async (req, res) => {
	try {
		const { filter, tag, limit = 10, page = 1 } = req.query
		const skip = (page - 1) * limit

		let query = { isPublished: true }

		// Apply tag filter if provided
		if (tag) {
			query.tags = { $in: [tag] }
		}

		let sort = {}
		// Apply sorting based on filter
		if (filter === 'popular') {
			sort = { hearts: -1 }
		} else if (filter === 'recent') {
			sort = { createdAt: -1 }
		} else if (filter === 'trending') {
			// Trending could be a mix of recent and popular
			sort = { hearts: -1, createdAt: -1 }
		} else {
			// Default sort by most recent
			sort = { createdAt: -1 }
		}

		const posts = await Post.find(query).sort(sort).skip(skip).limit(parseInt(limit)).populate('author', 'name avatar')

		// Get total posts count for pagination
		const total = await Post.countDocuments(query)

		res.status(200).json({
			success: true,
			data: posts,
			pagination: {
				total,
				page: parseInt(page),
				pages: Math.ceil(total / limit),
			},
		})
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		})
	}
}

// @desc    Get single post
// @route   GET /api/posts/:id
// @access  Public
exports.getPost = async (req, res) => {
	try {
		const post = await Post.findById(req.params.id).populate('author', 'name avatar')

		if (!post) {
			return res.status(404).json({
				success: false,
				message: 'Post not found',
			})
		}

		res.status(200).json({
			success: true,
			data: post,
		})
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		})
	}
}

// @desc    Create new post
// @route   POST /api/posts
// @access  Private
exports.createPost = async (req, res) => {
	try {
		const { title, content, tags, systemPrompt, assistant } = req.body

		if (!title || !content) {
			return res.status(400).json({
				success: false,
				message: 'Title and content are required',
			})
		}

		// Get user from auth middleware
		const user = await User.findById(req.user.id)

		// Create post
		const post = await Post.create({
			title,
			content,
			author: user._id,
			authorName: user.name,
			authorAvatar: user.avatar || '',
			tags: tags || [],
			systemPrompt,
			assistant,
		})

		// Add post to user's posts array
		user.community.posts.push(post._id)
		await user.save()

		res.status(201).json({
			success: true,
			data: post,
		})
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		})
	}
}

// @desc    Update post
// @route   PUT /api/posts/:id
// @access  Private
exports.updatePost = async (req, res) => {
	try {
		const { title, content, tags, systemPrompt, assistant, isPublished } = req.body

		let post = await Post.findById(req.params.id)

		if (!post) {
			return res.status(404).json({
				success: false,
				message: 'Post not found',
			})
		}

		// Check if user is the post author
		if (post.author.toString() !== req.user.id && req.user.role !== 'admin') {
			return res.status(403).json({
				success: false,
				message: 'Not authorized to update this post',
			})
		}

		// Update fields
		post.title = title || post.title
		post.content = content || post.content
		post.tags = tags || post.tags

		if (systemPrompt) {
			post.systemPrompt = systemPrompt
		}

		if (assistant) {
			post.assistant = assistant
		}

		if (isPublished !== undefined) {
			post.isPublished = isPublished
			if (isPublished && !post.publishedAt) {
				post.publishedAt = Date.now()
			}
		}

		// Save updated post
		await post.save()

		res.status(200).json({
			success: true,
			data: post,
		})
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		})
	}
}

// @desc    Delete post
// @route   DELETE /api/posts/:id
// @access  Private
exports.deletePost = async (req, res) => {
	try {
		const post = await Post.findById(req.params.id)

		if (!post) {
			return res.status(404).json({
				success: false,
				message: 'Post not found',
			})
		}

		// Check if user is the post author or admin
		if (post.author.toString() !== req.user.id && req.user.role !== 'admin') {
			return res.status(403).json({
				success: false,
				message: 'Not authorized to delete this post',
			})
		}

		// Remove post from user's posts array
		await User.findByIdAndUpdate(post.author, {
			$pull: { 'community.posts': post._id },
		})

		// Remove post from all users' liked and saved arrays
		await User.updateMany(
			{ 'community.likedPosts': post._id },
			{
				$pull: { 'community.likedPosts': post._id },
			}
		)

		await User.updateMany(
			{ 'community.savedPosts': post._id },
			{
				$pull: { 'community.savedPosts': post._id },
			}
		)

		// Delete the post
		await post.remove()

		res.status(200).json({
			success: true,
			message: 'Post deleted successfully',
		})
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		})
	}
}

// @desc    Like/unlike post
// @route   PUT /api/posts/:id/like
// @access  Private
exports.likePost = async (req, res) => {
	try {
		const post = await Post.findById(req.params.id)

		if (!post) {
			return res.status(404).json({
				success: false,
				message: 'Post not found',
			})
		}

		const user = await User.findById(req.user.id)

		// Check if post already liked by user
		const alreadyLiked = user.community.likedPosts.includes(post._id)

		if (alreadyLiked) {
			// Unlike the post
			post.hearts -= 1
			await post.save()

			// Update user's liked posts array
			user.community.likedPosts = user.community.likedPosts.filter(postId => postId.toString() !== post._id.toString())
			await user.save()

			// Remove user from post's likedBy array
			post.likedBy = post.likedBy.filter(userId => userId.toString() !== user._id.toString())
			await post.save()

			res.status(200).json({
				success: true,
				data: post,
				liked: false,
			})
		} else {
			// Like the post
			post.hearts += 1
			post.likedBy.push(user._id)
			await post.save()

			// Update user's liked posts array
			user.community.likedPosts.push(post._id)
			await user.save()

			res.status(200).json({
				success: true,
				data: post,
				liked: true,
			})
		}
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		})
	}
}

// @desc    Save/unsave post
// @route   PUT /api/posts/:id/save
// @access  Private
exports.savePost = async (req, res) => {
	try {
		const post = await Post.findById(req.params.id)

		if (!post) {
			return res.status(404).json({
				success: false,
				message: 'Post not found',
			})
		}

		const user = await User.findById(req.user.id)

		// Check if post already saved by user
		const alreadySaved = user.community.savedPosts.includes(post._id)

		if (alreadySaved) {
			// Unsave the post
			user.community.savedPosts = user.community.savedPosts.filter(postId => postId.toString() !== post._id.toString())
			await user.save()

			// Remove user from post's savedBy array
			post.savedBy = post.savedBy.filter(userId => userId.toString() !== user._id.toString())
			await post.save()

			res.status(200).json({
				success: true,
				data: post,
				saved: false,
			})
		} else {
			// Save the post
			user.community.savedPosts.push(post._id)
			await user.save()

			// Add user to post's savedBy array
			post.savedBy.push(user._id)
			await post.save()

			res.status(200).json({
				success: true,
				data: post,
				saved: true,
			})
		}
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		})
	}
}

// @desc    Get user's posts
// @route   GET /api/posts/user/:userId
// @access  Public
exports.getUserPosts = async (req, res) => {
	try {
		const { limit = 10, page = 1 } = req.query
		const skip = (page - 1) * limit

		const posts = await Post.find({ author: req.params.userId, isPublished: true })
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(parseInt(limit))
			.populate('author', 'name avatar')

		const total = await Post.countDocuments({ author: req.params.userId, isPublished: true })

		res.status(200).json({
			success: true,
			data: posts,
			pagination: {
				total,
				page: parseInt(page),
				pages: Math.ceil(total / limit),
			},
		})
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		})
	}
}

// @desc    Get posts by tag
// @route   GET /api/posts/tags/:tag
// @access  Public
exports.getPostsByTag = async (req, res) => {
	try {
		const { limit = 10, page = 1 } = req.query
		const skip = (page - 1) * limit

		const posts = await Post.find({ tags: req.params.tag, isPublished: true })
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(parseInt(limit))
			.populate('author', 'name avatar')

		const total = await Post.countDocuments({ tags: req.params.tag, isPublished: true })

		res.status(200).json({
			success: true,
			data: posts,
			pagination: {
				total,
				page: parseInt(page),
				pages: Math.ceil(total / limit),
			},
		})
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		})
	}
}

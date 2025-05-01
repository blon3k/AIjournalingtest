const User = require('../models/User')

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private/Admin
exports.getUser = async (req, res) => {
	try {
		const user = await User.findById(req.params.id).select('-password -refreshToken')

		if (!user) {
			return res.status(404).json({
				success: false,
				message: 'User not found',
			})
		}

		res.status(200).json({
			success: true,
			data: user,
		})
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		})
	}
}

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private
exports.updateUser = async (req, res) => {
	try {
		// Ensure user can only update their own account unless admin
		if (req.params.id !== req.user.id && req.user.role !== 'admin') {
			return res.status(403).json({
				success: false,
				message: 'Not authorized to update this user',
			})
		}

		// Fields to update - only allow certain fields to be updated
		const fieldsToUpdate = {
			name: req.body.name,
			email: req.body.email,
			avatar: req.body.avatar,
		}

		// Remove undefined fields
		Object.keys(fieldsToUpdate).forEach(key => fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key])

		const user = await User.findByIdAndUpdate(req.params.id, fieldsToUpdate, {
			new: true,
			runValidators: true,
		}).select('-password -refreshToken')

		if (!user) {
			return res.status(404).json({
				success: false,
				message: 'User not found',
			})
		}

		res.status(200).json({
			success: true,
			data: user,
		})
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		})
	}
}

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
	try {
		const user = await User.findByIdAndDelete(req.params.id)

		if (!user) {
			return res.status(404).json({
				success: false,
				message: 'User not found',
			})
		}

		res.status(200).json({
			success: true,
			message: 'User deleted',
		})
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		})
	}
}

// =================== Context Operations ===================

// @desc    Get user context
// @route   GET /api/users/:id/context
// @access  Private
exports.getUserContext = async (req, res) => {
	try {
		// Ensure user can only access their own context unless admin
		if (req.params.id !== req.user.id && req.user.role !== 'admin') {
			return res.status(403).json({
				success: false,
				message: 'Not authorized to access this context',
			})
		}

		const user = await User.findById(req.params.id).select('context')

		if (!user) {
			return res.status(404).json({
				success: false,
				message: 'User not found',
			})
		}

		res.status(200).json({
			success: true,
			data: user.context,
		})
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		})
	}
}

// @desc    Update user context
// @route   PUT /api/users/:id/context
// @access  Private
exports.updateUserContext = async (req, res) => {
	try {
		// Ensure user can only update their own context unless admin
		if (req.params.id !== req.user.id && req.user.role !== 'admin') {
			return res.status(403).json({
				success: false,
				message: 'Not authorized to update this context',
			})
		}

		const contextData = {
			generalInfo: req.body.generalInfo,
			importantInfo: req.body.importantInfo,
			strengths: req.body.strengths,
			weaknesses: req.body.weaknesses,
			longTermGoals: req.body.longTermGoals,
			shortTermGoals: req.body.shortTermGoals,
			projects: req.body.projects,
			files: req.body.files,
			updatedAt: Date.now(),
		}

		// Remove undefined fields
		Object.keys(contextData).forEach(key => contextData[key] === undefined && delete contextData[key])

		const user = await User.findById(req.params.id)

		if (!user) {
			return res.status(404).json({
				success: false,
				message: 'User not found',
			})
		}

		// Update context
		user.context = { ...user.context.toObject(), ...contextData }
		await user.save()

		res.status(200).json({
			success: true,
			data: user.context,
		})
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		})
	}
}

// =================== Settings Operations ===================

// @desc    Get user settings
// @route   GET /api/users/:id/settings
// @access  Private
exports.getUserSettings = async (req, res) => {
	try {
		// Ensure user can only access their own settings unless admin
		if (req.params.id !== req.user.id && req.user.role !== 'admin') {
			return res.status(403).json({
				success: false,
				message: 'Not authorized to access these settings',
			})
		}

		const user = await User.findById(req.params.id).select('settings')

		if (!user) {
			return res.status(404).json({
				success: false,
				message: 'User not found',
			})
		}

		res.status(200).json({
			success: true,
			data: user.settings,
		})
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		})
	}
}

// @desc    Update user settings
// @route   PUT /api/users/:id/settings
// @access  Private
exports.updateUserSettings = async (req, res) => {
	try {
		// Ensure user can only update their own settings unless admin
		if (req.params.id !== req.user.id && req.user.role !== 'admin') {
			return res.status(403).json({
				success: false,
				message: 'Not authorized to update these settings',
			})
		}

		const user = await User.findById(req.params.id)

		if (!user) {
			return res.status(404).json({
				success: false,
				message: 'User not found',
			})
		}

		// Update specific settings
		if (req.body.language !== undefined) user.settings.language = req.body.language
		if (req.body.desktopNotifications !== undefined) user.settings.desktopNotifications = req.body.desktopNotifications
		if (req.body.soundEffects !== undefined) user.settings.soundEffects = req.body.soundEffects
		if (req.body.defaultModel !== undefined) user.settings.defaultModel = req.body.defaultModel
		if (req.body.streamResponses !== undefined) user.settings.streamResponses = req.body.streamResponses
		if (req.body.developerMode !== undefined) user.settings.developerMode = req.body.developerMode

		// API keys - only update if provided
		if (req.body.apiKeys) {
			if (req.body.apiKeys.openAi !== undefined) user.settings.apiKeys.openAi = req.body.apiKeys.openAi
			if (req.body.apiKeys.anthropic !== undefined) user.settings.apiKeys.anthropic = req.body.apiKeys.anthropic
		}

		// Webhooks - only update if provided
		if (req.body.webhooks) {
			if (req.body.webhooks.enabled !== undefined) user.settings.webhooks.enabled = req.body.webhooks.enabled
			if (req.body.webhooks.url !== undefined) user.settings.webhooks.url = req.body.webhooks.url
			if (req.body.webhooks.secret !== undefined) user.settings.webhooks.secret = req.body.webhooks.secret

			// Webhook events
			if (req.body.webhooks.events) {
				if (req.body.webhooks.events.newChat !== undefined)
					user.settings.webhooks.events.newChat = req.body.webhooks.events.newChat
				if (req.body.webhooks.events.chatCompleted !== undefined)
					user.settings.webhooks.events.chatCompleted = req.body.webhooks.events.chatCompleted
			}
		}

		await user.save()

		res.status(200).json({
			success: true,
			data: user.settings,
		})
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		})
	}
}

// =================== System Prompts Operations ===================

// @desc    Get all system prompts for a user
// @route   GET /api/users/:id/system-prompts
// @access  Private
exports.getUserSystemPrompts = async (req, res) => {
	try {
		// Ensure user can only access their own prompts unless admin
		if (req.params.id !== req.user.id && req.user.role !== 'admin') {
			return res.status(403).json({
				success: false,
				message: 'Not authorized to access these prompts',
			})
		}

		const user = await User.findById(req.params.id).select('systemPrompts')

		if (!user) {
			return res.status(404).json({
				success: false,
				message: 'User not found',
			})
		}

		res.status(200).json({
			success: true,
			data: user.systemPrompts,
		})
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		})
	}
}

// @desc    Create new system prompt
// @route   POST /api/users/:id/system-prompts
// @access  Private
exports.createSystemPrompt = async (req, res) => {
	try {
		// Ensure user can only create their own prompts unless admin
		if (req.params.id !== req.user.id && req.user.role !== 'admin') {
			return res.status(403).json({
				success: false,
				message: 'Not authorized to create prompts for this user',
			})
		}

		const { title, content, category } = req.body

		if (!title || !content) {
			return res.status(400).json({
				success: false,
				message: 'Title and content are required',
			})
		}

		const user = await User.findById(req.params.id)

		if (!user) {
			return res.status(404).json({
				success: false,
				message: 'User not found',
			})
		}

		// Create new prompt
		const newPrompt = {
			title,
			content,
			category: category || 'General',
			createdAt: Date.now(),
			updatedAt: Date.now(),
			isFavorite: false,
		}

		user.systemPrompts.push(newPrompt)
		await user.save()

		res.status(201).json({
			success: true,
			data: newPrompt,
		})
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		})
	}
}

// @desc    Update system prompt
// @route   PUT /api/users/:id/system-prompts/:promptId
// @access  Private
exports.updateSystemPrompt = async (req, res) => {
	try {
		// Ensure user can only update their own prompts unless admin
		if (req.params.id !== req.user.id && req.user.role !== 'admin') {
			return res.status(403).json({
				success: false,
				message: 'Not authorized to update prompts for this user',
			})
		}

		const { title, content, category, isFavorite } = req.body
		const user = await User.findById(req.params.id)

		if (!user) {
			return res.status(404).json({
				success: false,
				message: 'User not found',
			})
		}

		// Find prompt
		const promptIndex = user.systemPrompts.findIndex(prompt => prompt._id.toString() === req.params.promptId)

		if (promptIndex === -1) {
			return res.status(404).json({
				success: false,
				message: 'System prompt not found',
			})
		}

		// Update prompt fields
		if (title) user.systemPrompts[promptIndex].title = title
		if (content) user.systemPrompts[promptIndex].content = content
		if (category) user.systemPrompts[promptIndex].category = category
		if (isFavorite !== undefined) user.systemPrompts[promptIndex].isFavorite = isFavorite

		user.systemPrompts[promptIndex].updatedAt = Date.now()

		await user.save()

		res.status(200).json({
			success: true,
			data: user.systemPrompts[promptIndex],
		})
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		})
	}
}

// @desc    Delete system prompt
// @route   DELETE /api/users/:id/system-prompts/:promptId
// @access  Private
exports.deleteSystemPrompt = async (req, res) => {
	try {
		// Ensure user can only delete their own prompts unless admin
		if (req.params.id !== req.user.id && req.user.role !== 'admin') {
			return res.status(403).json({
				success: false,
				message: 'Not authorized to delete prompts for this user',
			})
		}

		const user = await User.findById(req.params.id)

		if (!user) {
			return res.status(404).json({
				success: false,
				message: 'User not found',
			})
		}

		// Find prompt index
		const promptIndex = user.systemPrompts.findIndex(prompt => prompt._id.toString() === req.params.promptId)

		if (promptIndex === -1) {
			return res.status(404).json({
				success: false,
				message: 'System prompt not found',
			})
		}

		// Remove prompt
		user.systemPrompts.splice(promptIndex, 1)
		await user.save()

		res.status(200).json({
			success: true,
			message: 'System prompt deleted successfully',
		})
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		})
	}
}

// =================== Assistants Operations ===================

// @desc    Get all assistants for a user
// @route   GET /api/users/:id/assistants
// @access  Private
exports.getUserAssistants = async (req, res) => {
	try {
		// Ensure user can only access their own assistants unless admin
		if (req.params.id !== req.user.id && req.user.role !== 'admin') {
			return res.status(403).json({
				success: false,
				message: 'Not authorized to access these assistants',
			})
		}

		const user = await User.findById(req.params.id).select('assistants')

		if (!user) {
			return res.status(404).json({
				success: false,
				message: 'User not found',
			})
		}

		res.status(200).json({
			success: true,
			data: user.assistants,
		})
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		})
	}
}

// @desc    Create new assistant
// @route   POST /api/users/:id/assistants
// @access  Private
exports.createAssistant = async (req, res) => {
	try {
		// Ensure user can only create their own assistants unless admin
		if (req.params.id !== req.user.id && req.user.role !== 'admin') {
			return res.status(403).json({
				success: false,
				message: 'Not authorized to create assistants for this user',
			})
		}

		const { name, description, instructions, systemPrompt, category, avatarColor, avatarImage } = req.body

		if (!name || !instructions) {
			return res.status(400).json({
				success: false,
				message: 'Name and instructions are required',
			})
		}

		const user = await User.findById(req.params.id)

		if (!user) {
			return res.status(404).json({
				success: false,
				message: 'User not found',
			})
		}

		// Create new assistant
		const newAssistant = {
			name,
			description: description || '',
			instructions,
			systemPrompt: systemPrompt || '',
			category: category || 'General',
			avatarColor: avatarColor || '#3498db',
			avatarImage: avatarImage || '',
			createdAt: Date.now(),
			updatedAt: Date.now(),
			isFavorite: false,
		}

		user.assistants.push(newAssistant)
		await user.save()

		res.status(201).json({
			success: true,
			data: newAssistant,
		})
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		})
	}
}

// @desc    Update assistant
// @route   PUT /api/users/:id/assistants/:assistantId
// @access  Private
exports.updateAssistant = async (req, res) => {
	try {
		// Ensure user can only update their own assistants unless admin
		if (req.params.id !== req.user.id && req.user.role !== 'admin') {
			return res.status(403).json({
				success: false,
				message: 'Not authorized to update assistants for this user',
			})
		}

		const user = await User.findById(req.params.id)

		if (!user) {
			return res.status(404).json({
				success: false,
				message: 'User not found',
			})
		}

		// Find assistant
		const assistantIndex = user.assistants.findIndex(assistant => assistant._id.toString() === req.params.assistantId)

		if (assistantIndex === -1) {
			return res.status(404).json({
				success: false,
				message: 'Assistant not found',
			})
		}

		// Update assistant fields
		const fieldsToUpdate = [
			'name',
			'description',
			'instructions',
			'systemPrompt',
			'category',
			'avatarColor',
			'avatarImage',
			'isFavorite',
		]

		fieldsToUpdate.forEach(field => {
			if (req.body[field] !== undefined) {
				user.assistants[assistantIndex][field] = req.body[field]
			}
		})

		user.assistants[assistantIndex].updatedAt = Date.now()

		await user.save()

		res.status(200).json({
			success: true,
			data: user.assistants[assistantIndex],
		})
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		})
	}
}

// @desc    Delete assistant
// @route   DELETE /api/users/:id/assistants/:assistantId
// @access  Private
exports.deleteAssistant = async (req, res) => {
	try {
		// Ensure user can only delete their own assistants unless admin
		if (req.params.id !== req.user.id && req.user.role !== 'admin') {
			return res.status(403).json({
				success: false,
				message: 'Not authorized to delete assistants for this user',
			})
		}

		const user = await User.findById(req.params.id)

		if (!user) {
			return res.status(404).json({
				success: false,
				message: 'User not found',
			})
		}

		// Find assistant index
		const assistantIndex = user.assistants.findIndex(assistant => assistant._id.toString() === req.params.assistantId)

		if (assistantIndex === -1) {
			return res.status(404).json({
				success: false,
				message: 'Assistant not found',
			})
		}

		// Remove assistant
		user.assistants.splice(assistantIndex, 1)
		await user.save()

		res.status(200).json({
			success: true,
			message: 'Assistant deleted successfully',
		})
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		})
	}
}

// =================== Community Operations ===================

// @desc    Get user community activity
// @route   GET /api/users/:id/community
// @access  Private
exports.getUserCommunityActivity = async (req, res) => {
	try {
		// Ensure user can only access their own community activity unless admin
		if (req.params.id !== req.user.id && req.user.role !== 'admin') {
			return res.status(403).json({
				success: false,
				message: 'Not authorized to access this community activity',
			})
		}

		const user = await User.findById(req.params.id)
			.select('community')
			.populate('community.likedPosts')
			.populate('community.savedPosts')
			.populate('community.posts')

		if (!user) {
			return res.status(404).json({
				success: false,
				message: 'User not found',
			})
		}

		res.status(200).json({
			success: true,
			data: user.community,
		})
	} catch (error) {
		res.status(500).json({
			success: false,
			message: error.message,
		})
	}
}

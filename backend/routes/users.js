const express = require('express')
const router = express.Router()
const {
	getUser,
	updateUser,
	deleteUser,

	// System Prompts
	getUserSystemPrompts,
	createSystemPrompt,
	updateSystemPrompt,
	deleteSystemPrompt,

	// Assistants
	getUserAssistants,
	createAssistant,
	updateAssistant,
	deleteAssistant,

	// Context
	getUserContext,
	updateUserContext,

	// Community
	getUserCommunityActivity,

	// Settings
	getUserSettings,
	updateUserSettings,
} = require('../controllers/userController')
const { protect, authorize } = require('../middleware/auth')

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private/Admin
router.get('/:id', protect, authorize('admin'), getUser)

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Private
router.put('/:id', protect, updateUser)

// @route   DELETE /api/users/:id
// @desc    Delete user
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), deleteUser)

// System Prompts Routes
// @route   GET /api/users/:id/system-prompts
// @desc    Get all system prompts for a user
// @access  Private
router.get('/:id/system-prompts', protect, getUserSystemPrompts)

// @route   POST /api/users/:id/system-prompts
// @desc    Create new system prompt
// @access  Private
router.post('/:id/system-prompts', protect, createSystemPrompt)

// @route   PUT /api/users/:id/system-prompts/:promptId
// @desc    Update system prompt
// @access  Private
router.put('/:id/system-prompts/:promptId', protect, updateSystemPrompt)

// @route   DELETE /api/users/:id/system-prompts/:promptId
// @desc    Delete system prompt
// @access  Private
router.delete('/:id/system-prompts/:promptId', protect, deleteSystemPrompt)

// Assistants Routes
// @route   GET /api/users/:id/assistants
// @desc    Get all assistants for a user
// @access  Private
router.get('/:id/assistants', protect, getUserAssistants)

// @route   POST /api/users/:id/assistants
// @desc    Create new assistant
// @access  Private
router.post('/:id/assistants', protect, createAssistant)

// @route   PUT /api/users/:id/assistants/:assistantId
// @desc    Update assistant
// @access  Private
router.put('/:id/assistants/:assistantId', protect, updateAssistant)

// @route   DELETE /api/users/:id/assistants/:assistantId
// @desc    Delete assistant
// @access  Private
router.delete('/:id/assistants/:assistantId', protect, deleteAssistant)

// Context Routes
// @route   GET /api/users/:id/context
// @desc    Get user context
// @access  Private
router.get('/:id/context', protect, getUserContext)

// @route   PUT /api/users/:id/context
// @desc    Update user context
// @access  Private
router.put('/:id/context', protect, updateUserContext)

// Community Activity Routes
// @route   GET /api/users/:id/community
// @desc    Get user community activity
// @access  Private
router.get('/:id/community', protect, getUserCommunityActivity)

// Settings Routes
// @route   GET /api/users/:id/settings
// @desc    Get user settings
// @access  Private
router.get('/:id/settings', protect, getUserSettings)

// @route   PUT /api/users/:id/settings
// @desc    Update user settings
// @access  Private
router.put('/:id/settings', protect, updateUserSettings)

module.exports = router

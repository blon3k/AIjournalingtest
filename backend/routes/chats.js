const express = require('express')
const router = express.Router()
const {
	getUserChats,
	getChatById,
	createChat,
	addMessage,
	updateChat,
	deleteChat,
	createProblemSolvingChat,
	processAgentResponse,
	createInfiniteChat,
	processInfiniteNext,
	getCrucialMoments,
	processAgentStreamResponse,
} = require('../controllers/chatController')
const { protect } = require('../middleware/auth')

// @route   GET /api/chats
// @desc    Get all chats for a user
// @access  Private
router.get('/', protect, getUserChats)

// @route   GET /api/chats/:id
// @desc    Get a single chat by ID
// @access  Private
router.get('/:id', protect, getChatById)

// @route   POST /api/chats
// @desc    Create a new chat
// @access  Private
router.post('/', protect, createChat)

// @route   POST /api/chats/problem-solving
// @desc    Create a new problem-solving chat
// @access  Private
router.post('/problem-solving', protect, createProblemSolvingChat)

// @route   POST /api/chats/infinite
// @desc    Create a new infinite conversation chat
// @access  Private
router.post('/infinite', protect, createInfiniteChat)

// @route   POST /api/chats/:id/process-agent
// @desc    Process an agent for a problem-solving chat (Non-streaming)
// @access  Private
router.post('/:id/process-agent', protect, processAgentResponse)

// @route   POST /api/chats/:id/process-agent-stream
// @desc    Process an agent for a problem-solving chat with streaming
// @access  Private
router.post('/:id/process-agent-stream', protect, processAgentStreamResponse)

// @route   POST /api/chats/:id/infinite-next
// @desc    Process next message in infinite conversation
// @access  Private
router.post('/:id/infinite-next', protect, processInfiniteNext)

// @route   GET /api/chats/:id/crucial-moments
// @desc    Get crucial moments for an infinite chat
// @access  Private
router.get('/:id/crucial-moments', protect, getCrucialMoments)

// @route   POST /api/chats/:id/messages
// @desc    Add a message to a chat
// @access  Private
router.post('/:id/messages', protect, addMessage)

// @route   PUT /api/chats/:id
// @desc    Update chat details
// @access  Private
router.put('/:id', protect, updateChat)

// @route   DELETE /api/chats/:id
// @desc    Delete a chat
// @access  Private
router.delete('/:id', protect, deleteChat)

module.exports = router

const express = require('express')
const router = express.Router()
const { processAIMessage } = require('../controllers/aiController')
const { protect } = require('../middleware/auth')

// @route   POST /api/ai/chat
// @desc    Process AI message with streaming
// @access  Private
router.post('/chat', protect, processAIMessage)

module.exports = router

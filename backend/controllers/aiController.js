const aiService = require('../services/aiService')
const Chat = require('../models/Chat')

// @desc    Process AI message with streaming
// @route   POST /api/ai/chat
// @access  Private
exports.processAIMessage = async (req, res) => {
	try {
		const { model, messages, chatId } = req.body

		// Validate model
		if (!model) {
			return res.status(400).json({
				success: false,
				message: 'Model is required',
			})
		}

		// Validate messages
		if (!messages || !Array.isArray(messages) || messages.length === 0) {
			return res.status(400).json({
				success: false,
				message: 'Messages are required and must be an array',
			})
		}

		// Check if chat exists if chatId is provided
		let chat = null
		if (chatId) {
			try {
				chat = await Chat.findById(chatId)

				if (!chat) {
					return res.status(404).json({
						success: false,
						message: 'Chat not found',
					})
				}

				// Check if user owns the chat
				if (chat.user.toString() !== req.user.id) {
					return res.status(403).json({
						success: false,
						message: 'Not authorized to access this chat',
					})
				}
			} catch (chatError) {
				console.error('Error finding chat:', chatError)
				return res.status(500).json({
					success: false,
					message: 'Error finding chat: ' + chatError.message,
				})
			}
		}

		// Set up streaming response if requested
		const stream = true // Always stream for better UX

		if (stream) {
			// Set appropriate headers for streaming with proper CORS
			res.setHeader('Content-Type', 'text/event-stream')
			res.setHeader('Cache-Control', 'no-cache')
			res.setHeader('Connection', 'keep-alive')

			// Add CORS headers - Use the origin from the request instead of wildcard
			const origin = req.headers.origin || (req.headers.referer ? new URL(req.headers.referer).origin : '*')
			res.setHeader('Access-Control-Allow-Origin', origin)
			res.setHeader('Access-Control-Allow-Credentials', 'true')
			res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization')

			try {
				// Check if required API keys are available
				const modelType = model.split('-')[0]
				if (modelType === 'gpt' && !process.env.OPENAI_API) {
					res.write(`data: ${JSON.stringify({ error: 'OpenAI API key not found' })}\n\n`)
					return res.end()
				} else if (modelType === 'claude' && !process.env.CLAUDE_API) {
					res.write(`data: ${JSON.stringify({ error: 'Claude API key not found' })}\n\n`)
					return res.end()
				} else if (['deepseek', 'llama', 'gemini', 'qwen'].includes(modelType) && !process.env.DEEPSEEK_API) {
					res.write(`data: ${JSON.stringify({ error: `${modelType.toUpperCase()} API key not found` })}\n\n`)
					return res.end()
				}

				// Send an initial event to confirm connection
				res.write(`data: ${JSON.stringify({ status: 'connected' })}\n\n`)

				// Process the AI request with streaming
				const response = await aiService.generateResponse({
					model,
					messages,
					stream,
					userId: req.user.id,
					chatType: chat?.chatType,
				})

				// Pipe the streaming response directly to the client
				response.response.pipe(res)

				// Handle stream end and errors
				response.response.on('end', () => {
					res.end()
				})

				response.response.on('error', error => {
					console.error('Stream error:', error)
					// Send error event
					res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`)
					res.end()
				})
			} catch (error) {
				console.error('AI processing error:', error)
				// Send detailed error information
				const errorMessage = error.message || 'Unknown error occurred'
				res.write(
					`data: ${JSON.stringify({
						error: `AI processing error: ${errorMessage}`,
						details: error.stack,
					})}\n\n`
				)
				res.end()
			}
		} else {
			// Non-streaming response (fallback)
			try {
				const response = await aiService.generateResponse({
					model,
					messages,
					stream: false,
					userId: req.user.id,
					chatType: chat?.chatType,
				})

				res.status(200).json({
					success: true,
					data: {
						model: response.model,
						content: response.response,
					},
				})
			} catch (error) {
				console.error('AI processing error:', error)
				res.status(500).json({
					success: false,
					message: error.message,
					details: error.stack,
				})
			}
		}
	} catch (error) {
		console.error('AI controller error:', error)
		res.status(500).json({
			success: false,
			message: 'Server error processing AI request: ' + error.message,
		})
	}
}

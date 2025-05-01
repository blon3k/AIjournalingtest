const axios = require('axios')
const User = require('../models/User')
const { chatPrompts } = require('../prompts')

/**
 * AI Service for handling interactions with various AI models
 * Supports OpenAI (GPT), Anthropic (Claude), and DeepSeek models
 */
class AIService {
	constructor() {
		this.OPENAI_API = process.env.OPENAI_API
		this.CLAUDE_API = process.env.CLAUDE_API
		this.DEEPSEEK_API = process.env.DEEPSEEK_API
	}

	/**
	 * Get user context for adding to AI prompts
	 * @param {string} userId - User ID
	 * @returns {string} - Formatted context
	 */
	async getUserContext(userId) {
		try {
			const user = await User.findById(userId).select('context').populate({
				path: 'context.files.fileRef',
				model: 'File',
				select: 'name content type',
			})

			if (!user || !user.context) {
				return ''
			}

			// Format the context into a readable string
			let contextString = 'KONTEKST UŻYTKOWNIKA:\n\n'

			if (user.context.generalInfo) {
				contextString += `Informacje ogólne: ${user.context.generalInfo}\n\n`
			}

			if (user.context.importantInfo) {
				contextString += `Ważne informacje: ${user.context.importantInfo}\n\n`
			}

			if (user.context.strengths) {
				contextString += `Mocne strony: ${user.context.strengths}\n\n`
			}

			if (user.context.weaknesses) {
				contextString += `Obszary do rozwoju: ${user.context.weaknesses}\n\n`
			}

			if (user.context.longTermGoals) {
				contextString += `Cele długoterminowe: ${user.context.longTermGoals}\n\n`
			}

			if (user.context.shortTermGoals) {
				contextString += `Cele krótkoterminowe: ${user.context.shortTermGoals}\n\n`
			}

			// Add projects if they exist
			if (user.context.projects && user.context.projects.length > 0) {
				contextString += 'Projekty:\n'
				user.context.projects.forEach(project => {
					if (project.name) {
						contextString += `- ${project.name}`

						if (project.status) {
							contextString += ` (Status: ${project.status})`
						}

						contextString += '\n'

						if (project.description) {
							contextString += `  Opis: ${project.description}\n`
						}

						if (project.vision) {
							contextString += `  Wizja: ${project.vision}\n`
						}

						contextString += '\n'
					}
				})
			}

			// Add files if they exist
			if (user.context.files && user.context.files.length > 0) {
				contextString += 'PLIKI UŻYTKOWNIKA:\n\n'

				for (const fileRef of user.context.files) {
					if (fileRef.fileRef) {
						const file = fileRef.fileRef
						contextString += `PLIK: ${file.name} (${file.type.toUpperCase()})\n`
						contextString += `ZAWARTOŚĆ:\n${file.content}\n\n`
						contextString += '-'.repeat(80) + '\n\n'
					}
				}
			}

			return contextString
		} catch (error) {
			console.error('Error getting user context:', error)
			return ''
		}
	}

	/**
	 * Generate a response using the appropriate AI service
	 * @param {Object} options - Request options
	 * @returns {Promise<Object>} - AI response
	 */
	async generateResponse(options) {
		const { model, messages, stream = true, userId, max_tokens = 4000, chatType } = options

		// Always get user context
		let contextString = ''
		if (userId) {
			contextString = await this.getUserContext(userId)
		}

		// Determine max tokens based on chat type
		let adjustedMaxTokens = max_tokens
		if (chatType === 'marzenie-wstecz') {
			adjustedMaxTokens = 4000 // Higher token limit for Marzenie wstecz mode
		}

		console.log(
			`[AI] Generating ${
				stream ? 'streaming' : 'non-streaming'
			} response with model: ${model}, max_tokens: ${adjustedMaxTokens}${chatType ? ', chatType: ' + chatType : ''}`
		)

		// Determine which API to use based on the model
		if (model.startsWith('gpt-')) {
			return this.generateOpenAIResponse({
				model,
				messages,
				stream,
				contextString,
				max_tokens: adjustedMaxTokens,
				chatType,
			})
		} else if (model.startsWith('claude-')) {
			return this.generateClaudeResponse({
				model,
				messages,
				stream,
				contextString,
				max_tokens: adjustedMaxTokens,
				chatType,
			})
		} else if (
			model.startsWith('deepseek-') ||
			model.startsWith('llama-') ||
			model.startsWith('gemini-') ||
			model.startsWith('qwen-')
		) {
			return this.generateDeepSeekResponse({
				model,
				messages,
				stream,
				contextString,
				max_tokens: adjustedMaxTokens,
				chatType,
			})
		} else {
			throw new Error(`Unsupported model: ${model}`)
		}
	}

	/**
	 * Generate a response using OpenAI API
	 * @param {Object} options - Request options
	 * @returns {Promise<Object>} - OpenAI response
	 */
	async generateOpenAIResponse({ model, messages, stream, contextString, max_tokens, chatType }) {
		if (!this.OPENAI_API) {
			throw new Error('OpenAI API key not found')
		}

		// Prepare messages for OpenAI
		const formattedMessages = this.formatMessages({
			messages,
			contextString,
			chatType,
		})

		try {
			// Make API request
			const response = await axios.post(
				'https://api.openai.com/v1/chat/completions',
				{
					model,
					messages: formattedMessages,
					stream,
					temperature: 0.7,
					max_tokens: max_tokens,
				},
				{
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${this.OPENAI_API}`,
					},
					responseType: stream ? 'stream' : 'json',
				}
			)

			if (stream) {
				return {
					model,
					response: response.data,
					isStreaming: true,
				}
			} else {
				// Return formatted non-streaming response
				return {
					model,
					response: response.data.choices[0].message.content,
					isStreaming: false,
				}
			}
		} catch (error) {
			console.error('OpenAI API error:', error)
			throw new Error(`OpenAI API error: ${error.message}`)
		}
	}

	/**
	 * Generate a response using Claude API
	 * @param {Object} options - Request options
	 * @returns {Promise<Object>} - Claude response
	 */
	async generateClaudeResponse({ model, messages, stream, contextString, max_tokens, chatType }) {
		if (!this.CLAUDE_API) {
			throw new Error('Claude API key not found')
		}

		// Prepare messages for Claude
		const formattedMessages = this.formatMessages({
			messages,
			contextString,
			chatType,
		})

		try {
			// Make API request
			const response = await axios.post(
				'https://api.anthropic.com/v1/messages',
				{
					model,
					messages: formattedMessages,
					stream,
					temperature: 0.7,
					max_tokens: max_tokens,
				},
				{
					headers: {
						'Content-Type': 'application/json',
						'x-api-key': this.CLAUDE_API,
						'anthropic-version': '2023-06-01',
					},
					responseType: stream ? 'stream' : 'json',
				}
			)

			if (stream) {
				return {
					model,
					response: response.data,
					isStreaming: true,
				}
			} else {
				// Return formatted non-streaming response
				return {
					model,
					response: response.data.content[0].text,
					isStreaming: false,
				}
			}
		} catch (error) {
			console.error('Claude API error:', error)
			throw new Error(`Claude API error: ${error.message}`)
		}
	}

	/**
	 * Generate a response using DeepSeek API
	 * @param {Object} options - Request options
	 * @returns {Promise<Object>} - DeepSeek response
	 */
	async generateDeepSeekResponse({ model, messages, stream, contextString, max_tokens, chatType }) {
		if (!this.DEEPSEEK_API) {
			throw new Error('DeepSeek API key not found')
		}

		// Prepare messages for DeepSeek
		const formattedMessages = this.formatMessages({
			messages,
			contextString,
			chatType,
		})

		try {
			// Make API request - DeepSeek API implementation would depend on their specific API
			// This is a placeholder implementation
			const response = await axios.post(
				'https://api.deepseek.com/v1/chat/completions',
				{
					model,
					messages: formattedMessages,
					stream,
					temperature: 0.7,
					max_tokens: max_tokens,
				},
				{
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${this.DEEPSEEK_API}`,
					},
					responseType: stream ? 'stream' : 'json',
				}
			)

			if (stream) {
				return {
					model,
					response: response.data,
					isStreaming: true,
				}
			} else {
				// Return formatted non-streaming response
				return {
					model,
					response: response.data.choices[0].message.content,
					isStreaming: false,
				}
			}
		} catch (error) {
			console.error('DeepSeek API error:', error)
			throw new Error(`DeepSeek API error: ${error.message}`)
		}
	}

	/**
	 * Format messages for AI APIs
	 * @param {Object} options - Message formatting options
	 * @returns {Array} - Formatted messages
	 */
	formatMessages({ messages, contextString, chatType }) {
		const formattedMessages = []

		// Add system message with appropriate prompt based on chat type
		let systemMessage

		if (chatType === 'marzenie-wstecz') {
			systemMessage = chatPrompts.marzenieWsteczPrompt
		} else {
			systemMessage = chatPrompts.basePrompt
		}

		// Add context if provided
		if (contextString) {
			systemMessage += '\n\n' + contextString
		}

		// Add system message
		formattedMessages.push({
			role: 'system',
			content: systemMessage,
		})

		// Add user messages and assistant responses
		messages.forEach(message => {
			formattedMessages.push({
				role: message.role,
				content: message.content,
			})
		})

		return formattedMessages
	}
}

module.exports = new AIService()

import api from './api'

// Get user's chat history
const getUserChats = async () => {
	const response = await api.get('/chats')
	return response.data.data
}

// Get chat by ID
const getChatById = async chatId => {
	const response = await api.get(`/chats/${chatId}`)
	return response.data.data
}

// Create a new chat
const createChat = async chatData => {
	const response = await api.post('/chats', chatData)
	return response.data.data
}

// Create a new problem-solving chat
const createProblemSolvingChat = async ({ message, model }) => {
	const response = await api.post('/chats/problem-solving', { message, model })
	return response.data.data
}

// Create a new infinite conversation chat
const createInfiniteChat = async ({ topic, model, persona1Id, persona2Id }) => {
	const response = await api.post('/chats/infinite', {
		topic,
		model,
		persona1Id,
		persona2Id,
	})
	return response.data.data
}

// Get crucial moments for an infinite chat
const getCrucialMoments = async chatId => {
	try {
		console.log(`Fetching crucial moments for chat ${chatId}`)
		const response = await api.get(`/chats/${chatId}/crucial-moments`)
		console.log('Crucial moments response:', response.data)
		return response.data
	} catch (error) {
		console.error('Error fetching crucial moments:', error)
		// Return empty array instead of throwing to prevent UI errors
		return { success: false, data: [], error: error.message }
	}
}

// Process an agent for a problem-solving chat (Non-streaming)
const processAgent = async (chatId, { agentId, prompt }) => {
	console.log(`[ChatService] Calling non-streaming processAgent for chat ${chatId}, agent ${agentId}`)
	const response = await api.post(`/chats/${chatId}/process-agent`, { agentId, prompt })
	return response.data
}

// Process an agent for a problem-solving chat with streaming
const processAgentStream = async (chatId, agentId, onChunk, onComplete, onError) => {
	console.log(`[ChatService] Starting stream for chat ${chatId}, agent ${agentId}`)
	const controller = new AbortController()
	const signal = controller.signal

	try {
		const token = localStorage.getItem('token')
		if (!token) {
			throw new Error('Authentication token not found')
		}

		const response = await fetch(`${api.defaults.baseURL}/chats/${chatId}/process-agent-stream`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`,
				Accept: 'text/event-stream',
			},
			body: JSON.stringify({ agentId }),
			signal: signal, // Pass the abort signal
		})

		if (!response.ok) {
			const errorBody = await response.json() // Try to get error details
			console.error(`[ChatService] Stream API error: ${response.status}`, errorBody)
			throw new Error(`API error: ${response.status} - ${errorBody?.message || 'Unknown error'}`)
		}

		const reader = response.body.getReader()
		const decoder = new TextDecoder('utf-8')
		let buffer = ''

		while (true) {
			try {
				const { value, done } = await reader.read()
				if (done) {
					console.log(`[ChatService] Stream finished for agent ${agentId}, chat ${chatId}`)
					onComplete(agentId) // Pass agentId to know which stream completed
					break
				}

				const chunk = decoder.decode(value, { stream: true })
				buffer += chunk
				// console.log(`[ChatService] Raw stream chunk for agent ${agentId}:`, buffer); // Verbose

				// Process buffer for complete SSE messages (ending in \n\n)
				while (buffer.includes('\n\n')) {
					const eventEndIndex = buffer.indexOf('\n\n')
					const eventString = buffer.substring(0, eventEndIndex)
					buffer = buffer.substring(eventEndIndex + 2)

					if (eventString.startsWith('data: ')) {
						const jsonData = eventString.substring(6)
						try {
							const parsedData = JSON.parse(jsonData)
							// console.log(`[ChatService] Parsed data for agent ${agentId}:`, parsedData); // Verbose

							if (parsedData.error) {
								console.error(`[ChatService] Stream error from server for agent ${agentId}:`, parsedData.error)
								onError(agentId, parsedData.error)
								controller.abort() // Stop the stream on server error
								return // Exit loop
							}

							// Check if it's a content chunk or the final done message
							if (parsedData.chunk !== undefined && parsedData.agentId === agentId) {
								onChunk(agentId, parsedData.chunk)
							}

							// Check specifically for the final completion signal from our backend
							if (parsedData.done && parsedData.agentId === agentId) {
								// Already handled by the reader finishing, but good for logging
								console.log(`[ChatService] Received 'done' event for agent ${agentId}`)
							}
						} catch (e) {
							console.error(`[ChatService] Error parsing JSON for agent ${agentId}: ${e.message}. Data: ${jsonData}`)
							// Don't necessarily abort here, might be a temporary issue
						}
					}
				}
			} catch (readError) {
				// Handle potential errors during reading (e.g., network issues, abort)
				if (readError.name === 'AbortError') {
					console.log(`[ChatService] Stream aborted for agent ${agentId}, chat ${chatId}.`)
				} else {
					console.error(`[ChatService] Error reading stream for agent ${agentId}:`, readError)
					onError(agentId, `Stream read error: ${readError.message}`)
				}
				break // Exit loop on read error
			}
		}
	} catch (error) {
		if (error.name !== 'AbortError') {
			console.error(`[ChatService] General stream error for agent ${agentId}, chat ${chatId}:`, error)
			onError(agentId, `Stream setup failed: ${error.message}`)
		}
	}

	// Return the abort controller so the component can cancel the stream if needed
	return controller
}

// Add a message to a chat
const addMessage = async (chatId, messageData) => {
	const response = await api.post(`/chats/${chatId}/messages`, messageData)
	return response.data.data
}

// Update chat details
const updateChat = async (chatId, chatData) => {
	const response = await api.put(`/chats/${chatId}`, chatData)
	return response.data.data
}

// Delete a chat
const deleteChat = async chatId => {
	const response = await api.delete(`/chats/${chatId}`)
	return response.data.data
}

// Get streaming response from AI
const getAIResponse = async (data, onChunk, onComplete, onError) => {
	try {
		const response = await fetch(`${api.defaults.baseURL}/ai/chat`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${localStorage.getItem('token')}`,
			},
			body: JSON.stringify(data),
		})

		if (!response.ok) {
			throw new Error(`API error: ${response.status}`)
		}

		// Process the stream
		const reader = response.body.getReader()
		const decoder = new TextDecoder('utf-8')
		let buffer = ''

		while (true) {
			const { value, done } = await reader.read()
			if (done) break

			const chunk = decoder.decode(value, { stream: true })
			buffer += chunk

			// Process one event at a time from the buffer
			while (buffer.includes('\n\n')) {
				const index = buffer.indexOf('\n\n')
				const event = buffer.substring(0, index)
				buffer = buffer.substring(index + 2)

				if (event.startsWith('data: ')) {
					const jsonData = event.substring(6)
					try {
						const parsedData = JSON.parse(jsonData)

						// Handle error
						if (parsedData.error) {
							onError(parsedData.error)
							return
						}

						// Process chunk
						onChunk(parsedData)
					} catch (e) {
						console.error('Error parsing JSON:', e)
					}
				}
			}
		}

		// Process any remaining buffer
		if (buffer.length > 0 && buffer.startsWith('data: ')) {
			try {
				const jsonData = buffer.substring(6)
				const parsedData = JSON.parse(jsonData)
				onChunk(parsedData)
			} catch (e) {
				console.error('Error parsing JSON:', e)
			}
		}

		// Call complete callback
		onComplete()
	} catch (error) {
		onError(error.message)
	}
}

const chatService = {
	getUserChats,
	getChatById,
	createChat,
	createProblemSolvingChat,
	createInfiniteChat,
	getCrucialMoments,
	processAgent,
	processAgentStream,
	addMessage,
	updateChat,
	deleteChat,
	getAIResponse,
}

export default chatService

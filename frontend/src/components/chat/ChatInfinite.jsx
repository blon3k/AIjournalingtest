import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import {
	ChevronLeft,
	X,
	CheckCircle,
	AlertCircle,
	Bot,
	Brain,
	MessageSquare,
	Zap,
	Maximize,
	Minimize,
	MessageCircle,
	ArrowRight,
	Settings,
	Sparkles,
	User,
	Pause,
	Play,
	Clock,
	Bookmark,
	Save,
	Bell,
	Info,
	Star,
	History,
	MessageSquare2,
	RefreshCw,
} from 'lucide-react'
import './ChatInfinite.css'
import Loader from '../Loader'
import chatService from '../../services/chatService'
import userService from '../../services/userService'
import authService from '../../services/authService'
import { useAuth } from '../../context/AuthContext'
import formatMessageContent from '../../utils/formatMessageContent'

const AgentBox = ({ agent, status, content, isFullscreen, onToggleFullscreen }) => {
	const statusColors = {
		idle: '#9ca3af',
		working: '#4f46e5',
		completed: '#059669',
		error: '#ef4444',
	}

	// Determine a more descriptive status message
	const getStatusText = () => {
		if (status === 'idle') return 'Gotowy do rozmowy...'
		if (status === 'working') return 'Myśli...'
		if (status === 'completed') {
			return content ? 'Zakończył wypowiedź' : 'Czeka na swoją kolej'
		}
		if (status === 'error') return 'Wystąpił błąd'
		return ''
	}

	// Get content display text for empty states
	const getPlaceholderText = () => {
		if (status === 'idle') return `${agent.name} oczekuje na swoją kolej...`
		if (status === 'working') return `${agent.name} formułuje odpowiedź...`
		if (status === 'completed' && !content) return `${agent.name} zakończył wypowiedź`
		if (status === 'error') return 'Wystąpił błąd. Spróbuj ponownie.'
		return ''
	}

	return (
		<div
			className={`chat-infinite__agent-box chat-infinite__agent-box--${status} ${
				isFullscreen ? 'chat-infinite__agent-box--fullscreen' : ''
			}`}>
			<div className="chat-infinite__agent-card-header">
				<div className="chat-infinite__agent-card-avatar">
					{agent.avatarImage ? (
						<img src={agent.avatarImage} alt={agent.name} className="chat-infinite__agent-card-image" />
					) : (
						<div className="chat-infinite__agent-card-avatar-placeholder">{agent.icon || <User size={16} />}</div>
					)}
				</div>
				<div className="chat-infinite__agent-card-meta">
					<h3 className="chat-infinite__agent-card-name">{agent.name}</h3>
					{agent.description && <div className="chat-infinite__agent-card-role">{agent.description}</div>}
					<div className="chat-infinite__agent-card-status" style={{ color: statusColors[status] }}>
						{getStatusText()}
					</div>
				</div>
				{agent.isFavorite && (
					<div className="chat-infinite__agent-card-favorite">
						<Star size={14} />
					</div>
				)}
			</div>
			<div className="chat-infinite__agent-card-content">
				{content ? (
					<div className="chat-infinite__agent-card-message">{formatMessageContent(content)}</div>
				) : (
					<div className="chat-infinite__agent-card-placeholder">{getPlaceholderText()}</div>
				)}
			</div>

			<button className="chat-infinite__fullscreen-button" onClick={() => onToggleFullscreen(agent.id)}>
				{isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
			</button>
		</div>
	)
}

const ChatInfinite = () => {
	const { chatId } = useParams()
	const navigate = useNavigate()
	const location = useLocation()
	const { user } = useAuth()
	const [topic, setTopic] = useState('')
	const [processing, setProcessing] = useState(false)
	const [agentSelection, setAgentSelection] = useState(false)
	const [selectionStep, setSelectionStep] = useState(1) // Track which speaker is being selected
	const [fullscreenAgent, setFullscreenAgent] = useState(null)
	const [activeAgentIndex, setActiveAgentIndex] = useState(0)
	const [conversationStarted, setConversationStarted] = useState(false)
	const [error, setError] = useState(null)
	const [loading, setLoading] = useState(true)
	const [autoContinue, setAutoContinue] = useState(true)

	// States for actual API integration
	const [chatData, setChatData] = useState(null)
	const [userAssistants, setUserAssistants] = useState([])
	const [currentStreamingContent, setCurrentStreamingContent] = useState('')
	const [isStreamingResponse, setIsStreamingResponse] = useState(false)
	const eventSourceRef = useRef(null)

	// New state for crucial moments history
	const [showHistory, setShowHistory] = useState(false)
	const [crucialMoments, setCrucialMoments] = useState([])

	// Selected personas
	const [selectedPersonas, setSelectedPersonas] = useState({
		first: null,
		second: null,
	})

	// Agent states - this will be populated from chat data
	const [agents, setAgents] = useState([
		{
			id: 1,
			personaId: null,
			name: 'Agent 1',
			role: '',
			icon: <Bot size={16} />,
			avatarImage: null,
			status: 'idle',
			content: '',
		},
		{
			id: 2,
			personaId: null,
			name: 'Agent 2',
			role: '',
			icon: <Bot size={16} />,
			avatarImage: null,
			status: 'idle',
			content: '',
		},
	])

	// Add a processing lock flag at the top of component, near other state declarations
	const [processingLock, setProcessingLock] = useState(false)

	// New state for showing message history sidebar
	const [showMessageHistory, setShowMessageHistory] = useState(false)

	// New state for expanded message
	const [expandedMessageId, setExpandedMessageId] = useState(null)

	// New state for history refresh loading
	const [refreshingHistory, setRefreshingHistory] = useState(false)

	const messageHistoryRef = useRef(null)

	// Load user assistants data
	useEffect(() => {
		const fetchUserData = async () => {
			try {
				if (!user) {
					const userData = await authService.getCurrentUser()
					if (userData) {
						const assistantsData = await userService.getUserAssistants(userData._id)
						setUserAssistants(assistantsData)
					}
				} else {
					const assistantsData = await userService.getUserAssistants(user._id)
					setUserAssistants(assistantsData)
				}
			} catch (err) {
				console.error('Failed to fetch user assistants:', err)
				setError('Failed to load assistants. Please try again.')
			}
		}

		fetchUserData()
	}, [user])

	// Load existing chat or prepare for a new one
	useEffect(() => {
		const fetchChatData = async () => {
			setLoading(true)
			setError(null)

			try {
				if (chatId) {
					// Load existing infinite chat
					const chat = await chatService.getChatById(chatId)

					if (chat.chatType !== 'infinite') {
						setError('This is not an infinite conversation chat')
						setLoading(false)
						return
					}

					console.log('Loaded existing infinite chat:', chat)
					setChatData(chat)

					// Set up agents from chat data
					if (chat.infiniteData && chat.infiniteData.personas) {
						const personas = chat.infiniteData.personas
						setTopic(chat.infiniteData.topic || '')

						// Create agent states from personas
						const agentStates = personas.map((persona, index) => ({
							id: index + 1,
							personaId: persona.personaId,
							name: persona.name,
							description: persona.description || '',
							avatarImage: persona.avatarImage || '',
							status: 'idle',
							content: '',
							// Include other persona info
							instructions: persona.instructions,
							systemPrompt: persona.systemPrompt,
						}))

						setAgents(agentStates)
						setActiveAgentIndex(chat.infiniteData.activePersonaIndex || 0)

						// Set conversation as started since it's an existing chat
						setConversationStarted(true)
						setAgentSelection(false)

						// Fetch crucial moments
						try {
							const moments = await chatService.getCrucialMoments(chatId)
							if (moments && moments.data) {
								setCrucialMoments(moments.data)
							}
						} catch (err) {
							console.error('Failed to fetch crucial moments:', err)
						}

						// Populate agent contents from messages
						if (chat.messages && chat.messages.length > 0) {
							const agentContents = [...agentStates]

							// Get the last message for each agent
							const lastMessages = {}

							for (const msg of chat.messages) {
								if (msg.role === 'assistant' && msg.personaIndex !== undefined) {
									lastMessages[msg.personaIndex] = msg.content
								}
							}

							// Set the content for each agent from their last message
							Object.keys(lastMessages).forEach(personaIndex => {
								const index = parseInt(personaIndex)
								if (index >= 0 && index < agentContents.length) {
									agentContents[index].content = lastMessages[index]
									agentContents[index].status = 'completed'
								}
							})

							// Set the active agent to idle
							if (chat.infiniteData.activePersonaIndex !== undefined) {
								agentContents[chat.infiniteData.activePersonaIndex].status = 'idle'
							}

							setAgents(agentContents)

							// If auto-continue is enabled, start the conversation after a delay
							if (autoContinue) {
								console.log('Auto-continue is enabled, starting conversation...')
								setTimeout(() => {
									setProcessing(false)
									setIsStreamingResponse(false)
									console.log('Auto-triggering processNextAgent for continuing conversation')
									processNextAgent()
								}, 1000)
							}
						}
					}
				} else {
					// Check for message in the URL query parameters
					const queryParams = new URLSearchParams(location.search)
					const messageParam = queryParams.get('message')

					if (messageParam) {
						setTopic(messageParam)
						setAgentSelection(true) // Go directly to agent selection
					} else {
						// New chat without a message, go to agent selection
						setAgentSelection(true)
					}
				}
			} catch (err) {
				console.error('Error fetching chat data:', err)
				setError('Failed to load chat data. Please try again.')
			} finally {
				setLoading(false)
			}
		}

		fetchChatData()

		// Clean up any event source on unmount
		return () => {
			if (eventSourceRef.current) {
				eventSourceRef.current.close()
			}
		}
	}, [chatId, location.search, autoContinue])

	// Updated processNextAgent function
	const processNextAgent = async () => {
		// --- Strict Lock Check ---
		if (processingLock) {
			console.log('Skipping processNextAgent: Lock is active')
			return
		}

		// Check other conditions *after* the lock check
		if (!chatData || !chatData._id || isStreamingResponse || processing) {
			console.log('Skipping processNextAgent (other conditions):', {
				locked: processingLock, // Should be false here
				hasChatData: !!chatData,
				hasChatId: !!(chatData && chatData._id),
				isStreaming: isStreamingResponse,
				isProcessing: processing,
			})
			return
		}

		// --- Acquire Lock ---
		setProcessingLock(true)
		console.log(`Processing lock acquired for agent index: ${activeAgentIndex}`)

		// Set processing flags
		setIsStreamingResponse(true)
		setProcessing(true)

		// --- Update Agent Statuses ---
		const nextAgentIndexPotential = activeAgentIndex === 0 ? 1 : 0
		setAgents(prev =>
			prev.map((agent, index) => {
				if (index === activeAgentIndex) {
					// Current agent starts working, clear content
					return { ...agent, status: 'working', content: '' }
				} else if (index === nextAgentIndexPotential && agent.status !== 'completed') {
					// Ensure the *other* agent is idle if not already completed
					return { ...agent, status: 'idle' }
				}
				// Leave completed agents as they are
				return agent
			})
		)

		// Clear any previous streaming fragments
		setCurrentStreamingContent('')

		// Close any existing event source gracefully
		if (eventSourceRef.current) {
			eventSourceRef.current.close()
			eventSourceRef.current = null
			console.log('Closed existing EventSource.')
		}

		try {
			const baseUrl = process.env.REACT_APP_API_URL || ''
			const apiUrl = baseUrl.endsWith('/api') ? baseUrl : baseUrl ? `${baseUrl}/api` : '/api'
			const url = `${apiUrl}/chats/${chatData._id}/infinite-next`
			const token = localStorage.getItem('token')

			console.log(`Sending request to: ${url} for agent index: ${activeAgentIndex}`)

			const headers = {
				Authorization: `Bearer ${token}`,
				'Content-Type': 'application/json',
			}

			// Using fetch API for streaming
			const response = await fetch(url, {
				method: 'POST',
				headers,
				credentials: 'same-origin', // Important for cookies/auth if needed later
				body: JSON.stringify({
					activePersonaIndex: activeAgentIndex, // Send the current agent index
				}),
			})

			if (!response.ok) {
				// Handle HTTP errors (e.g., 404, 500)
				const errorBody = await response.text()
				throw new Error(`Server error ${response.status}: ${response.statusText}. Body: ${errorBody}`)
			}

			// Process the response stream
			const reader = response.body.getReader()
			const decoder = new TextDecoder()
			let fullContent = ''
			let finalNextAgentIndex = -1 // To store index from completion event

			// Read the stream chunk by chunk
			while (true) {
				const { value, done } = await reader.read()
				if (done) {
					console.log('Stream reading finished.')
					break // Exit loop when stream ends
				}

				const chunk = decoder.decode(value, { stream: true })
				const lines = chunk.split('\n\n') // SSE events are separated by double newlines

				for (const line of lines) {
					if (line.trim() && line.startsWith('data: ')) {
						try {
							const jsonData = line.substring(5).trim()
							if (jsonData === '[DONE]') {
								// Check for OpenAI specific [DONE] marker if applicable
								console.log('Received [DONE] marker.')
								continue
							}
							const data = JSON.parse(jsonData)

							// Handle different event types from backend
							if (data.status === 'connected') {
								console.log('Connected to streaming endpoint via fetch.')
							} else if (data.status === 'retrying') {
								console.log(`API rate limited: ${data.message}`)
								// Handle content delta
							} else if (data.delta && data.content) {
								fullContent += data.content
								// Update only the currently working agent's content in real-time
								setAgents(prev =>
									prev.map((agent, index) =>
										index === activeAgentIndex ? { ...agent, content: fullContent, status: 'working' } : agent
									)
								)
								// Handle completion event
							} else if (data.complete) {
								console.log('Received completion event:', data)
								finalNextAgentIndex = data.nextPersonaIndex // Store the definitive next index
								const completedContent = data.content || fullContent // Use final content from event if available

								// --- CRITICAL STATE UPDATE ---
								// Update states atomically *before* releasing lock or scheduling next turn
								setAgents(prev =>
									prev.map((agent, index) => {
										if (index === activeAgentIndex) {
											// Mark current agent completed with final content
											return {
												...agent,
												content: completedContent.trim() || '[No content]',
												status: 'completed',
											}
										} else if (index === finalNextAgentIndex) {
											// Ensure next agent is explicitly idle and clear its content
											return {
												...agent,
												status: 'idle',
												content: '',
											}
										}
										// Ensure any other agent (if more than 2) is NOT working
										return agent.status === 'working' ? { ...agent, status: 'idle' } : agent
									})
								)

								// Update the active index AFTER updating agent statuses
								setActiveAgentIndex(finalNextAgentIndex)

								// Reset streaming/processing flags
								setIsStreamingResponse(false)
								setProcessing(false)

								// --- Release Lock AFTER state updates are queued ---
								setProcessingLock(false)
								console.log(`Processing lock released. Next turn for agent: ${finalNextAgentIndex}`)

								// Refresh crucial moments data whenever an agent completes their response
								refreshCrucialMoments()

								// Trigger auto-continue *after* lock release and state update
								if (autoContinue) {
									const delay = 1500 // Adjusted delay slightly
									console.log(`Auto-continuing check in ${delay / 1000} seconds for agent ${finalNextAgentIndex}...`)
									setTimeout(() => {
										// Check lock *again* and ensure the activeAgentIndex matches the expected next agent
										if (!processingLock && activeAgentIndex === finalNextAgentIndex) {
											console.log('Proceeding with auto-continue...')
											processNextAgent()
										} else {
											console.log(
												`Auto-continue skipped: lock active (${processingLock}) or index mismatch (current: ${activeAgentIndex}, expected: ${finalNextAgentIndex}).`
											)
										}
									}, delay)
								}
								// Since completion is confirmed, break the inner loop
								break // Exit lines loop as we are done with this agent turn
							} else if (data.type === 'crucial_moment') {
								setCrucialMoments(prev => [...prev, data.moment])
							} else if (data.error) {
								// Handle specific error event from backend stream
								console.error('Streaming error from backend:', data.error)
								setError(`Stream Error: ${data.error}`)
								throw new Error(data.error) // Throw to trigger catch block below
							}
						} catch (jsonError) {
							console.error('JSON parse error in stream:', jsonError, 'Line:', line)
							// Continue processing other lines in the chunk
						}
					}
				} // End lines loop

				// If a completion event was processed, break the outer loop too
				if (finalNextAgentIndex !== -1) {
					break
				}
			} // End while loop for reading stream

			// Handle cases where stream ends without a specific 'complete' event
			if (finalNextAgentIndex === -1) {
				console.warn("Stream ended without a specific 'complete' event. Finalizing based on last state.")
				setAgents(prev =>
					prev.map((agent, index) =>
						index === activeAgentIndex
							? { ...agent, content: fullContent.trim() || '[Stream ended abruptly]', status: 'completed' } // Mark as completed anyway
							: agent
					)
				)
				// Decide on next agent index (e.g., simply toggle or handle based on context)
				const nextIdx = activeAgentIndex === 0 ? 1 : 0
				setActiveAgentIndex(nextIdx)
				setIsStreamingResponse(false)
				setProcessing(false)
				// --- Release Lock ---
				setProcessingLock(false)
				console.log(`Processing lock released after abrupt stream end. Setting next agent to ${nextIdx}`)
				// Trigger auto-continue if needed
				if (autoContinue) {
					const delay = 1500
					setTimeout(() => {
						if (!processingLock) processNextAgent()
					}, delay)
				}
			}
		} catch (err) {
			// --- Handle fetch/setup/stream Errors ---
			console.error('Error during agent processing:', err)
			setError(`Processing failed: ${err.message}. Please try manually continuing.`)
			setIsStreamingResponse(false)
			setProcessing(false)
			// --- Release Lock on Error ---
			setProcessingLock(false)
			console.log('Processing lock released due to error.')
			// Mark the agent that failed as 'error'
			setAgents(prev =>
				prev.map((agent, index) => (index === activeAgentIndex ? { ...agent, status: 'error' } : agent))
			)
		}
	}

	// Update the useEffect for auto-start to ensure lock check
	useEffect(() => {
		// Auto-start conversation if conditions met
		if (conversationStarted && chatData && !processingLock && !processing && !isStreamingResponse && autoContinue) {
			console.log('Auto-starting conversation check from effect...')
			const timer = setTimeout(() => {
				// Re-check lock status right before calling
				if (!processingLock && !processing && !isStreamingResponse) {
					console.log('Effect proceeding with processNextAgent')
					processNextAgent()
				} else {
					console.log('Effect skipped processNextAgent: lock/processing/streaming active.')
				}
			}, 1000) // Delay to allow initial setup
			return () => clearTimeout(timer) // Cleanup timer on unmount or dependency change
		}
	}, [conversationStarted, chatData, processingLock, processing, isStreamingResponse, autoContinue]) // Dependencies include the lock

	const handleToggleFullscreen = agentId => {
		setFullscreenAgent(prev => (prev === agentId ? null : agentId))
	}

	const handleGoBack = () => {
		// Close any open event source before navigating
		if (eventSourceRef.current) {
			eventSourceRef.current.close()
			eventSourceRef.current = null
		}
		navigate('/chat')
	}

	const selectPersona = (step, personaId) => {
		const persona = userAssistants.find(p => p._id === personaId)
		if (!persona) return

		if (step === 1) {
			setSelectedPersonas(prev => ({
				...prev,
				first: {
					id: persona._id,
					name: persona.name,
					description: persona.description || '',
					avatarImage: persona.avatarImage || '',
					instructions: persona.instructions || '',
					systemPrompt: persona.systemPrompt || '',
				},
			}))
		} else {
			setSelectedPersonas(prev => ({
				...prev,
				second: {
					id: persona._id,
					name: persona.name,
					description: persona.description || '',
					avatarImage: persona.avatarImage || '',
					instructions: persona.instructions || '',
					systemPrompt: persona.systemPrompt || '',
				},
			}))
		}
	}

	const handleNextStep = () => {
		setSelectionStep(2)
	}

	const arePersonasSelected = () => {
		return selectedPersonas.first && selectedPersonas.second
	}

	const startConversation = async () => {
		if (!arePersonasSelected()) return

		setLoading(true)
		setError(null)

		try {
			console.log('Starting infinite conversation with topic:', topic)
			const newChat = await chatService.createInfiniteChat({
				topic: topic || 'Nowa konwersacja',
				model: 'gpt-4o',
				persona1Id: selectedPersonas.first.id,
				persona2Id: selectedPersonas.second.id,
			})

			console.log('Infinite chat created:', newChat)
			setChatData(newChat)

			const chatPath = `/chat/infinite/${newChat._id}`
			console.log(`Navigating to: ${chatPath}`)
			navigate(chatPath, { replace: true })

			if (newChat.infiniteData && newChat.infiniteData.personas) {
				const personas = newChat.infiniteData.personas
				const agentStates = personas.map((persona, index) => ({
					id: index + 1,
					personaId: persona.personaId,
					name: persona.name,
					description: persona.description || '',
					avatarImage: persona.avatarImage || '',
					status: 'idle', // Both start idle
					content: '',
					instructions: persona.instructions,
					systemPrompt: persona.systemPrompt,
				}))
				setAgents(agentStates)
			}

			// --- Reset flags BEFORE starting ---
			setActiveAgentIndex(0) // Explicitly start with agent 0
			setProcessingLock(false)
			setProcessing(false)
			setIsStreamingResponse(false)

			setConversationStarted(true)
			setAgentSelection(false)

			// Allow time for UI update, then start if auto-continue is on
			if (autoContinue) {
				setTimeout(() => {
					// Check lock status before initial call
					if (!processingLock) {
						console.log('Initial processNextAgent call after startConversation')
						processNextAgent()
					} else {
						console.log('Initial processNextAgent call skipped: lock active unexpectedly.')
					}
				}, 500) // Shorter delay for initial start
			}
		} catch (err) {
			console.error('Error creating infinite chat:', err)
			setError('Failed to create infinite conversation. Please try again.')
		} finally {
			setLoading(false)
		}
	}

	const toggleAutoContinue = () => {
		setAutoContinue(prev => !prev)
	}

	const handleContinue = () => {
		// Check lock first
		if (processingLock) {
			console.log('Cannot continue: Processing lock is active.')
			return
		}
		// Check other processing flags
		if (!processing && !isStreamingResponse) {
			console.log('Manual continue triggered.')
			processNextAgent()
		} else {
			console.log('Cannot continue: Already processing or streaming.')
		}
	}

	// Function to get a gradient style for the assistant card - update to work with new design
	const getGradientStyle = id => {
		// Default gradients as fallback
		const gradients = [
			'#F6D2E0', // Pink
			'#A7D2CB', // Teal
			'#FFC38B', // Orange
			'#BEEB9F', // Light green
		]

		// Use ID to select a color, with modulo to handle more assistants than colors
		const idAsNum = typeof id === 'string' ? id.charCodeAt(0) : id
		return { backgroundColor: gradients[idAsNum % gradients.length] }
	}

	// Add function to toggle message history sidebar
	const toggleMessageHistorySidebar = () => {
		setShowMessageHistory(prev => !prev)
		// Close the other sidebar if it's open
		if (showHistory) setShowHistory(false)
	}

	// Toggle history sidebar function update
	const toggleHistorySidebar = () => {
		setShowHistory(prev => !prev)
		// Close the other sidebar if it's open
		if (showMessageHistory) setShowMessageHistory(false)
	}

	// Function to toggle message expansion
	const toggleMessageExpansion = messageId => {
		setExpandedMessageId(expandedMessageId === messageId ? null : messageId)
	}

	// Auto-scroll to the bottom of message history when opened or new messages arrive
	useEffect(() => {
		if (showMessageHistory && messageHistoryRef.current) {
			messageHistoryRef.current.scrollTop = messageHistoryRef.current.scrollHeight
		}
	}, [showMessageHistory, chatData?.messages?.length])

	// Function to refresh crucial moments data
	const refreshCrucialMoments = async () => {
		if (!chatData || !chatData._id) return

		console.log('Refreshing crucial moments data...')
		setRefreshingHistory(true)

		try {
			// Refresh crucial moments
			const moments = await chatService.getCrucialMoments(chatData._id)
			if (moments && moments.data) {
				setCrucialMoments(moments.data)
				console.log('Crucial moments refreshed:', moments.data.length)
			}

			// Also refresh the complete chat data to get the latest messages
			const refreshedChat = await chatService.getChatById(chatData._id)
			if (refreshedChat) {
				setChatData(refreshedChat)
				console.log('Chat data refreshed with', refreshedChat.messages?.length, 'messages')
			}
		} catch (err) {
			console.error('Failed to refresh history data:', err)
		} finally {
			setRefreshingHistory(false)
		}
	}

	// Add effect to refresh data when toggles change
	useEffect(() => {
		if (showHistory || showMessageHistory) {
			refreshCrucialMoments()
		}
	}, [showHistory, showMessageHistory])

	return (
		<div className="chat-infinite">
			<div className="chat-infinite__header">
				<div className="chat-infinite__header-left">
					<button className="chat-infinite__back-button" onClick={handleGoBack}>
						<ChevronLeft size={18} />
					</button>
					<h2 className="chat-infinite__title">
						{loading ? 'Ładowanie...' : chatData ? chatData.title : 'Tryb Nieskończony: Konwersacja AI'}
					</h2>
				</div>
				<div className="chat-infinite__header-right">
					{conversationStarted && (
						<>
							<button className="chat-infinite__action-button" onClick={toggleMessageHistorySidebar}>
								<MessageSquare size={14} />
								Historia
							</button>
							<button className="chat-infinite__action-button" onClick={toggleHistorySidebar}>
								<Sparkles size={14} />
								Genialne momenty
								{crucialMoments.length > 0 && <span className="chat-infinite__badge">{crucialMoments.length}</span>}
							</button>
							<button
								className={`chat-infinite__action-button chat-infinite__toggle-button ${!autoContinue ? 'paused' : ''}`}
								onClick={toggleAutoContinue}>
								{autoContinue ? <Pause size={14} /> : <Play size={14} />}
								{autoContinue ? 'Automatyczna kontynuacja' : 'Kontynuacja ręczna'}
							</button>
						</>
					)}
					<button className="chat-infinite__action-button chat-infinite__leave-button" onClick={handleGoBack}>
						Wyjdź
						<X size={14} />
					</button>
				</div>
			</div>

			{error && (
				<div className="chat-infinite__error">
					<AlertCircle size={18} />
					<span>{error}</span>
					<button onClick={() => setError(null)}>Zamknij</button>
				</div>
			)}

			{loading ? (
				<div className="chat-infinite__loading">
					<Loader size="large" text="Ładowanie danych konwersacji..." />
				</div>
			) : !conversationStarted ? (
				<div className="chat-infinite__persona-selection">
					<h3>Wybierz osoby do konwersacji</h3>
					<p className="chat-infinite__topic">Temat: "{topic}"</p>

					{selectionStep === 1 ? (
						<>
							<h4 className="chat-infinite__selection-title">Wybierz pierwszego rozmówcę</h4>
							<div className="chat-infinite__assistant-grid">
								{userAssistants.map(persona => {
									const isSelected = selectedPersonas.first?.id === persona._id
									return (
										<div
											key={persona._id}
											className={`chat-infinite__assistant-card ${
												isSelected ? 'chat-infinite__assistant-card--selected' : ''
											} ${persona.isFavorite ? 'favorite' : ''}`}>
											<div className="chat-infinite__assistant-card-header">
												<div className="chat-infinite__assistant-card-avatar">
													{persona.avatarImage ? (
														<img
															src={persona.avatarImage}
															alt={persona.name}
															className="chat-infinite__assistant-card-image"
														/>
													) : (
														<div className="chat-infinite__assistant-card-avatar-placeholder">
															<User size={24} strokeWidth={1.5} />
														</div>
													)}
												</div>
												<div className="chat-infinite__assistant-card-meta">
													<div className="chat-infinite__assistant-card-category">{persona.category || 'Ogólne'}</div>
												</div>
												{persona.isFavorite && (
													<div className="chat-infinite__assistant-card-favorite">
														<Star size={14} />
													</div>
												)}
											</div>
											<div className="chat-infinite__assistant-card-content">
												<h3 className="chat-infinite__assistant-card-name">{persona.name}</h3>
												<div className="chat-infinite__assistant-card-role">{persona.description}</div>
												<p className="chat-infinite__assistant-card-description">
													{persona.instructions?.substring(0, 80) || 'Brak opisu'}
													{persona.instructions?.length > 80 ? '...' : ''}
												</p>
												<button
													className="chat-infinite__assistant-card-select-button"
													disabled={isSelected}
													onClick={() => selectPersona(1, persona._id)}>
													{isSelected ? 'Wybrany' : 'Wybierz'}
												</button>
											</div>
										</div>
									)
								})}
							</div>
							{selectedPersonas.first && (
								<button className="chat-infinite__next-step-button" onClick={handleNextStep}>
									Kontynuuj <ArrowRight size={16} />
								</button>
							)}
						</>
					) : (
						<>
							<h4 className="chat-infinite__selection-title">Wybierz drugiego rozmówcę</h4>
							<div className="chat-infinite__assistant-grid">
								{userAssistants
									.filter(assistant => assistant._id !== selectedPersonas.first?.id)
									.map(persona => {
										const isSelected = selectedPersonas.second?.id === persona._id
										return (
											<div
												key={persona._id}
												className={`chat-infinite__assistant-card ${
													isSelected ? 'chat-infinite__assistant-card--selected' : ''
												} ${persona.isFavorite ? 'favorite' : ''}`}>
												<div className="chat-infinite__assistant-card-header">
													<div className="chat-infinite__assistant-card-avatar">
														{persona.avatarImage ? (
															<img
																src={persona.avatarImage}
																alt={persona.name}
																className="chat-infinite__assistant-card-image"
															/>
														) : (
															<div className="chat-infinite__assistant-card-avatar-placeholder">
																<User size={24} strokeWidth={1.5} />
															</div>
														)}
													</div>
													<div className="chat-infinite__assistant-card-meta">
														<div className="chat-infinite__assistant-card-category">{persona.category || 'Ogólne'}</div>
													</div>
													{persona.isFavorite && (
														<div className="chat-infinite__assistant-card-favorite">
															<Star size={14} />
														</div>
													)}
												</div>
												<div className="chat-infinite__assistant-card-content">
													<h3 className="chat-infinite__assistant-card-name">{persona.name}</h3>
													<div className="chat-infinite__assistant-card-role">{persona.description}</div>
													<p className="chat-infinite__assistant-card-description">
														{persona.instructions?.substring(0, 80) || 'Brak opisu'}
														{persona.instructions?.length > 80 ? '...' : ''}
													</p>
													<button
														className="chat-infinite__assistant-card-select-button"
														disabled={isSelected}
														onClick={() => selectPersona(2, persona._id)}>
														{isSelected ? 'Wybrany' : 'Wybierz'}
													</button>
												</div>
											</div>
										)
									})}
							</div>
							{selectedPersonas.second && (
								<button className="chat-infinite__start-button" onClick={startConversation}>
									Rozpocznij konwersację <ArrowRight size={16} />
								</button>
							)}
						</>
					)}
				</div>
			) : (
				<>
					{/* Updated notification banner at the top */}
					<div className="chat-infinite__notification-banner">
						<Info size={14} />
						<div className="chat-infinite__notification-content">
							<p>Historia konwersacji jest automatycznie zapisywana w dwóch zakładkach:</p>
							<ul className="chat-infinite__notification-list">
								<li>
									<MessageSquare size={12} /> <strong>Historia</strong> - pełna historia wszystkich wiadomości
								</li>
								<li>
									<Sparkles size={12} /> <strong>Genialne momenty</strong> - kluczowe wnioski, rozwiązania problemów i
									pomysły
								</li>
							</ul>
						</div>
					</div>

					<div
						className={`chat-infinite__container ${fullscreenAgent ? 'chat-infinite__container--fullscreen' : ''} ${
							showHistory || showMessageHistory ? 'chat-infinite__container--with-history' : ''
						}`}>
						{agents.map((agent, index) => (
							<AgentBox
								key={index}
								agent={agent}
								status={agent.status}
								content={agent.content}
								isFullscreen={fullscreenAgent === agent.id}
								onToggleFullscreen={handleToggleFullscreen}
							/>
						))}

						{/* Crucial moments sidebar (renamed from "Historia") */}
						{showHistory && (
							<>
								<div className="chat-infinite__overlay" onClick={toggleHistorySidebar}></div>
								<div className="chat-infinite__history-sidebar">
									<div className="chat-infinite__history-header">
										<h3>Genialne momenty</h3>
										<div className="chat-infinite__history-actions">
											<button
												className={`chat-infinite__history-refresh ${refreshingHistory ? 'refreshing' : ''}`}
												onClick={refreshCrucialMoments}
												title="Odśwież"
												disabled={refreshingHistory}>
												{refreshingHistory ? <Loader size="small" inline={true} /> : <RefreshCw size={14} />}
											</button>
											<button className="chat-infinite__history-close" onClick={toggleHistorySidebar}>
												<X size={16} />
											</button>
										</div>
									</div>
									<div className="chat-infinite__history-items">
										{crucialMoments.length > 0 ? (
											crucialMoments.map((moment, index) => (
												<div
													key={index}
													className={`chat-infinite__history-item chat-infinite__history-item--${moment.type}`}>
													<div className="chat-infinite__history-item-icon">
														{moment.type === 'genius_idea' && <Sparkles size={16} />}
														{moment.type === 'issue_solved' && <CheckCircle size={16} />}
														{moment.type === 'crucial_moment' && <Bookmark size={16} />}
													</div>
													<div className="chat-infinite__history-item-content">
														<div className="chat-infinite__history-item-header">
															<span className="chat-infinite__history-item-time">
																{new Date(moment.timestamp).toLocaleTimeString([], {
																	hour: '2-digit',
																	minute: '2-digit',
																})}
															</span>
														</div>
														<p className="chat-infinite__history-item-text">{moment.content}</p>
														<p className="chat-infinite__history-item-justification">{moment.justification}</p>
													</div>
												</div>
											))
										) : (
											<div className="chat-infinite__empty-history">
												<Info size={24} />
												<p>Genialne momenty pojawią się tutaj, gdy zostaną wykryte podczas rozmowy</p>
												<p className="chat-infinite__empty-history-hint">
													Czekaj na kilka wiadomości, aby system zaczął wykrywać momenty warte zapamiętania...
												</p>
											</div>
										)}
									</div>
								</div>
							</>
						)}

						{/* New messages history sidebar */}
						{showMessageHistory && (
							<>
								<div className="chat-infinite__overlay" onClick={toggleMessageHistorySidebar}></div>
								<div className="chat-infinite__history-sidebar">
									<div className="chat-infinite__history-header">
										<h3>Historia wiadomości</h3>
										<div className="chat-infinite__history-actions">
											<button
												className={`chat-infinite__history-refresh ${refreshingHistory ? 'refreshing' : ''}`}
												onClick={refreshCrucialMoments}
												title="Odśwież"
												disabled={refreshingHistory}>
												{refreshingHistory ? <Loader size="small" inline={true} /> : <RefreshCw size={14} />}
											</button>
											<button className="chat-infinite__history-close" onClick={toggleMessageHistorySidebar}>
												<X size={16} />
											</button>
										</div>
									</div>
									<div className="chat-infinite__history-items" ref={messageHistoryRef}>
										{chatData && chatData.messages && chatData.messages.length > 0 ? (
											chatData.messages.map((message, index) => {
												const personaName =
													message.role === 'assistant' && chatData.infiniteData.personas[message.personaIndex]
														? chatData.infiniteData.personas[message.personaIndex].name
														: 'Użytkownik'

												const isExpanded = expandedMessageId === message._id
												const isLongMessage = message.content.length > 300

												return (
													<div
														key={index}
														className={`chat-infinite__history-item chat-infinite__history-item--${message.role} ${
															isExpanded ? 'chat-infinite__history-item--expanded' : ''
														}`}>
														<div className="chat-infinite__history-item-icon">
															{message.role === 'assistant' ? <MessageCircle size={16} /> : <User size={16} />}
														</div>
														<div className="chat-infinite__history-item-content">
															<div className="chat-infinite__history-item-header">
																<span className="chat-infinite__history-item-agent">{personaName}</span>
																<span className="chat-infinite__history-item-time">
																	{new Date(message.timestamp).toLocaleTimeString([], {
																		hour: '2-digit',
																		minute: '2-digit',
																	})}
																</span>
															</div>
															<p
																className="chat-infinite__history-item-text"
																onClick={() => isLongMessage && toggleMessageExpansion(message._id)}>
																{isExpanded || !isLongMessage
																	? formatMessageContent(message.content)
																	: formatMessageContent(`${message.content.substring(0, 300)}...`)}
															</p>
															{isLongMessage && (
																<button
																	className="chat-infinite__expand-button"
																	onClick={() => toggleMessageExpansion(message._id)}>
																	{isExpanded ? 'Zwiń' : 'Rozwiń'}
																</button>
															)}
														</div>
													</div>
												)
											})
										) : (
											<div className="chat-infinite__empty-history">
												<Info size={24} />
												<p>Brak wiadomości w historii.</p>
												<p className="chat-infinite__empty-history-hint">
													Gdy rozmowa się rozpocznie, wiadomości pojawią się tutaj.
												</p>
											</div>
										)}
									</div>
								</div>
							</>
						)}
					</div>

					<div className="chat-infinite__controls">
						<div className="chat-infinite__topic-display">
							<span>Temat: "{topic}"</span>
						</div>
						{!autoContinue && (
							<button
								className="chat-infinite__continue-button"
								onClick={handleContinue}
								disabled={processing || isStreamingResponse}>
								{processing || isStreamingResponse ? 'Przetwarzanie...' : 'Kontynuuj konwersację'}
								<ArrowRight size={16} />
							</button>
						)}
					</div>
				</>
			)}
		</div>
	)
}

export default ChatInfinite

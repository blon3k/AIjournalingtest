import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import {
	ChevronLeft,
	X,
	CheckCircle,
	AlertCircle,
	Bot,
	Brain,
	Search,
	Code,
	ClipboardCheck,
	Zap,
	Maximize,
	Minimize,
	FileText,
	Lightbulb,
	PenTool,
	Sparkles,
	Send,
} from 'lucide-react'
import './ChatGrid.css'
import Loader from '../Loader'
import chatService from '../../services/chatService'
import { useAuth } from '../../context/AuthContext'
import formatMessageContent from '../../utils/formatMessageContent'

const AgentBox = ({ title, icon, status, content, position, isFullscreen, onToggleFullscreen, isSummarizer }) => {
	const statusColors = {
		idle: '#9ca3af',
		working: '#4f46e5',
		completed: '#059669',
		error: '#ef4444',
	}

	return (
		<div
			className={`chat-grid__agent-box chat-grid__agent-box--${status} ${
				isFullscreen ? 'chat-grid__agent-box--fullscreen' : ''
			} ${isSummarizer ? 'chat-grid__agent-box--summarizer' : ''}`}
			data-position={position}
			onClick={isSummarizer && status === 'completed' ? onToggleFullscreen : undefined}>
			<div className="chat-grid__agent-header">
				<div className="chat-grid__agent-title">
					{icon}
					<span>{title}</span>
				</div>
				<div className="chat-grid__agent-status" style={{ color: statusColors[status] }}>
					{status === 'idle' && 'Oczekiwanie...'}
					{status === 'working' && 'Przetwarzanie...'}
					{status === 'completed' && 'Zakończono'}
					{status === 'error' && 'Błąd'}
				</div>
			</div>
			<div className="chat-grid__agent-content">
				{/* Conditionally render based on status and content presence */}
				{(status === 'working' || status === 'completed' || status === 'error') && content ? (
					<div className="chat-grid__agent-message">{formatMessageContent(content)}</div>
				) : (
					<div className="chat-grid__agent-placeholder">
						{status === 'idle' && 'Oczekiwanie na dane wejściowe...'}
						{status === 'working' && 'Analizuję...'}
						{status === 'completed' && 'Zadanie zakończone'}
						{status === 'error' && 'Wystąpił błąd'}
					</div>
				)}
			</div>

			{!isSummarizer && (
				<button
					className="chat-grid__fullscreen-button"
					onClick={e => {
						e.stopPropagation()
						onToggleFullscreen()
					}}>
					{isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
				</button>
			)}

			{isSummarizer && status === 'completed' && !isFullscreen && (
				<button
					className="chat-grid__fullscreen-button chat-grid__summarizer-fullscreen"
					onClick={() => onToggleFullscreen()}>
					<Maximize size={18} />
				</button>
			)}

			{isSummarizer && isFullscreen && (
				<button
					className="chat-grid__fullscreen-button chat-grid__summarizer-fullscreen"
					onClick={() => onToggleFullscreen()}>
					<Minimize size={18} />
				</button>
			)}
		</div>
	)
}

const ChatGrid = () => {
	const { chatId } = useParams()
	const navigate = useNavigate()
	const location = useLocation()
	const { user } = useAuth()
	const [userInput, setUserInput] = useState('')
	const [processing, setProcessing] = useState(false)
	const [currentProcessingAgentId, setCurrentProcessingAgentId] = useState(null)
	const [validationPassed, setValidationPassed] = useState(null)
	const [chatData, setChatData] = useState(null)
	const [finished, setFinished] = useState(false)
	const [fullscreenAgent, setFullscreenAgent] = useState(null)
	const [error, setError] = useState(null)
	const [loading, setLoading] = useState(false)
	const summarizeCompleted = useRef(false)
	const inputRef = useRef(null)
	const activeStreamController = useRef(null)
	const currentSequenceChatId = useRef(null)

	// Define the agents
	const initialAgents = [
		{
			id: 1,
			title: 'Planer',
			icon: <PenTool size={16} />,
			status: 'idle',
			content: '',
		},
		{
			id: 2,
			title: 'Analityk',
			icon: <Search size={16} />,
			status: 'idle',
			content: '',
		},
		{
			id: 3,
			title: 'Rozwiązywanie Problemów #1',
			icon: <Brain size={16} />,
			status: 'idle',
			content: '',
		},
		{
			id: 4,
			title: 'Rozwiązywanie Problemów #2',
			icon: <Lightbulb size={16} />,
			status: 'idle',
			content: '',
		},
		{
			id: 5,
			title: 'Rozwiązywanie Problemów #3',
			icon: <Sparkles size={16} />,
			status: 'idle',
			content: '',
		},
		{
			id: 6,
			title: 'Podsumowanie',
			icon: <FileText size={16} />,
			status: 'idle',
			content: '',
		},
	]

	const [agentStates, setAgentStates] = useState(initialAgents)

	// Abort stream on component unmount or navigation
	useEffect(() => {
		return () => {
			if (activeStreamController.current) {
				console.log('[ChatGrid] Component unmounting, aborting active stream.')
				activeStreamController.current.abort()
				activeStreamController.current = null
				currentSequenceChatId.current = null
			}
		}
	}, [])

	// Load existing chat data or create a new one
	useEffect(() => {
		let isMounted = true
		const fetchData = async () => {
			setLoading(true)
			setError(null) // Clear previous errors
			try {
				if (chatId) {
					console.log(`[ChatGrid] Fetching existing chat data for ID: ${chatId}`)
					const chat = await chatService.getChatById(chatId)
					if (!isMounted) return // Prevent state updates if unmounted
					setChatData(chat)

					let lastCompletedAgentId = 0
					let isChatComplete = false

					if (chat.agentData && chat.agentData.agentResponses && chat.agentData.agentResponses.length > 0) {
						console.log(`[ChatGrid] Loading agent data from existing chat:`, chat.agentData)
						const updatedAgents = [...initialAgents] // Start fresh
						chat.agentData.agentResponses.forEach(response => {
							const agentIndex = updatedAgents.findIndex(a => a.id === response.agentId)
							if (agentIndex >= 0) {
								console.log(`[ChatGrid] Updating agent ${response.agentId} with content.`)
								updatedAgents[agentIndex].content = response.content
								updatedAgents[agentIndex].status = 'completed'
								lastCompletedAgentId = Math.max(lastCompletedAgentId, response.agentId)
							}
						})
						setAgentStates(updatedAgents)

						if (chat.agentData.completed) {
							console.log(`[ChatGrid] Chat ${chatId} is already marked completed.`)
							setFinished(true)
							summarizeCompleted.current = true
							isChatComplete = true
							setFullscreenAgent(6) // Show summary fullscreen if completed
						}
					}

					// Start processing from the next agent if not complete and has a user question
					if (!isChatComplete && chat.agentData?.userQuestion && lastCompletedAgentId < 6) {
						setUserInput(chat.agentData.userQuestion) // Ensure input reflects the question
						const nextAgentId = lastCompletedAgentId + 1
						console.log(`[ChatGrid] Resuming processing for chat ${chatId} from agent ${nextAgentId}`)
						setTimeout(() => {
							if (isMounted) {
								processAgentsSequentially(chat.agentData.userQuestion, chat._id, nextAgentId)
							}
						}, 500) // Delay slightly
					} else if (!chat.agentData?.userQuestion) {
						console.log(`[ChatGrid] Chat ${chatId} loaded but no user question found in agentData.`)
					}
				} else {
					const queryParams = new URLSearchParams(location.search)
					const messageParam = queryParams.get('message')
					console.log(`[ChatGrid] No chatId provided. Checking for message param: ${messageParam}`)

					if (messageParam) {
						setUserInput(messageParam)
						try {
							console.log(`[ChatGrid] Creating new problem-solving chat with message: ${messageParam}`)
							const newChat = await chatService.createProblemSolvingChat({
								message: messageParam,
								model: 'gpt-4o', // Or use a default/selected model
							})
							if (!isMounted) return
							setChatData(newChat)
							console.log(`[ChatGrid] New chat created with ID: ${newChat._id}. Navigating and starting processing.`)
							navigate(`/chat/problem-solving/${newChat._id}`, { replace: true })

							setTimeout(() => {
								if (isMounted) {
									processAgentsSequentially(messageParam, newChat._id, 1)
								}
							}, 500)
						} catch (err) {
							console.error('[ChatGrid] Error creating problem-solving chat:', err)
							if (isMounted) {
								setError(`Nie udało się utworzyć czatu: ${err.message || 'Nieznany błąd'}`)
							}
						}
					} else {
						console.log('[ChatGrid] No chat ID or message param found. Waiting for user input.')
						// Reset agent states if navigating to a blank grid
						setAgentStates(initialAgents)
						currentSequenceChatId.current = null
					}
				}
			} catch (err) {
				console.error('[ChatGrid] Error fetching or processing chat data:', err)
				if (isMounted) {
					setError(`Nie udało się załadować danych czatu: ${err.message || 'Nieznany błąd'}`)
				}
			} finally {
				if (isMounted) {
					setLoading(false)
				}
			}
		}

		fetchData()

		return () => {
			isMounted = false
			currentSequenceChatId.current = null
		} // Cleanup function
	}, [chatId, location.search, navigate]) // Rerun if chatId or query params change

	const handleToggleFullscreen = agentId => {
		console.log(`[ChatGrid] Toggling fullscreen for agent ${agentId}`)
		if (fullscreenAgent === agentId) {
			setFullscreenAgent(null)
		} else {
			setFullscreenAgent(agentId)
		}
	}

	const handleGoBack = () => {
		console.log('[ChatGrid] Navigating back to /chat')
		if (activeStreamController.current) {
			console.log('[ChatGrid] Aborting active stream due to navigation.')
			activeStreamController.current.abort()
			activeStreamController.current = null
			currentSequenceChatId.current = null
		}
		navigate('/chat')
	}

	// --- Real Streaming Handlers ---
	const handleStreamChunk = (agentId, chunk) => {
		// console.log(`[ChatGrid] Received chunk for agent ${agentId}:`, chunk); // Verbose
		setAgentStates(prev =>
			prev.map(agent =>
				agent.id === agentId ? { ...agent, content: agent.content + chunk, status: 'working' } : agent
			)
		)
	}

	const handleStreamComplete = async completedAgentId => {
		console.log(`[ChatGrid] Stream completed for agent ${completedAgentId}`)
		const chatIdForNextStep = currentSequenceChatId.current

		activeStreamController.current = null // Clear the controller
		setCurrentProcessingAgentId(null) // No agent actively streaming

		setAgentStates(prev =>
			prev.map(agent => (agent.id === completedAgentId ? { ...agent, status: 'completed' } : agent))
		)

		// Trigger the next agent if not the last one
		const nextAgentId = completedAgentId + 1
		if (nextAgentId <= initialAgents.length) {
			// Short delay before starting next agent for smoother UI
			setTimeout(() => {
				console.log(`[ChatGrid] Attempting to start next agent ${nextAgentId} for chat ${chatIdForNextStep}`)
				if (chatIdForNextStep) {
					processAgentStreamStep(chatIdForNextStep, nextAgentId)
				} else {
					console.error(`[ChatGrid] Cannot start next agent ${nextAgentId}, chatIdForNextStep is null or undefined.`)
					setError('Wystąpił błąd wewnętrzny (brak ID czatu dla następnego kroku).')
					setProcessing(false)
				}
			}, 300)
		} else {
			console.log('[ChatGrid] All agents completed processing.')
			setFinished(true)
			setProcessing(false)
			summarizeCompleted.current = true
			currentSequenceChatId.current = null
			// Automatically show summary fullscreen after completion
			setTimeout(() => setFullscreenAgent(6), 500)
		}
	}

	const handleStreamError = (agentId, errorMsg) => {
		console.error(`[ChatGrid] Stream error for agent ${agentId}:`, errorMsg)
		activeStreamController.current = null
		setCurrentProcessingAgentId(null)
		currentSequenceChatId.current = null

		setAgentStates(prev =>
			prev.map(agent =>
				agent.id === agentId ? { ...agent, status: 'error', content: agent.content + `\n\nBŁĄD: ${errorMsg}` } : agent
			)
		)
		setError(`Błąd podczas przetwarzania Agenta ${agentId}: ${errorMsg}`)
		setProcessing(false) // Stop overall processing on error
	}
	// --- End Streaming Handlers ---

	// Process a single agent step using streaming
	const processAgentStreamStep = async (currentChatId, agentIdToProcess) => {
		if (!currentChatId) {
			console.error('[ChatGrid] Cannot process agent stream without chatId.')
			handleStreamError(agentIdToProcess, 'Brak ID czatu. Nie można kontynuować.')
			return
		}

		// Ensure only one stream runs at a time
		if (activeStreamController.current) {
			console.warn(
				`[ChatGrid] Attempted to start agent ${agentIdToProcess} while agent ${currentProcessingAgentId} is already streaming. Aborting previous.`
			)
			activeStreamController.current.abort()
		}

		console.log(`[ChatGrid] Starting stream process for agent ${agentIdToProcess}, chat ${currentChatId}`)
		setCurrentProcessingAgentId(agentIdToProcess)

		// Set agent to working state immediately, clear previous content if retrying
		setAgentStates(prev =>
			prev.map(agent => (agent.id === agentIdToProcess ? { ...agent, status: 'working', content: '' } : agent))
		)

		try {
			// Call the streaming service function
			const controller = await chatService.processAgentStream(
				currentChatId,
				agentIdToProcess,
				handleStreamChunk,
				handleStreamComplete, // Will trigger next step or finish
				handleStreamError
			)
			activeStreamController.current = controller // Store the controller to allow aborting
		} catch (error) {
			// This catch is mainly for errors during the *initiation* of the stream
			console.error(`[ChatGrid] Error initiating stream for agent ${agentIdToProcess}:`, error)
			handleStreamError(agentIdToProcess, `Nie udało się rozpocząć przetwarzania: ${error.message}`)
			// No need to call setProcessing(false) here, handleStreamError does it
		}
	}

	// Main function to start the sequential processing of agents
	const processAgentsSequentially = async (input, chatIdToUse, startAgentId = 1) => {
		if (!input || processing) return

		const currentChatId = chatIdToUse || chatData?._id
		if (!currentChatId) {
			setError('Brak ID czatu. Spróbuj ponownie.')
			console.error('[ChatGrid] processAgentsSequentially called without a valid chatId.')
			return
		}

		console.log(
			`[ChatGrid] Starting sequential processing for chat ${currentChatId} from agent ${startAgentId}. Input: "${input.substring(
				0,
				50
			)}..."`
		)
		currentSequenceChatId.current = currentChatId
		setProcessing(true)
		setFullscreenAgent(null)
		setFinished(false)
		setError(null) // Clear previous errors
		summarizeCompleted.current = false

		// Reset agent states to idle before starting, except for those already completed if resuming
		setAgentStates(prev =>
			prev.map(agent =>
				agent.id < startAgentId && agent.status === 'completed'
					? agent // Keep completed state for previous agents
					: {
							...agent,
							status: agent.id === startAgentId ? 'working' : 'idle',
							content: agent.id >= startAgentId ? '' : agent.content,
					  }
			)
		)

		// Hide the input form during processing if it was triggered by form submit
		// setUserInput(''); // Keep input visible if resuming or loading

		// Start the first agent stream
		processAgentStreamStep(currentChatId, startAgentId)
	}

	// Handle user input submission
	const handleInputSubmit = async e => {
		e.preventDefault()

		if (!userInput.trim() || processing) return

		const currentInput = userInput.trim()
		console.log(`[ChatGrid] Input submitted: "${currentInput.substring(0, 50)}..."`)

		// Clear input immediately after submission
		setUserInput('')

		if (chatData && chatData._id) {
			console.log(`[ChatGrid] Using existing chat ${chatData._id} for processing.`)
			try {
				setChatData(prev => ({ ...prev, agentData: { ...prev.agentData, userQuestion: currentInput } }))
				await chatService.updateChat(chatData._id, { agentData: { ...chatData.agentData, userQuestion: currentInput } })
				processAgentsSequentially(currentInput, chatData._id, 1)
			} catch (updateError) {
				console.error('[ChatGrid] Error updating chat with new question:', updateError)
				setError(`Nie udało się zaktualizować pytania: ${updateError.message}`)
			}
		} else {
			try {
				console.log('[ChatGrid] Creating new chat for processing.')
				const newChat = await chatService.createProblemSolvingChat({
					message: currentInput,
					model: 'gpt-4o',
				})
				setChatData(newChat)
				navigate(`/chat/problem-solving/${newChat._id}`, { replace: true })
				console.log(`[ChatGrid] New chat ${newChat._id} created. Starting processing.`)
				processAgentsSequentially(currentInput, newChat._id, 1)
			} catch (err) {
				console.error('[ChatGrid] Error creating problem-solving chat on submit:', err)
				setError(`Nie udało się utworzyć czatu: ${err.message || 'Nieznany błąd'}`)
			}
		}
	}

	return (
		<div className="chat-grid">
			<div className="chat-grid__header">
				<div className="chat-grid__header-left">
					<button className="chat-grid__back-button" onClick={handleGoBack}>
						<ChevronLeft size={18} />
					</button>
					<h2 className="chat-grid__title">
						{loading ? 'Ładowanie...' : chatData?.title || 'Tryb Rozwiązywania Problemów'}
					</h2>
				</div>
				<div className="chat-grid__header-right">
					<button className="chat-grid__action-button chat-grid__leave-button" onClick={handleGoBack}>
						Wyjdź
						<X size={14} />
					</button>
				</div>
			</div>

			{error && (
				<div className="chat-grid__error">
					<AlertCircle size={18} />
					<span>{error}</span>
					<button onClick={() => setError(null)}>Zamknij</button>
				</div>
			)}

			{loading ? (
				<div className="chat-grid__loading">
					<Loader size="large" text="Ładowanie danych czatu..." />
				</div>
			) : (
				<>
					<div className={`chat-grid__container ${fullscreenAgent ? 'chat-grid__container--fullscreen' : ''}`}>
						{agentStates.map((agent, index) => (
							<AgentBox
								key={agent.id}
								position={index + 1}
								title={agent.title}
								icon={agent.icon}
								status={agent.status}
								content={agent.content}
								isFullscreen={fullscreenAgent === agent.id}
								onToggleFullscreen={() => handleToggleFullscreen(agent.id)}
								isSummarizer={agent.id === 6}
							/>
						))}
					</div>

					{/* Show completion message only when finished and not fullscreen */}
					{finished && summarizeCompleted.current && !fullscreenAgent && (
						<div className="chat-grid__validation-passed">
							<CheckCircle size={20} />
							<span>Zakończono. Zobacz podsumowanie powyżej.</span>
						</div>
					)}

					{/* Show input form if: 
						- Not currently processing AND 
						- EITHER the chat hasn't started (no chatData or no user question)
						- OR the chat is finished (allowing resubmission) 
					*/}
					{!processing && (!chatData || !chatData.agentData?.userQuestion || finished) && (
						<form className="chat-grid__input-form" onSubmit={handleInputSubmit}>
							<div className="chat-grid__input-container">
								<input
									ref={inputRef}
									type="text"
									className="chat-grid__input"
									placeholder="Zadaj nowe pytanie/problem"
									value={userInput}
									onChange={e => setUserInput(e.target.value)}
									disabled={processing}
								/>
								<button type="submit" className="chat-grid__send-button" disabled={!userInput.trim() || processing}>
									<Send size={18} />
								</button>
							</div>
						</form>
					)}
				</>
			)}
		</div>
	)
}

export default ChatGrid

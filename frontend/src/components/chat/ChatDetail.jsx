import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
	MessageSquare,
	ChevronLeft,
	X,
	Clock,
	Mic,
	Bot,
	Send,
	ArrowRight,
	FileText,
	Share2,
	File,
	Command,
	Image,
	Paperclip,
	Bolt,
	Star,
	AlertCircle,
} from 'lucide-react'
import './ChatDetail.css'
import Loader from '../Loader'
import chatService from '../../services/chatService'
import { useAuth } from '../../context/AuthContext'
import formatMessageContent from '../../utils/formatMessageContent'

// Import model icons directly from Chat.jsx
const ClaudeIcon = ({ size = 14 }) => (
	<svg width={size} height={size} viewBox="0 0 48 32" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
		<path d="M32.73 0h-6.945L38.45 32h6.945L32.73 0ZM12.665 0 0 32h7.082l2.59-6.72h13.25l2.59 6.72h7.082L19.929 0h-7.264Zm-.702 19.337 4.334-11.246 4.334 11.246h-8.668Z" />
	</svg>
)

const GPTIcon = ({ size = 14 }) => (
	<svg width={size} height={size} viewBox="0 0 600 600" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
		<path d="M304.246 295.411V249.828C304.246 245.989 305.687 243.109 309.044 241.191L400.692 188.412C413.167 181.215 428.042 177.858 443.394 177.858C500.971 177.858 537.44 222.482 537.44 269.982C537.44 273.34 537.44 277.179 536.959 281.018L441.954 225.358C436.197 222 430.437 222 424.68 225.358L304.246 295.411ZM518.245 472.945V364.024C518.245 357.304 515.364 352.507 509.608 349.149L389.174 279.096L428.519 256.543C431.877 254.626 434.757 254.626 438.115 256.543L529.762 309.323C556.154 324.679 573.905 357.304 573.905 388.971C573.905 425.436 552.315 459.024 518.245 472.941V472.945ZM275.937 376.982L236.592 353.952C233.235 352.034 231.794 349.154 231.794 345.315V239.756C231.794 188.416 271.139 149.548 324.4 149.548C344.555 149.548 363.264 156.268 379.102 168.262L284.578 222.964C278.822 226.321 275.942 231.119 275.942 237.838V376.986L275.937 376.982ZM360.626 425.922L304.246 394.255V327.083L360.626 295.416L417.002 327.083V394.255L360.626 425.922ZM396.852 571.789C376.698 571.789 357.989 565.07 342.151 553.075L436.674 498.374C442.431 495.017 445.311 490.219 445.311 483.499V344.352L485.138 367.382C488.495 369.299 489.936 372.179 489.936 376.018V481.577C489.936 532.917 450.109 571.785 396.852 571.785V571.789ZM283.134 464.79L191.486 412.01C165.094 396.654 147.343 364.029 147.343 332.362C147.343 295.416 169.415 262.309 203.48 248.393V357.791C203.48 364.51 206.361 369.308 212.117 372.665L332.074 442.237L292.729 464.79C289.372 466.707 286.491 466.707 283.134 464.79ZM277.859 543.48C223.639 543.48 183.813 502.695 183.813 452.314C183.813 448.475 184.294 444.636 184.771 440.797L279.295 495.498C285.051 498.856 290.812 498.856 296.568 495.498L417.002 425.927V471.509C417.002 475.349 415.562 478.229 412.204 480.146L320.557 532.926C308.081 540.122 293.206 543.48 277.854 543.48H277.859ZM396.852 600.576C454.911 600.576 503.37 559.313 514.41 504.612C568.149 490.696 602.696 440.315 602.696 388.976C602.696 355.387 588.303 322.762 562.392 299.25C564.791 289.173 566.231 279.096 566.231 269.024C566.231 200.411 510.571 149.067 446.274 149.067C433.322 149.067 420.846 150.984 408.37 155.305C386.775 134.192 357.026 120.758 324.4 120.758C266.342 120.758 217.883 162.02 206.843 216.721C153.104 230.637 118.557 281.018 118.557 332.357C118.557 365.946 132.95 398.571 158.861 422.083C156.462 432.16 155.022 442.237 155.022 452.309C155.022 520.922 210.682 572.266 274.978 572.266C287.931 572.266 300.407 570.349 312.883 566.028C334.473 587.141 364.222 600.576 396.852 600.576Z" />
	</svg>
)

// Add the missing DeepSeekIcon definition
const DeepSeekIcon = ({ size = 14 }) => (
	<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
		<path d="M23.748 4.482c-.254-.124-.364.113-.512.234-.051.039-.094.09-.137.136-.372.397-.806.657-1.373.626-.829-.046-1.537.214-2.163.848-.133-.782-.575-1.248-1.247-1.548-.352-.156-.708-.311-.955-.65-.172-.241-.219-.51-.305-.774-.055-.16-.11-.323-.293-.35-.2-.031-.278.136-.356.276-.313.572-.434 1.202-.422 1.84.027 1.436.633 2.58 1.838 3.393.137.093.172.187.129.323-.082.28-.18.552-.266.833-.055.179-.137.217-.329.14a5.526 5.526 0 01-1.736-1.18c-.857-.828-1.631-1.742-2.597-2.458a11.365 11.365 0 00-.689-.471c-.985-.957.13-1.743.388-1.836.27-.098.093-.432-.779-.428-.872.004-1.67.295-2.687.684a3.055 3.055 0 01-.465.137 9.597 9.597 0 00-2.883-.102c-1.885.21-3.39 1.102-4.497 2.623C.082 8.606-.231 10.684.152 12.85c.403 2.284 1.569 4.175 3.36 5.653 1.858 1.533 3.997 2.284 6.438 2.14 1.482-.085 3.133-.284 4.994-1.86.47.234.962.327 1.78.397.63.059 1.236-.03 1.705-.128.735-.156.684-.837.419-.961-2.155-1.004-1.682-.595-2.113-.926 1.096-1.296 2.746-2.642 3.392-7.003.05-.347.007-.565 0-.845-.004-.17.035-.237.23-.256a4.173 4.173 0 001.545-.475c1.396-.763 1.96-2.015 2.093-3.517.02-.23-.004-.467-.247-.588zM11.581 18c-2.089-1.642-3.102-2.183-3.52-2.16-.392.024-.321.471-.235.763.09.288.207.486.371.739.114.167.192.416-.113.603-.673.416-1.842-.14-1.897-.167-1.361-.802-2.5-1.86-3.301-3.307-.774-1.393-1.224-2.887-1.298-4.482-.02-.386.093-.522.477-.592a4.696 4.696 0 011.529-.039c2.132.312 3.946 1.265 5.468 2.774.868.86 1.525 1.887 2.202 2.891.72 1.066 1.494 2.082 2.48 2.914.348.292.625.514.891.677-.802.09-2.14.11-3.054-.614zm1-6.44a.306.306 0 01.415-.287.302.302 0 01.2.288.306.306 0 01-.31.307.303.303 0 01-.304-.308zm3.11 1.596c-.2.081-.399.151-.59.16a1.245 1.245 0 01-.798-.254c-.274-.23-.47-.358-.552-.758a1.73 1.73 0 01.016-.588c.07-.327-.008-.537-.239-.727-.187-.156-.426-.199-.688-.199a.559.559 0 01-.254-.078c-.11-.054-.2-.19-.114-.358.028-.054.16-.186.192-.21.356-.202.767-.136 1.146.016.352.144.618.408 1.001.782.391.451.462.576.685.914.176.265.336.537.445.848.067.195-.019.354-.25.452z" />
	</svg>
)

// Model tag component - exact match to Chat.jsx
const ModelTag = ({ icon, text, color = '#4f46e5' }) => (
	<span className="chat-detail__model-tag" style={{ backgroundColor: `${color}10`, color }}>
		{icon && <span className="chat-detail__model-tag-icon">{icon}</span>}
		<span>{text}</span>
	</span>
)

const FileAttachment = ({ fileName, fileType, fileSize }) => (
	<div className="chat-detail__file-attachment">
		<div className="chat-detail__file-icon">{fileType === 'image' ? <Image size={16} /> : <File size={16} />}</div>
		<div className="chat-detail__file-details">
			<div className="chat-detail__file-name">{fileName}</div>
			<div className="chat-detail__file-size">{fileSize}</div>
		</div>
	</div>
)

const ChatDetail = ({ onChatUpdated }) => {
	const { chatId } = useParams()
	const navigate = useNavigate()
	const { user } = useAuth()
	const [chat, setChat] = useState(null)
	const [messages, setMessages] = useState([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState(null)
	const [summarizing, setSummarizing] = useState(false)
	const [input, setInput] = useState('')
	const [isRecording, setIsRecording] = useState(false)
	const [isTranscribing, setIsTranscribing] = useState(false)
	const [isSending, setIsSending] = useState(false)
	const [currentResponse, setCurrentResponse] = useState('')

	const inputRef = useRef(null)
	const messagesEndRef = useRef(null)

	// Fetch chat data on component mount
	useEffect(() => {
		if (chatId) {
			fetchChatData()
		}
	}, [chatId])

	// Automatically trigger AI response if needed after data loads
	useEffect(() => {
		if (chat && messages.length > 0 && !loading && !isSending) {
			const lastMsg = messages[messages.length - 1]
			const secondLastMsg = messages.length > 1 ? messages[messages.length - 2] : null

			// Trigger if:
			// 1. Last message is from user AND it's the only message OR the second-to-last was NOT from the user.
			// This prevents triggering if the last two messages are both from the user (e.g., double send).
			if (lastMsg.role === 'user' && (messages.length === 1 || (secondLastMsg && secondLastMsg.role !== 'user'))) {
				// Check if AI is already responding
				const isAlreadyResponding = messages.some(m => m.role === 'assistant' && m.timestamp > lastMsg.timestamp)

				if (!isAlreadyResponding) {
					console.log('Automatically triggering AI response for:', lastMsg.content)
					generateAIResponse(lastMsg.content)
				}
			}
		}
	}, [chat, messages, loading, isSending]) // Depend on chat, messages, loading and isSending

	// Scroll to bottom when messages change
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
	}, [messages])

	// Fetch chat data from API
	const fetchChatData = async () => {
		try {
			setLoading(true)
			setError(null)

			const chatData = await chatService.getChatById(chatId)
			setChat(chatData)
			setMessages(chatData.messages || [])

			// Check if the last message is from a user with no AI response
			// MOVED to useEffect below to ensure 'chat' state is updated
			// const msgs = chatData.messages || []
			// if (msgs.length > 0) {
			// 	const lastMsg = msgs[msgs.length - 1]
			// 	// If the last message is from a user and there's not a pair (user + AI)
			// 	// or if there's only one message in the chat (which means it's from the user)
			// 	if (lastMsg.role === 'user' && (msgs.length === 1 || msgs[msgs.length - 2].role === 'assistant')) {
			// 		// Automatically trigger AI response
			// 		setTimeout(() => {
			// 			generateAIResponse(lastMsg.content)
			// 		}, 500)
			// 	}
			// }
		} catch (error) {
			console.error('Error fetching chat:', error)
			setError('Failed to load chat. Please try again.')
		} finally {
			setLoading(false)
		}
	}

	// Adjust textarea height
	useEffect(() => {
		if (inputRef.current) {
			inputRef.current.style.height = '24px'
			const scrollHeight = inputRef.current.scrollHeight
			inputRef.current.style.height = `${Math.min(scrollHeight, 120)}px`
		}
	}, [input])

	// Format time
	const formatTime = timestamp => {
		const date = new Date(timestamp)
		return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
	}

	// Leave chat
	const handleLeaveChat = () => {
		navigate('/chat')
	}

	// Handle input change
	const handleInputChange = e => {
		setInput(e.target.value)
	}

	// Handle sending message
	const handleSendMessage = async e => {
		e?.preventDefault()

		if (!input.trim() || isTranscribing || isSending) return

		try {
			setIsSending(true)

			// Add user message
			const userMessage = {
				role: 'user',
				content: input.trim(),
				timestamp: new Date().toISOString(),
			}

			// Update local state first for immediate feedback
			setMessages(prev => [...prev, userMessage])
			setInput('')

			// Save user message to database
			await chatService.addMessage(chatId, userMessage)

			// Notify parent component that a message was added
			if (onChatUpdated) onChatUpdated()

			// Start generating AI response only if chat exists
			if (chat && chat.model) {
				generateAIResponse(userMessage.content)
			} else {
				setError('Chat data not available to generate AI response.')
				setIsSending(false)
			}
		} catch (error) {
			console.error('Error sending message:', error)
			setError('Failed to send message. Please try again.')
			setIsSending(false)
		}
	}

	// Generate AI response using streaming
	const generateAIResponse = async userMessage => {
		try {
			setError(null)
			setIsSending(true)

			// Ensure chat and chat.model are available
			if (!chat || !chat.model) {
				setError('Chat data not available to generate AI response.')
				setIsSending(false)
				return
			}

			// Get all previous messages, excluding the most recent user message (we'll add it manually)
			const previousMessages = messages.map(msg => ({
				role: msg.role,
				content: msg.content,
			}))

			// Add the most recent user message
			previousMessages.push({
				role: 'user',
				content: userMessage,
			})

			// Start with empty response
			setCurrentResponse('')

			// Variable to store the complete response
			let fullResponse = ''
			let hasReceivedContent = false

			// Start streaming process
			await chatService.getAIResponse(
				{
					model: chat.model || 'gpt-4o',
					messages: previousMessages,
					chatId: chatId,
					useContext: true,
				},
				// Process each chunk
				chunk => {
					if (chunk.status === 'connected') {
						console.log('Connection established with AI service')
					} else if (chunk.choices && chunk.choices[0]?.delta?.content) {
						const newContent = chunk.choices[0].delta.content
						fullResponse += newContent
						setCurrentResponse(fullResponse)
						hasReceivedContent = true
					}
				},
				// On complete
				async () => {
					if (!hasReceivedContent) {
						setError('No content received from AI. The API key may be invalid or the service may be unavailable.')
						setIsSending(false)
						return
					}

					// IMPORTANT: Clear the streaming response state *before* adding the final message
					setCurrentResponse('')

					// When stream is complete, save the full message to state
					const aiMessage = {
						role: 'assistant',
						content: fullResponse, // Use the captured full response instead of currentResponse state
						timestamp: new Date().toISOString(),
						model: chat.model,
					}

					setMessages(prev => [...prev, aiMessage])

					// Save AI message to database
					try {
						await chatService.addMessage(chatId, aiMessage)
						// Notify parent that chat was updated
						if (onChatUpdated) onChatUpdated()
					} catch (saveError) {
						console.error('Error saving AI response:', saveError)
						setError('Response received but could not be saved. Your message was still sent.')
					}

					// No need to clear currentResponse here again
					// setCurrentResponse('')
					setIsSending(false)
				},
				// On error
				error => {
					console.error('Error generating AI response:', error)
					setError(`Failed to generate AI response: ${error}`)
					setIsSending(false)
				}
			)
		} catch (error) {
			console.error('Error generating AI response:', error)
			setError(`AI response error: ${error.message}`)
			setIsSending(false)
		}
	}

	// Add a retry function for when AI response fails
	const retryAIResponse = () => {
		// Get the last user message
		const lastUserMessage = [...messages].reverse().find(m => m.role === 'user')
		if (lastUserMessage) {
			setError(null)
			generateAIResponse(lastUserMessage.content)
		} else {
			setError('No previous user message found to retry.')
		}
	}

	// Handle summarize
	const handleSummarize = async () => {
		setSummarizing(true)

		try {
			// Ensure chat and chat.model are available
			if (!chat || !chat.model) {
				setError('Chat data not available to generate summary.')
				setSummarizing(false)
				return
			}

			// Create system message asking for summary
			const previousMessages = messages.map(msg => ({
				role: msg.role,
				content: msg.content,
			}))

			// Add a system message at the end asking for summary
			previousMessages.push({
				role: 'user',
				content:
					'Proszę o podsumowanie tej całej konwersacji w kilku punktach. Podsumowanie powinno być zwięzłe, ale zawierać wszystkie kluczowe informacje.',
			})

			let summaryText = ''

			// Start streaming process
			await chatService.getAIResponse(
				{
					model: chat.model || 'gpt-4o',
					messages: previousMessages,
					chatId: chatId,
					useContext: false,
				},
				// Process each chunk
				chunk => {
					if (chunk.choices && chunk.choices[0]?.delta?.content) {
						const newContent = chunk.choices[0].delta.content
						summaryText += newContent
					}
				},
				// On complete
				() => {
					// When stream is complete, save the summary message
					const summaryMessage = {
						role: 'assistant',
						content: summaryText,
						timestamp: new Date().toISOString(),
						model: chat.model,
						isSummary: true,
					}

					setMessages(prev => [...prev, summaryMessage])
					setSummarizing(false)
				},
				// On error
				error => {
					console.error('Error generating summary:', error)
					setError('Failed to generate summary. Please try again.')
					setSummarizing(false)
				}
			)
		} catch (error) {
			console.error('Error generating summary:', error)
			setError('Failed to generate summary. Please try again.')
			setSummarizing(false)
		}
	}

	// Toggle microphone
	const toggleMicrophone = () => {
		if (isRecording) {
			setIsRecording(false)
			setIsTranscribing(true)

			// Simulate transcription
			setTimeout(() => {
				setInput(prev => prev + 'Czy możemy dostosować budżet, aby przeznaczyć więcej na media społecznościowe?')
				setIsTranscribing(false)
			}, 1500)
		} else {
			setIsRecording(true)
		}
	}

	// Handle sharing summary
	const handleShareSummary = summary => {
		const sharedData = {
			title: `Podsumowanie rozmowy: ${chat?.title || 'Chat'}`,
			content: 'Udostępniam podsumowanie mojej rozmowy z AI.',
			summary: summary.content,
		}
		// Store data in sessionStorage temporarily
		sessionStorage.setItem('sharedContent', JSON.stringify(sharedData))
		// Navigate to community with a query parameter to open share modal
		navigate('/community?share=true')
	}

	// Show loading state
	if (loading) {
		return (
			<div className="chat-detail">
				<div className="chat-detail__loading">
					<Loader size="large" text="Ładowanie czatu..." />
				</div>
			</div>
		)
	}

	// Show error state
	if (error && !chat) {
		return (
			<div className="chat-detail">
				<div className="chat-detail__error">
					<AlertCircle size={24} />
					<p>{error}</p>
					<button onClick={fetchChatData}>Spróbuj ponownie</button>
				</div>
			</div>
		)
	}

	// Show chat not found
	if (!chat) {
		return (
			<div className="chat-detail">
				<div className="chat-detail__error">
					<AlertCircle size={24} />
					<p>Nie znaleziono czatu</p>
					<button onClick={() => navigate('/chat')}>Wróć do listy czatów</button>
				</div>
			</div>
		)
	}

	// Define model info from chat - Guarded by the !chat check below
	const currentModel = chat
		? {
				// Check if chat is not null
				name: chat.model,
				icon: chat.model.startsWith('gpt-')
					? GPTIcon
					: chat.model.startsWith('claude-')
					? ClaudeIcon
					: chat.model.startsWith('deepseek-')
					? DeepSeekIcon
					: null,
				tags: [{ text: 'AI', color: '#10b981' }],
		  }
		: null // Set to null if chat is null

	return (
		<div className="chat-detail">
			<div className="chat-detail__header">
				<div className="chat-detail__header-left">
					<button className="chat-detail__back-button" onClick={handleLeaveChat}>
						<ChevronLeft size={18} />
					</button>
					<h2 className="chat-detail__title">{chat.title}</h2>
					<div className="chat-detail__model-info">
						{currentModel?.icon && <currentModel.icon size={16} />} {/* Optional chaining */}
						<span>{currentModel?.name}</span> {/* Optional chaining */}
						<div className="chat-detail__model-tags">
							{currentModel?.tags.map((tag, idx /* Optional chaining */) => (
								<ModelTag key={idx} text={tag.text} color={tag.color} />
							))}
						</div>
					</div>
				</div>
				<div className="chat-detail__header-right">
					<button
						className="chat-detail__action-button"
						onClick={handleSummarize}
						disabled={summarizing || messages.length < 2}>
						{summarizing ? 'Podsumowuję...' : 'Podsumuj'}
						<FileText size={14} />
					</button>
					<button className="chat-detail__action-button chat-detail__leave-button" onClick={handleLeaveChat}>
						Opuść Czat
						<X size={14} />
					</button>
				</div>
			</div>

			<div className="chat-detail__messages">
				{messages.map((message, index) => (
					<div
						key={index}
						className={`chat-detail__message chat-detail__message--${message.role} ${
							message.isSummary ? 'chat-detail__message--summary' : ''
						}`}>
						{message.attachment && (
							<div className="chat-detail__message-attachment">
								<FileAttachment
									fileName={message.attachment.name}
									fileType={message.attachment.type}
									fileSize={message.attachment.size}
								/>
							</div>
						)}
						<div className="chat-detail__message-content">
							<div className="chat-detail__message-text">{formatMessageContent(message.content)}</div>
							{message.isSummary && (
								<div className="chat-detail__summary-actions">
									<button className="chat-detail__summary-action-button">
										Zapisz do Kontekstu
										<ArrowRight size={12} />
									</button>
									<button className="chat-detail__summary-action-button" onClick={() => handleShareSummary(message)}>
										Udostępnij Podsumowanie
										<Share2 size={12} />
									</button>
								</div>
							)}
							<div className="chat-detail__message-time">
								<Clock size={12} />
								<span>{formatTime(message.timestamp)}</span>
							</div>
						</div>
					</div>
				))}

				{/* Streaming response */}
				{currentResponse && (
					<div className="chat-detail__message chat-detail__message--assistant chat-detail__message--streaming">
						<div className="chat-detail__message-content">
							<div className="chat-detail__message-text">{formatMessageContent(currentResponse)}</div>
							<div className="chat-detail__message-indicator">
								<div className="typing-indicator">
									<span></span>
									<span></span>
									<span></span>
								</div>
							</div>
						</div>
					</div>
				)}

				{/* Display error message when AI response fails */}
				{error && (
					<div className="chat-detail__error-banner">
						<AlertCircle size={16} />
						<span>{error}</span>
						<button className="chat-detail__retry-button" onClick={retryAIResponse}>
							Spróbuj ponownie
						</button>
					</div>
				)}

				<div ref={messagesEndRef} />
			</div>

			<form className="chat-detail__input-container" onSubmit={handleSendMessage}>
				<div className="chat-detail__input-wrapper">
					{isTranscribing && (
						<div className="chat-detail__transcribing-status">
							<div className="chat-detail__audio-wave">
								<span></span>
							</div>
							Transkrybuję audio...
						</div>
					)}

					<textarea
						ref={inputRef}
						className="chat-detail__input"
						value={input}
						onChange={handleInputChange}
						placeholder="Wpisz wiadomość..."
						rows={1}
						disabled={isTranscribing || isSending}
					/>

					<div className="chat-detail__input-tools">
						<button
							type="button"
							className="chat-detail__input-tool chat-detail__attachment-button"
							title="Dołącz plik"
							disabled={isTranscribing || isSending}>
							<Paperclip size={18} strokeWidth={1.5} />
						</button>
						<button
							type="button"
							className={`chat-detail__input-tool chat-detail__mic-button ${isRecording ? 'active' : ''} ${
								isTranscribing ? 'transcribing' : ''
							}`}
							onClick={toggleMicrophone}
							disabled={isTranscribing || isSending}>
							<Mic size={18} strokeWidth={1.5} />
						</button>
					</div>

					<button
						type="submit"
						className="chat-detail__send-button"
						disabled={!input.trim() || isTranscribing || isSending}>
						{isSending ? (
							<Loader size="small" inline={true} />
						) : (
							<>
								<Send size={16} strokeWidth={1.5} />
								<span className="chat-detail__shortcut-hint">Enter</span>
							</>
						)}
					</button>
				</div>
			</form>
		</div>
	)
}

export default ChatDetail

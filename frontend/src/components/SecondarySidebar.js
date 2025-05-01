import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import './SecondarySidebar.css'
import fileService from '../services/fileService'
import userService from '../services/userService'
import { useAuth } from '../context/AuthContext'
import {
	Search,
	Settings as SettingsIcon,
	PlusCircle,
	Edit,
	Trash2,
	Moon,
	Sun,
	Zap,
	MessageSquare,
	Clock,
	Filter,
	BookOpen,
	Star,
	History,
	Brain,
	Database,
	Book,
	User,
	Target,
	Award,
	Bookmark,
	Heart,
	Users,
	FileText,
	Image,
	File,
	Tag,
	FileCode,
	Code,
	Terminal,
	Pencil,
	Globe,
	TrendingUp,
	ThumbsUp,
	Cpu,
	Palette,
	Briefcase,
	Link,
	Bell,
	RefreshCw,
	CheckCircle,
	Shield,
	MessageCircle,
	UserCircle,
	Beaker,
	Laptop,
	Key,
	Monitor,
	Bot,
	AlertCircle,
	Calendar,
} from 'lucide-react'
import chatService from '../services/chatService'

const SecondarySidebar = ({ activeView, isOpen, setActiveView, onApplyFilter, refreshTrigger }) => {
	const navigate = useNavigate()
	const location = useLocation()
	const { user } = useAuth()
	const [files, setFiles] = useState([])
	const [fileTypes, setFileTypes] = useState([])
	const [fileTags, setFileTags] = useState([])
	const [isLoading, setIsLoading] = useState(false)
	const [prompts, setPrompts] = useState([])
	const [promptsLoading, setPromptsLoading] = useState(false)
	const [promptsError, setPromptsError] = useState(null)
	const [assistants, setAssistants] = useState([])
	const [assistantsLoading, setAssistantsLoading] = useState(false)
	const [assistantsError, setAssistantsError] = useState(null)
	const [chats, setChats] = useState([])
	const [chatsLoading, setChatsLoading] = useState(false)
	const [chatsError, setChatsError] = useState(null)
	const [activeChatId, setActiveChatId] = useState(null)
	const [chatTimers, setChatTimers] = useState({})
	const timerIntervalRef = useRef(null)

	// Extract chat ID from URL path
	useEffect(() => {
		const pathParts = location.pathname.split('/')
		if (pathParts.length >= 3 && pathParts[1] === 'chat') {
			const chatIdFromUrl = pathParts[2]
			if (chatIdFromUrl !== 'new' && chatIdFromUrl !== 'problem-solving' && chatIdFromUrl !== 'infinite') {
				setActiveChatId(chatIdFromUrl)
			} else if (pathParts.length >= 4 && pathParts[2] === 'problem-solving') {
				// Handle problem-solving/:chatId path
				setActiveChatId(pathParts[3])
			} else {
				// Clear active chat when on paths like /chat, /chat/new, etc.
				setActiveChatId(null)
			}
		} else {
			// Clear active chat when not on a chat-related path
			setActiveChatId(null)
		}
	}, [location.pathname])

	// Fetch files when the sidebar is opened and activeView is 'files'
	useEffect(() => {
		if (isOpen && activeView === 'files' && user) {
			fetchFiles()
		}
	}, [isOpen, activeView, user])

	// Fetch prompts when the sidebar is opened and activeView is 'prompts'
	useEffect(() => {
		if (isOpen && activeView === 'prompts' && user) {
			fetchPrompts()
		}
	}, [isOpen, activeView, user])

	// Fetch assistants when the sidebar is opened and activeView is 'assistants'
	useEffect(() => {
		if (isOpen && activeView === 'assistants' && user) {
			fetchAssistants()
		}
	}, [isOpen, activeView, user])

	// Fetch chat history when activeView is 'chat'
	useEffect(() => {
		if (isOpen && activeView === 'chat' && user) {
			fetchChats()
		}
	}, [isOpen, activeView, user])

	// Refetch chats when URL changes for chat routes
	useEffect(() => {
		// Only refetch if we're on a chat-related page
		if (location.pathname.startsWith('/chat') && user) {
			fetchChats()
		}
	}, [location.pathname, user])

	// Refresh chats when refreshTrigger changes
	useEffect(() => {
		if (refreshTrigger && user && activeView === 'chat') {
			fetchChats()
		}
	}, [refreshTrigger, user, activeView])

	// Initialize timers for infinite chats
	useEffect(() => {
		// Find all infinite chats and set up timers
		const infiniteChats = {}
		chats.forEach(chat => {
			if (chat.type === 'infinite') {
				infiniteChats[chat.id] = chat.duration || 0
			}
		})

		// Set initial timers
		setChatTimers(infiniteChats)

		// Start the timer interval if there are infinite chats
		if (Object.keys(infiniteChats).length > 0) {
			// Clear any existing interval
			if (timerIntervalRef.current) {
				clearInterval(timerIntervalRef.current)
			}

			// Set up new interval to increment all infinite chat timers every second
			timerIntervalRef.current = setInterval(() => {
				setChatTimers(prevTimers => {
					const newTimers = { ...prevTimers }
					Object.keys(newTimers).forEach(chatId => {
						newTimers[chatId] += 1
					})
					return newTimers
				})
			}, 1000)
		}

		// Cleanup interval on unmount
		return () => {
			if (timerIntervalRef.current) {
				clearInterval(timerIntervalRef.current)
			}
		}
	}, [chats])

	// Fetch files from the API
	const fetchFiles = async () => {
		setIsLoading(true)
		try {
			const response = await fileService.getUserFiles()
			if (response.success) {
				setFiles(response.data)
				extractFileTypes(response.data)
				extractFileTags(response.data)
			}
		} catch (error) {
			console.error('Error fetching files:', error)
		} finally {
			setIsLoading(false)
		}
	}

	// Fetch prompts from the API
	const fetchPrompts = async () => {
		if (!user) return

		setPromptsLoading(true)
		setPromptsError(null)

		try {
			const promptsData = await userService.getUserSystemPrompts(user._id)
			setPrompts(promptsData)
		} catch (error) {
			console.error('Error fetching system prompts:', error)
			setPromptsError('Failed to load system prompts')
		} finally {
			setPromptsLoading(false)
		}
	}

	// Fetch assistants from the API
	const fetchAssistants = async () => {
		if (!user) return

		setAssistantsLoading(true)
		setAssistantsError(null)

		try {
			const assistantsData = await userService.getUserAssistants(user._id)
			setAssistants(assistantsData)
		} catch (error) {
			console.error('Error fetching assistants:', error)
			setAssistantsError('Failed to load assistants')
		} finally {
			setAssistantsLoading(false)
		}
	}

	// Fetch chat history from API
	const fetchChats = async () => {
		setChatsLoading(true)
		setChatsError(null)
		try {
			const chatsData = await chatService.getUserChats()
			setChats(chatsData)
		} catch (error) {
			console.error('Failed to fetch chats:', error)
			setChatsError('Failed to load chat history. Please try again later.')
		} finally {
			setChatsLoading(false)
		}
	}

	// Extract unique file types from the files
	const extractFileTypes = filesData => {
		const typesSet = new Set()
		filesData.forEach(file => typesSet.add(file.type))
		setFileTypes(Array.from(typesSet))
	}

	// Extract all unique tags from the files
	const extractFileTags = filesData => {
		const tagsSet = new Set()
		filesData.forEach(file => {
			if (file.tags && file.tags.length > 0) {
				file.tags.forEach(tag => tagsSet.add(tag))
			}
		})
		setFileTags(Array.from(tagsSet))
	}

	// Handle navigation to a different view
	const navigateTo = view => {
		setActiveView(view)
	}

	// Handle new chat creation
	const handleNewChat = async () => {
		try {
			// Create a new chat in the database
			const newChat = await chatService.createChat({
				title: 'Nowa rozmowa',
				model: 'gpt-4o', // Default model
				chatType: 'normal',
			})

			// Navigate to the new chat
			navigate(`/chat/${newChat._id}`)
		} catch (error) {
			console.error('Failed to create new chat:', error)
			alert('Nie udało się utworzyć nowego czatu. Spróbuj ponownie później.')
		}
	}

	// Handle navigate to settings
	const handleNavigateToSettings = () => {
		navigateTo('settings')
	}

	// Handle opening a specific chat
	const handleOpenChat = chatId => {
		// Find the chat to determine its type
		const selectedChat = chats.find(chat => chat.id === chatId)

		if (selectedChat) {
			if (selectedChat.type === 'infinite') {
				// Navigate to the specific route for infinite chats
				navigate(`/chat/infinite/${chatId}`)
			} else if (selectedChat.type === 'problem-solving') {
				// For problem-solving chats, navigate to the ChatGrid view
				navigate(`/chat/problem-solving/${chatId}`)
			} else {
				// For regular chats, navigate to the ChatDetail view
				navigate(`/chat/${chatId}`)
			}
		} else {
			console.error('Selected chat not found in the list.')
			// Optionally navigate to a default or error page
			navigate('/chat')
		}
	}

	// Handle filter selection
	const handleFilterSelect = (filterType, value) => {
		console.log(`Filter applied: ${filterType} - ${value}`)
		if (onApplyFilter) {
			onApplyFilter(filterType, value)
		}
	}

	// Format date for display
	const formatDate = dateString => {
		const date = new Date(dateString)
		const now = new Date()
		const diffTime = Math.abs(now - date)
		const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

		if (diffDays === 0) {
			const diffHours = Math.floor(diffTime / (1000 * 60 * 60))
			if (diffHours === 0) {
				const diffMinutes = Math.floor(diffTime / (1000 * 60))
				if (diffMinutes === 0) {
					return 'Przed chwilą'
				}
				return `${diffMinutes}m temu`
			}
			return `${diffHours}h temu`
		} else if (diffDays === 1) {
			return 'Wczoraj'
		} else if (diffDays < 7) {
			return `${diffDays} dni temu`
		} else if (diffDays < 30) {
			return `${Math.floor(diffDays / 7)} tyg. temu`
		} else {
			return date.toLocaleDateString('pl-PL')
		}
	}

	// Get prompt categories from the actual prompts
	const getPromptCategories = () => {
		const categories = new Set(prompts.map(prompt => prompt.category))
		return Array.from(categories)
	}

	// Get assistant categories from the actual assistants
	const getAssistantCategories = () => {
		const categories = new Set(assistants.map(assistant => assistant.category).filter(Boolean))
		return Array.from(categories)
	}

	// Format duration for infinite chats
	const formatDuration = seconds => {
		if (!seconds) return '00:00'
		const minutes = Math.floor(seconds / 60)
		const remainingSeconds = seconds % 60
		return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
	}

	// Handle edit chat
	const handleEditChat = async (e, chatId) => {
		e.stopPropagation()
		// You can implement chat editing functionality here
		// For example, showing a modal to edit the chat title
		console.log('Edit chat:', chatId)
	}

	// Handle delete chat
	const handleDeleteChat = async (e, chatId) => {
		e.stopPropagation()
		if (
			window.confirm(
				'Czy na pewno chcesz usunąć ten czat? Ta operacja jest nieodwracalna i spowoduje usunięcie całej historii rozmowy.'
			)
		) {
			try {
				await chatService.deleteChat(chatId)
				// Refresh the chat list
				fetchChats()
			} catch (error) {
				console.error('Failed to delete chat:', error)
				alert('Nie udało się usunąć czatu. Spróbuj ponownie później.')
			}
		}
	}

	// Render different content based on the active view
	const renderContent = () => {
		switch (activeView) {
			case 'chat':
				return (
					<div className="secondary-content">
						<div className="secondary-header">
							<h2>Czaty</h2>
						</div>

						<div className="chat-list">
							{chatsLoading ? (
								<div className="loading-state">
									<div className="loading-spinner"></div>
									<p>Ładowanie czatów...</p>
								</div>
							) : chatsError ? (
								<div className="error-state">
									<AlertCircle size={18} />
									<p>{chatsError}</p>
								</div>
							) : chats.length === 0 ? (
								<div className="empty-state">
									<p>Brak czatów. Rozpocznij nową rozmowę!</p>
									<button className="start-chat-button" onClick={handleNewChat}>
										<MessageSquare size={16} />
										<span>Nowy czat</span>
									</button>
								</div>
							) : (
								chats.map(chat => (
									<div
										key={chat.id}
										className={`chat-item ${chat.id === activeChatId ? 'active' : ''} chat-type-${chat.type}`}
										onClick={() => handleOpenChat(chat.id)}>
										<div className="chat-icon">
											{chat.type === 'normal' && <MessageSquare size={16} strokeWidth={1.5} />}
											{chat.type === 'problem-solving' && <Brain size={16} strokeWidth={1.5} />}
											{chat.type === 'infinite' && <RefreshCw size={16} strokeWidth={1.5} />}
											{chat.type === 'marzenie-wstecz' && <Star size={16} strokeWidth={1.5} />}
										</div>
										<div className="chat-details">
											<div className="chat-title">{chat.title}</div>
											<div className="chat-meta">
												{chat.type === 'infinite' ? (
													<>
														<Clock size={12} strokeWidth={1.5} />
														<span className="chat-duration">
															{formatDuration(chatTimers[chat.id] !== undefined ? chatTimers[chat.id] : chat.duration)}
														</span>
													</>
												) : (
													<>
														<Clock size={12} strokeWidth={1.5} />
														<span>{formatDate(chat.lastActive)}</span>
													</>
												)}
												{chat.type !== 'normal' && (
													<span className={`chat-type-badge chat-type-${chat.type}`}>
														{chat.type === 'problem-solving'
															? 'Problem'
															: chat.type === 'marzenie-wstecz'
															? 'Marzenie wstecz'
															: 'Nieskończony'}
													</span>
												)}
											</div>
										</div>
										<div className="chat-actions" onClick={e => e.stopPropagation()}>
											<button
												className="icon-button edit-button"
												aria-label="Edytuj czat"
												onClick={e => handleEditChat(e, chat.id)}>
												<Edit size={14} strokeWidth={1.5} />
											</button>
											<button
												className="icon-button delete-button"
												aria-label="Usuń czat"
												onClick={e => handleDeleteChat(e, chat.id)}>
												<Trash2 size={14} strokeWidth={1.5} />
											</button>
										</div>
									</div>
								))
							)}
						</div>
					</div>
				)

			case 'profile':
				return (
					<div className="secondary-content profile-sidebar-content">
						<div className="secondary-header">
							<h2>Mój profil</h2>
						</div>
						<div className="profile-sidebar-sections">
							<div
								className="profile-sidebar-section active"
								onClick={() => handleFilterSelect('profileSection', 'personal')}>
								<div className="profile-sidebar-icon">
									<User size={18} strokeWidth={1.5} />
								</div>
								<div className="profile-sidebar-details">
									<div className="profile-sidebar-title">Informacje osobiste</div>
									<div className="profile-sidebar-description">Edytuj swoje informacje profilowe</div>
								</div>
							</div>
						</div>
					</div>
				)

			case 'context':
				return (
					<div className="secondary-content">
						<div className="secondary-header">
							<h2>Kontekst</h2>
							<div className="secondary-actions">
								<button className="action-button" aria-label="Opcje kontekstu">
									<Brain size={16} strokeWidth={1.5} />
								</button>
							</div>
						</div>
						<div className="filter-list">
							{contextCategories.map(category => (
								<div key={category.id} className="filter-section">
									<div className="filter-section-title">{category.title}</div>
									<div className="filter-options">
										{category.items.map(item => (
											<div
												key={item.id}
												className={`filter-option ${item.active ? 'active' : ''}`}
												onClick={() => handleFilterSelect('section', item.id)}>
												{item.icon}
												<span>{item.label}</span>
											</div>
										))}
									</div>
								</div>
							))}
						</div>
					</div>
				)

			case 'assistants':
				return (
					<div className="secondary-content">
						<div className="secondary-header">
							<h2>Asystenci AI</h2>
							<div className="secondary-actions">
								<button className="action-button" aria-label="Szukaj asystentów">
									<Search size={16} strokeWidth={1.5} />
								</button>
								<button
									className="action-button"
									aria-label="Dodaj nowego asystenta"
									onClick={() => navigate('/assistants', { state: { openCreateModal: true } })}>
									<PlusCircle size={16} strokeWidth={1.5} />
								</button>
							</div>
						</div>
						{assistantsLoading ? (
							<div className="filter-list">
								<div className="filter-section">
									<div className="filter-section-title">Ładowanie...</div>
								</div>
							</div>
						) : assistantsError ? (
							<div className="filter-list">
								<div className="filter-section">
									<div className="filter-section-title">
										<AlertCircle size={16} strokeWidth={1.5} />
										<span>Błąd ładowania asystentów</span>
									</div>
								</div>
							</div>
						) : (
							<div className="filter-list">
								<div className="filter-section">
									<div className="filter-section-title">Kategorie</div>
									<div className="filter-options">
										<div className="filter-option active" onClick={() => handleFilterSelect('category', 'all')}>
											<UserCircle size={14} strokeWidth={1.5} />
											<span>Wszyscy Asystenci</span>
										</div>
										{getAssistantCategories().map(category => (
											<div
												key={category}
												className="filter-option"
												onClick={() => handleFilterSelect('category', category)}>
												{category === 'Nauka' ? (
													<Beaker size={14} strokeWidth={1.5} />
												) : category === 'Historia' ? (
													<BookOpen size={14} strokeWidth={1.5} />
												) : category === 'Sztuka' ? (
													<Palette size={14} strokeWidth={1.5} />
												) : category === 'Technologia' ? (
													<Laptop size={14} strokeWidth={1.5} />
												) : category === 'Biznes' ? (
													<Briefcase size={14} strokeWidth={1.5} />
												) : (
													<UserCircle size={14} strokeWidth={1.5} />
												)}
												<span>{category}</span>
											</div>
										))}
									</div>
								</div>
								<div className="filter-section">
									<div className="filter-section-title">Twórca</div>
									<div className="filter-options">
										<div className="filter-option" onClick={() => handleFilterSelect('creator', 'system')}>
											<Shield size={14} strokeWidth={1.5} />
											<span>Asystenci Systemowi</span>
										</div>
										<div className="filter-option" onClick={() => handleFilterSelect('creator', 'user')}>
											<User size={14} strokeWidth={1.5} />
											<span>Własni Asystenci</span>
										</div>
									</div>
								</div>
								{assistants.length > 0 && (
									<div className="filter-section">
										<div className="filter-section-title">Ostatnio używani</div>
										<div className="chat-list">
											{assistants
												.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
												.slice(0, 5)
												.map(assistant => (
													<div
														key={assistant._id}
														className="chat-item"
														onClick={() => handleFilterSelect('assistantId', assistant._id)}>
														<div className="chat-icon">
															<UserCircle size={16} strokeWidth={1.5} />
														</div>
														<div className="chat-details">
															<div className="chat-title">{assistant.name}</div>
															<div className="chat-meta">
																{assistant.category && (
																	<span className="chat-type-badge chat-type-normal">{assistant.category}</span>
																)}
															</div>
														</div>
														<div className="chat-actions" onClick={e => e.stopPropagation()}>
															<button
																className="icon-button edit-button"
																aria-label="Edytuj asystenta"
																onClick={e => {
																	e.stopPropagation()
																	handleFilterSelect('assistantId', assistant._id, 'edit')
																	navigate('/assistants', { state: { editAssistantId: assistant._id } })
																}}>
																<Edit size={14} strokeWidth={1.5} />
															</button>
															<button
																className="icon-button delete-button"
																aria-label="Usuń asystenta"
																onClick={e => {
																	e.stopPropagation()
																	navigate('/assistants', { state: { deleteAssistantId: assistant._id } })
																}}>
																<Trash2 size={14} strokeWidth={1.5} />
															</button>
														</div>
													</div>
												))}
										</div>
									</div>
								)}
							</div>
						)}
					</div>
				)

			case 'prompts':
				return (
					<div className="secondary-content">
						<div className="secondary-header">
							<h2>Bilbioteka promptów</h2>
							<div className="secondary-actions">
								<button className="action-button" aria-label="Szukaj podpowiedzi">
									<Search size={16} strokeWidth={1.5} />
								</button>
								<button
									className="action-button"
									aria-label="Dodaj nową podpowiedź"
									onClick={() => navigate('/system-prompts', { state: { openCreateModal: true } })}>
									<PlusCircle size={16} strokeWidth={1.5} />
								</button>
							</div>
						</div>
						{promptsLoading ? (
							<div className="filter-list">
								<div className="filter-section">
									<div className="filter-section-title">Ładowanie...</div>
								</div>
							</div>
						) : promptsError ? (
							<div className="filter-list">
								<div className="filter-section">
									<div className="filter-section-title">
										<AlertCircle size={16} strokeWidth={1.5} />
										<span>Błąd ładowania promptów</span>
									</div>
								</div>
							</div>
						) : (
							<div className="filter-list">
								<div className="filter-section">
									<div className="filter-section-title">Kategorie</div>
									<div className="filter-options">
										<div className="filter-option active" onClick={() => handleFilterSelect('category', 'all')}>
											<FileCode size={14} strokeWidth={1.5} />
											<span>Wszystkie Podpowiedzi</span>
										</div>
										{getPromptCategories().map(category => (
											<div
												key={category}
												className="filter-option"
												onClick={() => handleFilterSelect('category', category)}>
												{category === 'Development' || category === 'Programowanie' ? (
													<Code size={14} strokeWidth={1.5} />
												) : category === 'Technical' || category === 'Techniczne' ? (
													<Terminal size={14} strokeWidth={1.5} />
												) : category === 'Creative' || category === 'Kreatywne' ? (
													<Pencil size={14} strokeWidth={1.5} />
												) : category === 'Business' || category === 'Biznesowe' ? (
													<Briefcase size={14} strokeWidth={1.5} />
												) : category === 'Personal' || category === 'Osobiste' || category === 'Rozwój Osobisty' ? (
													<User size={14} strokeWidth={1.5} />
												) : (
													<FileCode size={14} strokeWidth={1.5} />
												)}
												<span>{category}</span>
											</div>
										))}
									</div>
								</div>
								<div className="filter-section">
									<div className="filter-section-title">Sortuj według</div>
									<div className="filter-options">
										<div className="filter-option" onClick={() => handleFilterSelect('sort', 'favorite')}>
											<Star size={14} strokeWidth={1.5} />
											<span>Ulubione</span>
										</div>
										<div className="filter-option" onClick={() => handleFilterSelect('sort', 'recent')}>
											<Clock size={14} strokeWidth={1.5} />
											<span>Ostatnio aktualizowane</span>
										</div>
										<div className="filter-option" onClick={() => handleFilterSelect('sort', 'alphabetical')}>
											<FileText size={14} strokeWidth={1.5} />
											<span>Alfabetycznie</span>
										</div>
									</div>
								</div>
								{prompts.length > 0 && (
									<div className="filter-section">
										<div className="filter-section-title">Ostatnie podpowiedzi</div>
										<div className="chat-list">
											{prompts
												.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
												.slice(0, 5)
												.map(prompt => (
													<div
														key={prompt._id}
														className="chat-item"
														onClick={() => handleFilterSelect('promptId', prompt._id)}>
														<div className="chat-icon">
															<FileCode size={16} strokeWidth={1.5} />
														</div>
														<div className="chat-details">
															<div className="chat-title">{prompt.title}</div>
															<div className="chat-meta">
																<Clock size={12} strokeWidth={1.5} />
																<span>{formatDate(prompt.updatedAt)}</span>
															</div>
														</div>
														<div className="chat-actions" onClick={e => e.stopPropagation()}>
															<button
																className="icon-button edit-button"
																aria-label="Edytuj podpowiedź"
																onClick={e => {
																	e.stopPropagation()
																	handleFilterSelect('promptId', prompt._id, 'edit')
																	navigate('/system-prompts', { state: { editPromptId: prompt._id } })
																}}>
																<Edit size={14} strokeWidth={1.5} />
															</button>
															<button
																className="icon-button delete-button"
																aria-label="Usuń podpowiedź"
																onClick={e => {
																	e.stopPropagation()
																	navigate('/system-prompts', { state: { deletePromptId: prompt._id } })
																}}>
																<Trash2 size={14} strokeWidth={1.5} />
															</button>
														</div>
													</div>
												))}
										</div>
									</div>
								)}
							</div>
						)}
					</div>
				)

			case 'community':
				return (
					<div className="secondary-content">
						<div className="secondary-header">
							<h2>Społeczność</h2>
							<div className="secondary-actions">
								<button className="action-button" aria-label="Szukaj w społeczności">
									<Search size={16} strokeWidth={1.5} />
								</button>
								<button className="action-button" aria-label="Odśwież">
									<RefreshCw size={16} strokeWidth={1.5} />
								</button>
							</div>
						</div>
						<div className="filter-list">
							<div className="filter-section">
								<div className="filter-section-title">Przeglądaj</div>
								<div className="filter-options">
									<div className="filter-option active" onClick={() => handleFilterSelect('browse', 'popular')}>
										<TrendingUp size={14} strokeWidth={1.5} />
										<span>Popularne</span>
									</div>
									<div className="filter-option" onClick={() => handleFilterSelect('browse', 'recent')}>
										<Clock size={14} strokeWidth={1.5} />
										<span>Najnowsze</span>
									</div>
									<div className="filter-option" onClick={() => handleFilterSelect('browse', 'following')}>
										<Users size={14} strokeWidth={1.5} />
										<span>Obserwowane</span>
									</div>
									<div className="filter-option" onClick={() => handleFilterSelect('browse', 'trending')}>
										<Zap size={14} strokeWidth={1.5} />
										<span>Na czasie</span>
									</div>
									<div className="filter-option" onClick={() => handleFilterSelect('browse', 'mostLiked')}>
										<ThumbsUp size={14} strokeWidth={1.5} />
										<span>Najczęściej lubiane</span>
									</div>
								</div>
							</div>
							<div className="filter-section">
								<div className="filter-section-title">Kategorie</div>
								<div className="filter-options">
									<div className="filter-option" onClick={() => handleFilterSelect('category', 'development')}>
										<Code size={14} strokeWidth={1.5} />
										<span>Programowanie</span>
									</div>
									<div className="filter-option" onClick={() => handleFilterSelect('category', 'ai')}>
										<Cpu size={14} strokeWidth={1.5} />
										<span>AI i Data Science</span>
									</div>
									<div className="filter-option" onClick={() => handleFilterSelect('category', 'creative')}>
										<Palette size={14} strokeWidth={1.5} />
										<span>Kreatywne</span>
									</div>
									<div className="filter-option" onClick={() => handleFilterSelect('category', 'business')}>
										<Briefcase size={14} strokeWidth={1.5} />
										<span>Biznes</span>
									</div>
									<div className="filter-option" onClick={() => handleFilterSelect('category', 'education')}>
										<Award size={14} strokeWidth={1.5} />
										<span>Edukacja</span>
									</div>
								</div>
							</div>
							<div className="filter-section">
								<div className="filter-section-title">Technologia AI</div>
								<div className="filter-options">
									<div className="filter-option" onClick={() => handleFilterSelect('technology', 'llm')}>
										<Brain size={14} strokeWidth={1.5} />
										<span>Modele językowe</span>
									</div>
									<div className="filter-option" onClick={() => handleFilterSelect('technology', 'vision')}>
										<Image size={14} strokeWidth={1.5} />
										<span>Widzenie komputerowe</span>
									</div>
									<div className="filter-option" onClick={() => handleFilterSelect('technology', 'multimodal')}>
										<FileCode size={14} strokeWidth={1.5} />
										<span>AI multimodalne</span>
									</div>
									<div className="filter-option" onClick={() => handleFilterSelect('technology', 'agents')}>
										<User size={14} strokeWidth={1.5} />
										<span>Agenci AI</span>
									</div>
								</div>
							</div>
							<div className="filter-section">
								<div className="filter-section-title">Typ zasobu</div>
								<div className="filter-options">
									<div className="filter-option" onClick={() => handleFilterSelect('type', 'prompts')}>
										<FileCode size={14} strokeWidth={1.5} />
										<span>Podpowiedzi</span>
									</div>
									<div className="filter-option" onClick={() => handleFilterSelect('type', 'assistants')}>
										<User size={14} strokeWidth={1.5} />
										<span>Asystenci</span>
									</div>
									<div className="filter-option" onClick={() => handleFilterSelect('type', 'discussions')}>
										<MessageSquare size={14} strokeWidth={1.5} />
										<span>Dyskusje</span>
									</div>
									<div className="filter-option" onClick={() => handleFilterSelect('type', 'tutorials')}>
										<BookOpen size={14} strokeWidth={1.5} />
										<span>Poradniki</span>
									</div>
									<div className="filter-option" onClick={() => handleFilterSelect('type', 'casestudies')}>
										<FileText size={14} strokeWidth={1.5} />
										<span>Studia przypadków</span>
									</div>
								</div>
							</div>
							<div className="filter-section">
								<div className="filter-section-title">Autor</div>
								<div className="filter-options">
									<div className="filter-option" onClick={() => handleFilterSelect('author', 'followed')}>
										<Heart size={14} strokeWidth={1.5} />
										<span>Obserwowani autorzy</span>
									</div>
									<div className="filter-option" onClick={() => handleFilterSelect('author', 'verified')}>
										<CheckCircle size={14} strokeWidth={1.5} />
										<span>Zweryfikowani autorzy</span>
									</div>
									<div className="filter-option" onClick={() => handleFilterSelect('author', 'staff')}>
										<Shield size={14} strokeWidth={1.5} />
										<span>Polecane przez zespół</span>
									</div>
								</div>
							</div>
							<div className="filter-section">
								<div className="filter-section-title">Zaangażowanie</div>
								<div className="filter-options">
									<div className="filter-option" onClick={() => handleFilterSelect('engagement', 'saved')}>
										<Bookmark size={14} strokeWidth={1.5} />
										<span>Zapisane posty</span>
									</div>
									<div className="filter-option" onClick={() => handleFilterSelect('engagement', 'commented')}>
										<MessageCircle size={14} strokeWidth={1.5} />
										<span>Najczęściej komentowane</span>
									</div>
									<div className="filter-option" onClick={() => handleFilterSelect('engagement', 'trending')}>
										<Zap size={14} strokeWidth={1.5} />
										<span>Popularne dzisiaj</span>
									</div>
								</div>
							</div>
						</div>
					</div>
				)

			case 'files':
				return (
					<div className="secondary-content">
						<div className="secondary-header">
							<h2>Pliki</h2>
							<div className="secondary-actions">
								<button className="action-button" aria-label="Szukaj plików">
									<Search size={16} strokeWidth={1.5} />
								</button>
								<button className="action-button" aria-label="Wgraj nowy plik">
									<PlusCircle size={16} strokeWidth={1.5} />
								</button>
							</div>
						</div>
						{isLoading ? (
							<div className="filter-list">
								<div className="filter-section">
									<div className="filter-section-title">Ładowanie...</div>
								</div>
							</div>
						) : (
							<div className="filter-list">
								<div className="filter-section">
									<div className="filter-section-title">Typy plików</div>
									<div className="filter-options">
										<div className="filter-option active" onClick={() => handleFilterSelect('type', 'all')}>
											<File size={14} strokeWidth={1.5} />
											<span>Wszystkie pliki</span>
										</div>
										{fileTypes.map(type => (
											<div key={type} className="filter-option" onClick={() => handleFilterSelect('type', type)}>
												{type === 'pdf' || type === 'docx' || type === 'txt' ? (
													<FileText size={14} strokeWidth={1.5} />
												) : type === 'png' || type === 'jpg' || type === 'jpeg' ? (
													<Image size={14} strokeWidth={1.5} />
												) : (
													<File size={14} strokeWidth={1.5} />
												)}
												<span>{type.toUpperCase()}</span>
											</div>
										))}
									</div>
								</div>
								{fileTags.length > 0 && (
									<div className="filter-section">
										<div className="filter-section-title">Tagi</div>
										<div className="filter-options">
											{fileTags.map(tag => (
												<div key={tag} className="filter-option" onClick={() => handleFilterSelect('tag', tag)}>
													<Tag size={14} strokeWidth={1.5} />
													<span>{tag}</span>
												</div>
											))}
										</div>
									</div>
								)}
								{files.length > 0 && (
									<div className="filter-section">
										<div className="filter-section-title">Ostatnie pliki</div>
										<div className="filter-options">
											{files.slice(0, 5).map(file => (
												<div
													key={file._id}
													className="filter-option"
													onClick={() => handleFilterSelect('file', file.name)}>
													{file.type === 'pdf' || file.type === 'docx' || file.type === 'txt' ? (
														<FileText size={14} strokeWidth={1.5} />
													) : file.type === 'png' || file.type === 'jpg' || file.type === 'jpeg' ? (
														<Image size={14} strokeWidth={1.5} />
													) : (
														<File size={14} strokeWidth={1.5} />
													)}
													<span>{file.name}</span>
												</div>
											))}
										</div>
									</div>
								)}
							</div>
						)}
					</div>
				)

			case 'search':
				return (
					<div className="secondary-content">
						<div className="secondary-header">
							<h2>Filtry</h2>
							<div className="secondary-actions">
								<button className="action-button" aria-label="Opcje filtrów">
									<Filter size={16} strokeWidth={1.5} />
								</button>
							</div>
						</div>
						<div className="filter-list">
							<div className="filter-section">
								<div className="filter-section-title">Typ</div>
								<div className="filter-options">
									<div className="filter-option active">
										<MessageSquare size={14} strokeWidth={1.5} />
										<span>Wszystkie czaty</span>
									</div>
									<div className="filter-option">
										<Star size={14} strokeWidth={1.5} />
										<span>Ulubione</span>
									</div>
									<div className="filter-option">
										<BookOpen size={14} strokeWidth={1.5} />
										<span>Zapisane</span>
									</div>
								</div>
							</div>
							<div className="filter-section">
								<div className="filter-section-title">Czas</div>
								<div className="filter-options">
									<div className="filter-option">
										<History size={14} strokeWidth={1.5} />
										<span>Ostatnie 24 godziny</span>
									</div>
									<div className="filter-option">
										<History size={14} strokeWidth={1.5} />
										<span>Ostatnie 7 dni</span>
									</div>
									<div className="filter-option">
										<History size={14} strokeWidth={1.5} />
										<span>Ostatnie 30 dni</span>
									</div>
								</div>
							</div>
						</div>
					</div>
				)

			case 'settings':
				return (
					<div className="secondary-content">
						<div className="secondary-header">
							<h2>Menu Ustawień</h2>
						</div>
						<div className="settings-sidebar-list">
							{settingsItems.map(item => (
								<div
									key={item.id}
									className={`settings-sidebar-item ${item.active ? 'active' : ''}`}
									onClick={() => handleFilterSelect('section', item.id)}>
									<div className="settings-sidebar-icon">{item.icon}</div>
									<div className="settings-sidebar-details">
										<div className="settings-sidebar-title">{item.title}</div>
										<div className="settings-sidebar-description">{item.description}</div>
									</div>
								</div>
							))}
						</div>
					</div>
				)

			default:
				return (
					<div className="secondary-content empty">
						<div className="empty-message">Wybierz opcję</div>
					</div>
				)
		}
	}

	// Mock data for context categories
	const contextCategories = [
		{
			id: 'personal',
			title: 'Informacje osobiste',
			items: [
				{
					id: 'general_info',
					label: 'Ogólne informacje',
					icon: <User size={14} strokeWidth={1.5} />,
					active: true,
				},
				{
					id: 'important_info',
					label: 'Ważne informacje',
					icon: <AlertCircle size={14} strokeWidth={1.5} />,
					active: false,
				},
			],
		},
		{
			id: 'business',
			title: 'Projekty & Biznes',
			items: [
				{
					id: 'projects_business',
					label: 'Projekty & Biznes',
					icon: <Briefcase size={14} strokeWidth={1.5} />,
					active: false,
				},
			],
		},
		{
			id: 'traits',
			title: 'Cechy & Umiejętności',
			items: [
				{
					id: 'strengths',
					label: 'Mocne strony',
					icon: <Award size={14} strokeWidth={1.5} />,
					active: false,
				},
				{
					id: 'weaknesses',
					label: 'Słabe strony',
					icon: <Target size={14} strokeWidth={1.5} />,
					active: false,
				},
			],
		},
		{
			id: 'goals',
			title: 'Cele',
			items: [
				{
					id: 'short_term',
					label: 'Krótkoterminowe',
					icon: <Clock size={14} strokeWidth={1.5} />,
					active: false,
				},
				{
					id: 'long_term',
					label: 'Długoterminowe',
					icon: <Calendar size={14} strokeWidth={1.5} />,
					active: false,
				},
			],
		},
	]

	// Settings items with icons
	const settingsItems = [
		{
			id: 'profile',
			title: 'Profil',
			description: 'Dostosuj informacje profilowe',
			icon: <User size={18} strokeWidth={1.5} />,
			active: true,
		},
		{
			id: 'integrations',
			title: 'Integracje',
			description: 'Konfiguruj webhooki i API',
			icon: <Link size={18} strokeWidth={1.5} />,
		},
		{
			id: 'models',
			title: 'Modele językowe',
			description: 'Wybierz, które modele AI są widoczne',
			icon: <Cpu size={18} strokeWidth={1.5} />,
		},
		{
			id: 'contact',
			title: 'Kontakt i informacje prawne',
			description: 'Prywatność, warunki i wsparcie',
			icon: <MessageSquare size={18} strokeWidth={1.5} />,
		},
	]

	return <div className={`secondary-sidebar ${isOpen ? 'open' : ''}`}>{renderContent()}</div>
}

export default SecondarySidebar

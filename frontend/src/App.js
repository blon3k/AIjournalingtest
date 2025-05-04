import './App.css'
import { useState, useEffect, useRef } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import Chat from './Pages/Chat/Chat'
import ChatDetail from './Pages/Chat/ChatDetails/ChatDetail'
import ChatGrid from './Pages/Chat/ChatGrid/ChatGrid'
import ChatInfinite from './Pages/Chat/ChatInfinite/ChatInfinite'
import Sidebar from './components/Sidebar'
import SecondarySidebar from './components/SecondarySidebar'
import Settings from './Pages/Settings/Settings'
import Profile from './Pages/Profile/Profile'
import Context from './Pages/Context/Context'
import Assistants from './Pages/Assistants/Assistants'
import SystemPrompts from './Pages/SystemPrompts/SystemPrompts'
import Community from './Pages/Community/Community'
import Login from './Pages/Auth/Login/Login'
import Signup from './Pages/Auth/Register/Signup'
import { AlertTriangle, Menu, X } from 'lucide-react'
import { SettingsProvider } from './context/SettingsContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import Files from './Pages/Files/Files'
import chatService from './services/chatService'

// Main App wrapper with Router and Providers
function App() {
	return (
		<Router>
			<AuthProvider>
				<SettingsProvider>
					<AppContent />
				</SettingsProvider>
			</AuthProvider>
		</Router>
	)
}

// Protected route component
const ProtectedRoute = ({ children }) => {
	const { isAuthenticated, loading } = useAuth()
	const location = useLocation()

	// Show loading screen while checking authentication status
	if (loading) {
		return <div className="app-loading">Loading...</div>
	}

	// Redirect to login if not authenticated
	if (!isAuthenticated) {
		return <Navigate to="/login" state={{ from: location }} replace />
	}

	return children
}

// Main App content
function AppContent() {
	const [theme, setTheme] = useState(() => {
		// Get the current document theme (set by the preload script)
		return document.documentElement.getAttribute('data-theme') || 'dark'
	})
	const [sidebarOpen, setSidebarOpen] = useState(true) // Default is open
	const [sidebarExpanded, setSidebarExpanded] = useState(true) // Default expanded with text
	const [secondarySidebarOpen, setSecondarySidebarOpen] = useState(true) // Control secondary sidebar
	const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
	const [showChatGrid, setShowChatGrid] = useState(false)
	const [initialMessage, setInitialMessage] = useState('')
	const [apiError, setApiError] = useState(null)
	const [isBackendConnected, setIsBackendConnected] = useState(true)
	const [sidebarFilter, setSidebarFilter] = useState({ type: null, value: null }) // For sharing filter state
	const [chatMode, setChatMode] = useState('general') // Options: 'general', 'problem-solving', 'infinite'
	const [refreshChatList, setRefreshChatList] = useState(false) // New state to trigger chat list refresh
	const profileDropdownRef = useRef(null)
	const isMobile = useRef(window.innerWidth <= 768)
	const navRef = useRef(null)
	const { user, isAuthenticated, logout } = useAuth()
	const navigate = useNavigate()
	const location = useLocation()

	// Get username or use placeholder
	const userName = user?.name || 'Guest User'
	const userEmail = user?.email || 'guest@example.com'

	// Get active view from URL
	const getActiveViewFromPath = () => {
		const path = location.pathname.split('/')[1] || 'chat'
		return path
	}

	const activeView = getActiveViewFromPath()

	// Check if backend is available on load
	useEffect(() => {
		async function checkBackendConnection() {
			try {
				const response = await fetch(`/api/models`)
				if (!response.ok) throw new Error('Backend connection failed')
				setIsBackendConnected(true)
				setApiError(null)
			} catch (error) {
				console.error('Backend connection error:', error)
				setIsBackendConnected(false)
				setApiError('Could not connect to backend server. Please make sure it is running.')
			}
		}

		checkBackendConnection()
		// Check connection every 30 seconds
		const intervalId = setInterval(checkBackendConnection, 30000)

		return () => clearInterval(intervalId)
	}, [])

	// Get initials from name (maximum 2 characters)
	const getInitials = name => {
		if (!name) return 'UN'
		return name
			.split(' ')
			.map(part => part[0])
			.join('')
			.toUpperCase()
			.substring(0, 2)
	}

	const userInitials = getInitials(userName)

	// Initialize theme state based on the current document theme attribute
	useEffect(() => {
		// No need to set the theme attribute here as it's already set
		// Just make sure our state is in sync with it
		const currentDocTheme = document.documentElement.getAttribute('data-theme')
		if (currentDocTheme && currentDocTheme !== theme) {
			setTheme(currentDocTheme)
		}

		// Get sidebar expanded state from localStorage
		const savedSidebarState = localStorage.getItem('sidebarExpanded')
		if (savedSidebarState !== null) {
			setSidebarExpanded(savedSidebarState === 'true')
		}

		// Get saved chat mode
		const savedChatMode = localStorage.getItem('chatMode')
		if (savedChatMode) {
			setChatMode(savedChatMode)
		}

		// Set initial sidebar state based on screen size
		const initialMobile = window.innerWidth <= 768
		isMobile.current = initialMobile
		setSidebarOpen(!initialMobile) // Sidebar open on desktop by default, closed on mobile

		// Secondary sidebar should be closed by default on mobile
		setSecondarySidebarOpen(!initialMobile)

		if (initialMobile) {
			setSidebarExpanded(false) // On mobile, default to collapsed sidebar
		}

		// Add resize listener
		const handleResize = () => {
			const newIsMobile = window.innerWidth <= 768
			const previousMobile = isMobile.current
			isMobile.current = newIsMobile

			// If transitioning from mobile to desktop, open sidebar
			if (!newIsMobile && previousMobile) {
				setSidebarOpen(true)
				setSecondarySidebarOpen(true)
			}

			// If transitioning from desktop to mobile, close sidebars
			if (newIsMobile && !previousMobile) {
				setSidebarOpen(false)
				setSecondarySidebarOpen(false)
				setSidebarExpanded(false)
			}
		}

		window.addEventListener('resize', handleResize)
		return () => window.removeEventListener('resize', handleResize)
	}, [])

	// Update secondary sidebar visibility when active view changes
	useEffect(() => {
		// Open secondary sidebar when a view is selected (if not on mobile)
		if (!isMobile.current) {
			setSecondarySidebarOpen(true)
		}
	}, [activeView])

	// Trigger sidebar chat list refresh when refreshChatList changes
	useEffect(() => {
		if (refreshChatList) {
			// Reset the flag after triggering refresh
			setRefreshChatList(false)
		}
	}, [refreshChatList])

	// Handle message submission from the original Chat component
	const handleMessageSubmit = async (message, model, mode, shouldNavigate = true) => {
		if (message && message.trim()) {
			setChatMode(mode || 'general') // Set the chat mode
			localStorage.setItem('chatMode', mode || 'general')

			setInitialMessage(message)
			setShowChatGrid(true)
			// Store the selected model in localStorage for persistence
			localStorage.setItem('selectedModel', model)

			// If problem-solving mode, create a new problem-solving chat
			if (mode === 'problem-solving') {
				try {
					// Create a new problem-solving chat via the API endpoint
					const newChat = await chatService.createProblemSolvingChat({
						message: message,
						model: model || 'gpt-4o',
					})

					// Navigate to the problem-solving grid view with chat ID
					navigate(`/chat/problem-solving/${newChat._id}`)

					// Trigger refresh of chat list in sidebar
					setRefreshChatList(true)
				} catch (error) {
					console.error('Error creating problem-solving chat:', error)
					setApiError('Failed to create problem-solving chat. Please try again.')

					// Fallback to query parameter approach
					navigate(`/chat/problem-solving?message=${encodeURIComponent(message)}`)
				}
			} else if (mode === 'infinite') {
				// For infinite mode, navigate directly to the infinite conversation view
				navigate(`/chat/infinite?message=${encodeURIComponent(message)}`)
			} else {
				// Regular chat or marzenie-wstecz mode - handle as a normal chat
				try {
					// Create a new chat
					const newChat = await chatService.createChat({
						model: model || 'gpt-4o',
						chatType: mode === 'marzenie-wstecz' ? 'marzenie-wstecz' : 'normal',
					})

					// Add the initial message to the new chat
					await chatService.addMessage(newChat._id, {
						content: message,
						role: 'user',
					})

					// Navigate immediately to the chat detail page
					if (shouldNavigate) {
						navigate(`/chat/${newChat._id}`)
					}

					// Trigger refresh of chat list in sidebar
					setRefreshChatList(true)
				} catch (error) {
					console.error('Error creating chat:', error)
					setApiError('Failed to create chat. Please try again.')
				}
			}
		}
	}

	// Reset function to go back to the original chat
	const resetToOriginalChat = () => {
		setShowChatGrid(false)
		setInitialMessage('')
		navigate('/chat')
	}

	// Handle clicks outside dropdown to close it
	useEffect(() => {
		function handleClickOutside(event) {
			if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
				setProfileDropdownOpen(false)
			}
		}

		document.addEventListener('mousedown', handleClickOutside)
		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
		}
	}, [])

	// Handle keyboard navigation for sidebar nav items
	useEffect(() => {
		const handleKeyDown = e => {
			if (!navRef.current || !document.activeElement?.parentElement === navRef.current) return

			const navItems = navRef.current.querySelectorAll('.sidebar-nav-item')
			const currentIndex = Array.from(navItems).indexOf(document.activeElement)

			if (currentIndex !== -1) {
				if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
					e.preventDefault()
					const nextIndex = (currentIndex + 1) % navItems.length
					navItems[nextIndex].focus()
				} else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
					e.preventDefault()
					const prevIndex = (currentIndex - 1 + navItems.length) % navItems.length
					navItems[prevIndex].focus()
				}
			}
		}

		document.addEventListener('keydown', handleKeyDown)
		return () => {
			document.removeEventListener('keydown', handleKeyDown)
		}
	}, [])

	const toggleTheme = () => {
		const newTheme = theme === 'light' ? 'dark' : 'light'
		// Update state
		setTheme(newTheme)
		// Update DOM
		document.documentElement.setAttribute('data-theme', newTheme)
		// Save to localStorage
		localStorage.setItem('theme', newTheme)
	}

	const toggleSidebar = () => {
		setSidebarOpen(!sidebarOpen)
	}

	const toggleSidebarExpand = () => {
		const newExpandedState = !sidebarExpanded
		setSidebarExpanded(newExpandedState)
		localStorage.setItem('sidebarExpanded', newExpandedState.toString())
	}

	const closeSidebar = () => {
		if (isMobile.current) {
			setSidebarOpen(false)
		}
	}

	const toggleProfileDropdown = () => {
		setProfileDropdownOpen(!profileDropdownOpen)
	}

	const handleApiErrorDismiss = () => {
		setApiError(null)
	}

	const handleSetActiveView = view => {
		navigate(`/${view}`)
		// Open secondary sidebar when a view is selected (on mobile, close main sidebar)
		if (isMobile.current) {
			setSidebarOpen(false)
			setSecondarySidebarOpen(true)
		}
	}

	// Handle filters from secondary sidebar
	const handleSidebarFilter = (filterType, value) => {
		setSidebarFilter({ type: filterType, value: value })
	}

	// Update the sidebar filter from components
	const updateSidebarFilter = (filterType, value) => {
		handleSidebarFilter(filterType, value)
	}

	// Handle chat mode change
	const handleChatModeChange = mode => {
		setChatMode(mode)
		localStorage.setItem('chatMode', mode)
	}

	// Handle user logout
	const handleLogout = async () => {
		await logout()
		navigate('/login')
	}

	return (
		<div className="app-container">
			{/* Only show sidebar if authenticated */}
			{isAuthenticated && (
				<>
					<Sidebar
						theme={theme}
						activeView={activeView}
						sidebarOpen={sidebarOpen}
						sidebarExpanded={sidebarExpanded}
						profileDropdownOpen={profileDropdownOpen}
						isMobile={isMobile}
						userName={userName}
						userEmail={userEmail}
						userInitials={userInitials}
						userAvatar={user?.avatar}
						navRef={navRef}
						profileDropdownRef={profileDropdownRef}
						setActiveView={handleSetActiveView}
						toggleTheme={toggleTheme}
						toggleSidebarExpand={toggleSidebarExpand}
						closeSidebar={closeSidebar}
						toggleProfileDropdown={toggleProfileDropdown}
						setProfileDropdownOpen={setProfileDropdownOpen}
						onLogout={handleLogout}
					/>

					{/* Secondary Sidebar */}
					<SecondarySidebar
						activeView={activeView}
						isOpen={secondarySidebarOpen && sidebarOpen}
						setActiveView={handleSetActiveView}
						onApplyFilter={handleSidebarFilter}
						refreshTrigger={refreshChatList} // Pass the refresh trigger to SecondarySidebar
					/>

					{/* Mobile sidebar toggle button - always show on mobile */}
					{isMobile.current && (
						<button
							className="mobile-sidebar-toggle"
							onClick={toggleSidebar}
							aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
							aria-expanded={sidebarOpen}>
							<Menu size={20} strokeWidth={1.5} />
						</button>
					)}

					{/* Overlay for mobile sidebar */}
					{isMobile.current && sidebarOpen && (
						<div className="sidebar-overlay active" onClick={closeSidebar} aria-hidden="true"></div>
					)}
				</>
			)}

			<main className={`app-main ${isAuthenticated && secondarySidebarOpen ? 'with-secondary-sidebar' : ''}`}>
				{apiError && isAuthenticated && (
					<div className="api-error-banner">
						<AlertTriangle size={18} />
						<span>{apiError}</span>
						<button onClick={handleApiErrorDismiss} aria-label="Dismiss error">
							<X size={18} />
						</button>
					</div>
				)}

				<Routes>
					{/* Public routes */}
					<Route path="/login" element={<Login />} />
					<Route path="/signup" element={<Signup />} />

					{/* Protected routes - wrapped with ProtectedRoute component */}
					<Route path="/" element={<Navigate to="/chat" replace />} />

					{/* Chat routes */}
					<Route
						path="/chat"
						element={
							<ProtectedRoute>
								<Chat
									onMessageSubmit={handleMessageSubmit}
									onChatModeChange={handleChatModeChange}
									chatMode={chatMode}
								/>
							</ProtectedRoute>
						}
					/>
					<Route
						path="/chat/new"
						element={
							<ProtectedRoute>
								<ChatDetail />
							</ProtectedRoute>
						}
					/>
					<Route
						path="/chat/:chatId"
						element={
							<ProtectedRoute>
								<ChatDetail onChatUpdated={() => setRefreshChatList(true)} />
							</ProtectedRoute>
						}
					/>
					<Route
						path="/chat/problem-solving"
						element={
							<ProtectedRoute>
								<ChatGrid />
							</ProtectedRoute>
						}
					/>
					<Route
						path="/chat/problem-solving/:chatId"
						element={
							<ProtectedRoute>
								<ChatGrid />
							</ProtectedRoute>
						}
					/>
					<Route
						path="/chat/infinite"
						element={
							<ProtectedRoute>
								<ChatInfinite />
							</ProtectedRoute>
						}
					/>
					<Route
						path="/chat/infinite/:chatId"
						element={
							<ProtectedRoute>
								<ChatInfinite />
							</ProtectedRoute>
						}
					/>

					{/* Other protected routes */}
					<Route
						path="/context"
						element={
							<ProtectedRoute>
								<Context sidebarFilter={sidebarFilter} updateSidebarFilter={updateSidebarFilter} />
							</ProtectedRoute>
						}
					/>
					<Route
						path="/assistants"
						element={
							<ProtectedRoute>
								<Assistants sidebarFilter={sidebarFilter} updateSidebarFilter={updateSidebarFilter} />
							</ProtectedRoute>
						}
					/>
					<Route
						path="/prompts"
						element={
							<ProtectedRoute>
								<SystemPrompts sidebarFilter={sidebarFilter} updateSidebarFilter={updateSidebarFilter} />
							</ProtectedRoute>
						}
					/>
					<Route
						path="/community"
						element={
							<ProtectedRoute>
								<Community sidebarFilter={sidebarFilter} updateSidebarFilter={updateSidebarFilter} />
							</ProtectedRoute>
						}
					/>
					<Route
						path="/files"
						element={
							<ProtectedRoute>
								<Files sidebarFilter={sidebarFilter} />
							</ProtectedRoute>
						}
					/>
					<Route
						path="/settings"
						element={
							<ProtectedRoute>
								<Settings sidebarFilter={sidebarFilter} onClose={() => handleSetActiveView('chat')} isOpen={true} />
							</ProtectedRoute>
						}
					/>
					<Route
						path="/profile"
						element={
							<ProtectedRoute>
								<Profile />
							</ProtectedRoute>
						}
					/>

					{/* Fallback route */}
					<Route path="*" element={<Navigate to="/login" replace />} />
				</Routes>
			</main>
		</div>
	)
}

export default App

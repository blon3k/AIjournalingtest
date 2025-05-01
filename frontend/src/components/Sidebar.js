import { useRef, useState, useEffect } from 'react'
import {
	Settings as SettingsIcon,
	MessageSquare,
	X,
	User,
	LogOut,
	Plus,
	Search,
	Brain,
	Users,
	FileText,
	FileCode,
	Globe,
	Sun,
	Moon,
	FolderOpen,
} from 'lucide-react'
import './Sidebar.css'

const Sidebar = ({
	theme,
	activeView,
	isMobile,
	userName,
	userEmail,
	userInitials,
	userAvatar,
	navRef,
	profileDropdownRef,
	setActiveView,
	toggleTheme,
	profileDropdownOpen,
	toggleProfileDropdown,
	setProfileDropdownOpen,
	onLogout,
}) => {
	const [tooltipVisible, setTooltipVisible] = useState(null)
	const [tooltipPosition, setTooltipPosition] = useState({ top: 0 })
	const tooltipRef = useRef(null)
	const [dropdownAnimationClass, setDropdownAnimationClass] = useState('')

	// Handle click on navigation item
	const handleNavClick = view => {
		setActiveView(view)
	}

	// Show tooltip
	const showTooltip = (id, e) => {
		if (e && e.currentTarget) {
			const rect = e.currentTarget.getBoundingClientRect()
			setTooltipPosition({
				top: rect.top + rect.height / 2,
			})
		}
		setTooltipVisible(id)
	}

	// Hide tooltip
	const hideTooltip = () => {
		setTooltipVisible(null)
	}

	// Get tooltip text
	const getTooltipText = id => {
		switch (id) {
			case 'chat':
				return 'Czat'
			case 'context':
				return 'Kontekst'
			case 'assistants':
				return 'Asystenci'
			case 'files':
				return 'Pliki'
			case 'settings':
				return 'Ustawienia'
			case 'prompts':
				return 'Bilbioteka Promptów'
			case 'community':
				return 'Społeczność'
			case 'new':
				return 'Nowy Czat'
			case 'theme':
				return theme === 'dark' ? 'Tryb Jasny' : 'Tryb Ciemny'
			case 'profile':
				return 'Profil'
			default:
				return ''
		}
	}

	// Render tooltip
	const renderTooltip = () => {
		if (!tooltipVisible) return null

		return (
			<div className="nav-tooltip" ref={tooltipRef} style={{ top: `${tooltipPosition.top}px` }}>
				{getTooltipText(tooltipVisible)}
			</div>
		)
	}

	// Handle logout
	const handleLogout = () => {
		setProfileDropdownOpen(false)
		if (onLogout) {
			onLogout()
		}
	}

	// Add dropdown animation
	useEffect(() => {
		if (profileDropdownOpen) {
			setDropdownAnimationClass('dropdown-open')
		} else {
			setDropdownAnimationClass('')
		}
	}, [profileDropdownOpen])

	return (
		<div className="sidebar">
			<nav className="sidebar-nav" ref={navRef} aria-label="Główna nawigacja">
				<button
					className={`sidebar-nav-item ${activeView === 'chat' ? 'active' : ''}`}
					onClick={() => handleNavClick('chat')}
					aria-label="Czat"
					aria-current={activeView === 'chat' ? 'page' : undefined}
					onMouseEnter={e => showTooltip('chat', e)}
					onMouseLeave={hideTooltip}>
					<MessageSquare size={18} strokeWidth={1.5} />
				</button>

				<button
					className={`sidebar-nav-item ${activeView === 'context' ? 'active' : ''}`}
					onClick={() => handleNavClick('context')}
					aria-label="Kontekst"
					aria-current={activeView === 'context' ? 'page' : undefined}
					onMouseEnter={e => showTooltip('context', e)}
					onMouseLeave={hideTooltip}>
					<Brain size={18} strokeWidth={1.5} />
				</button>

				<button
					className={`sidebar-nav-item ${activeView === 'assistants' ? 'active' : ''}`}
					onClick={() => handleNavClick('assistants')}
					aria-label="Asystenci"
					aria-current={activeView === 'assistants' ? 'page' : undefined}
					onMouseEnter={e => showTooltip('assistants', e)}
					onMouseLeave={hideTooltip}>
					<Users size={18} strokeWidth={1.5} />
				</button>

				<button
					className={`sidebar-nav-item ${activeView === 'prompts' ? 'active' : ''}`}
					onClick={() => handleNavClick('prompts')}
					aria-label="Bilbioteka promptów"
					aria-current={activeView === 'prompts' ? 'page' : undefined}
					onMouseEnter={e => showTooltip('prompts', e)}
					onMouseLeave={hideTooltip}>
					<FileCode size={18} strokeWidth={1.5} />
				</button>

				<button
					className={`sidebar-nav-item ${activeView === 'community' ? 'active' : ''}`}
					onClick={() => handleNavClick('community')}
					aria-label="Społeczność"
					aria-current={activeView === 'community' ? 'page' : undefined}
					onMouseEnter={e => showTooltip('community', e)}
					onMouseLeave={hideTooltip}>
					<Globe size={18} strokeWidth={1.5} />
				</button>

				<button
					className={`sidebar-nav-item ${activeView === 'files' ? 'active' : ''}`}
					onClick={() => handleNavClick('files')}
					aria-label="Pliki"
					aria-current={activeView === 'files' ? 'page' : undefined}
					onMouseEnter={e => showTooltip('files', e)}
					onMouseLeave={hideTooltip}>
					<FolderOpen size={18} strokeWidth={1.5} />
				</button>

				<button
					className={`sidebar-nav-item ${activeView === 'settings' ? 'active' : ''}`}
					onClick={() => handleNavClick('settings')}
					aria-label="Ustawienia"
					aria-current={activeView === 'settings' ? 'page' : undefined}
					onMouseEnter={e => showTooltip('settings', e)}
					onMouseLeave={hideTooltip}>
					<SettingsIcon size={18} strokeWidth={1.5} />
				</button>
			</nav>

			<div className="theme-toggle">
				<button
					className="theme-toggle-button"
					onClick={toggleTheme}
					aria-label={theme === 'dark' ? 'Przełącz na tryb jasny' : 'Przełącz na tryb ciemny'}
					onMouseEnter={e => showTooltip('theme', e)}
					onMouseLeave={hideTooltip}>
					{theme === 'dark' ? <Sun size={18} strokeWidth={1.5} /> : <Moon size={18} strokeWidth={1.5} />}
				</button>
			</div>

			<div className="profile-section" ref={profileDropdownRef}>
				<button
					className="profile-button"
					onClick={toggleProfileDropdown}
					aria-label="Profil użytkownika"
					title="Profil użytkownika"
					onMouseEnter={e => showTooltip('profile', e)}
					onMouseLeave={hideTooltip}>
					<div className="profile-avatar" title={userName}>
						{userAvatar ? (
							<img src={userAvatar} alt={userName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
						) : (
							userInitials
						)}
					</div>
				</button>

				{profileDropdownOpen && (
					<div className={`profile-dropdown ${dropdownAnimationClass}`} role="menu">
						<div className="profile-dropdown-header">
							<div className="profile-header-info">
								<div className="profile-avatar-large" title={userName}>
									{userAvatar ? (
										<img
											src={userAvatar}
											alt={userName}
											style={{ width: '100%', height: '100%', objectFit: 'cover' }}
										/>
									) : (
										userInitials
									)}
								</div>
								<div className="profile-info">
									<div className="profile-name-large">{userName}</div>
									<div className="profile-email">{userEmail}</div>
								</div>
							</div>
							<button
								className="close-dropdown-button"
								onClick={() => setProfileDropdownOpen(false)}
								aria-label="Zamknij menu">
								<X size={16} strokeWidth={1.5} />
							</button>
						</div>
						<div className="profile-menu">
							<button
								className={`profile-menu-item ${activeView === 'profile' ? 'selected' : ''}`}
								role="menuitem"
								onClick={() => {
									handleNavClick('profile')
									setProfileDropdownOpen(false)
								}}>
								<User size={14} strokeWidth={1.5} />
								<span>Mój Profil</span>
							</button>
							<button
								className={`profile-menu-item ${activeView === 'settings' ? 'selected' : ''}`}
								role="menuitem"
								onClick={() => {
									handleNavClick('settings')
									setProfileDropdownOpen(false)
								}}>
								<SettingsIcon size={14} strokeWidth={1.5} />
								<span>Ustawienia</span>
							</button>
							<div className="profile-divider" role="separator"></div>
							<button className="profile-menu-item logout" role="menuitem" onClick={handleLogout}>
								<LogOut size={14} strokeWidth={1.5} />
								<span>Wyloguj</span>
							</button>
						</div>
					</div>
				)}
			</div>

			{/* Render the tooltip outside of any overflow hidden container */}
			{renderTooltip()}
		</div>
	)
}

export default Sidebar

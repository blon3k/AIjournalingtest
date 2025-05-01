import React, { useState, useEffect, useCallback } from 'react'
import './SystemPrompts.css'
import { PlusCircle, Edit, Trash2, FileCode, Clock, Share2, Copy, X, Link, Star, AlertCircle } from 'lucide-react'
import Modal from './modal/Modal'
import { useNavigate } from 'react-router-dom'
import userService from '../services/userService'
import authService from '../services/authService'

const SystemPrompts = ({ sidebarFilter, updateSidebarFilter }) => {
	const [prompts, setPrompts] = useState([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState(null)
	const [currentUser, setCurrentUser] = useState(null)

	// Modal states
	const [isEditModalOpen, setIsEditModalOpen] = useState(false)
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
	const [currentPrompt, setCurrentPrompt] = useState(null)
	const [copiedId, setCopiedId] = useState(null)
	const [sharedId, setSharedId] = useState(null)
	const navigate = useNavigate()

	// Form data
	const [formData, setFormData] = useState({
		title: '',
		content: '',
		category: 'Rozwój Osobisty',
		isFavorite: false,
	})

	// Filter states
	const [searchTerm, setSearchTerm] = useState('')
	const [categoryFilter, setCategoryFilter] = useState('All')
	const [isSubmitting, setIsSubmitting] = useState(false)

	// Fetch current user data
	useEffect(() => {
		const fetchCurrentUser = async () => {
			try {
				const userData = await authService.getCurrentUser()
				setCurrentUser(userData)
			} catch (err) {
				console.error('Failed to fetch current user:', err)
				setError('Failed to authenticate user. Please log in again.')
			}
		}

		fetchCurrentUser()
	}, [])

	// Fetch prompts from API
	useEffect(() => {
		const fetchPrompts = async () => {
			if (!currentUser) return

			setLoading(true)
			setError(null)

			try {
				const promptsData = await userService.getUserSystemPrompts(currentUser._id)
				setPrompts(promptsData)
			} catch (err) {
				console.error('Failed to fetch system prompts:', err)
				setError('Failed to load system prompts. Please try again later.')
			} finally {
				setLoading(false)
			}
		}

		if (currentUser) {
			fetchPrompts()
		}
	}, [currentUser])

	// Define openEditModal before it's used in useEffect
	const openEditModal = useCallback(prompt => {
		setCurrentPrompt(prompt)
		setFormData({
			title: prompt.title,
			content: prompt.content,
			category: prompt.category,
			isFavorite: prompt.isFavorite,
		})
		setIsEditModalOpen(true)
	}, [])

	// Apply filters from sidebar when they change
	useEffect(() => {
		if (sidebarFilter && sidebarFilter.type) {
			console.log(`Applying prompt sidebar filter: ${sidebarFilter.type} - ${sidebarFilter.value}`)

			// Handle different filter types
			if (sidebarFilter.type === 'category') {
				// Handle category filters
				if (sidebarFilter.value === 'all') {
					setCategoryFilter('All')
				} else {
					setCategoryFilter(sidebarFilter.value)
				}
			} else if (sidebarFilter.type === 'sort') {
				// Handle sorting by different criteria
				if (sidebarFilter.value === 'favorite') {
					// Sort by favorites is already default
					console.log('Sorting by favorites')
				} else if (sidebarFilter.value === 'recent') {
					// This would reorder based on updatedAt
					console.log('Sorting by recently updated')
				} else if (sidebarFilter.value === 'alphabetical') {
					// This would sort alphabetically
					console.log('Sorting alphabetically')
				}
			} else if (sidebarFilter.type === 'promptId' && sidebarFilter.action === 'edit') {
				// Only open edit modal if explicitly requested with action=edit
				const promptId = sidebarFilter.value
				const prompt = prompts.find(p => p._id === promptId)
				if (prompt) {
					console.log(`Opening prompt for editing: ${prompt.title}`)
					openEditModal(prompt)
				}
			}
		}
	}, [sidebarFilter, prompts, openEditModal])

	// Update category filter and sync with sidebar
	const handleCategoryChange = category => {
		setCategoryFilter(category)
		// Sync this change back to the sidebar
		if (updateSidebarFilter) {
			updateSidebarFilter('category', category === 'All' ? 'all' : category)
		}
	}

	// Get all unique categories
	const categories = ['All', ...new Set(prompts.map(prompt => prompt.category))]

	// Filtered prompts
	const filteredPrompts = prompts.filter(prompt => {
		return (
			(categoryFilter === 'All' || prompt.category === categoryFilter) &&
			prompt.title.toLowerCase().includes(searchTerm.toLowerCase())
		)
	})

	// Sort prompts based on different criteria
	const getSortedPrompts = () => {
		const sortType = sidebarFilter?.type === 'sort' ? sidebarFilter.value : 'favorite'

		return [...filteredPrompts].sort((a, b) => {
			// Default sorting (favorites first)
			if (sortType === 'favorite' || !sortType) {
				if (a.isFavorite && !b.isFavorite) return -1
				if (!a.isFavorite && b.isFavorite) return 1
				return 0
			}

			// Sort by recently updated
			if (sortType === 'recent') {
				return new Date(b.updatedAt) - new Date(a.updatedAt)
			}

			// Sort alphabetically
			if (sortType === 'alphabetical') {
				return a.title.localeCompare(b.title)
			}

			return 0
		})
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

	// Get sorted prompts
	const sortedPrompts = getSortedPrompts()

	// Open create modal
	const openCreateModal = () => {
		setFormData({
			title: '',
			content: '',
			category: 'Rozwój Osobisty',
			isFavorite: false,
		})
		setIsCreateModalOpen(true)
	}

	// Open delete modal
	const openDeleteModal = prompt => {
		setCurrentPrompt(prompt)
		setIsDeleteModalOpen(true)
	}

	// Close modals
	const closeEditModal = () => {
		setIsEditModalOpen(false)
		setCurrentPrompt(null)
	}

	const closeCreateModal = () => {
		setIsCreateModalOpen(false)
	}

	const closeDeleteModal = () => {
		setIsDeleteModalOpen(false)
		setCurrentPrompt(null)
	}

	// Handle form input changes
	const handleInputChange = e => {
		const { name, value, type, checked } = e.target
		setFormData(prev => ({
			...prev,
			[name]: type === 'checkbox' ? checked : value,
		}))
	}

	// Handle save changes
	const handleSaveChanges = async () => {
		if (!currentUser || !currentPrompt) return

		setIsSubmitting(true)

		try {
			const updatedPrompt = await userService.updateSystemPrompt(currentUser._id, currentPrompt._id, formData)

			// Update prompts state with the updated prompt
			setPrompts(prev => prev.map(p => (p._id === currentPrompt._id ? updatedPrompt : p)))

			closeEditModal()
		} catch (err) {
			console.error('Failed to update system prompt:', err)
			setError('Failed to update system prompt. Please try again.')
		} finally {
			setIsSubmitting(false)
		}
	}

	// Handle create prompt
	const handleCreatePrompt = async () => {
		if (!currentUser) return

		setIsSubmitting(true)

		try {
			const newPrompt = await userService.createSystemPrompt(currentUser._id, formData)

			// Add new prompt to state
			setPrompts(prev => [...prev, newPrompt])
			closeCreateModal()
		} catch (err) {
			console.error('Failed to create system prompt:', err)
			setError('Failed to create system prompt. Please try again.')
		} finally {
			setIsSubmitting(false)
		}
	}

	// Handle delete prompt
	const handleDeletePrompt = async () => {
		if (!currentUser || !currentPrompt) return

		setIsSubmitting(true)

		try {
			await userService.deleteSystemPrompt(currentUser._id, currentPrompt._id)

			// Remove deleted prompt from state
			setPrompts(prev => prev.filter(p => p._id !== currentPrompt._id))
			closeDeleteModal()
		} catch (err) {
			console.error('Failed to delete system prompt:', err)
			setError('Failed to delete system prompt. Please try again.')
		} finally {
			setIsSubmitting(false)
		}
	}

	// Handle toggle favorite
	const handleToggleFavorite = async id => {
		if (!currentUser) return

		try {
			// Find the prompt to toggle
			const promptToUpdate = prompts.find(p => p._id === id)
			if (!promptToUpdate) return

			// Create updated prompt data
			const updatedPromptData = {
				...promptToUpdate,
				isFavorite: !promptToUpdate.isFavorite,
			}

			// Update in the backend
			const updatedPrompt = await userService.updateSystemPrompt(currentUser._id, id, updatedPromptData)

			// Update in state
			setPrompts(prev => prev.map(p => (p._id === id ? updatedPrompt : p)))
		} catch (err) {
			console.error('Failed to toggle favorite status:', err)
			setError('Failed to update favorite status. Please try again.')
		}
	}

	// Handle copy to clipboard
	const handleCopyToClipboard = prompt => {
		navigator.clipboard.writeText(prompt.content)
		setCopiedId(prompt._id)
		setTimeout(() => setCopiedId(null), 2000)
	}

	// Handle share prompt
	const handleSharePrompt = prompt => {
		const sharedData = {
			title: `Prompt: ${prompt.title}`,
			content: 'Udostępniam efektywny prompt systemowy, który może być przydatny dla innych użytkowników.',
			systemPrompt: {
				title: prompt.title,
				content: prompt.content,
			},
		}

		// Store data in sessionStorage temporarily
		sessionStorage.setItem('sharedContent', JSON.stringify(sharedData))

		// Navigate to community with a query parameter to open share modal
		navigate('/community?share=true')

		// Still set the shared ID for the visual feedback
		setSharedId(prompt._id)
		setTimeout(() => setSharedId(null), 2000)
	}

	// Loading state
	if (loading && !prompts.length) {
		return (
			<div className="system-prompts-container loading-state">
				<h1 className="system-prompts-title">Bilbioteka promptów</h1>
				<div className="loading-indicator">
					<div className="loading-spinner"></div>
					<p>Wczytywanie promptów...</p>
				</div>
			</div>
		)
	}

	// Error state
	if (error && !prompts.length) {
		return (
			<div className="system-prompts-container error-state">
				<h1 className="system-prompts-title">Bilbioteka promptów</h1>
				<div className="error-message">
					<AlertCircle size={24} />
					<p>{error}</p>
					<button className="retry-button" onClick={() => window.location.reload()}>
						Spróbuj ponownie
					</button>
				</div>
			</div>
		)
	}

	return (
		<div className="system-prompts-container">
			<h1 className="system-prompts-title">Bilbioteka promptów</h1>
			<p className="system-prompts-description">
				Twórz i zarządzaj promptami systemowymi, które definiują jak asystent AI zachowuje się podczas rozmów.
			</p>

			{error && (
				<div className="error-banner">
					<AlertCircle size={16} />
					<p>{error}</p>
					<button className="close-error-button" onClick={() => setError(null)}>
						<X size={16} />
					</button>
				</div>
			)}

			<div className="system-prompts-header">
				<div className="system-prompts-filters">
					<div className="search-container">
						<input
							type="text"
							placeholder="Szukaj promptów..."
							value={searchTerm}
							onChange={e => setSearchTerm(e.target.value)}
							className="search-input"
						/>
					</div>
					<div className="category-selector">
						{categories.map(category => (
							<button
								key={category}
								className={`category-button ${categoryFilter === category ? 'active' : ''}`}
								onClick={() => handleCategoryChange(category)}>
								{category === 'All' ? 'Wszystkie' : category}
							</button>
						))}
					</div>
				</div>
				<button className="create-prompt-button" onClick={openCreateModal}>
					<PlusCircle size={16} strokeWidth={1.5} />
					<span>Utwórz Prompt</span>
				</button>
			</div>

			{sortedPrompts.length === 0 ? (
				<div className="empty-state">
					<div className="empty-state-icon">
						<FileCode size={48} strokeWidth={1.5} />
					</div>
					<h2>Brak promptów systemowych</h2>
					<p>Utwórz swój pierwszy prompt, aby zdefiniować zachowanie asystenta AI.</p>
					<button className="create-prompt-button" onClick={openCreateModal}>
						<PlusCircle size={16} strokeWidth={1.5} />
						<span>Utwórz Prompt</span>
					</button>
				</div>
			) : (
				<div className="system-prompts-grid">
					{sortedPrompts.map(prompt => (
						<div key={prompt._id} className={`prompt-card ${prompt.isFavorite ? 'favorite' : ''}`}>
							{prompt.isFavorite && (
								<div className="favorite-badge">
									<Star size={12} strokeWidth={1.5} />
								</div>
							)}
							<div className="prompt-card-header">
								<div className="prompt-icon">
									<FileCode size={18} strokeWidth={1.5} />
								</div>
								<div className="prompt-meta-info">
									<div className="prompt-category">{prompt.category}</div>
									<div className="prompt-updated">
										<Clock size={12} strokeWidth={1.5} />
										<span>{formatDate(prompt.updatedAt)}</span>
									</div>
								</div>
							</div>
							<div className="prompt-card-content">
								<h3 className="prompt-title">{prompt.title}</h3>
								<p className="prompt-content">{prompt.content}</p>
							</div>
							<div className="prompt-card-actions">
								<button
									className="prompt-action-button"
									onClick={() => handleCopyToClipboard(prompt)}
									aria-label="Kopiuj do schowka">
									{copiedId === prompt._id ? (
										<>
											<Copy size={16} strokeWidth={1.5} fill="currentColor" />
											<span>Skopiowano</span>
										</>
									) : (
										<>
											<Copy size={16} strokeWidth={1.5} />
											<span>Kopiuj</span>
										</>
									)}
								</button>
								<button
									className="prompt-action-button"
									onClick={() => openEditModal(prompt)}
									aria-label="Edytuj prompt">
									<Edit size={16} strokeWidth={1.5} />
									<span>Edytuj</span>
								</button>
								<button
									className="prompt-action-button delete"
									onClick={() => openDeleteModal(prompt)}
									aria-label="Usuń prompt">
									<Trash2 size={16} strokeWidth={1.5} />
									<span>Usuń</span>
								</button>
							</div>
							<div className="prompt-card-footer">
								<button
									className={`prompt-favorite-button ${prompt.isFavorite ? 'active' : ''}`}
									onClick={() => handleToggleFavorite(prompt._id)}
									aria-label={prompt.isFavorite ? 'Usuń z ulubionych' : 'Dodaj do ulubionych'}>
									<svg
										width="16"
										height="16"
										viewBox="0 0 24 24"
										fill={prompt.isFavorite ? 'currentColor' : 'none'}
										stroke="currentColor"
										strokeWidth="1.5"
										strokeLinecap="round"
										strokeLinejoin="round">
										<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
									</svg>
								</button>
								<button
									className="prompt-share-button"
									onClick={() => handleSharePrompt(prompt)}
									aria-label="Udostępnij prompt">
									{sharedId === prompt._id ? (
										<>
											<Copy size={16} strokeWidth={1.5} fill="currentColor" />
											<span>Link skopiowany</span>
										</>
									) : (
										<>
											<Share2 size={16} strokeWidth={1.5} />
											<span>Udostępnij</span>
										</>
									)}
								</button>
								<button className="prompt-use-button" aria-label="Użyj">
									<Link size={16} strokeWidth={1.5} />
									<span>Użyj</span>
								</button>
							</div>
						</div>
					))}
				</div>
			)}

			{/* Edit Modal */}
			<Modal isOpen={isEditModalOpen} onClose={closeEditModal} title="Edytuj Prompt Systemowy" size="medium">
				<div className="form-group">
					<label htmlFor="title">Tytuł</label>
					<input
						type="text"
						id="title"
						name="title"
						value={formData.title}
						onChange={handleInputChange}
						placeholder="Tytuł promptu"
						required
					/>
				</div>

				<div className="form-group">
					<label htmlFor="category">Kategoria</label>
					<select id="category" name="category" value={formData.category} onChange={handleInputChange}>
						<option value="Rozwój Osobisty">Rozwój Osobisty</option>
						<option value="Analiza Psychologiczna">Analiza Psychologiczna</option>
						<option value="Refleksja Dzienna">Refleksja Dzienna</option>
						<option value="Development">Development</option>
						<option value="Technical">Technical</option>
						<option value="Creative">Creative</option>
						<option value="Business">Business</option>
						<option value="Personal">Personal</option>
					</select>
				</div>

				<div className="form-group">
					<label htmlFor="content">Treść Promptu</label>
					<textarea
						id="content"
						name="content"
						value={formData.content}
						onChange={handleInputChange}
						placeholder="Wprowadź treść promptu systemowego..."
						rows={8}
						required
					/>
				</div>

				<div className="form-checkbox-group">
					<div className="checkbox-wrapper">
						<input
							type="checkbox"
							id="isFavorite"
							name="isFavorite"
							checked={formData.isFavorite}
							onChange={handleInputChange}
						/>
						<label htmlFor="isFavorite">Dodaj do ulubionych</label>
					</div>
				</div>

				<div className="modal-actions">
					<button className="modal-button modal-button-secondary" onClick={closeEditModal} disabled={isSubmitting}>
						<X size={16} strokeWidth={1.5} />
						Anuluj
					</button>
					<button
						className="modal-button modal-button-primary"
						onClick={handleSaveChanges}
						disabled={isSubmitting || !formData.title || !formData.content}>
						{isSubmitting ? (
							<>
								<div className="loading-spinner-small"></div>
								Zapisywanie...
							</>
						) : (
							<>
								<PlusCircle size={16} strokeWidth={1.5} />
								Zapisz Zmiany
							</>
						)}
					</button>
				</div>
			</Modal>

			{/* Create Modal */}
			<Modal isOpen={isCreateModalOpen} onClose={closeCreateModal} title="Utwórz Prompt Systemowy" size="medium">
				<div className="form-group">
					<label htmlFor="new-title">Tytuł</label>
					<input
						type="text"
						id="new-title"
						name="title"
						value={formData.title}
						onChange={handleInputChange}
						placeholder="Tytuł promptu"
						required
					/>
				</div>

				<div className="form-group">
					<label htmlFor="new-category">Kategoria</label>
					<select id="new-category" name="category" value={formData.category} onChange={handleInputChange}>
						<option value="Rozwój Osobisty">Rozwój Osobisty</option>
						<option value="Analiza Psychologiczna">Analiza Psychologiczna</option>
						<option value="Refleksja Dzienna">Refleksja Dzienna</option>
						<option value="Development">Development</option>
						<option value="Technical">Technical</option>
						<option value="Creative">Creative</option>
						<option value="Business">Business</option>
						<option value="Personal">Personal</option>
					</select>
				</div>

				<div className="form-group">
					<label htmlFor="new-content">Treść Promptu</label>
					<textarea
						id="new-content"
						name="content"
						value={formData.content}
						onChange={handleInputChange}
						placeholder="Wprowadź treść promptu systemowego..."
						rows={8}
						required
					/>
				</div>

				<div className="form-checkbox-group">
					<div className="checkbox-wrapper">
						<input
							type="checkbox"
							id="new-isFavorite"
							name="isFavorite"
							checked={formData.isFavorite}
							onChange={handleInputChange}
						/>
						<label htmlFor="new-isFavorite">Dodaj do ulubionych</label>
					</div>
				</div>

				<div className="modal-actions">
					<button className="modal-button modal-button-secondary" onClick={closeCreateModal} disabled={isSubmitting}>
						<X size={16} strokeWidth={1.5} />
						Anuluj
					</button>
					<button
						className="modal-button modal-button-primary"
						onClick={handleCreatePrompt}
						disabled={isSubmitting || !formData.title || !formData.content}>
						{isSubmitting ? (
							<>
								<div className="loading-spinner-small"></div>
								Tworzenie...
							</>
						) : (
							<>
								<PlusCircle size={16} strokeWidth={1.5} />
								Utwórz Prompt
							</>
						)}
					</button>
				</div>
			</Modal>

			{/* Delete Confirmation Modal */}
			<Modal isOpen={isDeleteModalOpen} onClose={closeDeleteModal} title="Usuń Prompt Systemowy" size="small">
				<div className="delete-confirmation-content">
					<p>
						Czy na pewno chcesz usunąć <strong>{currentPrompt?.title}</strong>? Tej akcji nie można cofnąć.
					</p>
				</div>

				<div className="modal-actions">
					<button className="modal-button modal-button-secondary" onClick={closeDeleteModal} disabled={isSubmitting}>
						<X size={16} strokeWidth={1.5} />
						Anuluj
					</button>
					<button className="modal-button modal-button-danger" onClick={handleDeletePrompt} disabled={isSubmitting}>
						{isSubmitting ? (
							<>
								<div className="loading-spinner-small"></div>
								Usuwanie...
							</>
						) : (
							<>
								<Trash2 size={16} strokeWidth={1.5} />
								Usuń Prompt
							</>
						)}
					</button>
				</div>
			</Modal>
		</div>
	)
}

export default SystemPrompts

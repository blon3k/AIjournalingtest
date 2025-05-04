import React, { useState, useEffect, useCallback, useRef } from 'react'
import './Assistants.css'
import {
	PlusCircle,
	Edit,
	Trash2,
	User,
	X,
	Shield,
	UserCircle,
	Search,
	Share2,
	Clock,
	MessageSquare,
	Link,
	Star,
	Upload,
	AlertCircle,
} from 'lucide-react'
import Modal from '../../components/modal/Modal'
import ColorThief from 'colorthief'
import { useNavigate } from 'react-router-dom'
import userService from '../../services/userService'
import authService from '../../services/authService'

const Assistants = ({ sidebarFilter, updateSidebarFilter }) => {
	const [assistants, setAssistants] = useState([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState(null)
	const [currentUser, setCurrentUser] = useState(null)
	const [isSubmitting, setIsSubmitting] = useState(false)

	// Track image loading states
	const [imageLoading, setImageLoading] = useState({})
	const [imageError, setImageError] = useState({})
	const colorThief = useRef(new ColorThief())
	const imgRefs = useRef({})
	const navigate = useNavigate()

	// Modal states
	const [isEditModalOpen, setIsEditModalOpen] = useState(false)
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
	const [currentAssistant, setCurrentAssistant] = useState(null)
	const [sharedId, setSharedId] = useState(null)

	// Filter states
	const [searchTerm, setSearchTerm] = useState('')
	const [categoryFilter, setCategoryFilter] = useState('All')
	const [creatorFilter, setCreatorFilter] = useState('All')

	// Form state for editing and creating
	const [formData, setFormData] = useState({
		name: '',
		role: '',
		description: '',
		avatarImage: '',
		category: 'Ogólne',
		isFavorite: false,
		instructions: '',
		systemPrompt: '',
	})

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

	// Fetch assistants from API
	useEffect(() => {
		const fetchAssistants = async () => {
			if (!currentUser) return

			setLoading(true)
			setError(null)

			try {
				const assistantsData = await userService.getUserAssistants(currentUser._id)
				setAssistants(assistantsData)

				// Initialize image loading states for all assistants
				const initialLoadingState = {}
				assistantsData.forEach(assistant => {
					initialLoadingState[assistant._id] = assistant.avatarImage ? true : false
				})
				setImageLoading(initialLoadingState)
			} catch (err) {
				console.error('Failed to fetch assistants:', err)
				setError('Failed to load assistants. Please try again later.')
			} finally {
				setLoading(false)
			}
		}

		if (currentUser) {
			fetchAssistants()
		}
	}, [currentUser])

	// Define openEditModal before it's used in useEffect
	const openEditModal = useCallback((assistant, e) => {
		if (e) e.stopPropagation()
		setCurrentAssistant(assistant)
		setFormData({
			name: assistant.name,
			role: assistant.description || '',
			description: assistant.description || '',
			avatarImage: assistant.avatarImage || '',
			category: assistant.category || 'Ogólne',
			isFavorite: assistant.isFavorite || false,
			instructions: assistant.instructions || '',
			systemPrompt: assistant.systemPrompt || '',
		})
		setIsEditModalOpen(true)
	}, [])

	// Apply filters from sidebar when they change
	useEffect(() => {
		if (sidebarFilter && sidebarFilter.type) {
			console.log(`Applying assistant sidebar filter: ${sidebarFilter.type} - ${sidebarFilter.value}`)

			// Handle different filter types
			if (sidebarFilter.type === 'category') {
				// Handle category filters
				if (sidebarFilter.value === 'all') {
					setCategoryFilter('All')
				} else {
					setCategoryFilter(sidebarFilter.value)
				}
			} else if (sidebarFilter.type === 'creator') {
				// Handle creator filters
				if (sidebarFilter.value === 'all') {
					setCreatorFilter('All')
				} else {
					setCreatorFilter(sidebarFilter.value)
				}
			} else if (sidebarFilter.type === 'assistantId' && sidebarFilter.action === 'edit') {
				// Find the assistant by ID and open its edit modal
				const assistantId = sidebarFilter.value
				const assistant = assistants.find(a => a._id === assistantId)
				if (assistant) {
					console.log(`Opening assistant: ${assistant.name}`)
					openEditModal(assistant)
				}
			}
		}
	}, [sidebarFilter, assistants, openEditModal])

	// Function to handle image load and extract colors
	const handleImageLoad = id => {
		setImageLoading(prev => ({ ...prev, [id]: false }))
		setImageError(prev => ({ ...prev, [id]: false }))

		if (imgRefs.current[id] && imgRefs.current[id].complete) {
			try {
				const palette = colorThief.current.getPalette(imgRefs.current[id], 3)
				// RGB to Hex conversion is handled inside the imageLoad event
			} catch (error) {
				console.error('Could not extract colors:', error)
			}
		}
	}

	const handleImageError = id => {
		setImageLoading(prev => ({ ...prev, [id]: false }))
		setImageError(prev => ({ ...prev, [id]: true }))
	}

	// Open create modal
	const openCreateModal = () => {
		setFormData({
			name: '',
			role: '',
			description: '',
			avatarImage: '',
			category: 'Ogólne',
			isFavorite: false,
			instructions: '',
			systemPrompt: '',
		})
		setIsCreateModalOpen(true)
	}

	// Open delete modal
	const openDeleteModal = (assistant, e) => {
		e.stopPropagation()
		setCurrentAssistant(assistant)
		setIsDeleteModalOpen(true)
	}

	// Close modals
	const closeEditModal = () => {
		setIsEditModalOpen(false)
		setCurrentAssistant(null)
	}

	const closeCreateModal = () => {
		setIsCreateModalOpen(false)
	}

	const closeDeleteModal = () => {
		setIsDeleteModalOpen(false)
		setCurrentAssistant(null)
	}

	// Handle form input changes
	const handleInputChange = e => {
		const { name, value, type, checked } = e.target
		setFormData(prev => ({
			...prev,
			[name]: type === 'checkbox' ? checked : value,
		}))
	}

	// Handle image upload
	const handleImageUploaded = imageUrl => {
		console.log('Image uploaded successfully in Assistants:', imageUrl)
		setFormData(prev => ({
			...prev,
			avatarImage: imageUrl,
		}))
	}

	// Remove uploaded image
	const removeImage = () => {
		setFormData(prev => ({
			...prev,
			avatarImage: '',
		}))
	}

	// Save assistant changes
	const handleSaveChanges = async () => {
		if (!currentUser || !currentAssistant) return

		setIsSubmitting(true)

		try {
			const assistantData = {
				name: formData.name,
				description: formData.description,
				avatarImage: formData.avatarImage,
				category: formData.category,
				isFavorite: formData.isFavorite,
				instructions: formData.instructions,
				systemPrompt: formData.systemPrompt,
			}

			const updatedAssistant = await userService.updateAssistant(currentUser._id, currentAssistant._id, assistantData)

			// Update assistants state with the updated assistant
			setAssistants(prev => prev.map(a => (a._id === currentAssistant._id ? updatedAssistant : a)))

			// Reset image loading state for the updated assistant if it has an avatar
			if (updatedAssistant.avatarImage) {
				setImageLoading(prev => ({
					...prev,
					[updatedAssistant._id]: true,
				}))
				setImageError(prev => ({
					...prev,
					[updatedAssistant._id]: false,
				}))
			}

			closeEditModal()
		} catch (err) {
			console.error('Failed to update assistant:', err)
			setError('Failed to update assistant. Please try again.')
		} finally {
			setIsSubmitting(false)
		}
	}

	// Create new assistant
	const handleCreateAssistant = async () => {
		if (!currentUser) return

		setIsSubmitting(true)

		try {
			const assistantData = {
				name: formData.name || 'Nowy Asystent',
				description: formData.description || 'Opis nie został podany',
				avatarImage: formData.avatarImage || '',
				category: formData.category || 'Ogólne',
				isFavorite: formData.isFavorite || false,
				instructions: formData.instructions || '',
				systemPrompt: formData.systemPrompt || '',
			}

			const newAssistant = await userService.createAssistant(currentUser._id, assistantData)

			// Add new assistant to state
			setAssistants(prev => [...prev, newAssistant])

			// Initialize image loading state for the new assistant if it has an avatar
			if (newAssistant.avatarImage) {
				setImageLoading(prev => ({
					...prev,
					[newAssistant._id]: true,
				}))
			}

			closeCreateModal()
		} catch (err) {
			console.error('Failed to create assistant:', err)
			setError('Failed to create assistant. Please try again.')
		} finally {
			setIsSubmitting(false)
		}
	}

	// Delete assistant
	const handleDeleteAssistant = async () => {
		if (!currentUser || !currentAssistant) return

		setIsSubmitting(true)

		try {
			await userService.deleteAssistant(currentUser._id, currentAssistant._id)

			// Remove deleted assistant from state
			setAssistants(prev => prev.filter(a => a._id !== currentAssistant._id))
			closeDeleteModal()
		} catch (err) {
			console.error('Failed to delete assistant:', err)
			setError('Failed to delete assistant. Please try again.')
		} finally {
			setIsSubmitting(false)
		}
	}

	// Handle favorite toggle with optimistic update
	const handleToggleFavorite = (id, e) => {
		e.stopPropagation()

		// Find the assistant to update
		const assistantToUpdate = assistants.find(a => a._id === id)
		if (!assistantToUpdate || !currentUser) return

		// Optimistically update UI state immediately
		setAssistants(prev =>
			prev.map(assistant =>
				assistant._id === id
					? {
							...assistant,
							isFavorite: !assistant.isFavorite,
					  }
					: assistant
			)
		)

		// Then make the API call
		;(async () => {
			try {
				const updatedData = {
					...assistantToUpdate,
					isFavorite: !assistantToUpdate.isFavorite,
				}

				await userService.updateAssistant(currentUser._id, id, updatedData)
			} catch (err) {
				console.error('Failed to update favorite status:', err)

				// Revert the optimistic update if the API call fails
				setAssistants(prev =>
					prev.map(assistant =>
						assistant._id === id
							? {
									...assistant,
									isFavorite: assistantToUpdate.isFavorite, // Revert to original state
							  }
							: assistant
					)
				)

				setError('Failed to update favorite status. Please try again.')
			}
		})()
	}

	// Get all unique categories
	const categories = ['All', ...new Set(assistants.map(assistant => assistant.category).filter(Boolean))]

	// Update category filter and sync with sidebar
	const handleCategoryChange = category => {
		setCategoryFilter(category)
		// Sync this change back to the sidebar
		if (updateSidebarFilter) {
			updateSidebarFilter('category', category === 'All' ? 'all' : category)
		}
	}

	// Update creator filter and sync with sidebar
	const handleCreatorChange = creator => {
		setCreatorFilter(creator)
		// Sync this change back to the sidebar
		if (updateSidebarFilter) {
			updateSidebarFilter('creator', creator === 'All' ? 'all' : creator)
		}
	}

	// Filter assistants based on current filters
	const filteredAssistants = assistants.filter(assistant => {
		const matchesCategory = categoryFilter === 'All' || assistant.category === categoryFilter
		// System assistants have category defined in database
		const matchesCreator =
			creatorFilter === 'All' ||
			(creatorFilter === 'system' && assistant.createdBy === 'system') ||
			(creatorFilter === 'user' && assistant.createdBy !== 'system')
		const matchesSearch =
			assistant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			(assistant.description && assistant.description.toLowerCase().includes(searchTerm.toLowerCase()))

		return matchesCategory && matchesCreator && matchesSearch
	})

	// Sort assistants with favorites first
	const sortedAssistants = [...filteredAssistants].sort((a, b) => {
		if (a.isFavorite && !b.isFavorite) return -1
		if (!a.isFavorite && b.isFavorite) return 1
		return 0
	})

	// Handle sharing an assistant
	const handleShareAssistant = (assistant, e) => {
		if (e) e.stopPropagation()

		const sharedData = {
			title: `Asystent: ${assistant.name}`,
			content: `Udostępniam asystenta '${assistant.name}', który może być przydatny w ${
				assistant.description || 'różnych zadaniach'
			}.`,
			assistant: {
				name: assistant.name,
				role: assistant.description || '',
				avatar: assistant.avatarImage ? null : assistant.name.charAt(0),
			},
		}

		// Store data in sessionStorage temporarily
		sessionStorage.setItem('sharedContent', JSON.stringify(sharedData))

		// Navigate to community with a query parameter to open share modal
		navigate('/community?share=true')

		// Visual feedback
		setSharedId(assistant._id)
		setTimeout(() => setSharedId(null), 2000)
	}

	// Render the assistant with appropriate placeholders
	const renderAssistantImage = assistant => {
		// Don't use the loading states for now as they're causing issues
		// Just check if the avatar image exists
		if (!assistant.avatarImage) {
			return (
				<div className="assistant-avatar-placeholder">
					<User size={24} strokeWidth={1.5} />
				</div>
			)
		}

		return (
			<img
				src={assistant.avatarImage}
				alt={assistant.name}
				onError={() => {
					// If image fails to load, set error in state and show fallback
					console.error(`Failed to load image for assistant: ${assistant.name}`)
					// Update the assistant in state directly to remove the invalid avatar URL
					setAssistants(prev => prev.map(a => (a._id === assistant._id ? { ...a, avatarImage: '' } : a)))
				}}
			/>
		)
	}

	// Simulate action for using an assistant
	const handleUseAssistant = (assistant, e) => {
		if (e) e.stopPropagation()
		// In a real app, this would start a chat with this assistant
		navigate(`/chat/new?assistant=${assistant._id}`)
	}

	// Loading state
	if (loading && !assistants.length) {
		return (
			<div className="ai-assistants loading-state">
				<h1 className="ai-assistants__title">Asystenci AI</h1>
				<div className="loading-indicator">
					<div className="loading-spinner"></div>
					<p>Wczytywanie asystentów...</p>
				</div>
			</div>
		)
	}

	// Error state
	if (error && !assistants.length) {
		return (
			<div className="ai-assistants error-state">
				<h1 className="ai-assistants__title">Asystenci AI</h1>
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
		<div className="ai-assistants">
			<h1 className="ai-assistants__title">Asystenci AI</h1>
			<p className="ai-assistants__description">
				Wybierz osobowość, jako którą AI będzie odpowiadać w Twoich rozmowach.
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

			<div className="assistants-header">
				<div className="assistants-filters">
					<div className="search-container">
						<input
							type="text"
							placeholder="Szukaj asystentów..."
							value={searchTerm}
							onChange={e => setSearchTerm(e.target.value)}
							className="search-input"
						/>
						<Search className="search-icon" size={16} strokeWidth={1.5} />
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
					<div className="creator-selector">
						<button
							className={`creator-button ${creatorFilter === 'All' ? 'active' : ''}`}
							onClick={() => handleCreatorChange('All')}>
							Wszyscy
						</button>
						<button
							className={`creator-button ${creatorFilter === 'system' ? 'active' : ''}`}
							onClick={() => handleCreatorChange('system')}>
							Systemowi
						</button>
						<button
							className={`creator-button ${creatorFilter === 'user' ? 'active' : ''}`}
							onClick={() => handleCreatorChange('user')}>
							Własni
						</button>
					</div>
				</div>
				<button className="create-assistant-button" onClick={openCreateModal}>
					<PlusCircle size={16} strokeWidth={1.5} />
					<span>Utwórz Asystenta</span>
				</button>
			</div>

			{sortedAssistants.length === 0 ? (
				<div className="empty-state">
					<div className="empty-state-icon">
						<UserCircle size={48} strokeWidth={1.5} />
					</div>
					<h2>Brak asystentów</h2>
					<p>Utwórz swojego pierwszego asystenta, aby rozpocząć spersonalizowane rozmowy.</p>
					<button className="create-assistant-button" onClick={openCreateModal}>
						<PlusCircle size={16} strokeWidth={1.5} />
						<span>Utwórz Asystenta</span>
					</button>
				</div>
			) : (
				<div className="ai-assistants__grid">
					{sortedAssistants.map(assistant => (
						<div key={assistant._id} className={`assistant-card ${assistant.isFavorite ? 'favorite' : ''}`}>
							{assistant.isFavorite && (
								<div className="favorite-badge">
									<Star size={12} strokeWidth={1.5} />
								</div>
							)}
							<div className="assistant-card-header">
								<div className="assistant-avatar">{renderAssistantImage(assistant)}</div>
								<div className="assistant-meta-info">
									<div className="assistant-category">{assistant.category}</div>
								</div>
							</div>
							<div className="assistant-card-content">
								<h3 className="assistant-title">{assistant.name}</h3>
								<div className="assistant-role">{assistant.description}</div>
								<p className="assistant-description">{assistant.instructions}</p>
							</div>
							<div className="assistant-card-actions">
								<button className="assistant-action-button" onClick={e => handleShareAssistant(assistant, e)}>
									{sharedId === assistant._id ? (
										<>
											<Share2 size={16} strokeWidth={1.5} />
											<span>Udostępniono</span>
										</>
									) : (
										<>
											<Share2 size={16} strokeWidth={1.5} />
											<span>Udostępnij</span>
										</>
									)}
								</button>
								<button className="assistant-action-button" onClick={e => openEditModal(assistant, e)}>
									<Edit size={16} strokeWidth={1.5} />
									<span>Edytuj</span>
								</button>
								<button className="assistant-action-button delete" onClick={e => openDeleteModal(assistant, e)}>
									<Trash2 size={16} strokeWidth={1.5} />
									<span>Usuń</span>
								</button>
							</div>
							<div className="assistant-card-footer">
								<button
									className={`assistant-favorite-button ${assistant.isFavorite ? 'active' : ''}`}
									onClick={e => handleToggleFavorite(assistant._id, e)}
									aria-label={assistant.isFavorite ? 'Usuń z ulubionych' : 'Dodaj do ulubionych'}>
									<svg
										width="16"
										height="16"
										viewBox="0 0 24 24"
										fill={assistant.isFavorite ? 'currentColor' : 'none'}
										stroke="currentColor"
										strokeWidth="1.5"
										strokeLinecap="round"
										strokeLinejoin="round">
										<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
									</svg>
								</button>
								<button
									className="assistant-use-button"
									onClick={e => handleUseAssistant(assistant, e)}
									aria-label="Użyj asystenta">
									<MessageSquare size={16} strokeWidth={1.5} />
									<span>Użyj</span>
								</button>
							</div>
						</div>
					))}

					<div className="add-assistant-card" onClick={openCreateModal}>
						<div className="add-assistant-card__icon">
							<PlusCircle size={30} strokeWidth={1.5} />
						</div>
						<p className="add-assistant-card__text">Utwórz Nowego Asystenta</p>
					</div>
				</div>
			)}

			{/* Edit Assistant Modal */}
			<Modal isOpen={isEditModalOpen} onClose={closeEditModal} title="Edytuj Asystenta" size="medium">
				{modalTools => (
					<div onImageUpload={handleImageUploaded}>
						<div className="form-group">
							<label htmlFor="name">Nazwa</label>
							<input
								type="text"
								id="name"
								name="name"
								value={formData.name}
								onChange={handleInputChange}
								placeholder="Nazwa asystenta"
								required
							/>
						</div>

						<div className="form-group">
							<label htmlFor="description">Opis/Rola</label>
							<input
								type="text"
								id="description"
								name="description"
								value={formData.description}
								onChange={handleInputChange}
								placeholder="Krótki opis lub rola asystenta"
							/>
						</div>

						<div className="form-group">
							<label htmlFor="category">Kategoria</label>
							<select id="category" name="category" value={formData.category} onChange={handleInputChange}>
								<option value="Ogólne">Ogólne</option>
								<option value="Nauka">Nauka</option>
								<option value="Historia">Historia</option>
								<option value="Sztuka">Sztuka</option>
								<option value="Literatura">Literatura</option>
								<option value="Technologia">Technologia</option>
								<option value="Biznes">Biznes</option>
							</select>
						</div>

						<div className="form-group">
							<label htmlFor="avatarImage">Obraz asystenta</label>
							<div className="image-upload-container">
								{formData.avatarImage ? (
									<div
										className={`image-preview-container ${modalTools.uploadingImage ? 'uploading' : ''}`}
										onClick={() => modalTools.fileInputRef?.current?.click()}>
										<div className="image-preview">
											<img src={formData.avatarImage} alt="Podgląd asystenta" />
											<div className="image-preview-overlay">
												<div className="image-preview-actions">
													<button className="image-preview-button">
														{modalTools.uploadingImage ? (
															<div className="loading-spinner-small"></div>
														) : (
															<Upload size={20} strokeWidth={1.5} />
														)}
													</button>
												</div>
											</div>
										</div>
										{modalTools.uploadingImage && (
											<div className="upload-overlay">
												<div className="upload-overlay-progress">
													<div className="upload-progress-circle">
														<svg viewBox="0 0 36 36">
															<path
																className="upload-progress-bg"
																d="M18 2.0845
																	a 15.9155 15.9155 0 0 1 0 31.831
																	a 15.9155 15.9155 0 0 1 0 -31.831"
															/>
															<path
																className="upload-progress-fill"
																strokeDasharray={`${modalTools.uploadProgress}, 100`}
																d="M18 2.0845
																	a 15.9155 15.9155 0 0 1 0 31.831
																	a 15.9155 15.9155 0 0 1 0 -31.831"
															/>
														</svg>
														<span className="upload-progress-percent">{modalTools.uploadProgress}%</span>
													</div>
												</div>
												<div className="upload-overlay-text">Przesyłanie obrazu...</div>
											</div>
										)}
										<button
											className="remove-image-button"
											onClick={e => {
												e.stopPropagation()
												removeImage()
											}}
											disabled={modalTools.uploadingImage}>
											<X size={16} strokeWidth={1.5} />
										</button>
									</div>
								) : (
									<>
										<input
											type="text"
											id="avatarImage"
											name="avatarImage"
											value={formData.avatarImage}
											onChange={handleInputChange}
											placeholder="URL obrazu lub użyj przycisku poniżej"
										/>
										<div className="image-upload-actions">
											<button
												className="upload-image-button"
												onClick={() => modalTools.fileInputRef?.current?.click()}
												disabled={modalTools.uploadingImage}>
												{modalTools.uploadingImage ? (
													<div className="loading-spinner-small"></div>
												) : (
													<>
														<Upload size={16} strokeWidth={1.5} />
														<span>Prześlij obraz</span>
													</>
												)}
											</button>
										</div>
									</>
								)}
							</div>
						</div>

						<div className="form-group">
							<label htmlFor="instructions">Instrukcje</label>
							<textarea
								id="instructions"
								name="instructions"
								value={formData.instructions}
								onChange={handleInputChange}
								placeholder="Instrukcje dla asystenta, np. 'Odpowiadaj w stylu Alberta Einsteina'"
								rows={4}
							/>
						</div>

						<div className="form-group">
							<label htmlFor="systemPrompt">Prompt systemowy</label>
							<textarea
								id="systemPrompt"
								name="systemPrompt"
								value={formData.systemPrompt}
								onChange={handleInputChange}
								placeholder="Szczegółowy prompt systemowy określający zachowanie asystenta"
								rows={6}
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
								disabled={isSubmitting || !formData.name}>
								{isSubmitting ? (
									<>
										<div className="loading-spinner-small"></div>
										Zapisywanie...
									</>
								) : (
									<>
										<Edit size={16} strokeWidth={1.5} />
										Zapisz zmiany
									</>
								)}
							</button>
						</div>
					</div>
				)}
			</Modal>

			{/* Create Assistant Modal */}
			<Modal isOpen={isCreateModalOpen} onClose={closeCreateModal} title="Utwórz Nowego Asystenta" size="medium">
				{modalTools => (
					<div onImageUpload={handleImageUploaded}>
						<div className="form-group">
							<label htmlFor="new-name">Nazwa</label>
							<input
								type="text"
								id="new-name"
								name="name"
								value={formData.name}
								onChange={handleInputChange}
								placeholder="Nazwa asystenta"
								required
							/>
						</div>

						<div className="form-group">
							<label htmlFor="new-description">Opis/Rola</label>
							<input
								type="text"
								id="new-description"
								name="description"
								value={formData.description}
								onChange={handleInputChange}
								placeholder="Krótki opis lub rola asystenta"
							/>
						</div>

						<div className="form-group">
							<label htmlFor="new-category">Kategoria</label>
							<select id="new-category" name="category" value={formData.category} onChange={handleInputChange}>
								<option value="Ogólne">Ogólne</option>
								<option value="Nauka">Nauka</option>
								<option value="Historia">Historia</option>
								<option value="Sztuka">Sztuka</option>
								<option value="Literatura">Literatura</option>
								<option value="Technologia">Technologia</option>
								<option value="Biznes">Biznes</option>
							</select>
						</div>

						<div className="form-group">
							<label htmlFor="new-avatarImage">Obraz asystenta</label>
							<div className="image-upload-container">
								{formData.avatarImage ? (
									<div
										className={`image-preview-container ${modalTools.uploadingImage ? 'uploading' : ''}`}
										onClick={() => modalTools.fileInputRef?.current?.click()}>
										<div className="image-preview">
											<img src={formData.avatarImage} alt="Podgląd asystenta" />
											<div className="image-preview-overlay">
												<div className="image-preview-actions">
													<button className="image-preview-button">
														{modalTools.uploadingImage ? (
															<div className="loading-spinner-small"></div>
														) : (
															<Upload size={20} strokeWidth={1.5} />
														)}
													</button>
												</div>
											</div>
										</div>
										{modalTools.uploadingImage && (
											<div className="upload-overlay">
												<div className="upload-overlay-progress">
													<div className="upload-progress-circle">
														<svg viewBox="0 0 36 36">
															<path
																className="upload-progress-bg"
																d="M18 2.0845
																	a 15.9155 15.9155 0 0 1 0 31.831
																	a 15.9155 15.9155 0 0 1 0 -31.831"
															/>
															<path
																className="upload-progress-fill"
																strokeDasharray={`${modalTools.uploadProgress}, 100`}
																d="M18 2.0845
																	a 15.9155 15.9155 0 0 1 0 31.831
																	a 15.9155 15.9155 0 0 1 0 -31.831"
															/>
														</svg>
														<span className="upload-progress-percent">{modalTools.uploadProgress}%</span>
													</div>
												</div>
												<div className="upload-overlay-text">Przesyłanie obrazu...</div>
											</div>
										)}
										<button
											className="remove-image-button"
											onClick={e => {
												e.stopPropagation()
												removeImage()
											}}
											disabled={modalTools.uploadingImage}>
											<X size={16} strokeWidth={1.5} />
										</button>
									</div>
								) : (
									<>
										<input
											type="text"
											id="new-avatarImage"
											name="avatarImage"
											value={formData.avatarImage}
											onChange={handleInputChange}
											placeholder="URL obrazu lub użyj przycisku poniżej"
										/>
										<div className="image-upload-actions">
											<button
												className="upload-image-button"
												onClick={() => modalTools.fileInputRef?.current?.click()}
												disabled={modalTools.uploadingImage}>
												{modalTools.uploadingImage ? (
													<div className="loading-spinner-small"></div>
												) : (
													<>
														<Upload size={16} strokeWidth={1.5} />
														<span>Prześlij obraz</span>
													</>
												)}
											</button>
										</div>
									</>
								)}
							</div>
						</div>

						<div className="form-group">
							<label htmlFor="new-instructions">Instrukcje</label>
							<textarea
								id="new-instructions"
								name="instructions"
								value={formData.instructions}
								onChange={handleInputChange}
								placeholder="Instrukcje dla asystenta, np. 'Odpowiadaj w stylu Alberta Einsteina'"
								rows={4}
							/>
						</div>

						<div className="form-group">
							<label htmlFor="new-systemPrompt">Prompt systemowy</label>
							<textarea
								id="new-systemPrompt"
								name="systemPrompt"
								value={formData.systemPrompt}
								onChange={handleInputChange}
								placeholder="Szczegółowy prompt systemowy określający zachowanie asystenta"
								rows={6}
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
							<button
								className="modal-button modal-button-secondary"
								onClick={closeCreateModal}
								disabled={isSubmitting}>
								<X size={16} strokeWidth={1.5} />
								Anuluj
							</button>
							<button
								className="modal-button modal-button-primary"
								onClick={handleCreateAssistant}
								disabled={isSubmitting || !formData.name}>
								{isSubmitting ? (
									<>
										<div className="loading-spinner-small"></div>
										Tworzenie...
									</>
								) : (
									<>
										<PlusCircle size={16} strokeWidth={1.5} />
										Utwórz Asystenta
									</>
								)}
							</button>
						</div>
					</div>
				)}
			</Modal>

			{/* Delete Confirmation Modal */}
			<Modal isOpen={isDeleteModalOpen} onClose={closeDeleteModal} title="Usuń Asystenta" size="small">
				<div className="delete-confirmation-content">
					<p>
						Czy na pewno chcesz usunąć <strong>{currentAssistant?.name}</strong>? Tej akcji nie można cofnąć.
					</p>
				</div>

				<div className="modal-actions">
					<button className="modal-button modal-button-secondary" onClick={closeDeleteModal} disabled={isSubmitting}>
						<X size={16} strokeWidth={1.5} />
						Anuluj
					</button>
					<button className="modal-button modal-button-danger" onClick={handleDeleteAssistant} disabled={isSubmitting}>
						{isSubmitting ? (
							<>
								<div className="loading-spinner-small"></div>
								Usuwanie...
							</>
						) : (
							<>
								<Trash2 size={16} strokeWidth={1.5} />
								Usuń Asystenta
							</>
						)}
					</button>
				</div>
			</Modal>
		</div>
	)
}

export default Assistants

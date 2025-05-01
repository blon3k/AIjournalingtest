import React, { useState, useEffect } from 'react'
import { X, Send, Tag, Info, Plus, FileCode, User, MessageSquare } from 'lucide-react'
import Modal from './Modal'
import './SharePostModal.css'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import userService from '../../services/userService'
import postService from '../../services/postService'

const SharePostModal = ({ isOpen, onClose, sharedContent }) => {
	const navigate = useNavigate()
	const { user } = useAuth()
	const [formData, setFormData] = useState({
		title: '',
		content: '',
		tags: [],
		customTag: '',
	})
	const [showAttachmentOptions, setShowAttachmentOptions] = useState(false)
	const [attachmentType, setAttachmentType] = useState(null)

	// State for actual user data
	const [userAssistants, setUserAssistants] = useState([])
	const [userPrompts, setUserPrompts] = useState([])
	const [isLoadingAttachments, setIsLoadingAttachments] = useState(false)

	// Sample data for summaries (kept for now)
	const [summaries] = useState([
		{ id: 1, content: 'Podsumowanie dotyczące kampanii marketingowej dla nowej linii produktów...' },
		{ id: 2, content: 'Podsumowanie analizy danych sprzedażowych za ostatni kwartał...' },
		{ id: 3, content: 'Podsumowanie strategii rozwoju produktu na najbliższe 6 miesięcy...' },
	])

	// Current selections
	const [selectedAssistant, setSelectedAssistant] = useState(null)
	const [selectedPrompt, setSelectedPrompt] = useState(null)
	const [selectedSummary, setSelectedSummary] = useState(null)

	// Fetch user attachments when modal opens
	useEffect(() => {
		console.log('[SharePostModal] useEffect Triggered - isOpen:', isOpen, 'User:', user)
		// Ensure modal is open AND user object exists AND has an id before fetching
		if (isOpen && user && (user.id || user._id)) {
			const userId = user.id || user._id
			const fetchAttachments = async () => {
				console.log('[SharePostModal] Fetching attachments for user:', userId)
				setIsLoadingAttachments(true)
				try {
					const [assistantsRes, promptsRes] = await Promise.all([
						userService.getUserAssistants(userId),
						userService.getUserSystemPrompts(userId),
					])
					console.log('[SharePostModal] Fetched Assistants:', assistantsRes)
					console.log('[SharePostModal] Fetched Prompts:', promptsRes)
					setUserAssistants(assistantsRes || [])
					setUserPrompts(promptsRes || [])
				} catch (error) {
					console.error('[SharePostModal] Error fetching user attachments:', error)
				} finally {
					setIsLoadingAttachments(false)
				}
			}
			fetchAttachments()
		} else if (isOpen && !user) {
			// If modal is open but user is not yet loaded (or not logged in)
			console.warn('[SharePostModal] Modal opened, waiting for user data...')
			// Optionally clear previous state if needed
			setUserAssistants([])
			setUserPrompts([])
			setIsLoadingAttachments(true) // Show loading while waiting for user
		}
	}, [isOpen, user]) // Dependency array remains the same

	// Reset form data when sharedContent changes or modal opens
	useEffect(() => {
		if (isOpen) {
			if (sharedContent) {
				setFormData({
					title: sharedContent.title || '',
					content: sharedContent.content || '',
					tags: sharedContent.tags || [],
					customTag: '',
				})

				// Set initial selections based on sharedContent
				setSelectedAssistant(sharedContent.assistant || null)
				setSelectedPrompt(sharedContent.systemPrompt || null)
				setSelectedSummary(sharedContent.summary ? { id: Date.now(), content: sharedContent.summary } : null)
			} else {
				// Reset form if no shared content
				setFormData({ title: '', content: '', tags: [], customTag: '' })
				setSelectedAssistant(null)
				setSelectedPrompt(null)
				setSelectedSummary(null)
			}
			setShowAttachmentOptions(false)
			setAttachmentType(null)
		}
	}, [isOpen, sharedContent])

	const handleInputChange = e => {
		const { name, value } = e.target
		setFormData(prev => ({
			...prev,
			[name]: value,
		}))
	}

	const handleAddTag = () => {
		if (formData.customTag.trim() && !formData.tags.includes(formData.customTag.trim())) {
			setFormData(prev => ({
				...prev,
				tags: [...prev.tags, formData.customTag.trim()],
				customTag: '',
			}))
		}
	}

	const handleRemoveTag = tagToRemove => {
		setFormData(prev => ({
			...prev,
			tags: prev.tags.filter(tag => tag !== tagToRemove),
		}))
	}

	const handleKeyDown = e => {
		if (e.key === 'Enter') {
			e.preventDefault()
			handleAddTag()
		}
	}

	const handleSubmit = async () => {
		try {
			const postData = {
				title: formData.title,
				content: formData.content,
				tags: formData.tags,
				authorAvatar: user?.avatar || '',
				// Send only relevant fields, not the full objects if they contain extra data like _id
				assistant: selectedAssistant
					? {
							name: selectedAssistant.name,
							description: selectedAssistant.description,
							role: selectedAssistant.instructions, // Assuming role maps to instructions for display?
							avatar: selectedAssistant.avatarImage || '', // Use avatarImage
					  }
					: null,
				systemPrompt: selectedPrompt
					? {
							title: selectedPrompt.title,
							content: selectedPrompt.content,
							category: selectedPrompt.category,
					  }
					: null,
				// summary: selectedSummary?.content, // Add summary if backend supports it
			}

			// Filter out null attachments
			if (!postData.assistant) delete postData.assistant
			if (!postData.systemPrompt) delete postData.systemPrompt

			await postService.createPost(postData)

			console.log('Sharing post:', postData)
			alert('Post został udostępniony w społeczności!')
			onClose()
			// Navigate to the community page to see the new post
			navigate('/community')
		} catch (error) {
			console.error('Error creating post:', error)
			alert('Wystąpił błąd podczas udostępniania posta.')
		}
	}

	const handleAttachmentSelect = type => {
		setAttachmentType(type)
		setShowAttachmentOptions(false)
	}

	// Keep only necessary fields for the post schema
	const handleSelectAssistant = assistant => {
		setSelectedAssistant({
			name: assistant.name,
			description: assistant.description,
			instructions: assistant.instructions, // Keep instructions for display/potential use
			avatarImage: assistant.avatarImage || '', // Use avatarImage
		})
		setAttachmentType(null)
	}

	const handleSelectPrompt = prompt => {
		setSelectedPrompt({
			title: prompt.title,
			content: prompt.content,
			category: prompt.category,
		})
		setAttachmentType(null)
	}

	const handleSelectSummary = summary => {
		setSelectedSummary(summary)
		setAttachmentType(null)
	}

	const handleRemoveAttachment = type => {
		switch (type) {
			case 'assistant':
				setSelectedAssistant(null)
				break
			case 'prompt':
				setSelectedPrompt(null)
				break
			case 'summary':
				setSelectedSummary(null)
				break
			default:
				break
		}
	}

	// Pre-defined tags that users can quickly add
	const suggestedTags = ['AI', 'Prompty', 'Asystenci', 'Porady', 'Tutorial', 'Techniczne']

	// Helper function to get initials from name
	const getInitials = name => {
		if (!name) return '?'
		return name
			.split(' ')
			.map(part => part[0])
			.join('')
			.toUpperCase()
			.substring(0, 2)
	}

	console.log('[SharePostModal] Rendering - userPrompts state:', userPrompts)

	return (
		<Modal isOpen={isOpen} onClose={onClose} title="Udostępnij w społeczności" size="medium">
			<div className="share-post-form">
				<div className="form-group">
					<label htmlFor="title">Tytuł</label>
					<input
						type="text"
						id="title"
						name="title"
						value={formData.title}
						onChange={handleInputChange}
						placeholder="Wpisz krótki, opisowy tytuł..."
						required
					/>
				</div>

				<div className="form-group">
					<label htmlFor="content">Treść</label>
					<textarea
						id="content"
						name="content"
						value={formData.content}
						onChange={handleInputChange}
						placeholder="Opisz szczegóły tego, co chcesz udostępnić..."
						rows={6}
						required
					/>
				</div>

				{/* Attachments section */}
				<div className="form-group attachments-section">
					<div className="attachments-header">
						<label>Załączniki</label>
						<div className="attachment-actions">
							{!showAttachmentOptions ? (
								<button type="button" className="add-attachment-button" onClick={() => setShowAttachmentOptions(true)}>
									<Plus size={16} />
									<span>Dodaj załącznik</span>
								</button>
							) : (
								<div className="attachment-options">
									<button
										type="button"
										className="attachment-option"
										onClick={() => handleAttachmentSelect('assistant')}
										disabled={selectedAssistant !== null || isLoadingAttachments}>
										<User size={16} />
										<span>Asystent</span>
									</button>
									<button
										type="button"
										className="attachment-option"
										onClick={() => handleAttachmentSelect('prompt')}
										disabled={selectedPrompt !== null || isLoadingAttachments}>
										<FileCode size={16} />
										<span>Prompt</span>
									</button>
									<button
										type="button"
										className="attachment-option"
										onClick={() => handleAttachmentSelect('summary')}
										disabled={selectedSummary !== null}>
										<MessageSquare size={16} />
										<span>Podsumowanie</span>
									</button>
									<button
										type="button"
										className="attachment-option-cancel"
										onClick={() => setShowAttachmentOptions(false)}>
										<X size={16} />
										<span>Anuluj</span>
									</button>
								</div>
							)}
						</div>
					</div>

					{/* Attachment selection panels */}
					{isLoadingAttachments ? (
						<div className="attachments-loading">Ładowanie załączników...</div>
					) : (
						<>
							{attachmentType === 'assistant' && (
								<div className="attachment-panel">
									<h4>Wybierz asystenta</h4>
									{userAssistants.length > 0 ? (
										<div className="attachment-list">
											{userAssistants.map(assistant => (
												<div
													key={assistant._id}
													className="attachment-item"
													onClick={() => handleSelectAssistant(assistant)}>
													<div className="assistant-preview">
														{assistant.avatarImage ? (
															<img
																src={assistant.avatarImage}
																alt={assistant.name}
																className="assistant-avatar-small"
															/>
														) : (
															<div
																className="assistant-avatar-small"
																style={{ backgroundColor: assistant.avatarColor }}>
																{getInitials(assistant.name)}
															</div>
														)}
														<div>
															<strong>{assistant.name}</strong>
															<p>{assistant.description}</p>
														</div>
													</div>
												</div>
											))}
										</div>
									) : (
										<p className="no-attachments">Nie masz jeszcze żadnych asystentów.</p>
									)}
								</div>
							)}

							{attachmentType === 'prompt' && (
								<div className="attachment-panel">
									<h4>Wybierz prompt systemowy</h4>
									{userPrompts.length > 0 ? (
										<div className="attachment-list">
											{userPrompts.map(prompt => (
												<div key={prompt._id} className="attachment-item" onClick={() => handleSelectPrompt(prompt)}>
													<div className="prompt-preview">
														<strong>{prompt.title}</strong>
														<p>{prompt.content.substring(0, 100)}...</p>
													</div>
												</div>
											))}
										</div>
									) : (
										<p className="no-attachments">Nie masz jeszcze żadnych promptów systemowych.</p>
									)}
								</div>
							)}

							{attachmentType === 'summary' && (
								<div className="attachment-panel">
									<h4>Wybierz podsumowanie</h4>
									{summaries.length > 0 ? (
										<div className="attachment-list">
											{summaries.map(summary => (
												<div key={summary.id} className="attachment-item" onClick={() => handleSelectSummary(summary)}>
													<div className="summary-preview">
														<p>{summary.content.substring(0, 100)}...</p>
													</div>
												</div>
											))}
										</div>
									) : (
										<p className="no-attachments">Brak dostępnych podsumowań.</p>
									)}
								</div>
							)}
						</>
					)}

					{/* Display selected attachments */}
					<div className="selected-attachments">
						{selectedAssistant && (
							<div className="shared-assistant">
								<div className="shared-header">
									<h4>Dołączony asystent</h4>
									<button className="remove-attachment" onClick={() => handleRemoveAttachment('assistant')}>
										<X size={14} />
									</button>
								</div>
								<div className="shared-assistant-content">
									<div className="assistant-preview">
										{selectedAssistant.avatarImage ? (
											<img
												src={selectedAssistant.avatarImage}
												alt={selectedAssistant.name}
												className="assistant-avatar"
											/>
										) : (
											<div className="assistant-avatar" style={{ backgroundColor: selectedAssistant.avatarColor }}>
												{getInitials(selectedAssistant.name)}
											</div>
										)}
										<div>
											<strong>{selectedAssistant.name}</strong>
											<p>{selectedAssistant.description}</p>
										</div>
									</div>
								</div>
							</div>
						)}

						{selectedPrompt && (
							<div className="shared-prompt">
								<div className="shared-header">
									<h4>Dołączony prompt systemowy</h4>
									<button className="remove-attachment" onClick={() => handleRemoveAttachment('prompt')}>
										<X size={14} />
									</button>
								</div>
								<div className="shared-prompt-content">
									<strong>{selectedPrompt.title}</strong>
									<p>{selectedPrompt.content}</p>
								</div>
							</div>
						)}

						{selectedSummary && (
							<div className="shared-summary">
								<div className="shared-header">
									<h4>Dołączone podsumowanie</h4>
									<button className="remove-attachment" onClick={() => handleRemoveAttachment('summary')}>
										<X size={14} />
									</button>
								</div>
								<div className="shared-summary-content">
									<p>{selectedSummary.content}</p>
								</div>
							</div>
						)}
					</div>
				</div>

				<div className="form-group">
					<label>Tagi</label>
					<div className="tags-container">
						<div className="tags-input-container">
							<input
								type="text"
								placeholder="Dodaj tag i naciśnij Enter..."
								value={formData.customTag}
								onChange={e => setFormData(prev => ({ ...prev, customTag: e.target.value }))}
								onKeyDown={handleKeyDown}
							/>
							<button type="button" onClick={handleAddTag} className="add-tag-button">
								<Tag size={16} />
							</button>
						</div>
						<div className="suggested-tags">
							{suggestedTags.map(tag => (
								<button
									key={tag}
									type="button"
									className="suggested-tag"
									onClick={() => {
										if (!formData.tags.includes(tag)) {
											setFormData(prev => ({
												...prev,
												tags: [...prev.tags, tag],
											}))
										}
									}}>
									{tag}
								</button>
							))}
						</div>
					</div>
					<div className="tags-display">
						{formData.tags.map(tag => (
							<span key={tag} className="tag-badge">
								{tag}
								<button onClick={() => handleRemoveTag(tag)} className="remove-tag">
									<X size={12} />
								</button>
							</span>
						))}
					</div>
				</div>

				<div className="form-info">
					<Info size={16} />
					<span>Twój post będzie widoczny dla wszystkich użytkowników społeczności.</span>
				</div>
			</div>

			<div className="modal-actions">
				<button onClick={onClose} className="modal-button modal-button-secondary">
					<X size={16} strokeWidth={1.5} />
					Anuluj
				</button>
				<button
					onClick={handleSubmit}
					className="modal-button modal-button-primary"
					disabled={!formData.title.trim() || !formData.content.trim()}>
					<Send size={16} strokeWidth={1.5} />
					Udostępnij
				</button>
			</div>
		</Modal>
	)
}

export default SharePostModal

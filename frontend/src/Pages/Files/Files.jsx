import React, { useState, useRef, useEffect } from 'react'
import '../Settings/Settings.css' // Correctly reference Settings.css from the Settings folder
import './Files.css' // Specific styles for Files component
import {
	File,
	FileText,
	Image,
	Upload,
	Trash2,
	Download,
	Plus,
	Save,
	Search,
	X,
	Check,
	Eye,
	Clock,
	Tag,
	Calendar,
	AlertCircle,
} from 'lucide-react'
import Modal from '../../components/modal/Modal'
import SecondarySidebar from '../../components/SecondarySidebar'
import fileService from '../../services/fileService' // Import the new service
import userService from '../../services/userService' // We might need user ID, let's import this too
import { useAuth } from '../../context/AuthContext' // Import useAuth to get user ID

// Allowed text file extensions
const allowedExtensions = [
	'txt',
	'md',
	'js',
	'jsx',
	'ts',
	'tsx',
	'py',
	'java',
	'c',
	'cpp',
	'h',
	'hpp',
	'cs',
	'html',
	'htm',
	'css',
	'scss',
	'sass',
	'less',
	'json',
	'yaml',
	'yml',
	'xml',
	'csv',
	'log',
	'sh',
	'bash',
	'zsh',
	'sql',
	'rb',
	'php',
	'go',
	'rs',
	'swift',
	'kt',
	'kts',
]

function Files({ sidebarFilter }) {
	const { user } = useAuth() // Get user from auth context
	const [files, setFiles] = useState([])
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState(null)
	// Remove mock files state
	// const [files, setFiles] = useState([...])

	// Search and filter states
	const [searchQuery, setSearchQuery] = useState('')
	const [showUploadModal, setShowUploadModal] = useState(false)
	const [showPreviewModal, setShowPreviewModal] = useState(false)
	const [currentFile, setCurrentFile] = useState(null)
	const [selectedFile, setSelectedFile] = useState(null)
	const [showSaveButton, setShowSaveButton] = useState(false)
	const [saveSuccess, setSaveSuccess] = useState(false)
	const [saveError, setSaveError] = useState(false)
	const [isSaving, setIsSaving] = useState(false)
	const fileInputRef = useRef(null)

	// New file form data
	const [newFileData, setNewFileData] = useState({
		name: '',
		description: '',
		tags: '',
	})

	// File tags for filtering
	const [selectedTags, setSelectedTags] = useState([])
	const [selectedType, setSelectedType] = useState('all')
	const [selectedFileName, setSelectedFileName] = useState('')
	const [filterSource, setFilterSource] = useState('manual') // 'manual' or 'sidebar'

	// Upload error state
	const [uploadError, setUploadError] = useState(null)

	// Fetch files on component mount
	useEffect(() => {
		const fetchFiles = async () => {
			setIsLoading(true)
			setError(null)
			try {
				const response = await fileService.getUserFiles()
				if (response.success) {
					setFiles(response.data)
				} else {
					setError('Failed to fetch files.')
				}
			} catch (err) {
				console.error('Error fetching files:', err)
				setError(err.message || 'An error occurred while fetching files.')
			} finally {
				setIsLoading(false)
			}
		}

		if (user) {
			// Only fetch if user is logged in
			fetchFiles()
		}
	}, [user])

	// Process sidebar filter when it changes
	useEffect(() => {
		if (sidebarFilter && sidebarFilter.type) {
			handleSidebarFilter(sidebarFilter.type, sidebarFilter.value)
		}
	}, [sidebarFilter])

	// Handle filters from the secondary sidebar
	const handleSidebarFilter = (filterType, value) => {
		// Reset existing filters when applying a new one from sidebar
		if (filterSource !== 'sidebar') {
			setSelectedTags([])
			setSelectedType('all')
			setSelectedFileName('')
			setFilterSource('sidebar')
		}

		switch (filterType) {
			case 'type':
				setSelectedType(value)
				break
			case 'tag':
				// If the tag is already selected, remove it, otherwise add it
				if (selectedTags.includes(value)) {
					setSelectedTags(selectedTags.filter(tag => tag !== value))
				} else {
					setSelectedTags([...selectedTags, value])
				}
				break
			case 'file':
				setSelectedFileName(value)
				break
			default:
				break
		}
	}

	// Get all unique tags from files
	const getAllTags = () => {
		const tagsSet = new Set()
		files.forEach(file => {
			file.tags.forEach(tag => tagsSet.add(tag))
		})
		return Array.from(tagsSet)
	}

	// Get all unique file types
	const getFileTypes = () => {
		const typesSet = new Set()
		files.forEach(file => typesSet.add(file.type))
		return Array.from(typesSet)
	}

	// Get icon based on file type
	const getFileIcon = type => {
		switch (type) {
			case 'pdf':
				return <FileText size={20} strokeWidth={1.5} color="#e74c3c" />
			case 'docx':
				return <FileText size={20} strokeWidth={1.5} color="#3498db" />
			case 'xlsx':
				return <FileText size={20} strokeWidth={1.5} color="#2ecc71" />
			case 'png':
			case 'jpg':
			case 'jpeg':
				return <Image size={20} strokeWidth={1.5} color="#9b59b6" />
			default:
				return <File size={20} strokeWidth={1.5} />
		}
	}

	// Get color for file type badge
	const getTypeColor = type => {
		switch (type) {
			case 'pdf':
				return { bg: '#fce7e7', text: '#e53935' }
			case 'docx':
				return { bg: '#e3f2fd', text: '#1976d2' }
			case 'xlsx':
				return { bg: '#e8f5e9', text: '#2e7d32' }
			case 'png':
			case 'jpg':
			case 'jpeg':
				return { bg: '#f3e5f5', text: '#8e24aa' }
			case 'txt':
				return { bg: '#f5f5f5', text: '#616161' }
			case 'zip':
			case 'rar':
				return { bg: '#fff3e0', text: '#e65100' }
			case 'mp4':
			case 'avi':
			case 'mov':
				return { bg: '#e1f5fe', text: '#0288d1' }
			case 'mp3':
			case 'wav':
				return { bg: '#e8eaf6', text: '#3949ab' }
			default:
				return { bg: '#f5f5f5', text: '#7f8c8d' }
		}
	}

	// Filter files based on search query and filters
	const filteredFiles = files.filter(file => {
		// Filter by specific filename (from sidebar)
		if (selectedFileName) {
			return file.name === selectedFileName
		}

		// Filter by search query
		const matchesSearch =
			!searchQuery ||
			file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			(file.description && file.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
			(file.tags && file.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())))

		// Filter by selected file type
		const matchesType = selectedType === 'all' || file.type === selectedType

		// Filter by selected tags
		const matchesTags = selectedTags.length === 0 || (file.tags && selectedTags.every(tag => file.tags.includes(tag)))

		return matchesSearch && matchesType && matchesTags
	})

	// Toggle a tag filter
	const toggleTagFilter = tag => {
		// Switch to manual filter mode when directly clicking on tags
		setFilterSource('manual')
		setSelectedFileName('')

		if (selectedTags.includes(tag)) {
			setSelectedTags(selectedTags.filter(t => t !== tag))
		} else {
			setSelectedTags([...selectedTags, tag])
		}
	}

	// Open file preview
	const openFilePreview = file => {
		setCurrentFile(file)
		setShowPreviewModal(true)
	}

	// Handle file selection for upload
	const handleFileUpload = e => {
		const file = e.target.files[0]
		setUploadError(null) // Clear previous upload errors
		if (file) {
			const fileExtension = file.name.split('.').pop().toLowerCase()
			if (!allowedExtensions.includes(fileExtension)) {
				setUploadError(`Invalid file type: .${fileExtension}. Please upload a text-based file.`)
				setSelectedFile(null)
				setNewFileData({
					name: '',
					description: '',
					tags: '',
				})
				return
			}

			if (file.size > 25 * 1024 * 1024) {
				// 25MB limit check
				setUploadError(`File is too large (${formatFileSize(file.size)}). Maximum size is 25MB.`)
				setSelectedFile(null)
				setNewFileData({
					name: '',
					description: '',
					tags: '',
				})
				return
			}

			setSelectedFile(file)
			setNewFileData({
				...newFileData,
				name: file.name,
			})
		}
	}

	// Save new file (Upload)
	const handleSaveFile = async () => {
		if (!selectedFile) return

		setIsSaving(true)
		setSaveSuccess(false)
		setSaveError(false)
		setUploadError(null)

		const formData = new FormData()
		formData.append('file', selectedFile)
		formData.append('name', newFileData.name || selectedFile.name)
		formData.append('description', newFileData.description)
		formData.append('tags', newFileData.tags) // Send tags as a comma-separated string

		try {
			const response = await fileService.uploadFile(formData)

			if (response.success) {
				setFiles([response.data, ...files]) // Add new file to the beginning of the list
				setIsSaving(false)
				setSaveSuccess(true)

				// Reset form after successful upload
				setTimeout(() => {
					setSelectedFile(null)
					setNewFileData({
						name: '',
						description: '',
						tags: '',
					})
					setShowUploadModal(false)
					setSaveSuccess(false)
				}, 1500)
			} else {
				throw new Error(response.message || 'Upload failed.')
			}
		} catch (error) {
			console.error('Upload error:', error)
			setIsSaving(false)
			setSaveError(true)
			setUploadError(error.message || 'An error occurred during upload.')
		}
	}

	// Format file size
	const formatFileSize = bytes => {
		if (bytes === 0) return '0 B'
		const k = 1024
		const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
		const i = Math.floor(Math.log(bytes) / Math.log(k))
		return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
	}

	// Delete file
	const handleDeleteFile = async id => {
		// Optional: Add a confirmation dialog here
		try {
			const response = await fileService.deleteFile(id)
			if (response.success) {
				setFiles(files.filter(file => file._id !== id))
				// Close preview modal if the deleted file was being previewed
				if (currentFile && currentFile._id === id) {
					setShowPreviewModal(false)
					setCurrentFile(null)
				}
			} else {
				// Handle deletion error (e.g., show a notification)
				console.error('Failed to delete file:', response.message)
			}
		} catch (error) {
			console.error('Error deleting file:', error)
			// Handle deletion error (e.g., show a notification)
		}
	}

	// Download file (client-side using Blob)
	const handleDownloadFile = file => {
		if (!file || !file.content) {
			console.error('Cannot download file: content missing.')
			return
		}
		const blob = new Blob([file.content], { type: 'text/plain' }) // Adjust mime type if needed based on file.type
		const url = URL.createObjectURL(blob)
		const link = document.createElement('a')
		link.href = url
		link.download = file.name
		document.body.appendChild(link)
		link.click()
		document.body.removeChild(link)
		URL.revokeObjectURL(url)
	}

	// Format date to more readable format
	const formatDate = dateString => {
		if (!dateString) return ''
		const date = new Date(dateString)
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		})
	}

	// Show save button on scroll
	useEffect(() => {
		const handleScroll = () => {
			if (document.documentElement.scrollTop > 100) {
				setShowSaveButton(true)
			} else {
				setShowSaveButton(false)
			}
		}

		window.addEventListener('scroll', handleScroll)
		return () => {
			window.removeEventListener('scroll', handleScroll)
		}
	}, [])

	// Clear all filters
	const clearAllFilters = () => {
		setSearchQuery('')
		setSelectedTags([])
		setSelectedType('all')
		setSelectedFileName('')
		setFilterSource('manual')
	}

	// Create filter indicator text
	const getActiveFilterText = () => {
		const filters = []

		if (selectedFileName) {
			filters.push(`Plik: ${selectedFileName}`)
		}

		if (selectedType !== 'all') {
			filters.push(`Typ: ${selectedType.toUpperCase()}`)
		}

		if (selectedTags.length > 0) {
			filters.push(`Tagi: ${selectedTags.join(', ')}`)
		}

		if (filters.length === 0) {
			return null
		}

		return `Filtrowanie według: ${filters.join(' | ')}`
	}

	return (
		<div className="settings-container files-container">
			<h1 className="settings-title">Pliki</h1>
			{error && <div className="error-message">Błąd: {error}</div>}
			<div className="settings-section">
				<div className="files-layout">
					{/* Sidebar can be added back later if needed */}
					{/* <SecondarySidebar onFilter={handleSidebarFilter} files={files} /> */}

					<div className="files-main-content">
						<div className="files-header">
							<div className="files-search-container">
								<Search size={18} strokeWidth={1.5} />
								<input
									type="text"
									placeholder="Szukaj plików po nazwie, opisie lub tagach..."
									value={searchQuery}
									onChange={e => {
										setSearchQuery(e.target.value)
										// When typing in search, switch to manual mode
										if (e.target.value) {
											setFilterSource('manual')
											setSelectedFileName('')
										}
									}}
									className="files-search-input"
								/>
								{searchQuery && (
									<button className="files-search-clear" onClick={() => setSearchQuery('')} aria-label="Clear search">
										<X size={16} strokeWidth={1.5} />
									</button>
								)}
							</div>

							<button
								className="files-upload-button"
								onClick={() => {
									setUploadError(null) // Clear errors when opening modal
									setShowUploadModal(true)
								}}>
								<Upload size={18} strokeWidth={1.5} />
								<span>Prześlij</span>
							</button>
						</div>

						{getActiveFilterText() && (
							<div className="files-filter-indicator">
								{getActiveFilterText()}
								<button className="files-clear-filter-button" onClick={clearAllFilters}>
									Wyczyść filtry
								</button>
							</div>
						)}

						{(selectedTags.length > 0 || selectedType !== 'all' || selectedFileName) && (
							<div className="files-active-filters">
								<div className="files-active-filter-label">Aktywne filtry:</div>
								{selectedFileName && (
									<div className="files-active-filter">
										<span>Plik: {selectedFileName}</span>
										<button onClick={() => setSelectedFileName('')}>
											<X size={12} strokeWidth={2} />
										</button>
									</div>
								)}
								{selectedType !== 'all' && (
									<div className="files-active-filter">
										<span>Typ: {selectedType.toUpperCase()}</span>
										<button onClick={() => setSelectedType('all')}>
											<X size={12} strokeWidth={2} />
										</button>
									</div>
								)}
								{selectedTags.map(tag => (
									<div key={tag} className="files-active-filter">
										<span>{tag}</span>
										<button onClick={() => toggleTagFilter(tag)}>
											<X size={12} strokeWidth={2} />
										</button>
									</div>
								))}
							</div>
						)}

						{isLoading ? (
							<div className="loading-indicator">Ładowanie plików...</div>
						) : filteredFiles.length > 0 ? (
							<div className="files-grid">
								{filteredFiles.map(file => {
									const typeColors = getTypeColor(file.type)

									return (
										<div key={file._id} className="file-card">
											<div className="file-card-header">
												<div className="file-icon">{getFileIcon(file.type)}</div>
												<div className="file-actions">
													<button
														className="file-action-button"
														onClick={() => openFilePreview(file)}
														aria-label="Preview file">
														<Eye size={16} strokeWidth={1.5} />
													</button>
													<button
														className="file-action-button"
														onClick={() => handleDownloadFile(file)}
														aria-label="Download file">
														<Download size={16} strokeWidth={1.5} />
													</button>
													<button
														className="file-action-button delete"
														onClick={() => handleDeleteFile(file._id)}
														aria-label="Delete file">
														<Trash2 size={16} strokeWidth={1.5} />
													</button>
												</div>
												<div
													className="file-type-badge"
													style={{ backgroundColor: typeColors.bg, color: typeColors.text }}>
													{file.type.toUpperCase()}
												</div>
											</div>
											<div className="file-info">
												<div className="file-name" onClick={() => openFilePreview(file)}>
													{file.name}
												</div>
												<div className="file-meta">
													<div className="file-meta-item">
														<Calendar size={12} strokeWidth={1.5} />
														<span>{formatDate(file.createdAt)}</span>
													</div>
													<div className="file-meta-item">
														<File size={12} strokeWidth={1.5} />
														<span>{formatFileSize(file.size)}</span>
													</div>
												</div>
												<p className="file-description">{file.description || 'No description added.'}</p>
												{file.tags && file.tags.length > 0 && (
													<div className="file-tags">
														{file.tags.map((tag, index) => (
															<span
																key={index}
																className="file-tag"
																data-tag={tag.toLowerCase()}
																onClick={() => {
																	if (!selectedTags.includes(tag)) {
																		toggleTagFilter(tag)
																	}
																}}>
																<Tag size={10} strokeWidth={1.5} />
																{tag}
															</span>
														))}
													</div>
												)}
											</div>
										</div>
									)
								})}
							</div>
						) : (
							<div className="files-empty-state">
								{searchQuery || selectedTags.length > 0 || selectedType !== 'all' || selectedFileName ? (
									<>
										<Search size={48} strokeWidth={1} color="#ccc" />
										<p>Żaden plik nie pasuje do filtrów.</p>
										<button className="clear-filters-button" onClick={clearAllFilters}>
											Wyczyść filtry
										</button>
									</>
								) : (
									<>
										<File size={48} strokeWidth={1} color="#ccc" />
										<p>Nie przesłano jeszcze żadnych plików.</p>
										<button
											className="upload-first-file-button"
											onClick={() => {
												setUploadError(null)
												setShowUploadModal(true)
											}}>
											<Upload size={16} strokeWidth={1.5} />
											Prześlij swój pierwszy plik
										</button>
									</>
								)}
							</div>
						)}
					</div>
				</div>
			</div>
			{/* Upload File Modal */}
			<Modal
				isOpen={showUploadModal}
				onClose={() => setShowUploadModal(false)}
				title="Prześlij nowy plik"
				size="medium">
				{/* Display Upload Error */}
				{uploadError && (
					<div className="save-error modal-error" style={{ marginBottom: '16px' }}>
						<AlertCircle size={18} strokeWidth={1.5} />
						{uploadError}
					</div>
				)}

				<div className="form-group">
					<label>Wybierz plik</label>
					<div className="upload-container">
						{selectedFile ? (
							<div className="selected-file">
								<div className="selected-file-icon">
									{getFileIcon(selectedFile.name.split('.').pop().toLowerCase())}
								</div>
								<div className="selected-file-info">
									<span className="selected-file-name">{selectedFile.name}</span>
									<span className="selected-file-size">{formatFileSize(selectedFile.size)}</span>
								</div>
								<button
									className="remove-selected-file"
									onClick={() => setSelectedFile(null)}
									aria-label="Remove selected file">
									<X size={16} strokeWidth={1.5} />
								</button>
							</div>
						) : (
							<>
								<button className="upload-button" onClick={() => fileInputRef.current && fileInputRef.current.click()}>
									<Upload size={18} strokeWidth={1.5} />
									<span>Wybierz plik tekstowy</span>
								</button>
								<p className="upload-hint">
									Maksymalny rozmiar: 25MB. Dozwolone typy: {allowedExtensions.slice(0, 5).join(', ')}...
								</p>
							</>
						)}
						<input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} />
					</div>
				</div>

				{selectedFile && (
					<>
						<div className="form-group">
							<label htmlFor="file-name">Nazwa pliku</label>
							<input
								type="text"
								id="file-name"
								value={newFileData.name}
								onChange={e => setNewFileData({ ...newFileData, name: e.target.value })}
								placeholder="Wprowadź nazwę pliku"
							/>
						</div>

						<div className="form-group">
							<label htmlFor="file-description">Opis</label>
							<textarea
								id="file-description"
								value={newFileData.description}
								onChange={e => setNewFileData({ ...newFileData, description: e.target.value })}
								placeholder="Dodaj opis tego pliku"
								rows={3}
							/>
						</div>

						<div className="form-group">
							<label htmlFor="file-tags">Tagi</label>
							<input
								type="text"
								id="file-tags"
								value={newFileData.tags}
								onChange={e => setNewFileData({ ...newFileData, tags: e.target.value })}
								placeholder="Dodaj tagi oddzielone przecinkami (np. projekt, design, raport)"
							/>
							<p className="input-hint">Tagi pomagają łatwiej wyszukiwać pliki</p>
						</div>
					</>
				)}

				<div className="modal-actions">
					<button className="modal-button modal-button-secondary" onClick={() => setShowUploadModal(false)}>
						Anuluj
					</button>
					<button
						className="modal-button modal-button-primary"
						onClick={handleSaveFile}
						disabled={!selectedFile || isSaving}>
						{isSaving ? (
							<>
								<div className="button-loader"></div>
								Przesyłanie...
							</>
						) : (
							<>
								<Save size={16} strokeWidth={1.5} />
								Prześlij plik
							</>
						)}
					</button>
				</div>

				{saveSuccess && (
					<div className="save-success modal-success">
						<Check size={18} strokeWidth={1.5} />
						Plik został przesłany pomyślnie!
					</div>
				)}

				{saveError && !uploadError && (
					<div className="save-error modal-error">Przesyłanie nie powiodło się. Spróbuj ponownie.</div>
				)}
			</Modal>
			{/* File Preview Modal */}
			<Modal
				isOpen={showPreviewModal}
				onClose={() => setShowPreviewModal(false)}
				title={currentFile ? currentFile.name : 'Podgląd pliku'}
				size="large">
				{currentFile && (
					<div className="file-preview-container">
						<div className="file-preview-header">
							<div className="file-preview-info">
								<div className="file-preview-icon">{getFileIcon(currentFile.type)}</div>
								<div className="file-preview-details">
									<div className="file-preview-title">{currentFile.name}</div>
									<div className="file-preview-meta">
										<div className="file-meta-item">
											<Calendar size={12} strokeWidth={1.5} />
											<span>{formatDate(currentFile.createdAt)}</span>
										</div>
										<div className="file-meta-item">
											<File size={12} strokeWidth={1.5} />
											<span>{formatFileSize(currentFile.size)}</span>
										</div>
									</div>
								</div>
							</div>

							<div
								className="file-preview-type"
								style={{
									backgroundColor: getTypeColor(currentFile.type).bg,
									color: getTypeColor(currentFile.type).text,
								}}>
								{currentFile.type.toUpperCase()}
							</div>
						</div>

						<div className="file-preview-description">
							<p>{currentFile.description || 'Brak opisu.'}</p>

							{currentFile.tags && currentFile.tags.length > 0 && (
								<div className="file-tags preview-tags">
									{currentFile.tags.map((tag, index) => (
										<span key={index} className="file-tag">
											<Tag size={10} strokeWidth={1.5} />
											{tag}
										</span>
									))}
								</div>
							)}
						</div>

						<div className="file-preview-content">
							{currentFile.content ? (
								<div className="file-preview-text">
									<pre>{currentFile.content}</pre>
								</div>
							) : (
								<div className="file-preview-unavailable">
									<File size={48} strokeWidth={1} color="#ccc" />
									<p>Zawartość niedostępna lub plik jest pusty.</p>
								</div>
							)}
						</div>

						<div className="file-preview-actions">
							<button
								className="modal-button modal-button-secondary"
								onClick={() => handleDownloadFile(currentFile)}
								disabled={!currentFile.content}>
								<Download size={16} strokeWidth={1.5} />
								Pobierz
							</button>
						</div>
					</div>
				)}
			</Modal>
		</div>
	)
}

export default Files

import React, { useState, useRef, useEffect } from 'react'
import './Settings.css' // Using the same styles as Settings for now
import {
	Check,
	Plus,
	X,
	Save,
	Brain,
	User,
	Target,
	Award,
	Book,
	FileText,
	Upload,
	Trash2,
	Briefcase,
	Building,
	PlusCircle,
	Edit,
	FolderOpen,
	Loader,
	AlertTriangle,
} from 'lucide-react'
import Modal from './modal/Modal'
import userService from '../services/userService'
import { useAuth } from '../context/AuthContext'

function Context({ sidebarFilter, updateSidebarFilter }) {
	const { user } = useAuth()

	// States for various sections
	const [generalInfo, setGeneralInfo] = useState('')
	const [importantInfo, setImportantInfo] = useState('')
	const [strengths, setStrengths] = useState('')
	const [weaknesses, setWeaknesses] = useState('')
	const [longTermGoals, setLongTermGoals] = useState('')
	const [shortTermGoals, setShortTermGoals] = useState('')
	const [showSaveButton, setShowSaveButton] = useState(false)
	const [saveSuccess, setSaveSuccess] = useState(false)
	const [saveError, setSaveError] = useState(false)
	const [isSaving, setIsSaving] = useState(false)
	const [activeSection, setActiveSection] = useState('general_info')
	const [isLoading, setIsLoading] = useState(true)
	const [hasChanges, setHasChanges] = useState(false)

	// File attachment states for each section
	const [sectionFiles, setSectionFiles] = useState({
		general_info: [],
		important_info: [],
		projects_business: [],
		strengths: [],
		weaknesses: [],
		long_term: [],
		short_term: [],
	})

	// File selection modal states
	const [showFileModal, setShowFileModal] = useState(false)
	const [activeFileSection, setActiveFileSection] = useState(null)
	const [fileUploadType, setFileUploadType] = useState('upload') // 'upload' or 'existing'

	// Existing files (mock data - would be fetched from Files component in a real app)
	const [existingFiles, setExistingFiles] = useState([])

	// Selected files for file selection modal
	const [selectedExistingFiles, setSelectedExistingFiles] = useState([])

	// Projects & Business state
	const [projects, setProjects] = useState([
		{
			id: 'project-1',
			name: '',
			description: '',
			status: '',
			vision: '',
		},
	])

	// File input refs for each section
	const fileInputRefs = {
		general_info: useRef(null),
		important_info: useRef(null),
		projects_business: useRef(null),
		strengths: useRef(null),
		weaknesses: useRef(null),
		long_term: useRef(null),
		short_term: useRef(null),
	}

	// Fetch context data on component mount
	useEffect(() => {
		if (user && user._id) {
			fetchContextData()
		}
	}, [user])

	// Fetch context data from API
	const fetchContextData = async () => {
		try {
			setIsLoading(true)
			const contextData = await userService.getUserContext(user._id)

			if (contextData) {
				// Set state values from API data
				setGeneralInfo(contextData.generalInfo || '')
				setImportantInfo(contextData.importantInfo || '')
				setStrengths(contextData.strengths || '')
				setWeaknesses(contextData.weaknesses || '')
				setLongTermGoals(contextData.longTermGoals || '')
				setShortTermGoals(contextData.shortTermGoals || '')

				// Set projects from API data if available
				if (contextData.projects && contextData.projects.length > 0) {
					setProjects(contextData.projects)
				}

				// Handle files if they exist in the response
				if (contextData.files && contextData.files.length > 0) {
					// Organize files by section
					const filesBySections = {
						general_info: [],
						important_info: [],
						projects_business: [],
						strengths: [],
						weaknesses: [],
						long_term: [],
						short_term: [],
					}

					contextData.files.forEach(file => {
						if (filesBySections[file.section]) {
							filesBySections[file.section].push({
								id: file.fileId,
								name: file.name,
								type: file.name.split('.').pop().toLowerCase(),
								size: 'Fetched from server',
								section: file.section,
							})
						}
					})

					setSectionFiles(filesBySections)
				}
			}

			setHasChanges(false)
		} catch (error) {
			console.error('Error fetching context data:', error)
		} finally {
			setIsLoading(false)
		}
	}

	// Handle filters from the sidebar
	useEffect(() => {
		if (sidebarFilter && sidebarFilter.type) {
			console.log(`Applying context sidebar filter: ${sidebarFilter.type} - ${sidebarFilter.value}`)

			// Handle different filter types
			if (sidebarFilter.type === 'section') {
				setActiveSection(sidebarFilter.value)
				scrollToSection(sidebarFilter.value)
			}
		}
	}, [sidebarFilter])

	// Scroll to a specific section
	const scrollToSection = sectionId => {
		const section = document.getElementById(sectionId)
		if (section) {
			section.scrollIntoView({ behavior: 'smooth', block: 'start' })
		}
	}

	// Handle text changes
	const handleTextChange = (field, value) => {
		switch (field) {
			case 'generalInfo':
				setGeneralInfo(value)
				break
			case 'importantInfo':
				setImportantInfo(value)
				break
			case 'strengths':
				setStrengths(value)
				break
			case 'weaknesses':
				setWeaknesses(value)
				break
			case 'longTermGoals':
				setLongTermGoals(value)
				break
			case 'shortTermGoals':
				setShortTermGoals(value)
				break
			default:
				break
		}
		setHasChanges(true)
	}

	// Show fixed save button when changes are detected
	useEffect(() => {
		if (hasChanges) {
			setShowSaveButton(true)
		} else {
			setShowSaveButton(false)
		}
	}, [hasChanges])

	// Save context settings
	const saveContext = async () => {
		if (!user || !user._id) return

		setIsSaving(true)
		setSaveSuccess(false)
		setSaveError(false)

		try {
			// Prepare context data object
			const contextData = {
				generalInfo,
				importantInfo,
				strengths,
				weaknesses,
				longTermGoals,
				shortTermGoals,
				projects,
				// Format files for API
				files: Object.keys(sectionFiles).reduce((acc, section) => {
					return [
						...acc,
						...sectionFiles[section].map(file => ({
							name: file.name,
							fileId: file.id,
							section,
						})),
					]
				}, []),
			}

			// Send data to API
			await userService.updateUserContext(user._id, contextData)

			setSaveSuccess(true)
			setHasChanges(false)

			// Reset success message after 3 seconds
			setTimeout(() => {
				setSaveSuccess(false)
			}, 3000)
		} catch (error) {
			console.error('Error saving context:', error)
			setSaveError(true)

			// Reset error message after 3 seconds
			setTimeout(() => {
				setSaveError(false)
			}, 3000)
		} finally {
			setIsSaving(false)
		}
	}

	// Open file selection modal
	const openFileModal = section => {
		setActiveFileSection(section)
		setSelectedExistingFiles([])
		setFileUploadType('upload')
		setShowFileModal(true)
	}

	// Toggle file selection
	const toggleFileSelection = file => {
		if (selectedExistingFiles.find(f => f.id === file.id)) {
			setSelectedExistingFiles(selectedExistingFiles.filter(f => f.id !== file.id))
		} else {
			setSelectedExistingFiles([...selectedExistingFiles, file])
		}
	}

	// Add selected files to section
	const addSelectedFiles = () => {
		if (fileUploadType === 'existing' && selectedExistingFiles.length > 0) {
			setSectionFiles({
				...sectionFiles,
				[activeFileSection]: [...sectionFiles[activeFileSection], ...selectedExistingFiles],
			})
			setShowFileModal(false)
			setHasChanges(true)
		}
	}

	// File handling functions
	const handleFileUpload = (section, e) => {
		const files = Array.from(e.target.files)
		if (files.length > 0) {
			// Create new file objects with id and metadata
			const newFiles = files.map(file => ({
				id: Date.now() + Math.random().toString(36).substr(2, 9),
				name: file.name,
				size: (file.size / 1024).toFixed(2) + ' KB',
				type: file.name.split('.').pop().toLowerCase(),
				file: file,
				section: section,
			}))

			setSectionFiles({
				...sectionFiles,
				[section]: [...sectionFiles[section], ...newFiles],
			})

			setHasChanges(true)

			// If modal is open, close it after upload
			if (showFileModal) {
				setShowFileModal(false)
			}
		}
	}

	const triggerFileUpload = section => {
		fileInputRefs[section].current.click()
	}

	const removeFile = (section, id) => {
		setSectionFiles({
			...sectionFiles,
			[section]: sectionFiles[section].filter(file => file.id !== id),
		})
		setHasChanges(true)
	}

	const getFileIcon = type => {
		switch (type) {
			case 'pdf':
				return <FileText size={18} strokeWidth={1.5} color="#e74c3c" />
			case 'docx':
				return <FileText size={18} strokeWidth={1.5} color="#3498db" />
			case 'xlsx':
				return <FileText size={18} strokeWidth={1.5} color="#2ecc71" />
			case 'png':
			case 'jpg':
			case 'jpeg':
				return <FileText size={18} strokeWidth={1.5} color="#9b59b6" />
			default:
				return <FileText size={18} strokeWidth={1.5} />
		}
	}

	// Add new project
	const addNewProject = () => {
		const newProject = {
			id: 'project-' + (projects.length + 1),
			name: '',
			description: '',
			status: '',
			vision: '',
		}
		setProjects([...projects, newProject])
		setHasChanges(true)
	}

	// Update project field
	const updateProject = (id, field, value) => {
		const updatedProjects = projects.map(project => (project.id === id ? { ...project, [field]: value } : project))
		setProjects(updatedProjects)
		setHasChanges(true)
	}

	// Remove project
	const removeProject = id => {
		setProjects(projects.filter(project => project.id !== id))
		setHasChanges(true)
	}

	// Render file attachment component
	const renderFileAttachments = section => {
		return (
			<div className="section-file-attachments">
				<div className="file-header">
					<h3>Załączniki</h3>
					<input
						type="file"
						ref={fileInputRefs[section]}
						onChange={e => handleFileUpload(section, e)}
						style={{ display: 'none' }}
						multiple
					/>
					<button className="attach-file-button" onClick={() => openFileModal(section)}>
						<PlusCircle size={16} strokeWidth={1.5} />
						<span>Dodaj pliki</span>
					</button>
				</div>

				{sectionFiles[section].length > 0 && (
					<div className="attached-files-list">
						{sectionFiles[section].map(file => (
							<div className="attached-file-item" key={file.id}>
								<div className="attached-file-icon">{getFileIcon(file.type)}</div>
								<div className="attached-file-info">
									<div className="attached-file-name">{file.name}</div>
									<div className="attached-file-size">{file.size}</div>
								</div>
								<button className="remove-file-button" onClick={() => removeFile(section, file.id)}>
									<Trash2 size={16} strokeWidth={1.5} />
								</button>
							</div>
						))}
					</div>
				)}
			</div>
		)
	}

	if (isLoading) {
		return (
			<div className="settings-container">
				<div className="settings-loading">
					<Loader size={24} className="animate-spin" />
					<p>Ładowanie ustawień kontekstu...</p>
				</div>
			</div>
		)
	}

	return (
		<div className="settings-container">
			<h1 className="settings-title">Ustawienia Kontekstu</h1>

			<div id="general_info" className={`settings-section ${activeSection === 'general_info' ? 'active-section' : ''}`}>
				<h2>Ogólne informacje</h2>
				<p className="settings-description">
					Podstawowe informacje o Tobie, które pomogą AI lepiej zrozumieć kontekst Twoich pytań i dopasować odpowiedzi
					do Twojej sytuacji.
				</p>
				<textarea
					className="settings-textarea"
					value={generalInfo}
					onChange={e => handleTextChange('generalInfo', e.target.value)}
					placeholder="Wprowadź podstawowe informacje o sobie (wiek, zawód, wykształcenie, itp.)..."
				/>
				{renderFileAttachments('general_info')}
			</div>

			<div
				id="important_info"
				className={`settings-section ${activeSection === 'important_info' ? 'active-section' : ''}`}>
				<h2>Ważne informacje kontekstowe</h2>
				<p className="settings-description">
					Określ jakie aktualnie ważne informacje kontekstowe powinien znać system (np. trwające projekty, ważne
					wydarzenia, itp.).
				</p>
				<textarea
					className="settings-textarea"
					value={importantInfo}
					onChange={e => handleTextChange('importantInfo', e.target.value)}
					placeholder="Wprowadź ważne informacje kontekstowe..."
				/>
				{renderFileAttachments('important_info')}
			</div>

			<div
				id="projects_business"
				className={`settings-section ${activeSection === 'projects_business' ? 'active-section' : ''}`}>
				<div className="section-header-with-action">
					<h2>Projekty & Biznes</h2>
					<button className="add-project-button" onClick={addNewProject}>
						<Plus size={16} strokeWidth={1.5} />
						Dodaj nowy projekt
					</button>
				</div>
				<p className="settings-description">
					Zarządzaj projektami i działalnością biznesową, aby AI mogło lepiej zrozumieć Twój kontekst zawodowy.
				</p>

				<div className="projects-list">
					{projects.map(project => (
						<div className="project-item" key={project.id}>
							<div className="project-header">
								<div className="project-icon">
									<Briefcase size={20} strokeWidth={1.5} />
								</div>
								<input
									type="text"
									className="project-name-input"
									value={project.name}
									onChange={e => updateProject(project.id, 'name', e.target.value)}
									placeholder="Nazwa projektu"
								/>
								<button className="remove-project-button" onClick={() => removeProject(project.id)}>
									<X size={16} strokeWidth={1.5} />
								</button>
							</div>

							<div className="project-details">
								<div className="project-field">
									<label>Status:</label>
									<input
										type="text"
										value={project.status}
										onChange={e => updateProject(project.id, 'status', e.target.value)}
										placeholder="Status projektu"
									/>
								</div>

								<div className="project-field">
									<label>Opis:</label>
									<textarea
										value={project.description}
										onChange={e => updateProject(project.id, 'description', e.target.value)}
										placeholder="Opis projektu, cele, założenia..."
									/>
								</div>

								<div className="project-field">
									<label>Wizja:</label>
									<textarea
										value={project.vision}
										onChange={e => updateProject(project.id, 'vision', e.target.value)}
										placeholder="Wizja projektu, długoterminowe plany..."
									/>
								</div>
							</div>
						</div>
					))}
				</div>

				{renderFileAttachments('projects_business')}
			</div>

			<div id="strengths" className={`settings-section ${activeSection === 'strengths' ? 'active-section' : ''}`}>
				<h2>Mocne strony</h2>
				<p className="settings-description">
					Twoje kluczowe umiejętności, wiedza i mocne strony, które AI może wziąć pod uwagę przy odpowiadaniu na
					pytania.
				</p>
				<textarea
					className="settings-textarea"
					value={strengths}
					onChange={e => handleTextChange('strengths', e.target.value)}
					placeholder="Wprowadź swoje mocne strony i kluczowe umiejętności..."
				/>
				{renderFileAttachments('strengths')}
			</div>

			<div id="weaknesses" className={`settings-section ${activeSection === 'weaknesses' ? 'active-section' : ''}`}>
				<h2>Słabe strony</h2>
				<p className="settings-description">
					Obszary, w których potrzebujesz dodatkowego wsparcia lub chcesz się rozwijać. Pomoże to AI w dostosowaniu
					odpowiedzi.
				</p>
				<textarea
					className="settings-textarea"
					value={weaknesses}
					onChange={e => handleTextChange('weaknesses', e.target.value)}
					placeholder="Wprowadź obszary, w których chcesz się rozwijać..."
				/>
				{renderFileAttachments('weaknesses')}
			</div>

			<div id="long_term" className={`settings-section ${activeSection === 'long_term' ? 'active-section' : ''}`}>
				<h2>Cele długoterminowe</h2>
				<p className="settings-description">
					Twoje długoterminowe cele i aspiracje, które pomogą AI lepiej dostosować odpowiedzi do Twoich dążeń.
				</p>
				<textarea
					className="settings-textarea"
					value={longTermGoals}
					onChange={e => handleTextChange('longTermGoals', e.target.value)}
					placeholder="Wprowadź swoje długoterminowe cele i aspiracje..."
				/>
				{renderFileAttachments('long_term')}
			</div>

			<div id="short_term" className={`settings-section ${activeSection === 'short_term' ? 'active-section' : ''}`}>
				<h2>Cele krótkoterminowe</h2>
				<p className="settings-description">
					Twoje bieżące cele, nad którymi obecnie pracujesz. Pomoże to AI w proponowaniu rozwiązań na teraz.
				</p>
				<textarea
					className="settings-textarea"
					value={shortTermGoals}
					onChange={e => handleTextChange('shortTermGoals', e.target.value)}
					placeholder="Wprowadź swoje krótkoterminowe cele, nad którymi obecnie pracujesz..."
				/>
				{renderFileAttachments('short_term')}
			</div>

			{/* File selection modal */}
			<Modal isOpen={showFileModal} onClose={() => setShowFileModal(false)} title="Dodaj pliki" size="medium">
				<div className="file-selection-modal">
					<div className="file-selection-tabs">
						<button
							className={`file-selection-tab ${fileUploadType === 'upload' ? 'active' : ''}`}
							onClick={() => setFileUploadType('upload')}>
							<Upload size={16} strokeWidth={1.5} />
							Dodaj nowy plik
						</button>
						<button
							className={`file-selection-tab ${fileUploadType === 'existing' ? 'active' : ''}`}
							onClick={() => setFileUploadType('existing')}>
							<FolderOpen size={16} strokeWidth={1.5} />
							Wybierz z istniejących
						</button>
					</div>

					<div className="file-selection-content">
						{fileUploadType === 'upload' ? (
							<div className="file-upload-area">
								<div className="file-upload-message">
									<Upload size={40} strokeWidth={1.5} />
									<p>Przeciągnij i upuść pliki tutaj lub kliknij, aby wybrać</p>
									<input
										type="file"
										ref={activeFileSection ? fileInputRefs[activeFileSection] : null}
										onChange={e => activeFileSection && handleFileUpload(activeFileSection, e)}
										style={{ display: 'none' }}
										multiple
									/>
									<button
										className="file-browse-button"
										onClick={() => activeFileSection && triggerFileUpload(activeFileSection)}>
										Wybierz pliki
									</button>
								</div>
							</div>
						) : (
							<div className="existing-files-area">
								{existingFiles.length > 0 ? (
									<>
										<div className="existing-files-header">
											<span>Nazwa</span>
											<span>Typ</span>
											<span>Rozmiar</span>
										</div>
										<div className="existing-files-list">
											{existingFiles.map(file => (
												<div
													key={file.id}
													className={`existing-file-item ${
														selectedExistingFiles.find(f => f.id === file.id) ? 'selected' : ''
													}`}
													onClick={() => toggleFileSelection(file)}>
													<div className="existing-file-icon">{getFileIcon(file.type)}</div>
													<div className="existing-file-name">{file.name}</div>
													<div className="existing-file-type">{file.type.toUpperCase()}</div>
													<div className="existing-file-size">{file.size}</div>
													<div className="existing-file-checkbox">
														{selectedExistingFiles.find(f => f.id === file.id) && <Check size={16} strokeWidth={2} />}
													</div>
												</div>
											))}
										</div>
									</>
								) : (
									<div className="no-files-message">
										<p>Nie znaleziono żadnych plików</p>
									</div>
								)}
							</div>
						)}
					</div>

					<div className="file-selection-actions">
						<button className="modal-button-secondary" onClick={() => setShowFileModal(false)}>
							Anuluj
						</button>

						{fileUploadType === 'existing' && (
							<button
								className="modal-button-primary"
								onClick={addSelectedFiles}
								disabled={selectedExistingFiles.length === 0}>
								Dodaj wybrane ({selectedExistingFiles.length})
							</button>
						)}
					</div>
				</div>
			</Modal>

			{/* Fixed Save Button */}
			<div className={`fixed-save-button ${showSaveButton || isSaving || saveSuccess || saveError ? 'active' : ''}`}>
				{saveSuccess && (
					<div className="save-success">
						<Check size={18} strokeWidth={1.5} />
						Zapisano pomyślnie!
					</div>
				)}
				{saveError && (
					<div className="save-error">
						<AlertTriangle size={18} strokeWidth={1.5} />
						Błąd zapisywania. Spróbuj ponownie.
					</div>
				)}
				<button className="save-settings-button" onClick={saveContext} disabled={isSaving}>
					{isSaving ? (
						<>
							<div className="button-loader"></div>
							Zapisywanie...
						</>
					) : (
						<>
							<Save size={16} strokeWidth={1.5} />
							Zapisz zmiany
						</>
					)}
				</button>
			</div>
		</div>
	)
}

export default Context

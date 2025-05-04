import React, { useState, useRef, useEffect } from 'react'
import './Context.css' // Using the same styles as Settings for now
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
import Modal from '../../components/modal/Modal'
import userService from '../../services/userService'
import { useAuth } from '../../context/AuthContext'

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
			</div>

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

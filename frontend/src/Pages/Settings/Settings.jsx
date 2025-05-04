import React, { useState, useRef, useEffect } from 'react'
import './Settings.css'
import {
	Save,
	Link,
	X,
	Plus,
	Upload,
	Cpu,
	User,
	MessageSquare,
	Shield,
	FileText,
	ExternalLink,
	Edit2,
	Trash2,
	Loader,
	Check,
	AlertTriangle,
} from 'lucide-react'
import Modal from '../../components/modal/Modal'
import uploadService from '../../services/uploadService'
import userService from '../../services/userService'
import { useAuth } from '../../context/AuthContext'

// Custom SVG icons for models
const GeminiIcon = ({ size = 14 }) => (
	<svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
		<path d="M16 8.016A8.522 8.522 0 008.016 16h-.032A8.521 8.521 0 000 8.016v-.032A8.521 8.521 0 007.984 0h.032A8.522 8.522 0 0016 7.984v.032z" />
	</svg>
)

const GPTIcon = ({ size = 14 }) => (
	<svg width={size} height={size} viewBox="0 0 600 600" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
		<path d="M304.246 295.411V249.828C304.246 245.989 305.687 243.109 309.044 241.191L400.692 188.412C413.167 181.215 428.042 177.858 443.394 177.858C500.971 177.858 537.44 222.482 537.44 269.982C537.44 273.34 537.44 277.179 536.959 281.018L441.954 225.358C436.197 222 430.437 222 424.68 225.358L304.246 295.411ZM518.245 472.945V364.024C518.245 357.304 515.364 352.507 509.608 349.149L389.174 279.096L428.519 256.543C431.877 254.626 434.757 254.626 438.115 256.543L529.762 309.323C556.154 324.679 573.905 357.304 573.905 388.971C573.905 425.436 552.315 459.024 518.245 472.941V472.945ZM275.937 376.982L236.592 353.952C233.235 352.034 231.794 349.154 231.794 345.315V239.756C231.794 188.416 271.139 149.548 324.4 149.548C344.555 149.548 363.264 156.268 379.102 168.262L284.578 222.964C278.822 226.321 275.942 231.119 275.942 237.838V376.986L275.937 376.982ZM360.626 425.922L304.246 394.255V327.083L360.626 295.416L417.002 327.083V394.255L360.626 425.922ZM396.852 571.789C376.698 571.789 357.989 565.07 342.151 553.075L436.674 498.374C442.431 495.017 445.311 490.219 445.311 483.499V344.352L485.138 367.382C488.495 369.299 489.936 372.179 489.936 376.018V481.577C489.936 532.917 450.109 571.785 396.852 571.785V571.789ZM283.134 464.79L191.486 412.01C165.094 396.654 147.343 364.029 147.343 332.362C147.343 295.416 169.415 262.309 203.48 248.393V357.791C203.48 364.51 206.361 369.308 212.117 372.665L332.074 442.237L292.729 464.79C289.372 466.707 286.491 466.707 283.134 464.79ZM277.859 543.48C223.639 543.48 183.813 502.695 183.813 452.314C183.813 448.475 184.294 444.636 184.771 440.797L279.295 495.498C285.051 498.856 290.812 498.856 296.568 495.498L417.002 425.927V471.509C417.002 475.349 415.562 478.229 412.204 480.146L320.557 532.926C308.081 540.122 293.206 543.48 277.854 543.48H277.859ZM396.852 600.576C454.911 600.576 503.37 559.313 514.41 504.612C568.149 490.696 602.696 440.315 602.696 388.976C602.696 355.387 588.303 322.762 562.392 299.25C564.791 289.173 566.231 279.096 566.231 269.024C566.231 200.411 510.571 149.067 446.274 149.067C433.322 149.067 420.846 150.984 408.37 155.305C386.775 134.192 357.026 120.758 324.4 120.758C266.342 120.758 217.883 162.02 206.843 216.721C153.104 230.637 118.557 281.018 118.557 332.357C118.557 365.946 132.95 398.571 158.861 422.083C156.462 432.16 155.022 442.237 155.022 452.309C155.022 520.922 210.682 572.266 274.978 572.266C287.931 572.266 300.407 570.349 312.883 566.028C334.473 587.141 364.222 600.576 396.852 600.576Z" />
	</svg>
)

const DeepSeekIcon = ({ size = 14 }) => (
	<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
		<path d="M23.748 4.482c-.254-.124-.364.113-.512.234-.051.039-.094.09-.137.136-.372.397-.806.657-1.373.626-.829-.046-1.537.214-2.163.848-.133-.782-.575-1.248-1.247-1.548-.352-.156-.708-.311-.955-.65-.172-.241-.219-.51-.305-.774-.055-.16-.11-.323-.293-.35-.2-.031-.278.136-.356.276-.313.572-.434 1.202-.422 1.84.027 1.436.633 2.58 1.838 3.393.137.093.172.187.129.323-.082.28-.18.552-.266.833-.055.179-.137.217-.329.14a5.526 5.526 0 01-1.736-1.18c-.857-.828-1.631-1.742-2.597-2.458a11.365 11.365 0 00-.689-.471c-.985-.957.13-1.743.388-1.836.27-.098.093-.432-.779-.428-.872.004-1.67.295-2.687.684a3.055 3.055 0 01-.465.137 9.597 9.597 0 00-2.883-.102c-1.885.21-3.39 1.102-4.497 2.623C.082 8.606-.231 10.684.152 12.85c.403 2.284 1.569 4.175 3.36 5.653 1.858 1.533 3.997 2.284 6.438 2.14 1.482-.085 3.133-.284 4.994-1.86.47.234.962.327 1.78.397.63.059 1.236-.03 1.705-.128.735-.156.684-.837.419-.961-2.155-1.004-1.682-.595-2.113-.926 1.096-1.296 2.746-2.642 3.392-7.003.05-.347.007-.565 0-.845-.004-.17.035-.237.23-.256a4.173 4.173 0 001.545-.475c1.396-.763 1.96-2.015 2.093-3.517.02-.23-.004-.467-.247-.588zM11.581 18c-2.089-1.642-3.102-2.183-3.52-2.16-.392.024-.321.471-.235.763.09.288.207.486.371.739.114.167.192.416-.113.603-.673.416-1.842-.14-1.897-.167-1.361-.802-2.5-1.86-3.301-3.307-.774-1.393-1.224-2.887-1.298-4.482-.02-.386.093-.522.477-.592a4.696 4.696 0 011.529-.039c2.132.312 3.946 1.265 5.468 2.774.868.86 1.525 1.887 2.202 2.891.72 1.066 1.494 2.082 2.48 2.914.348.292.625.514.891.677-.802.09-2.14.11-3.054-.614zm1-6.44a.306.306 0 01.415-.287.302.302 0 01.2.288.306.306 0 01-.31.307.303.303 0 01-.304-.308zm3.11 1.596c-.2.081-.399.151-.59.16a1.245 1.245 0 01-.798-.254c-.274-.23-.47-.358-.552-.758a1.73 1.73 0 01.016-.588c.07-.327-.008-.537-.239-.727-.187-.156-.426-.199-.688-.199a.559.559 0 01-.254-.078c-.11-.054-.2-.19-.114-.358.028-.054.16-.186.192-.21.356-.202.767-.136 1.146.016.352.144.618.408 1.001.782.391.451.462.576.685.914.176.265.336.537.445.848.067.195-.019.354-.25.452z" />
	</svg>
)

const QwenIcon = ({ size = 14 }) => (
	<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
		<path d="M12.604 1.34c.393.69.784 1.382 1.174 2.075a.18.18 0 00.157.091h5.552c.174 0 .322.11.446.327l1.454 2.57c.19.337.24.478.024.837-.26.43-.513.864-.76 1.3l-.367.658c-.106.196-.223.28-.04.512l2.652 4.637c.172.301.111.494-.043.77-.437.785-.882 1.564-1.335 2.34-.159.272-.352.375-.68.37-.777-.016-1.552-.01-2.327.016a.099.099 0 00-.081.05 575.097 575.097 0 01-2.705 4.74c-.169.293-.38.363-.725.364-.997.003-2.002.004-3.017.002a.537.537 0 01-.465-.271l-1.335-2.323a.09.09 0 00-.083-.049H4.982c-.285.03-.553-.001-.805-.092l-1.603-2.77a.543.543 0 01-.002-.54l1.207-2.12a.198.198 0 000-.197 550.951 550.951 0 01-1.875-3.272l-.79-1.395c-.16-.31-.173-.496.095-.965.465-.813.927-1.625 1.387-2.436.132-.234.304-.334.584-.335a338.3 338.3 0 012.589-.001.124.124 0 00.107-.063l2.806-4.895a.488.488 0 01.422-.246c.524-.001 1.053 0 1.583-.006L11.704 1c.341-.003.724.032.9.34zm-3.432.403a.06.06 0 00-.052.03L6.254 6.788a.157.157 0 01-.135.078H3.253c-.056 0-.07.025-.041.074l5.81 10.156c.025.042.013.062-.034.063l-2.795.015a.218.218 0 00-.2.116l-1.32 2.31c-.044.078-.021.118.068.118l5.716.008c.046 0 .08.02.104.061l1.403 2.454c.046.081.092.082.139 0l5.006-8.76.783-1.382a.055.055 0 01.096 0l1.424 2.53a.122.122 0 00.107.062l2.763-.02a.04.04 0 00.035-.02.041.041 0 000-.04l-2.9-5.086a.108.108 0 010-.113l.293-.507 1.12-1.977c.024-.041.012-.062-.035-.062H9.2c-.059 0-.073-.026-.043-.077l1.434-2.505a.107.107 0 000-.114L9.225 1.774a.06.06 0 00-.053-.031zm6.29 8.02c.046 0 .058.02.034.06l-.832 1.465-2.613 4.585a.056.056 0 01-.05.029.058.058 0 01-.05-.029L8.498 9.841c-.02-.034-.01-.052.028-.054l.216-.012 6.722-.012z" />
	</svg>
)

const LlamaIcon = ({ size = 14 }) => (
	<svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
		<path d="M15 5h2a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-2v-6z" fill="currentColor" />
		<path
			d="M7 19a2 2 0 0 1-2-2c0-4.942 3.754-9 8-9 4.246 0 8 4.058 8 9-1.083 1.636-3.238 2-6 2H7z"
			fill="currentColor"
			stroke="currentColor"
			strokeWidth="1"
		/>
		<path d="M12 13v3" stroke="currentColor" strokeWidth="1.5" />
		<path d="M7 9c-1.667.667-2.5 1.5-2.5 2.5 0 1.5 1 2 2.5 2" stroke="currentColor" strokeWidth="1.5" />
	</svg>
)

const ClaudeIcon = ({ size = 14 }) => (
	<svg width={size} height={size} viewBox="0 0 48 32" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
		<path d="M32.73 0h-6.945L38.45 32h6.945L32.73 0ZM12.665 0 0 32h7.082l2.59-6.72h13.25l2.59 6.72h7.082L19.929 0h-7.264Zm-.702 19.337 4.334-11.246 4.334 11.246h-8.668Z" />
	</svg>
)

function Settings({ sidebarFilter }) {
	const { user, updateUserData } = useAuth()

	const [showSaveButton, setShowSaveButton] = useState(false)
	const [saveSuccess, setSaveSuccess] = useState(false)
	const [saveError, setSaveError] = useState(false)
	const [isSaving, setIsSaving] = useState(false)
	const [isLoading, setIsLoading] = useState(true)
	const [hasChanges, setHasChanges] = useState(false)
	const [activeSection, setActiveSection] = useState(null)

	// Profile info state
	const [profileName, setProfileName] = useState('')
	const [profilePicture, setProfilePicture] = useState('')
	const profilePictureInputRef = useRef(null)

	// API keys state
	const [openAiKey, setOpenAiKey] = useState('')
	const [anthropicKey, setAnthropicKey] = useState('')

	// Settings state
	const [language, setLanguage] = useState('pl')
	const [desktopNotifications, setDesktopNotifications] = useState(false)
	const [soundEffects, setSoundEffects] = useState(false)
	const [defaultModel, setDefaultModel] = useState('gpt-4')
	const [streamResponses, setStreamResponses] = useState(true)
	const [developerMode, setDeveloperMode] = useState(false)

	// Refs for sections
	const sectionRefs = {
		profile: useRef(null),
		integrations: useRef(null),
		models: useRef(null),
		contact: useRef(null),
	}

	// Fetch user settings on component mount
	useEffect(() => {
		if (user && user._id) {
			fetchUserData()
		}
	}, [user])

	// Fetch user data from API
	const fetchUserData = async () => {
		try {
			setIsLoading(true)

			// Fetch user settings
			const settings = await userService.getUserSettings(user._id)

			// Set profile data
			setProfileName(user.name || '')
			setProfilePicture(user.avatar || '')

			// Set settings data
			if (settings) {
				setLanguage(settings.language || 'pl')
				setDesktopNotifications(settings.desktopNotifications || false)
				setSoundEffects(settings.soundEffects || false)
				setDefaultModel(settings.defaultModel || 'gpt-4')
				setStreamResponses(settings.streamResponses !== undefined ? settings.streamResponses : true)
				setDeveloperMode(settings.developerMode || false)

				// Set API keys if they exist
				if (settings.apiKeys) {
					setOpenAiKey(settings.apiKeys.openAi || '')
					setAnthropicKey(settings.apiKeys.anthropic || '')
				}

				// Update models enabled status
				if (settings.enabledModels && settings.enabledModels.length > 0) {
					updateEnabledModels(settings.enabledModels)
				}
			}

			setHasChanges(false)
		} catch (error) {
			console.error('Error fetching user settings:', error)
		} finally {
			setIsLoading(false)
		}
	}

	// Update models based on enabled list
	const updateEnabledModels = enabledModels => {
		setAvailableModels(models =>
			models.map(model => ({
				...model,
				enabled: enabledModels.includes(model.name),
			}))
		)
	}

	// Process filter from sidebar
	useEffect(() => {
		if (sidebarFilter && sidebarFilter.type === 'section' && sidebarFilter.value) {
			setActiveSection(sidebarFilter.value)
			scrollToSection(sidebarFilter.value)
		}
	}, [sidebarFilter])

	// Scroll to section
	const scrollToSection = sectionId => {
		if (sectionRefs[sectionId] && sectionRefs[sectionId].current) {
			sectionRefs[sectionId].current.scrollIntoView({
				behavior: 'smooth',
				block: 'start',
			})
		}
	}

	// Models state based on Chat.jsx models
	const [availableModels, setAvailableModels] = useState([
		{
			name: 'gemini-2.5-flash',
			displayName: 'Gemini 2.5 Flash',
			type: 'gemini',
			enabled: true,
			tags: [{ text: 'Fast' }, { text: 'Default' }],
		},
		{
			name: 'gemini-2.0-flash',
			displayName: 'Gemini 2.0 Flash',
			type: 'gemini',
			enabled: true,
			tags: [{ text: 'Fast' }],
		},
		{
			name: 'gemini-2.0-flash-lite',
			displayName: 'Gemini 2.0 Flash Lite',
			type: 'gemini',
			enabled: false,
			tags: [{ text: 'Fast' }, { text: 'Lite' }],
		},
		{
			name: 'gpt-4o',
			displayName: 'GPT-4o',
			type: 'gpt',
			enabled: true,
			tags: [{ text: 'Smart' }, { text: 'Vision' }],
		},
		{
			name: 'gpt-4.1',
			displayName: 'GPT-4.1',
			type: 'gpt',
			enabled: true,
			tags: [{ text: 'Advanced' }],
		},
		{
			name: 'gpt-4.1-mini',
			displayName: 'GPT-4.1 Mini',
			type: 'gpt',
			enabled: false,
			tags: [{ text: 'Compact' }, { text: 'Fast' }],
		},
		{
			name: 'claude-3.5-sonnet',
			displayName: 'Claude 3.5 Sonnet',
			type: 'claude',
			enabled: true,
			tags: [{ text: 'General' }],
		},
		{
			name: 'claude-3.7-sonnet',
			displayName: 'Claude 3.7 Sonnet',
			type: 'claude',
			enabled: true,
			tags: [{ text: 'Reasoning' }],
		},
		{
			name: 'llama-2-30b',
			displayName: 'Llama 2.0 30B',
			type: 'llama',
			enabled: false,
			tags: [{ text: 'Powerful' }],
		},
		{
			name: 'deepseek-v3',
			displayName: 'DeepSeek v3 (0324)',
			type: 'deepseek',
			enabled: true,
			tags: [{ text: 'Coding' }],
		},
		{
			name: 'deepseek-r1',
			displayName: 'DeepSeek R1',
			type: 'deepseek',
			enabled: false,
			tags: [{ text: 'New' }],
		},
		{
			name: 'qwen-2.5-32b',
			displayName: 'Qwen 2.5 32B',
			type: 'qwen',
			enabled: false,
			tags: [{ text: 'Infinite' }, { text: 'Large' }],
		},
	])

	// Toggle model visibility
	const toggleModelVisibility = modelName => {
		setAvailableModels(models =>
			models.map(model => (model.name === modelName ? { ...model, enabled: !model.enabled } : model))
		)
		setHasChanges(true)
	}

	// Add handlers to detect changes to settings
	const handleProfileNameChange = value => {
		setProfileName(value)
		setHasChanges(true)
	}

	const handleApiKeyChange = (key, value) => {
		if (key === 'openai') {
			setOpenAiKey(value)
		} else if (key === 'anthropic') {
			setAnthropicKey(value)
		}
		setHasChanges(true)
	}

	const handleSettingToggle = (setting, value) => {
		switch (setting) {
			case 'desktopNotifications':
				setDesktopNotifications(value)
				break
			case 'soundEffects':
				setSoundEffects(value)
				break
			case 'streamResponses':
				setStreamResponses(value)
				break
			case 'developerMode':
				setDeveloperMode(value)
				break
			default:
				break
		}
		setHasChanges(true)
	}

	const handleModelChange = value => {
		setDefaultModel(value)
		setHasChanges(true)
	}

	const handleLanguageChange = value => {
		setLanguage(value)
		setHasChanges(true)
	}

	// Get model icon based on type
	const getModelIcon = (type, size = 16) => {
		switch (type) {
			case 'gemini':
				return <GeminiIcon size={size} />
			case 'gpt':
				return <GPTIcon size={size} />
			case 'claude':
				return <ClaudeIcon size={size} />
			case 'deepseek':
				return <DeepSeekIcon size={size} />
			case 'qwen':
				return <QwenIcon size={size} />
			case 'llama':
				return <LlamaIcon size={size} />
			default:
				return null
		}
	}

	// Add upload progress state
	const [profilePictureUploadProgress, setProfilePictureUploadProgress] = useState(0)
	const [webhookIconUploadProgress, setWebhookIconUploadProgress] = useState(0)

	// Handle profile picture upload with progress
	const handleProfilePictureUpload = async e => {
		const file = e.target.files[0]
		if (file) {
			try {
				// Show loading indicator
				setIsSaving(true)
				setProfilePictureUploadProgress(0)

				// Use our Cloudinary upload service with progress tracking
				const imageUrl = await uploadService.uploadImage(file, {
					maxWidth: 300, // Optimize for profile pictures
					quality: 90, // Higher quality for profile pictures
					onProgress: percent => {
						setProfilePictureUploadProgress(percent)
					},
				})

				// Set the uploaded image URL
				setProfilePicture(imageUrl)
				setHasChanges(true)
				setIsSaving(false)
				setProfilePictureUploadProgress(0)
			} catch (error) {
				console.error('Error uploading profile picture:', error)
				setIsSaving(false)
				setProfilePictureUploadProgress(0)
				setSaveError(true)
				setTimeout(() => setSaveError(false), 3000)
			}
		}
	}

	// Webhook states
	const [webhooks, setWebhooks] = useState([
		{
			id: 1,
			name: 'Main Webhook',
			url: 'https://example.com/webhook1',
			channel: '@main_updates',
			icon: 'https://placehold.co/200x200/4c8eda/fff?text=W1',
			type: 'telegram',
		},
		{
			id: 2,
			name: 'Discord Notifications',
			url: 'https://discord.com/api/webhooks/example',
			channel: '#notifications',
			icon: 'https://placehold.co/200x200/5865F2/fff?text=D1',
			type: 'discord',
		},
	])
	const [webhookType, setWebhookType] = useState('telegram')
	const [showWebhookModal, setShowWebhookModal] = useState(false)
	const [currentWebhook, setCurrentWebhook] = useState({
		id: null,
		name: '',
		url: '',
		channel: '',
		icon: '',
		type: 'telegram',
	})
	const [isEditingWebhook, setIsEditingWebhook] = useState(false)
	const webhookIconInputRef = useRef(null)

	// Open webhook modal for adding or editing
	const openWebhookModal = (webhook = null) => {
		if (webhook) {
			setCurrentWebhook({ ...webhook })
			setIsEditingWebhook(true)
		} else {
			setCurrentWebhook({
				id: null,
				name: '',
				url: '',
				channel: '',
				icon: '',
				type: webhookType,
			})
			setIsEditingWebhook(false)
		}
		setShowWebhookModal(true)
	}

	// Handle webhook icon upload with progress
	const handleWebhookIconUpload = async e => {
		const file = e.target.files[0]
		if (file) {
			try {
				setWebhookIconUploadProgress(0)

				// Use our Cloudinary upload service with progress tracking
				const imageUrl = await uploadService.uploadImage(file, {
					maxWidth: 200, // Smaller size for webhook icons
					quality: 85,
					onProgress: percent => {
						setWebhookIconUploadProgress(percent)
					},
				})

				// Update the current webhook with the new icon URL
				setCurrentWebhook({ ...currentWebhook, icon: imageUrl })
				setWebhookIconUploadProgress(0)
			} catch (error) {
				console.error('Error uploading webhook icon:', error)
				setWebhookIconUploadProgress(0)
			}
		}
	}

	// Save webhook
	const saveWebhook = () => {
		if (currentWebhook.name && currentWebhook.url) {
			if (isEditingWebhook) {
				// Update existing webhook
				setWebhooks(webhooks.map(w => (w.id === currentWebhook.id ? currentWebhook : w)))
			} else {
				// Add new webhook
				setWebhooks([...webhooks, { ...currentWebhook, id: Date.now() }])
			}
			setShowWebhookModal(false)
			setHasChanges(true)
		}
	}

	// Remove webhook
	const removeWebhook = id => {
		setWebhooks(webhooks.filter(w => w.id !== id))
		setHasChanges(true)
	}

	// Save settings to API
	const saveSettings = async () => {
		if (!user || !user._id) return

		setIsSaving(true)
		setSaveSuccess(false)
		setSaveError(false)

		try {
			// Prepare user profile data
			const userData = {
				name: profileName,
				avatar: profilePicture,
			}

			// Update user profile
			const updatedUser = await userService.updateUser(user._id, userData)

			// Update user in auth context
			if (updatedUser) {
				updateUserData(updatedUser)
			}

			// Get list of enabled model names
			const enabledModels = availableModels.filter(model => model.enabled).map(model => model.name)

			// Prepare settings data
			const settingsData = {
				language,
				desktopNotifications,
				soundEffects,
				defaultModel,
				streamResponses,
				developerMode,
				enabledModels,
				apiKeys: {
					openAi: openAiKey,
					anthropic: anthropicKey,
				},
			}

			// Update user settings
			await userService.updateUserSettings(user._id, settingsData)

			setSaveSuccess(true)
			setHasChanges(false)

			// Reset success message after 3 seconds
			setTimeout(() => {
				setSaveSuccess(false)
			}, 3000)
		} catch (error) {
			console.error('Error saving settings:', error)
			setSaveError(true)

			// Reset error message after 3 seconds
			setTimeout(() => {
				setSaveError(false)
			}, 3000)
		} finally {
			setIsSaving(false)
		}
	}

	// Show fixed save button when changes are detected
	useEffect(() => {
		if (hasChanges) {
			setShowSaveButton(true)
		} else {
			setShowSaveButton(false)
		}
	}, [hasChanges])

	if (isLoading) {
		return (
			<div className="settings-container">
				<div className="settings-loading">
					<Loader size={24} className="animate-spin" />
					<p>Ładowanie ustawień...</p>
				</div>
			</div>
		)
	}

	return (
		<div className="settings-container">
			<h1 className="settings-title">Ustawienia</h1>

			{/* Integrations Section */}
			<div
				id="integrations"
				ref={sectionRefs.integrations}
				className={`settings-section ${activeSection === 'integrations' ? 'active-section' : ''}`}>
				<h2>
					<Link size={20} strokeWidth={1.5} className="section-icon" /> Integracje
				</h2>
				<p className="settings-description">
					Skonfiguruj webhooki, aby wysyłać powiadomienia, gdy proces myślenia zostanie zakończony. Możesz używać
					webhooków Telegram lub Discord.
				</p>

				<div className="webhooks-container">
					{webhooks.map(webhook => (
						<div key={webhook.id} className="webhook-item">
							<div className="webhook-info">
								<div className="webhook-image">
									<img src={webhook.icon} alt={webhook.name} className="webhook-icon-container" />
								</div>
								<div className="webhook-details">
									<h3>{webhook.name}</h3>
									<div className="webhook-url">{webhook.url}</div>
									<div className="webhook-channel">{webhook.channel}</div>
								</div>
							</div>
							<div className="webhook-actions">
								<button
									className="action-button edit-button"
									onClick={() => openWebhookModal(webhook)}
									aria-label="Edytuj webhook">
									<Edit2 size={16} strokeWidth={1.5} />
								</button>
								<button
									className="action-button delete-button"
									onClick={() => removeWebhook(webhook.id)}
									aria-label="Usuń webhook">
									<Trash2 size={16} strokeWidth={1.5} />
								</button>
							</div>
						</div>
					))}

					<button className="add-webhook-button" onClick={() => openWebhookModal()}>
						<Plus size={18} strokeWidth={1.5} />
						<span>Dodaj nowy webhook</span>
					</button>
				</div>
			</div>

			{/* Models Section */}
			<div
				id="models"
				ref={sectionRefs.models}
				className={`settings-section ${activeSection === 'models' ? 'active-section' : ''}`}>
				<h2>
					<Cpu size={20} strokeWidth={1.5} className="section-icon" /> Modele językowe
				</h2>
				<p className="settings-description">
					Wybierz, które modele AI będą widoczne w interfejsie czatu. Włączaj lub wyłączaj modele według potrzeb.
				</p>

				<div className="model-filter-actions">
					<button
						className="filter-action-button"
						onClick={() => {
							setAvailableModels(models => models.map(model => ({ ...model, enabled: true })))
							setHasChanges(true)
						}}>
						Dodaj wszystkie
					</button>
					<button
						className="filter-action-button"
						onClick={() => {
							setAvailableModels(models => models.map(model => ({ ...model, enabled: false })))
							setHasChanges(true)
						}}>
						Resetuj
					</button>
				</div>

				<div className="models-container">
					{availableModels.map(model => (
						<div key={model.name} className="model-item">
							<div className="model-content">
								<div className="model-info">
									<div className="model-header">
										{getModelIcon(model.type, 20)}
										<h3>{model.displayName}</h3>
									</div>
									<div className="model-description">
										{model.type === 'gemini'
											? 'Flagowy model Google, znany z szybkości i dokładności (a także wyszukiwania w sieci!).'
											: model.type === 'gpt'
											? 'Najnowszy i najlepszy model generacji obrazów OpenAI, wykorzystujący wiele zaawansowanych technologii.'
											: model.type === 'claude'
											? 'Najnowocześniejszy model językowy firmy Anthropic, doskonały w rozumowaniu i wykonywaniu instrukcji.'
											: model.type === 'deepseek'
											? 'Specjalistyczny model kodowania z głęboką znajomością języków programowania i frameworków.'
											: model.type === 'llama'
											? 'Duży model językowy open source opracowany przez Meta AI, bardzo wydajny.'
											: model.type === 'qwen'
											? 'Zaawansowany model językowy od Alibaba, z silnymi zdolnościami wielojęzycznymi.'
											: 'Model językowy AI'}
									</div>
									<div className="model-tags">
										{model.tags.map((tag, index) => (
											<span key={index} className="model-tag">
												{tag.text}
											</span>
										))}
									</div>
								</div>
								<div className="model-toggle">
									<label className="toggle-switch">
										<input type="checkbox" checked={model.enabled} onChange={() => toggleModelVisibility(model.name)} />
										<span className="toggle-slider"></span>
									</label>
								</div>
							</div>
							<div className="model-actions">
								<div className="model-capabilities">
									{model.type === 'gpt' || model.type === 'gemini' ? (
										<>
											<span className="capability-badge vision">Widzenie</span>
											{model.type === 'gpt' && <span className="capability-badge">PDFy</span>}
											<span className="capability-badge">Wyszukiwanie</span>
										</>
									) : model.type === 'claude' ? (
										<>
											<span className="capability-badge vision">Widzenie</span>
											<span className="capability-badge">PDFy</span>
											<span className="capability-badge">Wyszukiwanie</span>
										</>
									) : (
										<span className="capability-badge">Szybki</span>
									)}
								</div>
							</div>
						</div>
					))}
				</div>
				<p className="settings-description secondary" style={{ marginTop: '16px' }}>
					Uwaga: Zmiany w dostępnych modelach zostaną zastosowane po zapisaniu ustawień i odświeżeniu interfejsu czatu.
				</p>
			</div>

			{/* Contact Section */}
			<div
				id="contact"
				ref={sectionRefs.contact}
				className={`settings-section ${activeSection === 'contact' ? 'active-section' : ''}`}>
				<h2>
					<MessageSquare size={20} strokeWidth={1.5} className="section-icon" /> Kontakt i informacje prawne
				</h2>
				<p className="settings-description">
					Dostęp do informacji prawnych i zasobów kontaktowych. Te funkcje są obecnie wyłączone.
				</p>

				<div className="contact-links-container">
					<button className="contact-link-button" disabled>
						<Shield size={16} strokeWidth={1.5} />
						<span>Polityka prywatności</span>
						<ExternalLink size={14} strokeWidth={1.5} className="external-link-icon" />
					</button>

					<button className="contact-link-button" disabled>
						<FileText size={16} strokeWidth={1.5} />
						<span>Warunki korzystania z usługi</span>
						<ExternalLink size={14} strokeWidth={1.5} className="external-link-icon" />
					</button>

					<button className="contact-link-button" disabled>
						<MessageSquare size={16} strokeWidth={1.5} />
						<span>Społeczność Discord</span>
						<ExternalLink size={14} strokeWidth={1.5} className="external-link-icon" />
					</button>

					<button className="contact-link-button" disabled>
						<MessageSquare size={16} strokeWidth={1.5} />
						<span>Pomysły i opinie</span>
						<ExternalLink size={14} strokeWidth={1.5} className="external-link-icon" />
					</button>
				</div>
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
				<button className="save-settings-button" onClick={saveSettings} disabled={isSaving}>
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

			{/* Webhook Modal */}
			<Modal
				isOpen={showWebhookModal}
				onClose={() => setShowWebhookModal(false)}
				title={isEditingWebhook ? 'Edytuj webhook' : 'Dodaj nowy webhook'}
				size="medium">
				<div className="webhook-type-selector">
					<div className="webhook-type-radio-group">
						<div
							className={`webhook-type-radio ${currentWebhook.type === 'telegram' ? 'active' : ''}`}
							onClick={() => setCurrentWebhook({ ...currentWebhook, type: 'telegram' })}>
							<input
								type="radio"
								name="webhookType"
								value="telegram"
								checked={currentWebhook.type === 'telegram'}
								onChange={() => {}}
							/>
							<span>Telegram</span>
						</div>
						<div
							className={`webhook-type-radio ${currentWebhook.type === 'discord' ? 'active' : ''}`}
							onClick={() => setCurrentWebhook({ ...currentWebhook, type: 'discord' })}>
							<input
								type="radio"
								name="webhookType"
								value="discord"
								checked={currentWebhook.type === 'discord'}
								onChange={() => {}}
							/>
							<span>Discord</span>
						</div>
					</div>
				</div>

				<div className="form-group">
					<label>Nazwa</label>
					<input
						type="text"
						value={currentWebhook.name}
						onChange={e => setCurrentWebhook({ ...currentWebhook, name: e.target.value })}
						placeholder="Nazwa webhooka"
					/>
				</div>
				<div className="form-group">
					<label>URL</label>
					<input
						type="text"
						value={currentWebhook.url}
						onChange={e => setCurrentWebhook({ ...currentWebhook, url: e.target.value })}
						placeholder={`URL webhook ${currentWebhook.type === 'telegram' ? 'Telegram' : 'Discord'}`}
					/>
				</div>
				<div className="form-group">
					<label>Kanał</label>
					<div className="input-with-icon">
						<div className="input-icon">{currentWebhook.type === 'telegram' ? '@' : '#'}</div>
						<input
							type="text"
							value={currentWebhook.channel.replace(/^[@#]/, '')}
							onChange={e =>
								setCurrentWebhook({
									...currentWebhook,
									channel: `${currentWebhook.type === 'telegram' ? '@' : '#'}${e.target.value.replace(/^[@#]/, '')}`,
								})
							}
							placeholder={`${currentWebhook.type === 'telegram' ? 'nazwa_kanału' : 'nazwa-kanału'}`}
						/>
					</div>
				</div>
				<div className="form-group">
					<label>Ikona</label>
					<div className="upload-container">
						{currentWebhook.icon ? (
							<div className="preview-image webhook-preview">
								<img src={currentWebhook.icon} alt="Ikona webhooka" />
								<button className="remove-image" onClick={() => setCurrentWebhook({ ...currentWebhook, icon: '' })}>
									<X size={14} strokeWidth={2} />
								</button>
							</div>
						) : (
							<button
								className="upload-button"
								onClick={() => webhookIconInputRef.current && webhookIconInputRef.current.click()}>
								<Upload size={18} strokeWidth={1.5} />
								<span>Wgraj ikonę</span>
							</button>
						)}
						<input
							type="file"
							ref={webhookIconInputRef}
							onChange={handleWebhookIconUpload}
							accept="image/*"
							style={{ display: 'none' }}
						/>
					</div>
				</div>
				<div className="modal-actions">
					<button className="modal-button modal-button-secondary" onClick={() => setShowWebhookModal(false)}>
						Anuluj
					</button>
					<button className="modal-button modal-button-primary" onClick={saveWebhook}>
						{isEditingWebhook ? 'Aktualizuj' : 'Dodaj'} webhook
					</button>
				</div>
			</Modal>
		</div>
	)
}

export default Settings

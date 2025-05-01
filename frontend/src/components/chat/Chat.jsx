import React, { useState, useEffect, useRef, useCallback } from 'react'
import './Chat.css'
import {
	Send,
	Settings,
	ChevronDown,
	Mic,
	Bell,
	BellOff,
	Check,
	MessageSquare,
	Zap,
	AlignJustify,
	Pencil,
	RefreshCw,
	Trash,
	FileText,
	AtSign,
	User,
	Search,
	Command,
	Paperclip,
	Code,
	Database,
	Info,
	Shield,
	Filter,
	BrainCircuit,
	Sparkles,
	Infinity,
	ListChecks,
	Brain,
	Bolt,
	Star,
	Rocket,
	FlaskConical,
	Gauge,
	Bot,
	Image,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import chatService from '../../services/chatService'
import userService from '../../services/userService'
import authService from '../../services/authService'
import Loader from '../Loader'

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

// Model tag component
const ModelTag = ({ icon, text, color = '#4f46e5' }) => (
	<span className="model-tag" style={{ backgroundColor: `${color}10`, color }}>
		{icon}
		<span>{text}</span>
	</span>
)

// Constants
const MAX_CHAR_LIMIT = 2000
const CHAR_LIMIT_WARNING = 1800

// Mode definitions
const MODES = [
	{
		id: 'general',
		name: 'Odpowiedź ogólna',
		description: 'Standardowe odpowiedzi konwersacyjne',
		icon: <MessageSquare size={14} />,
	},
	{
		id: 'problem-solving',
		name: 'Rozwiązywanie problemów',
		description: 'Koncentruje się na rozwiązywaniu złożonych problemów krok po kroku',
		icon: <ListChecks size={14} />,
	},
	{
		id: 'infinite',
		name: 'Tryb nieskończony',
		description: 'Szczegółowa analiza bez ograniczeń',
		icon: <Infinity size={14} />,
	},
	{
		id: 'marzenie-wstecz',
		name: 'Marzenie wstecz',
		description: 'Wizualizacja drogi od marzeń do teraźniejszości',
		icon: <Star size={14} />,
	},
]

function Chat({ onMessageSubmit, onChatModeChange, chatMode }) {
	const navigate = useNavigate()
	const [input, setInput] = useState('')
	const [modelDropdownOpen, setModelDropdownOpen] = useState(false)
	const [modeDropdownOpen, setModeDropdownOpen] = useState(false)
	const [selectedModel, setSelectedModel] = useState('')
	const [selectedMode, setSelectedMode] = useState(chatMode || 'general')
	const [availableModels, setAvailableModels] = useState([])
	const [isSending, setIsSending] = useState(false)
	const [isModelLoading, setIsModelLoading] = useState(false)
	const [isRecording, setIsRecording] = useState(false)
	const [isTranscribing, setIsTranscribing] = useState(false)
	const [telegramNotify, setTelegramNotify] = useState(false)
	const [tooltipVisible, setTooltipVisible] = useState(null)
	const [error, setError] = useState('')
	const [loadingModels, setLoadingModels] = useState(true)
	const [canSend, setCanSend] = useState(false)

	// Add the missing cursor position state
	const [cursorPosition, setCursorPosition] = useState(0)

	// Modify state to separate prompts and assistants menus
	const [showPromptMenu, setShowPromptMenu] = useState(false)
	const [showAssistantMenu, setShowAssistantMenu] = useState(false)
	const [promptFilter, setPromptFilter] = useState('')
	const [assistantFilter, setAssistantFilter] = useState('')
	const [selectedIndex, setSelectedIndex] = useState(0)
	const [triggerPos, setTriggerPos] = useState(-1)

	// Add state for actual data
	const [prompts, setPrompts] = useState([])
	const [assistants, setAssistants] = useState([])
	const [currentUser, setCurrentUser] = useState(null)
	const [dataLoading, setDataLoading] = useState(true)

	// Default text for Marzenie wstecz mode
	const marzenieWsteczPrompt = `Bazując na wszystkim, co wiesz o mnie i moich długoterminowych celach, ustal jasną wizję mojego wymarzonego życia, a następnie zamiast iść dalej, jak robi wielu ludzi, cofnij się do mojej obecnej sytuacji życiowej. Twoja odpowiedź powinna pomóc mi utwierdzić się i mieć jasną wizję kroków, które muszę podjąć.
`

	// Effect to prefill textarea when Marzenie wstecz mode is selected
	useEffect(() => {
		if (selectedMode === 'marzenie-wstecz') {
			setInput(marzenieWsteczPrompt)
		}
	}, [selectedMode])

	// Fetch user data and their prompts/assistants
	useEffect(() => {
		const fetchData = async () => {
			try {
				const userData = await authService.getCurrentUser()
				setCurrentUser(userData)

				if (userData) {
					const [promptsData, assistantsData] = await Promise.all([
						userService.getUserSystemPrompts(userData._id),
						userService.getUserAssistants(userData._id),
					])

					setPrompts(promptsData)
					setAssistants(assistantsData)
				}
			} catch (err) {
				console.error('Failed to fetch data:', err)
			} finally {
				setDataLoading(false)
			}
		}

		fetchData()
	}, [])

	// Filter prompts based on search
	const filteredPrompts = prompts.filter(
		prompt =>
			prompt.title.toLowerCase().includes(promptFilter.toLowerCase()) ||
			prompt.category.toLowerCase().includes(promptFilter.toLowerCase())
	)

	// Filter assistants based on search
	const filteredAssistants = assistants.filter(
		assistant =>
			assistant.name.toLowerCase().includes(assistantFilter.toLowerCase()) ||
			assistant.category.toLowerCase().includes(assistantFilter.toLowerCase())
	)

	// Refs
	const textareaRef = useRef(null)
	const modelDropdownRef = useRef(null)
	const modeDropdownRef = useRef(null)
	const commandMenuRef = useRef(null)
	const mentionMenuRef = useRef(null)

	// Track active commands and mentions in the input
	const activeCommands = []
	const activeMentions = []

	// Check for disabled state
	const isInputDisabled = isSending || isModelLoading || isRecording || isTranscribing

	// Fetch available models on component mount
	useEffect(() => {
		async function fetchModels() {
			try {
				setLoadingModels(true)

				// Define all available models directly in the frontend
				const availableModels = [
					{
						name: 'gemini-2.5-flash',
						displayName: 'Gemini 2.5 Flash',
						type: 'gemini',
						enabled: false,
						tags: [{ text: 'Fast' }, { text: 'Default' }],
					},
					{
						name: 'gemini-2.0-flash',
						displayName: 'Gemini 2.0 Flash',
						type: 'gemini',
						enabled: false,
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
						tags: [
							{ icon: <Brain size={10} />, text: 'Smart', color: '#8b5cf6' },
							{ icon: <FlaskConical size={10} />, text: 'Vision', color: '#06b6d4' },
						],
					},
					{
						name: 'gpt-4.1',
						displayName: 'GPT-4.1',
						type: 'gpt',
						enabled: true,
						tags: [{ icon: <BrainCircuit size={10} />, text: 'Advanced', color: '#8b5cf6' }],
					},
					{
						name: 'gpt-4.1-mini',
						displayName: 'GPT-4.1 Mini',
						type: 'gpt',
						enabled: true,
						tags: [{ text: 'Compact' }, { text: 'Fast' }],
					},
					{
						name: 'claude-3.5-sonnet',
						displayName: 'Claude 3.5 Sonnet',
						type: 'claude',
						enabled: false,
						tags: [{ icon: <Bot size={10} />, text: 'General', color: '#059669' }],
					},
					{
						name: 'claude-3.7-sonnet',
						displayName: 'Claude 3.7 Sonnet',
						type: 'claude',
						enabled: false,
						tags: [{ icon: <Brain size={10} />, text: 'Reasoning', color: '#8b5cf6' }],
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
						enabled: false,
						tags: [{ icon: <Code size={10} />, text: 'Coding', color: '#ef4444' }],
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
				]

				// Use models as defined without modification
				setAvailableModels(availableModels)

				// Set default model to the first enabled model or gpt-4o
				const defaultModel =
					availableModels.find(model => model.name === 'gpt-4o') ||
					availableModels.find(model => model.enabled) ||
					availableModels[0]
				if (defaultModel) {
					setSelectedModel(defaultModel.name)
				}
			} catch (error) {
				console.error('Error setting up models:', error)

				// Set some reasonable fallback models
				setAvailableModels([
					{
						name: 'gpt-4o',
						displayName: 'GPT-4o',
						type: 'gpt',
						enabled: true,
						tags: [
							{ icon: <Brain size={10} />, text: 'Smart', color: '#8b5cf6' },
							{ icon: <FlaskConical size={10} />, text: 'Vision', color: '#06b6d4' },
						],
					},
				])
				setSelectedModel('gpt-4o')
			} finally {
				setLoadingModels(false)
			}
		}

		fetchModels()
	}, [])

	// Check character count
	const charCount = input.length
	const isNearLimit = charCount >= CHAR_LIMIT_WARNING && charCount < MAX_CHAR_LIMIT
	const isAtLimit = charCount >= MAX_CHAR_LIMIT

	// Adjust textarea height
	useEffect(() => {
		if (textareaRef.current) {
			textareaRef.current.style.height = '120px'
			const scrollHeight = textareaRef.current.scrollHeight
			if (scrollHeight > 120) {
				textareaRef.current.style.height = `${Math.min(scrollHeight, 300)}px`
			}
		}
	}, [input])

	// Handle clicks outside dropdown to close it
	useEffect(() => {
		function handleClickOutside(event) {
			if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target)) {
				setModelDropdownOpen(false)
			}

			if (modeDropdownRef.current && !modeDropdownRef.current.contains(event.target)) {
				setModeDropdownOpen(false)
			}

			// Close command menu when clicking outside
			if (commandMenuRef.current && !commandMenuRef.current.contains(event.target)) {
				setShowPromptMenu(false)
				setShowAssistantMenu(false)
			}

			// Close mention menu when clicking outside
			if (mentionMenuRef.current && !mentionMenuRef.current.contains(event.target)) {
				setShowPromptMenu(false)
				setShowAssistantMenu(false)
			}
		}

		document.addEventListener('mousedown', handleClickOutside)
		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
		}
	}, [])

	// Reset error when input changes
	useEffect(() => {
		if (error && input) {
			setError('')
		}
	}, [input, error])

	// Handle input change with new simplified trigger detection
	const handleInputChange = e => {
		const text = e.target.value
		if (text.length <= MAX_CHAR_LIMIT) {
			setInput(text)

			// Get cursor position
			const cursorPos = e.target.selectionStart
			setCursorPosition(cursorPos)

			// Check for prompt trigger (/)
			const lastSlashPos = text.lastIndexOf('/', cursorPos)
			const textAfterSlash = lastSlashPos !== -1 ? text.substring(lastSlashPos + 1, cursorPos) : null
			const slashAtStartOrAfterSpace = lastSlashPos === 0 || (lastSlashPos > 0 && text[lastSlashPos - 1] === ' ')
			const hasSpaceAfterPrompt = textAfterSlash?.includes(' ') || false

			// Check for assistant trigger (@)
			const lastAtPos = text.lastIndexOf('@', cursorPos)
			const textAfterAt = lastAtPos !== -1 ? text.substring(lastAtPos + 1, cursorPos) : null
			const atAtStartOrAfterSpace = lastAtPos === 0 || (lastAtPos > 0 && text[lastAtPos - 1] === ' ')
			const hasSpaceAfterAssistant = textAfterAt?.includes(' ') || false

			// Show prompt menu
			if (lastSlashPos !== -1 && slashAtStartOrAfterSpace && textAfterSlash !== null && !hasSpaceAfterPrompt) {
				setPromptFilter(textAfterSlash)
				setTriggerPos(lastSlashPos)
				setShowPromptMenu(true)
				setShowAssistantMenu(false)
				setSelectedIndex(0)
			} else {
				setShowPromptMenu(false)
			}

			// Show assistant menu
			if (lastAtPos !== -1 && atAtStartOrAfterSpace && textAfterAt !== null && !hasSpaceAfterAssistant) {
				setAssistantFilter(textAfterAt)
				setTriggerPos(lastAtPos)
				setShowAssistantMenu(true)
				setShowPromptMenu(false)
				setSelectedIndex(0)
			} else {
				setShowAssistantMenu(false)
			}
		}
	}

	// Simplified insert functions
	const insertPrompt = prompt => {
		if (triggerPos === -1) return

		const textBefore = input.substring(0, triggerPos)
		const textAfter = input.substring(cursorPosition)

		// Insert just the prompt content
		const newValue = `${textBefore}${prompt.content}`
		setInput(newValue + textAfter)
		setShowPromptMenu(false)

		// Position cursor after the inserted content
		if (textareaRef.current) {
			textareaRef.current.focus()
			const newPosition = triggerPos + prompt.content.length
			setTimeout(() => {
				textareaRef.current.setSelectionRange(newPosition, newPosition)
			}, 10)
		}
	}

	const insertAssistant = assistant => {
		if (triggerPos === -1) return

		const textBefore = input.substring(0, triggerPos)
		const textAfter = input.substring(cursorPosition)

		// Format assistant instructions and system prompt with separators
		const formattedContent = `Instrukcje:\n${assistant.instructions}\n\nPrompt systemowy:\n${assistant.systemPrompt}\n\n-----`

		const newValue = `${textBefore}${formattedContent}`
		setInput(newValue + textAfter)
		setShowAssistantMenu(false)

		// Position cursor after the inserted content
		if (textareaRef.current) {
			textareaRef.current.focus()
			const newPosition = newValue.length
			setTimeout(() => {
				textareaRef.current.setSelectionRange(newPosition, newPosition)
			}, 10)
		}
	}

	// Modified key handler for new menus
	const handleKeyDown = useCallback(
		e => {
			// Submit on Ctrl/Cmd + Enter
			if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
				if (canSend) {
					e.preventDefault()
					handleSendMessage(e)
				}
				return
			}

			// Handle prompt menu navigation
			if (showPromptMenu && prompts.length > 0) {
				switch (e.key) {
					case 'ArrowDown':
						e.preventDefault()
						setSelectedIndex(prev => (prev + 1) % prompts.length)
						break
					case 'ArrowUp':
						e.preventDefault()
						setSelectedIndex(prev => (prev - 1 + prompts.length) % prompts.length)
						break
					case 'Enter':
					case 'Tab':
						e.preventDefault()
						insertPrompt(prompts[selectedIndex])
						break
					case 'Escape':
						e.preventDefault()
						setShowPromptMenu(false)
						break
					default:
						break
				}
			}

			// Handle assistant menu navigation
			if (showAssistantMenu && assistants.length > 0) {
				switch (e.key) {
					case 'ArrowDown':
						e.preventDefault()
						setSelectedIndex(prev => (prev + 1) % assistants.length)
						break
					case 'ArrowUp':
						e.preventDefault()
						setSelectedIndex(prev => (prev - 1 + assistants.length) % assistants.length)
						break
					case 'Enter':
					case 'Tab':
						e.preventDefault()
						insertAssistant(assistants[selectedIndex])
						break
					case 'Escape':
						e.preventDefault()
						setShowAssistantMenu(false)
						break
					default:
						break
				}
			}
		},
		[
			canSend,
			showPromptMenu,
			showAssistantMenu,
			prompts,
			assistants,
			selectedIndex,
			input,
			insertPrompt,
			insertAssistant,
		]
	)

	// Handle message submission
	const handleSendMessage = async e => {
		e?.preventDefault()

		if (!canSend || input.trim() === '' || isInputDisabled) return

		// Trim whitespace from input
		const trimmedInput = input.trim()

		// Save input before clearing it
		const currentInput = trimmedInput

		// Clear input and set sending state
		setInput('')
		setIsSending(true)

		try {
			// Create a new chat if onMessageSubmit exists (main Chat interface)
			if (onMessageSubmit) {
				// For infinite mode, we want to immediately navigate
				if (selectedMode === 'infinite') {
					await onMessageSubmit(currentInput, selectedModel, selectedMode, false)
				} else {
					// For other modes, let the function handle navigation
					await onMessageSubmit(currentInput, selectedModel, selectedMode, true)
				}
			} else {
				// If we're in a detail view, use a different approach
				console.error('Message submission not implemented for this view')
			}
		} catch (error) {
			console.error('Error sending message:', error)
			setError('Failed to send message')
		} finally {
			setIsSending(false)
		}
	}

	const toggleModelDropdown = useCallback(() => {
		setModelDropdownOpen(prev => !prev)
		setModeDropdownOpen(false)
	}, [])

	const toggleModeDropdown = useCallback(() => {
		setModeDropdownOpen(prev => !prev)
		setModelDropdownOpen(false)
	}, [])

	const toggleModelSelection = useCallback(model => {
		setSelectedModel(model)
	}, [])

	const toggleModeSelection = useCallback(
		mode => {
			// Save previous mode for comparison
			const previousMode = selectedMode

			// Update the mode
			setSelectedMode(mode)

			// Call the onChatModeChange prop if available
			if (onChatModeChange) {
				onChatModeChange(mode)
			}

			// Close the dropdown
			setModeDropdownOpen(false)

			// Provide visual feedback on textarea when mode changes
			if (textareaRef.current && previousMode !== mode) {
				// Briefly add a transition class
				textareaRef.current.classList.add('mode-transition')

				// Remove the class after transition completes
				setTimeout(() => {
					if (textareaRef.current) {
						textareaRef.current.classList.remove('mode-transition')
					}
				}, 300)
			}
		},
		[selectedMode, onChatModeChange]
	)

	const toggleTelegramNotify = useCallback(() => {
		setTelegramNotify(prev => !prev)
	}, [])

	const startDictation = useCallback(() => {
		if (isTranscribing) return

		if (isRecording) {
			setIsRecording(false)
			setIsTranscribing(true)

			setTimeout(() => {
				setInput(prev => prev + ' [Tekst z dyktowania]')
				setIsTranscribing(false)
			}, 1500)
			return
		}

		setIsRecording(true)

		const recordingTimeout = setTimeout(() => {
			if (isRecording) {
				setIsRecording(false)
				setIsTranscribing(true)

				setTimeout(() => {
					setInput(prev => prev + ' [Tekst z dyktowania]')
					setIsTranscribing(false)
				}, 1500)
			}
		}, 10000)

		return () => clearTimeout(recordingTimeout)
	}, [isRecording, isTranscribing])

	const showTooltip = useCallback(tooltip => {
		setTooltipVisible(tooltip)
	}, [])

	const hideTooltip = useCallback(() => {
		setTooltipVisible(null)
	}, [])

	// Get tooltip text based on the button
	const getTooltipText = type => {
		switch (type) {
			case 'mic':
				return 'Dyktowanie'
			case 'models':
				return 'Modele AI'
			case 'modes':
				return 'Tryby odpowiedzi'
			case 'telegram':
				return telegramNotify ? 'Wyłącz powiadomienia' : 'Włącz powiadomienia'
			case 'settings':
				return 'Ustawienia'
			default:
				return ''
		}
	}

	// Process the input for rendering with highlighted commands and mentions
	const renderHighlightedInput = () => {
		return input
	}

	// Add visual cue for keyboard shortcuts (while typing)
	const renderMenuHelp = () => {
		if (!showPromptMenu && !showAssistantMenu) return null

		return (
			<div className="czutkai-menu-help">
				{showPromptMenu && (
					<>
						<kbd>Enter</kbd> wybierz
					</>
				)}
				{showAssistantMenu && (
					<>
						<kbd>Enter</kbd> wybierz
					</>
				)}
			</div>
		)
	}

	// Add useEffect to update canSend when its dependencies change
	useEffect(() => {
		setCanSend(input.trim() && !isSending && !isModelLoading && !isTranscribing && !isAtLimit)
	}, [input, isSending, isModelLoading, isTranscribing, isAtLimit])

	return (
		<div className="chat-container">
			<div className="chat-main">
				<div className={`chat-placeholder mode-${selectedMode}`}>
					<p className="chat-placeholder-text">
						Witaj, {currentUser ? currentUser.name.split(' ')[0] : 'Użytkowniku'}!
					</p>
				</div>

				<form onSubmit={handleSendMessage} className="chat-input-container">
					<div className={`chat-input-wrapper mode-${selectedMode}`}>
						<textarea
							ref={textareaRef}
							className={`chat-input ${error ? 'error' : ''}`}
							value={input}
							onChange={handleInputChange}
							onKeyDown={handleKeyDown}
							placeholder="W czym mogę pomóc? Użyj / dla komend lub @ dla wzmianek"
							rows="4"
							disabled={isInputDisabled}
							aria-label="Wiadomość"
						/>

						{/* Mode indicator */}
						{selectedMode !== 'general' && (
							<div className="mode-indicator">
								{selectedMode === 'problem-solving' && (
									<>
										<ListChecks size={12} /> Tryb rozwiązywania problemów
									</>
								)}
								{selectedMode === 'infinite' && (
									<>
										<Infinity size={12} /> Tryb nieskończony
									</>
								)}
								{selectedMode === 'marzenie-wstecz' && (
									<>
										<Star size={12} /> Tryb marzenie wstecz
									</>
								)}
							</div>
						)}

						{/* Prompt Menu */}
						{showPromptMenu && (
							<div className="czutkai-command-menu" ref={commandMenuRef}>
								<div className="czutkai-menu-header">
									<FileText size={13} />
									<span>Prompty</span>
								</div>
								<div className="czutkai-menu-shortcut">
									<kbd>Enter</kbd> wybierz
								</div>
								{!dataLoading && filteredPrompts.length > 0 ? (
									<ul className="czutkai-menu-list">
										{filteredPrompts.map((prompt, index) => (
											<li
												key={prompt._id}
												className={`czutkai-command-item ${index === selectedIndex ? 'selected' : ''} ${
													prompt.isFavorite ? 'favorite' : ''
												}`}
												onClick={() => insertPrompt(prompt)}
												onMouseEnter={() => setSelectedIndex(index)}>
												<div className="czutkai-command-icon">
													<FileText size={14} />
													{prompt.isFavorite && <span className="czutkai-favorite-indicator">★</span>}
												</div>
												<div className="czutkai-command-info">
													<span className="czutkai-command-label">{prompt.title}</span>
													<span className="czutkai-command-description">{prompt.category}</span>
												</div>
											</li>
										))}
									</ul>
								) : (
									<div className="czutkai-menu-list">
										<p style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>
											{dataLoading ? (
												<Loader size="small" inline={true} text="Ładowanie promptów..." />
											) : (
												'Nie znaleziono promptów'
											)}
										</p>
									</div>
								)}
							</div>
						)}

						{/* Assistant Menu */}
						{showAssistantMenu && (
							<div className="czutkai-mention-menu" ref={mentionMenuRef}>
								<div className="czutkai-menu-header">
									<User size={13} />
									<span>Asystenci</span>
								</div>
								<div className="czutkai-menu-shortcut">
									<kbd>Enter</kbd> wybierz
								</div>
								{!dataLoading && filteredAssistants.length > 0 ? (
									<ul className="czutkai-menu-list">
										{filteredAssistants.map((assistant, index) => (
											<li
												key={assistant._id}
												className={`czutkai-mention-item ${index === selectedIndex ? 'selected' : ''} ${
													assistant.isFavorite ? 'favorite' : ''
												}`}
												onClick={() => insertAssistant(assistant)}
												onMouseEnter={() => setSelectedIndex(index)}>
												<div className="czutkai-mention-icon">
													{assistant.avatarImage ? (
														<img src={assistant.avatarImage} alt={assistant.name} />
													) : (
														<User size={14} />
													)}
													{assistant.isFavorite && <span className="czutkai-favorite-indicator">★</span>}
												</div>
												<div className="czutkai-mention-info">
													<span className="czutkai-mention-title">{assistant.name}</span>
													<div className="czutkai-mention-subtitle">
														<span className="czutkai-mention-badge assistant">Asystent</span>
													</div>
												</div>
											</li>
										))}
									</ul>
								) : (
									<div className="czutkai-menu-list">
										<p style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>
											{dataLoading ? (
												<Loader size="small" inline={true} text="Ładowanie asystentów..." />
											) : (
												'Nie znaleziono asystentów'
											)}
										</p>
									</div>
								)}
							</div>
						)}

						{renderMenuHelp()}

						<button type="submit" className="send-button in-textarea" disabled={!canSend} aria-label="Wyślij wiadomość">
							{isSending ? <Loader size="small" inline={true} /> : <Send size={18} strokeWidth={1.5} />}
						</button>

						{isRecording && <div className="audio-wave"></div>}
						{isTranscribing && <div className="transcribing-status">transkrybuję...</div>}

						<div className={`character-counter ${isNearLimit ? 'limit-near' : ''} ${isAtLimit ? 'limit-reached' : ''}`}>
							{charCount}/{MAX_CHAR_LIMIT}
						</div>
					</div>

					{error && <div className="error-message">{error}</div>}

					{/* Active Command Indicators */}
					{(activeCommands.length > 0 || activeMentions.length > 0) && (
						<div className="czutkai-active-indicators">
							{activeCommands.map((cmd, index) => (
								<div key={`cmd-${index}`} className="czutkai-active-indicator command">
									<Command size={12} />
									<span>{cmd.id}</span>
								</div>
							))}
							{activeMentions.map((mention, index) => (
								<div key={`mention-${index}`} className="czutkai-active-indicator mention">
									<AtSign size={12} />
									<span>{mention.title}</span>
								</div>
							))}
						</div>
					)}

					{/* Chat controls with model and mode selectors */}
					<div className="chat-controls">
						<div className="chat-controls-left">
							<div className="model-selector" ref={modelDropdownRef}>
								<button
									type="button"
									className="model-selector-button"
									onClick={toggleModelDropdown}
									aria-haspopup="listbox"
									aria-expanded={modelDropdownOpen}
									disabled={isInputDisabled || loadingModels}
									onMouseEnter={() => showTooltip('models')}
									onMouseLeave={hideTooltip}>
									<span className="ellipsis-text">
										{loadingModels
											? 'Ładowanie modeli...'
											: availableModels.find(m => m.name === selectedModel)?.displayName || selectedModel}
									</span>
									{isModelLoading || loadingModels ? (
										<div className="loader small"></div>
									) : (
										<ChevronDown size={16} strokeWidth={1.5} />
									)}
								</button>

								{tooltipVisible === 'models' && <div className="tooltip">{getTooltipText('models')}</div>}

								{modelDropdownOpen && !loadingModels && (
									<ul className="model-dropdown" role="listbox">
										{availableModels
											.sort((a, b) => {
												// Sort by enabled status first (enabled models first)
												if (a.enabled !== b.enabled) {
													return a.enabled ? -1 : 1
												}
												// Then sort by type/provider
												return a.type.localeCompare(b.type)
											})
											.map((model, index) => (
												<li
													key={index}
													className={`model-option ${selectedModel === model.name ? 'selected' : ''} ${
														!model.enabled ? 'disabled' : ''
													}`}
													onClick={() => model.enabled && toggleModelSelection(model.name)}
													role="option"
													aria-selected={selectedModel === model.name}
													aria-disabled={!model.enabled}>
													<div className="model-option-content">
														<div className="model-icon">
															{model.type === 'gemini' && <GeminiIcon />}
															{model.type === 'gpt' && <GPTIcon />}
															{model.type === 'llama' && <LlamaIcon />}
															{model.type === 'claude' && <ClaudeIcon />}
															{model.type === 'deepseek' && <DeepSeekIcon />}
															{model.type === 'qwen' && <QwenIcon />}
														</div>
														<div className="model-details">
															<div className="model-name">{model.displayName || model.name}</div>
															{model.tags && model.tags.length > 0 && (
																<div className="model-tags">
																	{model.tags.map((tag, i) => (
																		<ModelTag key={i} icon={tag.icon} text={tag.text} color={tag.color} />
																	))}
																</div>
															)}
														</div>
														{selectedModel === model.name && (
															<div className="model-check">
																<Check size={14} />
															</div>
														)}
														{!model.enabled && <div className="model-disabled-indicator">Wyłączony</div>}
													</div>
												</li>
											))}
										{availableModels.length === 0 && (
											<li className="model-option coming-soon">
												<span className="coming-soon-message">Nie znaleziono modeli</span>
											</li>
										)}
									</ul>
								)}
							</div>

							<div className="mode-selector" ref={modeDropdownRef}>
								<button
									type="button"
									className={`mode-selector-button mode-${selectedMode}`}
									onClick={toggleModeDropdown}
									aria-haspopup="listbox"
									aria-expanded={modeDropdownOpen}
									disabled={isInputDisabled}
									onMouseEnter={() => showTooltip('modes')}
									onMouseLeave={hideTooltip}>
									<span className="ellipsis-text">
										{MODES.find(mode => mode.id === selectedMode)?.name || 'Odpowiedź ogólna'}
									</span>
									<ChevronDown size={16} strokeWidth={1.5} />
								</button>

								{tooltipVisible === 'modes' && <div className="tooltip">{getTooltipText('modes')}</div>}

								{modeDropdownOpen && (
									<ul className="mode-dropdown" role="listbox">
										{MODES.map((mode, index) => (
											<li
												key={index}
												className={`mode-option ${selectedMode === mode.id ? 'selected' : ''}`}
												onClick={() => toggleModeSelection(mode.id)}
												role="option"
												aria-selected={selectedMode === mode.id}>
												<div className="mode-option-content">
													<div className="mode-icon">{mode.icon}</div>
													<div className="mode-info">
														<div className="mode-name">{mode.name}</div>
														<div className="mode-description">{mode.description}</div>
													</div>
													{selectedMode === mode.id && (
														<div className="mode-check">
															<Check size={14} />
														</div>
													)}
												</div>
											</li>
										))}
									</ul>
								)}
							</div>
						</div>

						<div className="chat-controls-right">
							{selectedMode === 'infinite' && (
								<button
									type="button"
									className={`telegram-button ${telegramNotify ? 'active' : ''}`}
									onClick={toggleTelegramNotify}
									disabled={isInputDisabled}
									onMouseEnter={() => showTooltip('telegram')}
									onMouseLeave={hideTooltip}
									aria-label={telegramNotify ? 'Wyłącz powiadomienia' : 'Włącz powiadomienia'}
									aria-pressed={telegramNotify}>
									{telegramNotify ? <Bell size={18} strokeWidth={1.5} /> : <BellOff size={18} strokeWidth={1.5} />}
									{tooltipVisible === 'telegram' && <div className="tooltip">{getTooltipText('telegram')}</div>}
								</button>
							)}

							<button
								type="button"
								className="settings-button"
								aria-label="Ustawienia"
								disabled={isInputDisabled}
								onMouseEnter={() => showTooltip('settings')}
								onMouseLeave={hideTooltip}>
								<Settings size={18} strokeWidth={1.5} />
								{tooltipVisible === 'settings' && <div className="tooltip">{getTooltipText('settings')}</div>}
							</button>
						</div>
					</div>
				</form>
			</div>
		</div>
	)
}

export default Chat

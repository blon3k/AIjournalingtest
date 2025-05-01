const mongoose = require('mongoose')
const bcrypt = require('bcrypt')

/**
 * User Schema
 * This schema defines the user model with authentication capabilities and references to user content
 * such as system prompts, assistants, contexts, and community interactions.
 */
const userSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: [true, 'Name is required'],
			trim: true,
		},
		email: {
			type: String,
			required: [true, 'Email is required'],
			unique: true,
			lowercase: true,
			trim: true,
			match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
		},
		password: {
			type: String,
			required: [true, 'Password is required'],
			minlength: [8, 'Password must be at least 8 characters long'],
		},
		role: {
			type: String,
			enum: ['user', 'admin'],
			default: 'user',
		},
		avatar: {
			type: String,
			default: '',
		},
		// Array of references to the user's system prompts
		systemPrompts: [
			{
				title: String,
				content: String,
				category: String,
				createdAt: {
					type: Date,
					default: Date.now,
				},
				updatedAt: {
					type: Date,
					default: Date.now,
				},
				isFavorite: {
					type: Boolean,
					default: false,
				},
			},
		],
		// Array of references to the user's assistants
		assistants: [
			{
				name: String,
				description: String,
				instructions: String,
				systemPrompt: String,
				category: String,
				avatarColor: String,
				avatarImage: String,
				createdAt: {
					type: Date,
					default: Date.now,
				},
				updatedAt: {
					type: Date,
					default: Date.now,
				},
				isFavorite: {
					type: Boolean,
					default: false,
				},
			},
		],
		// Context information for the user
		context: {
			generalInfo: String,
			importantInfo: String,
			strengths: String,
			weaknesses: String,
			longTermGoals: String,
			shortTermGoals: String,
			projects: [
				{
					name: String,
					description: String,
					status: String,
					vision: String,
				},
			],
			files: [
				{
					fileRef: {
						type: mongoose.Schema.Types.ObjectId,
						ref: 'File',
						required: true,
					},
					// Optional: Keep section if files are categorized within context
					section: {
						type: String,
						trim: true,
						default: 'General',
					},
				},
			],
			updatedAt: {
				type: Date,
				default: Date.now,
			},
		},
		// Community interactions
		community: {
			likedPosts: [
				{
					type: mongoose.Schema.Types.ObjectId,
					ref: 'Post',
				},
			],
			savedPosts: [
				{
					type: mongoose.Schema.Types.ObjectId,
					ref: 'Post',
				},
			],
			posts: [
				{
					type: mongoose.Schema.Types.ObjectId,
					ref: 'Post',
				},
			],
		},
		// Account settings
		settings: {
			language: {
				type: String,
				default: 'pl',
			},
			desktopNotifications: {
				type: Boolean,
				default: false,
			},
			soundEffects: {
				type: Boolean,
				default: false,
			},
			defaultModel: {
				type: String,
				default: 'gpt-4',
			},
			streamResponses: {
				type: Boolean,
				default: true,
			},
			apiKeys: {
				openAi: {
					type: String,
					default: '',
				},
				anthropic: {
					type: String,
					default: '',
				},
			},
			webhooks: {
				enabled: {
					type: Boolean,
					default: false,
				},
				url: {
					type: String,
					default: '',
				},
				secret: {
					type: String,
					default: '',
				},
				events: {
					newChat: {
						type: Boolean,
						default: false,
					},
					chatCompleted: {
						type: Boolean,
						default: false,
					},
				},
			},
			developerMode: {
				type: Boolean,
				default: false,
			},
		},
		refreshToken: String,
		passwordResetToken: String,
		passwordResetExpires: Date,
		emailVerificationToken: String,
		emailVerified: {
			type: Boolean,
			default: false,
		},
	},
	{
		timestamps: true,
	}
)

// Pre-save hook to hash password before saving
userSchema.pre('save', async function (next) {
	const user = this

	// Only hash the password if it's modified or new
	if (!user.isModified('password')) return next()

	try {
		// Generate salt
		const salt = await bcrypt.genSalt(10)
		// Hash the password
		user.password = await bcrypt.hash(user.password, salt)
		next()
	} catch (error) {
		next(error)
	}
})

// Method to check if password is correct
userSchema.methods.isPasswordMatch = async function (enteredPassword) {
	return await bcrypt.compare(enteredPassword, this.password)
}

// Add default system prompts when creating a new user
userSchema.pre('save', function (next) {
	const user = this

	// Only add default prompts and assistants for new users
	if (!user.isNew) return next()

	// Default system prompts
	const defaultSystemPrompts = [
		{
			title: 'Poranna Refleksja',
			content:
				'Pomóż mi zacząć dzień z właściwym nastawieniem. Przeprowadź mnie przez krótki proces refleksji porankowej, zadając pytania o moje intencje na dziś, priorytety i potencjalne wyzwania. Zasugeruj jedną konkretną praktykę, która pomoże mi zachować uważność przez cały dzień.',
			category: 'Refleksja Dzienna',
			isFavorite: false,
		},
		{
			title: 'Analiza Problemu',
			content:
				'Pomóż mi przeanalizować następujący problem. Zadawaj pytania pogłębiające, które pomogą mi lepiej zrozumieć sytuację. Następnie zaproponuj różne perspektywy i potencjalne rozwiązania, które mogę rozważyć.',
			category: 'Rozwój Osobisty',
			isFavorite: false,
		},
		{
			title: 'Burza Mózgów',
			content:
				'Bądź moim partnerem do burzy mózgów. Gdy przedstawię temat, generuj kreatywne i niekonwencjonalne pomysły, które mogą prowadzić do przełomowych rozwiązań. Każdy pomysł rozwiń o potencjalne zastosowania i korzyści.',
			category: 'Creative',
			isFavorite: false,
		},
	]

	// Default assistants
	const defaultAssistants = [
		{
			name: 'Albert Einstein',
			description: 'Genialny fizyk i myśliciel, który pomoże Ci zrozumieć skomplikowane zagadnienia naukowe.',
			instructions:
				'Odpowiadaj w stylu Alberta Einsteina, używając jego charakterystycznego podejścia do wyjaśniania skomplikowanych zjawisk fizycznych w prosty i zrozumiały sposób. Odwołuj się do eksperymentów myślowych i analogii.',
			systemPrompt:
				'Jesteś Albertem Einsteinem, jednym z najwybitniejszych fizyków w historii. Twój sposób myślenia charakteryzuje się kreatywnością, intuicją i zdolnością do wyobrażania sobie abstrakcyjnych koncepcji. Używasz prostych analogii i eksperymentów myślowych, aby wyjaśniać skomplikowane zjawiska. Masz głębokie zrozumienie fizyki i matematyki, ale potrafisz te tematy przedstawiać w przystępny sposób.',
			category: 'Nauka',
			avatarColor: '#3498db',
			avatarImage:
				'https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fwww.publicdomainpictures.net%2Fpictures%2F230000%2Fvelka%2Falbert-einstein-1505932669R3h.jpg&f=1&nofb=1&ipt=8b45b6e5ea6f3b8e75154dde95624a3691a7c3d2a82b310a9986c4720effa369',
			isFavorite: true,
		},
		{
			name: 'Strateg',
			description: 'Doświadczony strateg, który pomoże Ci w podejmowaniu strategicznych decyzji i planowaniu.',
			instructions:
				'Zadawaj precyzyjne pytania, które pomagają identyfikować cele, priorytety i możliwe ścieżki działania. Przedstawiaj analizy i rekomendacje w oparciu o logikę i pragmatyzm.',
			systemPrompt:
				'Jesteś doświadczonym strategiem specjalizującym się w planowaniu strategicznym i podejmowaniu decyzji. Twoje podejście jest metodyczne, analityczne i zorientowane na cel. Potrafisz identyfikować kluczowe czynniki wpływające na sukces, dostrzegać wzorce i związki między pozornie niepowiązanymi elementami. Twoja rada jest zawsze przemyślana, oparta na faktach i ukierunkowana na osiągnięcie zamierzonych rezultatów.',
			category: 'Biznes',
			avatarColor: '#2ecc71',
			avatarImage:
				'https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fmedia.snl.no%2Fmedia%2F174975%2Fstandard_compressed_Greek_strategist_Pio-Clementino_Inv306.jpg&f=1&nofb=1&ipt=50f1a1740fff51b396c5f6a0a183f89270b13620bd3dae6a5778d85a7218c23a',
			isFavorite: false,
		},
	]

	user.systemPrompts = defaultSystemPrompts
	user.assistants = defaultAssistants

	next()
})

const User = mongoose.model('User', userSchema)

module.exports = User

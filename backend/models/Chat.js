const mongoose = require('mongoose')

/**
 * Chat Schema
 * This schema defines the chat model that stores information about user conversations
 * including messages, title, model used, and chat type.
 */
const chatSchema = new mongoose.Schema(
	{
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		title: {
			type: String,
			required: true,
			trim: true,
			default: 'Nowa rozmowa',
		},
		model: {
			type: String,
			required: true,
			default: 'gpt-4o',
		},
		chatType: {
			type: String,
			enum: ['normal', 'problem-solving', 'infinite', 'marzenie-wstecz'],
			default: 'normal',
		},
		messages: [
			{
				role: {
					type: String,
					enum: ['user', 'assistant', 'system'],
					required: true,
				},
				content: {
					type: String,
					required: true,
				},
				timestamp: {
					type: Date,
					default: Date.now,
				},
				model: {
					type: String,
				},
				attachment: {
					type: {
						type: String,
						enum: ['file', 'image', 'code'],
					},
					name: String,
					content: String,
					size: String,
				},
				commandUsed: {
					type: String,
					enum: ['act', 'prompt', ''],
					default: '',
				},
				assistantUsed: {
					type: mongoose.Schema.Types.ObjectId,
					ref: 'User.assistants',
				},
				promptUsed: {
					type: mongoose.Schema.Types.ObjectId,
					ref: 'User.systemPrompts',
				},
				// New field for infinite chat to track which persona is speaking
				personaIndex: {
					type: Number,
					default: 0,
				},
			},
		],
		// New field for infinite chats to store persona and conversation data
		infiniteData: {
			topic: {
				type: String,
				trim: true,
			},
			personas: [
				{
					personaId: String, // Reference to assistants in User.assistants
					name: String,
					description: String,
					instructions: String,
					systemPrompt: String,
					avatarImage: String,
					messageCount: {
						type: Number,
						default: 0,
					},
				},
			],
			activePersonaIndex: {
				type: Number,
				default: 0,
			},
			messageIndex: {
				type: Number,
				default: 0,
			},
			crucialMoments: [
				{
					type: {
						type: String,
						enum: ['genius_idea', 'issue_solved', 'crucial_moment'],
						required: true,
					},
					messageId: String,
					content: String,
					timestamp: {
						type: Date,
						default: Date.now,
					},
					justification: String,
				},
			],
		},
		// Field for problem-solving chats to store agent data
		agentData: {
			userQuestion: {
				type: String,
			},
			agentResponses: [
				{
					agentId: {
						type: Number,
						required: true,
					},
					content: {
						type: String,
						required: true,
					},
					timestamp: {
						type: Date,
						default: Date.now,
					},
				},
			],
			completed: {
				type: Boolean,
				default: false,
			},
		},
		lastActive: {
			type: Date,
			default: Date.now,
		},
		isFavorite: {
			type: Boolean,
			default: false,
		},
		isArchived: {
			type: Boolean,
			default: false,
		},
		contextAttached: {
			type: Boolean,
			default: true,
		},
		duration: {
			type: Number, // Store duration in seconds for infinite chats
			default: 0,
		},
	},
	{
		timestamps: true,
	}
)

// Automatically update lastActive when a new message is added
chatSchema.pre('save', function (next) {
	if (this.isModified('messages')) {
		this.lastActive = Date.now()
	}
	next()
})

const Chat = mongoose.model('Chat', chatSchema)

module.exports = Chat

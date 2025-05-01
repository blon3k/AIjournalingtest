const Chat = require('../models/Chat')
const User = require('../models/User')
const axios = require('axios')
const mongoose = require('mongoose')
const aiService = require('../services/aiService')

// @desc    Get all chats for a user
// @route   GET /api/chats
// @access  Private
exports.getUserChats = async (req, res) => {
	try {
		const chats = await Chat.find({
			user: req.user.id,
			isArchived: false,
		})
			.select('title chatType lastActive model isFavorite createdAt duration messages')
			.sort({ lastActive: -1 })

		// Format chats for frontend with limited message info
		const formattedChats = chats.map(chat => ({
			id: chat._id,
			title: chat.title,
			type: chat.chatType,
			lastActive: chat.lastActive,
			model: chat.model,
			isFavorite: chat.isFavorite,
			createdAt: chat.createdAt,
			duration: chat.duration,
			messageCount: chat.messages.length,
			// Include just the first and last message for preview purposes
			preview:
				chat.messages.length > 0
					? {
							first: {
								content: chat.messages[0].content.substring(0, 100),
								role: chat.messages[0].role,
								timestamp: chat.messages[0].timestamp,
							},
							last: {
								content: chat.messages[chat.messages.length - 1].content.substring(0, 100),
								role: chat.messages[chat.messages.length - 1].role,
								timestamp: chat.messages[chat.messages.length - 1].timestamp,
							},
					  }
					: null,
		}))

		res.status(200).json({
			success: true,
			count: formattedChats.length,
			data: formattedChats,
		})
	} catch (error) {
		console.error('Error getting chats:', error)
		res.status(500).json({
			success: false,
			message: 'Failed to get chats',
		})
	}
}

// @desc    Get a single chat by ID
// @route   GET /api/chats/:id
// @access  Private
exports.getChatById = async (req, res) => {
	try {
		const chat = await Chat.findById(req.params.id)

		// Check if chat exists
		if (!chat) {
			return res.status(404).json({
				success: false,
				message: 'Chat not found',
			})
		}

		// Check if user owns the chat
		if (chat.user.toString() !== req.user.id && req.user.role !== 'admin') {
			return res.status(403).json({
				success: false,
				message: 'Not authorized to access this chat',
			})
		}

		res.status(200).json({
			success: true,
			data: chat,
		})
	} catch (error) {
		console.error('Error getting chat:', error)
		res.status(500).json({
			success: false,
			message: 'Failed to get chat',
		})
	}
}

// @desc    Create a new chat
// @route   POST /api/chats
// @access  Private
exports.createChat = async (req, res) => {
	try {
		const { title, model, chatType } = req.body

		// Create chat with default title
		const chat = await Chat.create({
			title: title || 'Nowa rozmowa',
			model: model || 'gpt-4o',
			chatType: chatType || 'normal',
			user: req.user.id,
		})

		res.status(201).json({
			success: true,
			data: chat,
		})
	} catch (error) {
		console.error('Error creating chat:', error)
		res.status(500).json({
			success: false,
			message: 'Failed to create chat',
		})
	}
}

// @desc    Create a new problem-solving chat with initial message
// @route   POST /api/chats/problem-solving
// @access  Private
exports.createProblemSolvingChat = async (req, res) => {
	try {
		const { message, model } = req.body

		if (!message || message.trim() === '') {
			return res.status(400).json({
				success: false,
				message: 'Message is required',
			})
		}

		// Generate a title based on the message
		const title = (await generateTitleWithAI(message)) || 'Problem rozwiązywania'

		// Create a new problem-solving chat
		const chat = await Chat.create({
			title,
			model: model || 'gpt-4o',
			chatType: 'problem-solving',
			user: req.user.id,
			agentData: {
				userQuestion: message,
				agentResponses: [],
				completed: false,
			},
		})

		// Add the initial user message
		chat.messages.push({
			role: 'user',
			content: message,
			timestamp: Date.now(),
		})

		await chat.save()

		res.status(201).json({
			success: true,
			data: chat,
		})
	} catch (error) {
		console.error('Error creating problem-solving chat:', error)
		res.status(500).json({
			success: false,
			message: 'Failed to create problem-solving chat',
		})
	}
}

// @desc    Process agent responses for problem-solving chat (Non-streaming version)
// @route   POST /api/chats/:id/process-agent
// @access  Private
exports.processAgentResponse = async (req, res) => {
	console.log(`[AgentBE] Received non-streaming request for chat ${req.params.id}, agent ${req.body.agentId}`)
	try {
		const { agentId, prompt } = req.body

		const chat = await Chat.findById(req.params.id)
		if (!chat) {
			console.error(`[AgentBE] Chat ${req.params.id} not found.`)
			return res.status(404).json({ success: false, message: 'Chat not found' })
		}
		if (chat.user.toString() !== req.user.id && req.user.role !== 'admin') {
			console.warn(`[AgentBE] User ${req.user.id} unauthorized for chat ${req.params.id}.`)
			return res.status(403).json({ success: false, message: 'Not authorized' })
		}
		if (chat.chatType !== 'problem-solving') {
			console.warn(`[AgentBE] Chat ${req.params.id} is not problem-solving type.`)
			return res.status(400).json({ success: false, message: 'Not a problem-solving chat' })
		}

		// Initialize agentData if it doesn't exist
		if (!chat.agentData) {
			console.log(`[AgentBE] Initializing agentData for chat ${req.params.id}`)
			chat.agentData = { userQuestion: prompt, agentResponses: [], completed: false }
		}

		const userQuestion = chat.agentData.userQuestion || prompt
		const previousResponses = chat.agentData.agentResponses || []
		let contextFromPreviousAgents = previousResponses.map(resp => `Agent ${resp.agentId}: ${resp.content}`).join('\n')

		// Define agent roles (keep concise)
		const agentRoles = {
			1: `Jesteś Analitykiem Systemowym. Twoim zadaniem jest przeprowadzenie głębokiej analizy problemu z wykorzystaniem zaawansowanych technik systemowych.

Problem: "${userQuestion}"

Format odpowiedzi:
ANALIZA SYSTEMOWA:
1. Mapowanie Systemu:
   - Zidentyfikuj wszystkie powiązane elementy
   - Opisz relacje między elementami
   - Wskaż punkty krytyczne

2. Analiza Przyczynowo-Skutkowa:
   - Główne przyczyny (min. 3 poziomy głębokości)
   - Efekty kaskadowe
   - Sprzężenia zwrotne

3. Punkty Leverage:
   - Zidentyfikuj punkty o największym potencjale zmiany
   - Oceń siłę wpływu (1-10)
   - Określ ryzyko interwencji

Ogranicz odpowiedź do 75 słów. Skup się na odkrywaniu nieoczywistych powiązań i wzorców.`,
			2: `Jesteś Ekspertem od Innowacji Przełomowych. Twoim zadaniem jest zaproponowanie radykalnie nowych podejść, wykorzystując techniki myślenia lateralnego i First Principles.

Problem: "${userQuestion}"
Poprzednia analiza: ${contextFromPreviousAgents}

Format odpowiedzi:
INNOWACYJNE PODEJŚCIA:
1. Dekonstrukcja Założeń:
   - Zakwestionuj [konkretne założenie]
   - Zaproponuj alternatywną perspektywę
   
2. Rozwiązania Przełomowe:
   - Inspiracja z innych dziedzin
   - Nieoczywiste połączenia
   
3. Radykalna Transformacja:
   - Całkowicie nowe podejście
   - Potencjał przełomowy

Ogranicz odpowiedź do 75 słów. Unikaj konwencjonalnych rozwiązań.`,
			3: `Jesteś Strategiem Implementacji. Wykorzystując analizę systemową i innowacyjne pomysły, opracuj konkretną strategię wdrożenia.

Problem: "${userQuestion}"
Poprzednie analizy: ${contextFromPreviousAgents}

Format odpowiedzi:
STRATEGIA WDROŻENIA:
1. Architektura Rozwiązania:
   - Kluczowe komponenty
   - Zależności i interakcje
   
2. Plan Transformacji:
   - Sekwencja zmian
   - Punkty kontrolne
   
3. Zarządzanie Ryzykiem:
   - Identyfikacja zagrożeń
   - Strategie mitygacji

Ogranicz odpowiedź do 75 słów. Skup się na wykonalności i konkretach.`,
			4: `Jesteś Ekspertem od Optymalizacji Behawioralnej. Twoje zadanie to analiza i projektowanie aspektów psychologicznych i behawioralnych rozwiązania.

Problem: "${userQuestion}"
Poprzednie analizy: ${contextFromPreviousAgents}

Format odpowiedzi:
OPTYMALIZACJA BEHAWIORALNA:
1. Analiza Motywacji:
   - Główne czynniki motywacyjne
   - Bariery psychologiczne
   
2. Projektowanie Zachowań:
   - Wyzwalacze (triggers)
   - Pętle nawyków
   
3. Systemy Wsparcia:
   - Mechanizmy wzmacniające
   - Punkty interwencji

Ogranicz odpowiedź do 75 słów. Skup się na trwałej zmianie zachowań.`,
			5: `Jesteś Integratorem Rozwiązań. Twoim zadaniem jest krytyczna analiza poprzednich propozycji i stworzenie spójnego, synergicznego rozwiązania.

Problem: "${userQuestion}"
Poprzednie analizy: ${contextFromPreviousAgents}

Format odpowiedzi:
INTEGRACJA ROZWIĄZAŃ:
1. Analiza Krytyczna:
   - Konflikty między propozycjami
   - Synergie do wykorzystania
   
2. Synteza Rozwiązania:
   - Kluczowe elementy każdego podejścia
   - Nowe połączenia
   
3. Wzmocnienie Efektów:
   - Efekty mnożnikowe
   - Optymalizacje systemowe

Ogranicz odpowiedź do 75 słów. Skup się na tworzeniu wartości dodanej poprzez integrację.`,
			6: `Jesteś Strategicznym Architektem Rozwiązań. Twoim zadaniem jest stworzenie kompleksowej architektury końcowego rozwiązania i planu jego realizacji.

Problem: "${userQuestion}"
Poprzednie analizy: ${contextFromPreviousAgents}

Format odpowiedzi:
ARCHITEKTURA KOŃCOWA:

1. MAPA ROZWIĄZANIA:
- Model konceptualny
- Kluczowe komponenty i ich interakcje
- Punkty krytyczne systemu

2. ANALIZA STRATEGICZNA:
- Unikalne wartości każdego podejścia
- Synergie i konflikty
- Innowacje systemowe

3. ARCHITEKTURA WDROŻENIA:
- Mapa transformacji
- Sekwencja zmian
- Mechanizmy adaptacji

4. SYSTEM ZARZĄDZANIA:
- Metryki sukcesu
- Mechanizmy kontroli
- Protokoły adaptacji

5. PLAN REALIZACJI:
- Kamienie milowe
- Zasoby krytyczne
- Ścieżka krytyczna

Ogranicz odpowiedź do 1024 tokenów. Skup się na innowacyjności i wykonalności.`,
		}

		if (!agentRoles[agentId]) {
			console.error(`[AgentBE] Invalid agentId ${agentId} for chat ${req.params.id}.`)
			return res.status(400).json({ success: false, message: 'Invalid agent ID' })
		}

		const messages = [
			{ role: 'system', content: agentRoles[agentId] },
			{ role: 'user', content: `Analyze the following problem and provide your expert response: ${userQuestion}` },
		]

		console.log(
			`[AgentBE] Calling AI service for agent ${agentId}, chat ${req.params.id}, model ${chat.model || 'gpt-4o'}`
		)
		const aiServiceResponse = await aiService.generateResponse({
			model: chat.model || 'gpt-4o',
			messages,
			stream: false, // Non-streaming call
			userId: req.user.id,
			max_tokens: agentId === 6 ? 1024 : 100, // 1024 tokens for summary agent, 100 for others
		})

		const agentResponseContent = aiServiceResponse.isStreaming
			? 'Error: Expected non-streaming response'
			: aiServiceResponse.response

		console.log(`[AgentBE] Received AI response for agent ${agentId}, chat ${req.params.id}. Saving...`)

		// Ensure agentResponses array exists
		if (!Array.isArray(chat.agentData.agentResponses)) {
			chat.agentData.agentResponses = []
		}

		// Update or add the agent response
		const existingResponseIndex = chat.agentData.agentResponses.findIndex(r => r.agentId === agentId)
		if (existingResponseIndex > -1) {
			chat.agentData.agentResponses[existingResponseIndex].content = agentResponseContent
			chat.agentData.agentResponses[existingResponseIndex].timestamp = Date.now()
		} else {
			chat.agentData.agentResponses.push({
				agentId,
				content: agentResponseContent,
				timestamp: Date.now(),
			})
		}

		if (agentId === 6) {
			chat.agentData.completed = true
			console.log(`[AgentBE] Agent 6 completed, marking chat ${req.params.id} as completed.`)
		}

		await chat.save()
		console.log(`[AgentBE] Chat ${req.params.id} saved successfully.`)

		res.status(200).json({
			success: true,
			data: {
				agentId,
				response: agentResponseContent,
				completed: agentId === 6,
			},
		})
	} catch (error) {
		console.error(`[AgentBE] Error processing non-streaming agent response for chat ${req.params.id}:`, error)
		res.status(500).json({
			success: false,
			message: `Failed to process agent response: ${error.message}`,
		})
	}
}

// @desc    Process agent responses for problem-solving chat with streaming
// @route   POST /api/chats/:id/process-agent-stream
// @access  Private
exports.processAgentStreamResponse = async (req, res) => {
	const { agentId } = req.body
	const chatId = req.params.id
	console.log(`[AgentStreamBE] Received streaming request for chat ${chatId}, agent ${agentId}`)

	// Set up SSE headers
	res.setHeader('Content-Type', 'text/event-stream')
	res.setHeader('Cache-Control', 'no-cache')
	res.setHeader('Connection', 'keep-alive')
	const origin = req.headers.origin || '*'
	res.setHeader('Access-Control-Allow-Origin', origin)
	res.setHeader('Access-Control-Allow-Credentials', 'true')

	const sendEvent = data => {
		res.write(`data: ${JSON.stringify(data)}\n\n`)
	}

	try {
		const chat = await Chat.findById(chatId)
		if (!chat) {
			console.error(`[AgentStreamBE] Chat ${chatId} not found.`)
			sendEvent({ error: 'Chat not found' })
			return res.end()
		}
		if (chat.user.toString() !== req.user.id && req.user.role !== 'admin') {
			console.warn(`[AgentStreamBE] User ${req.user.id} unauthorized for chat ${chatId}.`)
			sendEvent({ error: 'Not authorized' })
			return res.end()
		}
		if (chat.chatType !== 'problem-solving') {
			console.warn(`[AgentStreamBE] Chat ${chatId} is not problem-solving type.`)
			sendEvent({ error: 'Not a problem-solving chat' })
			return res.end()
		}

		// Initialize agentData if it doesn't exist
		if (!chat.agentData) {
			console.log(`[AgentStreamBE] Initializing agentData for chat ${chatId}`)
			chat.agentData = { userQuestion: 'Initial prompt not set', agentResponses: [], completed: false }
		}
		// Ensure agentResponses array exists
		if (!Array.isArray(chat.agentData.agentResponses)) {
			chat.agentData.agentResponses = []
		}

		const userQuestion = chat.agentData.userQuestion || 'Describe the problem.' // Fallback
		const previousResponses = chat.agentData.agentResponses || []
		// IMPORTANT: Filter out any potential response from the *current* agent ID to avoid self-referencing context
		let contextFromPreviousAgents = previousResponses
			.filter(resp => resp.agentId !== agentId)
			.map(resp => `Agent ${resp.agentId}: ${resp.content}`)
			.join('\n')

		// Define agent roles (keep concise) - same as non-streaming but used for the prompt
		const agentRoles = {
			1: `Jesteś Analitykiem Systemowym. Twoim zadaniem jest przeprowadzenie głębokiej analizy problemu z wykorzystaniem zaawansowanych technik systemowych.

Problem: "${userQuestion}"

Format odpowiedzi:
ANALIZA SYSTEMOWA:
1. Mapowanie Systemu:
   - Zidentyfikuj wszystkie powiązane elementy
   - Opisz relacje między elementami
   - Wskaż punkty krytyczne

2. Analiza Przyczynowo-Skutkowa:
   - Główne przyczyny (min. 3 poziomy głębokości)
   - Efekty kaskadowe
   - Sprzężenia zwrotne

3. Punkty Leverage:
   - Zidentyfikuj punkty o największym potencjale zmiany
   - Oceń siłę wpływu (1-10)
   - Określ ryzyko interwencji

ANALIZA PLANOWANIA:
- Etap 1: [opis]
- Etap 2: [opis]
- Etap 3: [opis]
...

Ogranicz odpowiedź do 75 słów. Skup się na konkretnych, wykonalnych krokach.`,
			2: `Jesteś Analitykiem Problemu. Twoim zadaniem jest przeanalizowanie problemu i dostarczenie kluczowych spostrzeżeń na podstawie poprzednich analiz. Problem: "${userQuestion}". Poprzednie analizy: ${contextFromPreviousAgents}. 

Format odpowiedzi:
WYNIKI ANALIZY:
- Spostrzeżenie 1: [opis]
- Spostrzeżenie 2: [opis]
- Spostrzeżenie 3: [opis]
...

Ogranicz odpowiedź do 75 słów. Skup się na najważniejszych wnioskach.`,
			3: `Jesteś Pierwszym Projektantem Rozwiązań. Twoim zadaniem jest opracowanie konwencjonalnego rozwiązania w oparciu o podstawowe zasady. Problem: "${userQuestion}". Poprzednie analizy: ${contextFromPreviousAgents}. 

Format odpowiedzi:
PODEJŚCIE DO ROZWIĄZANIA #1:
- Metoda 1: [opis]
- Metoda 2: [opis]
- Metoda 3: [opis]
...

Ogranicz odpowiedź do 75 słów. Skup się na sprawdzonych, konwencjonalnych metodach.`,
			4: `Jesteś Drugim Projektantem Rozwiązań. Twoim zadaniem jest zaproponowanie alternatywnego, kreatywnego podejścia. Problem: "${userQuestion}". Poprzednie analizy: ${contextFromPreviousAgents}. 

Format odpowiedzi:
PODEJŚCIE DO ROZWIĄZANIA #2:
- Pomysł 1: [opis]
- Pomysł 2: [opis]
- Pomysł 3: [opis]
...

Ogranicz odpowiedź do 75 słów. Skup się na innowacyjnych, niestandardowych rozwiązaniach.`,
			5: `Jesteś Optymalizatorem Rozwiązań. Twoim zadaniem jest połączenie i optymalizacja poprzednich podejść. Problem: "${userQuestion}". Poprzednie analizy: ${contextFromPreviousAgents}. 

Format odpowiedzi:
ZOPTYMALIZOWANE PODEJŚCIE:
- Usprawnienie 1: [opis]
- Usprawnienie 2: [opis]
- Usprawnienie 3: [opis]
...

Ogranicz odpowiedź do 75 słów. Skup się na łączeniu najlepszych elementów poprzednich rozwiązań.`,
			6: `Jesteś Ekspertem ds. Podsumowań. Twoim zadaniem jest stworzenie kompleksowej analizy wszystkich poprzednich odpowiedzi agentów. Problem: "${userQuestion}". Poprzednie analizy: ${contextFromPreviousAgents}. 

Format odpowiedzi (zachowaj dokładnie tę strukturę):

PODSUMOWANIE KOŃCOWE:

1. ANALIZA PROBLEMU:
- Krótki opis problemu
- Kluczowe wyzwania
- Kontekst sytuacji

2. SYNTEZA POPRZEDNICH ANALIZ:
- Agent 1 (Planista): Główne punkty planowania
- Agent 2 (Analityk): Kluczowe wnioski z analizy
- Agent 3 (Rozwiązanie #1): Najważniejsze elementy podejścia
- Agent 4 (Rozwiązanie #2): Alternatywne propozycje
- Agent 5 (Optymalizacja): Kluczowe usprawnienia

3. REKOMENDOWANE ROZWIĄZANIE:
- Proponowane podejście
- Kluczowe kroki implementacji
- Potencjalne ryzyka i ich mitygacja

4. WNIOSKI KOŃCOWE:
- Ocena wykonalności (1-10)
- Przewidywany czas realizacji
- Główne korzyści
- Potencjalne wyzwania

5. NASTĘPNE KROKI:
- Konkretne działania do podjęcia
- Priorytety
- Rekomendacje długoterminowe

Ogranicz odpowiedź do 1024 tokenów. Skup się na najważniejszych informacjach i kluczowych wnioskach.`,
		}

		if (!agentRoles[agentId]) {
			console.error(`[AgentStreamBE] Invalid agentId ${agentId} for chat ${chatId}.`)
			sendEvent({ error: 'Invalid agent ID' })
			return res.end()
		}

		const messages = [
			{ role: 'system', content: agentRoles[agentId] },
			{ role: 'user', content: `Provide your expert response for the problem: ${userQuestion}` },
		]

		console.log(
			`[AgentStreamBE] Calling AI service (streaming) for agent ${agentId}, chat ${chatId}, model ${
				chat.model || 'gpt-4o'
			}`
		)

		const aiResponseStream = await aiService.generateResponse({
			model: chat.model || 'gpt-4o',
			messages,
			stream: true,
			userId: req.user.id,
			max_tokens: agentId === 6 ? 1024 : 220, // 1024 tokens for summary agent, 150 for streaming agents
		})

		let fullResponseContent = ''
		const responseStream = aiResponseStream.response // Get the actual stream

		responseStream.on('data', chunk => {
			const rawData = chunk.toString()
			// console.log(`[AgentStreamBE] Raw chunk for agent ${agentId}, chat ${chatId}:`, rawData) // Verbose logging

			// Process potential multiple events in one chunk
			const lines = rawData.split('\n').filter(line => line.trim())
			lines.forEach(line => {
				if (line.startsWith('data: ')) {
					const jsonData = line.substring(6).trim()
					if (jsonData === '[DONE]') {
						// OpenAI specific DONE signal, ignore here as we handle 'end' event
						return
					}
					try {
						const parsedData = JSON.parse(jsonData)
						// OpenAI/Deepseek format
						if (parsedData.choices && parsedData.choices[0]?.delta?.content) {
							const contentChunk = parsedData.choices[0].delta.content
							fullResponseContent += contentChunk
							sendEvent({ agentId, chunk: contentChunk, done: false })
						}
						// Anthropic format
						else if (parsedData.type === 'content_block_delta' && parsedData.delta?.type === 'text_delta') {
							const contentChunk = parsedData.delta.text
							fullResponseContent += contentChunk
							sendEvent({ agentId, chunk: contentChunk, done: false })
						} else if (parsedData.type === 'message_start') {
							// Useful for knowing max tokens, etc. but ignore for content stream
						} else if (parsedData.type === 'message_delta') {
							// Contains usage info, ignore for content stream
						} else if (parsedData.type === 'content_block_stop') {
							// Ignore stop signal
						} else if (parsedData.type === 'message_stop') {
							// Ignore stop signal, handled by 'end'
						}
					} catch (e) {
						console.error(
							`[AgentStreamBE] Error parsing JSON chunk for agent ${agentId}, chat ${chatId}: ${e.message}. Chunk: ${jsonData}`
						)
						// Don't send error event for parsing errors, might just be partial data
					}
				}
			})
		})

		responseStream.on('end', async () => {
			console.log(`[AgentStreamBE] Stream ended for agent ${agentId}, chat ${chatId}. Saving full response.`)
			try {
				// Update or add the agent response in the database
				const existingResponseIndex = chat.agentData.agentResponses.findIndex(r => r.agentId === agentId)
				if (existingResponseIndex > -1) {
					chat.agentData.agentResponses[existingResponseIndex].content = fullResponseContent
					chat.agentData.agentResponses[existingResponseIndex].timestamp = Date.now()
					console.log(`[AgentStreamBE] Updated existing response for agent ${agentId} in chat ${chatId}.`)
				} else {
					chat.agentData.agentResponses.push({
						agentId,
						content: fullResponseContent,
						timestamp: Date.now(),
					})
					console.log(`[AgentStreamBE] Added new response for agent ${agentId} in chat ${chatId}.`)
				}

				if (agentId === 6) {
					chat.agentData.completed = true
					console.log(`[AgentStreamBE] Agent 6 completed, marking chat ${chatId} as completed.`)
				}
				await chat.save()
				console.log(`[AgentStreamBE] Chat ${chatId} saved successfully after stream end.`)

				// Send final 'done' event
				sendEvent({ agentId, chunk: '', done: true, completed: agentId === 6 })
			} catch (saveError) {
				console.error(`[AgentStreamBE] Error saving chat ${chatId} after stream end:`, saveError)
				sendEvent({ error: `Failed to save chat: ${saveError.message}` })
			} finally {
				res.end() // Ensure response is closed
			}
		})

		responseStream.on('error', error => {
			console.error(`[AgentStreamBE] Stream error for agent ${agentId}, chat ${chatId}:`, error)
			sendEvent({ error: `Stream error: ${error.message}` })
			res.end() // Ensure response is closed on error
		})
	} catch (error) {
		console.error(`[AgentStreamBE] General error processing stream for agent ${agentId}, chat ${chatId}:`, error)
		// Ensure headers are set before writing error if possible
		if (!res.headersSent) {
			res.setHeader('Content-Type', 'text/event-stream')
			// ... other headers
		}
		sendEvent({ error: `Server error: ${error.message}` })
		res.end()
	}
}

// Helper function to generate a title using Claude API
const generateTitleWithAI = async message => {
	try {
		// Check which API keys are available
		const CLAUDE_API = process.env.CLAUDE_API
		const OPENAI_API = process.env.OPENAI_API

		// First try Claude API if available
		if (CLAUDE_API) {
			try {
				const response = await axios.post(
					'https://api.anthropic.com/v1/messages',
					{
						model: 'claude-3-5-sonnet-20240620',
						max_tokens: 50,
						messages: [
							{
								role: 'user',
								content: `Wygeneruj krótki, opisowy tytuł (maksymalnie 5 słów) dla rozmowy, która zaczyna się od następującej wiadomości: "${message}". Zwróć tylko tytuł, bez cudzysłowów ani innych znaków.`,
							},
						],
					},
					{
						headers: {
							'Content-Type': 'application/json',
							'x-api-key': CLAUDE_API,
							'anthropic-version': '2023-06-01',
						},
					}
				)

				let title = response.data.content[0].text.trim()

				// Clean up the title
				title = title.replace(/^["']|["']$/g, '') // Remove quotes if they exist
				return title.length > 50 ? title.substring(0, 47) + '...' : title
			} catch (claudeError) {
				console.error('Claude API error generating title:', claudeError)
				// Fall through to OpenAI if Claude fails
			}
		}

		// Try OpenAI if Claude is not available or failed
		if (OPENAI_API) {
			try {
				const response = await axios.post(
					'https://api.openai.com/v1/chat/completions',
					{
						model: 'gpt-3.5-turbo',
						max_tokens: 50,
						messages: [
							{
								role: 'user',
								content: `Wygeneruj krótki, opisowy tytuł (maksymalnie 5 słów) dla rozmowy, która zaczyna się od następującej wiadomości: "${message}". Zwróć tylko tytuł, bez cudzysłowów ani innych znaków.`,
							},
						],
					},
					{
						headers: {
							'Content-Type': 'application/json',
							Authorization: `Bearer ${OPENAI_API}`,
						},
					}
				)

				let title = response.data.choices[0].message.content.trim()

				// Clean up the title
				title = title.replace(/^["']|["']$/g, '') // Remove quotes if they exist
				return title.length > 50 ? title.substring(0, 47) + '...' : title
			} catch (openaiError) {
				console.error('OpenAI API error generating title:', openaiError)
				// Fall through to default title
			}
		}

		// If no API is available or both failed, return default title
		console.log('No API keys available for title generation, using default title')
		return 'Nowa rozmowa'
	} catch (error) {
		console.error('Error generating title:', error)
		return 'Nowa rozmowa'
	}
}

// @desc    Add a message to a chat
// @route   POST /api/chats/:id/messages
// @access  Private
exports.addMessage = async (req, res) => {
	try {
		const { content, role, model, attachment, commandUsed, assistantUsed, promptUsed } = req.body

		// Validate required content
		if (!content || content.trim() === '') {
			return res.status(400).json({
				success: false,
				message: 'Message content is required',
			})
		}

		let chat = await Chat.findById(req.params.id)

		// Check if chat exists
		if (!chat) {
			return res.status(404).json({
				success: false,
				message: 'Chat not found',
			})
		}

		// Check if user owns the chat
		if (chat.user.toString() !== req.user.id && req.user.role !== 'admin') {
			return res.status(403).json({
				success: false,
				message: 'Not authorized to add messages to this chat',
			})
		}

		// Create the message with sanitized content
		const newMessage = {
			content: content.trim(),
			role: role || 'user',
			model,
			attachment,
			commandUsed,
			assistantUsed,
			promptUsed,
			timestamp: Date.now(),
		}

		// Add message to chat
		chat.messages.push(newMessage)

		// Generate a title for the chat if it's the first message and has default title
		if (chat.messages.length === 1 && chat.title === 'Nowa rozmowa' && role === 'user') {
			chat.title = await generateTitleWithAI(content)
		}

		// Update lastActive timestamp
		chat.lastActive = Date.now()

		// Save the chat
		await chat.save()

		res.status(200).json({
			success: true,
			data: {
				chat,
				message: newMessage,
			},
		})
	} catch (error) {
		console.error('Error adding message:', error)
		res.status(500).json({
			success: false,
			message: 'Failed to add message',
		})
	}
}

// @desc    Update chat details
// @route   PUT /api/chats/:id
// @access  Private
exports.updateChat = async (req, res) => {
	try {
		const { title, isFavorite, isArchived, chatType } = req.body

		let chat = await Chat.findById(req.params.id)

		// Check if chat exists
		if (!chat) {
			return res.status(404).json({
				success: false,
				message: 'Chat not found',
			})
		}

		// Check if user owns the chat
		if (chat.user.toString() !== req.user.id && req.user.role !== 'admin') {
			return res.status(403).json({
				success: false,
				message: 'Not authorized to update this chat',
			})
		}

		// Update chat fields if they are provided
		if (title !== undefined) chat.title = title
		if (isFavorite !== undefined) chat.isFavorite = isFavorite
		if (isArchived !== undefined) chat.isArchived = isArchived
		if (chatType !== undefined) chat.chatType = chatType

		// Save the chat
		await chat.save()

		res.status(200).json({
			success: true,
			data: chat,
		})
	} catch (error) {
		console.error('Error updating chat:', error)
		res.status(500).json({
			success: false,
			message: 'Failed to update chat',
		})
	}
}

// @desc    Delete a chat and all associated data
// @route   DELETE /api/chats/:id
// @access  Private
exports.deleteChat = async (req, res) => {
	try {
		const chat = await Chat.findById(req.params.id)

		// Check if chat exists
		if (!chat) {
			return res.status(404).json({
				success: false,
				message: 'Chat not found',
			})
		}

		// Check if user owns the chat
		if (chat.user.toString() !== req.user.id && req.user.role !== 'admin') {
			return res.status(403).json({
				success: false,
				message: 'Not authorized to delete this chat',
			})
		}

		// Start a session for atomic operations
		const session = await mongoose.startSession()
		session.startTransaction()

		try {
			// Delete the chat and all its data
			await chat.deleteOne({ session })

			// Commit the transaction
			await session.commitTransaction()
		} catch (error) {
			// If anything fails, abort the transaction
			await session.abortTransaction()
			throw error
		} finally {
			// End the session
			session.endSession()
		}

		res.status(200).json({
			success: true,
			message: 'Chat and all associated data successfully deleted',
			data: {},
		})
	} catch (error) {
		console.error('Error deleting chat:', error)
		res.status(500).json({
			success: false,
			message: 'Failed to delete chat and its associated data',
		})
	}
}

// @desc    Create a new infinite conversation
// @route   POST /api/chats/infinite
// @access  Private
exports.createInfiniteChat = async (req, res) => {
	try {
		const { topic, model, persona1Id, persona2Id } = req.body

		if (!topic || !persona1Id || !persona2Id) {
			return res.status(400).json({
				success: false,
				message: 'Topic and both persona IDs are required',
			})
		}

		// Get the user to access their assistants
		const user = await User.findById(req.user.id)
		if (!user) {
			return res.status(404).json({
				success: false,
				message: 'User not found',
			})
		}

		// Find the selected assistants from user's assistants array
		const persona1 = user.assistants.id(persona1Id)
		const persona2 = user.assistants.id(persona2Id)

		if (!persona1 || !persona2) {
			return res.status(404).json({
				success: false,
				message: 'One or both personas not found',
			})
		}

		// Generate a title based on the topic
		const title = `Infinite: ${topic.substring(0, 30)}${topic.length > 30 ? '...' : ''}`

		// Create a new infinite chat
		const chat = await Chat.create({
			title,
			model: model || 'gpt-4o',
			chatType: 'infinite',
			user: req.user.id,
			infiniteData: {
				topic,
				personas: [
					{
						personaId: persona1Id,
						name: persona1.name,
						description: persona1.description || '',
						instructions: persona1.instructions || '',
						systemPrompt: persona1.systemPrompt || '',
						avatarImage: persona1.avatarImage || '',
						messageCount: 0,
					},
					{
						personaId: persona2Id,
						name: persona2.name,
						description: persona2.description || '',
						instructions: persona2.instructions || '',
						systemPrompt: persona2.systemPrompt || '',
						avatarImage: persona2.avatarImage || '',
						messageCount: 0,
					},
				],
				activePersonaIndex: 0,
				messageIndex: 0,
				crucialMoments: [],
			},
		})

		res.status(201).json({
			success: true,
			data: chat,
		})
	} catch (error) {
		console.error('Error creating infinite chat:', error)
		res.status(500).json({
			success: false,
			message: 'Failed to create infinite chat',
		})
	}
}

// @desc    Process next message in infinite conversation
// @route   POST /api/chats/:id/infinite-next
// @access  Private
exports.processInfiniteNext = async (req, res) => {
	const infinitePrompts = require('../prompts/infinitePrompts')
	const aiService = require('../services/aiService')

	try {
		console.log(`[INFINITE] Processing infinite next for chat ${req.params.id}`)
		console.log(`[INFINITE] Request body:`, req.body)

		// Find the chat
		const chat = await Chat.findById(req.params.id)

		// Check if chat exists
		if (!chat) {
			console.error(`[INFINITE] Chat ${req.params.id} not found`)
			return res.status(404).json({
				success: false,
				message: 'Chat not found',
			})
		}

		// Check if user owns the chat
		if (chat.user.toString() !== req.user.id && req.user.role !== 'admin') {
			console.error(`[INFINITE] User ${req.user.id} not authorized to access chat ${req.params.id}`)
			return res.status(403).json({
				success: false,
				message: 'Not authorized to access this chat',
			})
		}

		// Check if chat is infinite type
		if (chat.chatType !== 'infinite') {
			console.error(`[INFINITE] Chat ${req.params.id} is not an infinite chat (type: ${chat.chatType})`)
			return res.status(400).json({
				success: false,
				message: 'This is not an infinite conversation chat',
			})
		}

		// Get chat data
		const infiniteData = chat.infiniteData
		const topic = infiniteData.topic
		const personas = infiniteData.personas

		// Use activePersonaIndex from request body if provided, otherwise use the one from chat data
		const activePersonaIndex =
			req.body.activePersonaIndex !== undefined
				? parseInt(req.body.activePersonaIndex)
				: infiniteData.activePersonaIndex || 0

		// Ensure activePersonaIndex is valid
		if (activePersonaIndex < 0 || activePersonaIndex >= personas.length) {
			console.error(`[INFINITE] Invalid activePersonaIndex: ${activePersonaIndex}`)
			return res.status(400).json({
				success: false,
				message: 'Invalid activePersonaIndex',
			})
		}

		const activePersona = personas[activePersonaIndex]
		const otherPersonaIndex = activePersonaIndex === 0 ? 1 : 0
		const otherPersona = personas[otherPersonaIndex]

		console.log(`[INFINITE] Processing next message for chat ${req.params.id}:`)
		console.log(`[INFINITE] - Topic: ${topic}`)
		console.log(`[INFINITE] - Active persona: ${activePersona.name} (index: ${activePersonaIndex})`)
		console.log(`[INFINITE] - Next persona: ${otherPersona.name} (index: ${otherPersonaIndex})`)

		// Set headers for streaming with proper CORS
		res.setHeader('Content-Type', 'text/event-stream')
		res.setHeader('Cache-Control', 'no-cache')
		res.setHeader('Connection', 'keep-alive')

		// Add CORS headers - Use the origin from the request instead of wildcard
		const origin = req.headers.origin || (req.headers.referer ? new URL(req.headers.referer).origin : '*')
		res.setHeader('Access-Control-Allow-Origin', origin)
		res.setHeader('Access-Control-Allow-Credentials', 'true')
		res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization')
		res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')

		// Send initial connection event
		res.write(`data: ${JSON.stringify({ status: 'connected' })}\n\n`)

		try {
			// Get user's name if available
			const user = await User.findById(req.user.id).select('username name').lean()
			const username = user ? user.name || user.username || 'User' : 'User'

			let messages = []
			let prompt = ''
			let conversationHistory = ''

			// Get previous messages for context
			if (chat.messages.length > 0) {
				// Collect the last 5 messages (or all if less than 5) - reduced from 10 to avoid token issues
				const contextMessages = chat.messages.slice(-5)

				// Format conversation history for the prompt
				conversationHistory = contextMessages
					.map(msg => {
						const personaName = msg.role === 'assistant' ? personas[msg.personaIndex].name : username
						return `${personaName}: ${msg.content}`
					})
					.join('\n\n')

				// If this is the first message from any persona
				if (activePersona.messageCount === 0) {
					prompt = infinitePrompts.initiateConversation
						.replace(/{personaName}/g, activePersona.name)
						.replace(/{personaDescription}/g, activePersona.description || '')
						.replace(/{topic}/g, topic)
						.replace(/{username}/g, username)
						.replace(/{otherPersonaName}/g, otherPersona.name)
				} else {
					// For continuing the conversation
					prompt = infinitePrompts.continueConversation
						.replace(/{personaName}/g, activePersona.name)
						.replace(/{otherPersonaName}/g, otherPersona.name)
						.replace(/{topic}/g, topic)
						.replace(/{conversationHistory}/g, conversationHistory)
						.replace(/{username}/g, username)
				}
			} else {
				// First message of the conversation
				prompt = infinitePrompts.initiateConversation
					.replace(/{personaName}/g, activePersona.name)
					.replace(/{personaDescription}/g, activePersona.description || '')
					.replace(/{topic}/g, topic)
					.replace(/{username}/g, username)
					.replace(/{otherPersonaName}/g, otherPersona.name)
			}

			// Prepare system message with the persona's instructions and system prompt
			let systemMessage = `Jesteś ${activePersona.name}.`

			if (activePersona.description) {
				systemMessage += ` ${activePersona.description}`
			}

			if (activePersona.instructions) {
				systemMessage += `\n\nINSTRUKCJE:\n${activePersona.instructions}`
			}

			if (activePersona.systemPrompt) {
				systemMessage += `\n\nPROMPT SYSTEMOWY:\n${activePersona.systemPrompt}`
			}

			// ADD TOKEN LIMITING FOR SHORTER RESPONSES
			systemMessage += `\n\nWAŻNE: Utrzymuj swoje odpowiedzi bardzo krótkie, zwięzłe i bezpośrednie. 
			Ogranicz się do maksymalnie 2-3 akapitów. Skup się na najważniejszych punktach.
			Twoja odpowiedź powinna zawierać mniej niż 100 słów łącznie.`

			// Prepare messages for AI service
			messages = [
				{ role: 'system', content: systemMessage },
				{ role: 'user', content: prompt },
			]

			console.log(`[INFINITE] Sending AI request for chat ${req.params.id}`)

			// Function to attempt API request with retry for rate limiting
			const makeRequestWithRetry = async (retryCount = 0) => {
				try {
					// Try to make the API request
					return await aiService.generateResponse({
						model: chat.model || 'gpt-4o',
						messages,
						stream: true,
						userId: req.user.id,
						max_tokens: 150,
					})
				} catch (error) {
					// If it's a rate limit error and we haven't exceeded max retries
					if (error.message && error.message.includes('429') && retryCount < 3) {
						// Get retry delay from headers or use exponential backoff
						const retryDelay = 2 ** retryCount * 1000 // 1s, 2s, 4s
						console.log(`[INFINITE] Rate limited. Retrying in ${retryDelay}ms (attempt ${retryCount + 1}/3)`)

						// Send retry message to client
						res.write(
							`data: ${JSON.stringify({
								status: 'retrying',
								message: `Rate limited. Retrying in ${retryDelay / 1000}s...`,
								attempt: retryCount + 1,
							})}\n\n`
						)

						// Wait before retrying
						await new Promise(resolve => setTimeout(resolve, retryDelay))

						// Retry the request
						return makeRequestWithRetry(retryCount + 1)
					}

					// If not a rate limit error or exceeded retries, rethrow
					throw error
				}
			}

			// Make request with retry logic
			const response = await makeRequestWithRetry()

			// Store full response for saving to database
			let fullResponse = ''
			let messageId = new mongoose.Types.ObjectId()

			console.log(`[INFINITE] AI request initiated, setting up stream handlers for chat ${req.params.id}`)

			// When the response is streaming
			response.response.on('data', chunk => {
				// Parse the chunk (removing 'data: ' prefix if needed)
				const rawData = chunk.toString()
				const lines = rawData.split('\n').filter(line => line.trim())

				lines.forEach(line => {
					let parsedData
					try {
						// Extract JSON content if it starts with 'data: '
						const jsonStr = line.startsWith('data: ') ? line.slice(5).trim() : line.trim()
						if (jsonStr && jsonStr !== '[DONE]') {
							parsedData = JSON.parse(jsonStr)

							// Check if the parsed data contains a delta with content
							if (
								parsedData.choices &&
								parsedData.choices[0] &&
								parsedData.choices[0].delta &&
								parsedData.choices[0].delta.content
							) {
								const content = parsedData.choices[0].delta.content
								fullResponse += content

								// Forward the chunk to the client with added metadata
								res.write(
									`data: ${JSON.stringify({
										id: messageId,
										personaIndex: activePersonaIndex,
										personaName: activePersona.name,
										content: content,
										delta: true,
									})}\n\n`
								)
							}
						}
					} catch (e) {
						// Skip malformed JSON
						console.error(`[INFINITE] JSON parse error: ${e.message}`)
					}
				})
			})

			// Handle end of stream
			response.response.on('end', async () => {
				console.log(`[INFINITE] Stream ended for chat ${req.params.id}, saving message`)

				// If the response is empty, provide a fallback
				if (!fullResponse.trim()) {
					fullResponse = `Jako ${activePersona.name}, zastanawiam się nad tematem "${topic}". Kontynuuję tę rozmowę z ${otherPersona.name}.`
				}

				// Save the message to the database
				const newMessage = {
					_id: messageId,
					role: 'assistant',
					content: fullResponse,
					timestamp: new Date().toISOString(),
					model: chat.model,
					personaIndex: activePersonaIndex,
				}

				chat.messages.push(newMessage)

				// Update persona message count
				personas[activePersonaIndex].messageCount++

				// --- Update Duration ---
				const startTime = chat.createdAt || new Date() // Fallback to now if createdAt isn't set yet
				const currentTime = new Date()
				const durationInSeconds = Math.floor((currentTime - startTime) / 1000)
				chat.duration = durationInSeconds
				// ---------------------

				// Update infinite data
				chat.infiniteData.activePersonaIndex = otherPersonaIndex
				chat.infiniteData.messageIndex++
				chat.infiniteData.personas = personas

				console.log(
					`[INFINITE] Saving chat ${req.params.id} with new message, duration ${durationInSeconds}s, and updated data`
				)

				try {
					// Save the chat
					await chat.save()

					// Send completion signal
					res.write(
						`data: ${JSON.stringify({
							id: messageId,
							personaIndex: activePersonaIndex,
							personaName: activePersona.name,
							content: fullResponse, // Include full content in completion message
							complete: true,
							nextPersona: otherPersona.name,
							nextPersonaIndex: otherPersonaIndex,
						})}\n\n`
					)

					console.log(`[INFINITE] Completed processing for chat ${req.params.id}`)
					res.end()
				} catch (saveError) {
					console.error(`[INFINITE] Error saving chat ${req.params.id}:`, saveError)
					res.write(`data: ${JSON.stringify({ error: `Error saving chat: ${saveError.message}` })}\n\n`)
					res.end()
				}
			})

			// Handle errors
			response.response.on('error', error => {
				console.error(`[INFINITE] Stream error for chat ${req.params.id}:`, error)
				res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`)
				res.end()
			})
		} catch (error) {
			console.error(`[INFINITE] Error processing infinite next for chat ${req.params.id}:`, error)
			res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`)
			res.end()
		}
	} catch (error) {
		console.error('[INFINITE] Error in processInfiniteNext:', error)
		res.status(500).json({
			success: false,
			message: 'Failed to process next infinite message',
		})
	}
}

// @desc    Get crucial moments for an infinite chat
// @route   GET /api/chats/:id/crucial-moments
// @access  Private
exports.getCrucialMoments = async (req, res) => {
	try {
		// Find the chat
		const chat = await Chat.findById(req.params.id)

		// Check if chat exists
		if (!chat) {
			return res.status(404).json({
				success: false,
				message: 'Chat not found',
			})
		}

		// Check if user owns the chat
		if (chat.user.toString() !== req.user.id && req.user.role !== 'admin') {
			return res.status(403).json({
				success: false,
				message: 'Not authorized to access this chat',
			})
		}

		// Check if chat is infinite type
		if (chat.chatType !== 'infinite') {
			return res.status(400).json({
				success: false,
				message: 'This is not an infinite conversation chat',
			})
		}

		// Return the crucial moments
		res.status(200).json({
			success: true,
			data: chat.infiniteData.crucialMoments || [],
		})
	} catch (error) {
		console.error('Error getting crucial moments:', error)
		res.status(500).json({
			success: false,
			message: 'Failed to get crucial moments',
		})
	}
}

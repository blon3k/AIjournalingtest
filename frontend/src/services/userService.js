import api from './api'

// Get user settings
const getUserSettings = async userId => {
	const response = await api.get(`/users/${userId}/settings`)
	return response.data.data
}

// Update user settings
const updateUserSettings = async (userId, settingsData) => {
	const response = await api.put(`/users/${userId}/settings`, settingsData)
	return response.data.data
}

// Get user context
const getUserContext = async userId => {
	const response = await api.get(`/users/${userId}/context`)
	return response.data.data
}

// Update user context
const updateUserContext = async (userId, contextData) => {
	const response = await api.put(`/users/${userId}/context`, contextData)
	return response.data.data
}

// Update user profile
const updateUser = async (userId, userData) => {
	const response = await api.put(`/users/${userId}`, userData)
	return response.data.data
}

// Get user system prompts
const getUserSystemPrompts = async userId => {
	const response = await api.get(`/users/${userId}/system-prompts`)
	return response.data.data
}

// Create a new system prompt
const createSystemPrompt = async (userId, promptData) => {
	const response = await api.post(`/users/${userId}/system-prompts`, promptData)
	return response.data.data
}

// Update a system prompt
const updateSystemPrompt = async (userId, promptId, promptData) => {
	const response = await api.put(`/users/${userId}/system-prompts/${promptId}`, promptData)
	return response.data.data
}

// Delete a system prompt
const deleteSystemPrompt = async (userId, promptId) => {
	const response = await api.delete(`/users/${userId}/system-prompts/${promptId}`)
	return response.data.data
}

// Get user assistants
const getUserAssistants = async userId => {
	const response = await api.get(`/users/${userId}/assistants`)
	return response.data.data
}

// Create a new assistant
const createAssistant = async (userId, assistantData) => {
	const response = await api.post(`/users/${userId}/assistants`, assistantData)
	return response.data.data
}

// Update an assistant
const updateAssistant = async (userId, assistantId, assistantData) => {
	const response = await api.put(`/users/${userId}/assistants/${assistantId}`, assistantData)
	return response.data.data
}

// Delete an assistant
const deleteAssistant = async (userId, assistantId) => {
	const response = await api.delete(`/users/${userId}/assistants/${assistantId}`)
	return response.data.data
}

const userService = {
	getUserSettings,
	updateUserSettings,
	getUserContext,
	updateUserContext,
	updateUser,
	getUserSystemPrompts,
	createSystemPrompt,
	updateSystemPrompt,
	deleteSystemPrompt,
	getUserAssistants,
	createAssistant,
	updateAssistant,
	deleteAssistant,
}

export default userService

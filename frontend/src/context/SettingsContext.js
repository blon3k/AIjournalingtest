import React, { createContext, useContext, useState, useEffect } from 'react'

// Create context
const SettingsContext = createContext()

// Initial settings
const defaultSettings = {
	theme: 'dark',
	language: 'en',
	desktopNotifications: false,
	soundEffects: false,
	defaultModel: 'gpt-4',
	streamResponses: true,
	openAiKey: '',
	anthropicKey: '',
	enableWebhooks: false,
	webhookUrl: '',
	webhookSecret: '',
	webhookEvents: {
		newChat: false,
		chatCompleted: false,
	},
	developerMode: false,
	showDebugConsole: false,
}

// Provider component
export const SettingsProvider = ({ children }) => {
	// Load settings from localStorage or use default
	const [settings, setSettings] = useState(() => {
		const savedSettings = localStorage.getItem('settings')
		return savedSettings ? JSON.parse(savedSettings) : defaultSettings
	})

	// Update settings
	const updateSettings = newSettings => {
		setSettings(prev => {
			const updated = { ...prev, ...newSettings }
			localStorage.setItem('settings', JSON.stringify(updated))
			return updated
		})
	}

	// Update theme in document when settings change
	useEffect(() => {
		document.documentElement.setAttribute('data-theme', settings.theme)
	}, [settings.theme])

	return <SettingsContext.Provider value={{ settings, updateSettings }}>{children}</SettingsContext.Provider>
}

// Custom hook to use settings context
export const useSettings = () => {
	const context = useContext(SettingsContext)
	if (!context) {
		throw new Error('useSettings must be used within a SettingsProvider')
	}
	return context
}

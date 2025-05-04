import React, { useState, useEffect } from 'react'
import Toggle from './Toggle'
import './ThemeSwitcher.css'

const ThemeSwitcher = () => {
	// Check for user's preferred color scheme or localStorage setting
	const getInitialTheme = () => {
		// First check what theme is currently applied to the document element
		const currentDocTheme = document.documentElement.getAttribute('data-theme')
		if (currentDocTheme) {
			return currentDocTheme === 'dark'
		}

		// If no theme is applied yet, check localStorage
		const savedTheme = localStorage.getItem('theme')
		if (savedTheme) {
			return savedTheme === 'dark'
		}

		// Default to dark theme
		return true
	}

	const [isDarkMode, setIsDarkMode] = useState(getInitialTheme)
	const [forceRender, setForceRender] = useState(0)

	// Update theme when component mounts and when theme changes
	useEffect(() => {
		const theme = isDarkMode ? 'dark' : 'light'
		document.documentElement.setAttribute('data-theme', theme)
		localStorage.setItem('theme', theme)

		// Force re-render after theme change
		if (forceRender > 0) {
			const timeoutId = setTimeout(() => {
				setForceRender(prev => prev + 1)
			}, 50)
			return () => clearTimeout(timeoutId)
		}
	}, [isDarkMode, forceRender])

	const toggleTheme = () => {
		setIsDarkMode(prevMode => !prevMode)
		// Trigger a re-render
		setForceRender(1)
	}

	return (
		<div className="theme-switcher" key={`theme-switcher-${isDarkMode}`}>
			<span className="theme-icon">{isDarkMode ? '🌙' : '☀️'}</span>
			<Toggle isOn={isDarkMode} handleToggle={toggleTheme} id={`theme-toggle-${forceRender}`} />
		</div>
	)
}

export default ThemeSwitcher

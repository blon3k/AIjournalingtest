import React, { useState, useEffect } from 'react'
import Toggle from './Toggle'
import './ThemeSwitcher.css'

const ThemeSwitcher = () => {
	// Check for user's preferred color scheme or localStorage setting
	const getInitialTheme = () => {
		const savedTheme = localStorage.getItem('theme')
		if (savedTheme) {
			return savedTheme === 'dark'
		}
		// Check user preference
		return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
	}

	const [isDarkMode, setIsDarkMode] = useState(getInitialTheme)

	// Update theme when component mounts and when theme changes
	useEffect(() => {
		const theme = isDarkMode ? 'dark' : 'light'
		document.documentElement.setAttribute('data-theme', theme)
		localStorage.setItem('theme', theme)
	}, [isDarkMode])

	const toggleTheme = () => {
		setIsDarkMode(!isDarkMode)
	}

	return (
		<div className="theme-switcher">
			<span className="theme-icon">{isDarkMode ? '🌙' : '☀️'}</span>
			<Toggle isOn={isDarkMode} handleToggle={toggleTheme} id="theme-toggle" />
		</div>
	)
}

export default ThemeSwitcher

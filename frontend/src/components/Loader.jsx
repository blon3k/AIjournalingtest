import React from 'react'
import './Loader.css'

const Loader = ({ size = 'medium', text = null, inline = false }) => {
	const sizeClass = `loader--${size}`
	return (
		<div className={`loader-container ${inline ? 'loader-container--inline' : ''}`}>
			<div className={`loader ${sizeClass}`}></div>
			{text && <p className="loader-text">{text}</p>}
		</div>
	)
}

export default Loader

import React from 'react'
import './Toggle.css'

const Toggle = ({ isOn, handleToggle, id }) => {
	return (
		<div className="toggle-container">
			<input checked={isOn} onChange={handleToggle} className="toggle-checkbox" id={id} type="checkbox" />
			<label className="toggle-label" htmlFor={id}>
				<span className="toggle-button" />
			</label>
		</div>
	)
}

export default Toggle

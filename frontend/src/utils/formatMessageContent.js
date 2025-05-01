import React from 'react'

/**
 * Formats a string with simple markdown (**bold**, ### headings) into React elements.
 * Handles newlines by creating separate paragraphs/divs.
 *
 * @param {string} text The text content to format.
 * @returns {React.ReactNode} A React fragment containing formatted elements.
 */
const formatMessageContent = text => {
	if (!text) {
		return null
	}

	// Split text into lines first to preserve paragraph structure
	const lines = text.split('\n')

	return (
		<>
			{lines.map((line, lineIndex) => {
				// Check if the line is a heading (starts with ###)
				if (line.trim().startsWith('###')) {
					const headingText = line.trim().substring(3).trim()
					return (
						<h3 key={lineIndex} className="chat-heading">
							{headingText}
						</h3>
					)
				}

				// Process each line for bold markdown
				// Split by bold tags, keeping the delimiters. Handles cases like **bold**text**bold**
				const parts = line.split(/(\*\*.*?\*\*)/g).filter(Boolean) // Filter out empty strings from split

				const formattedLine = parts
					.map((part, partIndex) => {
						// Check if the part matches the bold pattern
						if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
							// It's a bold part, remove the asterisks and wrap in <strong>
							const boldText = part.slice(2, -2)
							return <strong key={partIndex}>{boldText}</strong>
						} else if (part === '**') {
							// Handle cases where split might leave standalone '**' if input is like "****"
							return null
						} else {
							// It's a regular text part
							return <React.Fragment key={partIndex}>{part}</React.Fragment>
						}
					})
					.filter(Boolean) // Filter out any nulls (like standalone '**')

				// Render the formatted line in a div, or just a br if the line was empty originally
				// Need a key for the outer map element
				return (
					<div key={lineIndex} className="chat-formatted-line">
						{formattedLine.length > 0 ? formattedLine : <br />}
					</div>
				)
			})}
		</>
	)
}

export default formatMessageContent

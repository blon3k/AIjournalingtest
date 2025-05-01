import React, { useEffect, useRef, useState } from 'react'
import { X, Upload } from 'lucide-react'
import './Modal.css'
import uploadService from '../../services/uploadService'

const Modal = ({ isOpen, onClose, title, children, className = '', size = 'medium' }) => {
	const modalRef = useRef(null)
	const [uploadingImage, setUploadingImage] = useState(false)
	const [uploadProgress, setUploadProgress] = useState(0)
	const fileInputRef = useRef(null)

	// Close modal when clicking outside
	useEffect(() => {
		const handleClickOutside = event => {
			if (modalRef.current && !modalRef.current.contains(event.target)) {
				onClose()
			}
		}

		if (isOpen) {
			document.addEventListener('mousedown', handleClickOutside)
			// Prevent body scrolling when modal is open
			document.body.style.overflow = 'hidden'
		}

		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
			document.body.style.overflow = 'auto'
		}
	}, [isOpen, onClose])

	// Close on escape key
	useEffect(() => {
		const handleEscKey = event => {
			if (event.key === 'Escape') {
				onClose()
			}
		}

		if (isOpen) {
			document.addEventListener('keydown', handleEscKey)
		}

		return () => {
			document.removeEventListener('keydown', handleEscKey)
		}
	}, [isOpen, onClose])

	// Handle image upload
	const handleImageUpload = async (file, options = {}) => {
		try {
			setUploadingImage(true)
			setUploadProgress(0)

			const imageUrl = await uploadService.uploadImage(file, {
				...options,
				onProgress: percent => {
					setUploadProgress(percent)
				},
			})

			setUploadingImage(false)
			setUploadProgress(0)
			return imageUrl
		} catch (error) {
			console.error('Error uploading image:', error)
			setUploadingImage(false)
			setUploadProgress(0)
			throw error
		}
	}

	// Image upload component that can be used within modal content
	const ImageUploader = ({ onImageUpload, btnText = 'Upload Image', className = '' }) => {
		const triggerFileInput = () => {
			fileInputRef.current.click()
		}

		return (
			<div className={`image-uploader ${className}`}>
				<button className="upload-image-button" onClick={triggerFileInput} disabled={uploadingImage}>
					{uploadingImage ? (
						<div className="upload-progress">
							<div className="upload-progress-circle">
								<svg viewBox="0 0 36 36">
									<path
										className="upload-progress-bg"
										d="M18 2.0845
											a 15.9155 15.9155 0 0 1 0 31.831
											a 15.9155 15.9155 0 0 1 0 -31.831"
									/>
									<path
										className="upload-progress-fill"
										strokeDasharray={`${uploadProgress}, 100`}
										d="M18 2.0845
											a 15.9155 15.9155 0 0 1 0 31.831
											a 15.9155 15.9155 0 0 1 0 -31.831"
									/>
								</svg>
								<span className="upload-progress-percent">{uploadProgress}%</span>
							</div>
						</div>
					) : (
						<>
							<Upload size={16} strokeWidth={1.5} />
							<span>{btnText}</span>
						</>
					)}
				</button>
			</div>
		)
	}

	if (!isOpen) return null

	const modalTools = {
		ImageUploader,
		handleImageUpload,
		uploadingImage,
		uploadProgress,
		fileInputRef,
		onImageUploaded: imageUrl => {
			// This function will be used by the onChange handler of the file input
			// to notify the children components about the upload
			if (typeof children === 'function') {
				// Direct call to the onImageUpload prop if available
				const childProps = children(modalTools)
				if (childProps && childProps.props && typeof childProps.props.onImageUpload === 'function') {
					childProps.props.onImageUpload(imageUrl)
				}
			}
		},
	}

	return (
		<div className="modal-overlay">
			<div
				className={`modal-container ${className} modal-size-${size}`}
				ref={modalRef}
				role="dialog"
				aria-modal="true"
				aria-labelledby="modal-title">
				<div className="modal-header">
					<h2 id="modal-title" className="modal-title">
						{title}
					</h2>
					<button className="modal-close-button" onClick={onClose} aria-label="Zamknij">
						<X size={18} strokeWidth={1.5} />
					</button>
				</div>
				<div className="modal-content">
					{/* Shared file input used by both direct uploads and overlay uploads */}
					<input
						type="file"
						ref={fileInputRef}
						onChange={e => {
							const file = e.target.files[0]
							if (!file) return

							handleImageUpload(file)
								.then(imageUrl => {
									// Call the handleImageUploaded function directly passed from parent
									if (typeof children === 'function') {
										const childProps = children(modalTools)
										if (childProps && childProps.props && typeof childProps.props.onImageUpload === 'function') {
											childProps.props.onImageUpload(imageUrl)
										} else {
											// Try to access parent component handlers
											const childComponent = children(modalTools)
											const props = childComponent?.props

											// Look for parent handlers like handleImageUploaded
											if (typeof props?.onImageUpload === 'function') {
												props.onImageUpload(imageUrl)
												return // Return early if found
											}

											// Search through children array if it's an array
											if (Array.isArray(childComponent?.props?.children)) {
												const handlers = childComponent.props.children.filter(
													child => child && child.props && typeof child.props.onImageUpload === 'function'
												)
												if (handlers.length > 0 && typeof handlers[0].props.onImageUpload === 'function') {
													handlers[0].props.onImageUpload(imageUrl)
												}
											}
										}
									}
								})
								.catch(error => {
									console.error('Failed to upload image:', error)
								})

							// Clear the file input
							e.target.value = ''
						}}
						accept="image/*"
						className="file-input-hidden"
						style={{ display: 'none' }}
					/>
					{typeof children === 'function' ? children(modalTools) : children}
				</div>
			</div>
		</div>
	)
}

export default Modal

import React, { useState, useRef, useEffect } from 'react'
import './Profile.css'
import {
	Save,
	Upload,
	Trash2,
	Loader,
	Check,
	AlertTriangle,
	Shield,
	Bell,
	Palette,
	ChevronRight,
	User,
	Sun,
	Moon,
} from 'lucide-react'
import uploadService from '../services/uploadService'
import userService from '../services/userService'
import { useAuth } from '../context/AuthContext'

function Profile() {
	const { user, updateUserData } = useAuth()

	const [showSaveButton, setShowSaveButton] = useState(false)
	const [saveSuccess, setSaveSuccess] = useState(false)
	const [saveError, setSaveError] = useState(false)
	const [isSaving, setIsSaving] = useState(false)
	const [isLoading, setIsLoading] = useState(true)
	const [hasChanges, setHasChanges] = useState(false)
	const [activeSection, setActiveSection] = useState('personal')

	// Profile info state
	const [profileName, setProfileName] = useState('')
	const [profilePicture, setProfilePicture] = useState('')
	const profilePictureInputRef = useRef(null)

	// Add upload progress state
	const [profilePictureUploadProgress, setProfilePictureUploadProgress] = useState(0)

	// Fetch user settings on component mount
	useEffect(() => {
		if (user && user._id) {
			fetchUserData()
		}
	}, [user])

	// Fetch user data from API
	const fetchUserData = async () => {
		try {
			setIsLoading(true)

			// Set profile data
			setProfileName(user.name || '')
			setProfilePicture(user.avatar || '')

			setHasChanges(false)
		} catch (error) {
			console.error('Error fetching user settings:', error)
		} finally {
			setIsLoading(false)
		}
	}

	// Handle profile picture upload with progress
	const handleProfilePictureUpload = async e => {
		const file = e.target.files[0]
		if (file) {
			try {
				// Show loading indicator
				setIsSaving(true)
				setProfilePictureUploadProgress(0)

				// Use our Cloudinary upload service with progress tracking
				const imageUrl = await uploadService.uploadImage(file, {
					maxWidth: 300, // Optimize for profile pictures
					quality: 90, // Higher quality for profile pictures
					onProgress: percent => {
						setProfilePictureUploadProgress(percent)
					},
				})

				// Set the uploaded image URL
				setProfilePicture(imageUrl)
				setHasChanges(true)
				setIsSaving(false)
			} catch (error) {
				console.error('Error uploading profile picture:', error)
				setIsSaving(false)
				// Show error notification
				setSaveError(true)
				setTimeout(() => setSaveError(false), 3000)
			}
		}
	}

	// Save profile settings
	const saveProfile = async () => {
		try {
			setIsSaving(true)

			// Update user data
			const userData = {
				name: profileName,
				avatar: profilePicture,
			}

			await userService.updateUser(user._id, userData)

			// Update user data in Auth context
			updateUserData({
				...user,
				name: profileName,
				avatar: profilePicture,
			})

			// Show success notification
			setSaveSuccess(true)
			setTimeout(() => setSaveSuccess(false), 3000)

			setHasChanges(false)
		} catch (error) {
			console.error('Error saving profile settings:', error)
			setSaveError(true)
			setTimeout(() => setSaveError(false), 3000)
		} finally {
			setIsSaving(false)
		}
	}

	// Update show save button based on changes
	useEffect(() => {
		setShowSaveButton(hasChanges)
	}, [hasChanges])

	// Handle section change
	const handleSectionChange = section => {
		setActiveSection(section)
	}

	// Render the active section content
	const renderSectionContent = () => {
		switch (activeSection) {
			case 'personal':
				return (
					<div className="profile__section-content">
						<div className="profile__section-header">
							<h2 className="profile__section-title">Informacje osobiste</h2>
							<p className="profile__section-description">Dostosuj swoje podstawowe informacje profilowe</p>
						</div>

						<div className="profile__personal-settings">
							<div className="profile__picture-section">
								<label className="profile__label">Zdjęcie profilowe</label>
								<div className="profile__picture-container">
									<div className={`profile__picture-wrapper ${isSaving ? 'uploading' : ''}`}>
										{profilePicture ? (
											<div className="profile__picture-preview">
												<img src={profilePicture} alt="Profil" className="profile__picture-img" />
												<div className="profile__picture-overlay">
													<button
														className="profile__picture-action upload"
														onClick={() => profilePictureInputRef.current && profilePictureInputRef.current.click()}
														disabled={isSaving}>
														{isSaving ? (
															<div className="profile__loading-spinner-small"></div>
														) : (
															<Upload size={18} strokeWidth={1.5} />
														)}
													</button>
													<button
														className="profile__picture-action remove"
														onClick={() => {
															setProfilePicture('')
															setHasChanges(true)
														}}
														disabled={isSaving}>
														<Trash2 size={18} strokeWidth={1.5} />
													</button>
												</div>
											</div>
										) : (
											<div className="profile__picture-placeholder">
												<span>
													{profileName
														.split(' ')
														.map(n => n[0])
														.join('')
														.toUpperCase()}
												</span>
												<div className="profile__picture-overlay">
													<button
														className="profile__picture-action upload"
														onClick={() => profilePictureInputRef.current && profilePictureInputRef.current.click()}
														disabled={isSaving}>
														{isSaving ? (
															<div className="profile__loading-spinner-small"></div>
														) : (
															<Upload size={18} strokeWidth={1.5} />
														)}
													</button>
												</div>
											</div>
										)}

										{/* Upload progress overlay */}
										{isSaving && (
											<div className="profile__upload-overlay">
												<div className="profile__upload-overlay-progress">
													<div className="profile__upload-progress-circle">
														<svg viewBox="0 0 36 36">
															<path
																className="profile__upload-progress-bg"
																d="M18 2.0845
																	a 15.9155 15.9155 0 0 1 0 31.831
																	a 15.9155 15.9155 0 0 1 0 -31.831"
															/>
															<path
																className="profile__upload-progress-fill"
																strokeDasharray={`${profilePictureUploadProgress}, 100`}
																d="M18 2.0845
																	a 15.9155 15.9155 0 0 1 0 31.831
																	a 15.9155 15.9155 0 0 1 0 -31.831"
															/>
														</svg>
														<span className="profile__upload-progress-percent">{profilePictureUploadProgress}%</span>
													</div>
												</div>
												<div className="profile__upload-overlay-text">Przesyłanie obrazu...</div>
											</div>
										)}
									</div>
									<input
										type="file"
										ref={profilePictureInputRef}
										onChange={handleProfilePictureUpload}
										accept="image/*"
										style={{ display: 'none' }}
									/>
								</div>
							</div>

							<div className="profile__form-group">
								<label className="profile__label">Wyświetlana nazwa</label>
								<input
									type="text"
									className="profile__input"
									value={profileName}
									onChange={e => {
										setProfileName(e.target.value)
										setHasChanges(true)
									}}
									placeholder="Twoje imię"
								/>
							</div>

							<div className="profile__form-group">
								<label className="profile__label">Adres email</label>
								<input
									type="email"
									className="profile__input"
									value={user?.email || ''}
									disabled
									placeholder="Twój email"
								/>
								<p className="profile__input-help">Email nie może być zmieniony</p>
							</div>
						</div>
					</div>
				)
			case 'appearance':
				return (
					<div className="profile__section-content">
						<div className="profile__section-header">
							<h2 className="profile__section-title">Wygląd</h2>
							<p className="profile__section-description">Dostosuj preferencje wyglądu aplikacji</p>
						</div>

						<div className="profile__appearance-settings">
							<div className="profile__form-group">
								<label className="profile__label">Motyw</label>
								<div className="profile__theme-options">
									<button className="profile__theme-option active">
										<Sun size={18} strokeWidth={1.5} />
										<span>Jasny</span>
									</button>
									<button className="profile__theme-option">
										<Moon size={18} strokeWidth={1.5} />
										<span>Ciemny</span>
									</button>
									<button className="profile__theme-option">
										<Palette size={18} strokeWidth={1.5} />
										<span>Systemowy</span>
									</button>
								</div>
							</div>

							{/* Placeholder for future appearance settings */}
						</div>
					</div>
				)
			case 'security':
				return (
					<div className="profile__section-content">
						<div className="profile__section-header">
							<h2 className="profile__section-title">Bezpieczeństwo</h2>
							<p className="profile__section-description">Zarządzaj ustawieniami bezpieczeństwa swojego konta</p>
						</div>

						<div className="profile__security-settings">
							<div className="profile__form-group">
								<label className="profile__label">Hasło</label>
								<div className="profile__password-update">
									<div className="profile__password-info">
										<div className="profile__password-title">Zmień hasło</div>
										<div className="profile__password-description">Ostatnia zmiana: Nigdy</div>
									</div>
									<button className="profile__security-action">
										<span>Zmień</span>
										<ChevronRight size={16} strokeWidth={1.5} />
									</button>
								</div>
							</div>

							<div className="profile__form-group">
								<label className="profile__label">Sesje</label>
								<div className="profile__security-info">
									<div className="profile__security-title">Aktywne sesje</div>
									<div className="profile__security-description">1 aktywna sesja na tym urządzeniu</div>
									<button className="profile__security-action danger">
										<span>Wyloguj wszystkie</span>
										<ChevronRight size={16} strokeWidth={1.5} />
									</button>
								</div>
							</div>
						</div>
					</div>
				)
			case 'notifications':
				return (
					<div className="profile__section-content">
						<div className="profile__section-header">
							<h2 className="profile__section-title">Powiadomienia</h2>
							<p className="profile__section-description">Zarządzaj ustawieniami powiadomień</p>
						</div>

						<div className="profile__notifications-settings">
							<div className="profile__form-group">
								<label className="profile__label">Powiadomienia email</label>
								<div className="profile__toggle-wrapper">
									<div className="profile__toggle-info">
										<div className="profile__toggle-title">Aktualizacje systemu</div>
										<div className="profile__toggle-description">
											Otrzymuj ważne informacje o aktualizacjach systemu
										</div>
									</div>
									<div className="profile__toggle">
										<input type="checkbox" id="system-updates" className="profile__toggle-input" />
										<label htmlFor="system-updates" className="profile__toggle-label"></label>
									</div>
								</div>
							</div>

							<div className="profile__form-group">
								<div className="profile__toggle-wrapper">
									<div className="profile__toggle-info">
										<div className="profile__toggle-title">Powiadomienia o nowych funkcjach</div>
										<div className="profile__toggle-description">Dowiedz się o nowych funkcjach i możliwościach</div>
									</div>
									<div className="profile__toggle">
										<input type="checkbox" id="new-features" className="profile__toggle-input" checked />
										<label htmlFor="new-features" className="profile__toggle-label"></label>
									</div>
								</div>
							</div>
						</div>
					</div>
				)
			default:
				return (
					<div className="profile__section-content">
						<p>Wybierz sekcję z menu</p>
					</div>
				)
		}
	}

	// Mobile navigation tabs
	const renderMobileTabs = () => {
		return (
			<div className="profile__mobile-tabs">
				<button
					className={`profile__mobile-tab ${activeSection === 'personal' ? 'active' : ''}`}
					onClick={() => handleSectionChange('personal')}>
					<User size={18} strokeWidth={1.5} />
					<span>Profil</span>
				</button>
				<button
					className={`profile__mobile-tab ${activeSection === 'appearance' ? 'active' : ''}`}
					onClick={() => handleSectionChange('appearance')}>
					<Palette size={18} strokeWidth={1.5} />
					<span>Wygląd</span>
				</button>
				<button
					className={`profile__mobile-tab ${activeSection === 'security' ? 'active' : ''}`}
					onClick={() => handleSectionChange('security')}>
					<Shield size={18} strokeWidth={1.5} />
					<span>Bezp.</span>
				</button>
				<button
					className={`profile__mobile-tab ${activeSection === 'notifications' ? 'active' : ''}`}
					onClick={() => handleSectionChange('notifications')}>
					<Bell size={18} strokeWidth={1.5} />
					<span>Powiad.</span>
				</button>
			</div>
		)
	}

	return (
		<div className="profile__container">
			<div className="profile__main-content">{renderSectionContent()}</div>

			{/* Mobile tabs for navigation on smaller screens */}
			{renderMobileTabs()}

			{/* Save button that appears when changes are made */}
			<div className={`profile__fixed-save-button ${showSaveButton ? 'active' : ''}`}>
				<button className="profile__save-button" onClick={saveProfile} disabled={isSaving || !hasChanges}>
					{isSaving ? (
						<>
							<div className="profile__button-loader"></div>
							Zapisywanie...
						</>
					) : (
						<>
							<Save size={16} strokeWidth={1.5} />
							Zapisz zmiany
						</>
					)}
				</button>
			</div>

			{/* Success message */}
			{saveSuccess && (
				<div className="profile__save-success">
					<Check size={16} strokeWidth={1.5} />
					Profil został zaktualizowany
				</div>
			)}

			{/* Error message */}
			{saveError && (
				<div className="profile__save-error">
					<AlertTriangle size={16} strokeWidth={1.5} />
					Wystąpił błąd podczas zapisywania
				</div>
			)}
		</div>
	)
}

export default Profile

import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, User, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import './Login.css'

function Signup() {
	const [name, setName] = useState('')
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [showPassword, setShowPassword] = useState(false)
	const [agreeToTerms, setAgreeToTerms] = useState(false)
	const [signupError, setSignupError] = useState('')
	const [isLoading, setIsLoading] = useState(false)

	const { register } = useAuth()
	const navigate = useNavigate()

	const handleSubmit = async e => {
		e.preventDefault()

		if (!agreeToTerms) {
			setSignupError('Musisz zaakceptować regulamin i politykę prywatności')
			return
		}

		setSignupError('')
		setIsLoading(true)

		try {
			await register({ name, email, password })
			navigate('/chat')
		} catch (error) {
			setSignupError(error.response?.data?.message || 'Rejestracja nie powiodła się. Spróbuj ponownie.')
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<div className="auth-container">
			<div className="auth-content">
				<div className="auth-box">
					<h2>Utwórz konto</h2>

					{signupError && (
						<div className="auth-error">
							<AlertCircle size={18} />
							<span>{signupError}</span>
						</div>
					)}

					<form onSubmit={handleSubmit}>
						<div className="input-group">
							<div className="input-wrapper">
								<User size={18} className="input-icon" />
								<input
									type="text"
									value={name}
									onChange={e => setName(e.target.value)}
									placeholder="Imię i nazwisko"
									required
								/>
							</div>
						</div>

						<div className="input-group">
							<div className="input-wrapper">
								<Mail size={18} className="input-icon" />
								<input
									type="email"
									value={email}
									onChange={e => setEmail(e.target.value)}
									placeholder="Email"
									required
								/>
							</div>
						</div>

						<div className="input-group">
							<div className="input-wrapper">
								<Lock size={18} className="input-icon" />
								<input
									type={showPassword ? 'text' : 'password'}
									value={password}
									onChange={e => setPassword(e.target.value)}
									placeholder="Hasło"
									required
									minLength={8}
								/>
								<button
									type="button"
									className="toggle-password"
									onClick={() => setShowPassword(!showPassword)}
									aria-label={showPassword ? 'Hide password' : 'Show password'}>
									{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
								</button>
							</div>
						</div>

						<div className="checkbox-group">
							<input
								type="checkbox"
								id="terms"
								checked={agreeToTerms}
								onChange={() => setAgreeToTerms(!agreeToTerms)}
								required
							/>
							<label htmlFor="terms">
								Akceptuję <Link to="/terms">regulamin</Link> i <Link to="/privacy">politykę prywatności</Link>
							</label>
						</div>

						<button type="submit" className="auth-button" disabled={isLoading}>
							{isLoading ? 'Tworzenie konta...' : 'Utwórz konto'}
						</button>
					</form>

					<div className="auth-redirect">
						<span>Masz już konto?</span>
						<Link to="/login">Zaloguj się</Link>
					</div>
				</div>
			</div>
		</div>
	)
}

export default Signup

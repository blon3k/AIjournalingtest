import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import './Login.css'

function Login() {
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [showPassword, setShowPassword] = useState(false)
	const [loginError, setLoginError] = useState('')
	const [isLoading, setIsLoading] = useState(false)

	const { login } = useAuth()
	const navigate = useNavigate()

	const handleSubmit = async e => {
		e.preventDefault()
		setLoginError('')
		setIsLoading(true)

		try {
			await login({ email, password })
			navigate('/chat')
		} catch (error) {
			setLoginError(error.response?.data?.message || 'Invalid email or password')
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<div className="auth-container">
			<div className="auth-content">
				<div className="auth-box">
					<h2>Zaloguj się</h2>

					{loginError && (
						<div className="auth-error">
							<AlertCircle size={18} />
							<span>{loginError}</span>
						</div>
					)}

					<form onSubmit={handleSubmit}>
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
								/>
								<button
									type="button"
									className="toggle-password"
									onClick={() => setShowPassword(!showPassword)}
									aria-label={showPassword ? 'Hide password' : 'Show password'}>
									{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
								</button>
							</div>
							<Link to="/reset-password" className="forgot-link">
								Nie pamiętasz hasła?
							</Link>
						</div>

						<button type="submit" className="auth-button" disabled={isLoading}>
							{isLoading ? 'Logowanie...' : 'Zaloguj się'}
						</button>
					</form>

					<div className="auth-redirect">
						<span>Nie masz konta?</span>
						<Link to="/signup">Utwórz konto</Link>
					</div>
				</div>
			</div>
		</div>
	)
}

export default Login

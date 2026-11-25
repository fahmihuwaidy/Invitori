import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { HiOutlineMail, HiOutlineLockClosed, HiOutlineUser, HiOutlineEye, HiOutlineEyeOff, HiOutlineExclamationCircle, HiOutlineCheckCircle } from 'react-icons/hi'
import Logo from '../assets/Logo.png'
import './LoginPage.css'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, register, loginWithGoogle, user } = useAuth()
  const [tab, setTab] = useState('signin')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  const handleForgotPassword = async () => {
    if (!form.email.trim()) {
      setError('Please enter your email address to receive password reset instructions.')
      return
    }
    setError('')
    setIsLoading(true)
    try {
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(form.email.trim(), {
        redirectTo: `${window.location.origin}/login`,
      })
      if (resetErr) {
        setError(resetErr.message)
      } else {
        setResetSent(true)
      }
    } catch {
      setError('Unable to send password reset instructions. Please check your network or try again later.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      navigate('/admin', { replace: true })
    }
  }, [user, navigate])

  if (user) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      if (tab === 'signin') {
        const result = await login(form.email, form.password)
        if (result.success) {
          navigate('/admin')
        } else {
          setError(result.error)
        }
      } else {
        if (!form.name.trim()) {
          setError('Full name is required to create your account.')
          setIsLoading(false)
          return
        }
        const result = await register(form.name, form.email, form.password)
        if (result.success) {
          navigate('/admin')
        } else {
          setError(result.error)
        }
      }
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setError('')
    const result = await loginWithGoogle()
    if (!result.success) {
      setError(result.error)
    }
  }

  return (
    <div className="login-page">
      <div className="login-container animate-fade-in-up">
        <div className="login-header">
          <Link to="/" className="login-logo-link" aria-label="Return to Invori home">
            <img 
              src={Logo} 
              alt="Invori Logo" 
              className="login-logo-img" 
            />
          </Link>
          <span className="login-kicker small-caps">Atelier Studio</span>
          <h1 className="auth-title serif-italic">Enter the Studio</h1>
          <p className="login-tagline">Craft bespoke digital invitations with architectural grace.</p>
        </div>

        <div className="login-tabs" role="tablist" aria-label="Authentication modes">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'signin'}
            className={`login-tab ${tab === 'signin' ? 'active' : ''}`}
            onClick={() => { setTab('signin'); setError('') }}
          >
            Sign In
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'register'}
            className={`login-tab ${tab === 'register' ? 'active' : ''}`}
            onClick={() => { setTab('register'); setError('') }}
          >
            Create Account
          </button>
        </div>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <div className="login-form-header">
            <h3>{tab === 'signin' ? 'Welcome Back' : 'Begin Your Story'}</h3>
            <p>{tab === 'signin' ? 'Enter your credentials to access your invitation atelier.' : 'Start creating beautiful, heirloom-worthy invitations today.'}</p>
          </div>

          {error && (
            <div className="login-error" role="alert" aria-live="polite">
              <HiOutlineExclamationCircle size={18} className="login-alert-icon" />
              <span>{error}</span>
            </div>
          )}

          {resetSent && (
            <div className="login-success" role="status" aria-live="polite">
              <HiOutlineCheckCircle size={18} className="login-alert-icon" />
              <span>A password recovery link has been dispatched to your email. Please check your inbox or spam folder.</span>
            </div>
          )}

          {tab === 'register' && (
            <div className="input-group">
              <label htmlFor="login-name">Full Name</label>
              <div className="input-field">
                <HiOutlineUser className="input-icon" />
                <input
                  id="login-name"
                  type="text"
                  placeholder="e.g. Julian Montgomery"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  disabled={isLoading}
                  autoComplete="name"
                  required
                />
              </div>
            </div>
          )}

          <div className="input-group">
            <label htmlFor="login-email">Email Address</label>
            <div className="input-field">
              <HiOutlineMail className="input-icon" />
              <input
                id="login-email"
                type="email"
                placeholder="julian@example.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                required
                autoComplete="email"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="input-group">
            <div className="input-label-row">
              <label htmlFor="login-password">Password</label>
              {tab === 'signin' && (
                <button
                  type="button"
                  className="login-forgot-link"
                  onClick={handleForgotPassword}
                  disabled={isLoading}
                >
                  Forgot Password?
                </button>
              )}
            </div>
            <div className="input-field input-field-password">
              <HiOutlineLockClosed className="input-icon" />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
                minLength={6}
                autoComplete={tab === 'signin' ? 'current-password' : 'new-password'}
                disabled={isLoading}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <HiOutlineEyeOff size={18} /> : <HiOutlineEye size={18} />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-full btn-lg login-submit" 
            disabled={isLoading}
          >
            {isLoading ? 'Connecting...' : (tab === 'signin' ? 'Access Studio' : 'Create Account')}
          </button>

          <div className="login-divider">
            <span>OR CONTINUE WITH</span>
          </div>

          <div className="login-socials">
            <button 
              type="button" 
              className="btn btn-ghost social-btn" 
              onClick={handleGoogleLogin} 
              disabled={isLoading}
            >
              <svg className="social-icon" viewBox="0 0 24 24" width="18" height="18">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Google</span>
            </button>
            <button 
              type="button" 
              className="btn btn-ghost social-btn" 
              onClick={() => alert('Apple Sign-In is coming soon.')} 
              disabled={isLoading} 
              title="Coming soon"
            >
              <svg className="social-icon" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.42c.67-.83 1.13-1.98.99-3.15-1.01.04-2.27.69-2.98 1.52-.63.73-1.18 1.91-1.03 3.03 1.14.09 2.33-.6 3.02-1.4" />
              </svg>
              <span>Apple (Soon)</span>
            </button>
          </div>
        </form>

        <div className="login-footer">
          <p className="login-security-badge">
            <span className="badge-dot">✦</span> Verified 256-Bit SSL & Supabase Auth
          </p>
          <p className="login-legal-text">
            By accessing the studio, you agree to our{' '}
            <Link to="/contact" className="login-inline-link">Terms of Service</Link> and{' '}
            <Link to="/contact" className="login-inline-link">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  )
}

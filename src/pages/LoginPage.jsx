import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { HiOutlineMail, HiOutlineLockClosed } from 'react-icons/hi'
import Logo from '../assets/Logo.png'
import './LoginPage.css'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, register, loginWithGoogle, user } = useAuth()
  const [tab, setTab] = useState('signin')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  if (user) {
    if (user.email === 'fahmihuwaidy8@gmail.com') {
      navigate('/admin', { replace: true })
    } else {
      navigate('/', { replace: true })
    }
    return null
  }

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
          setError('Name is required')
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
    } catch (err) {
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
          <img 
            src={Logo} 
            alt="Invitori Logo" 
            className="login-logo-img" 
            onClick={() => navigate('/')} 
            style={{ height: 48, cursor: 'pointer', margin: '0 auto 16px' }}
          />
          <h1 className="auth-title serif-italic">Enter the Studio</h1>
        </div>

        <div className="login-tabs">
          <button
            className={`login-tab ${tab === 'signin' ? 'active' : ''}`}
            onClick={() => { setTab('signin'); setError('') }}
          >
            Sign In
          </button>
          <button
            className={`login-tab ${tab === 'register' ? 'active' : ''}`}
            onClick={() => { setTab('register'); setError('') }}
          >
            Register
          </button>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-form-header">
            <h3>{tab === 'signin' ? 'Welcome Back' : 'Create Account'}</h3>
            <p>{tab === 'signin' ? 'Enter your credentials to access your studio.' : 'Start creating beautiful invitations today.'}</p>
          </div>

          {error && <div className="login-error">{error}</div>}

          {tab === 'register' && (
            <div className="input-group">
              <label>Full Name</label>
              <div className="input-field">
                <span className="input-icon">👤</span>
                <input
                  type="text"
                  placeholder="Your full name"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  disabled={isLoading}
                />
              </div>
            </div>
          )}

          <div className="input-group">
            <label>Email Address</label>
            <div className="input-field">
              <HiOutlineMail className="input-icon" />
              <input
                type="email"
                placeholder="hello@invitori.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="input-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label>Password</label>
              {tab === 'signin' && (
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--maroon)', cursor: 'pointer', letterSpacing: '0.05em' }}>
                  FORGOT?
                </span>
              )}
            </div>
            <div className="input-field">
              <HiOutlineLockClosed className="input-icon" />
              <input
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
                minLength={6}
                disabled={isLoading}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-full btn-lg login-submit" disabled={isLoading}>
            {isLoading ? 'Please wait...' : (tab === 'signin' ? 'Access Studio →' : 'Create Account →')}
          </button>

          <div className="login-divider">
            <span>OR CONTINUE WITH</span>
          </div>

          <div className="login-socials">
            <button type="button" className="btn btn-ghost social-btn" onClick={handleGoogleLogin} disabled={isLoading}>
              <span>G</span> Google
            </button>
            <button type="button" className="btn btn-ghost social-btn" disabled={isLoading}>
              <span></span> Apple
            </button>
          </div>
        </form>

        <div className="login-footer">
          <p className="label-caps" style={{ color: 'var(--olive)', marginBottom: 8 }}>
            🔒 End-to-end encryption enabled
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            By continuing you agree to our <a href="#" style={{ color: 'var(--olive)', fontWeight: 500 }}>Terms of Service</a>
            and <a href="#" style={{ color: 'var(--olive)', fontWeight: 500 }}>Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  )
}

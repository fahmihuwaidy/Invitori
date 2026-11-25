import { useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  HiArrowLeft, 
  HiOutlineMail, 
  HiOutlineChatAlt2, 
  HiOutlineCamera, 
  HiOutlineClock,
  HiOutlineSparkles,
  HiCheckCircle,
  HiOutlineExclamationCircle
} from 'react-icons/hi'
import Logo from '../assets/Logo.png'
import heroImg from '../assets/hero.png'
import './ContactPage.css'

export default function ContactPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    eventType: 'Wedding Celebration',
    message: '',
  })
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) {
      errs.name = 'Please provide your full name.'
    }
    if (!form.email.trim()) {
      errs.email = 'Please provide your email address.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errs.email = 'Please enter a valid email address.'
    }
    if (!form.message.trim()) {
      errs.message = 'Please share a brief note about your celebration.'
    } else if (form.message.trim().length < 10) {
      errs.message = 'Please provide at least 10 characters so we can assist you better.'
    }
    return errs
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = validate()
    setErrors(errs)

    if (Object.keys(errs).length > 0) return

    setIsSubmitting(true)
    // Simulate inquiry submission (clean local state)
    setTimeout(() => {
      setIsSubmitting(false)
      setIsSubmitted(true)
    }, 600)
  }

  const handleReset = () => {
    setForm({
      name: '',
      email: '',
      eventType: 'Wedding Celebration',
      message: '',
    })
    setErrors({})
    setIsSubmitted(false)
  }

  return (
    <div className="contact-page animate-fade-in">
      <nav className="contact-nav">
        <Link to="/" className="back-link" aria-label="Return to home page">
          <HiArrowLeft size={18} />
          <span>Return Home</span>
        </Link>
        <div className="nav-logo">
          <Link to="/">
            <img src={Logo} alt="Invori Logo" style={{ height: 32, width: 'auto' }} />
          </Link>
        </div>
        <div className="nav-right-action">
          <Link to="/login" className="contact-studio-btn">Enter Studio</Link>
        </div>
      </nav>

      <main className="contact-main">
        {/* Left Column: Inquiry Form & Header */}
        <section className="contact-content">
          <div className="contact-header">
            <span className="small-caps" style={{ color: 'var(--olive)' }}>Atelier Concierge</span>
            <h1 className="contact-title serif">
              Begin Your <br />
              <em className="serif-italic">Digital Legacy</em>
            </h1>
            <p className="body-text contact-desc">
              We would be delighted to craft an unforgettable digital invitation experience for your milestone. 
              Submit an inquiry below or reach out directly to our curation studio.
            </p>
          </div>

          {isSubmitted ? (
            <div className="inquiry-success-card animate-fade-in">
              <HiCheckCircle size={36} className="success-icon" />
              <h3 className="serif-italic">Inquiry Received</h3>
              <p className="body-text">
                Thank you, <strong>{form.name}</strong>. Your inquiry for <strong>{form.eventType}</strong> has been transmitted to our creative team. Juliana from our studio concierge will respond to <em>{form.email}</em> within 24 hours.
              </p>
              <div className="success-actions">
                <button type="button" onClick={handleReset} className="btn-secondary-atelier">
                  Send Another Inquiry
                </button>
                <a 
                  href={`https://wa.me/6281258506237?text=${encodeURIComponent(`Hi Invori Atelier, I just sent an inquiry for ${form.name} (${form.eventType}).`)}`}
                  target="_blank" 
                  rel="noreferrer" 
                  className="btn-whatsapp-direct"
                >
                  <HiOutlineChatAlt2 size={16} />
                  <span>Follow up on WhatsApp</span>
                </a>
              </div>
            </div>
          ) : (
            <form className="inquiry-form" onSubmit={handleSubmit} noValidate>
              <h3 className="inquiry-form-title">Direct Studio Inquiry</h3>

              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="inquiry-name">Your Full Name *</label>
                  <input
                    id="inquiry-name"
                    type="text"
                    placeholder="e.g. Elena Rostova"
                    value={form.name}
                    onChange={(e) => {
                      setForm({ ...form, name: e.target.value })
                      if (errors.name) setErrors({ ...errors, name: null })
                    }}
                    className={errors.name ? 'input-error' : ''}
                    disabled={isSubmitting}
                  />
                  {errors.name && (
                    <span className="field-error" role="alert">
                      <HiOutlineExclamationCircle size={14} /> {errors.name}
                    </span>
                  )}
                </div>

                <div className="form-field">
                  <label htmlFor="inquiry-email">Email Address *</label>
                  <input
                    id="inquiry-email"
                    type="email"
                    placeholder="elena@example.com"
                    value={form.email}
                    onChange={(e) => {
                      setForm({ ...form, email: e.target.value })
                      if (errors.email) setErrors({ ...errors, email: null })
                    }}
                    className={errors.email ? 'input-error' : ''}
                    disabled={isSubmitting}
                  />
                  {errors.email && (
                    <span className="field-error" role="alert">
                      <HiOutlineExclamationCircle size={14} /> {errors.email}
                    </span>
                  )}
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="inquiry-event-type">Celebration Type</label>
                <select
                  id="inquiry-event-type"
                  value={form.eventType}
                  onChange={(e) => setForm({ ...form, eventType: e.target.value })}
                  disabled={isSubmitting}
                >
                  <option value="Wedding Celebration">Wedding Celebration (Bespoke Suite)</option>
                  <option value="Private Gala / Reception">Private Gala / Reception</option>
                  <option value="Milestone Birthday">Milestone Birthday Celebration</option>
                  <option value="Aqiqah & Family Blessing">Aqiqah & Family Blessing</option>
                  <option value="Custom Atelier Project">Custom Atelier Collaboration</option>
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="inquiry-message">Event Details & Requests *</label>
                <textarea
                  id="inquiry-message"
                  rows={4}
                  placeholder="Tell us about your event date, venue, guest count, or preferred aesthetic theme..."
                  value={form.message}
                  onChange={(e) => {
                    setForm({ ...form, message: e.target.value })
                    if (errors.message) setErrors({ ...errors, message: null })
                  }}
                  className={errors.message ? 'input-error' : ''}
                  disabled={isSubmitting}
                />
                {errors.message && (
                  <span className="field-error" role="alert">
                    <HiOutlineExclamationCircle size={14} /> {errors.message}
                  </span>
                )}
              </div>

              <button type="submit" className="inquiry-submit-btn" disabled={isSubmitting}>
                <HiOutlineSparkles size={16} />
                <span>{isSubmitting ? 'Dispatching Inquiry...' : 'Dispatch Inquiry to Studio'}</span>
              </button>
            </form>
          )}
        </section>

        {/* Right Column: Direct Channels & Atelier Showcase */}
        <section className="contact-aside">
          <div className="contact-methods-panel">
            <h3 className="aside-heading small-caps">Direct Channels</h3>
            
            <div className="contact-methods">
              <a 
                href="https://wa.me/6281258506237" 
                target="_blank" 
                rel="noreferrer" 
                className="contact-method-card"
              >
                <div className="method-icon"><HiOutlineChatAlt2 size={22} /></div>
                <div className="contact-card-content">
                  <div className="card-top-row">
                    <h4 className="method-name">WhatsApp Atelier</h4>
                    <span className="method-badge">Direct Line</span>
                  </div>
                  <p className="method-detail">+62 812-5850-6237</p>
                  <p className="method-note">Immediate consultation & bespoke planning inquiries</p>
                </div>
              </a>

              <a href="mailto:hello@invori.com" className="contact-method-card">
                <div className="method-icon"><HiOutlineMail size={22} /></div>
                <div className="contact-card-content">
                  <div className="card-top-row">
                    <h4 className="method-name">Client Concierge</h4>
                    <span className="method-badge">Email</span>
                  </div>
                  <p className="method-detail">hello@invori.com</p>
                  <p className="method-note">General correspondence, custom assets & partnership</p>
                </div>
              </a>

              <a 
                href="https://instagram.com/invori_studio" 
                target="_blank" 
                rel="noreferrer" 
                className="contact-method-card"
              >
                <div className="method-icon"><HiOutlineCamera size={22} /></div>
                <div className="contact-card-content">
                  <div className="card-top-row">
                    <h4 className="method-name">Aesthetic Archive</h4>
                    <span className="method-badge">Instagram</span>
                  </div>
                  <p className="method-detail">@invori_studio</p>
                  <p className="method-note">Real weddings, typography studies & design inspirations</p>
                </div>
              </a>
            </div>

            <div className="studio-hours-card">
              <div className="hours-icon"><HiOutlineClock size={20} /></div>
              <div>
                <p className="hours-title">Studio Consultations</p>
                <p className="hours-detail">Monday — Saturday, 09:00 — 18:00 WIB</p>
                <p className="hours-sub">Online consultations worldwide • Jakarta & Bali ateliers</p>
              </div>
            </div>
          </div>

          <div className="contact-showcase-card">
            <div className="showcase-img-wrap">
              <img src={heroImg} alt="Invori Studio Aesthetic" />
            </div>
            <div className="showcase-caption">
              <span className="small-caps" style={{ color: 'var(--olive)' }}>Artisanal Philosophy</span>
              <p className="showcase-quote serif-italic">
                "Every celebration carries a heartbeat. We shape digital spaces that honor the solemn beauty of your entrance."
              </p>
              <span className="showcase-author">— The Invori Design House</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

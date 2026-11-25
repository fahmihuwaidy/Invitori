import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { HiMenu, HiX, HiOutlineArrowRight, HiOutlineSparkles, HiOutlineMusicNote, HiOutlineTicket } from 'react-icons/hi'
import { useAuth } from '../contexts/AuthContext'
import Logo from '../assets/Logo.png'
import heroImg from '../assets/hero.png'
import './LandingPage.css'

export default function LandingPage() {
  const { user } = useAuth()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  // Handle scroll for transparent -> solid navbar transition
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setScrolled(true)
      } else {
        setScrolled(false)
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Lock document body scroll when mobile drawer is open & restore on close/unmount
  useEffect(() => {
    if (menuOpen) {
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = originalOverflow || ''
      }
    }
  }, [menuOpen])

  const scrollToSection = (e, id) => {
    e.preventDefault()
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
      setMenuOpen(false)
    }
  }

  return (
    <div className="landing animate-fade-in">
      
      {/* ===== Navbar v3 ===== */}
      <nav className={`landing-nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-inner">
          <Link to="/" className="nav-logo" aria-label="Invori Atelier Home">
            <img src={Logo} alt="Invori Logo" />
          </Link>
          
          <div className="nav-links-center">
            <a href="#collections" onClick={(e) => scrollToSection(e, 'collections')}>Collections</a>
            <a href="#bespoke" onClick={(e) => scrollToSection(e, 'bespoke')}>Bespoke</a>
            <a href="#process" onClick={(e) => scrollToSection(e, 'process')}>Process</a>
            <a href="#journal" onClick={(e) => scrollToSection(e, 'journal')}>Journal</a>
            <Link to="/contact">Contact</Link>
          </div>

          {/* Desktop Right Actions: Sign In / Studio + Inquire */}
          <div className="nav-actions-desktop">
            <Link 
              to={user ? "/admin" : "/login"} 
              className="nav-btn-studio"
            >
              {user ? "Studio" : "Sign In"}
            </Link>
            <Link 
              to="/contact" 
              className="nav-btn-inquire"
            >
              Inquire
            </Link>
          </div>

          <button 
            className="nav-toggle" 
            onClick={() => setMenuOpen(!menuOpen)} 
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <HiX size={26} /> : <HiMenu size={26} />}
          </button>
        </div>

        {/* Mobile Navigation Menu Drawer */}
        {menuOpen && (
          <div className="nav-mobile-drawer animate-fade-in">
            <div className="nav-mobile-links">
              <a href="#collections" onClick={(e) => scrollToSection(e, 'collections')}>Collections</a>
              <a href="#bespoke" onClick={(e) => scrollToSection(e, 'bespoke')}>Bespoke</a>
              <a href="#process" onClick={(e) => scrollToSection(e, 'process')}>Process</a>
              <a href="#journal" onClick={(e) => scrollToSection(e, 'journal')}>Journal</a>
              <Link to="/contact" onClick={() => setMenuOpen(false)}>Contact Concierge</Link>
            </div>
            
            <div className="nav-mobile-actions">
              <Link 
                to={user ? "/admin" : "/login"} 
                className="nav-btn-studio-mobile"
                onClick={() => setMenuOpen(false)}
              >
                {user ? "Enter Studio" : "Sign In to Studio"}
              </Link>
              <Link 
                to="/contact" 
                className="nav-btn-mobile" 
                onClick={() => setMenuOpen(false)}
              >
                Inquire Now
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* ===== Hero Section ===== */}
      <section className="hero">
        <div className="hero-content">
          <span className="small-caps" style={{ color: 'var(--olive)' }}>Artisanal Digital Design</span>
          <h1 className="hero-title serif">
            A Legacy of <br />
            <em className="serif-italic">Digital Craft</em>
          </h1>
          <p className="body-text hero-body">
            Mastering the art of the invitation. We blend the tactility of fine stationery with the seamless ease of digital connection.
          </p>
          <div className="hero-actions">
            <Link to="/contact" className="btn-solid" style={{ textDecoration: 'none' }}>
              Begin Your Story
            </Link>
            <a 
              href="#collections" 
              className="btn-text" 
              style={{ textDecoration: 'none' }} 
              onClick={(e) => scrollToSection(e, 'collections')}
            >
              The Collection
            </a>
          </div>
        </div>
        <div className="hero-image-wrapper">
          <img src={heroImg} alt="Invori Artisanal Invitation Preview" className="hero-img-showcase" />
        </div>
      </section>

      {/* ===== Meticulous Method ===== */}
      <section id="process" className="method-section">
        <h2 className="method-title serif">Meticulous Method</h2>
        <p className="body-text method-subtitle">
          From conceptual sketches to digital delivery, our process honors the heritage of classic phrases.
        </p>
        
        <div className="method-grid">
          <div className="method-card">
            <div className="method-icon">
               <svg viewBox="0 0 24 24" aria-hidden="true">
                 <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
               </svg>
            </div>
            <h4>Curation</h4>
            <p className="body-text">Selecting palettes and textures that whisper elegance before a single word is read.</p>
          </div>
          
          <div className="method-card">
            <div className="method-icon">
               <svg viewBox="0 0 24 24" aria-hidden="true">
                 <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6l-10 7L2 6" />
               </svg>
            </div>
            <h4>Composition</h4>
            <p className="body-text">Typographical precision and structural mastery ensuring the layout flows truly beautifully.</p>
          </div>
          
          <div className="method-card">
            <div className="method-icon">
               <svg viewBox="0 0 24 24" aria-hidden="true">
                 <rect x="3" y="4" width="18" height="16" rx="2" />
                 <path d="M3 8l9 6 9-6" />
               </svg>
            </div>
            <h4>Delivery</h4>
            <p className="body-text">An effortless digital unveiling that mirrors the opening of a hand-sealed envelope.</p>
          </div>
        </div>
      </section>

      {/* ===== Curated Themes Grid (Rich Interactive Preview Cards) ===== */}
      <section id="collections" className="themes-section">
        <span className="small-caps" style={{ color: 'var(--olive)' }}>The Gallery</span>
        <div className="themes-header">
          <div>
            <h2 className="themes-title serif">Curated Themes</h2>
            <p className="themes-kicker">Interactive preview suites crafted for momentous celebrations.</p>
          </div>
          <Link 
            to="/undangan/elena-julian" 
            className="explore-link small-caps"
          >
            Experience Live Suite →
          </Link>
        </div>
        
        <div className="themes-grid">
          {/* Card 1: Elena & Julian (Wedding Suite - Featured Large Card) */}
          <article className="preview-card theme-card-wedding">
            <div className="card-texture-overlay" />
            <div className="preview-card-inner">
              <div className="preview-card-badge-row">
                <span className="theme-badge theme-badge-botanical">Atelier Botanical</span>
                <span className="preview-monogram">E & J</span>
              </div>
              
              <div className="preview-card-main">
                <p className="preview-card-kicker">The Wedding Suite</p>
                <h3 className="card-couple serif-italic">Elena & Julian</h3>
                <p className="preview-card-date">Saturday, 14 November 2026 • Jakarta</p>
                <p className="preview-card-blurb">
                  A timeless tribute in deep forest green and warm cotton paper, featuring wax seal entrance gate, dual-pane showcase, and synchronized music.
                </p>

                <div className="preview-card-tags">
                  <span className="pill-tag"><HiOutlineSparkles size={12} /> Wax Seal Gate</span>
                  <span className="pill-tag"><HiOutlineMusicNote size={12} /> Acoustic Strings</span>
                  <span className="pill-tag"><HiOutlineTicket size={12} /> QR Pass Check-in</span>
                </div>
              </div>

              <div className="preview-card-footer">
                <Link to="/undangan/elena-julian" className="preview-card-action">
                  <span>View Live Invitation</span>
                  <HiOutlineArrowRight size={14} />
                </Link>
              </div>
            </div>
          </article>

          {/* Card 2: Clara & Adrian (Vogue Editorial Suite) */}
          <article className="preview-card theme-card-vogue">
            <div className="card-texture-overlay" />
            <div className="preview-card-inner">
              <div className="preview-card-badge-row">
                <span className="theme-badge theme-badge-vogue">Editorial Noir</span>
                <span className="preview-monogram">C & A</span>
              </div>

              <div className="preview-card-main">
                <p className="preview-card-kicker">The Gala & Reception</p>
                <h3 className="card-couple serif-italic">Clara & Adrian</h3>
                <p className="preview-card-date">Friday, 18 December 2026 • The Grand Ballroom</p>
                <p className="preview-card-blurb">
                  High-fashion editorial layout with high-contrast typography, minimalist monochrome geometry, and responsive guest RSVP ledger.
                </p>

                <div className="preview-card-tags">
                  <span className="pill-tag">Monochrome Gate</span>
                  <span className="pill-tag">Editorial Journal</span>
                  <span className="pill-tag">Instant Calendar</span>
                </div>
              </div>

              <div className="preview-card-footer">
                <Link to="/undangan/elena-julian?theme=vogue" className="preview-card-action">
                  <span>View Live Invitation</span>
                  <HiOutlineArrowRight size={14} />
                </Link>
              </div>
            </div>
          </article>

          {/* Card 3: Larasati & Arya (Heritage Royal Suite) */}
          <article className="preview-card theme-card-heritage">
            <div className="card-texture-overlay" />
            <div className="preview-card-inner">
              <div className="preview-card-badge-row">
                <span className="theme-badge theme-badge-heritage">Royal Heritage</span>
                <span className="preview-monogram">L & A</span>
              </div>

              <div className="preview-card-main">
                <p className="preview-card-kicker">The Heritage Celebration</p>
                <h3 className="card-couple serif-italic">Larasati & Arya</h3>
                <p className="preview-card-date">Sunday, 24 January 2027 • Plataran Heritage</p>
                <p className="preview-card-blurb">
                  Rich burgundy nuances and antique gold accents celebrating classical Nusantara motifs, digital angpao, and wish moderation.
                </p>

                <div className="preview-card-tags">
                  <span className="pill-tag">Arch Gate</span>
                  <span className="pill-tag">Digital Angpao</span>
                  <span className="pill-tag">Wishes Wall</span>
                </div>
              </div>

              <div className="preview-card-footer">
                <Link to="/undangan/elena-julian?theme=royal" className="preview-card-action">
                  <span>View Live Invitation</span>
                  <HiOutlineArrowRight size={14} />
                </Link>
              </div>
            </div>
          </article>
        </div>
      </section>

      {/* ===== Whitespace Design Note ===== */}
      <section id="bespoke" className="note-section">
        <div className="note-box">
          <span className="small-caps" style={{ color: 'var(--olive)' }}>A Note on Fit</span>
          <h2 className="note-title">Whitespace is the most <em>luxurious</em> material in digital design.</h2>
          <p className="body-text" style={{ maxWidth: 440 }}>
            "Just as high-quality cotton paper provides weight and presence, intentional spacing allows your message to breathe. Do not fear the empty space; it is where the anticipation lives."
          </p>
          <p className="note-author">— Juliana Thorne, Studio Director</p>
        </div>
        
        <div className="note-floating-card">
           <span className="nfc-badge">✿</span>
           <h3 className="nfc-title serif-italic">The Secret Garden</h3>
           <p className="nfc-desc">Bespoke digital calligraphy on warm hand-pressed ivory parchment.</p>
           <span className="small-caps" style={{ fontSize: 9, letterSpacing: '0.15em' }}>Invori Fine Digital Invitations</span>
        </div>
      </section>

      {/* ===== Testimonial ===== */}
      <section id="journal" className="testimonial-block">
        <svg className="test-svg" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
        </svg>
        <p className="test-text">
          "From the moment our guests clicked the link, they knew they were part of something extraordinary. It was not merely an invite; it was the first chapter of our celebration."
        </p>
        <div className="test-author">
           <div className="ta-avatar" style={{ background: 'var(--olive)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 14, fontWeight: 600 }}>✦</div>
           <div className="ta-info">
             <span className="ta-name">Invori Atelier</span>
             <span className="ta-title">Bespoke Digital Stationery</span>
           </div>
        </div>
      </section>

      {/* ===== Full-Width CTA ===== */}
      <section className="cta-block">
        <h2 className="serif-italic">Ready to craft your<br />moment in history?</h2>
        <Link to="/contact" className="btn-white" style={{ textDecoration: 'none' }}>
          Begin Your Story
        </Link>
        <span className="cta-sub">PERSONAL CURATION AND DIGITAL FINERY AWAIT.</span>
      </section>

      {/* ===== Minimalist Footer ===== */}
      <footer className="footer-v3">
        <div className="f-col-1">
          <span className="f-logo">
            <Link to="/">
              <img src={Logo} alt="Invori Logo" />
            </Link>
          </span>
          <p>Crafting digital legacies through intentional design and old-world hospitality. Every event deserves an entrance.</p>
        </div>
        
        <div className="f-col-2">
          <div>
            <span className="f-label">Legal</span>
            <Link to="/contact" className="f-link">Privacy Policy</Link>
            <Link to="/contact" className="f-link">Terms of Service</Link>
          </div>
          <div>
            <span className="f-label">Connect</span>
            <a href="https://instagram.com/invori_studio" target="_blank" rel="noreferrer" className="f-link">Instagram</a>
            <Link to="/contact" className="f-link">Inquire</Link>
          </div>
          <div>
            <span className="f-label">Studio</span>
            <Link to={user ? "/admin" : "/login"} className="f-link">{user ? "Studio Dashboard" : "Sign In"}</Link>
            <Link to="/undangan/elena-julian" className="f-link">Live Demo</Link>
          </div>
        </div>
        
        <div className="f-col-3">
          <span className="f-link" style={{ fontSize: 11, letterSpacing: '0.08em' }}>© 2026 THE INVORI STUDIO.</span>
          <div className="f-socials">
            <span title="Curation">❖</span>
            <span title="Botanical">❀</span>
            <span title="Calligraphy">✑</span>
          </div>
        </div>
      </footer>
      
    </div>
  )
}

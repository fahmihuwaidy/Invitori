import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { HiMenu, HiX } from 'react-icons/hi'
import Logo from '../assets/Logo.png'
import './LandingPage.css'

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  // Handle scroll for transparent -> solid navbar transition
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true)
      } else {
        setScrolled(false)
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

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
          <a href="/" className="nav-logo">
            <img src={Logo} alt="Invori Logo" />
          </a>
          
          <div className="nav-links-center">
            <a href="#collections" onClick={(e) => scrollToSection(e, 'collections')}>Collections</a>
            <a href="#bespoke" onClick={(e) => scrollToSection(e, 'bespoke')}>Bespoke</a>
            <a href="#process" onClick={(e) => scrollToSection(e, 'process')}>Process</a>
            <a href="#journal" onClick={(e) => scrollToSection(e, 'journal')}>Journal</a>
            <Link to="/contact">Contact</Link>
          </div>

          {/* Desktop Right Button */}
          <Link to="/contact" className="nav-btn" style={{textDecoration: 'none'}}>Inquire</Link>

          <button className="nav-toggle" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <HiX size={24} /> : <HiMenu size={24} />}
          </button>
        </div>
      </nav>

      {/* ===== Mobile Navigation Menu ===== */}
      <div className={`nav-links ${menuOpen ? 'open' : ''}`} style={{display: 'none'}}>
        {/* Actually, I will use a simple inline style to handle the mobile menu display if needed, 
            but for now the existing CSS media queries handle `.nav-links.open` if we had them. 
            Since we re-wrote the CSS, let's keep it clean. */}
      </div>

      {/* ===== Hero Section ===== */}
      <section className="hero">
        <div className="hero-content">
          <span className="small-caps" style={{color: 'var(--text-muted)'}}>Artisanal Digital Design</span>
          <h1 className="hero-title serif">
            A Legacy of <br />
            <em className="serif-italic">Digital Craft</em>
          </h1>
          <p className="body-text hero-body">
            Mastering the art of the invitation. We blend the tactility of fine stationery with the seamless ease of digital connection.
          </p>
          <div className="hero-actions">
            <Link to="/contact" className="btn-solid" style={{textDecoration: 'none'}}>Begin Your Story</Link>
            <a href="#collections" className="btn-text" style={{textDecoration: 'none'}} onClick={(e) => scrollToSection(e, 'collections')}>
              The Collection &rarr;
            </a>
          </div>
        </div>
        <div className="hero-image-wrapper">
          {/* Defined in CSS Placeholder */}
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
               <svg viewBox="0 0 24 24">
                 <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
               </svg>
            </div>
            <h4>Curation</h4>
            <p className="body-text">Selecting palettes and textures that whisper elegance before a single word is text.</p>
          </div>
          
          <div className="method-card">
            <div className="method-icon">
               <svg viewBox="0 0 24 24">
                 <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6l-10 7L2 6"/>
               </svg>
            </div>
            <h4>Composition</h4>
            <p className="body-text">Typographical precision and structural mastery ensuring the layout flows truly beautifully.</p>
          </div>
          
          <div className="method-card">
            <div className="method-icon">
               <svg viewBox="0 0 24 24">
                 <rect x="3" y="4" width="18" height="16" rx="2" />
                 <path d="M3 8l9 6 9-6" />
               </svg>
            </div>
            <h4>Delivery</h4>
            <p className="body-text">An effortless digital unveiling that mirrors the opening of a hand-sealed envelope.</p>
          </div>

        </div>
      </section>

      {/* ===== Curated Themes Grid ===== */}
      <section id="collections" className="themes-section">
        <span className="small-caps" style={{color: 'var(--pink-dusty)'}}>The Gallery</span>
        <div className="themes-header">
          <h2 className="themes-title serif">Curated Themes</h2>
          <a href="#collections" className="small-caps" style={{letterSpacing: '0.1em', textDecoration: 'none', color: 'var(--text-muted)'}}>Explore All</a>
        </div>
        
        <div className="themes-grid">
          <div className="placeholder-card theme-main">
            <h3 className="card-title">The Wedding Suite</h3>
          </div>
          <div className="placeholder-card theme-secondary">
            <h3 className="card-title">The Gala Collection</h3>
          </div>
          <div className="placeholder-card theme-tertiary">
            <h3 className="card-title" style={{color: '#1a1a1a'}}>The Secret Garden</h3>
          </div>
        </div>
      </section>

      {/* ===== Whitespace Design Note ===== */}
      <section id="bespoke" className="note-section">
        <div className="note-box">
          <span className="small-caps" style={{color: 'var(--pink-dusty)'}}>A Note on Fit</span>
          <h2 className="note-title">Whitespace is the most <em>luxurious</em> material in digital design.</h2>
          <p className="body-text" style={{maxWidth: 400}}>
            "Just as high-quality cotton paper provides weight and presence, intentional spacing allows your message to breathe. Do not fear the empty space; it is where the anticipation lives."
          </p>
          <p className="note-author">— Juliana Thorne, Lead Creator</p>
        </div>
        
        <div className="note-floating-card">
           <span className="nfc-badge">✿</span>
           <h3 className="nfc-title serif-italic">The Secret Garden</h3>
           <span className="small-caps" style={{fontSize: 8}}>Invori Fine Digital Invitations</span>
        </div>
      </section>

      {/* ===== Testimonial ===== */}
      <section id="journal" className="testimonial-block">
        <svg className="test-svg" viewBox="0 0 24 24">
          <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
        </svg>
        <p className="test-text">
          "From the moment our guests clicked the link, they knew they were part of something extraordinary. It <strong>wasn't just</strong> an invite; it <strong>was</strong> the first chapter of our wedding day."
        </p>
        <div className="test-author">
           <div className="ta-avatar"></div>
           <div className="ta-info">
             <span className="ta-name">Eleanor Vance</span>
             <span className="ta-title">Florence Summer Society</span>
           </div>
        </div>
      </section>

      {/* ===== Full-Width CTA ===== */}
      <section className="cta-block">
        <h2 className="serif-italic">Ready to craft your<br />moment in history?</h2>
        <Link to="/contact">
          <button className="btn-white">Begin Your Story</button>
        </Link>
        <span className="cta-sub">NO CREDIT CARD REQUIRED. PERSONAL CURATION AWAITS.</span>
      </section>

      {/* ===== Minimalist Footer ===== */}
      <footer className="footer-v3">
        <div className="f-col-1">
          <span className="f-logo">
            <img src={Logo} alt="Invori Logo" />
          </span>
          <p>Crafting digital legacies through intentional design and old-world hospitality. Every event deserves an entrance.</p>
        </div>
        
        <div className="f-col-2">
          <div>
            <span className="f-label">Legal</span>
            <a href="#" className="f-link">Privacy Policy</a>
            <a href="#" className="f-link">Terms of Service</a>
          </div>
          <div>
            <span className="f-label">Connect</span>
            <a href="#" className="f-link">Instagram</a>
            <a href="#" className="f-link">Pinterest</a>
          </div>
        </div>
        
        <div className="f-col-3">
          <span className="f-link" style={{fontSize: 10, letterSpacing: '0.1em'}}>© 2026 THE INVORI STUDIO.</span>
          <div className="f-socials">
            {/* simple symbols instead of complex react icons for elegance */}
            <span style={{cursor: 'pointer'}}>❖</span>
            <span style={{cursor: 'pointer'}}>❀</span>
            <span style={{cursor: 'pointer'}}>✑</span>
          </div>
        </div>
      </footer>
      
    </div>
  )
}

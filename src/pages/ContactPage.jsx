import React from 'react'
import { Link } from 'react-router-dom'
import { HiArrowLeft, HiOutlineMail, HiOutlineChatAlt2, HiOutlineCamera } from 'react-icons/hi'
import Logo from '../assets/Logo.png'
import './ContactPage.css'

export default function ContactPage() {
  return (
    <div className="contact-page animate-fade-in">
      <nav className="contact-nav">
        <Link to="/" className="back-link">
          <HiArrowLeft size={20} />
          <span>Return Home</span>
        </Link>
        <div className="nav-logo">
          <img src={Logo} alt="Invitori Logo" style={{ height: 32 }} />
        </div>
        <div style={{ width: 100 }}></div> {/* spacer */}
      </nav>

      <main className="contact-main">
        <div className="contact-content">
          <span className="small-caps" style={{ color: 'var(--pink-dusty)' }}>Say Hello</span>
          <h1 className="contact-title serif">
            Begin Your <br />
            <em className="serif-italic">Digital Legacy</em>
          </h1>
          <p className="body-text contact-desc">
            We would be honored to weave your story into an unforgettable digital experience.
            Reach out through any of our channels below to request a bespoke consultation.
            <br /><br />
            Quisque velit nisi, pretium ut lacinia in, elementum id enim. Donec rutrum congue leo eget malesuada.
          </p>

          <div className="contact-methods">
            <a href="https://wa.me/6281258506237" target="_blank" rel="noreferrer" className="contact-method-card">
              <div className="method-icon"><HiOutlineChatAlt2 size={24} /></div>
              <div className="contact-card-content">
                <h3 className="method-name">WhatsApp</h3>
                <p className="method-detail">+62 812-5850-6237</p>
                <p className="method-note">For urgent inquiries & bespoke planning</p>
              </div>
            </a>

            <a href="mailto:hello@invitori.com" className="contact-method-card">
              <div className="method-icon"><HiOutlineMail size={24} /></div>
              <div className="contact-card-content">
                <h3 className="method-name">Email</h3>
                <p className="method-detail">hello@invitori.com</p>
                <p className="method-note">For collaborations & general questions</p>
              </div>
            </a>

            <a href="https://instagram.com/invitori_studio" target="_blank" rel="noreferrer" className="contact-method-card">
              <div className="method-icon"><HiOutlineCamera size={24} /></div>
              <div className="contact-card-content">
                <h3 className="method-name">Instagram</h3>
                <p className="method-detail">@invitori_studio</p>
                <p className="method-note">Explore our curated gallery</p>
              </div>
            </a>
          </div>
        </div>

        <div className="contact-image-wrapper">
          {/* Placeholder for aesthetic image */}
        </div>
      </main>
    </div>
  )
}

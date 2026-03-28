import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { HiOutlineViewGrid, HiOutlineMail, HiOutlineUserGroup, HiOutlineGift, HiOutlineCog, HiPlus, HiOutlineMenuAlt2, HiX } from 'react-icons/hi'
import { useState } from 'react'
import Logo from '../assets/Logo.png'
import './AtelierLayout.css'

const NAV_ITEMS = [
  { to: '/admin', icon: HiOutlineViewGrid, label: 'DASHBOARD' },
  { to: '/admin', icon: HiOutlineMail, label: 'INVITATIONS', end: false },
  { to: '/admin', icon: HiOutlineUserGroup, label: 'GUEST LIST' },
  { to: '/admin', icon: HiOutlineGift, label: 'REGISTRY' },
  { to: '/admin', icon: HiOutlineCog, label: 'SETTINGS' },
]

export default function AtelierLayout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="atelier-layout">
      {/* Mobile overlay */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`atelier-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div>
            <div className="sidebar-brand">
              <img src={Logo} alt="Invori Logo" />
            </div>
            <span className="label-caps" style={{ fontSize: 10 }}>Premium Member</span>
          </div>
          <button className="sidebar-close" onClick={() => setSidebarOpen(false)}>
            <HiX size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              className="sidebar-link"
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <button
            className="btn btn-primary btn-full sidebar-create"
            onClick={() => {
              navigate('/editor/new')
              setSidebarOpen(false)
            }}
          >
            <HiPlus size={16} />
            Create New
          </button>
          <button
            className="sidebar-logout"
            onClick={() => { logout(); navigate('/') }}
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="atelier-main">
        <div className="atelier-topbar">
          <button className="topbar-menu" onClick={() => setSidebarOpen(true)}>
            <HiOutlineMenuAlt2 size={22} />
          </button>
          <div className="topbar-right">
            <div className="topbar-user">
              <div className="topbar-avatar">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <span className="topbar-name">{user?.name || 'User'}</span>
            </div>
          </div>
        </div>
        <div className="atelier-content">
          {children}
        </div>
        <footer className="atelier-footer">
          <img src={Logo} alt="Invori Logo" className="footer-logo" />
          <div className="footer-links" style={{ marginTop: 8 }}>
            <a href="#">Privacy</a>
            <a href="#">Concierge</a>
            <a href="#">Contact</a>
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 8 }}>
            © 2026 Invori Your Digital Gateway to Special Moments. Crafted for elegance.
          </p>
        </footer>
      </main>
    </div>
  )
}

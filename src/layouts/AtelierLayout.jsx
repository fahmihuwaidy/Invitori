import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { HiOutlineViewGrid, HiOutlineMail, HiOutlineUserGroup, HiOutlineGift, HiOutlineCog, HiPlus, HiOutlineMenuAlt2, HiX } from 'react-icons/hi'
import { useState } from 'react'
import Logo from '../assets/Logo.png'
import './AtelierLayout.css'

import { useLocation } from 'react-router-dom'

const NAV_ITEMS = [
  { to: '/admin', id: 'overview', icon: HiOutlineViewGrid, label: 'DASHBOARD' },
  { to: '/admin?tab=rsvps', id: 'rsvps', icon: HiOutlineGift, label: 'RSVPS & WISHES' },
  { to: '/admin?tab=guests', id: 'guests', icon: HiOutlineUserGroup, label: 'GUEST LIST' },
  { to: '/admin?tab=settings', id: 'settings', icon: HiOutlineCog, label: 'SETTINGS' },
]

export default function AtelierLayout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const searchParams = new URLSearchParams(location.search)
  const currentTab = searchParams.get('tab') || 'overview'

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
            <span className="sidebar-member-badge">✦ Premium</span>
          </div>
          <button className="sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Close sidebar">
            <HiX size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              className={`sidebar-link ${currentTab === item.id ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
              aria-label={item.label}
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
          <div className="sidebar-user-section">
            <div className="sidebar-user-avatar">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user?.name || 'User'}</div>
              <div className="sidebar-user-email">{user?.email || ''}</div>
            </div>
          </div>
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
          <p style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 8 }}>
            © 2026 Invori Your Digital Gateway to Special Moments. Crafted for elegance.
          </p>
        </footer>
      </main>
    </div>
  )
}

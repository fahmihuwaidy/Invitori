import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  HiOutlineViewGrid,
  HiOutlineMail,
  HiOutlineUserGroup,
  HiOutlineHeart,
  HiPlus,
  HiOutlineMenuAlt2,
  HiX,
} from 'react-icons/hi'
import { useState } from 'react'
import Logo from '../assets/Logo.png'
import './AtelierLayout.css'

const NAV_ITEMS = [
  { to: '/admin', id: 'overview', icon: HiOutlineViewGrid, label: 'Overview', shortLabel: 'Overview' },
  { to: '/admin?tab=rsvps', id: 'rsvps', icon: HiOutlineMail, label: 'RSVPs', shortLabel: 'RSVPs' },
  { to: '/admin?tab=wishes', id: 'wishes', icon: HiOutlineHeart, label: 'Wishes', shortLabel: 'Wishes' },
  { to: '/admin?tab=guests', id: 'guests', icon: HiOutlineUserGroup, label: 'Guest CRM', shortLabel: 'Guests' },
]

export default function AtelierLayout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const searchParams = new URLSearchParams(location.search)
  const currentTab = searchParams.get('tab') || 'overview'

  const getPageTitle = () => {
    if (location.pathname.startsWith('/editor')) return 'Invitation Editor'
    switch (currentTab) {
      case 'rsvps':
        return 'RSVPs & Attendance'
      case 'wishes':
        return 'Wishes & Greetings'
      case 'guests':
        return 'Guest CRM'
      case 'overview':
      default:
        return 'Dashboard Overview'
    }
  }

  const activeTitle = getPageTitle()

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
            <span className="sidebar-member-badge">✦ Studio Pro</span>
          </div>
          <button className="sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Close sidebar">
            <HiX size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.id}
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
              <div className="sidebar-user-name">{user?.name || 'Studio Member'}</div>
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
        {/* Mobile topbar with active page title */}
        <div className="atelier-topbar">
          <button className="topbar-menu" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
            <HiOutlineMenuAlt2 size={22} />
          </button>
          <div className="topbar-center">
            <span className="topbar-page-title">{activeTitle}</span>
          </div>
          <div className="topbar-right">
            <div className="topbar-user">
              <div className="topbar-avatar">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            </div>
          </div>
        </div>

        <div className="atelier-content">
          {children}
        </div>

        <footer className="atelier-footer">
          <img src={Logo} alt="Invori Logo" className="footer-logo" />
          <p style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 8 }}>
            © 2026 Invori. Your Digital Gateway to Special Moments. Crafted for elegance.
          </p>
        </footer>

        {/* Mobile bottom navigation dock with safe-area padding and concise text labels */}
        <nav className="atelier-bottom-nav" aria-label="Mobile navigation">
          <div className="bottom-nav-inner">
            {NAV_ITEMS.map((item) => {
              const isActive = currentTab === item.id
              return (
                <NavLink
                  key={item.id}
                  to={item.to}
                  className={`bottom-nav-link ${isActive ? 'active' : ''}`}
                >
                  <item.icon size={18} />
                  <span className="bottom-nav-label">{item.shortLabel}</span>
                </NavLink>
              )
            })}
          </div>
        </nav>
      </main>
    </div>
  )
}

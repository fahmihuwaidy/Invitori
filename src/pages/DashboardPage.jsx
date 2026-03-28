import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useInvitations } from '../contexts/InvitationContext'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { HiOutlinePlus, HiOutlinePencil, HiOutlineExternalLink, HiOutlineTrash } from 'react-icons/hi'
import './DashboardPage.css'

export default function DashboardPage() {
  const { user } = useAuth()
  const { invitations, loading, deleteInvitation, addInvitation } = useInvitations()
  const navigate = useNavigate()

  const totalViews = invitations.reduce((sum, inv) => sum + inv.analytics.totalViews, 0)
  const totalRsvps = invitations.reduce((sum, inv) => sum + inv.analytics.rsvpCount, 0)
  const liveCampaigns = invitations.filter(i => i.status === 'published').length
  const responseRate = totalViews > 0 ? ((totalRsvps / totalViews) * 100).toFixed(1) : 0
  const analyticsData = [
    { date: 'Mon', views: totalViews > 0 ? Math.floor(totalViews * 0.05) : 12 },
    { date: 'Tue', views: totalViews > 0 ? Math.floor(totalViews * 0.15) : 19 },
    { date: 'Wed', views: totalViews > 0 ? Math.floor(totalViews * 0.1) : 15 },
    { date: 'Thu', views: totalViews > 0 ? Math.floor(totalViews * 0.25) : 28 },
    { date: 'Fri', views: totalViews > 0 ? Math.floor(totalViews * 0.2) : 22 },
    { date: 'Sat', views: totalViews > 0 ? Math.floor(totalViews * 0.15) : 34 },
    { date: 'Sun', views: totalViews > 0 ? Math.floor(totalViews * 0.1) : 40 },
  ]

  const recentActivity = [
    { color: 'var(--red)', text: <>New RSVP from <strong>Julian V.</strong> for The Autumn Gala.</>, time: '2 MINS AGO' },
    { color: 'var(--olive)', text: <>Invitation <strong>"Minimalist Noir"</strong> published.</>, time: '1 HOUR AGO' },
    { color: 'var(--text-muted)', text: <>Guest list <strong>"Wedding Main"</strong> updated.</>, time: '3 HOURS AGO' },
  ]

  const handleDelete = async (id) => {
    if (confirm('Delete this invitation?')) {
      await deleteInvitation(id)
    }
  }

  const handleCreate = async () => {
    const title = prompt('Invitation Title:', 'My Beautiful Invitation')
    if (!title) return
    const newInv = await addInvitation({ title })
    if (newInv) {
      navigate(`/editor/${newInv.id}`)
    }
  }

  if (loading) {
    return (
      <div className="dashboard animate-fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <p className="serif-italic" style={{ color: 'var(--text-muted)' }}>Loading your projects...</p>
      </div>
    )
  }

  return (
    <div className="dashboard animate-fade-in">
      {/* Welcome */}
      <div className="dash-header">
        <div className="dash-header-left">
          <h1 className="serif-italic dash-welcome">Welcome back, {user?.name || 'Invitori Member'}</h1>
          <p className="dash-subtitle">What masterpiece shall we create today?</p>
        </div>
        <div className="dash-profile">
          <div>
            <span className="label-caps" style={{ fontSize: 10 }}>Subscription</span>
            <strong style={{ display: 'block', fontSize: 14 }}>{user?.plan || 'Pro Plan'}</strong>
          </div>
          <div className="dash-avatar">{user?.name?.charAt(0) || 'U'}</div>
        </div>
      </div>

      {/* Stats */}
      <div className="dash-stats stagger">
        <div className="stat-card">
          <span className="label-caps">Total Guests</span>
          <div className="stat-value">{invitations.reduce((s, i) => s + i.guestCount, 0).toLocaleString()}</div>
          <span className="stat-change positive">↗ 12%</span>
        </div>
        <div className="stat-card">
          <span className="label-caps">Live Campaigns</span>
          <div className="stat-value">{liveCampaigns}</div>
          <span className="stat-badge">Active</span>
        </div>
        <div className="stat-card">
          <span className="label-caps">Response Rate</span>
          <div className="stat-value">{responseRate}%</div>
          <span className="stat-change positive">↗ 3%</span>
        </div>
      </div>

      {/* Analytics + Activity row */}
      <div className="dash-analytics-row">
        <div className="card analytics-card">
          <div className="analytics-header">
            <h3 className="serif-italic" style={{ fontSize: '1.3rem' }}>Traffic Analytics</h3>
            <span className="label-caps">Overview</span>
          </div>
          <div className="analytics-chart">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={analyticsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0eded" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#8A8A8A' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#8A8A8A' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#fff', border: '1px solid #E0DCD8', borderRadius: 8, fontSize: 13 }}
                  labelStyle={{ fontWeight: 600 }}
                />
                <Line type="monotone" dataKey="views" stroke="#565F34" strokeWidth={2.5} dot={{ r: 4, fill: '#565F34' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card activity-card">
          <h4 className="serif-italic" style={{ marginBottom: 20 }}>Recent Activity</h4>
          <div className="activity-list">
            {recentActivity.map((item, i) => (
              <div key={i} className="activity-item">
                <div className="activity-dot" style={{ background: item.color }} />
                <div className="activity-content">
                  <p>{item.text}</p>
                  <span className="label-caps" style={{ fontSize: 9 }}>{item.time}</span>
                </div>
              </div>
            ))}
          </div>
          <span className="activity-link" style={{cursor: 'pointer'}}>
            View All Activity →
          </span>
        </div>
      </div>

      {/* Current Projects */}
      <div className="dash-projects">
        <div className="projects-header">
          <h2 className="serif-italic" style={{ fontSize: '1.4rem' }}>Current Projects</h2>
          <span className="projects-browse" onClick={() => navigate('/')} style={{cursor: 'pointer'}}>Browse Gallery</span>
        </div>
        <div className="projects-grid stagger">
          {invitations.map(inv => (
            <div key={inv.id} className="project-card card">
              <div className="project-thumb" style={{ background: inv.theme?.backgroundColor || '#EDE9E7' }}>
                <span className={`badge ${inv.status === 'published' ? 'badge-published' : 'badge-draft'}`}>
                  {inv.status}
                </span>
                <div className="project-thumb-content serif-italic" style={{ color: inv.theme?.primaryColor || '#565F34' }}>
                  {inv.title}
                </div>
              </div>
              <div className="project-info">
                <h4 className="serif-italic">{inv.title}</h4>
                <p className="project-meta">
                  {inv.category} · {inv.guestCount.toLocaleString()} Guests · {new Date(inv.createdAt).toLocaleDateString('en', { month: 'short', year: 'numeric' })}
                </p>
                <div className="project-actions">
                  <button className="btn btn-outline btn-sm" onClick={() => navigate(`/editor/${inv.id}`)}>
                    <HiOutlinePencil size={14} />
                    Edit Design
                  </button>
                  {inv.status === 'published' && (
                    <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/undangan/${inv.slug}`)}>
                      <HiOutlineExternalLink size={14} />
                      View Live
                    </button>
                  )}
                  <button className="project-delete" onClick={() => handleDelete(inv.id)}>
                    <HiOutlineTrash size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Create new card */}
          <div className="project-card card project-new" onClick={handleCreate}>
            <div className="project-new-inner">
              <div className="project-new-icon">
                <HiOutlinePlus size={28} />
              </div>
              <h4 className="serif-italic">Start New Concept</h4>
              <p>Create a bespoke digital invitation from scratch.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

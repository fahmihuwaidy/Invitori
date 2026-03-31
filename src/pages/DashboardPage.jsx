import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useInvitations } from '../contexts/InvitationContext'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts'
import { HiOutlinePlus, HiOutlinePencil, HiOutlineExternalLink, HiOutlineTrash, HiOutlineEye, HiOutlineUserGroup, HiOutlineMail, HiOutlineCheck, HiOutlineX } from 'react-icons/hi'
import './DashboardPage.css'

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now - date
  const diffMin = Math.floor(diffMs / 60000)
  const diffHour = Math.floor(diffMs / 3600000)
  const diffDay = Math.floor(diffMs / 86400000)

  if (diffMin < 1) return 'Baru saja'
  if (diffMin < 60) return `${diffMin} menit lalu`
  if (diffHour < 24) return `${diffHour} jam lalu`
  if (diffDay < 7) return `${diffDay} hari lalu`
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function DashboardPage() {
  const { user } = useAuth()
  const { invitations, recentRsvps, loading, deleteInvitation, addInvitation } = useInvitations()
  const navigate = useNavigate()

  // ---- Computed Stats from REAL data ----
  const totalViews = useMemo(
    () => invitations.reduce((sum, inv) => sum + (inv.analytics?.totalViews || 0), 0),
    [invitations]
  )
  const totalRsvps = useMemo(
    () => invitations.reduce((sum, inv) => sum + (inv.analytics?.rsvpCount || 0), 0),
    [invitations]
  )
  const totalGuests = useMemo(
    () => invitations.reduce((s, i) => s + (i.guestCount || 0), 0),
    [invitations]
  )
  const liveCampaigns = useMemo(
    () => invitations.filter(i => i.status === 'published').length,
    [invitations]
  )
  const responseRate = totalViews > 0 ? ((totalRsvps / totalViews) * 100).toFixed(1) : 0

  // ---- Analytics Chart: Views per Invitation (real data) ----
  const chartData = useMemo(() => {
    if (invitations.length === 0) return []
    return invitations
      .filter(inv => (inv.analytics?.totalViews || 0) > 0 || (inv.analytics?.rsvpCount || 0) > 0)
      .map(inv => ({
        name: inv.title?.length > 18 ? inv.title.substring(0, 18) + '…' : inv.title,
        views: inv.analytics?.totalViews || 0,
        rsvp: inv.analytics?.rsvpCount || 0,
      }))
  }, [invitations])

  // ---- Activity Feed from REAL RSVPs ----
  const activityItems = useMemo(() => {
    if (!recentRsvps || recentRsvps.length === 0) return []
    return recentRsvps.slice(0, 5).map(rsvp => {
      const isAttending = rsvp.attendance === 'attending' || rsvp.attendance === 'yes' || rsvp.attendance === true
      const isDeclined = rsvp.attendance === 'declined' || rsvp.attendance === 'no' || rsvp.attendance === false
      let color = 'var(--olive)'
      let icon = '💌'
      if (isAttending) { color = 'var(--olive)'; icon = '✅' }
      else if (isDeclined) { color = 'var(--pink-dusty)'; icon = '❌' }

      return {
        id: rsvp.id,
        color,
        icon,
        text: (
          <>
            <strong>{rsvp.name || 'Tamu'}</strong>{' '}
            {isAttending ? 'akan hadir' : isDeclined ? 'tidak dapat hadir' : 'mengirim RSVP'}{' '}
            untuk <strong>"{rsvp.invitationTitle}"</strong>
            {rsvp.message && <span className="activity-message">— "{rsvp.message}"</span>}
          </>
        ),
        time: timeAgo(rsvp.createdAt),
      }
    })
  }, [recentRsvps])

  const handleDelete = async (id) => {
    if (confirm('Hapus undangan ini?')) {
      await deleteInvitation(id)
    }
  }

  const handleCreate = async () => {
    const title = prompt('Judul Undangan:', 'Undangan Saya')
    if (!title) return
    const newInv = await addInvitation({ title })
    if (newInv) {
      navigate(`/editor/${newInv.id}`)
    }
  }

  if (loading) {
    return (
      <div className="dashboard animate-fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p className="serif-italic" style={{ color: 'var(--text-muted)', marginTop: 16 }}>Memuat proyek Anda...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard animate-fade-in">
      {/* Welcome */}
      <div className="dash-header">
        <div className="dash-header-left">
          <h1 className="serif-italic dash-welcome">Selamat datang, {user?.name || 'Member'}</h1>
          <p className="dash-subtitle">Kelola undangan digital Anda dari sini.</p>
        </div>
        <div className="dash-profile">
          <div>
            <span className="label-caps" style={{ fontSize: 10 }}>Total Undangan</span>
            <strong style={{ display: 'block', fontSize: 14 }}>{invitations.length} Proyek</strong>
          </div>
          <div className="dash-avatar">{user?.name?.charAt(0) || 'U'}</div>
        </div>
      </div>

      {/* Stats */}
      <div className="dash-stats stagger">
        <div className="stat-card">
          <span className="label-caps">
            <HiOutlineEye size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
            Total Views
          </span>
          <div className="stat-value">{totalViews.toLocaleString()}</div>
          <span className="stat-detail">{invitations.length} undangan</span>
        </div>
        <div className="stat-card">
          <span className="label-caps">
            <HiOutlineMail size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
            Total RSVP
          </span>
          <div className="stat-value">{totalRsvps.toLocaleString()}</div>
          <span className="stat-detail">
            {responseRate > 0 ? `${responseRate}% response rate` : 'Belum ada respons'}
          </span>
        </div>
        <div className="stat-card">
          <span className="label-caps">
            <HiOutlineUserGroup size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
            Live
          </span>
          <div className="stat-value">{liveCampaigns}</div>
          <span className="stat-badge">{liveCampaigns > 0 ? 'Aktif' : 'Tidak ada'}</span>
        </div>
      </div>

      {/* Analytics + Activity row */}
      <div className="dash-analytics-row">
        <div className="card analytics-card">
          <div className="analytics-header">
            <h3 className="serif-italic" style={{ fontSize: '1.3rem' }}>Statistik Undangan</h3>
            <span className="label-caps">Views & RSVP</span>
          </div>
          <div className="analytics-chart">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0eded" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#8A8A8A' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#8A8A8A' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: '#fff', border: '1px solid #E0DCD8', borderRadius: 8, fontSize: 13 }}
                    labelStyle={{ fontWeight: 600 }}
                    formatter={(value, name) => [value, name === 'views' ? 'Views' : 'RSVP']}
                  />
                  <Bar dataKey="views" fill="#565F34" radius={[4, 4, 0, 0]} name="Views" />
                  <Bar dataKey="rsvp" fill="#d09ca7" radius={[4, 4, 0, 0]} name="RSVP" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-chart">
                <HiOutlineEye size={32} style={{ color: 'var(--text-light)', marginBottom: 8 }} />
                <p className="serif-italic" style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                  Belum ada data statistik
                </p>
                <p style={{ color: 'var(--text-light)', fontSize: 12 }}>
                  Data akan muncul setelah undangan mulai dibuka
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="card activity-card">
          <h4 className="serif-italic" style={{ marginBottom: 20 }}>Aktivitas Terbaru</h4>
          <div className="activity-list">
            {activityItems.length > 0 ? (
              activityItems.map((item) => (
                <div key={item.id} className="activity-item">
                  <div className="activity-icon">{item.icon}</div>
                  <div className="activity-content">
                    <p>{item.text}</p>
                    <span className="label-caps" style={{ fontSize: 9 }}>{item.time}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-activity">
                <HiOutlineMail size={28} style={{ color: 'var(--text-light)', marginBottom: 8 }} />
                <p className="serif-italic" style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                  Belum ada aktivitas
                </p>
                <p style={{ color: 'var(--text-light)', fontSize: 12 }}>
                  RSVP dari tamu akan muncul di sini
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Current Projects */}
      <div className="dash-projects">
        <div className="projects-header">
          <h2 className="serif-italic" style={{ fontSize: '1.4rem' }}>Proyek Anda</h2>
          {invitations.length > 0 && (
            <span className="projects-count label-caps">{invitations.length} undangan</span>
          )}
        </div>
        <div className="projects-grid stagger">
          {invitations.map(inv => (
            <div key={inv.id} className="project-card card">
              <div className="project-thumb" style={{ background: inv.theme?.backgroundColor || '#EDE9E7' }}>
                <span className={`badge ${inv.status === 'published' ? 'badge-published' : 'badge-draft'}`}>
                  {inv.status === 'published' ? 'Published' : 'Draft'}
                </span>
                <div className="project-thumb-content serif-italic" style={{ color: inv.theme?.primaryColor || '#565F34' }}>
                  {inv.title}
                </div>
              </div>
              <div className="project-info">
                <h4 className="serif-italic">{inv.title}</h4>
                <p className="project-meta">
                  {inv.category || 'Umum'} · {(inv.analytics?.totalViews || 0).toLocaleString()} Views · {(inv.analytics?.rsvpCount || 0)} RSVP
                </p>
                <p className="project-date">
                  {new Date(inv.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
                <div className="project-actions">
                  <button className="btn btn-outline btn-sm" onClick={() => navigate(`/editor/${inv.id}`)}>
                    <HiOutlinePencil size={14} />
                    Edit
                  </button>
                  {inv.status === 'published' && (
                    <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/undangan/${inv.slug}`)}>
                      <HiOutlineExternalLink size={14} />
                      Lihat
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
              <h4 className="serif-italic">Buat Undangan Baru</h4>
              <p>Mulai membuat undangan digital dari awal.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

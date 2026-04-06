import { useMemo, useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useInvitations } from '../contexts/InvitationContext'
import { PRESET_LIST } from '../utils/presets'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts'
import { HiOutlinePlus, HiOutlinePencil, HiOutlineExternalLink, HiOutlineTrash, HiOutlineEye, HiOutlineUserGroup, HiOutlineMail, HiOutlineCheck, HiOutlineX, HiX, HiSelector, HiOutlineLink, HiOutlineDocumentDuplicate, HiOutlineCog } from 'react-icons/hi'
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

/* ---- Preset Selection Modal ---- */
function PresetModal({ onClose, onSelect }) {
  const [step, setStep] = useState('choose') // 'choose' or 'title'
  const [selectedPreset, setSelectedPreset] = useState(null)
  const [title, setTitle] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const handlePresetClick = (preset) => {
    setSelectedPreset(preset)
    setTitle(preset.key === 'wedding' ? 'Undangan Pernikahan' : preset.key === 'birthday' ? 'Undangan Ulang Tahun' : preset.key === 'aqiqah' ? 'Undangan Aqiqah' : 'Undangan Saya')
    setStep('title')
  }

  const handleCreate = async () => {
    if (!title.trim() || isCreating) return
    setIsCreating(true)
    try {
      await onSelect(selectedPreset.key, title.trim())
    } catch (err) {
      console.error(err)
      alert('Gagal membuat undangan. Silakan coba lagi.')
      setIsCreating(false)
    }
  }

  return (
    <div className="preset-modal-overlay" onClick={isCreating ? null : onClose}>
      <div className="preset-modal" onClick={e => e.stopPropagation()}>
        {!isCreating && <button className="preset-modal-close" onClick={onClose}><HiX size={20} /></button>}

        {step === 'choose' ? (
          <>
            <div className="preset-modal-header">
              <h2 className="serif-italic">Pilih Template</h2>
              <p>Pilih kategori undangan untuk memulai dengan template yang sesuai.</p>
            </div>
            <div className="preset-grid">
              {PRESET_LIST.map(preset => (
                <button
                  key={preset.key}
                  className="preset-card"
                  onClick={() => handlePresetClick(preset)}
                  style={{ '--preset-color': preset.color }}
                >
                  <div className="preset-card-icon">{preset.icon}</div>
                  <div className="preset-card-body">
                    <h3>{preset.label}</h3>
                    <span className="preset-card-label-id">{preset.labelId}</span>
                    <p>{preset.description}</p>
                  </div>
                  <div className="preset-card-blocks">
                    {preset.blocks.length > 0 ? (
                      <span>{preset.blocks.length} blok</span>
                    ) : (
                      <span>Kanvas kosong</span>
                    )}
                  </div>
                  <div className="preset-card-arrow">→</div>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="preset-modal-header">
              {!isCreating && <button className="preset-back-btn" onClick={() => setStep('choose')}>← Kembali</button>}
              <div className="preset-chosen-badge" style={{ background: `${selectedPreset.color}15`, color: selectedPreset.color }}>
                <span>{selectedPreset.icon}</span> {selectedPreset.label}
              </div>
              <h2 className="serif-italic" style={{ marginTop: 12 }}>Beri Nama Undangan</h2>
              <p>Masukkan judul untuk undangan Anda. Bisa diubah nanti.</p>
            </div>
            <div className="preset-title-form">
              <input
                type="text"
                className="preset-title-input"
                value={title}
                onChange={e => setTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                placeholder="cth: Undangan Pernikahan Aqil & Anty"
                autoFocus
                disabled={isCreating}
              />
              <button
                className="btn btn-primary btn-full preset-create-btn"
                onClick={handleCreate}
                disabled={!title.trim() || isCreating}
              >
                {isCreating ? (
                  <>
                    <div className="spinner-sm" style={{ marginRight: 8 }}></div>
                    Membuat...
                  </>
                ) : (
                  <>
                    <HiOutlinePlus size={16} /> Buat Undangan
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function GuestListTab({ invitation }) {
  const [guests, setGuests] = useState([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [adding, setAdding] = useState(false)
  const [copiedId, setCopiedId] = useState(null)

  const baseUrl = `${window.location.origin}/undangan/${invitation?.slug}`

  const fetchGuests = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('guests')
      .select('*')
      .eq('invitation_id', invitation.id)
      .order('created_at', { ascending: true })
    if (data) setGuests(data)
    setLoading(false)
  }, [invitation.id])

  useEffect(() => {
    if (invitation?.id) {
      fetchGuests()
    }
  }, [invitation?.id, fetchGuests])

  const handleAdd = async () => {
    if (!newName.trim() || !invitation?.id) return
    setAdding(true)
    const { data, error } = await supabase
      .from('guests')
      .insert({ invitation_id: invitation.id, name: newName.trim(), phone: newPhone.trim() || null })
      .select()
      .single()
    if (data) setGuests(prev => [...prev, data])
    setNewName('')
    setNewPhone('')
    setAdding(false)
  }

  const handleDelete = async (guestId) => {
    if (!confirm('Hapus tamu ini?')) return
    await supabase.from('guests').delete().eq('id', guestId)
    setGuests(prev => prev.filter(g => g.id !== guestId))
  }

  const getLink = (name) => `${baseUrl}?to=${encodeURIComponent(name)}`

  const copyLink = (guest) => {
    navigator.clipboard.writeText(getLink(guest.name))
    setCopiedId(guest.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="card animate-fade-in-up" style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24, gap: 16 }}>
        <div>
          <h3 className="serif-italic" style={{ fontSize: '1.5rem', color: 'var(--olive)', marginBottom: 4 }}>Daftar Tamu & Link</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Kelola daftar tamu dan dapatkan link undangan personal mereka.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div className="stat-badge" style={{ background: 'rgba(86,95,52,0.1)', color: 'var(--olive)', padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
            {guests.length} Tamu
          </div>
          <button 
            className="btn btn-outline btn-sm"
            onClick={() => {
              const csv = [
                ['Nama', 'No. HP', 'Link Undangan'].join(','),
                ...guests.map(g => [g.name, g.phone || '-', getLink(g.name)].join(','))
              ].join('\n');
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `GuestList_${invitation?.title || 'Undangan'}.csv`;
              a.click();
            }}
            disabled={guests.length === 0}
          >
            Export CSV
          </button>
        </div>
      </div>

      <div style={{ padding: '24px', background: 'rgba(86,95,52,0.03)', border: '1px solid rgba(86,95,52,0.1)', borderRadius: 16, marginBottom: 32 }}>
        <p className="label-caps" style={{ fontSize: 11, color: 'var(--olive)', marginBottom: 16, letterSpacing: 1 }}>Tambah Tamu Baru</p>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: '2 1 240px' }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-dark)', display: 'block', marginBottom: 6 }}>Nama Lengkap Tamu *</label>
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              placeholder="cth: Bapak Budi Santoso & Keluarga"
              className="settings-input"
              style={{ width: '100%', background: 'white' }}
            />
          </div>
          <div style={{ flex: '1 1 180px' }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-dark)', display: 'block', marginBottom: 6 }}>No. HP (opsional)</label>
            <input
              value={newPhone}
              onChange={e => setNewPhone(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              placeholder="cth: 08123456..."
              className="settings-input"
              style={{ width: '100%', background: 'white' }}
            />
          </div>
          <button
            onClick={handleAdd}
            disabled={adding || !newName.trim()}
            className="btn btn-primary"
            style={{ padding: '0 24px', height: 44, marginBottom: 2 }}
          >
            {adding ? '...' : 'Tambah'}
          </button>
        </div>
      </div>

      <div>
        {loading ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0', fontSize: 14 }}>Memuat daftar tamu...</p>
        ) : guests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', background: 'var(--white)', borderRadius: 12, border: '1px dashed var(--border)' }}>
            <HiOutlineUserGroup size={40} color="var(--text-light)" style={{ marginBottom: 16, opacity: 0.5 }} />
            <p className="serif-italic" style={{ color: 'var(--text-muted)', fontSize: 16 }}>Belum ada tamu yang ditambahkan</p>
            <p style={{ color: 'var(--text-light)', fontSize: 12, marginTop: 4 }}>Gunakan form di atas untuk mulai menambah tamu.</p>
          </div>
        ) : (
          <div style={{ border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', background: 'white' }}>
            <div style={{ display: 'flex', padding: '12px 20px', background: '#f8f8f6', borderBottom: '1px solid var(--border)', fontSize: 11, fontWeight: 600, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: 1 }}>
              <div style={{ flex: 1 }}>Informasi Tamu</div>
              <div style={{ width: 140, textAlign: 'right' }}>Aksi</div>
            </div>
            {guests.map((g, idx) => (
              <div key={g.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px', borderBottom: idx < guests.length - 1 ? '1px solid var(--border)' : 'none', transition: 'background 0.2s' }} className="guest-row-hover">
                <div style={{ flex: 1, minWidth: 0, paddingRight: 24 }}>
                  <p style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 600, color: 'var(--text-dark)' }}>{g.name}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-light)', fontSize: 12 }}>
                      <HiOutlineLink size={14} />
                      <span style={{ fontFamily: 'monospace', opacity: 0.8 }}>...{getLink(g.name).slice(-30)}</span>
                    </div>
                    {g.phone && (
                      <div style={{ fontSize: 12, color: 'var(--text-light)', padding: '2px 8px', background: '#f0f0f0', borderRadius: 4 }}>
                        {g.phone}
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => window.open(getLink(g.name), '_blank')} className="btn btn-outline btn-sm" style={{ padding: '8px 14px' }} title="Buka Undangan">
                    <HiOutlineExternalLink size={16} />
                  </button>
                  <button onClick={() => copyLink(g)} className="btn btn-outline btn-sm" style={{ padding: '8px 14px', minWidth: 44 }} title="Salin Link">
                    {copiedId === g.id ? <HiOutlineCheck size={16} color="var(--olive)"/> : <HiOutlineDocumentDuplicate size={16} />}
                  </button>
                  <button onClick={() => handleDelete(g.id)} className="btn btn-ghost btn-sm" style={{ padding: '8px 14px', color: 'var(--pink-dusty)' }} title="Hapus">
                    <HiOutlineTrash size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const { invitations, recentRsvps, loading, deleteInvitation, addInvitation } = useInvitations()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const [showPresetModal, setShowPresetModal] = useState(false)
  const [selectedInvId, setSelectedInvId] = useState(searchParams.get('inv') || '')
  const [allRsvps, setAllRsvps] = useState([])
  const [rsvpsLoading, setRsvpsLoading] = useState(false)

  const rawTab = searchParams.get('tab') || 'overview'
  const activeTab = rawTab

  const setTab = (tabId) => {
    const params = new URLSearchParams(searchParams)
    params.set('tab', tabId)
    setSearchParams(params)
  }

  const handleInvChange = (e) => {
    const newId = e.target.value
    setSelectedInvId(newId)
    const params = new URLSearchParams(searchParams)
    params.set('inv', newId)
    setSearchParams(params)
  }

  const selectedInv = useMemo(() => {
    if (invitations.length === 0) return null
    return invitations.find(i => i.id === selectedInvId) || invitations[0]
  }, [invitations, selectedInvId])

  const activeInvId = selectedInv?.id

  // ---- Fetch ALL RSVPs for selected invitation ----
  const fetchAllRsvps = useCallback(async (invId) => {
    if (!invId) return
    setRsvpsLoading(true)
    try {
      const { data, error } = await supabase
        .from('rsvps')
        .select('*')
        .eq('invitation_id', invId)
        .order('sent_at', { ascending: false })
      
      if (error) throw error
      setAllRsvps(data || [])
    } catch (err) {
      console.error('Error fetching all RSVPs:', err)
    } finally {
      setRsvpsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (selectedInv?.id) {
      fetchAllRsvps(selectedInv.id)
    }
  }, [selectedInv?.id, fetchAllRsvps])

  // ---- Computed Stats from REAL data (filtered by selected invitation) ----
  const totalViews = useMemo(() => selectedInv?.analytics?.totalViews || 0, [selectedInv])
  const totalRsvps = useMemo(() => selectedInv?.analytics?.rsvpCount || 0, [selectedInv])
  const liveCampaigns = selectedInv?.status === 'published' ? 1 : 0
  const responseRate = totalViews > 0 ? ((totalRsvps / totalViews) * 100).toFixed(1) : 0

  // Chart data per invitation (Attending vs Not Attending vs Unknown)
  const chartData = useMemo(() => {
    if (!selectedInv || !allRsvps) return []
    if (allRsvps.length === 0 && totalViews === 0) return []
    
    const attending = allRsvps.filter(r => r.attendance === 'attending' || r.attendance === 'yes' || r.attendance === true).length
    const declined = allRsvps.filter(r => r.attendance === 'declined' || r.attendance === 'no' || r.attendance === false).length
    const pending = totalViews - (attending + declined) // Approximation of those who viewed but haven't decided
    const validPending = pending > 0 ? pending : 0
    return [
      { name: 'Attending', count: attending, fill: '#565F34' },
      { name: 'Declined', count: declined, fill: '#d09ca7' },
      { name: 'No Response', count: validPending, fill: '#E0DCD8' }
    ]
  }, [selectedInv, allRsvps, totalViews])

  // ---- Activity Feed from ALL RSVPs for selected inv ----
  // ---- Activity Feed from ALL RSVPs for selected inv ----
  const activityItems = useMemo(() => {
    if (!allRsvps || allRsvps.length === 0) return []
    return allRsvps.map(rsvp => {
      const isAttending = rsvp.attendance === 'attending' || rsvp.attendance === 'yes' || rsvp.attendance === true
      const isDeclined = rsvp.attendance === 'declined' || rsvp.attendance === 'no' || rsvp.attendance === false
      let color = 'var(--olive)'
      let icon = '💌'
      if (isAttending) { color = 'var(--olive)'; icon = '✅' }
      else if (isDeclined) { color = 'var(--pink-dusty)'; icon = '❌' }

      const sentAtDate = rsvp.sent_at || rsvp.sentAt // Handle both snake_case and camelCase
      let timeStr = 'Baru saja'
      if (sentAtDate) {
        try {
          const date = new Date(sentAtDate)
          if (!isNaN(date.getTime())) {
            timeStr = date.toLocaleDateString('id-ID', {day: 'numeric', month: 'short'}) + ' ' + 
                      date.toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'})
          }
        } catch (e) {
          console.warn('Invalid date:', sentAtDate)
        }
      }

      return {
        id: rsvp.id,
        color,
        icon,
        isAttending,
        isDeclined,
        name: rsvp.name || 'Tamu',
        message: rsvp.message,
        time: timeStr,
        text: (
          <>
            <strong>{rsvp.name || 'Tamu'}</strong>{' '}
            {isAttending ? 'akan hadir' : isDeclined ? 'tidak dapat hadir' : 'mengirim ucapan'}
            {rsvp.message && <span className="activity-message">— "{rsvp.message}"</span>}
          </>
        ),
      }
    })
  }, [allRsvps])

  const handleDelete = async (id) => {
    if (confirm('Hapus undangan ini?')) {
      await deleteInvitation(id)
    }
  }

  const handlePresetSelect = async (presetKey, title) => {
    setShowPresetModal(false)
    const category = presetKey === 'wedding' ? 'Wedding' : presetKey === 'birthday' ? 'Birthday' : presetKey === 'aqiqah' ? 'Aqiqah' : 'Custom'
    const newInv = await addInvitation({ title, category })
    if (newInv) {
      navigate(`/editor/${newInv.id}?preset=${presetKey}`)
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
      {/* Welcome & Invitation Selector */}
      <div className="dash-header" style={{ alignItems: 'flex-start' }}>
        <div className="dash-header-left">
          <h1 className="serif-italic dash-welcome">Selamat datang, {user?.name || 'Member'}</h1>
          <p className="dash-subtitle">Kelola undangan digital Anda dari sini.</p>
        </div>
        <div className="dash-profile" style={{ flexWrap: 'wrap', gap: 16, alignItems: 'flex-end' }}>
          {invitations.length > 0 && selectedInv && (
            <div className="dash-inv-selector-wrapper" style={{ minWidth: 240 }}>
              <span className="label-caps" style={{ fontSize: 10, display: 'block', marginBottom: 6, color: 'var(--olive)', fontWeight: 600 }}>Pilih Undangan</span>
              <div style={{ position: 'relative' }}>
                <select 
                  className="settings-input" 
                  value={selectedInvId} 
                  onChange={handleInvChange}
                  style={{ 
                    width: '100%', 
                    paddingRight: 36, 
                    appearance: 'none', 
                    background: 'var(--white)', 
                    fontWeight: 600,
                    height: 42,
                    border: '1.5px solid var(--border)',
                    borderRadius: '8px'
                  }}
                >
                  {invitations.map(inv => (
                    <option key={inv.id} value={inv.id}>{inv.title || 'Untitled Project'}</option>
                  ))}
                </select>
                <HiSelector size={16} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--olive)' }} />
              </div>
            </div>
          )}
          <button 
            className="btn btn-primary" 
            onClick={() => setShowPresetModal(true)}
            style={{ 
              height: 42, 
              padding: '0 24px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <HiOutlinePlus size={18} /> Buat Baru
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      {invitations.length > 0 && selectedInv && (
        <div className="dash-tabs" style={{ display: 'flex', gap: 24, borderBottom: '1px solid var(--border)', marginBottom: 24, overflowX: 'auto', paddingBottom: 2 }}>
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'rsvps', label: 'RSVPs' },
            { id: 'wishes', label: 'Wishes' },
            { id: 'guests', label: 'Guest List Links' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                background: 'none', border: 'none', padding: '0 0 8px 0', fontSize: 13,
                fontWeight: activeTab === t.id ? 600 : 500,
                color: activeTab === t.id ? 'var(--olive)' : 'var(--text-muted)',
                borderBottom: activeTab === t.id ? '2px solid var(--olive)' : '2px solid transparent',
                cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Tab Contents */}
      {invitations.length === 0 ? (
        <div className="empty-state card" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <div className="project-new-icon" style={{ margin: '0 auto 16px auto' }}><HiOutlinePlus size={32} /></div>
          <h2 className="serif-italic" style={{ fontSize: '1.5rem', marginBottom: 8 }}>Belum Ada Undangan</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>Mulai buat undangan pertama Anda sekarang.</p>
          <button className="btn btn-primary" onClick={() => setShowPresetModal(true)}>Buat Undangan Baru</button>
        </div>
      ) : activeTab === 'overview' ? (
        /* ----- OVERVIEW TAB ----- */
        <>
          <div className="dash-stats stagger">
            <div className="stat-card">
              <span className="label-caps"><HiOutlineEye size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />Total Views</span>
              <div className="stat-value">{totalViews.toLocaleString()}</div>
              <span className="stat-detail">Untuk undangan ini</span>
            </div>
            <div className="stat-card">
              <span className="label-caps"><HiOutlineMail size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />Total RSVP</span>
              <div className="stat-value">{totalRsvps.toLocaleString()}</div>
              <span className="stat-detail">{responseRate > 0 ? `${responseRate}% response rate` : 'Belum ada respons'}</span>
            </div>
            <div className="stat-card">
              <span className="label-caps"><HiOutlineCheck size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />Status</span>
              <div className="stat-value" style={{ fontSize: '1.5rem' }}>{selectedInv.status === 'published' ? 'Live' : 'Draft'}</div>
              <span className="stat-badge">{selectedInv.status === 'published' ? 'Siap Disebar' : 'Belum Publish'}</span>
            </div>
          </div>

          <div className="dash-analytics-row">
            <div className="card analytics-card">
              <div className="analytics-header">
                <h3 className="serif-italic" style={{ fontSize: '1.3rem' }}>Response Breakdown</h3>
                <span className="label-caps">Attending vs Not</span>
              </div>
              <div className="analytics-chart">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={chartData} barCategoryGap="25%">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0eded" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#8A8A8A' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#8A8A8A' }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip contentStyle={{ background: '#fff', border: '1px solid #E0DCD8', borderRadius: 8, fontSize: 13 }} labelStyle={{ fontWeight: 600 }} />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="empty-chart">
                    <HiOutlineEye size={32} style={{ color: 'var(--text-light)', marginBottom: 8 }} />
                    <p className="serif-italic" style={{ color: 'var(--text-muted)', fontSize: 14 }}>Belum ada data</p>
                  </div>
                )}
              </div>
            </div>

            <div className="card activity-card">
              <h4 className="serif-italic" style={{ marginBottom: 20 }}>Tamu Terbaru</h4>
              <div className="activity-list">
                {activityItems.length > 0 ? (
                  activityItems.slice(0, 5).map((item) => (
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
                    <p className="serif-italic" style={{ color: 'var(--text-muted)', fontSize: 13 }}>Belum ada RSVP</p>
                  </div>
                )}
              </div>
              {activityItems.length > 5 && (
                <button className="btn btn-ghost btn-sm" style={{ width: '100%', marginTop: 12 }} onClick={() => setTab('rsvps')}>Lihat Semua RSVP</button>
              )}
            </div>
          </div>

          <div className="dash-projects" style={{ marginTop: 40 }}>
            <div className="projects-header">
              <h2 className="serif-italic" style={{ fontSize: '1.4rem' }}>Tindakan pada undangan ini</h2>
            </div>
            <div className="project-card card" style={{ maxWidth: 400 }}>
              <div className="project-thumb" style={{ background: selectedInv?.theme?.backgroundColor || '#EDE9E7', minHeight: 120 }}>
                <span className={`badge ${selectedInv?.status === 'published' ? 'badge-published' : 'badge-draft'}`}>
                  {selectedInv?.status === 'published' ? 'Published' : 'Draft'}
                </span>
                <div className="project-thumb-content serif-italic" style={{ color: selectedInv?.theme?.primaryColor || '#565F34' }}>
                  {selectedInv?.title || 'Untitled'}
                </div>
              </div>
              <div className="project-info">
                <div className="project-actions" style={{ marginTop: 12 }}>
                  <button className="btn btn-outline btn-sm" onClick={() => navigate(`/editor/${selectedInv?.id}`)}>
                    <HiOutlinePencil size={14} /> Edit Desain
                  </button>
                  {selectedInv?.status === 'published' && (
                    <button className="btn btn-ghost btn-sm" onClick={() => window.open(`/undangan/${selectedInv?.slug}`, '_blank')}>
                      <HiOutlineExternalLink size={14} /> Lihat Web
                    </button>
                  )}
                  <button className="project-delete" onClick={() => handleDelete(selectedInv?.id)} style={{ marginLeft: 'auto' }}>
                    <HiOutlineTrash size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : activeTab === 'rsvps' ? (
        /* ----- RSVPs TAB ----- */
        <div className="rsvps-tab animate-fade-in-up">
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24, gap: 16 }}>
              <div>
                <h3 className="serif-italic" style={{ fontSize: '1.5rem', color: 'var(--olive)', marginBottom: 4 }}>Konfirmasi Kehadiran</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Lihat siapa saja yang akan hadir di acara Anda.</p>
              </div>
              <button 
                className="btn btn-outline btn-sm" 
                onClick={() => {
                  const csv = [
                    ['Nama', 'Kehadiran', 'Waktu Pengiriman'].join(','),
                    ...activityItems.filter(i => i.isAttending || i.isDeclined).map(i => [i.name, i.isAttending ? 'Hadir' : 'Tidak Hadir', i.time].join(','))
                  ].join('\n');
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `RSVP_${selectedInv?.title || 'Undangan'}.csv`;
                  a.click();
                }}
                disabled={activityItems.filter(i => i.isAttending || i.isDeclined).length === 0}
              >
                Export CSV
              </button>
            </div>

            <div className="summary-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16, marginBottom: 32 }}>
              <div className="stat-card" style={{ padding: '16px 20px', background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 12 }}>
                <span style={{ fontSize: 11, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: 1 }}>Total RSVP</span>
                <div style={{ fontSize: 24, fontWeight: 600, color: 'var(--text-dark)', marginTop: 4 }}>{activityItems.filter(i => i.isAttending || i.isDeclined).length}</div>
              </div>
              <div className="stat-card" style={{ padding: '16px 20px', background: 'rgba(86,95,52,0.05)', border: '1px solid rgba(86,95,52,0.1)', borderRadius: 12 }}>
                <span style={{ fontSize: 11, color: 'var(--olive)', textTransform: 'uppercase', letterSpacing: 1 }}>Hadir</span>
                <div style={{ fontSize: 24, fontWeight: 600, color: 'var(--olive)', marginTop: 4 }}>{activityItems.filter(i => i.isAttending).length}</div>
              </div>
              <div className="stat-card" style={{ padding: '16px 20px', background: 'rgba(208,156,167,0.05)', border: '1px solid rgba(208,156,167,0.1)', borderRadius: 12 }}>
                <span style={{ fontSize: 11, color: 'var(--pink-dusty)', textTransform: 'uppercase', letterSpacing: 1 }}>Tidak Hadir</span>
                <div style={{ fontSize: 24, fontWeight: 600, color: 'var(--pink-dusty)', marginTop: 4 }}>{activityItems.filter(i => i.isDeclined).length}</div>
              </div>
            </div>

            {rsvpsLoading ? (
              <p style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>Memuat data RSVP...</p>
            ) : activityItems.length === 0 ? (
              <div className="empty-state" style={{ padding: '40px 0', textAlign: 'center' }}>
                <p className="serif-italic" style={{ color: 'var(--text-light)' }}>Belum ada tamu yang mengisi RSVP ini.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 600 }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nama Tamu</th>
                      <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Kehadiran</th>
                      <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Waktu</th>
                      <th style={{ padding: '12px 16px', width: 40 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {activityItems.filter(item => item.isAttending || item.isDeclined).map((item, idx) => (
                      <tr key={item.id} style={{ borderBottom: '1px solid var(--border)', background: idx % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.01)' }}>
                        <td style={{ padding: '16px', fontWeight: 500 }}>{item.name || 'Hamba Allah'}</td>
                        <td style={{ padding: '16px' }}>
                          <span style={{ 
                            display: 'inline-block', padding: '4px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600,
                            background: item.isAttending ? 'rgba(86,95,52,0.1)' : item.isDeclined ? 'rgba(208,156,167,0.1)' : 'rgba(0,0,0,0.05)',
                            color: item.isAttending ? 'var(--olive)' : item.isDeclined ? 'var(--pink-dusty)' : 'var(--text-muted)'
                          }}>
                            {item.isAttending ? 'Hadir' : item.isDeclined ? 'Tidak Hadir' : 'Wishes Only'}
                          </span>
                        </td>
                        <td style={{ padding: '16px', fontSize: 12, color: 'var(--text-muted)' }}>{item.time}</td>
                        <td style={{ padding: '16px', textAlign: 'right' }}>
                          <button 
                            className="btn-icon-only" 
                            style={{ color: 'var(--pink-dusty)', opacity: 0.5 }}
                            onClick={async () => { 
                              if(confirm('Hapus RSVP ini?')) {
                                const success = await deleteRsvp(item.id);
                                if (success) fetchAllRsvps(selectedInv.id);
                              }
                            }}
                            title="Hapus"
                          >
                            <HiOutlineTrash size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : activeTab === 'wishes' ? (
        /* ----- WISHES TAB ----- */
        <div className="wishes-tab animate-fade-in-up">
          <div className="card" style={{ padding: 24 }}>
            <div style={{ marginBottom: 24 }}>
              <h3 className="serif-italic" style={{ fontSize: '1.4rem', color: 'var(--olive)', marginBottom: 4 }}>Ucapan & Doa</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Kumpulan pesan manis dari para tamu undangan.</p>
            </div>

            {rsvpsLoading ? (
              <p style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>Memuat ucapan...</p>
            ) : activityItems.filter(item => item.message).length === 0 ? (
              <div className="empty-state" style={{ padding: '40px 0', textAlign: 'center' }}>
                <p className="serif-italic" style={{ color: 'var(--text-light)' }}>Belum ada ucapan dari tamu.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
                {activityItems.filter(item => item.message).map((item) => (
                  <div key={item.id} className="card wish-card" style={{ padding: 20, boxShadow: '0 4px 12px rgba(0,0,0,0.03)', border: '1px solid var(--border)', position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--olive)' }} />
                        <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--olive)' }}>{item.name}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ fontSize: 10, color: 'var(--text-light)' }}>{item.time}</span>
                        <button 
                          className="btn-icon-only" 
                          style={{ color: 'var(--pink-dusty)', opacity: 0.5 }}
                          onClick={async () => { 
                            if(confirm('Hapus ucapan ini?')) {
                              const success = await deleteRsvp(item.id);
                              if (success) fetchAllRsvps(selectedInv.id);
                            }
                          }} 
                        >
                          <HiOutlineTrash size={14} />
                        </button>
                      </div>
                    </div>
                    <p style={{ margin: 0, fontSize: 13, color: 'var(--text-dark)', fontStyle: 'italic', lineHeight: 1.6, position: 'relative' }}>
                      <span style={{ fontSize: 24, position: 'absolute', top: -10, left: -10, opacity: 0.1, color: 'var(--olive)' }}>“</span>
                      {item.message}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : activeTab === 'guests' ? (
        <GuestListTab invitation={selectedInv} />
      ) : null}

      {/* Preset Modal */}
      {showPresetModal && (
        <PresetModal
          onClose={() => setShowPresetModal(false)}
          onSelect={handlePresetSelect}
        />
      )}
    </div>
  )
}

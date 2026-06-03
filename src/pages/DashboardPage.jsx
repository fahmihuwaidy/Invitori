import { useMemo, useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useInvitations } from '../contexts/InvitationContext'
import { PRESET_LIST } from '../utils/presets'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts'
import { HiOutlinePlus, HiOutlinePencil, HiOutlineExternalLink, HiOutlineTrash, HiOutlineEye, HiOutlineUserGroup, HiOutlineMail, HiOutlineCheck, HiOutlineX, HiX, HiSelector, HiOutlineLink, HiOutlineDocumentDuplicate, HiOutlineCog } from 'react-icons/hi'
import './DashboardPage.css'



/* ---- Preset Selection Modal ---- */
function PresetModal({ onClose, onSelect }) {
  const [step, setStep] = useState('choose') // 'choose' or 'title'
  const [selectedPreset, setSelectedPreset] = useState(null)
  const [title, setTitle] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const handlePresetClick = (preset) => {
    setSelectedPreset(preset)
    setTitle(preset.key === 'wedding' ? 'Wedding Invitation' : preset.key === 'birthday' ? 'Birthday Invitation' : preset.key === 'aqiqah' ? 'Aqiqah Invitation' : 'My Invitation')
    setStep('title')
  }

  const handleCreate = async () => {
    if (!title.trim() || isCreating) return
    setIsCreating(true)
    try {
      await onSelect(selectedPreset.key, title.trim())
    } catch (err) {
      console.error(err)
      alert('Failed to create invitation. Please try again.')
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
              <h2 className="serif-italic">Choose Template</h2>
              <p>Select an invitation category to start with a matching template.</p>
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
                      <span>{preset.blocks.length} blocks</span>
                    ) : (
                      <span>Empty canvas</span>
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
              {!isCreating && <button className="preset-back-btn" onClick={() => setStep('choose')}>← Back</button>}
              <div className="preset-chosen-badge" style={{ background: `${selectedPreset.color}15`, color: selectedPreset.color }}>
                <span>{selectedPreset.icon}</span> {selectedPreset.label}
              </div>
              <h2 className="serif-italic" style={{ marginTop: 12 }}>Name Your Invitation</h2>
              <p>Enter a title for your invitation. You can change this later.</p>
            </div>
            <div className="preset-title-form">
              <input
                type="text"
                className="preset-title-input"
                value={title}
                onChange={e => setTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                placeholder="e.g.: Oliver & Sophia's Wedding"
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
                    Creating...
                  </>
                ) : (
                  <>
                    <HiOutlinePlus size={16} /> Create Invitation
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

function GuestListTab({ invitation, guests, setGuests, loading }) {
  const [newName, setNewName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [adding, setAdding] = useState(false)
  const [copiedId, setCopiedId] = useState(null)
  
  // Google Spreadsheet Import states
  const [addMethod, setAddMethod] = useState('manual') // 'manual' or 'sheet'
  const [sheetUrl, setSheetUrl] = useState('')
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState('')
  const [importSuccess, setImportSuccess] = useState('')

  const baseUrl = `${window.location.origin}/undangan/${invitation?.slug || ''}`

  const handleAdd = async () => {
    if (!newName.trim() || !invitation?.id) return
    setAdding(true)
    const { data, error } = await supabase
      .from('guests')
      .insert({ invitation_id: invitation.id, name: newName.trim(), phone: newPhone.trim() || null })
      .select()
      .single()
    if (error) {
      console.error('Error adding guest:', error)
      alert('Gagal menambahkan tamu: ' + error.message)
    } else if (data) {
      setGuests(prev => [...prev, data])
      setNewName('')
      setNewPhone('')
    }
    setAdding(false)
  }

  // Parse CSV format supporting quoted fields with newlines/commas
  const parseCSV = (text) => {
    const lines = []
    let row = ['']
    let inQuotes = false

    for (let i = 0; i < text.length; i++) {
      const c = text[i]
      const next = text[i + 1]
      if (c === '"') {
        if (inQuotes && next === '"') {
          row[row.length - 1] += '"'
          i++
        } else {
          inQuotes = !inQuotes
        }
      } else if (c === ',' && !inQuotes) {
        row.push('')
      } else if ((c === '\r' || c === '\n') && !inQuotes) {
        if (c === '\r' && next === '\n') {
          i++
        }
        lines.push(row)
        row = ['']
      } else {
        row[row.length - 1] += c
      }
    }
    if (row.length > 1 || row[0] !== '') {
      lines.push(row)
    }
    return lines
  }

  const handleImportSheet = async () => {
    if (!sheetUrl.trim() || !invitation?.id) return
    setImporting(true)
    setImportError('')
    setImportSuccess('')

    try {
      const idMatch = sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/)
      if (!idMatch) {
        throw new Error('Link Google Spreadsheet tidak valid. Pastikan link berisi ID spreadsheet.')
      }
      const spreadsheetId = idMatch[1]
      const gidMatch = sheetUrl.match(/gid=([0-9]+)/)
      const gid = gidMatch ? gidMatch[1] : '0'

      const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&gid=${gid}`
      const response = await fetch(csvUrl)
      
      if (!response.ok) {
        throw new Error('Gagal mengakses Spreadsheet. Pastikan akses diatur ke "Siapa saja yang memiliki link dapat melihat" (Anyone with link can view).')
      }

      const text = await response.text()
      if (!text.trim()) {
        throw new Error('Spreadsheet kosong atau tidak dapat dibaca.')
      }

      const rows = parseCSV(text)
      if (rows.length < 2) {
        throw new Error('Data tidak cukup. Butuh minimal baris header dan satu baris data.')
      }

      const headerRow = rows[0].map(h => h.toLowerCase().trim())
      
      let nameIdx = headerRow.findIndex(h => h.includes('nama') || h.includes('name') || h.includes('tamu') || h.includes('guest') || h.includes('lengkap'))
      let phoneIdx = headerRow.findIndex(h => h.includes('phone') || h.includes('hp') || h.includes('telp') || h.includes('telepon') || h.includes('wa') || h.includes('whatsapp') || h.includes('kontak') || h.includes('contact'))

      if (nameIdx === -1) {
        nameIdx = 0
      }
      if (phoneIdx === -1 && headerRow.length > 1) {
        phoneIdx = nameIdx === 0 ? 1 : 0
      }

      const guestsToInsert = []
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i]
        const nameVal = row[nameIdx] ? row[nameIdx].trim() : ''
        let phoneVal = ''
        if (phoneIdx !== -1 && phoneIdx < row.length && row[phoneIdx]) {
          phoneVal = row[phoneIdx].trim()
        }

        if (nameVal) {
          guestsToInsert.push({
            invitation_id: invitation.id,
            name: nameVal,
            phone: phoneVal || null
          })
        }
      }

      if (guestsToInsert.length === 0) {
        throw new Error('Tidak ditemukan nama tamu untuk diimpor.')
      }

      const { data, error } = await supabase
        .from('guests')
        .insert(guestsToInsert)
        .select()

      if (error) throw error

      if (data) {
        setGuests(prev => [...prev, ...data])
        setImportSuccess(`Berhasil mengimpor ${data.length} tamu!`)
        setSheetUrl('')
      }
    } catch (err) {
      console.error(err)
      setImportError(err.message || 'Terjadi kesalahan saat mengimpor data.')
    } finally {
      setImporting(false)
    }
  }

  const handleDelete = async (guestId) => {
    if (!confirm('Delete this guest?')) return
    const { error } = await supabase.from('guests').delete().eq('id', guestId)
    if (error) {
      console.error('Error deleting guest:', error)
      alert('Gagal menghapus tamu: ' + error.message)
    } else {
      setGuests(prev => prev.filter(g => g.id !== guestId))
    }
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
          <h3 className="serif-italic" style={{ fontSize: '1.5rem', color: 'var(--olive)', marginBottom: 4 }}>Guest List & Links</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Manage your guest list and get their personalized invitation links.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div className="stat-badge" style={{ background: 'rgba(86,95,52,0.1)', color: 'var(--olive)', padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
            {guests.length} Guests
          </div>
          <button 
            className="btn btn-outline btn-sm"
            onClick={() => {
              const csv = [
                ['Name', 'Phone', 'Invitation Link'].join(','),
                ...guests.map(g => [g.name, g.phone || '-', getLink(g.name)].join(','))
              ].join('\n');
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `GuestList_${invitation?.title || 'Invitation'}.csv`;
              a.click();
            }}
            disabled={guests.length === 0}
          >
            Export CSV
          </button>
        </div>
      </div>

      <div style={{ padding: '24px', background: 'rgba(86,95,52,0.03)', border: '1px solid rgba(86,95,52,0.1)', borderRadius: 16, marginBottom: 32 }}>
        <div style={{ display: 'flex', gap: 16, borderBottom: '1px solid rgba(86,95,52,0.1)', marginBottom: 20, paddingBottom: 8 }}>
          <button 
            onClick={() => setAddMethod('manual')} 
            style={{ 
              background: 'none', border: 'none', padding: '0 0 4px 0', fontSize: 12, 
              fontWeight: 600, 
              color: addMethod === 'manual' ? 'var(--olive)' : 'var(--text-muted)', 
              borderBottom: addMethod === 'manual' ? '2.5px solid var(--olive)' : '2.5px solid transparent', 
              cursor: 'pointer', letterSpacing: 0.5 
            }}
          >
            INPUT MANUAL
          </button>
          <button 
            onClick={() => setAddMethod('sheet')} 
            style={{ 
              background: 'none', border: 'none', padding: '0 0 4px 0', fontSize: 12, 
              fontWeight: 600, 
              color: addMethod === 'sheet' ? 'var(--olive)' : 'var(--text-muted)', 
              borderBottom: addMethod === 'sheet' ? '2.5px solid var(--olive)' : '2.5px solid transparent', 
              cursor: 'pointer', letterSpacing: 0.5 
            }}
          >
            GOOGLE SPREADSHEET
          </button>
        </div>

        {addMethod === 'manual' ? (
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: '2 1 240px' }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-dark)', display: 'block', marginBottom: 6 }}>Guest Full Name *</label>
              <input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
                placeholder="e.g.: Mr. John Doe & Family"
                className="settings-input"
                style={{ width: '100%', background: 'white' }}
              />
            </div>
            <div style={{ flex: '1 1 180px' }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-dark)', display: 'block', marginBottom: 6 }}>Phone Number (optional)</label>
              <input
                value={newPhone}
                onChange={e => setNewPhone(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
                placeholder="e.g.: 08123456..."
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
              {adding ? '...' : 'Add'}
            </button>
          </div>
        ) : (
          <div style={{ width: '100%' }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-dark)', display: 'block', marginBottom: 6 }}>Link Google Spreadsheet</label>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <input
                value={sheetUrl}
                onChange={e => setSheetUrl(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleImportSheet()}
                placeholder="https://docs.google.com/spreadsheets/d/.../edit?usp=sharing"
                className="settings-input"
                style={{ flex: 1, minWidth: 280, background: 'white' }}
              />
              <button
                onClick={handleImportSheet}
                disabled={importing || !sheetUrl.trim()}
                className="btn btn-primary"
                style={{ padding: '0 24px', height: 44 }}
              >
                {importing ? 'Importing...' : 'Import'}
              </button>
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.5 }}>
              💡 <strong>Penting:</strong> Pastikan spreadsheet Anda diatur agar <strong>"Siapa saja yang memiliki link dapat melihat"</strong> (Anyone with link can view). Kolom pertama akan dideteksi sebagai Nama Tamu, dan kolom nomor telepon (jika ada) akan otomatis terdeteksi jika memiliki header "HP", "Phone", atau sejenisnya.
            </p>
            {importError && (
              <div style={{ marginTop: 12, padding: '8px 12px', background: 'rgba(208,156,167,0.1)', color: 'var(--pink-dusty)', borderRadius: 8, fontSize: 12, border: '1px solid rgba(208,156,167,0.2)' }}>
                ⚠️ {importError}
              </div>
            )}
            {importSuccess && (
              <div style={{ marginTop: 12, padding: '8px 12px', background: 'rgba(86,95,52,0.1)', color: 'var(--olive)', borderRadius: 8, fontSize: 12, border: '1px solid rgba(86,95,52,0.2)' }}>
                ✅ {importSuccess}
              </div>
            )}
          </div>
        )}
      </div>

      <div>
        {loading ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0', fontSize: 14 }}>Loading guest list...</p>
        ) : guests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', background: 'var(--white)', borderRadius: 12, border: '1px dashed var(--border)' }}>
            <HiOutlineUserGroup size={40} color="var(--text-light)" style={{ marginBottom: 16, opacity: 0.5 }} />
            <p className="serif-italic" style={{ color: 'var(--text-muted)', fontSize: 16 }}>No guests added yet</p>
            <p style={{ color: 'var(--text-light)', fontSize: 12, marginTop: 4 }}>Use the form above to start adding guests.</p>
          </div>
        ) : (
          <div style={{ border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', background: 'white' }}>
            <div style={{ display: 'flex', padding: '12px 20px', background: '#f8f8f6', borderBottom: '1px solid var(--border)', fontSize: 11, fontWeight: 600, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: 1 }}>
              <div style={{ flex: 1 }}>Guest Information</div>
              <div style={{ width: 140, textAlign: 'right' }}>Actions</div>
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
                  <button onClick={() => window.open(getLink(g.name), '_blank')} className="btn btn-outline btn-sm" style={{ padding: '8px 14px' }} title="Open Invitation">
                    <HiOutlineExternalLink size={16} />
                  </button>
                  <button onClick={() => copyLink(g)} className="btn btn-outline btn-sm" style={{ padding: '8px 14px', minWidth: 44 }} title="Copy Link">
                    {copiedId === g.id ? <HiOutlineCheck size={16} color="var(--olive)"/> : <HiOutlineDocumentDuplicate size={16} />}
                  </button>
                  <button onClick={() => handleDelete(g.id)} className="btn btn-ghost btn-sm" style={{ padding: '8px 14px', color: 'var(--pink-dusty)' }} title="Delete">
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
  const { invitations, loading, deleteInvitation, addInvitation, deleteRsvp } = useInvitations()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const [showPresetModal, setShowPresetModal] = useState(false)
  const [selectedInvId, setSelectedInvId] = useState(searchParams.get('inv') || '')
  const [allRsvps, setAllRsvps] = useState([])
  const [rsvpsLoading, setRsvpsLoading] = useState(false)
  const [allGuests, setAllGuests] = useState([])
  const [guestsLoading, setGuestsLoading] = useState(false)

  const rawTab = searchParams.get('tab') || 'overview'
  const activeTab = rawTab

  // Keep selectedInvId in sync with the search params and invitation list changes (e.g. deletions)
  useEffect(() => {
    if (invitations.length === 0) {
      if (selectedInvId !== '') setSelectedInvId('')
      return
    }
    const paramInvId = searchParams.get('inv')
    const isValidId = invitations.some(i => i.id === paramInvId)
    if (paramInvId && isValidId) {
      if (paramInvId !== selectedInvId) {
        setSelectedInvId(paramInvId)
      }
    } else {
      const defaultId = invitations[0].id
      setSelectedInvId(defaultId)
      const params = new URLSearchParams(searchParams)
      params.set('inv', defaultId)
      setSearchParams(params, { replace: true })
    }
  }, [invitations, searchParams, selectedInvId, setSearchParams])

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

  // ---- Fetch ALL RSVPs for selected invitation ----
  const fetchAllRsvps = useCallback(async (invId) => {
    if (!invId) return
    setRsvpsLoading(true)
    setAllRsvps([]) // Clear previous RSVPs to avoid showing stale data
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

  const fetchAllGuests = useCallback(async (invId) => {
    if (!invId) return
    setGuestsLoading(true)
    setAllGuests([]) // Clear previous guests
    try {
      const { data, error } = await supabase
        .from('guests')
        .select('*')
        .eq('invitation_id', invId)
        .order('created_at', { ascending: true })
      
      if (error) throw error
      setAllGuests(data || [])
    } catch (err) {
      console.error('Error fetching guests:', err)
    } finally {
      setGuestsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (selectedInv?.id) {
      fetchAllRsvps(selectedInv.id)
      fetchAllGuests(selectedInv.id)
    }
  }, [selectedInv?.id, fetchAllRsvps, fetchAllGuests])

  // ---- Computed Stats from REAL data (filtered by selected invitation) ----
  const totalViews = useMemo(() => selectedInv?.analytics?.totalViews || 0, [selectedInv])
  const totalRsvps = useMemo(() => selectedInv?.analytics?.rsvpCount || 0, [selectedInv])

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
            timeStr = date.toLocaleDateString('en-US', {day: 'numeric', month: 'short'}) + ' ' + 
                      date.toLocaleTimeString('en-US', {hour:'2-digit', minute:'2-digit'})
          }
        } catch {
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
            <strong>{rsvp.name || 'Guest'}</strong>{' '}
            {isAttending ? 'is attending' : isDeclined ? 'is not attending' : 'sent a message'}
            {rsvp.message && <span className="activity-message">— "{rsvp.message}"</span>}
          </>
        ),
      }
    })
  }, [allRsvps])

  const handleDelete = async (id) => {
    if (confirm('Delete this invitation?')) {
      const success = await deleteInvitation(id)
      if (success) {
        // If we deleted the currently selected invitation, reset or select the first remaining one
        if (selectedInvId === id) {
          const remaining = invitations.filter(inv => inv.id !== id)
          const nextId = remaining.length > 0 ? remaining[0].id : ''
          setSelectedInvId(nextId)
          const params = new URLSearchParams(searchParams)
          if (nextId) {
            params.set('inv', nextId)
          } else {
            params.delete('inv')
          }
          setSearchParams(params, { replace: true })
        }
      }
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

  if (loading && invitations.length === 0) {
    return (
      <div className="dashboard animate-fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p className="serif-italic" style={{ color: 'var(--olive)', marginTop: 16 }}>Loading your project...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard animate-fade-in">
      {/* Welcome & Invitation Selector */}
      <div className="dash-header" style={{ alignItems: 'flex-start' }}>
        <div className="dash-header-left">
          <h1 className="serif-italic dash-welcome">Welcome, {user?.name || 'Member'}</h1>
          <p className="dash-subtitle">Manage your digital invitations here.</p>
        </div>
        <div className="dash-profile" style={{ flexWrap: 'wrap', gap: 16, alignItems: 'flex-end' }}>
          {invitations.length > 0 && selectedInv && (
            <div className="dash-inv-selector-wrapper" style={{ minWidth: 240 }}>
              <span className="label-caps" style={{ fontSize: 10, display: 'block', marginBottom: 6, color: 'var(--olive)', fontWeight: 600 }}>Select Invitation</span>
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
            <HiOutlinePlus size={18} /> Create New
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
          <h2 className="serif-italic" style={{ fontSize: '1.5rem', marginBottom: 8 }}>No Invitations Yet</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>Start by creating your first invitation now.</p>
          <button className="btn btn-primary" onClick={() => setShowPresetModal(true)}>Create New Invitation</button>
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
              <span className="stat-detail">{responseRate > 0 ? `${responseRate}% response rate` : 'No responses yet'}</span>
            </div>
            <div className="stat-card">
              <span className="label-caps"><HiOutlineCheck size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />Status</span>
              <div className="stat-value" style={{ fontSize: '1.5rem' }}>{selectedInv.status === 'published' ? 'Live' : 'Draft'}</div>
              <span className="stat-badge">{selectedInv.status === 'published' ? 'Ready to Send' : 'Not Published'}</span>
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
                    <p className="serif-italic" style={{ color: 'var(--text-muted)', fontSize: 14 }}>No data yet</p>
                  </div>
                )}
              </div>
            </div>

            <div className="card activity-card">
              <h4 className="serif-italic" style={{ marginBottom: 20 }}>Recent Guests</h4>
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
                    <p className="serif-italic" style={{ color: 'var(--text-muted)', fontSize: 13 }}>No RSVPs yet</p>
                  </div>
                )}
              </div>
              {activityItems.length > 5 && (
                <button className="btn btn-ghost btn-sm" style={{ width: '100%', marginTop: 12 }} onClick={() => setTab('rsvps')}>View All RSVPs</button>
              )}
            </div>
          </div>

          <div className="dash-projects" style={{ marginTop: 40 }}>
            <div className="projects-header">
              <h2 className="serif-italic" style={{ fontSize: '1.4rem' }}>Actions for this invitation</h2>
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
                      <HiOutlineExternalLink size={14} /> View Site
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
                <h3 className="serif-italic" style={{ fontSize: '1.5rem', color: 'var(--olive)', marginBottom: 4 }}>Attendance Confirmation</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>See who is coming to your event.</p>
              </div>
              <button 
                className="btn btn-outline btn-sm" 
                onClick={() => {
                  const csv = [
                    ['Name', 'Attendance', 'Sent At'].join(','),
                    ...activityItems.filter(i => i.isAttending || i.isDeclined).map(i => [i.name, i.isAttending ? 'Attending' : 'Not Attending', i.time].join(','))
                  ].join('\n');
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `RSVP_${selectedInv?.title || 'Invitation'}.csv`;
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
                <span style={{ fontSize: 11, color: 'var(--olive)', textTransform: 'uppercase', letterSpacing: 1 }}>Attending</span>
                <div style={{ fontSize: 24, fontWeight: 600, color: 'var(--olive)', marginTop: 4 }}>{activityItems.filter(i => i.isAttending).length}</div>
              </div>
              <div className="stat-card" style={{ padding: '16px 20px', background: 'rgba(208,156,167,0.05)', border: '1px solid rgba(208,156,167,0.1)', borderRadius: 12 }}>
                <span style={{ fontSize: 11, color: 'var(--pink-dusty)', textTransform: 'uppercase', letterSpacing: 1 }}>Not Attending</span>
                <div style={{ fontSize: 24, fontWeight: 600, color: 'var(--pink-dusty)', marginTop: 4 }}>{activityItems.filter(i => i.isDeclined).length}</div>
              </div>
            </div>

            {rsvpsLoading ? (
              <p style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>Loading RSVP data...</p>
            ) : activityItems.length === 0 ? (
              <div className="empty-state" style={{ padding: '40px 0', textAlign: 'center' }}>
                <p className="serif-italic" style={{ color: 'var(--text-light)' }}>No guests have filled out this RSVP yet.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 600 }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Guest Name</th>
                      <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Attendance</th>
                      <th style={{ padding: '12px 16px', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Time</th>
                      <th style={{ padding: '12px 16px', width: 40 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {activityItems.filter(item => item.isAttending || item.isDeclined).map((item, idx) => (
                      <tr key={item.id} style={{ borderBottom: '1px solid var(--border)', background: idx % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.01)' }}>
                        <td style={{ padding: '16px', fontWeight: 500 }}>{item.name || 'Anonymous'}</td>
                        <td style={{ padding: '16px' }}>
                          <span style={{ 
                            display: 'inline-block', padding: '4px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600,
                            background: item.isAttending ? 'rgba(86,95,52,0.1)' : item.isDeclined ? 'rgba(208,156,167,0.1)' : 'rgba(0,0,0,0.05)',
                            color: item.isAttending ? 'var(--olive)' : item.isDeclined ? 'var(--pink-dusty)' : 'var(--text-muted)'
                          }}>
                            {item.isAttending ? 'Attending' : item.isDeclined ? 'Not Attending' : 'Wishes Only'}
                          </span>
                        </td>
                        <td style={{ padding: '16px', fontSize: 12, color: 'var(--text-muted)' }}>{item.time}</td>
                        <td style={{ padding: '16px', textAlign: 'right' }}>
                          <button 
                            className="btn-icon-only" 
                            style={{ color: 'var(--pink-dusty)', opacity: 0.5 }}
                            onClick={async () => { 
                              if(confirm('Delete this RSVP?')) {
                                const success = await deleteRsvp(item.id);
                                if (success) {
                                  setAllRsvps(prev => prev.filter(r => r.id !== item.id));
                                }
                              }
                            }}
                            title="Delete"
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
              <h3 className="serif-italic" style={{ fontSize: '1.4rem', color: 'var(--olive)', marginBottom: 4 }}>Wishes & Prayers</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>A collection of sweet messages from your guests.</p>
            </div>

            {rsvpsLoading ? (
              <p style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>Memuat ucapan...</p>
            ) : activityItems.filter(item => item.message).length === 0 ? (
              <div className="empty-state" style={{ padding: '40px 0', textAlign: 'center' }}>
                <p className="serif-italic" style={{ color: 'var(--text-light)' }}>No wishes from guests yet.</p>
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
                            if(confirm('Delete this wish?')) {
                              const success = await deleteRsvp(item.id);
                              if (success) {
                                setAllRsvps(prev => prev.filter(r => r.id !== item.id));
                              }
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
        <GuestListTab 
          invitation={selectedInv} 
          guests={allGuests} 
          setGuests={setAllGuests} 
          loading={guestsLoading} 
        />
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

import { useMemo, useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useInvitations } from '../contexts/InvitationContext'
import { PRESET_LIST, PRESETS, THEME_PALETTES } from '../utils/presets'
import { generateQrDataUrl, downloadQrPng } from '../utils/qr'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell
} from 'recharts'
import {
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineExternalLink,
  HiOutlineTrash,
  HiOutlineEye,
  HiOutlineEyeOff,
  HiOutlineUserGroup,
  HiOutlineMail,
  HiOutlineCheck,
  HiOutlineX,
  HiX,
  HiSelector,
  HiOutlineLink,
  HiOutlineDocumentDuplicate,
  HiOutlineCog,
  HiOutlineHeart,
  HiOutlineViewGrid,
  HiOutlineChatAlt2,
  HiOutlineQrcode,
  HiOutlineDesktopComputer,
  HiOutlineSearch,
  HiOutlineFilter,
  HiOutlineDownload,
  HiOutlineBadgeCheck,
  HiOutlinePrinter,
  HiOutlineSparkles,
  HiOutlineClipboardCopy,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineTicket,
  HiOutlineSwitchHorizontal,
} from 'react-icons/hi'
import './DashboardPage.css'

/* =========================================================================
   WHATSAPP TEMPLATES & VARIABLE CHIPS
   ========================================================================= */

const WA_TEMPLATES = {
  english: {
    label: 'Modern English',
    text: `Dear *{nama}*,\n\nTogether with our families, we joyfully invite you to celebrate our special day:\n\n*{judul}*\n\n{sesi}\nTable: {meja}\nReserved: {pax} Pax\n\nKindly view your personalized digital invitation and digital QR entry pass via the link below:\n{link}\n\nWe look forward to celebrating this memorable moment with you.\n\nWarm regards,\n*{judul}*`,
  },
  formal: {
    label: 'Formal & Elegant',
    text: `Kepada Yth. *{nama}*,\n\nTanpa mengurangi rasa hormat, perkenankan kami mengundang Bapak/Ibu/Saudara/i untuk hadir pada acara kami:\n\n*{judul}*\n\n{sesi}\nMeja: {meja}\nAlokasi: {pax} Tamu\n\nInformasi lengkap serta QR Pass Kehadiran dapat diakses melalui tautan undangan berikut:\n{link}\n\nMerupakan suatu kehormatan dan kebahagiaan bagi kami atas kehadiran dan doa restu Bapak/Ibu/Saudara/i.\n\nSalam hangat,\n*{judul}*`,
  },
  islami: {
    label: 'Islamic Blessing',
    text: `Assalamu'alaikum Warahmatullahi Wabarakatuh.\n\nKepada Yth. *{nama}*,\n\nDengan memohon rahmat dan ridho Allah SWT, kami bermaksud mengundang Bapak/Ibu/Saudara/i untuk menghadiri acara kami:\n\n*{judul}*\n\nDetail acara, meja (*{meja}*), serta QR Pass dapat dibuka melalui tautan berikut:\n{link}\n\nKehadiran serta doa restu Bapak/Ibu/Saudara/i merupakan berkah terindah bagi kami.\n\nWassalamu'alaikum Warahmatullahi Wabarakatuh.`,
  },
  casual: {
    label: 'Warm & Friendly',
    text: `Hi *{nama}*! ✨\n\nWe are excited to celebrate our special day and would love for you to join us:\n\n*{judul}*\n\nWe have reserved {pax} pax for you ({meja}). Check out the itinerary, location, and get your digital QR Pass here:\n{link}\n\nCan't wait to see you there! 🤍`,
  },
}

const VARIABLE_CHIPS = [
  { token: '{nama}', label: 'Guest Name', desc: 'e.g. John Doe' },
  { token: '{judul}', label: 'Event Title', desc: 'e.g. Sarah & Dimas' },
  { token: '{link}', label: 'Personal Link', desc: 'URL with pass token' },
  { token: '{sesi}', label: 'Session / Time', desc: 'e.g. Session 1' },
  { token: '{meja}', label: 'Table Name', desc: 'e.g. Table 04' },
  { token: '{pax}', label: 'Pax Count', desc: 'e.g. 2' },
]

function buildWaMessage(template, guest, invitation, baseUrl) {
  const link = `${baseUrl}?to=${encodeURIComponent(guest?.name || '')}${guest?.passToken ? `&pass=${encodeURIComponent(guest.passToken)}` : ''}`
  const invTitle = invitation?.title || 'Our Special Celebration'
  const session = guest?.tableName ? `Session / Table: ${guest.tableName}` : 'General Session'
  const table = guest?.tableName || 'Open Seating'
  const pax = String(guest?.maxPax || 2)

  return (template || WA_TEMPLATES.english.text)
    .replace(/\{nama\}/g, guest?.name || 'Guest')
    .replace(/\{judul\}/g, invTitle)
    .replace(/\{link\}/g, link)
    .replace(/\{sesi\}/g, session)
    .replace(/\{meja\}/g, table)
    .replace(/\{pax\}/g, pax)
}

/* =========================================================================
   MODAL 1: CREATE INVITATION
   ========================================================================= */

function CreateInvitationModal({ onClose, onSelect }) {
  const [title, setTitle] = useState('')
  const [selectedPreset, setSelectedPreset] = useState('wedding')
  const [paletteMode, setPaletteMode] = useState('preset')
  const [selectedPaletteKey, setSelectedPaletteKey] = useState('atelier')
  const [customColors, setCustomColors] = useState({
    primaryColor: '#344c2d',
    backgroundColor: '#f4efea',
    accentColor: '#c4a882',
  })
  const [isCreating, setIsCreating] = useState(false)

  const handleSelectPreset = (key) => {
    setSelectedPreset(key)
    if (paletteMode === 'preset') {
      if (key === 'wedding') setSelectedPaletteKey('atelier')
      else if (key === 'birthday') setSelectedPaletteKey('festive-sky')
      else if (key === 'aqiqah') setSelectedPaletteKey('baby-sage')
      else setSelectedPaletteKey('atelier')
    }
  }

  const getActivePalette = () => {
    if (paletteMode === 'custom') {
      return {
        ...customColors,
        envelopeColor: customColors.primaryColor,
        paperColor: customColors.backgroundColor,
      }
    }
    const found = THEME_PALETTES.find(p => p.key === selectedPaletteKey)
    return found || THEME_PALETTES[0]
  }

  const activePalette = getActivePalette()

  const handleCreate = async () => {
    if (!title.trim() || isCreating) return
    setIsCreating(true)
    try {
      await onSelect(title.trim(), selectedPreset, activePalette)
    } catch (err) {
      console.error(err)
      alert('Failed to create invitation. Please check your connection and try again.')
      setIsCreating(false)
    }
  }

  const placeholderText = {
    wedding: 'e.g. Elena & Julian',
    birthday: "e.g. Maya's 25th Birthday",
    aqiqah: "e.g. Rayyan's Aqiqah Celebration",
    custom: 'e.g. Annual Gala 2026',
  }[selectedPreset] || 'e.g. Elena & Julian'

  return (
    <div className="preset-modal-overlay" onClick={isCreating ? null : onClose}>
      <div className="preset-modal" style={{ maxWidth: 740, maxHeight: '92vh' }} onClick={e => e.stopPropagation()}>
        {!isCreating && (
          <button className="preset-modal-close" onClick={onClose} aria-label="Close dialog">
            <HiX size={20} />
          </button>
        )}

        <div className="preset-modal-header" style={{ marginBottom: 20 }}>
          <h2 className="serif-italic" style={{ fontSize: '1.65rem' }}>Create New Invitation</h2>
          <p>Select your event category, fine-tune the palette, and start designing your digital experience.</p>
        </div>

        <div className="preset-title-form" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* STEP 1: CATEGORY */}
          <div className="modal-step-section">
            <div className="modal-step-header">
              <span className="modal-step-number">1</span>
              <div>
                <label className="modal-step-label">Select Event Category</label>
                <span className="modal-step-desc">Tailored blocks and layouts curated for each event style</span>
              </div>
            </div>

            <div className="preset-cards-grid functional-grid">
              {PRESET_LIST.map(preset => {
                const isSelected = selectedPreset === preset.key
                return (
                  <button
                    type="button"
                    key={preset.key}
                    onClick={() => handleSelectPreset(preset.key)}
                    disabled={isCreating}
                    className={`preset-choice-card ${isSelected ? 'selected' : ''}`}
                  >
                    <div className="preset-choice-top">
                      <span className="preset-choice-icon">{preset.icon}</span>
                      {preset.badge && <span className="preset-choice-badge">{preset.badge}</span>}
                    </div>
                    <div className="preset-choice-title">{preset.label}</div>
                    <p className="preset-choice-desc">{preset.description}</p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* STEP 2: PALETTE */}
          <div className="modal-step-section">
            <div className="modal-step-header">
              <span className="modal-step-number">2</span>
              <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <label className="modal-step-label">Theme & Color Palette</label>
                  <span className="modal-step-desc">Choose from our signature atelier palettes or customize your own</span>
                </div>
                <div className="palette-mode-toggle">
                  <button
                    type="button"
                    className={`mode-btn ${paletteMode === 'preset' ? 'active' : ''}`}
                    onClick={() => setPaletteMode('preset')}
                  >
                    Curated
                  </button>
                  <button
                    type="button"
                    className={`mode-btn ${paletteMode === 'custom' ? 'active' : ''}`}
                    onClick={() => setPaletteMode('custom')}
                  >
                    Custom Colors
                  </button>
                </div>
              </div>
            </div>

            {paletteMode === 'preset' ? (
              <div className="palette-swatches-grid">
                {THEME_PALETTES.map(p => {
                  const isSelected = selectedPaletteKey === p.key
                  return (
                    <button
                      type="button"
                      key={p.key}
                      onClick={() => setSelectedPaletteKey(p.key)}
                      className={`palette-swatch-card ${isSelected ? 'selected' : ''}`}
                    >
                      <div className="palette-swatch-dots">
                        <span style={{ backgroundColor: p.primaryColor }} title="Primary Color" />
                        <span style={{ backgroundColor: p.backgroundColor, border: '1px solid rgba(0,0,0,0.1)' }} title="Background Canvas" />
                        <span style={{ backgroundColor: p.accentColor }} title="Accent Hue" />
                      </div>
                      <div className="palette-swatch-info">
                        <span className="palette-swatch-name">{p.name}</span>
                        {p.subtitle && <span className="palette-swatch-sub">{p.subtitle}</span>}
                      </div>
                      {isSelected && <span className="palette-swatch-check">✓</span>}
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="palette-custom-panel">
                <div className="palette-custom-inputs">
                  <div className="color-field">
                    <label>Primary Text & Buttons</label>
                    <div className="color-input-wrapper">
                      <input
                        type="color"
                        value={customColors.primaryColor}
                        onChange={e => setCustomColors(c => ({ ...c, primaryColor: e.target.value }))}
                      />
                      <input
                        type="text"
                        value={customColors.primaryColor}
                        onChange={e => setCustomColors(c => ({ ...c, primaryColor: e.target.value }))}
                        className="color-hex-text"
                      />
                    </div>
                  </div>

                  <div className="color-field">
                    <label>Background Canvas</label>
                    <div className="color-input-wrapper">
                      <input
                        type="color"
                        value={customColors.backgroundColor}
                        onChange={e => setCustomColors(c => ({ ...c, backgroundColor: e.target.value }))}
                      />
                      <input
                        type="text"
                        value={customColors.backgroundColor}
                        onChange={e => setCustomColors(c => ({ ...c, backgroundColor: e.target.value }))}
                        className="color-hex-text"
                      />
                    </div>
                  </div>

                  <div className="color-field">
                    <label>Accent & Borders</label>
                    <div className="color-input-wrapper">
                      <input
                        type="color"
                        value={customColors.accentColor}
                        onChange={e => setCustomColors(c => ({ ...c, accentColor: e.target.value }))}
                      />
                      <input
                        type="text"
                        value={customColors.accentColor}
                        onChange={e => setCustomColors(c => ({ ...c, accentColor: e.target.value }))}
                        className="color-hex-text"
                      />
                    </div>
                  </div>
                </div>

                <div
                  className="palette-preview-card"
                  style={{
                    backgroundColor: customColors.backgroundColor,
                    borderColor: customColors.accentColor,
                    color: customColors.primaryColor,
                  }}
                >
                  <div className="preview-card-header">
                    <span style={{ color: customColors.accentColor, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em' }}>
                      CUSTOM PALETTE PREVIEW
                    </span>
                  </div>
                  <div className="preview-card-title serif-italic" style={{ color: customColors.primaryColor }}>
                    {title.trim() || PRESETS[selectedPreset]?.label || 'Event Preview'}
                  </div>
                  <button
                    type="button"
                    className="preview-card-btn"
                    style={{
                      backgroundColor: customColors.primaryColor,
                      color: customColors.backgroundColor,
                      borderColor: customColors.accentColor,
                    }}
                  >
                    Open Invitation
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* STEP 3: TITLE */}
          <div className="modal-step-section">
            <div className="modal-step-header">
              <span className="modal-step-number">3</span>
              <div>
                <label className="modal-step-label">Event Title / Couple Names</label>
                <span className="modal-step-desc">Displayed on the cover showcase and initial gate screen</span>
              </div>
            </div>

            <input
              type="text"
              className="preset-title-input"
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              placeholder={placeholderText}
              disabled={isCreating}
              autoFocus
            />
          </div>

          {/* SUBMIT */}
          <button
            className="btn btn-primary btn-full preset-create-btn"
            onClick={handleCreate}
            disabled={!title.trim() || isCreating}
            style={{ marginTop: 8, height: 46 }}
          >
            {isCreating ? (
              <>
                <div className="spinner-sm" style={{ marginRight: 8 }}></div>
                Preparing Studio Project...
              </>
            ) : (
              <>
                <HiOutlinePlus size={16} /> Create Invitation ({PRESETS[selectedPreset]?.label || 'Custom'})
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

/* =========================================================================
   MODAL 2: GUEST QR PASS PREVIEW & DOWNLOAD
   ========================================================================= */

function GuestQrPassModal({ guest, invitation, onClose }) {
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [downloading, setDownloading] = useState(false)

  const passToken = guest?.passToken || guest?.id || ''

  useEffect(() => {
    let active = true
    if (passToken) {
      generateQrDataUrl(passToken, { size: 300, margin: 2 })
        .then(url => { if (active) setQrDataUrl(url) })
        .catch(err => console.error('Error generating QR pass:', err))
    }
    return () => { active = false }
  }, [passToken])

  const handleDownloadPng = async () => {
    if (!passToken || downloading) return
    setDownloading(true)
    const filename = `pass-${(guest?.name || 'guest').toLowerCase().replace(/[^a-z0-9]/g, '-')}.png`
    await downloadQrPng(passToken, filename)
    setDownloading(false)
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="qr-modal-overlay" onClick={onClose}>
      <div className="qr-pass-modal" onClick={e => e.stopPropagation()}>
        <button className="qr-modal-close" onClick={onClose} aria-label="Close pass">
          <HiX size={20} />
        </button>

        <div className="qr-ticket-card">
          <div className="qr-ticket-top">
            <span className="qr-ticket-badge">✦ Official Access Pass</span>
            <h3 className="serif-italic qr-ticket-title">{invitation?.title || 'Private Event'}</h3>
          </div>

          <div className="qr-ticket-body">
            <div className="qr-ticket-guest-name">{guest?.name || 'Valued Guest'}</div>
            
            <div className="qr-ticket-meta-grid">
              <div className="meta-pill">
                <span className="meta-label">Category</span>
                <span className={`category-tag ${(guest?.groupName || 'regular').toLowerCase()}`}>
                  {guest?.groupName || 'Regular'}
                </span>
              </div>
              <div className="meta-pill">
                <span className="meta-label">Reserved Pax</span>
                <span className="meta-value">{guest?.maxPax || 2} Pax</span>
              </div>
              <div className="meta-pill">
                <span className="meta-label">Table</span>
                <span className="meta-value">{guest?.tableName || 'General'}</span>
              </div>
            </div>

            <div className="qr-code-frame">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt={`QR Pass for ${guest?.name}`} className="qr-code-image" />
              ) : (
                <div className="qr-code-placeholder">
                  <div className="spinner-sm"></div>
                </div>
              )}
            </div>

            <div className="qr-pass-token-display">
              <span className="token-label">Pass Code:</span>
              <code className="token-code">{passToken}</code>
            </div>

            <div className="qr-gate-status">
              {guest?.checkedInAt ? (
                <span className="gate-checked-in">
                  <HiOutlineCheckCircle size={16} /> Checked In ({new Date(guest.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                </span>
              ) : (
                <span className="gate-ready">
                  <HiOutlineTicket size={16} /> Ready for QR Check-In at Gate
                </span>
              )}
            </div>
          </div>

          <div className="qr-ticket-actions">
            <button className="btn btn-primary btn-sm" onClick={handleDownloadPng} disabled={downloading}>
              <HiOutlineDownload size={15} />
              {downloading ? 'Downloading...' : 'Download PNG'}
            </button>
            <button className="btn btn-outline btn-sm" onClick={handlePrint}>
              <HiOutlinePrinter size={15} /> Print Pass
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* =========================================================================
   MODAL 3: WHATSAPP BROADCAST QUEUE RUNNER
   ========================================================================= */

function BroadcastQueueModal({ invitation, guests, waTemplateText, onMarkSent, onClose }) {
  const [queueFilter, setQueueFilter] = useState('unsent') // 'unsent' | 'all'
  const [currentIndex, setCurrentIndex] = useState(0)
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedMsg, setCopiedMsg] = useState(false)

  const baseUrl = `${window.location.origin}/undangan/${invitation?.slug || ''}`

  const targetList = useMemo(() => {
    if (queueFilter === 'unsent') {
      return guests.filter(g => !g.waSentAt)
    }
    return guests
  }, [guests, queueFilter])

  const currentGuest = targetList[currentIndex] || null

  const messageText = useMemo(() => {
    if (!currentGuest) return ''
    return buildWaMessage(waTemplateText, currentGuest, invitation, baseUrl)
  }, [currentGuest, waTemplateText, invitation, baseUrl])

  const sendWaUrl = useMemo(() => {
    if (!currentGuest) return '#'
    const encoded = encodeURIComponent(messageText)
    let cleanPhone = (currentGuest.phone || '').replace(/[^0-9]/g, '')
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.slice(1)
    }
    return cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encoded}`
      : `https://api.whatsapp.com/send?text=${encoded}`
  }, [currentGuest, messageText])

  const handleOpenWaAndAdvance = async () => {
    if (!currentGuest) return
    window.open(sendWaUrl, '_blank', 'noopener,noreferrer')
    await onMarkSent(currentGuest.id)
    if (currentIndex < targetList.length - 1) {
      setCurrentIndex(i => i + 1)
    }
  }

  const handleMarkSentOnly = async () => {
    if (!currentGuest) return
    await onMarkSent(currentGuest.id)
    if (currentIndex < targetList.length - 1) {
      setCurrentIndex(i => i + 1)
    }
  }

  const handleSkip = () => {
    if (currentIndex < targetList.length - 1) {
      setCurrentIndex(i => i + 1)
    }
  }

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(i => i - 1)
    }
  }

  const handleCopyLink = () => {
    if (!currentGuest) return
    const link = `${baseUrl}?to=${encodeURIComponent(currentGuest.name)}${currentGuest.passToken ? `&pass=${encodeURIComponent(currentGuest.passToken)}` : ''}`
    navigator.clipboard.writeText(link)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  const handleCopyMessage = () => {
    if (!currentGuest) return
    navigator.clipboard.writeText(messageText)
    setCopiedMsg(true)
    onMarkSent(currentGuest.id)
    setTimeout(() => setCopiedMsg(false), 2000)
  }

  const handleBatchCopyLinks = () => {
    const lines = targetList.map(g => {
      const link = `${baseUrl}?to=${encodeURIComponent(g.name)}${g.passToken ? `&pass=${encodeURIComponent(g.passToken)}` : ''}`
      return `${g.name}: ${link}`
    }).join('\n')
    navigator.clipboard.writeText(lines)
    alert(`Copied ${targetList.length} personalized invitation links to clipboard!`)
  }

  const handleBatchCopyPhones = () => {
    const phones = targetList
      .map(g => g.phone)
      .filter(Boolean)
      .map(p => {
        let clean = p.replace(/[^0-9]/g, '')
        if (clean.startsWith('0')) clean = '62' + clean.slice(1)
        return clean
      })
      .join(', ')
    navigator.clipboard.writeText(phones)
    alert(`Copied ${phones.split(',').length} phone numbers to clipboard!`)
  }

  return (
    <div className="broadcast-modal-overlay" onClick={onClose}>
      <div className="broadcast-modal" onClick={e => e.stopPropagation()}>
        <div className="broadcast-modal-header">
          <div>
            <h3 className="serif-italic" style={{ fontSize: '1.4rem' }}>WhatsApp Distribution Queue</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
              Step through guests sequentially to distribute personalized messages and track delivery status.
            </p>
          </div>
          <button className="preset-modal-close" onClick={onClose} aria-label="Close broadcast queue">
            <HiX size={20} />
          </button>
        </div>

        {/* Filter & Progress Meter */}
        <div className="broadcast-progress-bar-wrapper">
          <div className="broadcast-queue-stats">
            <span>
              Queue: <strong>{targetList.length === 0 ? 0 : currentIndex + 1} of {targetList.length}</strong> guests
            </span>
            <div className="broadcast-filter-pills">
              <button
                className={`filter-pill-sm ${queueFilter === 'unsent' ? 'active' : ''}`}
                onClick={() => { setQueueFilter('unsent'); setCurrentIndex(0) }}
              >
                Unsent Only ({guests.filter(g => !g.waSentAt).length})
              </button>
              <button
                className={`filter-pill-sm ${queueFilter === 'all' ? 'active' : ''}`}
                onClick={() => { setQueueFilter('all'); setCurrentIndex(0) }}
              >
                All Guests ({guests.length})
              </button>
            </div>
          </div>
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${targetList.length > 0 ? ((currentIndex + 1) / targetList.length) * 100 : 0}%` }}
            />
          </div>
        </div>

        {targetList.length === 0 ? (
          <div className="empty-state" style={{ padding: '48px 20px', textAlign: 'center' }}>
            <HiOutlineBadgeCheck size={44} style={{ color: 'var(--olive)', marginBottom: 12 }} />
            <h4 className="serif-italic" style={{ fontSize: '1.25rem' }}>All Caught Up!</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
              Every guest in this invitation has already been marked as sent.
            </p>
            <button className="btn btn-outline btn-sm" style={{ marginTop: 16 }} onClick={() => setQueueFilter('all')}>
              View All Guests in Queue
            </button>
          </div>
        ) : currentGuest ? (
          <div className="broadcast-card-body">
            {/* Current Guest Summary Card */}
            <div className="broadcast-guest-card">
              <div className="guest-card-left">
                <div className="broadcast-guest-name">
                  {currentGuest.name}
                  <span className={`category-tag ${(currentGuest.groupName || 'regular').toLowerCase()}`}>
                    {currentGuest.groupName || 'Regular'}
                  </span>
                </div>
                <div className="broadcast-guest-details">
                  <span>📱 {currentGuest.phone || 'No phone number provided'}</span>
                  <span>🪑 {currentGuest.tableName ? `Table: ${currentGuest.tableName}` : 'General Seating'}</span>
                  <span>👥 {currentGuest.maxPax || 2} Pax</span>
                  {currentGuest.waSentAt && (
                    <span className="tag-sent-time">
                      ✓ Sent on {new Date(currentGuest.waSentAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                </div>
              </div>
              <div className="guest-card-right">
                <button className="btn btn-outline btn-sm" onClick={handleCopyLink} title="Copy personalized link">
                  {copiedLink ? <><HiOutlineCheck size={14} color="var(--olive)" /> Copied</> : <><HiOutlineLink size={14} /> Link</>}
                </button>
                <button className="btn btn-outline btn-sm" onClick={handleCopyMessage} title="Copy full message text">
                  {copiedMsg ? <><HiOutlineCheck size={14} color="var(--olive)" /> Copied</> : <><HiOutlineClipboardCopy size={14} /> Text</>}
                </button>
              </div>
            </div>

            {/* Live Message Preview */}
            <div className="broadcast-preview-box">
              <span className="label-caps" style={{ fontSize: 10, color: 'var(--olive)', fontWeight: 700 }}>
                Personalized Preview
              </span>
              <pre className="broadcast-preview-text">{messageText}</pre>
            </div>

            {/* Stepper Controls */}
            <div className="broadcast-stepper-actions">
              <div className="stepper-nav-left">
                <button className="btn btn-outline btn-sm" onClick={handlePrev} disabled={currentIndex === 0}>
                  ← Previous
                </button>
                <button className="btn btn-ghost btn-sm" onClick={handleSkip} disabled={currentIndex >= targetList.length - 1}>
                  Skip →
                </button>
              </div>
              <div className="stepper-nav-right">
                <button className="btn btn-outline btn-sm" onClick={handleMarkSentOnly}>
                  Mark Sent & Next
                </button>
                <button className="btn btn-primary" onClick={handleOpenWaAndAdvance}>
                  <HiOutlineChatAlt2 size={16} /> Open WhatsApp & Next
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {/* Batch utilities footer */}
        <div className="broadcast-modal-footer">
          <span style={{ fontSize: 11, color: 'var(--text-light)' }}>Batch Utilities:</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost btn-sm" onClick={handleBatchCopyLinks}>
              Copy All Links ({targetList.length})
            </button>
            <button className="btn btn-ghost btn-sm" onClick={handleBatchCopyPhones}>
              Copy All Phones
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* =========================================================================
   MODAL 4: ADD OR EDIT GUEST FORM
   ========================================================================= */

function GuestFormModal({ isOpen, onClose, onSave, initialData = null }) {
  const [name, setName] = useState(initialData?.name || '')
  const [phone, setPhone] = useState(initialData?.phone || '')
  const [groupName, setGroupName] = useState(initialData?.groupName || 'Regular')
  const [maxPax, setMaxPax] = useState(initialData?.maxPax || 2)
  const [tableName, setTableName] = useState(initialData?.tableName || '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '')
      setPhone(initialData.phone || '')
      setGroupName(initialData.groupName || 'Regular')
      setMaxPax(initialData.maxPax || 2)
      setTableName(initialData.tableName || '')
    } else {
      setName('')
      setPhone('')
      setGroupName('Regular')
      setMaxPax(2)
      setTableName('')
    }
  }, [initialData, isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim() || saving) return
    setSaving(true)
    try {
      await onSave({
        name: name.trim(),
        phone: phone.trim() || null,
        groupName,
        maxPax: Number(maxPax) || 1,
        tableName: tableName.trim() || null,
      })
      onClose()
    } catch (err) {
      console.error(err)
      alert('Error saving guest details.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="preset-modal-overlay" onClick={onClose}>
      <div className="preset-modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
        <button className="preset-modal-close" onClick={onClose} aria-label="Close form">
          <HiX size={20} />
        </button>

        <h3 className="serif-italic" style={{ fontSize: '1.4rem', marginBottom: 6 }}>
          {initialData ? 'Edit Guest' : 'Add New Guest'}
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>
          Manage personalized guest attributes, seating, and maximum party size.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label className="input-field-label">Guest Full Name *</label>
            <input
              type="text"
              className="settings-input"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Mr. Johnathan & Partner"
              required
              autoFocus
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="input-field-label">Category / Group</label>
              <select
                className="settings-input"
                value={groupName}
                onChange={e => setGroupName(e.target.value)}
              >
                <option value="Regular">Regular</option>
                <option value="VIP">VIP</option>
                <option value="Family">Family</option>
              </select>
            </div>
            <div>
              <label className="input-field-label">Max Reserved Pax</label>
              <input
                type="number"
                min="1"
                max="20"
                className="settings-input"
                value={maxPax}
                onChange={e => setMaxPax(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="input-field-label">Phone / WhatsApp</label>
              <input
                type="tel"
                className="settings-input"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="e.g. 08123456789"
              />
            </div>
            <div>
              <label className="input-field-label">Table / Seating Assignment</label>
              <input
                type="text"
                className="settings-input"
                value={tableName}
                onChange={e => setTableName(e.target.value)}
                placeholder="e.g. Table 04 or Diamond A"
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
            <button type="button" className="btn btn-ghost btn-sm" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving || !name.trim()}>
              {saving ? 'Saving...' : initialData ? 'Update Guest' : 'Add Guest'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* =========================================================================
   TAB: GUEST CRM & WHATSAPP DISTRIBUTION PRO
   ========================================================================= */

function GuestListTab({
  invitation,
  guests,
  setGuests,
  loading,
}) {
  const { addGuest, addGuestsBulk, updateGuest, deleteGuest, markGuestWaSent, checkInGuest } = useInvitations()

  // State
  const [searchTerm, setSearchTerm] = useState('')
  const [groupFilter, setGroupFilter] = useState('all') // 'all' | 'VIP' | 'Family' | 'Regular'
  const [waFilter, setWaFilter] = useState('all') // 'all' | 'sent' | 'unsent'
  const [checkInFilter, setCheckInFilter] = useState('all') // 'all' | 'checked_in' | 'pending'
  
  // WhatsApp Template Studio State
  const [waTemplateKey, setWaTemplateKey] = useState('english')
  const [customWaText, setCustomWaText] = useState(WA_TEMPLATES.english.text)
  const textareaRef = useRef(null)

  // Modals & Queues
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingGuest, setEditingGuest] = useState(null)
  const [viewingQrGuest, setViewingQrGuest] = useState(null)
  const [showQueueModal, setShowQueueModal] = useState(false)

  // Spreadsheet / CSV import
  const [showImportSection, setShowImportSection] = useState(false)
  const [sheetUrl, setSheetUrl] = useState('')
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState('')
  const [importSuccess, setImportSuccess] = useState('')

  // Toast / feedback states
  const [copiedId, setCopiedId] = useState(null)
  const [copiedMsgId, setCopiedMsgId] = useState(null)

  const baseUrl = `${window.location.origin}/undangan/${invitation?.slug || ''}`

  // 1-Click Variable Chips Insertion
  const handleInsertVariable = (token) => {
    if (!textareaRef.current) {
      setCustomWaText(prev => prev + ' ' + token)
      return
    }
    const el = textareaRef.current
    const start = el.selectionStart
    const end = el.selectionEnd
    const nextText = customWaText.substring(0, start) + token + customWaText.substring(end)
    setCustomWaText(nextText)
    setTimeout(() => {
      el.focus()
      el.setSelectionRange(start + token.length, start + token.length)
    }, 0)
  }

  const handleSelectWaTemplate = (key) => {
    setWaTemplateKey(key)
    if (WA_TEMPLATES[key]) {
      setCustomWaText(WA_TEMPLATES[key].text)
    }
  }

  // Guest CRUD handlers
  const handleSaveGuest = async (formData) => {
    if (editingGuest) {
      const updated = await updateGuest(editingGuest.id, formData)
      if (updated) {
        setGuests(prev => prev.map(g => (g.id === updated.id ? updated : g)))
      }
    } else {
      const created = await addGuest(invitation.id, formData)
      if (created) {
        setGuests(prev => [created, ...prev])
      }
    }
  }

  const handleDeleteGuest = async (guestId) => {
    if (!confirm('Are you sure you want to remove this guest from the guest list?')) return
    const ok = await deleteGuest(guestId)
    if (ok) {
      setGuests(prev => prev.filter(g => g.id !== guestId))
    }
  }

  const handleToggleWaSent = async (guest) => {
    if (guest.waSentAt) {
      const updated = await updateGuest(guest.id, { waSentAt: null })
      if (updated) setGuests(prev => prev.map(g => (g.id === updated.id ? updated : g)))
    } else {
      const updated = await markGuestWaSent(guest.id)
      if (updated) setGuests(prev => prev.map(g => (g.id === updated.id ? updated : g)))
    }
  }

  const handleToggleCheckIn = async (guest) => {
    if (guest.checkedInAt) {
      const updated = await updateGuest(guest.id, { checkedInAt: null, checkedInPax: null })
      if (updated) setGuests(prev => prev.map(g => (g.id === updated.id ? updated : g)))
    } else {
      const res = await checkInGuest(guest.passToken || guest.id, {
        invitationId: invitation.id,
        checkedInPax: guest.maxPax || 1,
      })
      if (res.success && res.guest) {
        setGuests(prev => prev.map(g => (g.id === res.guest.id ? res.guest : g)))
      } else if (res.error) {
        alert(res.error)
      }
    }
  }

  const handleToggleSouvenir = async (guest) => {
    const updated = await updateGuest(guest.id, { souvenirClaimed: !guest.souvenirClaimed })
    if (updated) setGuests(prev => prev.map(g => (g.id === updated.id ? updated : g)))
  }

  const handleSendWa = async (guest) => {
    const text = buildWaMessage(customWaText, guest, invitation, baseUrl)
    const encoded = encodeURIComponent(text)
    let cleanPhone = (guest.phone || '').replace(/[^0-9]/g, '')
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.slice(1)
    }
    const waUrl = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encoded}`
      : `https://api.whatsapp.com/send?text=${encoded}`

    await markGuestWaSent(guest.id)
    setGuests(prev => prev.map(g => (g.id === guest.id ? { ...g, waSentAt: new Date().toISOString() } : g)))
    window.open(waUrl, '_blank', 'noopener,noreferrer')
  }

  const handleCopyLink = (guest) => {
    const link = `${baseUrl}?to=${encodeURIComponent(guest.name)}${guest.passToken ? `&pass=${encodeURIComponent(guest.passToken)}` : ''}`
    navigator.clipboard.writeText(link)
    setCopiedId(guest.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleCopyMessage = async (guest) => {
    const text = buildWaMessage(customWaText, guest, invitation, baseUrl)
    navigator.clipboard.writeText(text)
    setCopiedMsgId(guest.id)
    await markGuestWaSent(guest.id)
    setGuests(prev => prev.map(g => (g.id === guest.id ? { ...g, waSentAt: new Date().toISOString() } : g)))
    setTimeout(() => setCopiedMsgId(null), 2000)
  }

  // Google Sheet / CSV Parser
  const parseCSV = (text) => {
    const lines = []
    let row = ['']
    let inQuotes = false
    for (let i = 0; i < text.length; i++) {
      const c = text[i]
      const next = text[i + 1]
      if (c === '"') {
        if (inQuotes && next === '"') { row[row.length - 1] += '"'; i++ }
        else { inQuotes = !inQuotes }
      } else if (c === ',' && !inQuotes) {
        row.push('')
      } else if ((c === '\r' || c === '\n') && !inQuotes) {
        if (c === '\r' && next === '\n') i++
        lines.push(row)
        row = ['']
      } else {
        row[row.length - 1] += c
      }
    }
    if (row.length > 1 || row[0] !== '') lines.push(row)
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
        throw new Error('Invalid Google Spreadsheet link. Please verify the URL contains a valid spreadsheet ID.')
      }
      const spreadsheetId = idMatch[1]
      const gidMatch = sheetUrl.match(/gid=([0-9]+)/)
      const gid = gidMatch ? gidMatch[1] : '0'

      const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&gid=${gid}`
      const response = await fetch(csvUrl)
      if (!response.ok) {
        throw new Error('Could not access Google Sheet. Please make sure link sharing is set to "Anyone with the link can view".')
      }

      const text = await response.text()
      const rows = parseCSV(text)
      if (rows.length < 2) {
        throw new Error('Spreadsheet has insufficient rows. At least a header row and one data row are required.')
      }

      const headerRow = rows[0].map(h => h.toLowerCase().trim())
      let nameIdx = headerRow.findIndex(h => h.includes('nama') || h.includes('name') || h.includes('guest'))
      let phoneIdx = headerRow.findIndex(h => h.includes('phone') || h.includes('hp') || h.includes('wa') || h.includes('telp'))
      let groupIdx = headerRow.findIndex(h => h.includes('group') || h.includes('kategori') || h.includes('category') || h.includes('type'))
      let paxIdx = headerRow.findIndex(h => h.includes('pax') || h.includes('jumlah') || h.includes('count'))
      let tableIdx = headerRow.findIndex(h => h.includes('table') || h.includes('meja') || h.includes('seat'))

      if (nameIdx === -1) nameIdx = 0

      const parsedGuests = []
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i]
        const nameVal = row[nameIdx]?.trim()
        if (nameVal) {
          parsedGuests.push({
            name: nameVal,
            phone: phoneIdx !== -1 && row[phoneIdx] ? row[phoneIdx].trim() : null,
            groupName: groupIdx !== -1 && row[groupIdx] ? row[groupIdx].trim() : 'Regular',
            maxPax: paxIdx !== -1 && Number(row[paxIdx]) ? Number(row[paxIdx]) : 2,
            tableName: tableIdx !== -1 && row[tableIdx] ? row[tableIdx].trim() : null,
          })
        }
      }

      if (parsedGuests.length === 0) {
        throw new Error('No valid guest names found in the spreadsheet.')
      }

      const inserted = await addGuestsBulk(invitation.id, parsedGuests)
      if (inserted && inserted.length > 0) {
        setGuests(prev => [...inserted, ...prev])
        setImportSuccess(`Successfully imported ${inserted.length} guests!`)
        setSheetUrl('')
      }
    } catch (err) {
      console.error(err)
      setImportError(err.message || 'Error occurred while importing spreadsheet.')
    } finally {
      setImporting(false)
    }
  }

  // Filtered guests calculation
  const filteredGuests = useMemo(() => {
    return guests.filter(g => {
      // Search
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase()
        const matchesName = (g.name || '').toLowerCase().includes(q)
        const matchesPhone = (g.phone || '').toLowerCase().includes(q)
        const matchesTable = (g.tableName || '').toLowerCase().includes(q)
        const matchesPass = (g.passToken || '').toLowerCase().includes(q)
        if (!matchesName && !matchesPhone && !matchesTable && !matchesPass) return false
      }
      // Group filter
      if (groupFilter !== 'all') {
        if ((g.groupName || 'Regular').toLowerCase() !== groupFilter.toLowerCase()) return false
      }
      // WA filter
      if (waFilter === 'sent' && !g.waSentAt) return false
      if (waFilter === 'unsent' && g.waSentAt) return false
      // Check-in filter
      if (checkInFilter === 'checked_in' && !g.checkedInAt) return false
      if (checkInFilter === 'pending' && g.checkedInAt) return false
      return true
    })
  }, [guests, searchTerm, groupFilter, waFilter, checkInFilter])

  // Statistics
  const totalGuests = guests.length
  const totalMaxPax = guests.reduce((sum, g) => sum + (Number(g.maxPax) || 2), 0)
  const waSentCount = guests.filter(g => g.waSentAt).length
  const checkedInCount = guests.filter(g => g.checkedInAt).length
  const souvenirClaimedCount = guests.filter(g => g.souvenirClaimed).length

  return (
    <div className="guest-crm-tab animate-fade-in-up">
      {/* Top Metric Cards */}
      <div className="crm-metrics-grid">
        <div className="crm-metric-card">
          <div className="metric-icon-box olive"><HiOutlineUserGroup size={20} /></div>
          <div>
            <div className="crm-metric-val">{totalGuests}</div>
            <div className="crm-metric-label">Registered Guests</div>
          </div>
          <span className="crm-metric-sub">{totalMaxPax} planned pax</span>
        </div>

        <div className="crm-metric-card">
          <div className="metric-icon-box green"><HiOutlineChatAlt2 size={20} /></div>
          <div>
            <div className="crm-metric-val">{waSentCount}</div>
            <div className="crm-metric-label">WhatsApp Delivered</div>
          </div>
          <span className="crm-metric-sub">{totalGuests > 0 ? `${Math.round((waSentCount / totalGuests) * 100)}% reach` : '0%'}</span>
        </div>

        <div className="crm-metric-card">
          <div className="metric-icon-box gold"><HiOutlineBadgeCheck size={20} /></div>
          <div>
            <div className="crm-metric-val">{checkedInCount}</div>
            <div className="crm-metric-label">Checked In at Venue</div>
          </div>
          <span className="crm-metric-sub">{totalGuests > 0 ? `${Math.round((checkedInCount / totalGuests) * 100)}% attendance` : '0%'}</span>
        </div>

        <div className="crm-metric-card">
          <div className="metric-icon-box rose"><HiOutlineTicket size={20} /></div>
          <div>
            <div className="crm-metric-val">{souvenirClaimedCount}</div>
            <div className="crm-metric-label">Gifts / Souvenirs</div>
          </div>
          <span className="crm-metric-sub">claimed at gate</span>
        </div>
      </div>

      {/* Main Container */}
      <div className="card crm-container-card">
        {/* Header & Quick Action Buttons */}
        <div className="crm-header-row">
          <div>
            <h3 className="serif-italic" style={{ fontSize: '1.4rem', color: 'var(--olive)' }}>
              Guest CRM & WhatsApp Distribution
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
              Manage guest passes, table allocations, automated broadcast messages, and live venue check-ins.
            </p>
          </div>

          <div className="crm-header-actions">
            {/* Direct Gate & Scanner Action Buttons */}
            <button
              className="btn btn-outline btn-sm action-scanner-btn"
              onClick={() => window.open(`/checkin/${invitation?.id}`, '_blank')}
              title="Open QR Check-In Scanner in new tab"
            >
              <HiOutlineQrcode size={15} /> QR Scanner
            </button>
            <button
              className="btn btn-outline btn-sm action-welcome-btn"
              onClick={() => window.open(`/welcome/${invitation?.id}`, '_blank')}
              title="Open Fullscreen Welcome Display in new tab"
            >
              <HiOutlineDesktopComputer size={15} /> Welcome Screen
            </button>
            <button
              className="btn btn-primary btn-sm action-broadcast-btn"
              onClick={() => setShowQueueModal(true)}
              disabled={guests.length === 0}
            >
              <HiOutlineChatAlt2 size={15} /> Broadcast Queue
            </button>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => {
                const csv = [
                  ['Name', 'Phone', 'Category', 'Max Pax', 'Table', 'Pass Token', 'WA Sent', 'Checked In'].join(','),
                  ...guests.map(g => [
                    `"${(g.name || '').replace(/"/g, '""')}"`,
                    `"${g.phone || '-'}"`,
                    g.groupName || 'Regular',
                    g.maxPax || 2,
                    `"${g.tableName || '-'}"`,
                    g.passToken || '-',
                    g.waSentAt ? 'Yes' : 'No',
                    g.checkedInAt ? 'Yes' : 'No'
                  ].join(','))
                ].join('\n')
                const blob = new Blob([csv], { type: 'text/csv' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `GuestCRM_${invitation?.title || 'Invitation'}.csv`
                a.click()
              }}
              disabled={guests.length === 0}
            >
              <HiOutlineDownload size={14} /> Export CSV
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => { setEditingGuest(null); setShowAddModal(true) }}
            >
              <HiOutlinePlus size={15} /> Add Guest
            </button>
          </div>
        </div>

        {/* WhatsApp Broadcast Template Studio */}
        <div className="wa-template-studio">
          <div className="wa-template-header">
            <div>
              <span className="label-caps" style={{ color: 'var(--olive)', fontSize: 11, fontWeight: 700 }}>
                WhatsApp Invitation Template Editor
              </span>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                Click any variable chip below to automatically insert personalized guest tags into your message.
              </p>
            </div>
            <div className="wa-template-pills">
              {Object.entries(WA_TEMPLATES).map(([key, tpl]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleSelectWaTemplate(key)}
                  className={`wa-template-pill ${waTemplateKey === key ? 'active' : ''}`}
                >
                  {tpl.label}
                </button>
              ))}
            </div>
          </div>

          {/* 1-Click Variable Chips */}
          <div className="wa-variable-chips-bar">
            <span className="chips-title">Insert Variable:</span>
            <div className="chips-list">
              {VARIABLE_CHIPS.map(chip => (
                <button
                  key={chip.token}
                  type="button"
                  className="wa-chip-btn"
                  onClick={() => handleInsertVariable(chip.token)}
                  title={chip.desc}
                >
                  <code className="chip-token">{chip.token}</code>
                  <span className="chip-label">{chip.label}</span>
                </button>
              ))}
            </div>
          </div>

          <textarea
            ref={textareaRef}
            className="settings-input wa-template-textarea"
            rows={5}
            value={customWaText}
            onChange={e => setCustomWaText(e.target.value)}
            placeholder="Type your WhatsApp invitation message..."
          />
        </div>

        {/* Search & Filter Toolbar */}
        <div className="crm-toolbar">
          <div className="toolbar-search">
            <HiOutlineSearch size={16} className="search-icon" />
            <input
              type="text"
              className="search-input"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by name, phone, table, or pass token..."
            />
            {searchTerm && (
              <button className="search-clear" onClick={() => setSearchTerm('')}><HiX size={14} /></button>
            )}
          </div>

          <div className="toolbar-filters">
            <div className="filter-group">
              <span className="filter-label">Category:</span>
              <select
                className="filter-select"
                value={groupFilter}
                onChange={e => setGroupFilter(e.target.value)}
              >
                <option value="all">All Groups</option>
                <option value="VIP">VIP</option>
                <option value="Family">Family</option>
                <option value="Regular">Regular</option>
              </select>
            </div>

            <div className="filter-group">
              <span className="filter-label">WhatsApp:</span>
              <select
                className="filter-select"
                value={waFilter}
                onChange={e => setWaFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="sent">Sent</option>
                <option value="unsent">Unsent</option>
              </select>
            </div>

            <div className="filter-group">
              <span className="filter-label">Check-In:</span>
              <select
                className="filter-select"
                value={checkInFilter}
                onChange={e => setCheckInFilter(e.target.value)}
              >
                <option value="all">All Gate Status</option>
                <option value="checked_in">Checked In</option>
                <option value="pending">Not Checked In</option>
              </select>
            </div>

            <button
              className={`btn btn-outline btn-sm ${showImportSection ? 'active' : ''}`}
              onClick={() => setShowImportSection(s => !s)}
            >
              Spreadsheet Import
            </button>
          </div>
        </div>

        {/* Optional Collapsible Spreadsheet Import Section */}
        {showImportSection && (
          <div className="sheet-import-drawer animate-fade-in">
            <div className="sheet-import-header">
              <h4 className="serif-italic" style={{ fontSize: '1.15rem' }}>Import from Google Spreadsheet</h4>
              <button className="btn-icon-only" onClick={() => setShowImportSection(false)}><HiX size={16} /></button>
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 10 }}>
              <input
                value={sheetUrl}
                onChange={e => setSheetUrl(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleImportSheet()}
                placeholder="https://docs.google.com/spreadsheets/d/.../edit?usp=sharing"
                className="settings-input"
                style={{ flex: 1, minWidth: 280, background: '#fff' }}
              />
              <button
                onClick={handleImportSheet}
                disabled={importing || !sheetUrl.trim()}
                className="btn btn-primary"
                style={{ padding: '0 24px', height: 44 }}
              >
                {importing ? 'Importing...' : 'Import Guests'}
              </button>
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.5 }}>
              💡 <strong>Note:</strong> Set sharing to <strong>"Anyone with the link can view"</strong>. Invori automatically detects column headers like Name, Phone, Category, Pax, and Table.
            </p>
            {importError && (
              <div className="import-alert error">⚠️ {importError}</div>
            )}
            {importSuccess && (
              <div className="import-alert success">✅ {importSuccess}</div>
            )}
          </div>
        )}

        {/* Guest Table */}
        <div className="crm-table-wrapper">
          {loading ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '48px 0', fontSize: 14 }}>
              Loading guest records...
            </p>
          ) : filteredGuests.length === 0 ? (
            <div className="empty-state" style={{ textAlign: 'center', padding: '56px 0' }}>
              <HiOutlineUserGroup size={44} style={{ color: 'var(--text-light)', marginBottom: 12, opacity: 0.7 }} />
              <h4 className="serif-italic" style={{ fontSize: '1.25rem', color: 'var(--text-dark)' }}>No Guests Found</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
                {searchTerm || groupFilter !== 'all' || waFilter !== 'all' || checkInFilter !== 'all'
                  ? 'No guest matches the active filter criteria. Try clearing search filters.'
                  : 'Start building your guest list by adding guests manually or importing from a spreadsheet.'}
              </p>
              <button
                className="btn btn-primary btn-sm"
                style={{ marginTop: 16 }}
                onClick={() => { setEditingGuest(null); setShowAddModal(true) }}
              >
                <HiOutlinePlus size={15} /> Add First Guest
              </button>
            </div>
          ) : (
            <div className="responsive-table-scroll">
              <table className="crm-table">
                <thead>
                  <tr>
                    <th>Guest Information</th>
                    <th>Category</th>
                    <th>Table & Pax</th>
                    <th>WhatsApp Status</th>
                    <th>Gate Check-In</th>
                    <th>Souvenir</th>
                    <th style={{ textAlign: 'right', minWidth: 220 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGuests.map((guest) => {
                    const isWaSent = Boolean(guest.waSentAt)
                    const isCheckedIn = Boolean(guest.checkedInAt)

                    return (
                      <tr key={guest.id} className="crm-row">
                        {/* Guest Info */}
                        <td className="cell-guest-info">
                          <div className="guest-primary-line">
                            <span className="guest-display-name">{guest.name}</span>
                          </div>
                          <div className="guest-secondary-line">
                            {guest.phone ? (
                              <span className="guest-phone-tag">{guest.phone}</span>
                            ) : (
                              <span className="guest-no-phone">No phone</span>
                            )}
                            <code className="guest-pass-token" title="Access Pass Token">
                              {guest.passToken || '-'}
                            </code>
                          </div>
                        </td>

                        {/* Category */}
                        <td>
                          <span className={`category-tag ${(guest.groupName || 'regular').toLowerCase()}`}>
                            {guest.groupName || 'Regular'}
                          </span>
                        </td>

                        {/* Table & Pax */}
                        <td>
                          <div className="table-pax-box">
                            <span className="cell-table-name">{guest.tableName || 'Open Table'}</span>
                            <span className="cell-pax-tag">{guest.maxPax || 2} Pax</span>
                          </div>
                        </td>

                        {/* WhatsApp Status Toggle */}
                        <td>
                          <button
                            type="button"
                            onClick={() => handleToggleWaSent(guest)}
                            className={`status-toggle-pill ${isWaSent ? 'sent' : 'unsent'}`}
                            title="Click to toggle sent status"
                          >
                            {isWaSent ? (
                              <>
                                <HiOutlineCheck size={12} /> Sent
                              </>
                            ) : (
                              'Not Sent'
                            )}
                          </button>
                        </td>

                        {/* Gate Check-In Toggle */}
                        <td>
                          <button
                            type="button"
                            onClick={() => handleToggleCheckIn(guest)}
                            className={`gate-toggle-pill ${isCheckedIn ? 'checked-in' : 'pending'}`}
                            title="Click to toggle check-in state"
                          >
                            {isCheckedIn ? (
                              <>
                                <HiOutlineBadgeCheck size={13} /> Checked In
                              </>
                            ) : (
                              'Pending'
                            )}
                          </button>
                        </td>

                        {/* Souvenir Claimed Toggle */}
                        <td>
                          <button
                            type="button"
                            onClick={() => handleToggleSouvenir(guest)}
                            className={`souvenir-toggle-pill ${guest.souvenirClaimed ? 'claimed' : 'unclaimed'}`}
                            title="Click to toggle souvenir claim"
                          >
                            {guest.souvenirClaimed ? '✓ Claimed' : 'Unclaimed'}
                          </button>
                        </td>

                        {/* Actions */}
                        <td style={{ textAlign: 'right' }}>
                          <div className="crm-row-actions">
                            <button
                              type="button"
                              onClick={() => handleSendWa(guest)}
                              className="btn btn-sm action-wa-btn"
                              title="Send personalized invitation via WhatsApp"
                            >
                              <HiOutlineChatAlt2 size={14} /> Send WA
                            </button>

                            <button
                              type="button"
                              onClick={() => setViewingQrGuest(guest)}
                              className="btn btn-outline btn-sm action-icon-btn"
                              title="View & Download QR Pass"
                            >
                              <HiOutlineQrcode size={15} />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleCopyMessage(guest)}
                              className="btn btn-outline btn-sm action-icon-btn"
                              title="Copy Message Text"
                            >
                              {copiedMsgId === guest.id ? <HiOutlineCheck size={14} color="var(--olive)" /> : <HiOutlineClipboardCopy size={14} />}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleCopyLink(guest)}
                              className="btn btn-outline btn-sm action-icon-btn"
                              title="Copy Personal Link"
                            >
                              {copiedId === guest.id ? <HiOutlineCheck size={14} color="var(--olive)" /> : <HiOutlineLink size={14} />}
                            </button>

                            <button
                              type="button"
                              onClick={() => { setEditingGuest(guest); setShowAddModal(true) }}
                              className="btn btn-outline btn-sm action-icon-btn"
                              title="Edit Guest Details"
                            >
                              <HiOutlinePencil size={14} />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteGuest(guest.id)}
                              className="btn-icon-only delete-icon-btn"
                              title="Remove Guest"
                            >
                              <HiOutlineTrash size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Guest Modal */}
      <GuestFormModal
        isOpen={showAddModal}
        onClose={() => { setShowAddModal(false); setEditingGuest(null) }}
        onSave={handleSaveGuest}
        initialData={editingGuest}
      />

      {/* QR Pass Preview Modal */}
      {viewingQrGuest && (
        <GuestQrPassModal
          guest={viewingQrGuest}
          invitation={invitation}
          onClose={() => setViewingQrGuest(null)}
        />
      )}

      {/* WhatsApp Broadcast Queue Runner Modal */}
      {showQueueModal && (
        <BroadcastQueueModal
          invitation={invitation}
          guests={guests}
          waTemplateText={customWaText}
          onMarkSent={async (id) => {
            await markGuestWaSent(id)
            setGuests(prev => prev.map(g => (g.id === id ? { ...g, waSentAt: new Date().toISOString() } : g)))
          }}
          onClose={() => setShowQueueModal(false)}
        />
      )}
    </div>
  )
}

/* =========================================================================
   TAB: RSVPs & ATTENDANCE CONFIRMATION
   ========================================================================= */

function RsvpsTab({ invitation, rsvps, loading, onDeleteRsvp }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [attendanceFilter, setAttendanceFilter] = useState('all') // 'all' | 'attending' | 'declined'
  const [sessionFilter, setSessionFilter] = useState('all')

  // Filter only RSVP attendance entries (not wishes)
  const rsvpEntries = useMemo(() => {
    return (rsvps || []).filter(r => r.entryType === 'rsvp' || r.attendance !== null)
  }, [rsvps])

  // Extract available distinct sessions
  const distinctSessions = useMemo(() => {
    const set = new Set()
    rsvpEntries.forEach(r => {
      if (r.session && r.session.trim()) set.add(r.session.trim())
    })
    return Array.from(set)
  }, [rsvpEntries])

  const filteredRsvps = useMemo(() => {
    return rsvpEntries.filter(r => {
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase()
        const matchesName = (r.name || '').toLowerCase().includes(q)
        const matchesEmail = (r.email || '').toLowerCase().includes(q)
        const matchesPhone = (r.whatsapp || '').toLowerCase().includes(q)
        if (!matchesName && !matchesEmail && !matchesPhone) return false
      }
      if (attendanceFilter === 'attending') {
        const isAttending = r.attendance === 'attending' || r.attendance === 'yes' || r.attendance === true
        if (!isAttending) return false
      } else if (attendanceFilter === 'declined') {
        const isDeclined = r.attendance === 'declined' || r.attendance === 'no' || r.attendance === false
        if (!isDeclined) return false
      }
      if (sessionFilter !== 'all') {
        if ((r.session || '').toLowerCase() !== sessionFilter.toLowerCase()) return false
      }
      return true
    })
  }, [rsvpEntries, searchTerm, attendanceFilter, sessionFilter])

  // Metrics
  const attendingList = rsvpEntries.filter(r => r.attendance === 'attending' || r.attendance === 'yes' || r.attendance === true)
  const declinedList = rsvpEntries.filter(r => r.attendance === 'declined' || r.attendance === 'no' || r.attendance === false)
  const totalAttendingPax = attendingList.reduce((sum, r) => sum + (Number(r.guestCount) || 1), 0)
  const attendanceRate = rsvpEntries.length > 0 ? Math.round((attendingList.length / rsvpEntries.length) * 100) : 0

  return (
    <div className="rsvps-tab animate-fade-in-up">
      <div className="card" style={{ padding: 28 }}>
        <div className="card-header" style={{ marginBottom: 20 }}>
          <div>
            <h3 className="serif-italic" style={{ fontSize: '1.4rem', color: 'var(--olive)' }}>
              RSVP & Attendance Confirmation
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
              Verify guest attendance confirmations, allocated sessions, and special dietary requests.
            </p>
          </div>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => {
              const csv = [
                ['Name', 'Email', 'WhatsApp', 'Attendance', 'Pax Count', 'Session', 'Dietary Notes', 'Message', 'Sent At'].join(','),
                ...filteredRsvps.map(r => {
                  const isAttending = r.attendance === 'attending' || r.attendance === 'yes' || r.attendance === true
                  return [
                    `"${(r.name || '').replace(/"/g, '""')}"`,
                    `"${r.email || '-'}"`,
                    `"${r.whatsapp || '-'}"`,
                    isAttending ? 'Attending' : 'Not Attending',
                    isAttending ? (r.guestCount || 1) : 0,
                    `"${(r.session || '-').replace(/"/g, '""')}"`,
                    `"${(r.dietaryNote || '-').replace(/"/g, '""')}"`,
                    `"${(r.message || '').replace(/"/g, '""')}"`,
                    `"${r.sentAt || ''}"`
                  ].join(',')
                })
              ].join('\n')
              const blob = new Blob([csv], { type: 'text/csv' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `RSVPs_${invitation?.title || 'Invitation'}.csv`
              a.click()
            }}
            disabled={filteredRsvps.length === 0}
          >
            <HiOutlineDownload size={14} /> Export CSV
          </button>
        </div>

        {/* Metrics Grid */}
        <div className="rsvp-summary-grid">
          <div className="rsvp-summary-card total">
            <div className="rsvp-summary-label">Total Responses</div>
            <div className="rsvp-summary-value">{rsvpEntries.length}</div>
            <span className="rsvp-summary-detail">{attendanceRate}% attending rate</span>
          </div>

          <div className="rsvp-summary-card attending">
            <div className="rsvp-summary-label">Confirmed Attending</div>
            <div className="rsvp-summary-value">{attendingList.length} Parties</div>
            <span className="rsvp-summary-detail">({totalAttendingPax} Total Pax)</span>
          </div>

          <div className="rsvp-summary-card attending">
            <div className="rsvp-summary-label">Total Pax Confirmed</div>
            <div className="rsvp-summary-value">{totalAttendingPax}</div>
            <span className="rsvp-summary-detail">across confirmed parties</span>
          </div>

          <div className="rsvp-summary-card declined">
            <div className="rsvp-summary-label">Declined</div>
            <div className="rsvp-summary-value">{declinedList.length}</div>
            <span className="rsvp-summary-detail">unable to attend</span>
          </div>
        </div>

        {/* Filter bar */}
        <div className="crm-toolbar" style={{ marginTop: 24, marginBottom: 16 }}>
          <div className="toolbar-search">
            <HiOutlineSearch size={16} className="search-icon" />
            <input
              type="text"
              className="search-input"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, or WhatsApp..."
            />
          </div>

          <div className="toolbar-filters">
            <div className="filter-group">
              <span className="filter-label">Attendance:</span>
              <select
                className="filter-select"
                value={attendanceFilter}
                onChange={e => setAttendanceFilter(e.target.value)}
              >
                <option value="all">All Responses</option>
                <option value="attending">Attending Only</option>
                <option value="declined">Declined Only</option>
              </select>
            </div>

            {distinctSessions.length > 0 && (
              <div className="filter-group">
                <span className="filter-label">Session:</span>
                <select
                  className="filter-select"
                  value={sessionFilter}
                  onChange={e => setSessionFilter(e.target.value)}
                >
                  <option value="all">All Sessions</option>
                  {distinctSessions.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <p style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
            Loading RSVP data...
          </p>
        ) : filteredRsvps.length === 0 ? (
          <div className="empty-state" style={{ padding: '48px 0', textAlign: 'center' }}>
            <HiOutlineMail size={36} style={{ color: 'var(--text-light)', marginBottom: 12 }} />
            <h4 className="serif-italic" style={{ fontSize: '1.25rem' }}>No RSVPs Found</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
              When guests complete the attendance form, their responses will appear here in real time.
            </p>
          </div>
        ) : (
          <div className="rsvp-table-container">
            <table className="rsvp-table">
              <thead>
                <tr>
                  <th>Guest Name</th>
                  <th>Attendance</th>
                  <th>Pax</th>
                  <th>Session</th>
                  <th>Dietary / Notes</th>
                  <th>Date & Time</th>
                  <th style={{ width: 44 }}></th>
                </tr>
              </thead>
              <tbody>
                {filteredRsvps.map((item) => {
                  const isAttending = item.attendance === 'attending' || item.attendance === 'yes' || item.attendance === true
                  const isDeclined = item.attendance === 'declined' || item.attendance === 'no' || item.attendance === false

                  let dateStr = 'Recent'
                  if (item.sentAt) {
                    try {
                      dateStr = new Date(item.sentAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                    } catch {
                      dateStr = String(item.sentAt)
                    }
                  }

                  return (
                    <tr key={item.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-dark)' }}>{item.name || 'Anonymous'}</div>
                        {(item.whatsapp || item.email) && (
                          <div style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 2 }}>
                            {item.whatsapp || item.email}
                          </div>
                        )}
                        {item.message && (
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', marginTop: 4 }}>
                            "{item.message}"
                          </div>
                        )}
                      </td>
                      <td>
                        <span className={`rsvp-attendance-badge ${isAttending ? 'attending' : isDeclined ? 'declined' : 'unknown'}`}>
                          {isAttending ? '✓ Attending' : isDeclined ? '✕ Declined' : 'Neutral'}
                        </span>
                      </td>
                      <td style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-dark)' }}>
                        {isAttending ? `${item.guestCount || 1} Pax` : '-'}
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {item.session ? <span className="session-pill-tag">{item.session}</span> : '-'}
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {item.dietaryNote ? (
                          <span className="dietary-note-pill" title={item.dietaryNote}>
                            🥗 {item.dietaryNote}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-light)' }}>{dateStr}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="btn-icon-only rsvp-delete-btn"
                          onClick={() => {
                            if (confirm('Delete this RSVP entry?')) {
                              onDeleteRsvp(item.id)
                            }
                          }}
                          title="Delete response"
                        >
                          <HiOutlineTrash size={14} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

/* =========================================================================
   TAB: WISHES & PRAYERS MODERATION
   ========================================================================= */

function WishesTab({ invitation, rsvps, loading, onToggleVisibility, onDeleteRsvp }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [visibilityFilter, setVisibilityFilter] = useState('all') // 'all' | 'visible' | 'hidden'

  // Extract all entries that have a heartfelt message
  const wishesList = useMemo(() => {
    return (rsvps || []).filter(r => r.message && r.message.trim().length > 0)
  }, [rsvps])

  const filteredWishes = useMemo(() => {
    return wishesList.filter(w => {
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase()
        const matchesName = (w.name || '').toLowerCase().includes(q)
        const matchesMsg = (w.message || '').toLowerCase().includes(q)
        if (!matchesName && !matchesMsg) return false
      }
      if (visibilityFilter === 'visible' && w.isHidden) return false
      if (visibilityFilter === 'hidden' && !w.isHidden) return false
      return true
    })
  }, [wishesList, searchTerm, visibilityFilter])

  const visibleCount = wishesList.filter(w => !w.isHidden).length
  const hiddenCount = wishesList.filter(w => w.isHidden).length

  return (
    <div className="wishes-tab animate-fade-in-up">
      <div className="card" style={{ padding: 28 }}>
        <div className="card-header" style={{ marginBottom: 20 }}>
          <div>
            <h3 className="serif-italic" style={{ fontSize: '1.4rem', color: 'var(--olive)' }}>
              Wishes & Prayer Moderation
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
              Moderate and curate guest blessings. Hidden wishes remain stored here but will not render on the public invitation feed.
            </p>
          </div>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => {
              const csv = [
                ['Guest Name', 'Message', 'Visibility', 'Date'].join(','),
                ...filteredWishes.map(w => [
                  `"${(w.name || '').replace(/"/g, '""')}"`,
                  `"${(w.message || '').replace(/"/g, '""')}"`,
                  w.isHidden ? 'Hidden' : 'Public',
                  `"${w.sentAt || ''}"`
                ].join(','))
              ].join('\n')
              const blob = new Blob([csv], { type: 'text/csv' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `Wishes_${invitation?.title || 'Invitation'}.csv`
              a.click()
            }}
            disabled={filteredWishes.length === 0}
          >
            <HiOutlineDownload size={14} /> Export CSV
          </button>
        </div>

        {/* Moderation Metrics */}
        <div className="wishes-metrics-grid">
          <div className="wishes-metric-pill">
            <span className="pill-num">{wishesList.length}</span>
            <span className="pill-label">Total Received</span>
          </div>
          <div className="wishes-metric-pill green">
            <span className="pill-num">{visibleCount}</span>
            <span className="pill-label">Publicly Visible</span>
          </div>
          <div className="wishes-metric-pill amber">
            <span className="pill-num">{hiddenCount}</span>
            <span className="pill-label">Hidden / Moderated</span>
          </div>
        </div>

        {/* Filter bar */}
        <div className="crm-toolbar" style={{ marginTop: 20, marginBottom: 20 }}>
          <div className="toolbar-search">
            <HiOutlineSearch size={16} className="search-icon" />
            <input
              type="text"
              className="search-input"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search wishes by author name or message keywords..."
            />
          </div>

          <div className="toolbar-filters">
            <div className="filter-group">
              <span className="filter-label">Display Status:</span>
              <select
                className="filter-select"
                value={visibilityFilter}
                onChange={e => setVisibilityFilter(e.target.value)}
              >
                <option value="all">All Wishes</option>
                <option value="visible">Visible on Public Site</option>
                <option value="hidden">Hidden from Site</option>
              </select>
            </div>
          </div>
        </div>

        {/* Wishes Masonry Grid */}
        {loading ? (
          <p style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
            Loading wishes...
          </p>
        ) : filteredWishes.length === 0 ? (
          <div className="empty-state" style={{ padding: '48px 0', textAlign: 'center' }}>
            <HiOutlineHeart size={36} style={{ color: 'var(--text-light)', marginBottom: 12 }} />
            <h4 className="serif-italic" style={{ fontSize: '1.25rem' }}>No Wishes Found</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
              Guests can leave their heartfelt prayers and wishes directly through your digital invitation feed.
            </p>
          </div>
        ) : (
          <div className="wishes-masonry">
            {filteredWishes.map((item) => {
              let dateStr = 'Recent'
              if (item.sentAt) {
                try {
                  dateStr = new Date(item.sentAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                } catch {
                  dateStr = String(item.sentAt)
                }
              }

              return (
                <div key={item.id} className={`card wish-card ${item.isHidden ? 'is-moderated-hidden' : ''}`}>
                  <div className="wish-card-header">
                    <div className="wish-card-author">
                      <div className="wish-card-avatar">
                        {(item.name || 'G').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="wish-card-name">{item.name || 'Guest'}</div>
                        <div className="wish-card-time">{dateStr}</div>
                      </div>
                    </div>

                    <div className="wish-card-actions">
                      {/* Toggle Visibility Button */}
                      <button
                        type="button"
                        className={`btn-icon-only ${item.isHidden ? 'btn-unhide' : 'btn-hide'}`}
                        onClick={() => onToggleVisibility(item.id, !item.isHidden)}
                        title={item.isHidden ? 'Unhide: Show on public site' : 'Hide from public site'}
                      >
                        {item.isHidden ? <HiOutlineEye size={16} /> : <HiOutlineEyeOff size={16} />}
                      </button>

                      {/* Delete Button */}
                      <button
                        type="button"
                        className="btn-icon-only rsvp-delete-btn"
                        onClick={() => {
                          if (confirm('Permanently delete this wish?')) {
                            onDeleteRsvp(item.id)
                          }
                        }}
                        title="Delete wish permanently"
                      >
                        <HiOutlineTrash size={15} />
                      </button>
                    </div>
                  </div>

                  <p className="wish-card-message">{item.message}</p>

                  <div className="wish-card-footer">
                    {item.isHidden ? (
                      <span className="wish-status-badge hidden">
                        <HiOutlineEyeOff size={12} /> Hidden from Public
                      </span>
                    ) : (
                      <span className="wish-status-badge visible">
                        <HiOutlineEye size={12} /> Visible on Invitation
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

/* =========================================================================
   TAB: DASHBOARD OVERVIEW & ANALYTICS
   ========================================================================= */

function OverviewTab({
  invitation,
  rsvps,
  guests,
  analytics,
  onNavigateTab,
  onDeleteProject,
}) {
  const navigate = useNavigate()

  // Calculate metrics
  const totalViews = Number(analytics?.totalViews ?? invitation?.analytics?.totalViews ?? 0)
  
  // Unique visitors calculation
  const uniqueVisitorCount = useMemo(() => {
    if (!analytics?.views || analytics.views.length === 0) return totalViews
    const tokens = new Set()
    let anonCount = 0
    analytics.views.forEach(v => {
      if (v.guestToken) tokens.add(v.guestToken)
      else anonCount++
    })
    return tokens.size + anonCount
  }, [analytics, totalViews])

  const rsvpEntries = useMemo(() => {
    return (rsvps || []).filter(r => r.entryType === 'rsvp' || r.attendance !== null)
  }, [rsvps])

  const attendingList = rsvpEntries.filter(r => r.attendance === 'attending' || r.attendance === 'yes' || r.attendance === true)
  const declinedList = rsvpEntries.filter(r => r.attendance === 'declined' || r.attendance === 'no' || r.attendance === false)
  const confirmedPax = attendingList.reduce((sum, r) => sum + (Number(r.guestCount) || 1), 0)

  const responseRate = totalViews > 0 ? ((rsvpEntries.length / totalViews) * 100).toFixed(1) : 0

  // Checked-In metric
  const checkedInCount = guests.filter(g => g.checkedInAt).length
  const checkedInPax = guests.filter(g => g.checkedInAt).reduce((sum, g) => sum + (Number(g.checkedInPax) || Number(g.maxPax) || 1), 0)

  // Chart data
  const chartData = useMemo(() => {
    const attendingCount = attendingList.length
    const declinedCount = declinedList.length
    const pendingGuests = Math.max(0, guests.length - (attendingCount + declinedCount))
    
    return [
      { name: 'Attending', count: attendingCount, fill: '#344c2d' },
      { name: 'Declined', count: declinedCount, fill: '#9b3b52' },
      { name: 'Awaiting', count: pendingGuests, fill: '#c4a882' },
    ]
  }, [attendingList, declinedList, guests])

  // Session breakdown
  const sessionBreakdown = useMemo(() => {
    const map = {}
    rsvpEntries.forEach(r => {
      const s = r.session?.trim() || 'General Session'
      if (!map[s]) map[s] = { count: 0, pax: 0 }
      map[s].count++
      if (r.attendance === 'attending' || r.attendance === 'yes' || r.attendance === true) {
        map[s].pax += Number(r.guestCount) || 1
      }
    })
    return Object.entries(map).map(([sessionName, data]) => ({
      name: sessionName,
      ...data,
    }))
  }, [rsvpEntries])

  // Recent activity stream
  const recentActivities = useMemo(() => {
    const list = [];
    
    // Add RSVPs
    (rsvps || []).slice(0, 8).forEach(r => {
      const isAttending = r.attendance === 'attending' || r.attendance === 'yes' || r.attendance === true
      list.push({
        id: `rsvp-${r.id}`,
        time: r.sentAt || new Date().toISOString(),
        title: `${r.name || 'Guest'} confirmed attendance`,
        desc: isAttending ? `Attending (${r.guestCount || 1} pax)` : 'Declined invitation',
        type: isAttending ? 'check' : 'decline',
      })
    })

    // Add Check-ins
    guests.filter(g => g.checkedInAt).slice(0, 5).forEach(g => {
      list.push({
        id: `checkin-${g.id}`,
        time: g.checkedInAt,
        title: `${g.name} checked in at gate`,
        desc: `Table: ${g.tableName || 'General'} (${g.checkedInPax || g.maxPax || 1} pax)`,
        type: 'gate',
      })
    })

    return list.sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 6)
  }, [rsvps, guests])

  return (
    <div className="overview-tab-content animate-fade-in">
      {/* Top Stats Grid */}
      <div className="dash-stats stagger">
        <div className="stat-card">
          <span className="label-caps"><HiOutlineEye size={14} /> Total Views</span>
          <div className="stat-value">{totalViews.toLocaleString()}</div>
          <span className="stat-detail">{uniqueVisitorCount.toLocaleString()} unique visitors</span>
        </div>

        <div className="stat-card">
          <span className="label-caps"><HiOutlineMail size={14} /> RSVP Conversion</span>
          <div className="stat-value">{responseRate}%</div>
          <span className="stat-detail">{rsvpEntries.length} responses out of {totalViews} views</span>
        </div>

        <div className="stat-card">
          <span className="label-caps"><HiOutlineCheck size={14} /> Confirmed Pax</span>
          <div className="stat-value">{confirmedPax}</div>
          <span className="stat-detail">across {attendingList.length} confirmed parties</span>
        </div>

        <div className="stat-card">
          <span className="label-caps"><HiOutlineBadgeCheck size={14} /> Live Check-In</span>
          <div className="stat-value" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {checkedInCount} <span style={{ fontSize: 13, color: 'var(--text-light)', fontWeight: 500 }}>/ {guests.length}</span>
          </div>
          <span className="stat-badge">
            <span className="pulse-dot green" /> Gate Active ({checkedInPax} pax checked in)
          </span>
        </div>
      </div>

      {/* Analytics & Live Venue Operations */}
      <div className="dash-analytics-row">
        {/* Attendance Breakdown Bar Chart */}
        <div className="card analytics-card">
          <div className="analytics-header">
            <div>
              <h3 className="serif-italic" style={{ fontSize: '1.25rem' }}>Attendance Breakdown</h3>
              <span className="label-caps" style={{ fontSize: 10 }}>Confirmed vs Declined vs Awaiting</span>
            </div>
          </div>
          <div className="analytics-chart">
            {rsvpEntries.length > 0 || guests.length > 0 ? (
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
                <p className="serif-italic" style={{ color: 'var(--text-muted)', fontSize: 14 }}>No response data recorded yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Live Venue Operations & Scanner Launcher */}
        <div className="card venue-ops-card">
          <div className="venue-ops-header">
            <div>
              <h3 className="serif-italic" style={{ fontSize: '1.25rem' }}>Gate Check-In Stations</h3>
              <span className="label-caps" style={{ fontSize: 10 }}>Live Reception & Welcome Display</span>
            </div>
            <span className="live-status-pill">
              <span className="pulse-dot green" /> Operational
            </span>
          </div>

          <div className="venue-progress-box">
            <div className="venue-progress-info">
              <span>Venue Guest Attendance</span>
              <strong>{guests.length > 0 ? Math.round((checkedInCount / guests.length) * 100) : 0}%</strong>
            </div>
            <div className="venue-track">
              <div
                className="venue-fill"
                style={{ width: `${guests.length > 0 ? (checkedInCount / guests.length) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* Action Launch Buttons */}
          <div className="venue-launch-buttons">
            <button
              className="btn btn-primary btn-full venue-btn"
              onClick={() => window.open(`/checkin/${invitation?.id}`, '_blank')}
            >
              <HiOutlineQrcode size={18} /> Open QR Check-In Scanner
            </button>
            <button
              className="btn btn-outline btn-full venue-btn"
              onClick={() => window.open(`/welcome/${invitation?.id}`, '_blank')}
            >
              <HiOutlineDesktopComputer size={18} /> Launch Welcome Display
            </button>
          </div>

          <p style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 12, textAlign: 'center' }}>
            Connect check-in phones to scan entry passes; results appear on the Welcome Display in real time.
          </p>
        </div>
      </div>

      {/* Session Breakdown & Recent Activity */}
      <div className="dash-bottom-grid" style={{ marginTop: 24 }}>
        {/* Session breakdown */}
        <div className="card session-breakdown-card">
          <div className="card-header" style={{ marginBottom: 14 }}>
            <h4 className="serif-italic" style={{ fontSize: '1.2rem' }}>Session Breakdown</h4>
            <span className="label-caps" style={{ fontSize: 10 }}>Allocated Pax</span>
          </div>
          {sessionBreakdown.length > 0 ? (
            <div className="session-cards-list">
              {sessionBreakdown.map(sess => (
                <div key={sess.name} className="session-item-row">
                  <div className="session-item-left">
                    <span className="session-title">{sess.name}</span>
                    <span className="session-pax-count">{sess.count} parties responded</span>
                  </div>
                  <div className="session-item-right">
                    <span className="session-confirmed-badge">{sess.pax} Confirmed Pax</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-light)', fontSize: 13, fontStyle: 'italic', padding: '16px 0' }}>
              No session responses logged yet.
            </p>
          )}
        </div>

        {/* Activity feed */}
        <div className="card activity-card">
          <div className="card-header" style={{ marginBottom: 14 }}>
            <h4 className="serif-italic" style={{ fontSize: '1.2rem' }}>Recent Activity Feed</h4>
            <span className="label-caps" style={{ fontSize: 10 }}>Real-time stream</span>
          </div>
          <div className="activity-list">
            {recentActivities.length > 0 ? (
              recentActivities.map(act => (
                <div key={act.id} className="activity-item">
                  <div className={`activity-icon-badge ${act.type}`}>
                    {act.type === 'check' ? '✓' : act.type === 'gate' ? '🎫' : '✕'}
                  </div>
                  <div className="activity-content">
                    <p><strong>{act.title}</strong> — {act.desc}</p>
                    <span className="label-caps" style={{ fontSize: 9 }}>
                      {new Date(act.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p style={{ color: 'var(--text-light)', fontSize: 13, fontStyle: 'italic', padding: '16px 0' }}>
                No recent activity logged yet.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Action Bar for Current Project */}
      <div className="dash-projects" style={{ marginTop: 36 }}>
        <div className="projects-header">
          <h2 className="serif-italic" style={{ fontSize: '1.35rem' }}>Invitation Quick Controls</h2>
        </div>
        <div className="card action-bar">
          <div
            className="action-bar-preview"
            style={{
              background: invitation?.theme?.backgroundColor || '#EDE9E7',
              minHeight: 100,
            }}
          >
            <span className={`badge ${invitation?.status === 'published' ? 'badge-published' : 'badge-draft'}`}>
              {invitation?.status === 'published' ? 'Published' : 'Draft'}
            </span>
            <div
              className="project-thumb-content serif-italic"
              style={{ color: invitation?.theme?.primaryColor || '#565F34', fontSize: '1rem' }}
            >
              {invitation?.title || 'Untitled'}
            </div>
          </div>
          <div className="action-bar-info">
            <div className="action-bar-title serif-italic">{invitation?.title || 'Untitled'}</div>
            <div className="action-bar-meta">
              {invitation?.status === 'published' ? '🟢 Published & Live on the Web' : '📝 Draft — Private & In Progress'}
            </div>
            <div className="project-actions">
              <button className="btn btn-outline btn-sm" onClick={() => navigate(`/editor/${invitation?.id}`)}>
                <HiOutlinePencil size={14} /> Edit Design
              </button>
              {invitation?.status === 'published' && (
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => window.open(`/undangan/${invitation?.slug}`, '_blank')}
                >
                  <HiOutlineExternalLink size={14} /> View Site
                </button>
              )}
              <button
                className="btn btn-outline btn-sm"
                onClick={() => onNavigateTab('guests')}
              >
                <HiOutlineUserGroup size={14} /> Manage Guests ({guests.length})
              </button>
              <button
                className="project-delete"
                onClick={() => onDeleteProject(invitation?.id)}
                title="Delete invitation"
              >
                <HiOutlineTrash size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* =========================================================================
   MAIN COMPONENT: DASHBOARD PAGE (/admin)
   ========================================================================= */

export default function DashboardPage() {
  const { user } = useAuth()
  const {
    invitations,
    loading,
    deleteInvitation,
    addInvitation,
    deleteRsvp,
    toggleWishVisibility,
    fetchInvitationRsvps,
    fetchGuests,
    fetchInvitationAnalytics,
  } = useInvitations()

  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedInvId, setSelectedInvId] = useState(searchParams.get('inv') || '')
  
  // Data for active invitation
  const [activeRsvps, setActiveRsvps] = useState([])
  const [rsvpsLoading, setRsvpsLoading] = useState(false)
  const [activeGuests, setActiveGuests] = useState([])
  const [guestsLoading, setGuestsLoading] = useState(false)
  const [analyticsData, setAnalyticsData] = useState({ views: [], totalViews: 0 })

  const rawTab = searchParams.get('tab') || 'overview'
  const activeTab = rawTab

  // Synchronize selected invitation with URL
  useEffect(() => {
    if (invitations.length === 0) {
      if (selectedInvId !== '') setSelectedInvId('')
      return
    }
    const paramInvId = searchParams.get('inv')
    const isValidId = invitations.some(i => i.id === paramInvId)
    if (paramInvId && isValidId) {
      if (paramInvId !== selectedInvId) setSelectedInvId(paramInvId)
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

  // Fetch all related data for selected invitation
  const loadInvitationData = useCallback(async (invId) => {
    if (!invId) return
    setRsvpsLoading(true)
    setGuestsLoading(true)

    try {
      const [rsvpsRes, guestsRes, analyticsRes] = await Promise.all([
        fetchInvitationRsvps(invId),
        fetchGuests(invId),
        fetchInvitationAnalytics(invId),
      ])
      setActiveRsvps(rsvpsRes || [])
      setActiveGuests(guestsRes || [])
      setAnalyticsData(analyticsRes || { views: [], totalViews: 0 })
    } catch (err) {
      console.error('Error loading invitation data:', err)
    } finally {
      setRsvpsLoading(false)
      setGuestsLoading(false)
    }
  }, [fetchInvitationRsvps, fetchGuests, fetchInvitationAnalytics])

  useEffect(() => {
    if (selectedInv?.id) {
      loadInvitationData(selectedInv.id)
    }
  }, [selectedInv?.id, loadInvitationData])

  // Delete Project Handling
  const [pendingDelete, setPendingDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const handleDeleteClick = (id) => {
    if (!id || deleting) return
    const target = invitations.find(inv => inv.id === id) || { id, title: 'this project' }
    setPendingDelete(target)
  }

  const confirmDelete = async () => {
    if (!pendingDelete || deleting) return
    const targetId = pendingDelete.id
    setDeleting(true)
    setPendingDelete(null)

    const remaining = invitations.filter(inv => inv.id !== targetId)
    const nextId = remaining.length > 0 ? remaining[0].id : ''

    if (selectedInvId === targetId) {
      setSelectedInvId(nextId)
      const params = new URLSearchParams(searchParams)
      if (nextId) params.set('inv', nextId)
      else params.delete('inv')
      setSearchParams(params, { replace: true })
    }

    try {
      await deleteInvitation(targetId)
    } catch (err) {
      console.error('Error deleting invitation:', err)
    } finally {
      setDeleting(false)
    }
  }

  // Create Invitation Handling
  const handleCreateInvitation = async (title, presetKey = 'wedding', customPalette = null) => {
    const preset = PRESETS[presetKey] || PRESETS.custom
    const paletteToUse = customPalette || preset.theme || {}

    const generatedBlocks = typeof preset.buildBlocks === 'function'
      ? preset.buildBlocks(paletteToUse)
      : (preset.blocks || [])

    const blocksToCreate = generatedBlocks.map(b => {
      if (b.type === 'cover' || b.type === 'footer') {
        return { ...b, data: { ...b.data, coupleName: title } }
      }
      if (b.type === 'desktopHero') {
        return { ...b, data: { ...b.data, title } }
      }
      return b
    })

    const themeToSave = {
      ...(preset.theme || {}),
      ...paletteToUse,
    }

    const newInv = await addInvitation({
      title,
      category: preset.labelId || 'Wedding',
      theme: themeToSave,
      initialBlocks: blocksToCreate,
    })

    if (!newInv) {
      throw new Error('Failed to create invitation project. Please check your network.')
    }

    setSelectedInvId(newInv.id)
    const params = new URLSearchParams(searchParams)
    params.set('inv', newInv.id)
    setSearchParams(params, { replace: true })
    setShowCreateModal(false)

    navigate(`/editor/${newInv.id}`)
  }

  if (loading && invitations.length === 0) {
    return (
      <div className="dashboard animate-fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p className="serif-italic" style={{ color: 'var(--olive)', marginTop: 16 }}>Loading your projects...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard animate-fade-in">
      {/* Header with Welcome & Project Selector */}
      <div className="dash-header">
        <div className="dash-header-left">
          <h1 className="serif-italic dash-welcome">Welcome, {user?.name || 'Studio Member'}</h1>
          <p className="dash-subtitle">Manage your digital invitations, guest lists, and venue operations.</p>
        </div>

        <div className="dash-profile">
          {invitations.length > 0 && selectedInv && (
            <div className="dash-inv-selector-wrapper" style={{ minWidth: 240 }}>
              <span className="label-caps" style={{ fontSize: 10, display: 'block', marginBottom: 6, color: 'var(--olive)', fontWeight: 600 }}>
                Selected Project
              </span>
              <div style={{ position: 'relative' }}>
                <select
                  className="settings-input"
                  value={selectedInvId}
                  onChange={handleInvChange}
                  style={{ width: '100%', paddingRight: 36, fontWeight: 600, height: 44 }}
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
            className="btn btn-primary dash-create-btn"
            onClick={() => setShowCreateModal(true)}
          >
            <HiOutlinePlus size={18} /> Create New
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      {invitations.length > 0 && selectedInv && (
        <div className="dash-tabs">
          {[
            { id: 'overview', label: 'Overview', icon: HiOutlineViewGrid },
            { id: 'rsvps', label: 'RSVPs', icon: HiOutlineMail },
            { id: 'wishes', label: 'Wishes', icon: HiOutlineHeart },
            { id: 'guests', label: 'Guest CRM', icon: HiOutlineUserGroup },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`dash-tab-btn ${activeTab === t.id ? 'active' : ''}`}
            >
              <t.icon size={16} />
              <span className="tab-label-text">{t.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Tab Contents */}
      {invitations.length === 0 ? (
        <div className="empty-state card" style={{ padding: '64px 20px', textAlign: 'center' }}>
          <div className="project-new-icon" style={{ margin: '0 auto 16px auto' }}><HiOutlinePlus size={32} /></div>
          <h2 className="serif-italic" style={{ fontSize: '1.6rem', marginBottom: 8 }}>No Invitations Yet</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>
            Create your first digital invitation to unlock guest management, QR passes, and live reception check-in.
          </p>
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            Create New Invitation
          </button>
        </div>
      ) : activeTab === 'overview' ? (
        <OverviewTab
          invitation={selectedInv}
          rsvps={activeRsvps}
          guests={activeGuests}
          analytics={analyticsData}
          onNavigateTab={setTab}
          onDeleteProject={handleDeleteClick}
        />
      ) : activeTab === 'rsvps' ? (
        <RsvpsTab
          invitation={selectedInv}
          rsvps={activeRsvps}
          loading={rsvpsLoading}
          onDeleteRsvp={async (rsvpId) => {
            const ok = await deleteRsvp(rsvpId)
            if (ok) setActiveRsvps(prev => prev.filter(r => r.id !== rsvpId))
          }}
        />
      ) : activeTab === 'wishes' ? (
        <WishesTab
          invitation={selectedInv}
          rsvps={activeRsvps}
          loading={rsvpsLoading}
          onToggleVisibility={async (rsvpId, nextHidden) => {
            const ok = await toggleWishVisibility(rsvpId, nextHidden)
            if (ok) {
              setActiveRsvps(prev => prev.map(r => (r.id === rsvpId ? { ...r, isHidden: nextHidden } : r)))
            }
          }}
          onDeleteRsvp={async (rsvpId) => {
            const ok = await deleteRsvp(rsvpId)
            if (ok) setActiveRsvps(prev => prev.filter(r => r.id !== rsvpId))
          }}
        />
      ) : activeTab === 'guests' ? (
        <GuestListTab
          invitation={selectedInv}
          guests={activeGuests}
          setGuests={setActiveGuests}
          loading={guestsLoading}
          onRefresh={() => loadInvitationData(selectedInv.id)}
        />
      ) : null}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateInvitationModal
          onClose={() => setShowCreateModal(false)}
          onSelect={handleCreateInvitation}
        />
      )}

      {/* Delete Confirmation Modal */}
      {pendingDelete && (
        <div className="confirm-overlay" onClick={() => !deleting && setPendingDelete(null)}>
          <div className="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" onClick={e => e.stopPropagation()}>
            <h3 id="confirm-title">Delete "{pendingDelete.title}"?</h3>
            <p>
              All guests, RSVP responses, and wishes associated with this invitation will be permanently deleted. This action cannot be reversed.
            </p>
            <div className="confirm-actions">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setPendingDelete(null)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="confirm-danger"
                onClick={confirmDelete}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete Invitation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

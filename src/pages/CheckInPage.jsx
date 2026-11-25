import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import jsQR from 'jsqr'
import {
  HiOutlineQrcode,
  HiOutlineCamera,
  HiOutlineStop,
  HiOutlineRefresh,
  HiOutlineSearch,
  HiOutlineCheckCircle,
  HiOutlineExclamation,
  HiOutlineUserGroup,
  HiOutlineSparkles,
  HiOutlineDesktopComputer,
  HiOutlineArrowLeft,
  HiOutlineGift,
  HiOutlineX,
} from 'react-icons/hi'
import { useInvitations } from '../contexts/InvitationContext'
import { supabase, isConfigured } from '../lib/supabase'
import { parsePassQrValue } from '../utils/qr'
import { DEMO_INVITATION_SLUGS, getDemoInvitationBySlug } from '../utils/presets'
import '../index.css'
import './CheckInPage.css'

const CHECKIN_CHANNEL = 'invori-checkin'
const CHECKIN_STORAGE_KEY = 'invori_checkin_event'

function resolveDemoInvitation(idOrSlug) {
  const bySlug = getDemoInvitationBySlug(idOrSlug)
  if (bySlug) return bySlug
  for (const slug of DEMO_INVITATION_SLUGS) {
    const demo = getDemoInvitationBySlug(slug)
    if (demo && demo.id === idOrSlug) return demo
  }
  return null
}

function playCheckInTone(isSuccess = true) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = isSuccess ? 'sine' : 'triangle'
    osc.frequency.setValueAtTime(isSuccess ? 660 : 280, ctx.currentTime)
    if (isSuccess) {
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12)
    }
    gain.gain.setValueAtTime(0.08, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.26)
  } catch {
    // Ignore audio context errors on restricted browsers
  }
}

export default function CheckInPage() {
  const { id } = useParams()
  const { invitations, fetchGuests, checkInGuest } = useInvitations()

  const [invitation, setInvitation] = useState(null)
  const [guests, setGuests] = useState([])
  const [loading, setLoading] = useState(true)

  // Scanner state
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const [facingMode, setFacingMode] = useState('environment')
  const [autoCheckIn, setAutoCheckIn] = useState(false)
  const [manualToken, setManualToken] = useState('')

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [groupFilter, setGroupFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('all')

  // Active confirmation / feedback state
  const [pendingGuest, setPendingGuest] = useState(null)
  const [paxInput, setPaxInput] = useState(1)
  const [souvenirInput, setSouvenirInput] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [banner, setBanner] = useState(null) // { type: 'success' | 'warning' | 'error', title, detail, guest }

  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const rafRef = useRef(null)
  const lastScanRef = useRef({ raw: '', at: 0 })
  const channelRef = useRef(null)

  const resolvedInvId = invitation?.id || id

  // Setup BroadcastChannel
  useEffect(() => {
    if (typeof BroadcastChannel !== 'undefined') {
      channelRef.current = new BroadcastChannel(CHECKIN_CHANNEL)
    }
    return () => {
      channelRef.current?.close()
    }
  }, [])

  const broadcastCheckIn = useCallback((guestObj) => {
    const payload = {
      type: 'guest-checked-in',
      invitationId: resolvedInvId,
      invitationTitle: invitation?.title || 'Celebration',
      guest: guestObj,
      timestamp: Date.now(),
    }

    if (channelRef.current) {
      try {
        channelRef.current.postMessage(payload)
      } catch {
        // Ignore broadcast error
      }
    }

    try {
      window.localStorage.setItem(CHECKIN_STORAGE_KEY, JSON.stringify(payload))
    } catch {
      // Ignore storage quota error
    }

    if (isConfigured && resolvedInvId) {
      try {
        const rtChannel = supabase.channel(`invori-checkin-${resolvedInvId}`)
        rtChannel.subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            rtChannel.send({ type: 'broadcast', event: 'guest-checked-in', payload })
            setTimeout(() => supabase.removeChannel(rtChannel), 1000)
          }
        })
      } catch {
        // Ignore realtime broadcast errors
      }
    }
  }, [resolvedInvId, invitation?.title])

  // Load invitation and guests
  useEffect(() => {
    let cancelled = false
    const loadData = async () => {
      setLoading(true)
      let foundInv = invitations.find(i => i.id === id || i.slug === id) || null

      if (!foundInv) {
        foundInv = resolveDemoInvitation(id)
      }

      if (!foundInv && isConfigured) {
        try {
          const { data } = await supabase
            .from('invitations')
            .select('id, title, slug, category, primary_color, background_color')
            .or(`id.eq.${id},slug.eq.${id}`)
            .maybeSingle()
          if (data) {
            foundInv = {
              id: data.id,
              title: data.title,
              slug: data.slug,
              category: data.category,
              theme: {
                primaryColor: data.primary_color,
                backgroundColor: data.background_color,
              },
            }
          }
        } catch {
          // Ignore lookup error
        }
      }

      if (cancelled) return
      setInvitation(foundInv || { id, title: 'Event Check-In Desk', slug: id })

      const targetId = foundInv?.id || id
      const loadedGuests = await fetchGuests(targetId)
      if (!cancelled) {
        setGuests(loadedGuests)
        setLoading(false)
      }
    }
    loadData()
    return () => { cancelled = true }
  }, [id, invitations, fetchGuests])

  const stopCamera = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setCameraActive(false)
  }, [])

  useEffect(() => {
    return () => stopCamera()
  }, [stopCamera])

  const executeCheckIn = useCallback(async ({ guest, passToken, pax, souvenir }) => {
    setIsSubmitting(true)
    try {
      const result = await checkInGuest({
        invitationId: resolvedInvId,
        guestId: guest?.id || undefined,
        passToken: passToken || guest?.passToken || undefined,
        checkedInPax: pax,
        souvenirClaimed: souvenir,
      })

      if (result.alreadyCheckedIn) {
        playCheckInTone(false)
        setBanner({
          type: 'warning',
          title: 'Duplicate Check-In Prevented',
          detail: `${result.guest?.name || guest?.name || 'This guest'} already checked in at ${
            result.guest?.checkedInAt
              ? new Date(result.guest.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : 'an earlier time'
          }.`,
          guest: result.guest || guest,
        })
        if (result.guest) {
          setGuests(prev => prev.map(g => (g.id === result.guest.id ? result.guest : g)))
        }
        setPendingGuest(null)
        return
      }

      if (!result.success) {
        playCheckInTone(false)
        setBanner({
          type: 'error',
          title: 'Pass Not Recognized',
          detail: result.error || 'No matching guest pass was found for this event.',
          guest: null,
        })
        return
      }

      playCheckInTone(true)
      const checkedGuest = result.guest
      setGuests(prev => {
        const exists = prev.some(g => g.id === checkedGuest.id)
        return exists ? prev.map(g => (g.id === checkedGuest.id ? checkedGuest : g)) : [checkedGuest, ...prev]
      })
      setPendingGuest(null)
      setBanner({
        type: 'success',
        title: `Checked In: ${checkedGuest.name}`,
        detail: `${checkedGuest.checkedInPax || 1} ${(checkedGuest.checkedInPax || 1) === 1 ? 'guest' : 'guests'} • ${checkedGuest.groupName || 'Regular'}${checkedGuest.tableName ? ` • ${checkedGuest.tableName}` : ''}`,
        guest: checkedGuest,
      })
      broadcastCheckIn(checkedGuest)
    } finally {
      setIsSubmitting(false)
    }
  }, [checkInGuest, resolvedInvId, broadcastCheckIn])

  const handleQrDecoded = useCallback((rawText) => {
    const now = Date.now()
    if (lastScanRef.current.raw === rawText && now - lastScanRef.current.at < 2600) {
      return
    }
    lastScanRef.current = { raw: rawText, at: now }

    const parsed = parsePassQrValue(rawText)
    const tokenUpper = parsed.passToken.toUpperCase()
    const nameLower = parsed.guestName.toLowerCase()

    const matched = guests.find(g => {
      if (parsed.guestId && g.id === parsed.guestId) return true
      if (tokenUpper && (g.passToken || '').toUpperCase() === tokenUpper) return true
      if (nameLower && (g.name || '').trim().toLowerCase() === nameLower) return true
      return false
    })

    if (matched) {
      if (matched.checkedInAt) {
        playCheckInTone(false)
        setBanner({
          type: 'warning',
          title: 'Duplicate Check-In Prevented',
          detail: `${matched.name} already checked in at ${new Date(matched.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
          guest: matched,
        })
        return
      }

      if (autoCheckIn) {
        executeCheckIn({
          guest: matched,
          passToken: matched.passToken,
          pax: matched.maxPax || 1,
          souvenir: false,
        })
      } else {
        playCheckInTone(true)
        setPendingGuest(matched)
        setPaxInput(matched.maxPax || 1)
        setSouvenirInput(false)
        setBanner(null)
      }
      return
    }

    // If not in preloaded array, still attempt DB lookup via passToken or guestId
    if (parsed.passToken || parsed.guestId) {
      executeCheckIn({
        guest: parsed.guestId ? { id: parsed.guestId } : null,
        passToken: parsed.passToken,
        pax: 1,
        souvenir: false,
      })
    } else {
      playCheckInTone(false)
      setBanner({
        type: 'error',
        title: 'Guest Not Found',
        detail: parsed.guestName
          ? `Could not find "${parsed.guestName}" on this event's guest list.`
          : 'The scanned QR code does not match an Invori entry pass.',
        guest: null,
      })
    }
  }, [guests, autoCheckIn, executeCheckIn])

  const startCamera = useCallback(async (requestedFacing = facingMode) => {
    setCameraError('')
    stopCamera()

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Camera access is not supported in this browser. Use manual search or token entry.')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: requestedFacing },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      })

      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setCameraActive(true)

      const detector = typeof window !== 'undefined' && 'BarcodeDetector' in window
        ? new window.BarcodeDetector({ formats: ['qr_code'] })
        : null

      let lastTick = 0
      const scanFrame = async (timestamp) => {
        if (!streamRef.current || !videoRef.current) return
        if (timestamp - lastTick >= 150 && videoRef.current.readyState >= 2) {
          lastTick = timestamp
          const video = videoRef.current

          if (detector) {
            try {
              const codes = await detector.detect(video)
              if (codes.length > 0 && codes[0].rawValue) {
                handleQrDecoded(codes[0].rawValue)
              }
            } catch {
              // Fall through to jsQR
            }
          }

          const canvas = canvasRef.current
          if (canvas && video.videoWidth > 0 && video.videoHeight > 0) {
            canvas.width = video.videoWidth
            canvas.height = video.videoHeight
            const ctx = canvas.getContext('2d', { willReadFrequently: true })
            if (ctx) {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
              const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
              const qrResult = jsQR(imgData.data, imgData.width, imgData.height, {
                inversionAttempts: 'dontInvert',
              })
              if (qrResult?.data) {
                handleQrDecoded(qrResult.data)
              }
            }
          }
        }
        rafRef.current = requestAnimationFrame(scanFrame)
      }

      rafRef.current = requestAnimationFrame(scanFrame)
    } catch (err) {
      setCameraError(
        err?.name === 'NotAllowedError'
          ? 'Camera permission was denied. Please allow camera access or use manual search below.'
          : 'Unable to start the camera. Verify no other app is using it, or use manual check-in.'
      )
      setCameraActive(false)
    }
  }, [facingMode, stopCamera, handleQrDecoded])

  const toggleFacingMode = () => {
    const next = facingMode === 'environment' ? 'user' : 'environment'
    setFacingMode(next)
    if (cameraActive) {
      startCamera(next)
    }
  }

  const handleManualTokenSubmit = (e) => {
    e.preventDefault()
    if (!manualToken.trim()) return
    handleQrDecoded(manualToken.trim())
    setManualToken('')
  }

  const openManualCheckIn = (guest) => {
    if (guest.checkedInAt) {
      setBanner({
        type: 'warning',
        title: 'Already Checked In',
        detail: `${guest.name} checked in at ${new Date(guest.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (${guest.checkedInPax || 1} pax).`,
        guest,
      })
      return
    }
    setPendingGuest(guest)
    setPaxInput(guest.maxPax || 1)
    setSouvenirInput(false)
    setBanner(null)
  }

  // Stats & Filtered List
  const stats = useMemo(() => {
    const total = guests.length
    const checkedIn = guests.filter(g => Boolean(g.checkedInAt)).length
    const totalPaxArrived = guests.reduce((sum, g) => sum + (g.checkedInAt ? (Number(g.checkedInPax) || 1) : 0), 0)
    return {
      total,
      checkedIn,
      pending: Math.max(0, total - checkedIn),
      totalPaxArrived,
    }
  }, [guests])

  const filteredGuests = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return guests.filter(g => {
      if (groupFilter !== 'All' && (g.groupName || 'Regular') !== groupFilter) return false
      if (statusFilter === 'pending' && g.checkedInAt) return false
      if (statusFilter === 'checked-in' && !g.checkedInAt) return false
      if (!q) return true
      return (
        (g.name || '').toLowerCase().includes(q) ||
        (g.phone || '').toLowerCase().includes(q) ||
        (g.tableName || '').toLowerCase().includes(q) ||
        (g.passToken || '').toLowerCase().includes(q)
      )
    })
  }, [guests, searchQuery, groupFilter, statusFilter])

  return (
    <div className="checkin-page">
      <header className="checkin-topbar">
        <div className="checkin-topbar-left">
          <Link to="/admin" className="checkin-back-btn">
            <HiOutlineArrowLeft size={18} />
            <span>Studio</span>
          </Link>
          <div>
            <span className="checkin-kicker">RECEPTION CHECK-IN DESK</span>
            <h1 className="serif-italic checkin-title">{invitation?.title || 'Guest Check-In'}</h1>
          </div>
        </div>

        <div className="checkin-topbar-actions">
          <Link
            to={`/welcome/${resolvedInvId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="checkin-welcome-link"
          >
            <HiOutlineDesktopComputer size={17} />
            <span>Open Welcome Display</span>
          </Link>
        </div>
      </header>

      <section className="checkin-stats-grid" aria-label="Check-in summary">
        <div className="checkin-stat-card">
          <span className="checkin-stat-label">Invited Guests</span>
          <strong className="checkin-stat-value">{stats.total}</strong>
        </div>
        <div className="checkin-stat-card checkin-stat-card--accent">
          <span className="checkin-stat-label">Checked In</span>
          <strong className="checkin-stat-value">{stats.checkedIn}</strong>
        </div>
        <div className="checkin-stat-card">
          <span className="checkin-stat-label">Remaining</span>
          <strong className="checkin-stat-value">{stats.pending}</strong>
        </div>
        <div className="checkin-stat-card">
          <span className="checkin-stat-label">Guests Arrived (Pax)</span>
          <strong className="checkin-stat-value">{stats.totalPaxArrived}</strong>
        </div>
      </section>

      <main className="checkin-workspace">
        {/* Left: QR Camera Scanner + Confirmation */}
        <section className="checkin-scanner-panel">
          <div className="checkin-panel-header">
            <div>
              <h2><HiOutlineQrcode size={20} /> QR Pass Scanner</h2>
              <p>Scan guest e-ticket QR codes or enter a pass token manually.</p>
            </div>
            <label className="checkin-auto-toggle">
              <input
                type="checkbox"
                checked={autoCheckIn}
                onChange={e => setAutoCheckIn(e.target.checked)}
              />
              <span>Instant Auto Check-In</span>
            </label>
          </div>

          <div className="checkin-viewfinder">
            <video ref={videoRef} className={`checkin-video ${cameraActive ? 'is-live' : ''}`} playsInline muted />
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            {cameraActive ? (
              <div className="checkin-reticle" aria-hidden="true">
                <span className="reticle-corner tl" />
                <span className="reticle-corner tr" />
                <span className="reticle-corner bl" />
                <span className="reticle-corner br" />
                <div className="reticle-laser" />
              </div>
            ) : (
              <div className="checkin-camera-idle">
                <div className="checkin-camera-icon">
                  <HiOutlineCamera size={32} />
                </div>
                <p>{cameraError || 'Camera is paused. Start the scanner to read guest QR passes.'}</p>
                <button type="button" className="checkin-primary-btn" onClick={() => startCamera()}>
                  <HiOutlineCamera size={18} /> Start Camera Scanner
                </button>
              </div>
            )}
          </div>

          <div className="checkin-camera-controls">
            {cameraActive ? (
              <>
                <button type="button" className="checkin-secondary-btn" onClick={stopCamera}>
                  <HiOutlineStop size={16} /> Stop Camera
                </button>
                <button type="button" className="checkin-secondary-btn" onClick={toggleFacingMode}>
                  <HiOutlineRefresh size={16} /> Switch Camera
                </button>
              </>
            ) : (
              <button type="button" className="checkin-secondary-btn" onClick={() => startCamera()}>
                <HiOutlineCamera size={16} /> Enable Camera
              </button>
            )}
          </div>

          <form className="checkin-token-form" onSubmit={handleManualTokenSubmit}>
            <input
              type="text"
              className="checkin-input"
              placeholder="Scan or type pass token (e.g. INV-8K4P2M9Q)..."
              value={manualToken}
              onChange={e => setManualToken(e.target.value)}
            />
            <button type="submit" className="checkin-primary-btn" disabled={!manualToken.trim()}>
              Verify Pass
            </button>
          </form>

          {banner && (
            <div className={`checkin-banner checkin-banner--${banner.type}`} role="status">
              <div className="checkin-banner-icon">
                {banner.type === 'success' ? <HiOutlineCheckCircle size={22} /> : <HiOutlineExclamation size={22} />}
              </div>
              <div className="checkin-banner-body">
                <strong>{banner.title}</strong>
                <p>{banner.detail}</p>
              </div>
              <button type="button" className="checkin-banner-close" onClick={() => setBanner(null)} aria-label="Dismiss alert">
                <HiOutlineX size={16} />
              </button>
            </div>
          )}

          {pendingGuest && (
            <div className="checkin-confirm-card">
              <div className="checkin-confirm-top">
                <div>
                  <span className={`checkin-group-pill group-${(pendingGuest.groupName || 'Regular').toLowerCase()}`}>
                    {pendingGuest.groupName || 'Regular'}
                  </span>
                  <h3 className="serif-italic">{pendingGuest.name}</h3>
                  <p className="checkin-confirm-meta">
                    {pendingGuest.tableName ? `Table: ${pendingGuest.tableName}` : 'Open Seating'} • Pass #{pendingGuest.passToken || 'N/A'}
                  </p>
                </div>
                <button type="button" className="checkin-icon-close" onClick={() => setPendingGuest(null)} aria-label="Cancel">
                  <HiOutlineX size={18} />
                </button>
              </div>

              <div className="checkin-confirm-controls">
                <div className="checkin-pax-picker">
                  <span>Arriving Pax (Max {pendingGuest.maxPax || 2})</span>
                  <div className="checkin-pax-stepper">
                    <button type="button" onClick={() => setPaxInput(p => Math.max(1, p - 1))} aria-label="Decrease pax">−</button>
                    <strong>{paxInput}</strong>
                    <button type="button" onClick={() => setPaxInput(p => Math.min(20, p + 1))} aria-label="Increase pax">+</button>
                  </div>
                </div>

                <label className="checkin-souvenir-check">
                  <input
                    type="checkbox"
                    checked={souvenirInput}
                    onChange={e => setSouvenirInput(e.target.checked)}
                  />
                  <HiOutlineGift size={16} />
                  <span>Souvenir Claimed</span>
                </label>
              </div>

              <div className="checkin-confirm-actions">
                <button type="button" className="checkin-secondary-btn" onClick={() => setPendingGuest(null)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="checkin-primary-btn"
                  disabled={isSubmitting}
                  onClick={() => executeCheckIn({
                    guest: pendingGuest,
                    passToken: pendingGuest.passToken,
                    pax: paxInput,
                    souvenir: souvenirInput,
                  })}
                >
                  <HiOutlineSparkles size={16} />
                  {isSubmitting ? 'Checking In...' : 'Confirm Check-In'}
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Right: Manual Search & Guest Directory */}
        <section className="checkin-directory-panel">
          <div className="checkin-panel-header">
            <div>
              <h2><HiOutlineUserGroup size={20} /> Guest Directory</h2>
              <p>Search by guest name, table, phone, or pass token.</p>
            </div>
          </div>

          <div className="checkin-search-bar">
            <HiOutlineSearch size={18} className="checkin-search-icon" />
            <input
              type="search"
              className="checkin-input checkin-search-input"
              placeholder="Search guest name, table, or pass..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="checkin-filters-row">
            <div className="checkin-filter-pills">
              {['All', 'VIP', 'Family', 'Regular'].map(grp => (
                <button
                  key={grp}
                  type="button"
                  className={`checkin-filter-pill ${groupFilter === grp ? 'active' : ''}`}
                  onClick={() => setGroupFilter(grp)}
                >
                  {grp}
                </button>
              ))}
            </div>
            <div className="checkin-filter-pills">
              {[
                { key: 'all', label: 'All' },
                { key: 'pending', label: 'Pending' },
                { key: 'checked-in', label: 'Arrived' },
              ].map(st => (
                <button
                  key={st.key}
                  type="button"
                  className={`checkin-filter-pill ${statusFilter === st.key ? 'active' : ''}`}
                  onClick={() => setStatusFilter(st.key)}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          <div className="checkin-guest-list">
            {loading ? (
              <div className="checkin-empty-state">Loading guest list...</div>
            ) : filteredGuests.length === 0 ? (
              <div className="checkin-empty-state">
                {guests.length === 0
                  ? 'No guests registered for this invitation yet. Add guests in your Dashboard or scan a personalized guest QR code.'
                  : 'No guests match your current search or filters.'}
              </div>
            ) : (
              filteredGuests.map(guest => {
                const isCheckedIn = Boolean(guest.checkedInAt)
                return (
                  <div key={guest.id} className={`checkin-guest-row ${isCheckedIn ? 'is-checked-in' : ''}`}>
                    <div className="checkin-guest-main">
                      <div className="checkin-guest-name-line">
                        <strong>{guest.name}</strong>
                        <span className={`checkin-group-pill group-${(guest.groupName || 'Regular').toLowerCase()}`}>
                          {guest.groupName || 'Regular'}
                        </span>
                      </div>
                      <div className="checkin-guest-sub">
                        <span>{guest.tableName || 'Open Seating'}</span>
                        <span>•</span>
                        <span>Max {guest.maxPax || 2} pax</span>
                        {guest.passToken && (
                          <>
                            <span>•</span>
                            <code>{guest.passToken}</code>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="checkin-guest-action">
                      {isCheckedIn ? (
                        <div className="checkin-arrived-badge">
                          <HiOutlineCheckCircle size={15} />
                          <span>
                            Arrived ({guest.checkedInPax || 1} pax)
                            {guest.souvenirClaimed ? ' • Souvenir' : ''}
                          </span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="checkin-row-btn"
                          onClick={() => openManualCheckIn(guest)}
                        >
                          Check In
                        </button>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </section>
      </main>
    </div>
  )
}

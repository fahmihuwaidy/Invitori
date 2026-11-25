/* eslint-disable react-refresh/only-export-components */
import { useParams, useSearchParams } from 'react-router-dom'
import { useInvitations } from '../contexts/InvitationContext'
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
  HiOutlineCheck,
  HiOutlineLocationMarker,
  HiOutlineCalendar,
  HiOutlineClock,
  HiOutlineMusicNote,
  HiOutlineMailOpen,
  HiChevronLeft,
  HiChevronRight,
  HiOutlineX,
  HiOutlineClipboard,
  HiOutlineExternalLink,
  HiOutlineHome,
  HiOutlineUserGroup,
  HiOutlineHeart,
  HiOutlineGift,
  HiOutlineCamera,
  HiOutlinePhotograph,
  HiOutlineTicket,
  HiOutlineLockClosed,
  HiOutlineDownload,
  HiOutlineZoomIn,
  HiOutlineZoomOut,
  HiOutlineSparkles,
  HiOutlineChatAlt2,
} from 'react-icons/hi'
import { encodePassQrValue, generateQrDataUrl, downloadQrPng } from '../utils/qr'
import Logo from '../assets/Logo.png'
import '../index.css'
import './PublicInvitationPage.css'

// Deterministic pseudo-random generator for decorative particle placement
function getSeededRandom(seed) {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

/** Extract couple monogram initials (e.g. "Elena & Julian" -> "E & J") */
function extractMonogram(coupleName = '', customMonogram = '') {
  if (customMonogram && customMonogram.trim()) return customMonogram.trim()
  const parts = (coupleName || 'Invori').split(/[&+]/).map(s => s.trim()).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0].charAt(0).toUpperCase()} & ${parts[1].charAt(0).toUpperCase()}`
  }
  return parts[0] ? parts[0].slice(0, 2).toUpperCase() : 'I'
}

/** Extract YouTube video ID from watch, youtu.be, shorts, live, or embed URLs */
function extractYouTubeId(rawUrl = '') {
  const url = String(rawUrl || '').trim()
  if (!url) return ''
  try {
    const parsed = new URL(url)
    const host = parsed.hostname.replace(/^www\./, '').toLowerCase()
    if (host === 'youtu.be') {
      return parsed.pathname.split('/').filter(Boolean)[0] || ''
    }
    if (host.endsWith('youtube.com') || host === 'youtube-nocookie.com') {
      const vParam = parsed.searchParams.get('v')
      if (vParam) return vParam
      const segments = parsed.pathname.split('/').filter(Boolean)
      const markerIndex = segments.findIndex(seg => ['shorts', 'live', 'embed', 'v'].includes(seg))
      if (markerIndex !== -1 && segments[markerIndex + 1]) {
        return segments[markerIndex + 1]
      }
    }
  } catch {
    // Fallback regex for partial URLs
  }
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|live\/|embed\/))([A-Za-z0-9_-]{6,})/)
  return match ? match[1] : ''
}

/** Extract Vimeo video ID cleanly */
function extractVimeoId(rawUrl = '') {
  const match = String(rawUrl || '').match(/vimeo\.com\/(?:video\/)?(\d+)/)
  return match ? match[1] : ''
}

/** Parse loose date/time strings into start/end Date objects for Calendar export */
function parseEventDates(dateStr, timeStr, fallbackIso) {
  let baseDate = fallbackIso ? new Date(fallbackIso) : new Date('2026-10-24T08:00:00')
  if (dateStr) {
    const cleaned = String(dateStr)
      .replace(/^(Senin|Selasa|Rabu|Kamis|Jumat|Sabtu|Minggu|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\s*,\s*/i, '')
      .replace(/Januari/i, 'January')
      .replace(/Februari/i, 'February')
      .replace(/Maret/i, 'March')
      .replace(/Mei/i, 'May')
      .replace(/Juni/i, 'June')
      .replace(/Juli/i, 'July')
      .replace(/Agustus/i, 'August')
      .replace(/Oktober/i, 'October')
      .replace(/Desember/i, 'December')
      .trim()
    const parsed = new Date(cleaned)
    if (!isNaN(parsed.getTime())) {
      baseDate = parsed
    }
  }
  if (isNaN(baseDate.getTime())) {
    baseDate = new Date(Date.now() + 86400000 * 30)
  }

  let startHour = 9
  let startMin = 0
  let endHour = null
  let endMin = null

  if (timeStr) {
    const timeMatches = [...String(timeStr).matchAll(/(\d{1,2})[:.](\d{2})\s*(am|pm)?/gi)]
    if (timeMatches.length >= 1) {
      startHour = parseInt(timeMatches[0][1], 10)
      startMin = parseInt(timeMatches[0][2], 10)
      const meridiem1 = (timeMatches[0][3] || '').toLowerCase()
      if (meridiem1 === 'pm' && startHour < 12) startHour += 12
      if (meridiem1 === 'am' && startHour === 12) startHour = 0
    }
    if (timeMatches.length >= 2) {
      endHour = parseInt(timeMatches[1][1], 10)
      endMin = parseInt(timeMatches[1][2], 10)
      const meridiem2 = (timeMatches[1][3] || '').toLowerCase()
      if (meridiem2 === 'pm' && endHour < 12) endHour += 12
      if (meridiem2 === 'am' && endHour === 12) endHour = 0
    }
  }

  const start = new Date(baseDate)
  start.setHours(startHour, startMin, 0, 0)

  let end
  if (endHour !== null && endMin !== null) {
    end = new Date(baseDate)
    end.setHours(endHour, endMin, 0, 0)
    if (end.getTime() <= start.getTime()) {
      end = new Date(start.getTime() + 2 * 60 * 60 * 1000)
    }
  } else {
    end = new Date(start.getTime() + 2 * 60 * 60 * 1000)
  }

  const toCalFormat = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  return { start, end, startStr: toCalFormat(start), endStr: toCalFormat(end) }
}

function normalizeEventForCalendar(event = {}, invitationTitle = '') {
  const eventName = event.name || event.title || ''
  const title = invitationTitle && eventName
    ? `${invitationTitle} — ${eventName}`
    : (eventName || invitationTitle || 'Celebration')
  return {
    title,
    dateStr: event.date || event.dateStr || '',
    timeStr: event.time || event.timeStr || '',
    venue: event.venue || '',
    address: event.address || '',
    fallbackIso: event.fallbackIso,
  }
}

function buildGoogleCalendarUrl(event, invitationTitle = '') {
  const { title, dateStr, timeStr, venue, address, fallbackIso } = normalizeEventForCalendar(event, invitationTitle)
  const { startStr, endStr } = parseEventDates(dateStr, timeStr, fallbackIso)
  const location = [venue, address].filter(Boolean).join(', ')
  const details = `Digital Invitation: ${title}${location ? ` at ${location}` : ''}`
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${startStr}/${endStr}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(location)}`
}

function downloadIcsFile(event, invitationTitle = '') {
  const { title, dateStr, timeStr, venue, address, fallbackIso } = normalizeEventForCalendar(event, invitationTitle)
  const { startStr, endStr } = parseEventDates(dateStr, timeStr, fallbackIso)
  const location = [venue, address].filter(Boolean).join(', ')
  const escapeIcs = (str) => String(str || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Invori Digital Atelier//EN',
    'BEGIN:VEVENT',
    `UID:${Date.now()}@invori.app`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}`,
    `DTSTART:${startStr}`,
    `DTEND:${endStr}`,
    `SUMMARY:${escapeIcs(title)}`,
    `LOCATION:${escapeIcs(location)}`,
    `DESCRIPTION:${escapeIcs(`You are warmly invited to ${title}.`)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `${(title || 'Invitation').replace(/[^a-z0-9]+/gi, '_')}.ics`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/** Evaluate block displayCondition such as "guestName=VIP" or "guestName!=Guest" */
function evaluateDisplayCondition(condition, { guestName, searchParams }) {
  const raw = String(condition || '').trim()
  if (!raw) return true

  const notEqIdx = raw.indexOf('!=')
  if (notEqIdx !== -1) {
    const key = raw.slice(0, notEqIdx).trim()
    const expected = raw.slice(notEqIdx + 2).trim().toLowerCase()
    const actual = resolveConditionKey(key, guestName, searchParams).toLowerCase()
    return actual !== expected
  }

  const eqIdx = raw.indexOf('=')
  if (eqIdx !== -1) {
    const key = raw.slice(0, eqIdx).trim()
    const expected = raw.slice(eqIdx + 1).trim().toLowerCase()
    const actual = resolveConditionKey(key, guestName, searchParams).toLowerCase()
    return actual === expected
  }

  if (raw.startsWith('!')) {
    const key = raw.slice(1).trim()
    if (key.toLowerCase() === 'guestname') return !guestName || guestName === 'Guest'
    return !resolveConditionKey(key, guestName, searchParams)
  }

  if (raw.toLowerCase() === 'guestname') return Boolean(guestName && guestName !== 'Guest')
  return Boolean(resolveConditionKey(raw, guestName, searchParams))
}

function resolveConditionKey(key, guestName, searchParams) {
  const normalized = String(key || '').trim()
  if (!normalized) return ''
  if (normalized.toLowerCase() === 'guestname' || normalized.toLowerCase() === 'to') {
    return guestName || ''
  }
  return searchParams?.get(normalized) || ''
}

/** Parse safe inline CSS declarations from inspector customCss string */
function parseCustomCssString(cssText) {
  if (!cssText || typeof cssText !== 'string') return {}
  const style = {}
  cssText.split(';').forEach(decl => {
    const colonIdx = decl.indexOf(':')
    if (colonIdx === -1) return
    const prop = decl.slice(0, colonIdx).trim()
    const val = decl.slice(colonIdx + 1).trim()
    if (!prop || !val) return
    // Block url(...) or expression(...) injections
    if (/expression|javascript:/i.test(val)) return
    const camelProp = prop.replace(/-([a-z])/g, (_, ch) => ch.toUpperCase())
    style[camelProp] = val
  })
  return style
}

/** Real scannable QR Code component powered by src/utils/qr.js */
function ScannableQrCode({ value, size = 148, color = '#2a3125', label = 'Guest Entry QR Code' }) {
  const [qrState, setQrState] = useState({ payload: '', url: '' })
  const payload = encodePassQrValue(value)

  useEffect(() => {
    let active = true
    if (!payload) return undefined
    generateQrDataUrl(payload, {
      size: size * 2,
      margin: 1,
      color,
      backgroundColor: '#ffffff',
      errorCorrectionLevel: 'M',
    })
      .then(url => {
        if (active) setQrState({ payload, url })
      })
      .catch(() => {
        if (active) setQrState({ payload, url: '' })
      })
    return () => { active = false }
  }, [payload, size, color])

  const qrDataUrl = payload && qrState.payload === payload ? qrState.url : ''

  if (!qrDataUrl) {
    return (
      <div
        className="public-qr-loading"
        style={{ width: size, height: size }}
        aria-label="Generating QR code"
      >
        <span>QR</span>
      </div>
    )
  }

  return (
    <img
      src={qrDataUrl}
      width={size}
      height={size}
      alt={label}
      style={{ display: 'block', width: size, height: size, imageRendering: 'pixelated' }}
    />
  )
}

function ParticleOverlay({ type, intensity = 20 }) {
  const chars = {
    sakura: '🌸',
    hearts: '❤️',
    snow: '❄️',
    confetti: '🎉',
  }
  const char = chars[type] || '🌸'
  const count = Math.min(intensity, 40)

  return (
    <div className="public-particle-container" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => {
        const left = getSeededRandom(i * 14.3 + 1.2) * 100
        const duration = 5 + getSeededRandom(i * 37.7 + 4.5) * 7
        const delay = getSeededRandom(i * 59.1 + 8.8) * -10
        const fontSize = 12 + getSeededRandom(i * 83.4 + 12.3) * 14
        const style = {
          left: `${left}%`,
          animationDuration: `${duration}s`,
          animationDelay: `${delay}s`,
          fontSize: `${fontSize}px`,
        }
        return (
          <span key={i} className="public-particle" style={style}>
            {char}
          </span>
        )
      })}
    </div>
  )
}

/** Detects if a URL points to a video file */
export const isMediaVideo = (url) => {
  if (!url) return false
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov']
  const lowerUrl = url.toLowerCase()
  if (videoExtensions.some(ext => lowerUrl.includes(ext))) return true
  if (lowerUrl.includes('/video/upload/')) return true
  return false
}

/** Shared component to render either <img> or <video> */
export const MediaRenderer = ({ src, className, style, alt = '', ...props }) => {
  if (!src) return null
  if (isMediaVideo(src)) {
    return (
      <video
        src={src}
        className={className}
        style={{ ...style, objectFit: style?.objectFit || 'cover' }}
        autoPlay
        loop
        muted
        playsInline
        {...props}
      />
    )
  }
  return <img src={src} className={className} style={style} alt={alt} {...props} />
}

// ── NUMERICAL PRELOADER ─────────────────────────────────────────────────────
function NumericalPreloader({ coupleName, subtitle, primaryColor, isLoading = false, onFinish }) {
  const [progress, setProgress] = useState(0)
  const [isClosing, setIsClosing] = useState(false)
  const onFinishRef = useRef(onFinish)
  const isLoadingRef = useRef(isLoading)

  useEffect(() => {
    onFinishRef.current = onFinish
    isLoadingRef.current = isLoading
  }, [onFinish, isLoading])

  useEffect(() => {
    const startTime = performance.now()
    const duration = 900
    let animId
    let closeTimer
    let finishTimer

    const update = (now) => {
      const elapsed = now - startTime
      let current = Math.min(Math.floor((elapsed / duration) * 100), 100)
      if (isLoadingRef.current && current > 90) {
        current = 90
      }
      setProgress(current)

      if (current < 100) {
        animId = requestAnimationFrame(update)
      } else {
        closeTimer = setTimeout(() => {
          setIsClosing(true)
          finishTimer = setTimeout(() => onFinishRef.current?.(), 380)
        }, 80)
      }
    }

    animId = requestAnimationFrame(update)
    return () => {
      cancelAnimationFrame(animId)
      clearTimeout(closeTimer)
      clearTimeout(finishTimer)
    }
  }, [])

  return (
    <div
      className={`public-preloader-screen ${isClosing ? 'fade-out' : ''}`}
      onClick={() => {
        if (isLoading) return
        setIsClosing(true)
        setTimeout(() => onFinishRef.current?.(), 150)
      }}
      title="Tap to enter"
    >
      <div className="public-preloader-content">
        <p className="public-preloader-kicker">{subtitle || 'DIGITAL INVITATION'}</p>
        <h2 className="public-preloader-couple serif-italic">{coupleName || 'Invori'}</h2>

        <div className="public-preloader-counter">
          <span className="public-preloader-num">{progress}</span>
          <span className="public-preloader-pct">%</span>
        </div>

        <div className="public-preloader-track">
          <div
            className="public-preloader-bar"
            style={{ width: `${progress}%`, background: primaryColor || '#652128' }}
          />
        </div>

        <p className="public-preloader-note">Preparing your celebration...</p>
      </div>
    </div>
  )
}

// ── QRIS LIGHTBOX ZOOM MODAL ────────────────────────────────────────────────
function QrisLightboxModal({ src, onClose, primaryColor = '#344c2d' }) {
  const [zoomed, setZoomed] = useState(false)

  useEffect(() => {
    if (!src) return undefined
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [src, onClose])

  if (!src) return null

  return (
    <div className="qris-lightbox-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label="QRIS Payment Code">
      <div className="qris-lightbox-card" onClick={e => e.stopPropagation()}>
        <div className="qris-lightbox-toolbar">
          <span className="qris-lightbox-badge" style={{ color: primaryColor }}>QRIS Digital Payment</span>
          <div className="qris-lightbox-actions">
            <button
              type="button"
              className="qris-lightbox-icon-btn"
              onClick={() => setZoomed(z => !z)}
              aria-label={zoomed ? 'Zoom out QRIS' : 'Zoom in QRIS'}
              title={zoomed ? 'Reset zoom' : 'Zoom in'}
            >
              {zoomed ? <HiOutlineZoomOut size={18} /> : <HiOutlineZoomIn size={18} />}
              <span>{zoomed ? '1×' : '1.75×'}</span>
            </button>
            <button
              type="button"
              className="qris-lightbox-close-btn"
              onClick={onClose}
              aria-label="Close QRIS lightbox"
            >
              <HiOutlineX size={18} />
            </button>
          </div>
        </div>
        <div className={`qris-lightbox-stage ${zoomed ? 'is-zoomed' : ''}`} onClick={() => setZoomed(z => !z)}>
          <img src={src} alt="QRIS Payment Code" className="qris-lightbox-img" />
        </div>
        <p className="qris-lightbox-caption">
          Tap the image to toggle zoom, then scan using any mobile banking or e-wallet app.
        </p>
      </div>
    </div>
  )
}

// ── GIFT MODAL POPUP ────────────────────────────────────────────────────────
function GiftModal({
  isOpen,
  onClose,
  accounts = [],
  physicalGift,
  qrisImage,
  primaryColor = '#652128',
  isPreviewUrl,
  onOpenQrisLightbox,
}) {
  if (!isOpen) return null

  return (
    <div className="gift-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label="Digital Gift Details">
      <div className="gift-modal-sheet" onClick={e => e.stopPropagation()}>
        <button type="button" className="gift-modal-close" onClick={onClose} aria-label="Close">
          <HiOutlineX size={16} />
        </button>

        <div className="gift-modal-header">
          <div className="gift-modal-badge-icon" style={{ color: primaryColor }}>
            <HiOutlineGift size={28} />
          </div>
          <h3 className="serif-italic gift-modal-title" style={{ color: primaryColor }}>
            Tokens of Love & Digital Gift
          </h3>
          <p className="gift-modal-desc">
            Your presence and heartfelt blessings are the greatest gift of all. Should you wish to send a token of love, you may use the account or delivery details below.
          </p>
        </div>

        <div className="gift-modal-body">
          {accounts.length > 0 && (
            <div className="gift-modal-section">
              <h5 className="gift-modal-section-title">Bank Transfer & E-Wallet</h5>
              <div className="public-gift-accounts">
                {accounts.map((acc, i) => (
                  <GiftAccountCard key={i} account={acc} primaryColor={primaryColor} isPreviewUrl={isPreviewUrl} />
                ))}
              </div>
            </div>
          )}

          {physicalGift?.address && (
            <div className="gift-modal-section">
              <h5 className="gift-modal-section-title">Physical Gift Delivery</h5>
              <PhysicalGiftCard
                recipient={physicalGift.recipient}
                phone={physicalGift.phone}
                address={physicalGift.address}
                primaryColor={primaryColor}
              />
            </div>
          )}

          {qrisImage && (
            <div className="gift-modal-section" style={{ textAlign: 'center' }}>
              <h5 className="gift-modal-section-title">QRIS Digital Payment</h5>
              <button
                type="button"
                className="public-gift-qris-trigger"
                onClick={() => onOpenQrisLightbox?.(qrisImage)}
                aria-label="Enlarge QRIS code"
              >
                <img src={qrisImage} alt="QRIS Code" className="public-gift-qris-img" />
                <span className="public-gift-qris-zoom-hint">
                  <HiOutlineZoomIn size={14} /> Tap to enlarge QRIS
                </span>
              </button>
            </div>
          )}
        </div>

        <div className="gift-modal-footer">
          <button type="button" className="gift-modal-done-btn" style={{ background: primaryColor }} onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC INVITATION PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function PublicInvitationPage() {
  const { slug } = useParams()
  const [searchParams] = useSearchParams()
  const { fetchPublicInvitation, incrementView, addRsvp } = useInvitations()

  const guestName = searchParams.get('to') || 'Guest'
  const guestToken = searchParams.get('token') || searchParams.get('pass') || searchParams.get('passToken') || ''
  const isPreviewUrl = searchParams.get('preview') === 'true'

  const [invitation, setInvitation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [preloaderDone, setPreloaderDone] = useState(false)
  const [isGiftModalOpen, setIsGiftModalOpen] = useState(false)
  const [qrisLightboxSrc, setQrisLightboxSrc] = useState(null)

  const [rsvpForm, setRsvpForm] = useState({
    name: guestName !== 'Guest' ? guestName : '',
    whatsapp: '',
    message: '',
    attendance: '',
    guestCount: 1,
    session: '',
    dietaryNote: '',
  })
  const [rsvpSent, setRsvpSent] = useState(false)
  const [submittedAttendance, setSubmittedAttendance] = useState('yes')
  const [isRsvpLoading, setIsRsvpLoading] = useState(false)

  const [wishForm, setWishForm] = useState({
    name: guestName !== 'Guest' ? guestName : '',
    content: '',
  })
  const [isWishLoading, setIsWishLoading] = useState(false)
  const [wishSent, setWishSent] = useState(false)

  const [isOpen, setIsOpen] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef(null)
  const scrollContainerRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      const inv = await fetchPublicInvitation(slug, isPreviewUrl)
      if (cancelled) return
      setInvitation(inv)
      setLoading(false)
      if (inv) {
        incrementView(inv.id, {
          guestToken: guestToken || null,
          source: searchParams.get('utm_source') || searchParams.get('src') || null,
        })
      }
    }
    load()
    return () => { cancelled = true }
  }, [slug, fetchPublicInvitation, incrementView, isPreviewUrl, guestToken, searchParams])

  // Derive available sessions from location block or rsvp block
  const locationEvents = useMemo(() => {
    const locBlock = invitation?.blocks?.find(b => b.type === 'location')
    return locBlock?.data?.events || []
  }, [invitation])

  const defaultSessionOptions = useMemo(() => {
    const rsvpBlock = invitation?.blocks?.find(b => b.type === 'rsvp')
    const customSessions = rsvpBlock?.data?.sessions || rsvpBlock?.data?.sessionOptions
    if (Array.isArray(customSessions) && customSessions.length > 0) {
      return customSessions.filter(Boolean)
    }
    if (locationEvents.length > 1) {
      const names = locationEvents.map(ev => ev.name).filter(Boolean)
      if (names.length > 1) {
        return ['All Sessions', ...names]
      }
    }
    return ['All Sessions (Ceremony & Reception)', 'Ceremony Only', 'Reception Only']
  }, [invitation, locationEvents])

  useEffect(() => {
    if (!rsvpForm.session && defaultSessionOptions.length > 0) {
      setRsvpForm(prev => ({ ...prev, session: defaultSessionOptions[0] }))
    }
  }, [defaultSessionOptions, rsvpForm.session])

  // Extract music block details
  const musicBlock = invitation?.blocks?.find(b => b.type === 'backgroundMusic')
  const musicUrl = musicBlock?.data?.url || invitation?.musicUrl || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
  const musicSongTitle = musicBlock?.data?.songTitle || 'Celebration Soundtrack'
  const musicVolume = musicBlock?.data?.volume ?? 80

  useEffect(() => {
    if (!musicUrl || !audioRef.current) return
    if (isPlaying && isOpen) {
      if (audioRef.current.paused) {
        audioRef.current.play().catch(() => {})
      }
    } else {
      audioRef.current.pause()
    }
  }, [isPlaying, isOpen, musicUrl])

  // Pause background audio automatically when tab visibility becomes hidden
  useEffect(() => {
    const handleVisibility = () => {
      if (!audioRef.current) return
      if (document.visibilityState === 'hidden') {
        audioRef.current.pause()
      } else if (isPlaying && isOpen) {
        audioRef.current.play().catch(() => {})
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [isPlaying, isOpen])

  // Sync audio volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = Math.max(0, Math.min(1, musicVolume / 100))
    }
  }, [musicVolume])

  // Body scroll lock while cover gate is closed
  useEffect(() => {
    document.body.style.overflow = !isOpen ? 'hidden' : 'auto'
    return () => { document.body.style.overflow = 'auto' }
  }, [isOpen])

  // Load Google Fonts dynamically
  useEffect(() => {
    if (!invitation) return

    const fontFamilies = new Set()
    if (invitation.theme?.fontFamily) fontFamilies.add(invitation.theme.fontFamily)
    invitation.blocks?.forEach(block => {
      if (block.data?.fontFamily) fontFamilies.add(block.data.fontFamily)
      if (block.data?.displayFont) fontFamilies.add(block.data.displayFont)
    })

    if (fontFamilies.size > 0) {
      const fontsArray = Array.from(fontFamilies).filter(font =>
        !['serif', 'sans-serif', 'monospace', 'inherit', 'Gambarino'].includes(font) &&
        !font.includes(',') &&
        !font.startsWith('var(')
      )

      if (fontsArray.length > 0) {
        const linkId = 'dynamic-google-fonts'
        let linkEl = document.getElementById(linkId)
        if (!linkEl) {
          linkEl = document.createElement('link')
          linkEl.id = linkId
          linkEl.rel = 'stylesheet'
          document.head.appendChild(linkEl)
        }

        const FONT_SPECS = {
          'Bodoni Moda': 'ital,wght@0,400;0,600;1,400',
          'Cormorant Garamond': 'ital,wght@0,400;0,600;1,400;1,500',
          'Amiri': 'ital,wght@0,400;0,700;1,400',
          'Fraunces': 'ital,wght@0,400;0,600;1,400',
          'DM Serif Display': 'ital@0;1',
          'DM Sans': 'ital,wght@0,400;0,500;0,700;1,400',
          'Lora': 'ital,wght@0,400;0,600;1,400',
          'Playfair Display': 'ital,wght@0,400;0,600;1,400',
          'Plus Jakarta Sans': 'ital,wght@0,400;0,500;0,600;0,700;1,400',
        }
        const defaultSpec = 'ital,wght@0,300;0,400;0,500;0,600;0,700;1,400'
        const fontQueries = fontsArray.map(font => `family=${font.replace(/\s+/g, '+')}:${FONT_SPECS[font] || defaultSpec}`).join('&')
        const newHref = `https://fonts.googleapis.com/css2?${fontQueries}&display=swap`
        if (linkEl.href !== newHref) {
          linkEl.href = newHref
        }
      }
    }
  }, [invitation])

  // Atomic open handler: unlocks body scroll + triggers audio.play() synchronously for iOS Safari
  const handleOpenInvitation = () => {
    document.body.style.overflow = 'auto'
    if (musicUrl && audioRef.current) {
      audioRef.current.volume = Math.max(0, Math.min(1, musicVolume / 100))
      const playPromise = audioRef.current.play()
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => {})
      }
      setIsPlaying(true)
    }
    setIsOpen(true)
  }

  const scrollToBlockId = useCallback((blockId) => {
    const target = document.getElementById(`block-${blockId}`) || document.getElementById(blockId)
    if (!target) return
    target.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  if (loading && isPreviewUrl) {
    return (
      <div className="public-page-wrapper">
        <div className="public-loading">
          <div className="public-loading-spinner" />
          <p className="serif-italic" style={{ color: '#666E62', marginTop: 16 }}>Loading invitation...</p>
        </div>
      </div>
    )
  }

  if (!loading && !invitation) {
    return (
      <div className="public-page-wrapper">
        <div className="public-blocks public-not-found">
          <header style={{ textAlign: 'center', padding: '40px 20px' }}>
            <img src={Logo} alt="Invori Logo" style={{ height: 40, margin: '0 auto' }} />
            <h1 className="serif-italic" style={{ color: 'var(--olive)', marginTop: 16 }}>Invitation Not Available</h1>
            <p style={{ color: 'var(--text-light)' }}>Please double-check your invitation link or contact the host.</p>
          </header>
        </div>
      </div>
    )
  }

  const theme = invitation?.theme || {}
  const displayFont = invitation?.blocks?.find(b => b.type === 'cover')?.data?.displayFont || 'Gambarino'

  const handleRsvp = async (e, attendanceValue) => {
    if (e) e.preventDefault()
    if (isRsvpLoading || !invitation) return

    const finalName = (rsvpForm.name || (guestName !== 'Guest' ? guestName : '')).trim()
    if (!finalName) return

    const submitAttendance = attendanceValue || rsvpForm.attendance || 'yes'
    setSubmittedAttendance(submitAttendance)
    setIsRsvpLoading(true)
    try {
      const success = await addRsvp(invitation.id, {
        name: finalName,
        whatsapp: rsvpForm.whatsapp || '',
        email: rsvpForm.whatsapp || null,
        entryType: 'rsvp',
        attendance: submitAttendance,
        guestCount: Number(rsvpForm.guestCount) || 1,
        session: rsvpForm.session || '',
        dietaryNote: rsvpForm.dietaryNote || '',
        message: rsvpForm.message?.trim() || null,
        sentAt: new Date().toISOString(),
      })
      if (success) setRsvpSent(true)
    } catch (err) {
      console.error('RSVP Error:', err)
    } finally {
      setIsRsvpLoading(false)
    }
  }

  const handleSendWish = async (e) => {
    if (e) e.preventDefault()
    const finalName = (wishForm.name || (guestName !== 'Guest' ? guestName : 'Guest')).trim()
    if (!wishForm.content.trim() || isWishLoading || !invitation) return
    setIsWishLoading(true)
    try {
      const success = await addRsvp(invitation.id, {
        name: finalName,
        email: null,
        entryType: 'wish',
        message: wishForm.content.trim(),
        attendance: null,
        sentAt: new Date().toISOString(),
      })
      if (success) {
        setWishSent(true)
        setInvitation(prev => ({
          ...prev,
          wishes: [
            {
              id: `local-${Date.now()}`,
              author: finalName,
              content: wishForm.content.trim(),
              entryType: 'wish',
              attendance: null,
              date: new Date().toISOString(),
            },
            ...(prev.wishes || []),
          ],
        }))
        setWishForm(prev => ({ ...prev, content: '' }))
        setTimeout(() => setWishSent(false), 3500)
      }
    } catch (err) {
      console.error('Wish Error:', err)
    } finally {
      setIsWishLoading(false)
    }
  }

  // Extract decorative/overlay components
  const particlesBlock = invitation?.blocks?.find(b => b.type === 'particles')
  const desktopHeroBlock = invitation?.blocks?.find(b => b.type === 'desktopHero')
  const coverBlock = invitation?.blocks?.find(b => b.type === 'cover')
  const navBlock = invitation?.blocks?.find(b => b.type === 'navigationMenu')

  const coupleName = coverBlock?.data?.coupleName || invitation?.title || 'The Celebration'
  const coverSubtitle = coverBlock?.data?.subtitle || 'Digital Invitation'
  const coverDate = coverBlock?.data?.date || ''
  const coverPhoto = coverBlock?.data?.backgroundImage
  const monogram = extractMonogram(coupleName)

  // Desktop Left Showcase Pane Specific Data
  const heroPhoto = desktopHeroBlock?.data?.backgroundImage || coverPhoto
  const heroCoupleName = desktopHeroBlock?.data?.title || coupleName
  const heroSubtitle = desktopHeroBlock?.data?.subtitle || coverSubtitle
  const heroDate = desktopHeroBlock?.data?.date || coverDate
  const heroOverlayOpacity = desktopHeroBlock?.data?.overlayOpacity != null ? Number(desktopHeroBlock.data.overlayOpacity) : 0.7
  const heroOverlayGradient = desktopHeroBlock?.data?.overlayGradient || 'cinematic'
  const heroShowMonogram = desktopHeroBlock?.data?.showMonogram !== false
  const heroShowGuestTag = desktopHeroBlock?.data?.showGuestTag !== false
  const heroShowScrollGuide = desktopHeroBlock?.data?.showScrollGuide !== false

  const giftBlock = invitation?.blocks?.find(b => b.type === 'gift')
  const giftAccounts = giftBlock?.data?.accounts?.length > 0
    ? giftBlock.data.accounts
    : (giftBlock?.data?.bankName ? [{ bankName: giftBlock.data.bankName, accountNumber: giftBlock.data.accountNumber, accountName: giftBlock.data.accountName }] : [])

  // Filter renderable feed blocks & honor displayCondition
  const feedBlocks = (invitation?.blocks || []).filter(block => {
    if (
      block.type === 'music' ||
      block.type === 'signature' ||
      block.type === 'registry' ||
      block.type === 'backgroundMusic' ||
      block.type === 'particles' ||
      block.type === 'navigationMenu' ||
      block.type === 'envelopeAnimation' ||
      block.type === 'desktopHero'
    ) {
      return false
    }
    return evaluateDisplayCondition(block.data?.displayCondition, { guestName, searchParams })
  })

  // Build bottom quick navigation dock items from feed blocks
  const dockTargets = [
    { key: 'cover', label: 'Home', icon: HiOutlineHome, flag: navBlock?.data?.showCover !== false, match: ['cover'] },
    { key: 'couple', label: 'Couple', icon: HiOutlineUserGroup, flag: navBlock?.data?.showCouple !== false, match: ['couple'] },
    { key: 'event', label: 'Event', icon: HiOutlineCalendar, flag: navBlock?.data?.showEvent !== false, match: ['location', 'schedule'] },
    { key: 'gallery', label: 'Gallery', icon: HiOutlinePhotograph, flag: navBlock?.data?.showGallery !== false, match: ['gallery'] },
    { key: 'rsvp', label: 'RSVP', icon: HiOutlineHeart, flag: true, match: ['rsvp'] },
    { key: 'wishes', label: 'Wishes', icon: HiOutlineChatAlt2, flag: navBlock?.data?.showWishes !== false, match: ['wishes'] },
    { key: 'gift', label: 'Gift', icon: HiOutlineGift, flag: navBlock?.data?.showGift !== false, match: ['gift'] },
  ]
    .filter(item => item.flag)
    .map(item => {
      const found = feedBlocks.find(b => item.match.includes(b.type))
      return found ? { ...item, blockId: found.id } : null
    })
    .filter(Boolean)
    .slice(0, 5)

  return (
    <div
      className="public-page-wrapper"
      style={{
        '--font-display': `'${displayFont}', serif`,
        ...(theme.fontFamily ? { fontFamily: theme.fontFamily.includes(',') ? theme.fontFamily : `'${theme.fontFamily}', sans-serif` } : {}),
      }}
    >
      {!preloaderDone && !isPreviewUrl && (
        <NumericalPreloader
          coupleName={invitation ? coupleName : ''}
          subtitle={invitation ? coverSubtitle : 'DIGITAL INVITATION'}
          primaryColor={theme.primaryColor || '#652128'}
          isLoading={loading}
          onFinish={() => setPreloaderDone(true)}
        />
      )}

      {invitation && (
        <>
          <GiftModal
            isOpen={isGiftModalOpen}
            onClose={() => setIsGiftModalOpen(false)}
            accounts={giftAccounts}
            physicalGift={{
              recipient: giftBlock?.data?.physicalRecipient,
              phone: giftBlock?.data?.physicalPhone,
              address: giftBlock?.data?.physicalAddress,
            }}
            qrisImage={giftBlock?.data?.qrisImage}
            primaryColor={theme.primaryColor || '#652128'}
            isPreviewUrl={isPreviewUrl}
            onOpenQrisLightbox={(src) => setQrisLightboxSrc(src)}
          />

          <QrisLightboxModal
            src={qrisLightboxSrc}
            onClose={() => setQrisLightboxSrc(null)}
            primaryColor={theme.primaryColor || '#344c2d'}
          />

          <div className="public-desktop-split">
            {/* Desktop Left Showcase Pane (Powered by desktopHero or fallback coverPhoto) */}
            <aside className="public-desktop-left" style={{ '--primary-color': theme.primaryColor || '#652128' }}>
              {heroPhoto && (
                <div className="public-desktop-hero-media">
                  <MediaRenderer src={heroPhoto} alt={heroCoupleName} />
                  <div
                    className={`public-desktop-hero-overlay public-desktop-hero-overlay--${heroOverlayGradient}`}
                    style={{ opacity: heroOverlayOpacity }}
                  />
                </div>
              )}
              <div className="public-desktop-left-inner">
                {heroShowMonogram && (
                  <div className="public-desktop-monogram-badge" style={{ borderColor: `${theme.primaryColor || '#652128'}55`, color: '#fff' }}>
                    <span className="serif-italic">{monogram}</span>
                  </div>
                )}
                <p className="public-desktop-kicker">{heroSubtitle}</p>
                <h1 className="public-desktop-couple serif-italic">{heroCoupleName}</h1>
                {heroDate && <p className="public-desktop-event-date">{heroDate}</p>}

                <div className="public-desktop-divider" style={{ background: 'rgba(255,255,255,0.32)' }} />

                {heroShowGuestTag && guestName && guestName !== 'Guest' && (
                  <div className="public-desktop-guest-tag">
                    <span>Exclusively For</span>
                    <strong>{guestName}</strong>
                  </div>
                )}

                {heroShowScrollGuide && (
                  <div className="public-desktop-mouse-guide">
                    <div className="public-desktop-mouse-icon">
                      <div className="public-desktop-mouse-wheel" />
                    </div>
                    <span>Scroll the right panel to explore the invitation</span>
                  </div>
                )}
              </div>
            </aside>

            {/* Right Pane (or Single Column Mobile/Tablet Canvas) */}
            <main className="public-desktop-right">
              <div className="public-phone-shell">
                <IntroOverlay isOpen={isOpen} onOpen={handleOpenInvitation} invitation={invitation} guestName={guestName} />

                {musicUrl && (
                  <BackgroundMusic
                    url={musicUrl}
                    songTitle={musicSongTitle}
                    isPlaying={isPlaying}
                    setIsPlaying={setIsPlaying}
                    audioRef={audioRef}
                    hasBottomDock={isOpen && dockTargets.length > 0}
                  />
                )}

                {isOpen && dockTargets.length > 0 && (
                  <nav className="public-bottom-dock" aria-label="Invitation sections">
                    {dockTargets.map(item => {
                      const IconComponent = item.icon
                      return (
                        <button
                          key={item.key}
                          type="button"
                          className="public-bottom-dock-btn"
                          onClick={() => scrollToBlockId(item.blockId)}
                          title={item.label}
                          aria-label={item.label}
                        >
                          <IconComponent size={17} />
                          <span>{item.label}</span>
                        </button>
                      )
                    })}
                  </nav>
                )}

                <div
                  ref={scrollContainerRef}
                  className={`public-blocks ${isOpen && dockTargets.length > 0 ? 'public-blocks--with-dock' : ''}`}
                  style={{
                    background: theme.backgroundColor || '#EDE9E7',
                    overflowY: isOpen ? 'auto' : 'hidden',
                  }}
                >
                  {particlesBlock && (
                    <ParticleOverlay
                      type={particlesBlock.data?.effect || 'sakura'}
                      intensity={particlesBlock.data?.intensity || 30}
                    />
                  )}

                  {feedBlocks.map((block) => {
                    const hasBg = !!block.data?.backgroundImage
                    const blockMinHeight = block.data?.blockMinHeight || 0
                    const bgAspectRatio = block.data?.backgroundAspectRatio || null
                    const isCover = block.type === 'cover'
                    const isFooter = block.type === 'footer'
                    const isFullWidth = isCover || isFooter

                    const hoverEffect = block.data?.hoverEffect || 'none'
                    const hoverClass = hoverEffect !== 'none' ? `public-hover--${hoverEffect}` : ''
                    const responsiveClasses = [
                      block.data?.hideOnMobile ? 'public-hide-mobile' : '',
                      block.data?.hideOnTablet ? 'public-hide-tablet' : '',
                      block.data?.hideOnDesktop ? 'public-hide-desktop' : '',
                    ].filter(Boolean).join(' ')

                    const clickAction = block.data?.clickAction || 'none'
                    const clickTarget = block.data?.clickActionTarget || ''
                    const isClickable = (clickAction === 'scrollTo' || clickAction === 'openUrl') && Boolean(clickTarget)

                    const handleBlockClick = () => {
                      if (!isClickable) return
                      if (clickAction === 'scrollTo') {
                        scrollToBlockId(clickTarget)
                      } else if (clickAction === 'openUrl') {
                        const safeTarget = String(clickTarget).trim()
                        if (/^(https?:\/\/|\/)/i.test(safeTarget)) {
                          window.open(safeTarget, '_blank', 'noopener,noreferrer')
                        }
                      }
                    }

                    const parsedCustomCss = parseCustomCssString(block.data?.customCss)

                    return (
                      <ScrollRevealBlock
                        key={block.id}
                        id={`block-${block.id}`}
                        isCover={isCover}
                        rootRef={scrollContainerRef}
                        animationType={block.data?.animation || 'fade-in-up'}
                        className={`public-block ${isCover ? 'public-block-cover' : ''} ${isFooter ? 'public-block-footer' : ''} ${hoverClass} ${responsiveClasses} ${isClickable ? 'public-block--interactive' : ''} ${block.data?.customClassName || ''}`}
                        onClick={isClickable ? handleBlockClick : undefined}
                        role={isClickable ? 'button' : undefined}
                        tabIndex={isClickable ? 0 : undefined}
                        onKeyDown={isClickable ? (e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            handleBlockClick()
                          }
                        } : undefined}
                        style={{
                          paddingTop: isFullWidth ? 0 : (block.data?.spacingTop ?? 40),
                          paddingBottom: isFullWidth ? 0 : (block.data?.spacingBottom ?? 40),
                          position: hasBg ? 'relative' : undefined,
                          overflow: hasBg || block.data?.customBorderRadius ? 'hidden' : undefined,
                          minHeight: blockMinHeight > 0 ? blockMinHeight : undefined,
                          aspectRatio: (hasBg && bgAspectRatio) ? bgAspectRatio : undefined,
                          display: (hasBg && bgAspectRatio) ? 'flex' : undefined,
                          alignItems: (hasBg && bgAspectRatio) ? 'center' : undefined,
                          justifyContent: (hasBg && bgAspectRatio) ? 'center' : undefined,
                          background: block.data?.customBgColor || undefined,
                          color: block.data?.customTextColor || undefined,
                          textAlign: block.data?.customTextAlign || undefined,
                          borderRadius: block.data?.customBorderRadius ? `${block.data?.customBorderRadius}px` : undefined,
                          '--text-dark': block.data?.customTextColor || undefined,
                          '--text-muted': block.data?.customTextColor || undefined,
                          '--text-light': block.data?.customTextColor || undefined,
                          ...parsedCustomCss,
                        }}
                      >
                        {block.data?.customCssId && (
                          <span id={block.data.customCssId} style={{ position: 'absolute', top: 0 }} aria-hidden="true" />
                        )}
                        {hasBg && !isCover && (
                          <>
                            <MediaRenderer
                              src={block.data.backgroundImage}
                              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: block.data.backgroundFit || 'cover', objectPosition: 'center', zIndex: 0, pointerEvents: 'none', borderRadius: 'inherit' }}
                            />
                            <div style={{ position: 'absolute', inset: 0, backgroundColor: block.data.backgroundOverlayColor || '#000000', opacity: block.data.backgroundOverlay ?? 0.3, zIndex: 1, pointerEvents: 'none', borderRadius: 'inherit' }} />
                          </>
                        )}
                        <div
                          className="public-block-content"
                          style={{
                            ...((hasBg && !isCover) ? { position: 'relative', zIndex: 2 } : {}),
                            ...(block.data.fullWidth !== false ? { padding: 0, maxWidth: 'none', paddingLeft: isFullWidth ? 0 : 24, paddingRight: isFullWidth ? 0 : 24 } : { paddingLeft: 24, paddingRight: 24 }),
                          }}
                        >
                          {renderPublicBlock(
                            block, theme,
                            rsvpForm, setRsvpForm, handleRsvp, rsvpSent,
                            wishForm, setWishForm, handleSendWish, wishSent,
                            guestName, isPreviewUrl,
                            invitation.wishes || [],
                            isRsvpLoading, isWishLoading,
                            false,
                            submittedAttendance,
                            invitation.title,
                            () => setIsGiftModalOpen(true),
                            {
                              invitationId: invitation.id,
                              guestToken,
                              sessionOptions: defaultSessionOptions,
                              onOpenQrisLightbox: (src) => setQrisLightboxSrc(src),
                              slug: invitation.slug,
                            }
                          )}
                        </div>
                      </ScrollRevealBlock>
                    )
                  })}
                </div>
              </div>
            </main>
          </div>
        </>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// BLOCK RENDERERS
// ─────────────────────────────────────────────────────────────────────────────

export function renderPublicBlock(
  block, theme,
  rsvpForm, setRsvpForm, handleRsvp, rsvpSent,
  wishForm, setWishForm, handleSendWish, wishSent,
  guestName, isPreviewUrl,
  wishes = [],
  isRsvpLoading = false,
  isWishLoading = false,
  isEditorCanvas = false,
  submittedAttendance = 'yes',
  invitationTitle = '',
  onOpenGiftModal = null,
  extraOptions = {}
) {
  const primaryColor = theme?.primaryColor || '#565F34'
  const {
    invitationId = '',
    guestToken = '',
    sessionOptions = ['All Sessions (Ceremony & Reception)', 'Ceremony Only', 'Reception Only'],
    onOpenQrisLightbox = null,
    slug = 'invitation',
  } = extraOptions || {}

  switch (block.type) {
    // ── COVER ──────────────────────────────────────────────────────────────
    case 'cover': {
      const layout = block.data.coverLayout || 'classic'
      const monogram = extractMonogram(block.data.coupleName || invitationTitle)

      if (layout === 'arch') {
        return (
          <div className="public-cover public-cover--arch">
            <div className="public-cover-arch-card">
              <div className="public-cover-crest" style={{ color: primaryColor }}>
                <span className="public-cover-crest-circle" style={{ borderColor: `${primaryColor}40` }}>{monogram}</span>
              </div>
              <p className="public-cover-subtitle animate-cover-1" style={{ color: primaryColor }}>
                {block.data.subtitle || 'The Wedding Celebration Of'}
              </p>
              <div className="public-cover-arch-window" style={{ borderColor: `${primaryColor}40` }}>
                <MediaRenderer
                  src={block.data.backgroundImage}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  className="public-cover-bg"
                />
                <div
                  className="public-cover-overlay"
                  style={{
                    position: 'absolute', inset: 0,
                    backgroundColor: block.data.overlayColor || '#000000',
                    opacity: Math.min(block.data.overlayOpacity ?? 0.15, 0.3),
                  }}
                />
              </div>
              <h1 className="public-cover-name animate-cover-2" style={{ color: primaryColor }}>
                {block.data.coupleName || 'Couple Name'}
              </h1>
              {block.data.date && (
                <p className="public-cover-date animate-cover-3">
                  <span>{block.data.date}</span>
                </p>
              )}
              {block.data.showGuestName && guestName && guestName !== 'Guest' && (
                <div className="public-cover-guest-card animate-cover-4" style={{ borderColor: `${primaryColor}30`, background: `${primaryColor}06` }}>
                  <p className="public-cover-guest-label">Dear Invited Guest</p>
                  <p className="public-cover-guest-name" style={{ color: primaryColor }}>{guestName}</p>
                </div>
              )}
            </div>
          </div>
        )
      }

      if (layout === 'editorial') {
        return (
          <div className="public-cover public-cover--editorial">
            <div className="public-cover-bg-wrapper" style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
              <MediaRenderer
                src={block.data.backgroundImage}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                className="public-cover-bg"
              />
              <div
                className="public-cover-overlay"
                style={{
                  position: 'absolute', inset: 0,
                  background: `linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.1) 40%, rgba(0,0,0,${Math.max(block.data.overlayOpacity ?? 0.55, 0.6)}) 100%)`,
                  zIndex: 1,
                }}
              />
            </div>
            <div className="public-cover-editorial-top">
              <span className="public-cover-editorial-issue">INVORI EDITORIAL</span>
              <span className="public-cover-editorial-monogram">{monogram}</span>
              <span className="public-cover-editorial-date">{block.data.date || 'SPECIAL ISSUE'}</span>
            </div>
            <div className="public-cover-content public-cover-content--editorial">
              <p className="public-cover-subtitle animate-cover-1">{block.data.subtitle || 'The Wedding Celebration'}</p>
              <h1 className="public-cover-name public-cover-name--editorial animate-cover-2">{block.data.coupleName || 'Couple Name'}</h1>
              {block.data.showGuestName && guestName && guestName !== 'Guest' && (
                <div className="public-cover-guest-card public-cover-guest-card--editorial animate-cover-4">
                  <p className="public-cover-guest-label">Private Invitation For</p>
                  <p className="public-cover-guest-name">{guestName}</p>
                </div>
              )}
            </div>
          </div>
        )
      }

      return (
        <div className={`public-cover public-cover--${layout}`} style={{ alignItems: block.data.coverAlignItems || 'center' }}>
          <div className="public-cover-bg-wrapper" style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
            <MediaRenderer
              src={block.data.backgroundImage}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              className="public-cover-bg"
            />
            <div
              className="public-cover-overlay"
              style={{
                position: 'absolute', inset: 0,
                background: `linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,${Math.max(block.data.overlayOpacity ?? 0.45, 0.45)}) 100%)`,
                zIndex: 1,
              }}
            />
          </div>
          <div className="public-cover-content" style={{ width: '100%', textAlign: block.data.coverTextAlign || 'center' }}>
            <div className="public-cover-crest" style={{ color: '#fff', marginBottom: 12 }}>
              <span className="public-cover-crest-circle" style={{ borderColor: 'rgba(255,255,255,0.4)' }}>{monogram}</span>
            </div>
            <p className="public-cover-subtitle animate-cover-1">{block.data.subtitle || 'The Wedding Celebration Of'}</p>
            <h1 className="public-cover-name animate-cover-2">{block.data.coupleName || 'Couple Name'}</h1>
            <p className="public-cover-date animate-cover-3">{block.data.date || ''}</p>
            {block.data.showGuestName && guestName && guestName !== 'Guest' && (
              <div className="public-cover-guest-card public-cover-guest-card--classic animate-cover-4">
                <p className="public-cover-guest-label">Special Invitation To</p>
                <p className="public-cover-guest-name">{guestName}</p>
              </div>
            )}
          </div>
          {block.data.showScrollIndicator && (
            <div className="public-cover-scroll">
              <div className="scroll-mouse"><div className="scroll-wheel" /></div>
              <span>Scroll Down</span>
            </div>
          )}
        </div>
      )
    }

    // ── HEADING ───────────────────────────────────────────────────────────
    case 'heading':
      return (
        <h2
          className="public-heading"
          style={{
            fontFamily: block.data.fontFamily || 'var(--font-display)',
            fontSize: `clamp(1.8rem, 8vw, ${block.data.fontSize || 36}px)`,
            color: block.data.color || primaryColor,
            textAlign: block.data.align || 'center',
            fontStyle: block.data.fontStyle || 'normal',
            fontWeight: block.data.fontWeight || 'normal',
            letterSpacing: `${block.data.letterSpacing || 0}em`,
            lineHeight: block.data.lineHeight || 1.2,
            textShadow: block.data.textShadow ? '0 2px 12px rgba(0,0,0,0.15)' : 'none',
          }}
          dangerouslySetInnerHTML={{ __html: (block.data.content || '').replace(/\n/g, '<br/>') }}
        />
      )

    // ── PARAGRAPH ─────────────────────────────────────────────────────────
    case 'paragraph':
      return (
        <p
          className="public-paragraph"
          style={{
            fontSize: block.data.fontSize || 15,
            color: block.data.color || 'var(--text-muted)',
            textAlign: block.data.align || 'center',
            lineHeight: block.data.lineHeight || 1.7,
            letterSpacing: `${block.data.letterSpacing || 0}em`,
            maxWidth: block.data.maxWidth ? `${block.data.maxWidth}px` : undefined,
            margin: '0 auto',
          }}
          dangerouslySetInnerHTML={{ __html: (block.data.content || '').replace(/\n/g, '<br/>') }}
        />
      )

    // ── QUOTE ─────────────────────────────────────────────────────────────
    case 'quote': {
      const qStyle = block.data.style || 'framed'
      const quoteText = block.data.text || block.data.content || ''
      const quoteSource = block.data.source || block.data.author || ''
      return (
        <div className={`public-quote public-quote--${qStyle}`} style={{ '--quote-color': block.data.color || primaryColor }}>
          {qStyle === 'framed' && (
            <div className="public-quote-mark" style={{ color: primaryColor }}>
              <svg width="24" height="18" viewBox="0 0 24 18" fill="currentColor" opacity="0.45">
                <path d="M6.5 0C2.9 0 0 2.9 0 6.5c0 3.3 2.5 6.1 5.8 6.5v4.5l5-4.8c1.3-1.3 2.1-3 2.1-4.7 0-3.6-2.9-6.5-6.4-6.5zm11 0c-3.6 0-6.5 2.9-6.5 6.5 0 3.3 2.5 6.1 5.8 6.5v4.5l5-4.8c1.3-1.3 2.1-3 2.1-4.7 0-3.6-2.9-6.5-6.4-6.5z" />
              </svg>
            </div>
          )}
          <blockquote className="public-quote-text" style={{ color: block.data.textColor || undefined }}>{quoteText}</blockquote>
          {quoteSource && <cite className="public-quote-source">{quoteSource}</cite>}
        </div>
      )
    }

    // ── PHOTO ─────────────────────────────────────────────────────────────
    case 'photo':
      return block.data.url ? (
        <div
          className={`public-photo public-photo--border-${block.data.borderStyle || 'none'}`}
          style={{
            borderRadius: block.data.fullWidth ? 0 : (block.data.borderRadius || 8),
            overflow: 'hidden',
            boxShadow: block.data.shadowIntensity > 0
              ? `0 ${block.data.shadowIntensity * 2}px ${block.data.shadowIntensity * 8}px rgba(0,0,0,${block.data.shadowIntensity * 0.08})`
              : 'none',
          }}
        >
          <MediaRenderer
            src={block.data.url}
            alt={block.data.caption || ''}
            style={{
              width: '100%',
              aspectRatio: block.data.aspectRatio !== 'auto' ? block.data.aspectRatio : undefined,
              objectFit: block.data.fit || 'cover',
              display: 'block',
            }}
          />
          {block.data.caption && (
            <p className="public-photo-caption">{block.data.caption}</p>
          )}
        </div>
      ) : null

    // ── PHOTO FRAME ───────────────────────────────────────────────────────
    case 'photoFrame': {
      const frameStyle = block.data.frameStyle || 'polaroid'
      if (!block.data.url) {
        if (!isPreviewUrl) return null
        return (
          <div className={`public-photoframe public-photoframe--${frameStyle} public-photoframe--placeholder`}>
            <div className="public-photoframe-placeholder">Add a photo</div>
          </div>
        )
      }
      return (
        <div className={`public-photoframe public-photoframe--${frameStyle}`}>
          <div className="public-photoframe-img-wrapper">
            <MediaRenderer src={block.data.url} alt={block.data.caption || ''} className="public-photoframe-img" />
            {block.data.caption && block.data.captionPosition === 'overlay' && (
              <div className="public-photoframe-caption-overlay">{block.data.caption}</div>
            )}
          </div>
          {block.data.caption && block.data.captionPosition !== 'overlay' && (
            <p className="public-photoframe-caption">{block.data.caption}</p>
          )}
        </div>
      )
    }

    // ── VIDEO ─────────────────────────────────────────────────────────────
    case 'video': {
      if (!block.data.url) {
        if (isPreviewUrl) {
          return (
            <div className="public-video-placeholder">
              <div className="public-video-play-icon">▶</div>
              <p>Video Placeholder</p>
            </div>
          )
        }
        return null
      }
      const ytId = extractYouTubeId(block.data.url)
      const vimeoId = extractVimeoId(block.data.url)

      if (ytId || vimeoId) {
        const embedUrl = ytId
          ? `https://www.youtube.com/embed/${ytId}?autoplay=${block.data.autoplay ? 1 : 0}&mute=${block.data.autoplay ? 1 : 0}&loop=${block.data.loop ? 1 : 0}${block.data.loop ? `&playlist=${ytId}` : ''}&rel=0`
          : `https://player.vimeo.com/video/${vimeoId}?autoplay=${block.data.autoplay ? 1 : 0}&muted=${block.data.autoplay ? 1 : 0}&loop=${block.data.loop ? 1 : 0}`
        return (
          <div style={{ borderRadius: block.data.fullWidth ? 0 : 12, overflow: 'hidden', aspectRatio: '16/9' }}>
            <iframe
              src={embedUrl}
              title="Embedded Video"
              style={{ width: '100%', height: '100%', border: 'none' }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )
      }
      return (
        <div style={{ borderRadius: block.data.fullWidth ? 0 : 12, overflow: 'hidden' }}>
          <video
            src={block.data.url}
            poster={block.data.thumbnailUrl || undefined}
            style={{ width: '100%', objectFit: 'cover', display: 'block' }}
            autoPlay={block.data.autoplay}
            loop={block.data.loop}
            muted={block.data.autoplay}
            controls={block.data.showControls !== false && !block.data.autoplay}
            playsInline
          />
        </div>
      )
    }

    // ── GALLERY ───────────────────────────────────────────────────────────
    case 'gallery': {
      const images = block.data.images || []
      const layoutMode = block.data.layoutMode || 'masonry'
      if (images.length === 0) {
        if (!isPreviewUrl) return null
        return (
          <div className="public-gallery public-gallery--placeholder">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="public-gallery-item public-gallery-placeholder-item">
                <HiOutlinePhotograph size={24} style={{ color: primaryColor, opacity: 0.45 }} />
              </div>
            ))}
          </div>
        )
      }
      return (
        <PublicGallery
          images={images}
          layoutMode={layoutMode}
          columns={block.data.columns || 2}
          enableLightbox={block.data.enableLightbox !== false}
          primaryColor={primaryColor}
        />
      )
    }

    // ── LOCATION ──────────────────────────────────────────────────────────
    case 'location': {
      const events = block.data.events || (block.data.venue ? [{
        name: 'Event',
        date: block.data.date,
        time: block.data.time,
        venue: block.data.venue,
        address: block.data.address,
        mapUrl: block.data.mapUrl,
      }] : [])
      const mapDisplay = block.data.mapDisplay || 'button'

      return (
        <div className="public-location">
          {events.map((event, idx) => {
            const embedSrc = (() => {
              if (!event.mapUrl) return null
              const placeMatch = event.mapUrl.match(/place\/([^/]+)/)
              const qMatch = event.mapUrl.match(/[?&]q=([^&]+)/)
              if (placeMatch) return `https://maps.google.com/maps?q=${encodeURIComponent(decodeURIComponent(placeMatch[1]))}&output=embed`
              if (qMatch) return `https://maps.google.com/maps?q=${qMatch[1]}&output=embed`
              return `https://maps.google.com/maps?q=${encodeURIComponent(event.address || event.venue || '')}&output=embed`
            })()
            const gcalUrl = buildGoogleCalendarUrl(event, invitationTitle)

            return (
              <div key={idx} className="public-location-card" style={{ borderColor: `${primaryColor}22` }}>
                <div className="public-location-card-header">
                  <span className="public-location-pill" style={{ color: primaryColor, backgroundColor: `${primaryColor}12` }}>
                    Event Schedule
                  </span>
                  <h3 className="public-location-title" style={{ color: primaryColor }}>
                    {event.name || 'Celebration'}
                  </h3>
                </div>

                <div className="public-location-datetime">
                  {event.date && (
                    <div className="public-location-meta-item">
                      <HiOutlineCalendar size={18} style={{ color: primaryColor, flexShrink: 0 }} />
                      <span className="public-location-date-text">{event.date}</span>
                    </div>
                  )}
                  {event.time && (
                    <div className="public-location-meta-item">
                      <HiOutlineClock size={17} style={{ color: primaryColor, flexShrink: 0 }} />
                      <span className="public-location-time-text">{event.time}</span>
                    </div>
                  )}
                </div>

                <div className="public-location-venue-box">
                  {event.venue && (
                    <div className="public-location-meta-item public-location-meta-item--venue">
                      <HiOutlineLocationMarker size={18} style={{ color: primaryColor, flexShrink: 0 }} />
                      <span className="public-location-venue-name">{event.venue}</span>
                    </div>
                  )}
                  {event.address && <p className="public-location-address">{event.address}</p>}
                </div>

                {event.mapUrl && mapDisplay === 'iframe' && embedSrc && (
                  <div className="public-location-map-embed">
                    <iframe
                      src={embedSrc}
                      style={{ width: '100%', height: 220, border: 'none', borderRadius: 12 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title={`Map for ${event.venue || event.name}`}
                    />
                  </div>
                )}
                <div className="public-location-actions">
                  {event.mapUrl && (
                    <a href={event.mapUrl} target="_blank" rel="noopener noreferrer" className="public-location-btn" style={{ background: primaryColor }}>
                      <HiOutlineLocationMarker size={16} />
                      Open in Google Maps
                    </a>
                  )}
                  <div className="public-location-cal-btns">
                    <a
                      href={gcalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="public-location-cal-btn"
                      style={{ borderColor: `${primaryColor}40`, color: primaryColor }}
                    >
                      <HiOutlineCalendar size={14} />
                      Google Calendar
                    </a>
                    <button
                      type="button"
                      onClick={() => downloadIcsFile(event, invitationTitle)}
                      className="public-location-cal-btn"
                      style={{ borderColor: `${primaryColor}40`, color: primaryColor }}
                    >
                      <HiOutlineCalendar size={14} />
                      Save .ICS
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )
    }

    // ── COUNTDOWN ─────────────────────────────────────────────────────────
    case 'countdown':
      return (
        <PublicCountdown
          targetDate={block.data.targetDate}
          label={block.data.label}
          expiredMessage={block.data.expiredMessage}
          showSeconds={block.data.showSeconds !== false}
          style={block.data.style || 'boxed'}
          primaryColor={primaryColor}
        />
      )

    // ── SCHEDULE ──────────────────────────────────────────────────────────
    case 'schedule': {
      const scheduleItems = block.data.items || []
      const layoutMode = block.data.layoutMode || 'timeline'
      return (
        <div className="public-schedule">
          {block.data.title && (
            <h4 className="public-schedule-title serif-italic" style={{ color: primaryColor }}>{block.data.title}</h4>
          )}
          <div className={`public-schedule-list public-schedule-list--${layoutMode}`}>
            {scheduleItems.map((item, i) => (
              <div key={i} className="public-schedule-item">
                {layoutMode === 'timeline' && (
                  <div className="public-schedule-timeline-dot" style={{ background: primaryColor }} />
                )}
                <div className="public-schedule-time" style={{ color: primaryColor }}>{item.time}</div>
                <div className="public-schedule-body">
                  {item.icon && <span className="public-schedule-icon">{item.icon}</span>}
                  <h5 className="public-schedule-event-title">{item.title}</h5>
                  {item.description && <p className="public-schedule-description">{item.description}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    }

    // ── RSVP ──────────────────────────────────────────────────────────────
    case 'rsvp': {
      const showQrTicket = block.data.showQrTicket !== false
      const showSessionChoice = block.data.showSessionChoice !== false
      const deadlineRaw = block.data.deadline || block.data.rsvpDeadline || ''
      const deadlineDate = deadlineRaw ? new Date(deadlineRaw) : null
      const isDeadlinePassed = Boolean(deadlineDate && !isNaN(deadlineDate.getTime()) && Date.now() > deadlineDate.getTime())

      const ticketGuestName = rsvpForm.name || (guestName && guestName !== 'Guest' ? guestName : 'Honored Guest')
      const activeToken = guestToken || ''
      const qrPayload = activeToken
        ? encodePassQrValue({ passToken: activeToken, invitationId, guestName: ticketGuestName })
        : encodePassQrValue({ invitationId, guestName: ticketGuestName })
      const displayTicketCode = activeToken || `INV-${Math.abs((ticketGuestName + invitationTitle).split('').reduce((a, c) => ((a << 5) - a) + c.charCodeAt(0), 0)).toString(36).toUpperCase().slice(0, 6)}`

      if (rsvpSent) {
        return (
          <div className="public-rsvp-done public-rsvp-celebration">
            <div className="public-rsvp-confetti" aria-hidden="true">
              <span /><span /><span /><span /><span /><span />
            </div>
            <div className="public-rsvp-done-icon" style={{ background: `${primaryColor}1A`, color: primaryColor }}>
              <HiOutlineCheck size={32} />
            </div>
            <span className="public-rsvp-celebrate-badge" style={{ color: primaryColor, background: `${primaryColor}12` }}>
              <HiOutlineSparkles size={13} /> Response Recorded
            </span>
            <h4 className="serif-italic">Thank You!</h4>
            <p>{block.data.confirmationMessage || 'Your attendance confirmation has been received.'}</p>

            {submittedAttendance === 'yes' && showQrTicket && (
              <div className="public-qr-ticket" style={{ borderColor: `${primaryColor}30` }}>
                <div className="public-qr-ticket-header" style={{ background: primaryColor }}>
                  <span className="public-qr-ticket-badge">PERSONAL ACCESS PASS</span>
                  <span className="public-qr-ticket-code">#{displayTicketCode}</span>
                </div>
                <div className="public-qr-ticket-body">
                  <div className="public-qr-ticket-matrix">
                    <ScannableQrCode
                      value={qrPayload}
                      size={140}
                      color="#1f241c"
                      label={`QR Entry Pass for ${ticketGuestName}`}
                    />
                  </div>
                  <div className="public-qr-ticket-info">
                    <p className="public-qr-ticket-name">{ticketGuestName}</p>
                    <div className="public-qr-ticket-meta">
                      <span><strong>{rsvpForm.guestCount || 1}</strong> {Number(rsvpForm.guestCount) === 1 ? 'Guest' : 'Guests'}</span>
                      {showSessionChoice && rsvpForm.session && (
                        <>
                          <span>•</span>
                          <span>{rsvpForm.session}</span>
                        </>
                      )}
                    </div>
                    <p className="public-qr-ticket-hint">
                      Present this QR pass at the venue reception desk for instant check-in.
                    </p>
                    <button
                      type="button"
                      className="public-qr-ticket-dl-btn"
                      style={{ color: primaryColor, borderColor: `${primaryColor}35` }}
                      onClick={() => downloadQrPng(qrPayload, `${slug}-entry-pass.png`, { color: primaryColor })}
                    >
                      <HiOutlineDownload size={14} /> Download QR Pass
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      }

      if (isDeadlinePassed && !isEditorCanvas) {
        return (
          <div className="public-rsvp-container">
            <div className="public-rsvp public-rsvp-closed" style={{ borderColor: `${primaryColor}25` }}>
              <div className="public-rsvp-done-icon" style={{ background: `${primaryColor}14`, color: primaryColor, margin: '0 auto 8px' }}>
                <HiOutlineClock size={26} />
              </div>
              <h4 className="serif-italic" style={{ fontSize: 22, color: primaryColor, margin: '4px 0' }}>
                {block.data.title || 'RSVP'}
              </h4>
              <p className="public-rsvp-closed-text">
                The RSVP window closed on {deadlineDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.
                Please reach out to the hosts directly for last-minute updates.
              </p>
            </div>
          </div>
        )
      }

      const rsvpSessions = Array.isArray(block.data.sessions) && block.data.sessions.length > 0
        ? block.data.sessions
        : sessionOptions

      return (
        <div className="public-rsvp-container">
          <form className="public-rsvp" onSubmit={e => handleRsvp(e, 'yes')}>
            <h4 className="serif-italic" style={{ fontSize: 26, marginBottom: 8, color: primaryColor }}>
              {block.data.title || 'RSVP'}
            </h4>
            {deadlineDate && !isNaN(deadlineDate.getTime()) && (
              <p className="public-rsvp-deadline-note">
                Kindly respond by {deadlineDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            )}

            {guestName && guestName !== 'Guest' ? (
              <div className="public-rsvp-guest-card" style={{ borderColor: `${primaryColor}30`, background: `${primaryColor}08` }}>
                <div className="public-rsvp-guest-tag">
                  <HiOutlineLockClosed size={12} style={{ color: primaryColor }} />
                  <span>Reserved Invitation For</span>
                </div>
                <h5 className="public-rsvp-guest-title" style={{ color: primaryColor }}>{guestName}</h5>
              </div>
            ) : (
              <div className="public-rsvp-field">
                <label htmlFor="rsvp-name">Full Name</label>
                <input
                  id="rsvp-name"
                  className="public-input"
                  placeholder="Enter your full name"
                  value={rsvpForm.name}
                  onChange={e => setRsvpForm({ ...rsvpForm, name: e.target.value })}
                  required
                />
              </div>
            )}

            <div className="public-rsvp-field">
              <label htmlFor="rsvp-whatsapp">WhatsApp Number</label>
              <input
                id="rsvp-whatsapp"
                className="public-input"
                type="tel"
                placeholder="+62 812..."
                value={rsvpForm.whatsapp || ''}
                onChange={e => setRsvpForm({ ...rsvpForm, whatsapp: e.target.value })}
              />
            </div>

            {block.data.showGuestCount !== false && (
              <div className="public-rsvp-field">
                <label htmlFor="rsvp-pax">Number of Guests</label>
                <select
                  id="rsvp-pax"
                  className="public-input public-input--select"
                  value={rsvpForm.guestCount || 1}
                  onChange={e => setRsvpForm({ ...rsvpForm, guestCount: Number(e.target.value) })}
                >
                  {[1, 2, 3, 4, 5].map(n => (
                    <option key={n} value={n}>{n} {n === 1 ? 'Guest' : 'Guests'}</option>
                  ))}
                </select>
              </div>
            )}

            {showSessionChoice && (
              <div className="public-rsvp-field">
                <label htmlFor="rsvp-session">Attending Session</label>
                <select
                  id="rsvp-session"
                  className="public-input public-input--select"
                  value={rsvpForm.session || rsvpSessions[0]}
                  onChange={e => setRsvpForm({ ...rsvpForm, session: e.target.value })}
                >
                  {rsvpSessions.map((sess, i) => (
                    <option key={i} value={sess}>{sess}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="public-rsvp-field">
              <label htmlFor="rsvp-dietary">Dietary or Special Notes (Optional)</label>
              <input
                id="rsvp-dietary"
                className="public-input"
                placeholder="e.g. Vegetarian, Halal, wheelchair access"
                value={rsvpForm.dietaryNote || ''}
                onChange={e => setRsvpForm({ ...rsvpForm, dietaryNote: e.target.value })}
              />
            </div>

            <div className="public-rsvp-buttons">
              <button
                type="button"
                className="public-rsvp-btn public-rsvp-btn--attend"
                style={{ background: primaryColor }}
                onClick={e => handleRsvp(e, 'yes')}
                disabled={isRsvpLoading}
              >
                {isRsvpLoading ? 'Saving...' : (block.data.attendingLabel || 'Joyfully Accepts')}
              </button>
              <button
                type="button"
                className="public-rsvp-btn public-rsvp-btn--decline"
                onClick={e => handleRsvp(e, 'no')}
                disabled={isRsvpLoading}
              >
                {isRsvpLoading ? 'Saving...' : (block.data.declineLabel || 'Regretfully Declines')}
              </button>
            </div>
          </form>
        </div>
      )
    }

    // ── COUPLE ────────────────────────────────────────────────────────────
    case 'couple': {
      const photoShape = block.data.photoShape || 'portrait'
      const layout = block.data.layout || 'staggered'
      const initial1 = (block.data.name1 || 'A').trim().charAt(0).toUpperCase()
      const initial2 = (block.data.name2 || 'B').trim().charAt(0).toUpperCase()
      return (
        <div className={`public-couple public-couple--${layout}`}>
          <div className="public-couple-row">
            <div className="public-person">
              {block.data.photo1 ? (
                <div className={`public-person-img-wrapper public-person-img--${photoShape}`} style={{ borderColor: `${primaryColor}25` }}>
                  <MediaRenderer src={block.data.photo1} className="public-person-img" alt={block.data.name1 || 'Partner 1'} />
                </div>
              ) : (
                <div className="public-person-monogram" style={{ borderColor: `${primaryColor}35`, color: primaryColor, background: `${primaryColor}0C` }}>
                  <span className="serif-italic">{initial1}</span>
                </div>
              )}
              <div className="public-person-info">
                <span className="public-person-role" style={{ color: primaryColor }}>THE GROOM</span>
                <h3 className="public-person-name" style={{ color: primaryColor }}>{block.data.name1 || ''}</h3>
                {block.data.title1 && <p className="public-person-title">{block.data.title1}</p>}
              </div>
              {block.data.instagram1 && (
                <a href={`https://instagram.com/${block.data.instagram1}`} target="_blank" rel="noopener noreferrer" className="public-person-ig" style={{ color: primaryColor }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>
                  <span>@{block.data.instagram1}</span>
                </a>
              )}
            </div>

            {block.data.showAmpersand !== false && (
              <div className="public-couple-amp" style={{ color: primaryColor }}>
                <span className="public-couple-amp-symbol">&</span>
              </div>
            )}

            <div className="public-person" style={{ marginTop: layout === 'staggered' && block.data.photo2 ? 44 : 0 }}>
              {block.data.photo2 ? (
                <div className={`public-person-img-wrapper public-person-img--${photoShape}`} style={{ borderColor: `${primaryColor}25` }}>
                  <MediaRenderer src={block.data.photo2} className="public-person-img" alt={block.data.name2 || 'Partner 2'} />
                </div>
              ) : (
                <div className="public-person-monogram" style={{ borderColor: `${primaryColor}35`, color: primaryColor, background: `${primaryColor}0C` }}>
                  <span className="serif-italic">{initial2}</span>
                </div>
              )}
              <div className="public-person-info">
                <span className="public-person-role" style={{ color: primaryColor }}>THE BRIDE</span>
                <h3 className="public-person-name" style={{ color: primaryColor }}>{block.data.name2 || ''}</h3>
                {block.data.title2 && <p className="public-person-title">{block.data.title2}</p>}
              </div>
              {block.data.instagram2 && (
                <a href={`https://instagram.com/${block.data.instagram2}`} target="_blank" rel="noopener noreferrer" className="public-person-ig" style={{ color: primaryColor }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>
                  <span>@{block.data.instagram2}</span>
                </a>
              )}
            </div>
          </div>
          {block.data.description && (
            <p className="public-couple-desc">{block.data.description}</p>
          )}
        </div>
      )
    }

    // ── STORY ─────────────────────────────────────────────────────────────
    case 'story':
      if (!block.data.items || block.data.items.length === 0) return null
      return (
        <div className="public-story">
          <div className="public-story-timeline">
            <div className="public-story-line" style={{ borderColor: primaryColor }} />
            {block.data.items.map((item, i) => (
              <div key={i} className={`public-story-item ${i % 2 === 0 ? 'public-story-item--left' : 'public-story-item--right'}`}>
                <div className="public-story-dot" style={{ backgroundColor: primaryColor }} />
                {item.photo && (
                  <div className="public-story-photo">
                    <img src={item.photo} alt={item.title} />
                  </div>
                )}
                <div className="public-story-content">
                  <span className="public-story-date" style={{ color: primaryColor }}>{item.date || 'Date'}</span>
                  <h5 className="public-story-title">{item.title || 'Moment'}</h5>
                  <p className="public-story-text">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )

    // ── DRESS CODE ────────────────────────────────────────────────────────
    case 'dressCode': {
      const swatches = block.data.swatches || []
      return (
        <div className="public-dresscode">
          <h4 className="serif-italic public-dresscode-title" style={{ color: primaryColor }}>{block.data.title || 'Dress Code'}</h4>
          {block.data.description && <p className="public-dresscode-desc">{block.data.description}</p>}
          {swatches.length > 0 && (
            <div className="public-dresscode-swatches">
              {swatches.map((swatch, i) => (
                <div key={i} className="public-dresscode-swatch-item">
                  <div className="public-dresscode-swatch-circle" style={{ background: swatch.color }}>
                    <div className="public-dresscode-swatch-inner" />
                  </div>
                  <span className="public-dresscode-swatch-label">{swatch.label || swatch.name}</span>
                </div>
              ))}
            </div>
          )}
          {block.data.note && (
            <div className="public-dresscode-note">
              <span>Note:</span> {block.data.note}
            </div>
          )}
        </div>
      )
    }

    // ── GIFT ──────────────────────────────────────────────────────────────
    case 'gift': {
      const giftData = block.data || {}
      const accounts = giftData.accounts?.length > 0
        ? giftData.accounts
        : (giftData.bankName ? [{ bankName: giftData.bankName, accountNumber: giftData.accountNumber, accountName: giftData.accountName }] : [])

      return (
        <div className="public-gift">
          <div className="public-gift-icon-bubble" style={{ width: 48, height: 48, borderRadius: '50%', background: `${primaryColor}15`, color: primaryColor, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <HiOutlineGift size={24} />
          </div>
          <h4 className="serif-italic public-gift-title" style={{ color: primaryColor }}>{giftData.title || 'Digital Gift'}</h4>
          {giftData.subtitle && <p className="public-gift-subtitle">{giftData.subtitle}</p>}

          <div style={{ margin: '12px 0 8px', textAlign: 'center' }}>
            <button
              type="button"
              className="public-gift-modal-trigger-btn"
              style={{ background: primaryColor }}
              onClick={() => onOpenGiftModal ? onOpenGiftModal() : null}
            >
              <HiOutlineGift size={18} />
              <span>Open Digital Gift</span>
            </button>
          </div>

          {!onOpenGiftModal && (
            <>
              {accounts.length > 0 && (
                <div className="public-gift-accounts">
                  {accounts.map((acc, i) => (
                    <GiftAccountCard key={i} account={acc} primaryColor={primaryColor} isPreviewUrl={isPreviewUrl} />
                  ))}
                </div>
              )}

              {giftData.physicalAddress && (
                <PhysicalGiftCard
                  recipient={giftData.physicalRecipient}
                  phone={giftData.physicalPhone}
                  address={giftData.physicalAddress}
                  primaryColor={primaryColor}
                />
              )}

              {giftData.qrisImage && (
                <div className="public-gift-qris">
                  <p className="public-gift-qris-label">QRIS</p>
                  <button
                    type="button"
                    className="public-gift-qris-trigger"
                    onClick={() => onOpenQrisLightbox?.(giftData.qrisImage)}
                  >
                    <img src={giftData.qrisImage} alt="QRIS Code" className="public-gift-qris-img" />
                  </button>
                </div>
              )}
            </>
          )}

          {giftData.registryLinks?.length > 0 && (
            <div className="public-gift-registry">
              <p className="public-gift-registry-label">Gift Registry</p>
              {giftData.registryLinks.map((link, i) => (
                <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="public-gift-registry-link" style={{ borderColor: primaryColor, color: primaryColor }}>
                  <HiOutlineExternalLink size={16} /> {link.label || 'Visit Registry'}
                </a>
              ))}
            </div>
          )}
        </div>
      )
    }

    // ── WISHES ────────────────────────────────────────────────────────────
    case 'wishes': {
      const displayMode = block.data.displayMode || 'masonry'
      return (
        <div className="public-wishes">
          <h4 className="serif-italic public-wishes-title" style={{ color: primaryColor }}>
            {block.data.title || 'Wishes & Blessings'}
          </h4>

          <form className="public-wish-form" onSubmit={handleSendWish}>
            {wishSent && (
              <div className="public-wish-sent-msg">
                <HiOutlineCheck size={16} /> Thank you! Your warm wish has been posted.
              </div>
            )}
            <input
              className="public-input"
              placeholder="Your name"
              value={wishForm.name}
              onChange={e => setWishForm({ ...wishForm, name: e.target.value })}
              required
              disabled={isWishLoading}
            />
            <textarea
              className="public-input"
              placeholder="Write a heartfelt message or blessing..."
              rows={3}
              value={wishForm.content}
              onChange={e => setWishForm({ ...wishForm, content: e.target.value })}
              required
              disabled={isWishLoading}
            />
            <button type="submit" className="public-wish-btn" style={{ background: primaryColor }} disabled={isWishLoading || !wishForm.content.trim()}>
              {isWishLoading ? 'Sending...' : 'Send Wish'}
            </button>
          </form>

          {wishes.length > 0 && (
            <div className={`public-wishes-list public-wishes-list--${displayMode}`}>
              {wishes.map((msg, i) => {
                const isAttending = msg.attendance === 'yes' || msg.attendance === 'attending' || msg.attendance === true
                const isDeclined = msg.attendance === 'no' || msg.attendance === 'declined' || msg.attendance === false
                return (
                  <div key={msg.id || i} className="public-wish-card">
                    <div className="public-wish-avatar" style={{ background: `${primaryColor}20`, color: primaryColor }}>
                      {(msg.author || 'G').charAt(0).toUpperCase()}
                    </div>
                    <div className="public-wish-body">
                      <p className="public-wish-content">&ldquo;{msg.content}&rdquo;</p>
                      <div className="public-wish-footer">
                        <div className="public-wish-author-row">
                          <span className="public-wish-author" style={{ color: primaryColor }}>{msg.author || 'Guest'}</span>
                          {isAttending && (
                            <span className="public-wish-badge public-wish-badge--yes" style={{ background: `${primaryColor}15`, color: primaryColor }}>
                              Attending
                            </span>
                          )}
                          {isDeclined && (
                            <span className="public-wish-badge public-wish-badge--no">
                              Unable to Attend
                            </span>
                          )}
                        </div>
                        {msg.date && (
                          <span className="public-wish-date">
                            {new Date(msg.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )
    }

    // ── ORNAMENT (was divider) ────────────────────────────────────────────
    case 'ornament':
    case 'divider': {
      const ornStyle = block.data.style || 'floral'
      const ornColor = block.data.color || '#C4A882'
      const ornWidth = block.data.width || 60
      return (
        <div className={`public-ornament public-ornament--${ornStyle}`} style={{ '--ornament-color': ornColor, '--ornament-width': `${ornWidth}%` }}>
          {ornStyle === 'floral' && (
            <svg viewBox="0 0 200 24" className="public-ornament-svg" preserveAspectRatio="xMidYMid meet">
              <path d="M100 12 C95 6, 85 4, 80 8 C75 12, 78 18, 84 16 C78 18, 72 14, 72 8 C72 2, 80 0, 86 4 C80 0, 88 -2, 96 4 C100 7, 104 7, 108 4 C116 -2, 124 0, 118 4 C124 0, 132 2, 132 8 C132 14, 126 18, 120 16 C126 18, 129 12, 124 8 C119 4, 109 6, 104 12 L100 15 Z" fill={ornColor} opacity="0.6" />
              <line x1="0" y1="12" x2="75" y2="12" stroke={ornColor} strokeWidth="1" opacity="0.3" />
              <line x1="125" y1="12" x2="200" y2="12" stroke={ornColor} strokeWidth="1" opacity="0.3" />
            </svg>
          )}
          {ornStyle === 'line' && <div className="public-ornament-line" />}
          {ornStyle === 'double-line' && (
            <div className="public-ornament-double">
              <div className="public-ornament-line" />
              <div className="public-ornament-line" style={{ marginTop: 4 }} />
            </div>
          )}
          {ornStyle === 'dots' && (
            <div className="public-ornament-dots">
              {[...Array(5)].map((_, i) => <div key={i} className="public-ornament-dot" />)}
            </div>
          )}
          {ornStyle === 'wave' && (
            <svg viewBox="0 0 200 16" className="public-ornament-svg">
              <path d="M0 8 Q25 2, 50 8 T100 8 T150 8 T200 8" stroke={ornColor} strokeWidth="1.5" fill="none" opacity="0.5" />
            </svg>
          )}
        </div>
      )
    }

    // ── FOOTER ────────────────────────────────────────────────────────────
    case 'footer': {
      const footerPhotos = block.data.photos || []
      const bgStyle = block.data.bgStyle || 'dark'
      const bgCss = bgStyle === 'gradient'
        ? `linear-gradient(180deg, ${block.data.gradientFrom || '#2D2D2D'} 0%, ${block.data.gradientTo || '#1a1a1a'} 100%)`
        : bgStyle === 'dark' ? 'linear-gradient(180deg, #2a2a2a 0%, #111 100%)'
          : undefined

      return (
        <div className="public-footer-block" style={{ background: bgCss }}>
          {footerPhotos.length > 0 && bgStyle === 'slideshow' && (
            <div className="public-footer-slideshow">
              {footerPhotos.map((photo, i) => (
                <MediaRenderer key={i} src={photo} className="public-footer-slide" style={{ animationDelay: `${i * 5}s` }} />
              ))}
              <div className="public-footer-slideshow-overlay" />
            </div>
          )}
          <div className="public-footer-content">
            <p className="public-footer-thankyou">{block.data.thankYouText || 'Thank You'}</p>
            <h2 className="public-footer-couple">{block.data.coupleName || ''}</h2>
            <p className="public-footer-subtitle">{block.data.subtitle || ''}</p>
            {block.data.showWatermark && (
              <div className="public-footer-watermark">
                <img src={Logo} alt="Invori" style={{ height: 14, opacity: 0.4, filter: 'brightness(0) invert(1)' }} />
                <p>DIGITAL INVITATION BY INVORI</p>
              </div>
            )}
          </div>
        </div>
      )
    }

    case 'floatingOrnament': {
      const mediaUrl = block.data.url
      const width = block.data.width || 120
      const height = block.data.height || 120
      const xPosition = block.data.xPosition ?? 50
      const yPosition = block.data.yPosition ?? 0
      const zIndex = block.data.zIndex ?? 10
      const rotation = block.data.rotation ?? 0
      const opacity = (block.data.opacity ?? 100) / 100

      const floatStyle = {
        left: `${xPosition}%`,
        top: `${yPosition}px`,
        width: `${width}px`,
        height: `${height}px`,
        zIndex,
        opacity,
        transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
      }

      return (
        <div className="public-floating-ornament-container">
          {mediaUrl && (
            <MediaRenderer
              src={mediaUrl}
              className="public-floating-ornament-media"
              style={floatStyle}
              alt="Floating Ornament"
            />
          )}
          {isEditorCanvas && (
            <div className="editor-floating-ornament-anchor">
              Floating Ornament Anchor ({xPosition}%, {yPosition}px)
            </div>
          )}
        </div>
      )
    }

    case 'thankYou':
      return (
        <div className="public-thank-you">
          <h4 className="serif-italic" style={{ fontSize: 22, color: primaryColor, marginBottom: 16 }}>{block.data.title || 'Thank You'}</h4>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 24 }}>{block.data.description}</p>
          <div className="public-thank-you-signatures">
            {block.data.signature1 && (
              <div className="public-ty-sig">
                <span className="public-ty-sig-label">With Love,</span>
                <span className="public-ty-sig-name">{block.data.signature1}</span>
              </div>
            )}
            {block.data.signature2 && (
              <div className="public-ty-sig">
                <span className="public-ty-sig-label">Warmest Regards,</span>
                <span className="public-ty-sig-name">{block.data.signature2}</span>
              </div>
            )}
          </div>
          {block.data.coupleSignature && (
            <div className="public-thank-you-couple" style={{ color: primaryColor }}>{block.data.coupleSignature}</div>
          )}
        </div>
      )

    case 'liveStreaming': {
      const provider = block.data.provider || 'youtube'
      const title = block.data.title || 'Live Streaming'
      const desc = block.data.description || 'Join us virtually as we celebrate this cherished moment from afar.'
      const url = block.data.url
      const ytId = extractYouTubeId(url)
      return (
        <div className="public-livestreaming" style={{ textAlign: 'center', width: '100%' }}>
          <h4 className="serif-italic" style={{ fontSize: 22, color: primaryColor, marginBottom: 8 }}>{title}</h4>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20 }}>{desc}</p>
          {url ? (
            provider === 'youtube' && ytId ? (
              <div style={{ borderRadius: 12, overflow: 'hidden', aspectRatio: '16/9', boxShadow: '0 8px 30px rgba(0,0,0,0.08)' }}>
                <iframe
                  src={`https://www.youtube.com/embed/${ytId}?rel=0`}
                  title={title}
                  style={{ width: '100%', height: '100%', border: 'none' }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <a href={url} target="_blank" rel="noopener noreferrer" className="public-location-btn" style={{ background: primaryColor }}>
                <HiOutlineExternalLink size={16} /> Watch Live Stream
              </a>
            )
          ) : (
            <div style={{ padding: '24px', background: 'rgba(0,0,0,0.03)', borderRadius: 8, color: 'var(--text-muted)', fontSize: 13 }}>
              Live stream link will be available closer to the event.
            </div>
          )}
        </div>
      )
    }

    case 'weddingAR': {
      const title = block.data.title || 'Instagram AR Filter'
      const subtitle = block.data.subtitle || 'Capture and share moments from our celebration using our custom Instagram AR filter.'
      const url = block.data.url
      const qrCode = block.data.qrCode
      return (
        <div className="public-weddingar" style={{ textAlign: 'center', width: '100%' }}>
          <h4 className="serif-italic" style={{ fontSize: 22, color: primaryColor, marginBottom: 8 }}>{title}</h4>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20 }}>{subtitle}</p>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            {qrCode && (
              <img src={qrCode} alt="AR Filter QR Code" style={{ width: 140, height: 140, borderRadius: 12, border: '1px solid rgba(0,0,0,0.08)', padding: 8, background: '#fff' }} />
            )}
            {url && (
              <a href={url} target="_blank" rel="noopener noreferrer" className="public-location-btn" style={{ background: primaryColor }}>
                <HiOutlineCamera size={18} />
                <span>Open Instagram Filter</span>
              </a>
            )}
          </div>
        </div>
      )
    }

    case 'healthProtocol': {
      const items = [
        {
          label: 'Wear a Mask if Unwell',
          icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 8C4 6.89543 4.89543 6 6 6H18C19.1046 6 20 6.89543 20 8V13C20 16.3137 17.3137 19 14 19H10C6.68629 19 4 16.3137 4 13V8Z" />
              <path d="M4 10L1 11M20 10L23 11M4 13L1 12M20 13L23 12" />
              <path d="M8 10H16M8 14H16" />
            </svg>
          ),
        },
        {
          label: 'Sanitize Hands',
          icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2C12 2 6 8.5 6 12.5C6 15.8137 8.68629 18.5 12 18.5C15.3137 18.5 18 15.8137 18 12.5C18 8.5 12 2 12 2Z" />
              <path d="M9 13C9 13 10 16 13 16" />
            </svg>
          ),
        },
        {
          label: 'Mindful Spacing',
          icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12H19M5 12L8 9M5 12L8 15M19 12L16 9M19 12L16 15" />
              <circle cx="5" cy="5" r="1.5" />
              <circle cx="19" cy="5" r="1.5" />
            </svg>
          ),
        },
        {
          label: 'Warm Greetings',
          icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3V21M7 8L12 3L17 8M6 15L12 21L18 15" />
            </svg>
          ),
        },
      ]
      return (
        <div className="public-health" style={{ textAlign: 'center', width: '100%' }}>
          <h4 className="serif-italic" style={{ fontSize: 22, color: primaryColor, marginBottom: 8 }}>
            {block.data.title || 'Health & Safety Guidelines'}
          </h4>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>
            {block.data.description || 'For everyone’s comfort and wellbeing, please observe these gentle guidelines:'}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            {items.map((item, idx) => (
              <div key={idx} className="public-health-item">
                <div className="public-health-icon" style={{ color: primaryColor }}>{item.icon}</div>
                <div className="public-health-label">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      )
    }

    case 'socialShare': {
      const message = block.data.message || 'You are warmly invited to our celebration.'
      const url = typeof window !== 'undefined' ? window.location.href : ''
      const shareText = encodeURIComponent(`${message} ${url}`)
      const platforms = block.data.platforms || ['whatsapp', 'facebook', 'twitter', 'telegram']
      return (
        <div className="public-social-share">
          <h4 className="serif-italic" style={{ fontSize: 22, color: primaryColor, marginBottom: 8 }}>Share This Invitation</h4>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Share this joyous celebration with family and friends.</p>
          <div className="public-social-buttons">
            {platforms.includes('whatsapp') && (
              <a href={`https://api.whatsapp.com/send?text=${shareText}`} target="_blank" rel="noopener noreferrer" className="public-social-btn whatsapp" title="WhatsApp">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.488 1.459 5.407 1.46h.006c5.553 0 10.07-4.51 10.074-10.059.002-2.689-1.043-5.216-2.943-7.119C17.29 1.53 14.77.487 12.006.487 6.45.487 1.936 5.002 1.932 10.55c-.001 1.902.501 3.761 1.456 5.376l-1.018 3.722 3.823-1.002zM17.48 15.14c-.3-.15-1.782-.88-2.057-.98-.275-.1-.475-.15-.675.15-.2.3-.77.98-.94 1.18-.17.2-.35.225-.65.075-3.05-1.52-5.006-4.507-5.967-6.162-.27-.46-.02-.705.23-.956.225-.225.5-.58.75-.88.25-.3.325-.5.5-.83.17-.33.08-.63-.04-.88-.12-.25-.97-2.34-1.33-3.21-.35-.85-.71-.73-.97-.73h-.83c-.27 0-.72.1-1.1.52-.37.42-1.43 1.4-1.43 3.42 0 2.02 1.47 3.97 1.67 4.24.2.27 2.89 4.41 7 6.17 2.45 1.05 3.39 1.16 4.61.98.7-.1 2.15-.88 2.45-1.73.3-.85.3-1.58.21-1.73-.09-.15-.29-.24-.59-.39z" /></svg>
              </a>
            )}
            {platforms.includes('facebook') && (
              <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer" className="public-social-btn facebook" title="Facebook">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
              </a>
            )}
            {platforms.includes('twitter') && (
              <a href={`https://twitter.com/intent/tweet?text=${shareText}`} target="_blank" rel="noopener noreferrer" className="public-social-btn twitter" title="X / Twitter">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" /></svg>
              </a>
            )}
            {platforms.includes('telegram') && (
              <a href={`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer" className="public-social-btn telegram" title="Telegram">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M11.944 0C5.344 0 0 5.344 0 11.944c0 5.622 3.88 10.325 9.125 11.595-.125-.944-.233-2.385.044-3.578.25-1.077 1.6-6.786 1.6-6.786s-.408-.816-.408-2.025c0-1.9 1.1-3.32 2.483-3.32 1.17 0 1.73.875 1.73 1.925 0 1.177-.75 2.937-1.137 4.57-.32 1.36.68 2.467 2.022 2.467 2.428 0 4.294-2.56 4.294-6.254 0-3.27-2.35-5.56-5.707-5.56-3.89 0-6.175 2.92-6.175 5.935 0 1.176.45 2.436 1.017 3.115.11.133.127.25.093.385-.1.425-.333 1.358-.38 1.547-.06.26-.2.356-.46.24-1.72-.8-2.793-3.3-2.793-5.32 0-4.328 3.146-8.303 9.065-8.303 4.76 0 8.455 3.39 8.455 7.917 0 4.726-2.98 8.532-7.11 8.532-1.39 0-2.69-.72-3.136-1.58L10.9 20.358c-.36 1.378-.8 3.036-.8 3.036l-.01.037c2.51.77 5.176.243 7.21-1.394 2.033-1.637 3.178-4.083 3.178-6.657C20.478 5.344 15.134 0 11.944 0z" /></svg>
              </a>
            )}
          </div>
        </div>
      )
    }

    // ── QR ENTRY PASS ─────────────────────────────────────────────────────
    case 'qrPass': {
      const qrData = block.data || {}
      const qrTitle = qrData.title || 'QR E-Invitation'
      const qrSubtitle = qrData.subtitle || 'Present this QR code to our reception host at the venue for check-in and souvenir redemption.'
      const qrBg = qrData.cardColor || '#FAF7F2'
      const qrAccent = qrData.accentColor || primaryColor
      const passGuest = guestName && guestName !== 'Guest' ? guestName : (isPreviewUrl ? 'Honored Guest' : 'Invited Guest')
      const qrPayload = guestToken
        ? encodePassQrValue({ passToken: guestToken, invitationId, guestName: passGuest })
        : encodePassQrValue({ invitationId, guestName: passGuest })

      return (
        <div className="public-qr-pass-wrapper">
          <div className="public-qr-pass-card" style={{ background: qrBg, borderColor: `${qrAccent}25` }}>
            <div className="public-qr-pass-badge" style={{ background: qrAccent, color: '#fff' }}>
              <span>ENTRY PASS</span>
            </div>

            <div className="public-qr-pass-header">
              <h4 className="serif-italic public-qr-pass-title" style={{ color: qrAccent }}>{qrTitle}</h4>
              <p className="public-qr-pass-couple serif-italic">{invitationTitle || 'The Celebration'}</p>
            </div>

            <div className="public-qr-pass-guest">
              <span className="public-qr-pass-guest-label">Admit Guest</span>
              <strong className="public-qr-pass-guest-name" style={{ color: qrAccent }}>{passGuest}</strong>
            </div>

            <div className="public-qr-pass-code-container" style={{ borderColor: `${qrAccent}30` }}>
              <ScannableQrCode
                value={qrPayload}
                size={140}
                color={qrAccent}
                label={`Entry Pass QR for ${passGuest}`}
              />
            </div>

            <p className="public-qr-pass-instruction">{qrSubtitle}</p>

            <button
              type="button"
              className="public-qr-pass-btn"
              style={{ background: qrAccent, color: '#fff' }}
              onClick={() => downloadQrPng(qrPayload, `${slug}-qr-pass.png`, { color: qrAccent })}
            >
              <HiOutlineTicket size={18} />
              <span>Save QR Pass</span>
            </button>
          </div>
        </div>
      )
    }

    case 'desktopHero': {
      return null
    }

    default:
      return null
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function GiftAccountCard({ account, primaryColor, isPreviewUrl }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    if (!account.accountNumber) return
    navigator.clipboard.writeText(account.accountNumber).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <div className="public-gift-card public-gift-card--premiere" style={{ borderColor: `${primaryColor}25` }}>
      <div className="public-gift-card-top">
        <div className="public-gift-chip">
          <svg width="28" height="22" viewBox="0 0 28 22" fill="none">
            <rect x="0.5" y="0.5" width="27" height="21" rx="3.5" fill="#D8B86A" fillOpacity="0.3" stroke="#C5A059" />
            <path d="M9 1V21M19 1V21M1 8H27M1 14H27" stroke="#C5A059" strokeOpacity="0.6" strokeWidth="0.8" />
          </svg>
        </div>
        <span className="public-gift-bank-name" style={{ color: primaryColor }}>
          {account.bankName || (isPreviewUrl ? 'BANK' : '')}
        </span>
      </div>
      <div className="public-gift-account-number" onClick={handleCopy} title="Tap to copy account number">
        <span>{account.accountNumber || (isPreviewUrl ? '0000 0000 00' : '')}</span>
        <button type="button" className="public-gift-copy-pill" style={{ background: copied ? primaryColor : `${primaryColor}14`, color: copied ? '#fff' : primaryColor }}>
          {copied ? <><HiOutlineCheck size={14} /> Copied</> : <><HiOutlineClipboard size={14} /> Copy</>}
        </button>
      </div>
      <div className="public-gift-account-name">Account Holder: {account.accountName || (isPreviewUrl ? 'Recipient Name' : '')}</div>
    </div>
  )
}

function PhysicalGiftCard({ recipient, phone, address, primaryColor }) {
  const [copied, setCopied] = useState(false)
  const fullText = [recipient, phone, address].filter(Boolean).join(' - ')
  const handleCopy = () => {
    navigator.clipboard.writeText(fullText).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <div className="public-gift-physical" style={{ borderColor: `${primaryColor}28` }}>
      <div className="public-gift-physical-header">
        <span className="public-gift-physical-badge" style={{ background: `${primaryColor}15`, color: primaryColor }}>
          Delivery Address
        </span>
        <button type="button" onClick={handleCopy} className="public-gift-copy-pill" style={{ background: copied ? primaryColor : `${primaryColor}14`, color: copied ? '#fff' : primaryColor }}>
          {copied ? <><HiOutlineCheck size={14} /> Address Copied</> : <><HiOutlineClipboard size={14} /> Copy Address</>}
        </button>
      </div>
      {recipient && <p className="public-gift-physical-name">{recipient} {phone ? `(${phone})` : ''}</p>}
      <p className="public-gift-physical-address">{address}</p>
    </div>
  )
}

function PublicGallery({ images, layoutMode, columns, enableLightbox, primaryColor }) {
  const [lightboxIndex, setLightboxIndex] = useState(null)
  const [slideIndex, setSlideIndex] = useState(0)

  const openLightbox = (i) => { if (enableLightbox) setLightboxIndex(i) }
  const closeLightbox = () => setLightboxIndex(null)
  const prevLightbox = useCallback(() => setLightboxIndex(i => (i - 1 + images.length) % images.length), [images.length])
  const nextLightbox = useCallback(() => setLightboxIndex(i => (i + 1) % images.length), [images.length])

  if (layoutMode === 'slideshow') {
    return (
      <div className="public-gallery-slideshow">
        <div className="public-gallery-slideshow-track" style={{ transform: `translateX(-${slideIndex * 100}%)` }}>
          {images.map((img, i) => (
            <div key={i} className="public-gallery-slideshow-slide">
              <MediaRenderer src={img} className="public-gallery-slideshow-img" onClick={() => openLightbox(i)} alt={`Gallery photo ${i + 1}`} />
            </div>
          ))}
        </div>
        <button type="button" className="public-gallery-slideshow-btn public-gallery-slideshow-btn--prev" onClick={() => setSlideIndex(i => (i - 1 + images.length) % images.length)} aria-label="Previous photo">
          <HiChevronLeft size={20} />
        </button>
        <button type="button" className="public-gallery-slideshow-btn public-gallery-slideshow-btn--next" onClick={() => setSlideIndex(i => (i + 1) % images.length)} aria-label="Next photo">
          <HiChevronRight size={20} />
        </button>
        <div className="public-gallery-slideshow-dots">
          {images.map((_, i) => (
            <button type="button" key={i} className={`public-gallery-dot ${i === slideIndex ? 'active' : ''}`} onClick={() => setSlideIndex(i)} style={{ background: i === slideIndex ? primaryColor : undefined }} aria-label={`Slide ${i + 1}`} />
          ))}
        </div>
        {lightboxIndex !== null && <GalleryLightbox images={images} index={lightboxIndex} onClose={closeLightbox} onPrev={prevLightbox} onNext={nextLightbox} />}
      </div>
    )
  }

  if (layoutMode === 'masonry') {
    return (
      <>
        <div className="public-gallery public-gallery--masonry" style={{ columns }}>
          {images.map((img, i) => (
            <div key={i} className="public-gallery-item" onClick={() => openLightbox(i)}>
              <MediaRenderer src={img} className="public-gallery-img" alt={`Gallery photo ${i + 1}`} />
            </div>
          ))}
        </div>
        {lightboxIndex !== null && <GalleryLightbox images={images} index={lightboxIndex} onClose={closeLightbox} onPrev={prevLightbox} onNext={nextLightbox} />}
      </>
    )
  }

  return (
    <>
      <div className="public-gallery public-gallery--grid" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {images.map((img, i) => (
          <div key={i} className="public-gallery-item" onClick={() => openLightbox(i)}>
            <MediaRenderer src={img} className="public-gallery-img" alt={`Gallery photo ${i + 1}`} />
          </div>
        ))}
      </div>
      {lightboxIndex !== null && <GalleryLightbox images={images} index={lightboxIndex} onClose={closeLightbox} onPrev={prevLightbox} onNext={nextLightbox} />}
    </>
  )
}

function GalleryLightbox({ images, index, onClose, onPrev, onNext }) {
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') onPrev()
      if (e.key === 'ArrowRight') onNext()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose, onPrev, onNext])

  return (
    <div className="public-lightbox" onClick={onClose}>
      <button type="button" className="public-lightbox-close" onClick={onClose} aria-label="Close lightbox"><HiOutlineX size={24} /></button>
      <button type="button" className="public-lightbox-btn public-lightbox-btn--prev" onClick={e => { e.stopPropagation(); onPrev() }} aria-label="Previous photo"><HiChevronLeft size={28} /></button>
      <div className="public-lightbox-img-wrapper" onClick={e => e.stopPropagation()}>
        <MediaRenderer src={images[index]} className="public-lightbox-img" alt={`Photo ${index + 1}`} />
        <span className="public-lightbox-counter">{index + 1} / {images.length}</span>
      </div>
      <button type="button" className="public-lightbox-btn public-lightbox-btn--next" onClick={e => { e.stopPropagation(); onNext() }} aria-label="Next photo"><HiChevronRight size={28} /></button>
    </div>
  )
}

function PublicCountdown({ targetDate, label, expiredMessage, showSeconds, style, primaryColor }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0, secs: 0 })
  const [expired, setExpired] = useState(false)

  useEffect(() => {
    if (!targetDate) return undefined
    const tick = () => {
      const target = new Date(targetDate)
      const now = new Date()
      const diff = target - now
      if (diff <= 0) {
        setExpired(true)
        setTimeLeft({ days: 0, hours: 0, mins: 0, secs: 0 })
        return
      }
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        mins: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        secs: Math.floor((diff % (1000 * 60)) / 1000),
      })
    }
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [targetDate])

  if (expired) {
    return (
      <div className="public-countdown public-countdown--expired" style={{ color: primaryColor }}>
        <p className="serif-italic" style={{ fontSize: '1.8rem' }}>{expiredMessage || 'The celebration has arrived!'}</p>
      </div>
    )
  }

  const units = [
    { value: timeLeft.days, label: 'Days' },
    { value: timeLeft.hours, label: 'Hours' },
    { value: timeLeft.mins, label: 'Minutes' },
    ...(showSeconds !== false ? [{ value: timeLeft.secs, label: 'Seconds' }] : []),
  ]

  return (
    <div className={`public-countdown public-countdown--${style || 'boxed'}`} style={{ '--countdown-color': primaryColor }}>
      {label && <p className="public-countdown-label">{label}</p>}
      <div className="public-countdown-units">
        {units.map((unit, i) => (
          <div key={i} className="pc-unit">
            <span className="pc-num">{String(unit.value).padStart(2, '0')}</span>
            <span className="pc-label">{unit.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ScrollRevealBlock({
  id,
  children,
  className,
  style,
  isCover = false,
  animationType = 'fade-in-up',
  rootRef = null,
  onClick,
  role,
  tabIndex,
  onKeyDown,
}) {
  const [isVisible, setIsVisible] = useState(isCover || animationType === 'none')
  const domRef = useRef()
  const ANIMATION_MAP = {
    'none': '',
    'fade-in': 'animate-fade-in',
    'fade-in-up': 'animate-fade-in-up',
    'fade-in-down': 'animate-fade-in-down',
    'slide-in-left': 'animate-slide-in-left',
    'slide-in-right': 'animate-slide-in-right',
    'zoom-in': 'animate-zoom-in',
  }
  useEffect(() => {
    if (isCover) return undefined
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          if (domRef.current) observer.unobserve(domRef.current)
        }
      })
    }, { threshold: 0.1, root: rootRef?.current || null, rootMargin: '0px 0px -50px 0px' })
    const currentRef = domRef.current
    if (currentRef) observer.observe(currentRef)
    return () => { if (currentRef) observer.unobserve(currentRef) }
  }, [isCover, rootRef])
  const animClass = isVisible ? (ANIMATION_MAP[animationType] || ANIMATION_MAP['fade-in-up']) : ''
  const blockStyle = !isVisible && !isCover && animationType !== 'none'
    ? { ...style, opacity: 0 }
    : style
  return (
    <div
      id={id}
      ref={domRef}
      className={`${className} ${animClass}`}
      style={blockStyle}
      onClick={onClick}
      role={role}
      tabIndex={tabIndex}
      onKeyDown={onKeyDown}
    >
      {children}
    </div>
  )
}

function BackgroundMusic({ url, songTitle, isPlaying, setIsPlaying, audioRef, hasBottomDock = false }) {
  return (
    <div className={`public-music-player ${hasBottomDock ? 'public-music-player--above-dock' : ''}`}>
      <audio ref={audioRef} src={url} loop preload="auto" />
      <button
        type="button"
        className={`music-circle-btn ${isPlaying ? 'playing' : 'paused'}`}
        onClick={() => setIsPlaying(!isPlaying)}
        aria-label={isPlaying ? 'Pause background music' : 'Play background music'}
        title={songTitle ? `${isPlaying ? 'Pause' : 'Play'}: ${songTitle}` : (isPlaying ? 'Pause music' : 'Play music')}
      >
        <div className="music-disc-vinyl">
          <HiOutlineMusicNote size={20} className="music-disc-icon" />
        </div>
      </button>
    </div>
  )
}

function IntroOverlay({ isOpen, onOpen, invitation, guestName }) {
  const envelopeBlock = invitation?.blocks?.find(b => b.type === 'envelopeAnimation')
  const coverBlock = invitation?.blocks?.find(b => b.type === 'cover')
  const coupleName = coverBlock?.data?.coupleName || invitation?.title || 'The Celebration'
  const subtitle = coverBlock?.data?.subtitle || 'Digital Invitation'
  const eventDate = coverBlock?.data?.date || ''
  const bgMedia = coverBlock?.data?.backgroundImage
  const monogram = envelopeBlock?.data?.monogram || extractMonogram(coupleName)

  if (envelopeBlock) {
    const gateStyle = envelopeBlock.data?.gateStyle || 'arch-gate'
    const envColor = envelopeBlock.data?.envelopeColor || invitation?.theme?.primaryColor || '#3D4828'
    const paperColor = envelopeBlock.data?.paperColor || invitation?.theme?.backgroundColor || '#FAF7F2'
    const btnText = envelopeBlock.data?.openButtonText || 'Open Invitation'

    // 1. SPLIT ARCH GATE
    if (gateStyle === 'arch-gate') {
      return (
        <div
          className={`gate-arch-overlay ${isOpen ? 'opened' : ''}`}
          style={{ '--gate-color': envColor, '--paper-color': paperColor }}
        >
          <div className="gate-arch-door gate-arch-door--left">
            <div className="gate-arch-panel-ornament" />
            <div className="gate-arch-handle gate-arch-handle--left" />
          </div>
          <div className="gate-arch-door gate-arch-door--right">
            <div className="gate-arch-panel-ornament" />
            <div className="gate-arch-handle gate-arch-handle--right" />
          </div>

          <div className="gate-arch-center">
            <div className="gate-arch-card" style={{ background: paperColor }}>
              <div className="gate-arch-card-frame" style={{ borderColor: `${envColor}25` }}>
                {bgMedia && (
                  <div className="gate-arch-photo-window" style={{ borderColor: `${envColor}35` }}>
                    <MediaRenderer
                      src={bgMedia}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div className="gate-arch-photo-scrim" />
                  </div>
                )}
                <div className="gate-arch-monogram" style={{ color: envColor, borderColor: `${envColor}35` }}>
                  <span className="serif-italic">{monogram}</span>
                </div>
                <p className="gate-arch-subtitle" style={{ color: envColor }}>{subtitle}</p>
                <h1 className="gate-arch-title serif-italic" style={{ color: envColor }}>{coupleName}</h1>
                {eventDate && <p className="gate-arch-date">{eventDate}</p>}

                {guestName && guestName !== 'Guest' && (
                  <div className="gate-arch-guest" style={{ borderColor: `${envColor}25`, background: `${envColor}08` }}>
                    <p className="gate-arch-guest-label">Dear Invited Guest</p>
                    <h2 className="gate-arch-guest-name" style={{ color: envColor }}>{guestName}</h2>
                  </div>
                )}

                <button type="button" className="gate-arch-open-btn" style={{ background: envColor }} onClick={onOpen}>
                  <HiOutlineMailOpen size={16} />
                  <span>{btnText}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    }

    // 2. EDITORIAL MAGAZINE GATE
    if (gateStyle === 'editorial') {
      return (
        <div className={`gate-editorial-overlay ${isOpen ? 'opened' : ''}`} style={{ '--gate-color': envColor }}>
          {bgMedia && (
            <MediaRenderer
              src={bgMedia}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }}
            />
          )}
          <div className="gate-editorial-scrim" />
          <div className="gate-editorial-frame">
            <div className="gate-editorial-masthead">
              <span>INVORI ARCHIVE</span>
              <span>{monogram}</span>
              <span>{eventDate || 'SPECIAL ISSUE'}</span>
            </div>
            <div className="gate-editorial-body">
              <p className="gate-editorial-kicker">{subtitle}</p>
              <h1 className="gate-editorial-headline serif-italic">{coupleName}</h1>
              {guestName && guestName !== 'Guest' && (
                <div className="gate-editorial-guest">
                  <span>RESERVED FOR</span>
                  <strong>{guestName}</strong>
                </div>
              )}
              <button type="button" className="gate-editorial-btn" onClick={onOpen}>
                <HiOutlineMailOpen size={16} />
                <span>{btnText}</span>
              </button>
            </div>
          </div>
        </div>
      )
    }

    // 3. WAX SEAL ENVELOPE
    return (
      <div
        className={`envelope-overlay ${isOpen ? 'opened' : ''}`}
        style={{ '--envelope-color': envColor, '--paper-color': paperColor }}
      >
        <div className="envelope-wrapper">
          <div className="envelope-pocket" style={{ background: envColor }}>
            <div className="envelope-wax-seal" style={{ background: envColor }} onClick={onOpen} title={btnText}>
              <div className="envelope-wax-seal-rim" />
              <span className="envelope-wax-monogram serif-italic">{monogram}</span>
            </div>

            <div className="envelope-card" style={{ background: paperColor }}>
              <div className="envelope-card-inner" style={{ borderColor: `${envColor}25` }}>
                <div className="envelope-crest-monogram" style={{ color: envColor }}>
                  <span className="serif-italic">{monogram}</span>
                </div>
                <p className="envelope-subtitle" style={{ color: envColor }}>{subtitle}</p>
                <h1 className="envelope-title serif-italic" style={{ color: envColor }}>{coupleName}</h1>
                {eventDate && <p className="envelope-date">{eventDate}</p>}

                {guestName && guestName !== 'Guest' && (
                  <div className="envelope-guest-badge" style={{ borderColor: `${envColor}20`, background: `${envColor}08` }}>
                    <p className="envelope-guest-label">Dear Invited Guest</p>
                    <h2 className="envelope-guest-name" style={{ color: envColor }}>{guestName}</h2>
                  </div>
                )}

                <button type="button" className="envelope-open-action" style={{ background: envColor }} onClick={onOpen}>
                  <HiOutlineMailOpen size={16} />
                  <span>{btnText}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`public-intro-overlay ${isOpen ? 'hidden' : ''}`}>
      <div className="public-intro-container" style={{ position: 'relative', overflow: 'hidden' }}>
        {bgMedia && (
          <MediaRenderer
            src={bgMedia}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0, pointerEvents: 'none' }}
          />
        )}
        <div className="public-cover-overlay" style={{ backgroundColor: coverBlock?.data?.overlayColor || '#000000', opacity: coverBlock?.data?.overlayOpacity ?? 0.6 }} />
        <div className="public-intro-content">
          <div className="public-intro-header">
            <p className="public-cover-subtitle" style={{ color: '#fff', opacity: 0.8 }}>{subtitle}</p>
            <h1 className="serif-italic" style={{ color: '#fff', fontSize: 'clamp(2rem, 10vw, 3.2rem)', margin: '12px 0', lineHeight: 1.15 }}>
              {coupleName}
            </h1>
            {eventDate && (
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 8 }}>{eventDate}</p>
            )}
          </div>
          {guestName && guestName !== 'Guest' && (
            <div className="public-intro-guest">
              <p className="public-intro-guest-label">Dear Invited Guest</p>
              <h2 className="public-intro-guest-name">{guestName}</h2>
            </div>
          )}
          <div style={{ marginTop: 32 }}>
            <button type="button" className="public-intro-btn" onClick={onOpen}>
              <HiOutlineMailOpen size={18} />
              Open Invitation
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

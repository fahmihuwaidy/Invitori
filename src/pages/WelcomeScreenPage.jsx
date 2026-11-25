import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams } from 'react-router-dom'
import {
  HiOutlineSparkles,
  HiOutlineArrowsExpand,
  HiOutlineGift,
  HiOutlineUserGroup,
  HiOutlineLocationMarker,
} from 'react-icons/hi'
import { useInvitations } from '../contexts/InvitationContext'
import { supabase, isConfigured } from '../lib/supabase'
import { DEMO_INVITATION_SLUGS, getDemoInvitationBySlug } from '../utils/presets'
import '../index.css'
import './WelcomeScreenPage.css'

const CHECKIN_CHANNEL = 'invori-checkin'
const CHECKIN_STORAGE_KEY = 'invori_checkin_event'

const SAMPLE_PREVIEW_GUESTS = [
  {
    id: 'preview-vip',
    name: 'Mr. Alexander & Mrs. Nadia Pratama',
    groupName: 'VIP',
    tableName: 'Royal Orchid Table 01',
    checkedInPax: 2,
    souvenirClaimed: true,
    checkedInAt: new Date().toISOString(),
  },
  {
    id: 'preview-family',
    name: 'The Wijaya Family',
    groupName: 'Family',
    tableName: 'Heritage Pavilion Table 03',
    checkedInPax: 4,
    souvenirClaimed: false,
    checkedInAt: new Date().toISOString(),
  },
  {
    id: 'preview-regular',
    name: 'Camille Laurent',
    groupName: 'Regular',
    tableName: 'Garden Terrace Table 08',
    checkedInPax: 2,
    souvenirClaimed: true,
    checkedInAt: new Date().toISOString(),
  },
]

function resolveDemoInvitation(idOrSlug) {
  const bySlug = getDemoInvitationBySlug(idOrSlug)
  if (bySlug) return bySlug
  for (const slug of DEMO_INVITATION_SLUGS) {
    const demo = getDemoInvitationBySlug(slug)
    if (demo && demo.id === idOrSlug) return demo
  }
  return null
}

function extractMonogram(title = '') {
  const parts = String(title || 'Invori').split(/[&+]/).map(s => s.trim()).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0].charAt(0).toUpperCase()} & ${parts[1].charAt(0).toUpperCase()}`
  }
  return parts[0] ? parts[0].slice(0, 2).toUpperCase() : 'I'
}

export default function WelcomeScreenPage() {
  const { id } = useParams()
  const { invitations } = useInvitations()

  const [invitation, setInvitation] = useState(null)
  const [clock, setClock] = useState(() => new Date())
  const [greetingQueue, setGreetingQueue] = useState([])
  const [recentArrivals, setRecentArrivals] = useState([])
  const [isFullscreen, setIsFullscreen] = useState(false)
  const previewIndexRef = useRef(0)

  const activeGreeting = greetingQueue[0] || null
  const resolvedInvId = invitation?.id || id

  // Live clock tick every second
  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Load invitation metadata
  useEffect(() => {
    let cancelled = false
    const loadInv = async () => {
      let found = invitations.find(i => i.id === id || i.slug === id) || null
      if (!found) {
        found = resolveDemoInvitation(id)
      }
      if (!found && isConfigured) {
        try {
          const { data } = await supabase
            .from('invitations')
            .select('id, title, slug, category, primary_color, background_color')
            .or(`id.eq.${id},slug.eq.${id}`)
            .maybeSingle()
          if (data) {
            const { data: blocks } = await supabase
              .from('blocks')
              .select('type, data')
              .eq('invitation_id', data.id)
              .in('type', ['cover', 'location', 'desktopHero'])
            found = {
              id: data.id,
              title: data.title,
              slug: data.slug,
              category: data.category,
              theme: {
                primaryColor: data.primary_color,
                backgroundColor: data.background_color,
              },
              blocks: blocks || [],
            }
          }
        } catch {
          // Ignore error
        }
      }
      if (!cancelled) {
        setInvitation(found || { id, title: 'The Celebration', blocks: [], theme: {} })
      }
    }
    loadInv()
    return () => { cancelled = true }
  }, [id, invitations])

  const enqueueGuestGreeting = useCallback((guest) => {
    if (!guest?.name) return
    const normalized = {
      id: guest.id || `g-${Date.now()}`,
      name: guest.name,
      groupName: guest.groupName || guest.group_name || 'Regular',
      tableName: guest.tableName || guest.table_name || '',
      checkedInPax: Number(guest.checkedInPax ?? guest.checked_in_pax ?? guest.maxPax ?? 1) || 1,
      souvenirClaimed: Boolean(guest.souvenirClaimed ?? guest.souvenir_claimed ?? false),
      checkedInAt: guest.checkedInAt || guest.checked_in_at || new Date().toISOString(),
    }

    setGreetingQueue(prev => [...prev, normalized])
    setRecentArrivals(prev => {
      const filtered = prev.filter(item => item.name !== normalized.name)
      return [normalized, ...filtered].slice(0, 5)
    })
  }, [])

  // Advance greeting queue every 8 seconds when a card is active
  const currentGreetingId = activeGreeting?.id || null
  useEffect(() => {
    if (!currentGreetingId) return undefined
    const hideTimer = setTimeout(() => {
      setGreetingQueue(prev => prev.slice(1))
    }, 8000)
    return () => clearTimeout(hideTimer)
  }, [currentGreetingId])

  // Listen to BroadcastChannel, localStorage events, and Supabase Realtime
  useEffect(() => {
    const handleEventPayload = (payload) => {
      if (!payload || payload.type !== 'guest-checked-in') return
      if (payload.invitationId && resolvedInvId && payload.invitationId !== resolvedInvId && payload.invitationId !== id) {
        return
      }
      if (payload.guest) {
        enqueueGuestGreeting(payload.guest)
      }
    }

    let bc = null
    if (typeof BroadcastChannel !== 'undefined') {
      bc = new BroadcastChannel(CHECKIN_CHANNEL)
      bc.onmessage = (event) => handleEventPayload(event.data)
    }

    const onStorage = (event) => {
      if (event.key !== CHECKIN_STORAGE_KEY || !event.newValue) return
      try {
        handleEventPayload(JSON.parse(event.newValue))
      } catch {
        // Ignore malformed payload
      }
    }
    window.addEventListener('storage', onStorage)

    let rtChannel = null
    if (isConfigured && resolvedInvId) {
      rtChannel = supabase
        .channel(`invori-checkin-${resolvedInvId}`)
        .on('broadcast', { event: 'guest-checked-in' }, ({ payload }) => handleEventPayload(payload))
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'guests',
            filter: `invitation_id=eq.${resolvedInvId}`,
          },
          (payload) => {
            if (payload.new?.checked_in_at && !payload.old?.checked_in_at) {
              enqueueGuestGreeting(payload.new)
            }
          }
        )
        .subscribe()
    }

    return () => {
      bc?.close()
      window.removeEventListener('storage', onStorage)
      if (rtChannel) supabase.removeChannel(rtChannel)
    }
  }, [resolvedInvId, id, enqueueGuestGreeting])

  const handleTestGreeting = () => {
    const sample = SAMPLE_PREVIEW_GUESTS[previewIndexRef.current % SAMPLE_PREVIEW_GUESTS.length]
    previewIndexRef.current += 1
    const normalized = {
      ...sample,
      id: `${sample.id}-${Date.now()}`,
      checkedInAt: new Date().toISOString(),
    }
    setGreetingQueue([normalized])
    setRecentArrivals(prev => {
      const filtered = prev.filter(item => item.name !== normalized.name)
      return [normalized, ...filtered].slice(0, 5)
    })
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {})
      setIsFullscreen(true)
    } else {
      document.exitFullscreen?.().catch(() => {})
      setIsFullscreen(false)
    }
  }

  const coverBlock = invitation?.blocks?.find(b => b.type === 'cover')
  const locationBlock = invitation?.blocks?.find(b => b.type === 'location')
  const coupleNames = coverBlock?.data?.coupleName || invitation?.title || 'Our Celebration'
  const eventSubtitle = coverBlock?.data?.subtitle || 'Welcome Celebration'
  const eventDate = coverBlock?.data?.date || locationBlock?.data?.events?.[0]?.date || ''
  const eventVenue = locationBlock?.data?.events?.[0]?.venue || ''
  const coverPhoto = coverBlock?.data?.backgroundImage || ''
  const primaryColor = invitation?.theme?.primaryColor || '#344c2d'
  const monogram = extractMonogram(coupleNames)

  return (
    <div className="welcome-display" style={{ '--welcome-accent': primaryColor }}>
      {coverPhoto && (
        <div
          className="welcome-backdrop-media"
          style={{ backgroundImage: `url(${coverPhoto})` }}
          aria-hidden="true"
        />
      )}
      <div className="welcome-backdrop-scrim" aria-hidden="true" />

      <header className="welcome-header">
        <div className="welcome-brand">
          <div className="welcome-monogram-ring">
            <span className="serif-italic">{monogram}</span>
          </div>
          <div>
            <span className="welcome-kicker">{eventSubtitle}</span>
            <p className="welcome-event-name">{invitation?.title || coupleNames}</p>
          </div>
        </div>

        <div className="welcome-header-right">
          <div className="welcome-clock" aria-label="Live clock">
            <span className="welcome-clock-time">
              {clock.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
            <span className="welcome-clock-date">
              {clock.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
          </div>

          <div className="welcome-controls">
            <button type="button" className="welcome-btn" onClick={handleTestGreeting}>
              <HiOutlineSparkles size={16} />
              <span>Test Greeting</span>
            </button>
            <button
              type="button"
              className="welcome-btn welcome-btn--icon"
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              aria-label="Toggle fullscreen"
            >
              <HiOutlineArrowsExpand size={17} />
            </button>
          </div>
        </div>
      </header>

      <main className="welcome-stage">
        {activeGreeting ? (
          <section key={activeGreeting.id} className="welcome-guest-card" aria-live="polite">
            <div className="welcome-card-ornament">
              <span className="welcome-card-line" />
              <span className="welcome-card-kicker">WARMEST WELCOME</span>
              <span className="welcome-card-line" />
            </div>

            <span className={`welcome-group-badge badge-${(activeGreeting.groupName || 'Regular').toLowerCase()}`}>
              {activeGreeting.groupName || 'Regular'} Guest
            </span>

            <h1 className="welcome-guest-name serif-italic">{activeGreeting.name}</h1>

            <p className="welcome-guest-message">
              We are truly honored by your presence at the celebration of <strong>{coupleNames}</strong>.
            </p>

            <div className="welcome-guest-meta-grid">
              <div className="welcome-meta-tile">
                <HiOutlineLocationMarker size={18} />
                <div>
                  <span className="meta-label">Seating Table</span>
                  <strong className="meta-value">{activeGreeting.tableName || 'Open Seating'}</strong>
                </div>
              </div>
              <div className="welcome-meta-tile">
                <HiOutlineUserGroup size={18} />
                <div>
                  <span className="meta-label">Party Size</span>
                  <strong className="meta-value">
                    {activeGreeting.checkedInPax} {activeGreeting.checkedInPax === 1 ? 'Guest' : 'Guests'}
                  </strong>
                </div>
              </div>
              {activeGreeting.souvenirClaimed && (
                <div className="welcome-meta-tile">
                  <HiOutlineGift size={18} />
                  <div>
                    <span className="meta-label">Souvenir</span>
                    <strong className="meta-value">Redeemed</strong>
                  </div>
                </div>
              )}
            </div>
          </section>
        ) : (
          <section className="welcome-idle-hero">
            <p className="welcome-idle-kicker">{eventSubtitle}</p>
            <h1 className="welcome-idle-couple serif-italic">{coupleNames}</h1>
            {(eventDate || eventVenue) && (
              <p className="welcome-idle-details">
                {[eventDate, eventVenue].filter(Boolean).join('  •  ')}
              </p>
            )}
            <div className="welcome-idle-pill">
              <span className="welcome-pulse-dot" />
              <span>Reception Desk Active — Please Present Your QR Pass at Check-In</span>
            </div>
          </section>
        )}
      </main>

      <footer className="welcome-footer">
        {recentArrivals.length > 0 ? (
          <div className="welcome-ticker">
            <span className="welcome-ticker-label">Recent Arrivals</span>
            <div className="welcome-ticker-items">
              {recentArrivals.map((guest, idx) => (
                <span key={`${guest.id}-${idx}`} className="welcome-ticker-chip">
                  {guest.name}
                  {guest.tableName ? ` (${guest.tableName})` : ''}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <span className="welcome-footer-brand">INVORI DIGITAL ATELIER</span>
        )}
      </footer>
    </div>
  )
}

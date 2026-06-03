/* eslint-disable react-refresh/only-export-components */
import { useParams, useSearchParams } from 'react-router-dom'
import { useInvitations } from '../contexts/InvitationContext'
import { useState, useEffect, useRef, useCallback } from 'react'
import { HiOutlineCheck, HiOutlineLocationMarker, HiOutlineCalendar, HiOutlineClock, HiOutlineMusicNote, HiOutlineMailOpen, HiChevronLeft, HiChevronRight, HiOutlineX, HiOutlineClipboard, HiOutlineExternalLink } from 'react-icons/hi'
import Logo from '../assets/Logo.png'
import '../index.css'
import './PublicInvitationPage.css'


/** Detects if a URL points to a video file */
export const isMediaVideo = (url) => {
  if (!url) return false;
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov'];
  const lowerUrl = url.toLowerCase();
  if (videoExtensions.some(ext => lowerUrl.includes(ext))) return true;
  if (lowerUrl.includes('/video/upload/')) return true;
  return false;
};

/** Shared component to render either <img> or <video> */
export const MediaRenderer = ({ src, className, style, alt = "", ...props }) => {
  if (!src) return null;
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
    );
  }
  return <img src={src} className={className} style={style} alt={alt} {...props} />;
};

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC INVITATION PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function PublicInvitationPage() {
  const { slug } = useParams()
  const [searchParams] = useSearchParams()
  const { fetchPublicInvitation, incrementView, addRsvp } = useInvitations()
  const guestName = searchParams.get('to') || 'Guest'
  const isPreviewUrl = searchParams.get('preview') === 'true'
  const [invitation, setInvitation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [rsvpForm, setRsvpForm] = useState({ name: guestName, email: '', message: '', attendance: '', guestCount: 1 })
  const [rsvpSent, setRsvpSent] = useState(false)
  const [isRsvpLoading, setIsRsvpLoading] = useState(false)
  const [wishForm, setWishForm] = useState({ name: guestName, content: '' })
  const [isWishLoading, setIsWishLoading] = useState(false)
  const [wishSent, setWishSent] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef(null)
  const scrollContainerRef = useRef(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const inv = await fetchPublicInvitation(slug, isPreviewUrl)
      setInvitation(inv)
      setLoading(false)
      if (inv) incrementView(inv.id)
    }
    load()
  }, [slug, fetchPublicInvitation, incrementView, isPreviewUrl])

  const musicUrl = (invitation?.musicUrl === undefined || invitation?.musicUrl === null)
    ? 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
    : invitation.musicUrl

  useEffect(() => {
    if (musicUrl && audioRef.current) {
      if (isPlaying && isOpen) {
        audioRef.current.play().catch(e => console.log("Autoplay blocked:", e))
      } else {
        audioRef.current.pause()
      }
    }
  }, [isPlaying, isOpen, musicUrl])

  useEffect(() => {
    document.body.style.overflow = !isOpen ? 'hidden' : 'auto'
    return () => { document.body.style.overflow = 'auto' }
  }, [isOpen])

  const handleOpenInvitation = () => {
    setIsOpen(true)
    if (musicUrl) setIsPlaying(true)
  }

  if (loading) {
    return (
      <div className="public-page-wrapper">
        <div className="public-loading">
          <div className="public-loading-spinner" />
          <p className="serif-italic" style={{ color: '#8A8A8A', marginTop: 16 }}>Loading invitation...</p>
        </div>
      </div>
    )
  }

  if (!invitation) {
    return (
      <div className="public-page-wrapper">
        <div className="public-blocks public-not-found">
          <header style={{ textAlign: 'center', padding: '40px 20px' }}>
            <img src={Logo} alt="Invori Logo" style={{ height: 40, margin: '0 auto' }} />
            <h1 className="serif-italic" style={{ color: 'var(--olive)', marginTop: 16 }}>Invitation Not Available</h1>
            <p style={{ color: '#8A8A8A' }}>Please ensure you have the correct link.</p>
          </header>
        </div>
      </div>
    )
  }

  const theme = invitation.theme || {}

  const handleRsvp = async (e, attendanceValue) => {
    if (e) e.preventDefault()
    if (isRsvpLoading) return
    const submitAttendance = attendanceValue || rsvpForm.attendance || 'yes'
    setIsRsvpLoading(true)
    try {
      const success = await addRsvp(invitation.id, { ...rsvpForm, attendance: submitAttendance, sentAt: new Date().toISOString() })
      if (success) setRsvpSent(true)
    } catch (err) {
      console.error('RSVP Error:', err)
    } finally {
      setIsRsvpLoading(false)
    }
  }

  const handleSendWish = async (e) => {
    if (e) e.preventDefault()
    if (!wishForm.content.trim() || isWishLoading) return
    setIsWishLoading(true)
    try {
      const success = await addRsvp(invitation.id, {
        name: wishForm.name,
        email: 'wish@invori.com',
        message: wishForm.content,
        attendance: null,
        sentAt: new Date().toISOString()
      })
      if (success) {
        setWishSent(true)
        setInvitation(prev => ({
          ...prev,
          wishes: [{ author: wishForm.name, content: wishForm.content, date: new Date().toISOString() }, ...(prev.wishes || [])]
        }))
        setWishForm(prev => ({ ...prev, content: '' }))
        setTimeout(() => setWishSent(false), 3000)
      }
    } catch (err) {
      console.error('Wish Error:', err)
    } finally {
      setIsWishLoading(false)
    }
  }

  return (
    <div className="public-page-wrapper">
      <IntroOverlay isOpen={isOpen} onOpen={handleOpenInvitation} invitation={invitation} guestName={guestName} />

      {musicUrl && (
        <BackgroundMusic url={musicUrl} isPlaying={isPlaying} setIsPlaying={setIsPlaying} audioRef={audioRef} />
      )}

      <div ref={scrollContainerRef} className="public-blocks" style={{ background: theme.backgroundColor || '#EDE9E7' }}>
        {(invitation.blocks || [])
          .filter(block => block.type !== 'music' && block.type !== 'signature' && block.type !== 'registry')
          .map((block) => {
            const hasBg = !!block.data?.backgroundImage
            const blockMinHeight = block.data?.blockMinHeight || 0
            const bgAspectRatio = block.data?.backgroundAspectRatio || null
            const isCover = block.type === 'cover'
            const isFooter = block.type === 'footer'
            const isFullWidth = isCover || isFooter

            return (
              <ScrollRevealBlock
                key={block.id}
                isCover={isCover}
                rootRef={scrollContainerRef}
                animationType={block.data?.animation || 'fade-in-up'}
                className={`public-block ${isCover ? 'public-block-cover' : ''} ${isFooter ? 'public-block-footer' : ''}`}
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
                }}
              >
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
                    ...(block.data.fullWidth !== false ? { padding: 0, maxWidth: 'none', paddingLeft: isFullWidth ? 0 : 24, paddingRight: isFullWidth ? 0 : 24 } : { paddingLeft: 24, paddingRight: 24 })
                  }}
                >
                  {renderPublicBlock(
                    block, theme,
                    rsvpForm, setRsvpForm, handleRsvp, rsvpSent,
                    wishForm, setWishForm, handleSendWish, wishSent,
                    guestName, isPreviewUrl,
                    invitation.wishes || [],
                    isRsvpLoading, isWishLoading
                  )}
                </div>
              </ScrollRevealBlock>
            )
          })}
      </div>
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
  isWishLoading = false
) {
  const primaryColor = theme?.primaryColor || '#565F34'

  switch (block.type) {
    // ── COVER ──────────────────────────────────────────────────────────────
    case 'cover': {
      const layout = block.data.coverLayout || 'classic'
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
                backgroundColor: block.data.overlayColor || '#000000',
                opacity: block.data.overlayOpacity ?? 0.4,
                zIndex: 1,
              }}
            />
          </div>
          <div className="public-cover-content" style={{ width: '100%', textAlign: block.data.coverTextAlign || 'center' }}>
            <p className="public-cover-subtitle animate-cover-1">{block.data.subtitle || 'We Are Getting Married'}</p>
            <h1 className="public-cover-name animate-cover-2">{block.data.coupleName || 'Couple Name'}</h1>
            <p className="public-cover-date animate-cover-3">{block.data.date || ''}</p>
            {block.data.showGuestName && guestName && (
              <div className="public-cover-guest animate-cover-4">
                <p className="public-cover-guest-label">Special Invitation to</p>
                <p className="public-cover-guest-name">{guestName}</p>
              </div>
            )}
          </div>
          {block.data.showScrollIndicator && (
            <div className="public-cover-scroll">
              <div className="scroll-mouse"><div className="scroll-wheel" /></div>
              <span>Scroll</span>
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
            fontFamily: block.data.fontFamily || 'Gambarino',
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
      return (
        <div className={`public-quote public-quote--${qStyle}`} style={{ '--quote-color': block.data.color || primaryColor }}>
          {qStyle === 'framed' && <div className="public-quote-mark">"</div>}
          <blockquote className="public-quote-text">{block.data.text}</blockquote>
          {block.data.source && <cite className="public-quote-source">{block.data.source}</cite>}
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
            <div className="public-photoframe-placeholder">🖼 Add a photo</div>
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
        return null;
      }
      const isYouTube = block.data.url.includes('youtube.com') || block.data.url.includes('youtu.be');
      const isVimeo = block.data.url.includes('vimeo.com');
      if (isYouTube || isVimeo) {
        let embedUrl = block.data.url;
        if (isYouTube) {
          const videoId = embedUrl.includes('v=') ? embedUrl.split('v=')[1].split('&')[0] : embedUrl.split('/').pop();
          embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=${block.data.autoplay ? 1 : 0}&mute=${block.data.autoplay ? 1 : 0}&loop=${block.data.loop ? 1 : 0}`;
        } else {
          const videoId = embedUrl.split('/').pop();
          embedUrl = `https://player.vimeo.com/video/${videoId}?autoplay=${block.data.autoplay ? 1 : 0}&muted=${block.data.autoplay ? 1 : 0}&loop=${block.data.loop ? 1 : 0}`;
        }
        return (
          <div style={{ borderRadius: block.data.fullWidth ? 0 : 8, overflow: 'hidden', aspectRatio: '16/9' }}>
            <iframe src={embedUrl} style={{ width: '100%', height: '100%', border: 'none' }} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
          </div>
        );
      }
      return (
        <div style={{ borderRadius: block.data.fullWidth ? 0 : 8, overflow: 'hidden' }}>
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
      const images = block.data.images || [];
      const layoutMode = block.data.layoutMode || 'masonry'
      if (images.length === 0) {
        if (!isPreviewUrl) return null;
        return (
          <div className="public-gallery public-gallery--placeholder">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="public-gallery-item public-gallery-placeholder-item">
                <span>📸</span>
              </div>
            ))}
          </div>
        )
      }
      return <PublicGallery images={images} layoutMode={layoutMode} columns={block.data.columns || 2} enableLightbox={block.data.enableLightbox !== false} primaryColor={primaryColor} />
    }

    // ── LOCATION ──────────────────────────────────────────────────────────
    case 'location': {
      // Support both old single-event and new multi-event format
      const events = block.data.events || (block.data.venue ? [{
        name: 'Event',
        date: block.data.date,
        time: block.data.time,
        venue: block.data.venue,
        address: block.data.address,
        mapUrl: block.data.mapUrl,
        mapEmbed: '',
      }] : [])
      const mapDisplay = block.data.mapDisplay || 'button'

      return (
        <div className="public-location">
          {events.map((event, idx) => {
            const embedSrc = (() => {
              if (!event.mapUrl) return null
              // Convert share link to embed link
              const placeMatch = event.mapUrl.match(/place\/([^/]+)/)
              const qMatch = event.mapUrl.match(/[?&]q=([^&]+)/)
              if (placeMatch) return `https://maps.google.com/maps?q=${encodeURIComponent(placeMatch[1])}&output=embed`
              if (qMatch) return `https://maps.google.com/maps?q=${qMatch[1]}&output=embed`
              return `https://maps.google.com/maps?q=${encodeURIComponent(event.address || event.venue)}&output=embed`
            })()

            return (
              <div key={idx} className="public-location-event">
                {events.length > 1 && (
                  <div className="public-location-event-name" style={{ color: primaryColor }}>{event.name}</div>
                )}
                <div className="public-location-meta">
                  {event.date && (
                    <div className="public-location-meta-item">
                      <HiOutlineCalendar size={16} />
                      <span>{event.date}</span>
                    </div>
                  )}
                  {event.time && (
                    <div className="public-location-meta-item">
                      <HiOutlineClock size={16} />
                      <span>{event.time}</span>
                    </div>
                  )}
                  {event.venue && (
                    <div className="public-location-meta-item">
                      <HiOutlineLocationMarker size={16} />
                      <span>{event.venue}</span>
                    </div>
                  )}
                </div>
                {event.address && <p className="public-location-address">{event.address}</p>}
                {event.mapUrl && mapDisplay === 'iframe' && embedSrc && (
                  <div className="public-location-map-embed">
                    <iframe
                      src={embedSrc}
                      style={{ width: '100%', height: 220, border: 'none', borderRadius: 12 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title={`Map for ${event.venue}`}
                    />
                  </div>
                )}
                {event.mapUrl && (
                  <div style={{ textAlign: 'center', marginTop: 16 }}>
                    <a href={event.mapUrl} target="_blank" rel="noopener noreferrer" className="public-location-btn" style={{ background: primaryColor }}>
                      <HiOutlineLocationMarker size={16} />
                      Get Directions
                    </a>
                  </div>
                )}
                {idx < events.length - 1 && <div className="public-location-separator" />}
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
    case 'rsvp':
      if (rsvpSent) {
        return (
          <div className="public-rsvp-done">
            <div className="public-rsvp-done-icon" style={{ background: primaryColor + '20', color: primaryColor }}>
              <HiOutlineCheck size={32} />
            </div>
            <h4 className="serif-italic">Thank You!</h4>
            <p>{block.data.confirmationMessage || 'Your attendance confirmation has been saved.'}</p>
          </div>
        )
      }
      return (
        <div className="public-rsvp-container">
          <form className="public-rsvp">
            <h4 className="serif-italic" style={{ fontSize: 24, marginBottom: 28, color: primaryColor }}>{block.data.title || 'Attendance Confirmation'}</h4>
            <div className="public-rsvp-field">
              <label>Full Name</label>
              <input className="public-input" placeholder="Your full name" value={rsvpForm.name} onChange={e => setRsvpForm({ ...rsvpForm, name: e.target.value })} required />
            </div>
            <div className="public-rsvp-field">
              <label>Phone / WhatsApp</label>
              <input className="public-input" type="tel" placeholder="08xxx..." value={rsvpForm.email} onChange={e => setRsvpForm({ ...rsvpForm, email: e.target.value })} />
            </div>
            {block.data.showGuestCount !== false && (
              <div className="public-rsvp-field">
                <label>Number of Guests</label>
                <select className="public-input public-input--select" value={rsvpForm.guestCount || 1} onChange={e => setRsvpForm({ ...rsvpForm, guestCount: Number(e.target.value) })}>
                  {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} person{n > 1 ? 's' : ''}</option>)}
                </select>
              </div>
            )}
            <div className="public-rsvp-buttons">
              <button type="submit" className="public-rsvp-btn public-rsvp-btn--attend" style={{ background: primaryColor }} onClick={e => handleRsvp(e, 'yes')} disabled={isRsvpLoading}>
                {isRsvpLoading ? '...' : (block.data.attendingLabel || 'Attending ✓')}
              </button>
              <button type="submit" className="public-rsvp-btn public-rsvp-btn--decline" onClick={e => handleRsvp(e, 'no')} disabled={isRsvpLoading}>
                {isRsvpLoading ? '...' : (block.data.declineLabel || 'Decline')}
              </button>
            </div>
          </form>
        </div>
      )

    // ── COUPLE ────────────────────────────────────────────────────────────
    case 'couple': {
      const photoShape = block.data.photoShape || 'portrait'
      const layout = block.data.layout || 'staggered'
      return (
        <div className={`public-couple public-couple--${layout}`}>
          <div className="public-couple-row">
            {/* Person 1 */}
            <div className="public-person">
              {block.data.photo1 && (
                <div className={`public-person-img-wrapper public-person-img--${photoShape}`}>
                  <MediaRenderer src={block.data.photo1} className="public-person-img" />
                </div>
              )}
              <div className="public-person-info">
                <h4 className="public-person-name" style={{ color: primaryColor }}>{block.data.name1 || ''}</h4>
                {block.data.title1 && <p className="public-person-title">{block.data.title1}</p>}
              </div>
              {block.data.instagram1 && (
                <a href={`https://instagram.com/${block.data.instagram1}`} target="_blank" rel="noopener noreferrer" className="public-person-ig" style={{ background: `${primaryColor}15`, color: primaryColor }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>
                  @{block.data.instagram1}
                </a>
              )}
            </div>

            {/* Ampersand connector */}
            {block.data.showAmpersand !== false && (
              <div className="public-couple-amp" style={{ color: primaryColor }}>
                <span className="serif-italic">&</span>
              </div>
            )}

            {/* Person 2 */}
            <div className="public-person" style={{ marginTop: layout === 'staggered' && block.data.photo2 ? 48 : 0 }}>
              {block.data.photo2 && (
                <div className={`public-person-img-wrapper public-person-img--${photoShape}`}>
                  <MediaRenderer src={block.data.photo2} className="public-person-img" />
                </div>
              )}
              <div className="public-person-info">
                <h4 className="public-person-name" style={{ color: primaryColor }}>{block.data.name2 || ''}</h4>
                {block.data.title2 && <p className="public-person-title">{block.data.title2}</p>}
              </div>
              {block.data.instagram2 && (
                <a href={`https://instagram.com/${block.data.instagram2}`} target="_blank" rel="noopener noreferrer" className="public-person-ig" style={{ background: `${primaryColor}15`, color: primaryColor }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>
                  @{block.data.instagram2}
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
      if (!block.data.items || block.data.items.length === 0) return null;
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
                  <span className="public-dresscode-swatch-label">{swatch.label}</span>
                </div>
              ))}
            </div>
          )}
          {block.data.note && (
            <div className="public-dresscode-note">
              <span>⚠</span> {block.data.note}
            </div>
          )}
        </div>
      )
    }

    // ── GIFT ──────────────────────────────────────────────────────────────
    case 'gift': {
      const giftData = block.data || {};
      // Support both old (single account) and new (accounts array) format
      const accounts = giftData.accounts?.length > 0
        ? giftData.accounts
        : (giftData.bankName ? [{ bankName: giftData.bankName, accountNumber: giftData.accountNumber, accountName: giftData.accountName }] : [])

      return (
        <div className="public-gift">
          <h4 className="serif-italic public-gift-title" style={{ color: primaryColor }}>{giftData.title || 'Wedding Gift'}</h4>
          {giftData.subtitle && <p className="public-gift-subtitle">{giftData.subtitle}</p>}

          {accounts.length > 0 && (
            <div className="public-gift-accounts">
              {accounts.map((acc, i) => (
                <GiftAccountCard key={i} account={acc} primaryColor={primaryColor} isPreviewUrl={isPreviewUrl} />
              ))}
            </div>
          )}

          {giftData.qrisImage && (
            <div className="public-gift-qris">
              <p className="public-gift-qris-label">QRIS</p>
              <img src={giftData.qrisImage} alt="QRIS Code" className="public-gift-qris-img" />
            </div>
          )}

          {giftData.registryLinks?.length > 0 && (
            <div className="public-gift-registry">
              <p className="public-gift-registry-label">Gift Registry</p>
              {giftData.registryLinks.map((link, i) => (
                <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="public-gift-registry-link" style={{ borderColor: primaryColor, color: primaryColor }}>
                  <HiOutlineExternalLink size={16} /> {link.label || 'Visit Store'}
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
          <h4 className="serif-italic public-wishes-title" style={{ color: primaryColor }}>{block.data.title || 'Send Your Wishes'}</h4>

          <form className="public-wish-form" onSubmit={handleSendWish}>
            {wishSent && (
              <div className="public-wish-sent-msg">
                <HiOutlineCheck size={16} /> Wishes sent! Thank you.
              </div>
            )}
            <input className="public-input" placeholder="Your Name" value={wishForm.name} onChange={e => setWishForm({ ...wishForm, name: e.target.value })} required disabled={isWishLoading} />
            <textarea className="public-input" placeholder="Write your wishes and prayers..." rows={3} value={wishForm.content} onChange={e => setWishForm({ ...wishForm, content: e.target.value })} required disabled={isWishLoading} />
            <button type="submit" className="public-wish-btn" style={{ background: primaryColor }} disabled={isWishLoading || !wishForm.content.trim()}>
              {isWishLoading ? 'Sending...' : '✉ Send Wish'}
            </button>
          </form>

          {wishes.length > 0 && (
            <div className={`public-wishes-list public-wishes-list--${displayMode}`}>
              {wishes.map((msg, i) => (
                <div key={i} className="public-wish-card">
                  <div className="public-wish-avatar" style={{ background: `${primaryColor}20`, color: primaryColor }}>
                    {(msg.author || 'T').charAt(0).toUpperCase()}
                  </div>
                  <div className="public-wish-body">
                    <p className="public-wish-content">"{msg.content}"</p>
                    <div className="public-wish-footer">
                      <span className="public-wish-author" style={{ color: primaryColor }}>{msg.author || 'Tamu'}</span>
                      {msg.date && <span className="public-wish-date">{new Date(msg.date).toLocaleDateString()}</span>}
                    </div>
                  </div>
                </div>
              ))}
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
              <path d="M100 12 C95 6, 85 4, 80 8 C75 12, 78 18, 84 16 C78 18, 72 14, 72 8 C72 2, 80 0, 86 4 C80 0, 88 -2, 96 4 C100 7, 104 7, 108 4 C116 -2, 124 0, 118 4 C124 0, 132 2, 132 8 C132 14, 126 18, 120 16 C126 18, 129 12, 124 8 C119 4, 109 6, 104 12 L100 15 Z" fill={ornColor} opacity="0.6"/>
              <line x1="0" y1="12" x2="75" y2="12" stroke={ornColor} strokeWidth="1" opacity="0.3"/>
              <line x1="125" y1="12" x2="200" y2="12" stroke={ornColor} strokeWidth="1" opacity="0.3"/>
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
              <path d="M0 8 Q25 2, 50 8 T100 8 T150 8 T200 8" stroke={ornColor} strokeWidth="1.5" fill="none" opacity="0.5"/>
            </svg>
          )}
        </div>
      )
    }

    // ── FOOTER ────────────────────────────────────────────────────────────
    case 'footer': {
      const footerPhotos = block.data.photos || [];
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
    <div className="public-gift-card">
      <div className="public-gift-card-header">
        <span className="public-gift-bank-name">{account.bankName || (isPreviewUrl ? '(Bank Name)' : '')}</span>
      </div>
      <div className="public-gift-account-number" onClick={handleCopy} title="Tap to copy">
        {account.accountNumber || (isPreviewUrl ? '(Account Number)' : '')}
        <span className="public-gift-copy-icon" style={{ color: primaryColor }}>
          {copied ? <HiOutlineCheck size={16} /> : <HiOutlineClipboard size={16} />}
        </span>
      </div>
      <div className="public-gift-account-name">{account.accountName || (isPreviewUrl ? '(Account Name)' : '')}</div>
      {copied && <div className="public-gift-copied-toast" style={{ color: primaryColor }}>Copied! ✓</div>}
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
              <MediaRenderer src={img} className="public-gallery-slideshow-img" onClick={() => openLightbox(i)} />
            </div>
          ))}
        </div>
        <button className="public-gallery-slideshow-btn public-gallery-slideshow-btn--prev" onClick={() => setSlideIndex(i => (i - 1 + images.length) % images.length)}>
          <HiChevronLeft size={20} />
        </button>
        <button className="public-gallery-slideshow-btn public-gallery-slideshow-btn--next" onClick={() => setSlideIndex(i => (i + 1) % images.length)}>
          <HiChevronRight size={20} />
        </button>
        <div className="public-gallery-slideshow-dots">
          {images.map((_, i) => (
            <button key={i} className={`public-gallery-dot ${i === slideIndex ? 'active' : ''}`} onClick={() => setSlideIndex(i)} style={{ background: i === slideIndex ? primaryColor : undefined }} />
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
              <MediaRenderer src={img} className="public-gallery-img" />
            </div>
          ))}
        </div>
        {lightboxIndex !== null && <GalleryLightbox images={images} index={lightboxIndex} onClose={closeLightbox} onPrev={prevLightbox} onNext={nextLightbox} />}
      </>
    )
  }

  // Default: grid
  return (
    <>
      <div className="public-gallery public-gallery--grid" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {images.map((img, i) => (
          <div key={i} className="public-gallery-item" onClick={() => openLightbox(i)}>
            <MediaRenderer src={img} className="public-gallery-img" />
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
      <button className="public-lightbox-close" onClick={onClose}><HiOutlineX size={24} /></button>
      <button className="public-lightbox-btn public-lightbox-btn--prev" onClick={e => { e.stopPropagation(); onPrev() }}><HiChevronLeft size={28} /></button>
      <div className="public-lightbox-img-wrapper" onClick={e => e.stopPropagation()}>
        <MediaRenderer src={images[index]} className="public-lightbox-img" />
        <span className="public-lightbox-counter">{index + 1} / {images.length}</span>
      </div>
      <button className="public-lightbox-btn public-lightbox-btn--next" onClick={e => { e.stopPropagation(); onNext() }}><HiChevronRight size={28} /></button>
    </div>
  )
}

function PublicCountdown({ targetDate, label, expiredMessage, showSeconds, style, primaryColor }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0, secs: 0 })
  const [expired, setExpired] = useState(false)

  useEffect(() => {
    if (!targetDate) return
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
        secs: Math.floor((diff % (1000 * 60)) / 1000)
      })
    }
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [targetDate])

  if (expired) {
    return (
      <div className="public-countdown public-countdown--expired" style={{ color: primaryColor }}>
        <p className="serif-italic" style={{ fontSize: '1.8rem' }}>{expiredMessage || '🎉 The day has come!'}</p>
      </div>
    )
  }

  const units = [
    { value: timeLeft.days, label: 'Days' },
    { value: timeLeft.hours, label: 'Hours' },
    { value: timeLeft.mins, label: 'Mins' },
    ...(showSeconds !== false ? [{ value: timeLeft.secs, label: 'Secs' }] : [])
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

function ScrollRevealBlock({ children, className, style, isCover = false, animationType = 'fade-in-up', rootRef = null }) {
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
    if (isCover) return
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
  return (
    <div ref={domRef} className={`${className} ${animClass}`} style={style}>
      {children}
    </div>
  )
}

function BackgroundMusic({ url, isPlaying, setIsPlaying, audioRef }) {
  return (
    <div className="public-music-player">
      <audio ref={audioRef} src={url} loop />
      <div className="music-disc-wrapper" onClick={() => setIsPlaying(!isPlaying)}>
        <div className={`music-disc ${isPlaying ? 'music-disc-spinning' : ''}`}>
          <HiOutlineMusicNote size={20} />
          <div className="music-disc-center" />
        </div>
      </div>
    </div>
  )
}

function IntroOverlay({ isOpen, onOpen, invitation, guestName }) {
  const coverBlock = invitation?.blocks?.find(b => b.type === 'cover')
  const bgMedia = coverBlock?.data?.backgroundImage
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
            <p className="public-cover-subtitle" style={{ color: '#fff', opacity: 0.8 }}>{coverBlock?.data?.subtitle || 'Wedding Invitation'}</p>
            <h1 className="serif-italic" style={{ color: '#fff', fontSize: 'clamp(2rem, 10vw, 3.2rem)', margin: '12px 0', lineHeight: 1.15 }}>
              {coverBlock?.data?.coupleName || 'Couple Name'}
            </h1>
            {coverBlock?.data?.date && (
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 8 }}>{coverBlock.data.date}</p>
            )}
          </div>
          {guestName && guestName !== 'Guest' && (
            <div className="public-intro-guest">
              <p className="public-intro-guest-label">Special Invitation for</p>
              <h2 className="public-intro-guest-name">{guestName}</h2>
            </div>
          )}
          <div style={{ marginTop: 32 }}>
            <button className="public-intro-btn" onClick={onOpen}>
              <HiOutlineMailOpen size={18} />
              Open Invitation
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

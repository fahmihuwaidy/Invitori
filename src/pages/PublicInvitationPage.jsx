import { useParams, useSearchParams } from 'react-router-dom'
import { useInvitations } from '../contexts/InvitationContext'
import { useState, useEffect } from 'react'
import { HiOutlineCheck, HiOutlineX, HiX, HiOutlineLocationMarker, HiOutlineCalendar, HiOutlineClock } from 'react-icons/hi'
import Logo from '../assets/Logo.png'
import '../index.css'
import './PublicInvitationPage.css'

export default function PublicInvitationPage() {
  const { slug } = useParams()
  const [searchParams] = useSearchParams()
  const { fetchPublicInvitation, incrementView, addRsvp } = useInvitations()
  const guestName = searchParams.get('to') || 'Tamu Undangan'
  const isPreviewUrl = searchParams.get('preview') === 'true'
  const [invitation, setInvitation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [rsvpForm, setRsvpForm] = useState({ name: guestName, email: '', message: '', attendance: '' })
  const [rsvpSent, setRsvpSent] = useState(false)
  const [isRsvpLoading, setIsRsvpLoading] = useState(false)
  const [wishForm, setWishForm] = useState({ name: guestName, content: '' })
  const [isWishLoading, setIsWishLoading] = useState(false)
  const [wishSent, setWishSent] = useState(false)
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, mins: 0, secs: 0 })

  // Fetch invitation from Supabase
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const inv = await fetchPublicInvitation(slug, isPreviewUrl)
      setInvitation(inv)
      setLoading(false)

      if (inv) {
        incrementView(inv.id)
      }
    }
    load()
  }, [slug])

  if (loading) {
    return (
      <div className="public-page-wrapper">
        <div className="public-blocks" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p className="serif-italic" style={{ color: '#8A8A8A' }}>Loading invitation...</p>
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
            <h1 className="serif-italic" style={{ color: 'var(--olive)', marginTop: 16 }}>Undangan Tidak Tersedia</h1>
            <p style={{ color: '#8A8A8A' }}>Pastikan link yang Anda akses benar.</p>
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
      if (success) {
        setRsvpSent(true)
      }
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
          wishes: [{
            author: wishForm.name,
            content: wishForm.content,
            date: new Date().toISOString()
          }, ...(prev.wishes || [])]
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
      <div className="public-blocks" style={{ background: theme.backgroundColor || '#EDE9E7' }}>
        {(invitation.blocks || []).map((block, index) => {
          const hasBg = !!block.data?.backgroundImage
          const blockMinHeight = block.data?.blockMinHeight || 0
          const bgAspectRatio = block.data?.backgroundAspectRatio || null
          const isCover = block.type === 'cover'
          const isFooter = block.type === 'footer'
          const isFullWidth = isCover || isFooter
          
          return (
            <div
              key={block.id}
              className={`public-block animate-fade-in-up ${isCover ? 'public-block-cover' : ''} ${isFooter ? 'public-block-footer' : ''}`}
              style={{
                animationDelay: `${index * 0.15}s`,
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
                  <img
                    src={block.data.backgroundImage}
                    alt=""
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: block.data.backgroundFit || 'cover',
                      objectPosition: 'center',
                      zIndex: 0,
                      pointerEvents: 'none',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundColor: block.data.backgroundOverlayColor || '#000000',
                      opacity: block.data.backgroundOverlay ?? 0.3,
                      zIndex: 1,
                      pointerEvents: 'none',
                    }}
                  />
                </>
              )}
              <div 
                className="public-block-content" 
                style={{
                  ...((hasBg && !isCover) ? { position: 'relative', zIndex: 2 } : {}),
                  ...(block.data.fullWidth !== false ? { padding: 0, maxWidth: 'none' } : {})
                }}
              >
                {renderPublicBlock(
                  block, 
                  theme, 
                  rsvpForm, 
                  setRsvpForm, 
                  handleRsvp, 
                  rsvpSent, 
                  wishForm, 
                  setWishForm, 
                  handleSendWish, 
                  wishSent,
                  guestName, 
                  isPreviewUrl, 
                  invitation.wishes || [],
                  isRsvpLoading,
                  isWishLoading
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function renderPublicBlock(
  block, 
  theme, 
  rsvpForm, 
  setRsvpForm, 
  handleRsvp, 
  rsvpSent, 
  wishForm, 
  setWishForm, 
  handleSendWish, 
  wishSent,
  guestName, 
  isPreviewUrl, 
  wishes = [],
  isRsvpLoading = false,
  isWishLoading = false
) {
  switch (block.type) {
    case 'cover':
      return (
        <div className="public-cover">
          {block.data.backgroundImage && (
            <>
              <img
                src={block.data.backgroundImage}
                alt=""
                className="public-cover-bg"
              />
              <div
                className="public-cover-overlay"
                style={{
                  backgroundColor: block.data.overlayColor || '#000000',
                  opacity: block.data.overlayOpacity ?? 0.4,
                }}
              />
            </>
          )}
          <div className="public-cover-content">
            <p className="public-cover-subtitle">{block.data.subtitle || 'We Are Getting Married'}</p>
            <h1 className="public-cover-name">{block.data.coupleName || 'Couple Name'}</h1>
            <p className="public-cover-date">{block.data.date || ''}</p>
            {block.data.showGuestName && guestName && (
              <div className="public-cover-guest">
                <p className="public-cover-guest-label">Kepada Yth</p>
                <p className="public-cover-guest-name">{guestName}</p>
              </div>
            )}
            {block.data.showScrollIndicator && (
              <div className="public-cover-scroll">
                <div className="scroll-mouse">
                  <div className="scroll-wheel" />
                </div>
                <span>Scroll</span>
              </div>
            )}
          </div>
        </div>
      )
    case 'heading':
      return (
        <h2 className="public-heading" style={{
          fontFamily: block.data.fontFamily || 'Gambarino',
          fontSize: `clamp(1.8rem, 8vw, ${block.data.fontSize || 36}px)`,
          color: block.data.color || theme.primaryColor || '#2D2D2D',
          textAlign: block.data.align || 'center',
          fontStyle: block.data.fontStyle || 'normal',
        }}>
          {block.data.content}
        </h2>
      )
    case 'paragraph':
      return (
        <p className="public-paragraph" style={{
          fontSize: block.data.fontSize || 15,
          color: block.data.color || 'var(--text-muted)',
          textAlign: block.data.align || 'center',
        }}>
          {block.data.content}
        </p>
      )
    case 'photo':
      return block.data.url ? (
        <div style={{ borderRadius: block.data.fullWidth ? 0 : (block.data.borderRadius || 8), overflow: 'hidden' }}>
          <img src={block.data.url} alt={block.data.caption || ''} style={{ width: '100%', objectFit: block.data.fit || 'cover', display: 'block' }} />
          {block.data.caption && <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', marginTop: 12 }}>{block.data.caption}</p>}
        </div>
      ) : null
    case 'video':
      if (!block.data.url) {
        if (isPreviewUrl) {
          return <div style={{ aspectRatio: '16/9', background: 'rgba(0,0,0,0.05)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>[ Video Placeholder ]</div>
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
        } else if (isVimeo) {
          const videoId = embedUrl.split('/').pop();
          embedUrl = `https://player.vimeo.com/video/${videoId}?autoplay=${block.data.autoplay ? 1 : 0}&muted=${block.data.autoplay ? 1 : 0}&loop=${block.data.loop ? 1 : 0}`;
        }
        
        return (
          <div style={{ borderRadius: block.data.fullWidth ? 0 : 8, overflow: 'hidden', aspectRatio: '16/9' }}>
            <iframe 
              src={embedUrl} 
              style={{ width: '100%', height: '100%', border: 'none' }} 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen
            />
          </div>
        );
      }
      
      return (
        <div style={{ borderRadius: block.data.fullWidth ? 0 : 8, overflow: 'hidden' }}>
          <video 
            src={block.data.url} 
            style={{ width: '100%', objectFit: 'cover', display: 'block' }} 
            autoPlay={block.data.autoplay} 
            loop={block.data.loop} 
            muted={block.data.autoplay}
            controls={!block.data.autoplay}
            playsInline
          />
        </div>
      )
    case 'gallery':
      const images = block.data.images || [];
      if (images.length === 0) {
        if (!isPreviewUrl) return null;
        return (
          <div className="public-gallery" style={{ gridTemplateColumns: `repeat(${block.data.columns || 2}, 1fr)` }}>
            {Array(block.data.columns || 2).fill(0).map((_, i) => (
              <div key={i} className="public-gallery-item" style={{ background: 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                 Foto {i+1}
              </div>
            ))}
          </div>
        )
      }
      return (
        <div className="public-gallery" style={{ gridTemplateColumns: `repeat(${block.data.columns || 2}, 1fr)` }}>
          {images.map((img, i) => (
            <div key={i} className="public-gallery-item" style={{ borderRadius: block.data.fullWidth ? 0 : 8 }}>
              <img src={img} className="public-gallery-img" />
            </div>
          ))}
        </div>
      )
    case 'gift':
      if (!block.data.bankName && !isPreviewUrl) return null;
      return (
        <div style={{ textAlign: 'center', padding: 32, border: `1px solid ${theme.primaryColor || '#E0DCD8'}`, borderRadius: 12, margin: '12px 0' }}>
          <h4 className="serif-italic" style={{ marginBottom: 16, fontSize: 20, color: theme.primaryColor }}>{block.data.title || 'Wedding Gift'}</h4>
          <div style={{ background: 'rgba(255,255,255,0.5)', padding: 20, borderRadius: 10, display: 'inline-block', textAlign: 'left', minWidth: 200, width: '100%', maxWidth: 300 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Bank / Dompet</div>
            <div style={{ fontWeight: 600, marginBottom: 12, color: '#2D2D2D', fontSize: 16 }}>{block.data.bankName || '(Nama Bank)'}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Nomor Rekening</div>
            <div style={{ fontWeight: 600, letterSpacing: 1, color: '#2D2D2D', fontSize: 18, margin: '4px 0 12px' }}>{block.data.accountNumber || '(No. Rekening)'}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Atas Nama</div>
            <div style={{ fontWeight: 600, color: '#2D2D2D', fontSize: 15 }}>{block.data.accountName || '(Nama Pemilik)'}</div>
          </div>
        </div>
      )
    case 'music':
      return block.data.url ? (
        <div style={{ textAlign: 'center', padding: '12px 0' }}>
          <audio controls src={block.data.url} style={{ maxWidth: '100%', height: 36 }}>
            Your browser does not support the audio element.
          </audio>
        </div>
      ) : null
    case 'countdown':
      return <PublicCountdown targetDate={block.data.targetDate} />
    case 'location':
      return (
        <div className="public-location">
          <div className="pl-grid">
            <div className="pl-item">
              <span className="label-caps" style={{ fontSize: 11, opacity: 0.6, display: 'block', marginBottom: 4 }}>Tanggal</span>
              <p>{block.data.date || 'TBA'}</p>
            </div>
            <div className="pl-item">
              <span className="label-caps" style={{ fontSize: 11, opacity: 0.6, display: 'block', marginBottom: 4 }}>Waktu</span>
              <p>{block.data.time || 'TBA'}</p>
            </div>
            <div className="pl-item">
              <span className="label-caps" style={{ fontSize: 11, opacity: 0.6, display: 'block', marginBottom: 4 }}>Tempat</span>
              <p>{block.data.venue || 'TBA'}</p>
            </div>
          </div>
          {block.data.address && <p className="pl-address">{block.data.address}</p>}
          {block.data.mapUrl && (
            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <a href={block.data.mapUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm" style={{ padding: '12px 32px', borderRadius: 30 }}>
                Buka Peta Lokasi
              </a>
            </div>
          )}
        </div>
      )
    case 'rsvp':
      if (rsvpSent) {
        return (
          <div className="public-rsvp-done">
            <HiOutlineCheck size={40} style={{ color: 'var(--olive)', marginBottom: 16 }} />
            <h4 className="serif-italic">Terima Kasih!</h4>
            <p>Konfirmasi kehadiran Anda telah tersimpan.</p>
          </div>
        )
      }
      return (
        <div className="public-rsvp-container animate-fade-in-up">
          <form className="public-rsvp">
            <h4 className="serif-italic" style={{ fontSize: 24, marginBottom: 12 }}>{block.data.title || 'Konfirmasi Kehadiran'}</h4>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 4 }}>Nama Tamu</label>
              <input
                className="public-input"
                placeholder="Nama Lengkap"
                value={rsvpForm.name}
                onChange={e => setRsvpForm({ ...rsvpForm, name: e.target.value })}
                required
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 4 }}>Nomor HP</label>
              <input
                className="public-input"
                type="tel"
                placeholder="Nomor HP / WhatsApp"
                value={rsvpForm.email}
                onChange={e => setRsvpForm({ ...rsvpForm, email: e.target.value })}
                required
              />
            </div>
            <div className="rsvp-buttons" style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ flex: 1, padding: '14px', position: 'relative' }} 
                onClick={(e) => handleRsvp(e, 'yes')}
                disabled={isRsvpLoading}
              >
                {isRsvpLoading ? '...' : 'Akan Hadir'}
              </button>
              <button 
                type="submit" 
                className="btn btn-outline" 
                style={{ flex: 1, padding: '14px' }} 
                onClick={(e) => handleRsvp(e, 'no')}
                disabled={isRsvpLoading}
              >
                {isRsvpLoading ? '...' : 'Maaf, Batal'}
              </button>
            </div>
          </form>
        </div>
      )
    case 'signature':
      return (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <h3 style={{
            fontFamily: 'Gambarino, serif',
            fontSize: 'clamp(2.5rem, 8vw, 3.5rem)',
            color: theme.primaryColor || 'var(--olive)',
            margin: 0,
            fontStyle: 'italic',
            fontWeight: 400
          }}>
            {(block.data.names || []).join(' & ')}
          </h3>
        </div>
      )
    case 'registry':
      if (!block.data.items || block.data.items.length === 0) return null;
      return (
        <div style={{ textAlign: 'center', padding: '12px 0' }}>
          <h4 className="serif-italic" style={{ fontSize: 22, marginBottom: 20, color: theme.primaryColor }}>{block.data.title || 'Gift Registry'}</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
            {block.data.items.map((item, i) => (
              <a key={i} href={item.url} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-full" style={{ maxWidth: 280, borderRadius: 30 }}>
                {item.label || 'Kunjungi Toko'}
              </a>
            ))}
          </div>
        </div>
      )
    case 'couple':
      return (
        <div className="public-couple">
          <div className="public-couple-row">
            {/* Person 1 */}
            <div className="public-person">
              {block.data.photo1 && (
                <div className="public-person-img-wrapper">
                  <img src={block.data.photo1} className="public-person-img" />
                </div>
              )}
              <div className="public-person-info">
                <h4>{block.data.name1 || ''}</h4>
                {block.data.title1 && <p>{block.data.title1}</p>}
              </div>
              {block.data.instagram1 && (
                <a href={`https://instagram.com/${block.data.instagram1}`} target="_blank" rel="noopener noreferrer" className="public-person-ig" style={{ background: theme.primaryColor ? `${theme.primaryColor}15` : 'rgba(86,95,52,0.08)', color: theme.primaryColor || 'var(--olive)' }}>
                  📷 @{block.data.instagram1}
                </a>
              )}
            </div>
            {/* Person 2 */}
            <div className="public-person" style={{ marginTop: block.data.photo2 ? 40 : 0 }}>
              {block.data.photo2 && (
                <div className="public-person-img-wrapper">
                  <img src={block.data.photo2} className="public-person-img" />
                </div>
              )}
              <div className="public-person-info">
                <h4>{block.data.name2 || ''}</h4>
                {block.data.title2 && <p>{block.data.title2}</p>}
              </div>
              {block.data.instagram2 && (
                <a href={`https://instagram.com/${block.data.instagram2}`} target="_blank" rel="noopener noreferrer" className="public-person-ig" style={{ background: theme.primaryColor ? `${theme.primaryColor}15` : 'rgba(86,95,52,0.08)', color: theme.primaryColor || 'var(--olive)' }}>
                  📷 @{block.data.instagram2}
                </a>
              )}
            </div>
          </div>
          {block.data.description && <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '24px auto 0', maxWidth: 400, lineHeight: 1.6 }}>{block.data.description}</p>}
        </div>
      )
    case 'story':
      if (!block.data.items || block.data.items.length === 0) return null;
      return (
        <div className="public-story">
          <h4 className="serif-italic" style={{ fontSize: 24, marginBottom: 40, textAlign: 'center', color: theme.primaryColor }}>Our Stories</h4>
          <div className="public-story-timeline">
            <div className="public-story-line" style={{ borderColor: theme.primaryColor || 'var(--olive)' }} />
            {block.data.items.map((item, i) => (
              <div key={i} className="public-story-item">
                <div className="public-story-dot" style={{ backgroundColor: theme.primaryColor || 'var(--olive)' }} />
                <span className="public-story-date">{item.date || 'Tanggal'}</span>
                <h5 className="public-story-title">{item.title || 'Momen'}</h5>
                <p className="public-story-text">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      )
    case 'wishes':
      const messages = wishes;
      return (
        <div style={{ textAlign: 'center', padding: '32px 20px', background: 'rgba(255,255,255,0.4)', borderRadius: 16, border: '1px solid rgba(0,0,0,0.03)' }}>
          <h4 className="serif-italic" style={{ fontSize: 24, marginBottom: 28, color: theme.primaryColor }}>{block.data.title || 'Wishes'}</h4>
          
          {/* Wish Submission Form */}
          <form className="public-wish-form" style={{ marginBottom: 40, textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 12 }} onSubmit={handleSendWish}>
            {wishSent && (
              <div style={{ padding: '12px 16px', background: 'rgba(74, 84, 46, 0.05)', borderRadius: 8, marginBottom: 8, textAlign: 'center' }}>
                <p className="serif-italic" style={{ color: 'var(--olive)', margin: 0, fontSize: 13 }}>Ucapan terkirim! Terima kasih.</p>
              </div>
            )}
            <input
              className="public-input"
              placeholder="Nama Anda"
              value={wishForm.name}
              onChange={e => setWishForm({ ...wishForm, name: e.target.value })}
              required
              disabled={isWishLoading}
            />
            <textarea
              className="public-input"
              placeholder="Tulis ucapan/doa untuk kami..."
              rows={3}
              style={{ resize: 'none', minHeight: 100 }}
              value={wishForm.content}
              onChange={e => setWishForm({ ...wishForm, content: e.target.value })}
              required
              disabled={isWishLoading}
            />
            <button type="submit" className="btn btn-primary btn-full" style={{ padding: '14px' }} disabled={isWishLoading || !wishForm.content.trim()}>
              {isWishLoading ? 'Mengirim...' : 'Kirim Ucapan'}
            </button>
          </form>

          <div className="public-wishes-list" style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 16,
            maxHeight: 400,
            overflowY: 'auto',
            paddingRight: 8,
          }}>
            {messages.length === 0 ? (
              <div style={{ fontSize: 14, color: 'var(--text-muted)', fontStyle: 'italic', padding: '20px 0' }}>Belum ada ucapan.</div>
            ) : (
              messages.map((msg, i) => (
                <div key={i} style={{ 
                  background: '#fff', 
                  padding: 20, 
                  borderRadius: 12, 
                  textAlign: 'left', 
                  boxShadow: '0 8px 24px rgba(0,0,0,0.04)',
                  border: '1px solid rgba(0,0,0,0.02)'
                }}>
                  <p style={{ margin: '0 0 16px 0', fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7, fontStyle: 'italic' }}>"{msg.content}"</p>
                  <div style={{ 
                    fontSize: 12, 
                    fontWeight: 600, 
                    color: theme.primaryColor || 'var(--olive)', 
                    borderTop: '1px solid var(--border-light)', 
                    paddingTop: 14, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    gap: 8 
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: theme.primaryColor || 'var(--olive)', opacity: 0.4 }} />
                      {msg.author || 'Tamu'}
                    </div>
                    {msg.date && (
                      <span style={{ fontSize: 10, opacity: 0.4, fontWeight: 400 }}>
                        {new Date(msg.date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )
    case 'divider':
      return <div style={{ borderTop: `1px solid ${block.data.color || '#E0DCD8'}`, margin: '12px auto', width: '30%', opacity: 0.6 }} />
    case 'footer':
      const footerPhotos = block.data.photos || [];
      return (
        <div className="public-footer-block">
          {footerPhotos.length > 0 && (
            <div className="public-footer-slideshow">
              {footerPhotos.map((photo, i) => (
                <img key={i} src={photo} alt="" className="public-footer-slide" style={{ animationDelay: `${i * 5}s` }} />
              ))}
              <div className="public-footer-slideshow-overlay" />
            </div>
          )}
          <div className="public-footer-content">
            <p className="public-footer-thankyou">{block.data.thankYouText || 'Terima Kasih'}</p>
            <h2 className="public-footer-couple">{block.data.coupleName || ''}</h2>
            <p className="public-footer-subtitle" style={{ fontSize: 14, opacity: 0.8, maxWidth: 300, margin: '0 auto 40px' }}>{block.data.subtitle || ''}</p>
            {block.data.showWatermark && (
              <div style={{ 
                marginTop: 40, 
                paddingTop: 24, 
                borderTop: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8
              }}>
                <img src={Logo} alt="Invori" style={{ height: 16, opacity: 0.5, filter: 'brightness(0) invert(1)' }} />
                <p style={{ margin: 0, fontSize: 10, opacity: 0.5, letterSpacing: '0.05em' }}>DIGITAL INVITATION BY INVORI</p>
              </div>
            )}
          </div>
        </div>
      )
    default:
      return null
  }
}

function PublicCountdown({ targetDate }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0, secs: 0 })

  useEffect(() => {
    if (!targetDate) return

    const tick = () => {
      const target = new Date(targetDate)
      const now = new Date()
      const diff = Math.max(0, target - now)
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

  return (
    <div className="public-countdown">
      <div className="pc-unit"><span className="pc-num">{String(timeLeft.days).padStart(2, '0')}</span><span className="pc-label">Days</span></div>
      <span className="pc-sep">:</span>
      <div className="pc-unit"><span className="pc-num">{String(timeLeft.hours).padStart(2, '0')}</span><span className="pc-label">Hours</span></div>
      <span className="pc-sep">:</span>
      <div className="pc-unit"><span className="pc-num">{String(timeLeft.mins).padStart(2, '0')}</span><span className="pc-label">Mins</span></div>
      <span className="pc-sep">:</span>
      <div className="pc-unit"><span className="pc-num">{String(timeLeft.secs).padStart(2, '0')}</span><span className="pc-label">Secs</span></div>
    </div>
  )
}

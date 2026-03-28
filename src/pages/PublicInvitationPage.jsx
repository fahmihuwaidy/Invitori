import { useParams, useSearchParams } from 'react-router-dom'
import { useInvitations } from '../contexts/InvitationContext'
import { useState, useEffect } from 'react'
import Logo from '../assets/Logo.png'
import '../index.css'
import './PublicInvitationPage.css'

export default function PublicInvitationPage() {
  const { slug } = useParams()
  const [searchParams] = useSearchParams()
  const { fetchPublicInvitation, incrementView, addRsvp } = useInvitations()
  const guestName = searchParams.get('to') || 'Tamu Undangan'
  const [invitation, setInvitation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [rsvpForm, setRsvpForm] = useState({ name: guestName, email: '', attendance: '' })
  const [rsvpSent, setRsvpSent] = useState(false)
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, mins: 0, secs: 0 })

  // Fetch invitation from Supabase
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const isPreviewUrl = searchParams.get('preview') === 'true'
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
      <div className="public-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <p className="serif-italic" style={{ color: '#8A8A8A' }}>Loading invitation...</p>
      </div>
    )
  }

  if (!invitation) {
    return (
      <div className="public-page public-not-found">
        <header style={{ textAlign: 'center', padding: '40px 20px' }}>
          <img src={Logo} alt="Invori Logo" style={{ height: 40, margin: '0 auto' }} />
        </header>
        <p>Undangan tidak ditemukan.</p>
      </div>
    )
  }

  const theme = invitation.theme || {}

  const handleRsvp = async (e, attendanceValue) => {
    if (e) e.preventDefault()
    
    // Default to 'yes' if not set
    const submitAttendance = attendanceValue || rsvpForm.attendance || 'yes'
    
    // Update state to reflect final choice just in case
    setRsvpForm(prev => ({ ...prev, attendance: submitAttendance }))
    
    const success = await addRsvp(invitation.id, { ...rsvpForm, attendance: submitAttendance, sentAt: new Date().toISOString() })
    if (success) {
      setRsvpSent(true)
    }
  }

  return (
    <div className="public-page" style={{ background: theme.backgroundColor || '#EDE9E7' }}>
      {/* Guest name header */}
      <div className="public-guest-header animate-fade-in">
        <span className="label-caps" style={{ fontSize: 10 }}>Dear</span>
        <h3 className="serif-italic" style={{ fontSize: '1.2rem', color: theme.primaryColor || '#565F34' }}>
          {guestName}
        </h3>
      </div>

      {/* Render blocks */}
      <div className="public-blocks">
        {invitation.blocks.map((block, index) => (
          <div
            key={block.id}
            className="public-block animate-fade-in-up"
            style={{
              animationDelay: `${index * 0.15}s`,
              paddingTop: block.data?.spacingTop ?? 0,
              paddingBottom: block.data?.spacingBottom ?? 0,
            }}
          >
            {renderPublicBlock(block, theme, rsvpForm, setRsvpForm, handleRsvp, rsvpSent)}
          </div>
        ))}
      </div>

      {/* Footer */}
      <footer style={{ textAlign: 'center', padding: '60px 20px', backgroundColor: 'var(--cream-light)' }}>
        <img src={Logo} alt="Invori Logo" style={{ height: 32, margin: '0 auto 8px' }} />
        <p style={{ fontSize: 10, color: 'var(--text-light)', marginTop: 4 }}>Made with Invori</p>
      </footer>
    </div>
  )
}

function renderPublicBlock(block, theme, rsvpForm, setRsvpForm, handleRsvp, rsvpSent) {
  switch (block.type) {
    case 'heading':
      return (
        <h2 style={{
          fontFamily: block.data.fontFamily || 'Gambarino',
          fontSize: Math.min(block.data.fontSize || 32, 48),
          color: block.data.color || theme.primaryColor || '#2D2D2D',
          textAlign: block.data.align || 'center',
          fontStyle: block.data.fontStyle || 'normal',
          lineHeight: 1.3,
        }}>
          {block.data.content}
        </h2>
      )
    case 'paragraph':
      return (
        <p style={{
          fontSize: block.data.fontSize || 15,
          color: block.data.color || '#8A8A8A',
          textAlign: block.data.align || 'center',
          lineHeight: 1.8,
          maxWidth: 480,
          margin: '0 auto',
        }}>
          {block.data.content}
        </p>
      )
    case 'photo':
      return block.data.url ? (
        <div style={{ borderRadius: block.data.borderRadius || 8, overflow: 'hidden' }}>
          <img src={block.data.url} alt={block.data.caption || ''} style={{ width: '100%', objectFit: block.data.fit || 'cover', display: 'block' }} />
          {block.data.caption && <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>{block.data.caption}</p>}
        </div>
      ) : null
    case 'video':
      if (!block.data.url) return null;
      
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
          <div style={{ borderRadius: 8, overflow: 'hidden', aspectRatio: '16/9' }}>
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
        <div style={{ borderRadius: 8, overflow: 'hidden' }}>
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
      if (images.length === 0) return null;
      return (
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${block.data.columns || 2}, 1fr)`,
          gap: 8,
        }}>
          {images.map((img, i) => (
            <div key={i} style={{ aspectRatio: '1/1', borderRadius: 4, overflow: 'hidden' }}>
              <img src={img} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </div>
          ))}
        </div>
      )
    case 'gift':
      if (!block.data.bankName) return null;
      return (
        <div style={{ textAlign: 'center', padding: 24, border: `1px solid ${theme.primaryColor || '#E0DCD8'}`, borderRadius: 8, margin: '24px 0' }}>
          <h4 className="serif-italic" style={{ marginBottom: 16, fontSize: 20, color: theme.primaryColor }}>{block.data.title || 'Wedding Gift'}</h4>
          <div style={{ background: 'rgba(255,255,255,0.5)', padding: 16, borderRadius: 6, display: 'inline-block', textAlign: 'left', minWidth: 200 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Bank</div>
            <div style={{ fontWeight: 600, marginBottom: 8, color: '#2D2D2D' }}>{block.data.bankName}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Account Number</div>
            <div style={{ fontWeight: 600, letterSpacing: 1, color: '#2D2D2D' }}>{block.data.accountNumber || '-'}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>A/N</div>
            <div style={{ fontWeight: 600, color: '#2D2D2D' }}>{block.data.accountName || '-'}</div>
          </div>
        </div>
      )
    case 'music':
      return block.data.url ? (
        <div style={{ textAlign: 'center', margin: '24px 0' }}>
          <audio controls src={block.data.url} autoPlay style={{ maxWidth: '100%' }}>
            Your browser does not support the audio element.
          </audio>
        </div>
      ) : null
    case 'countdown':
      return <PublicCountdown targetDate={block.data.targetDate} />
    case 'location':
      return (
        <div className="public-location">
          <div className="pl-row">
            <div className="pl-item">
              <span className="label-caps" style={{ fontSize: 10 }}>Date</span>
              <p>{block.data.date || 'TBD'}</p>
            </div>
            <div className="pl-item">
              <span className="label-caps" style={{ fontSize: 10 }}>Time</span>
              <p>{block.data.time || 'TBD'}</p>
            </div>
            <div className="pl-item">
              <span className="label-caps" style={{ fontSize: 10 }}>Venue</span>
              <p>{block.data.venue || 'TBD'}</p>
            </div>
          </div>
          {block.data.address && <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>{block.data.address}</p>}
          {block.data.mapUrl && (
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <a href={block.data.mapUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', background: 'var(--olive)', color: '#fff', padding: '10px 20px', borderRadius: 24, fontSize: 13, fontWeight: 500, textDecoration: 'none' }}>
                Buka Peta
              </a>
            </div>
          )}
        </div>
      )
    case 'rsvp':
      if (rsvpSent) {
        return (
          <div className="public-rsvp-done">
            <h4 className="serif-italic">Thank You!</h4>
            <p>Your response has been recorded.</p>
          </div>
        )
      }
      return (
        <form className="public-rsvp">
          <h4 className="serif-italic">{block.data.title || 'RSVP'}</h4>
          <input
            className="public-input"
            placeholder="Name"
            value={rsvpForm.name}
            onChange={e => setRsvpForm({ ...rsvpForm, name: e.target.value })}
            required
          />
          <input
            className="public-input"
            type="email"
            placeholder="Email"
            value={rsvpForm.email}
            onChange={e => setRsvpForm({ ...rsvpForm, email: e.target.value })}
            required
          />
          <div className="rsvp-buttons">
            <button type="submit" className="rsvp-attend" onClick={(e) => handleRsvp(e, 'yes')}>
              Will Attend
            </button>
            <button type="submit" className="rsvp-decline" onClick={(e) => handleRsvp(e, 'no')}>
              Decline
            </button>
          </div>
        </form>
      )
    case 'signature':
      return (
        <div style={{ textAlign: 'center', margin: '40px 0' }}>
          <h3 style={{
            fontFamily: 'Gambarino, serif',
            fontSize: '3rem',
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
        <div style={{ textAlign: 'center', margin: '32px 0' }}>
          <h4 className="serif-italic" style={{ fontSize: 24, marginBottom: 20, color: theme.primaryColor }}>{block.data.title || 'Gift Registry'}</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
            {block.data.items.map((item, i) => (
              <a key={i} href={item.url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', padding: '12px 24px', border: `1px solid ${theme.primaryColor || 'var(--border)'}`, borderRadius: 24, fontSize: 13, minWidth: 200, color: theme.primaryColor || 'var(--text-light)', textDecoration: 'none', transition: 'all 0.2s ease' }}>
                {item.label || 'Store Name'}
              </a>
            ))}
          </div>
        </div>
      )
    case 'couple':
      return (
        <div style={{ textAlign: 'center', margin: '40px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 20 }}>
            {block.data.photo1 && (
              <div style={{ width: 120, height: 160, borderRadius: '60px 60px 0 0', overflow: 'hidden' }}>
                <img src={block.data.photo1} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}
            {block.data.photo2 && (
              <div style={{ width: 120, height: 160, borderRadius: '60px 60px 0 0', overflow: 'hidden', marginTop: 32 }}>
                <img src={block.data.photo2} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}
          </div>
          <h3 className="serif-italic" style={{ fontSize: 28, margin: '0 0 12px 0', color: theme.primaryColor || 'var(--olive)' }}>{block.data.name1} & {block.data.name2}</h3>
          {block.data.description && <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '0 auto', maxWidth: 400, lineHeight: 1.6 }}>{block.data.description}</p>}
        </div>
      )
    case 'story':
      if (!block.data.items || block.data.items.length === 0) return null;
      return (
        <div style={{ textAlign: 'center', margin: '48px 16px' }}>
          <h4 className="serif-italic" style={{ fontSize: 24, marginBottom: 32, color: theme.primaryColor }}>Our Story</h4>
          <div style={{ borderLeft: `1px dashed ${theme.primaryColor || 'var(--olive)'}`, paddingLeft: 24, marginLeft: '50%', transform: 'translateX(-50%)', display: 'inline-block', textAlign: 'left', maxWidth: 300 }}>
            {block.data.items.map((item, i) => (
              <div key={i} style={{ position: 'relative', marginBottom: 24 }}>
                <div style={{ position: 'absolute', left: -29, top: 4, width: 10, height: 10, borderRadius: '50%', backgroundColor: theme.primaryColor || 'var(--olive)' }} />
                <span className="label-caps" style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.date || 'Date'}</span>
                <h5 style={{ margin: '6px 0', fontSize: 18, fontFamily: 'Gambarino, serif', color: '#2D2D2D' }}>{item.title || 'Milestone Title'}</h5>
                <p style={{ margin: 0, fontSize: 14, color: 'var(--text-light)', lineHeight: 1.5 }}>{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      )
    case 'wishes':
      if (!block.data.messages || block.data.messages.length === 0) return null;
      return (
        <div style={{ textAlign: 'center', margin: '40px 0', padding: '32px 16px', background: 'rgba(255,255,255,0.4)', borderRadius: 12 }}>
          <h4 className="serif-italic" style={{ fontSize: 24, marginBottom: 24, color: theme.primaryColor }}>{block.data.title || 'Wishes'}</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {block.data.messages.map((msg, i) => (
              <div key={i} style={{ background: '#fff', padding: 16, borderRadius: 8, textAlign: 'left', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                <p style={{ margin: '0 0 12px 0', fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, fontStyle: 'italic' }}>"{msg.content}"</p>
                <div style={{ fontSize: 12, fontWeight: 600, color: theme.primaryColor || 'var(--olive)', borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                  {msg.author || 'Guest'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    case 'divider':
      return <div style={{ borderTop: `1px solid ${block.data.color || '#E0DCD8'}`, margin: '8px 40px' }} />
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

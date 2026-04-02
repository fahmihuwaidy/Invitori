import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useInvitations } from '../contexts/InvitationContext'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { BLOCK_TYPES, BLOCK_CATEGORIES } from '../utils/blockDefaults'
import { PRESETS } from '../utils/presets'
import { uploadToCloudinary } from '../lib/cloudinary'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { HiOutlineArrowLeft, HiOutlineMenuAlt2, HiX, HiOutlineEye, HiOutlineTrash, HiPlus,
  HiOutlineViewGrid, HiOutlineMail, HiOutlineUserGroup, HiOutlineGift, HiOutlineCog, HiOutlineUpload } from 'react-icons/hi'
import Logo from '../assets/Logo.png'
import './EditorPage.css'

/* Sortable block wrapper */
function SortableBlock({ id, children }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    position: 'relative',
  }
  return (
    <div ref={setNodeRef} id={id} style={style}>
      {/* Drag Handle — only this area triggers drag */}
      <div
        className="block-drag-handle"
        {...attributes}
        {...listeners}
        title="Drag to reorder"
        style={{
          position: 'absolute',
          top: 4,
          right: 4,
          zIndex: 10,
          width: 24,
          height: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: isDragging ? 'grabbing' : 'grab',
          opacity: 0,
          transition: 'opacity 0.15s',
          borderRadius: 4,
          background: 'rgba(255,255,255,0.85)',
          boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
          fontSize: 13,
          color: '#888',
          userSelect: 'none',
          touchAction: 'none',
        }}
      >
        ⠿
      </div>
      {children}
    </div>
  )
}

function EditorCountdownBlock({ data }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0, secs: 0 })

  useEffect(() => {
    if (!data.targetDate) return

    const tick = () => {
      const target = new Date(data.targetDate)
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
  }, [data.targetDate])

  return (
    <div className="countdown-block">
      <div className="countdown-unit"><span className="countdown-num">{String(timeLeft.days).padStart(2, '0')}</span><span className="countdown-label">Days</span></div>
      <span className="countdown-sep">:</span>
      <div className="countdown-unit"><span className="countdown-num">{String(timeLeft.hours).padStart(2, '0')}</span><span className="countdown-label">Hours</span></div>
      <span className="countdown-sep">:</span>
      <div className="countdown-unit"><span className="countdown-num">{String(timeLeft.mins).padStart(2, '0')}</span><span className="countdown-label">Mins</span></div>
      <span className="countdown-sep">:</span>
      <div className="countdown-unit"><span className="countdown-num">{String(timeLeft.secs).padStart(2, '0')}</span><span className="countdown-label">Secs</span></div>
    </div>
  )
}

/* Block renderers */
function BlockBackgroundLayer({ data }) {
  if (!data.backgroundImage) return null
  return (
    <>
      <img
        src={data.backgroundImage}
        alt=""
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: data.backgroundFit || 'cover',
          objectPosition: 'center',
          zIndex: 0,
          pointerEvents: 'none',
          borderRadius: 'inherit',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: data.backgroundOverlayColor || '#000000',
          opacity: data.backgroundOverlay ?? 0.3,
          zIndex: 1,
          pointerEvents: 'none',
          borderRadius: 'inherit',
        }}
      />
    </>
  )
}

function renderBlock(block, isSelected, onSelect) {
  const hasBg = !!block.data.backgroundImage
  const blockMinHeight = block.data.blockMinHeight || 0
  const bgAspectRatio = block.data.backgroundAspectRatio || null
  const blockStyle = {
    padding: '12px 16px',
    cursor: 'pointer',
    border: isSelected ? '2px solid var(--olive)' : '2px solid transparent',
    borderRadius: block.data.customBorderRadius ? `${block.data.customBorderRadius}px` : 'var(--radius-sm)',
    transition: 'border-color 0.2s ease',
    position: 'relative',
    background: block.data.customBgColor || (isSelected ? 'rgba(86,95,52,0.04)' : 'transparent'),
    color: block.data.customTextColor || 'inherit',
    textAlign: block.data.customTextAlign || 'inherit',
    '--text-dark': block.data.customTextColor || undefined,
    '--text-muted': block.data.customTextColor || undefined,
    '--text-light': block.data.customTextColor || undefined,
    overflow: hasBg || block.data.customBorderRadius ? 'hidden' : undefined,
    minHeight: blockMinHeight > 0 ? blockMinHeight : undefined,
    aspectRatio: (hasBg && bgAspectRatio) ? bgAspectRatio : undefined,
    display: (hasBg && bgAspectRatio) ? 'flex' : undefined,
    alignItems: (hasBg && bgAspectRatio) ? 'center' : undefined,
    justifyContent: (hasBg && bgAspectRatio) ? 'center' : undefined,
  }
  const contentZ = hasBg ? { position: 'relative', zIndex: 2, width: '100%' } : {}

  const onClick = (e) => { e.stopPropagation(); onSelect(block.id) }

  switch (block.type) {
    case 'cover':
      return (
        <div style={{ ...blockStyle, minHeight: 360, background: '#1a1a1a', borderRadius: 8, overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClick}>
          {block.data.backgroundImage && (
            <>
              <img src={block.data.backgroundImage} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} />
              <div style={{ position: 'absolute', inset: 0, backgroundColor: block.data.overlayColor || '#000', opacity: block.data.overlayOpacity ?? 0.4, zIndex: 1 }} />
            </>
          )}
          <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', padding: '40px 20px', color: '#fff' }}>
            {isSelected && <span className="block-selected-label" style={{ color: '#fff', background: 'rgba(86,95,52,0.8)' }}>SELECTED: COVER</span>}
            <p style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>{block.data.subtitle || 'We Are Getting Married'}</p>
            <h2 style={{ fontFamily: 'Gambarino, serif', fontSize: 36, fontWeight: 400, margin: '0 0 12px', fontStyle: 'italic', color: '#fff' }}>{block.data.coupleName || 'Couple Name'}</h2>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', margin: '0 0 20px' }}>{block.data.date || 'Date'}</p>
            {block.data.showGuestName && (
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: 16, marginTop: 8 }}>
                <p style={{ fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', margin: '0 0 4px' }}>Kepada Yth</p>
                <p style={{ fontFamily: 'Gambarino, serif', fontSize: 16, color: '#fff', margin: 0 }}>Nama Tamu</p>
              </div>
            )}
            {block.data.showScrollIndicator && (
              <div style={{ marginTop: 24, opacity: 0.6 }}>
                <div style={{ width: 20, height: 30, border: '1.5px solid rgba(255,255,255,0.5)', borderRadius: 10, margin: '0 auto', position: 'relative' }}>
                  <div style={{ width: 3, height: 6, background: 'rgba(255,255,255,0.7)', borderRadius: 2, position: 'absolute', top: 6, left: '50%', transform: 'translateX(-50%)' }} />
                </div>
                <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', marginTop: 6 }}>Scroll</p>
              </div>
            )}
          </div>
        </div>
      )
    case 'heading':
      return (
        <div style={blockStyle} onClick={onClick}>
          <BlockBackgroundLayer data={block.data} />
          <div style={contentZ}>
            {isSelected && <span className="block-selected-label">SELECTED: HEADING</span>}
            <h2 style={{
              fontFamily: block.data.fontFamily || 'Gambarino',
              fontSize: block.data.fontSize || 32,
              color: block.data.color || '#2D2D2D',
              textAlign: block.data.align || 'center',
              fontStyle: block.data.fontStyle || 'normal',
              margin: 0,
            }}>{block.data.content}</h2>
          </div>
        </div>
      )
    case 'paragraph':
      return (
        <div style={blockStyle} onClick={onClick}>
          <BlockBackgroundLayer data={block.data} />
          <div style={contentZ}>
            {isSelected && <span className="block-selected-label">SELECTED: PARAGRAPH</span>}
            <p style={{
              fontSize: block.data.fontSize || 15,
              color: block.data.color || '#8A8A8A',
              textAlign: block.data.align || 'center',
              margin: 0,
              lineHeight: 1.7,
            }}>{block.data.content}</p>
          </div>
        </div>
      )
    case 'photo':
      return (
        <div style={blockStyle} onClick={onClick}>
          <BlockBackgroundLayer data={block.data} />
          <div style={contentZ}>
            {isSelected && <span className="block-selected-label">SELECTED: PHOTO</span>}
            <div style={{
              background: '#f0eded',
              borderRadius: block.data.borderRadius || 8,
              aspectRatio: '16/10',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-light)',
              fontSize: 13,
              overflow: 'hidden',
            }}>
              {block.data.url ? (
                 <img src={block.data.url} alt={block.data.caption || ''} style={{ width: '100%', height: '100%', objectFit: block.data.fit || 'cover' }} />
              ) : (
                 <span>📷 Click to add photo</span>
              )}
            </div>
            {block.data.caption && <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>{block.data.caption}</p>}
          </div>
        </div>
      )
    case 'video':
      let embedUrl = block.data.url;
      let isIframe = false;
      if (embedUrl) {
         const isYouTube = embedUrl.includes('youtube.com') || embedUrl.includes('youtu.be');
         const isVimeo = embedUrl.includes('vimeo.com');
         if (isYouTube) {
           const videoId = embedUrl.includes('v=') ? embedUrl.split('v=')[1].split('&')[0] : embedUrl.split('/').pop();
           embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=${block.data.autoplay ? 1 : 0}&mute=${block.data.autoplay ? 1 : 0}&loop=${block.data.loop ? 1 : 0}`;
           isIframe = true;
         } else if (isVimeo) {
           const videoId = embedUrl.split('/').pop();
           embedUrl = `https://player.vimeo.com/video/${videoId}?autoplay=${block.data.autoplay ? 1 : 0}&muted=${block.data.autoplay ? 1 : 0}&loop=${block.data.loop ? 1 : 0}`;
           isIframe = true;
         }
      }

      return (
        <div style={blockStyle} onClick={onClick}>
          <BlockBackgroundLayer data={block.data} />
          <div style={contentZ}>
            {isSelected && <span className="block-selected-label">SELECTED: VIDEO</span>}
            <div style={{
              background: '#f0eded',
              borderRadius: 8,
              aspectRatio: '16/9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-light)',
              fontSize: 13,
              overflow: 'hidden',
              pointerEvents: 'none',
            }}>
              {block.data.url ? (
                isIframe ? (
                 <iframe 
                   src={embedUrl} 
                   style={{ width: '100%', height: '100%', border: 'none' }} 
                   allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                   allowFullScreen
                 />
                ) : (
                  <video 
                    src={block.data.url} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    autoPlay={block.data.autoplay} 
                    loop={block.data.loop} 
                    muted={block.data.autoplay}
                    controls={!block.data.autoplay}
                  />
                )
              ) : (
                <span>🎬 Click to add video URL or upload</span>
              )}
            </div>
          </div>
        </div>
      )
    case 'countdown':
      return (
        <div style={blockStyle} onClick={onClick}>
          <BlockBackgroundLayer data={block.data} />
          <div style={contentZ}>
            {isSelected && <span className="block-selected-label">SELECTED: COUNTDOWN</span>}
            <EditorCountdownBlock data={block.data} />
          </div>
        </div>
      )
    case 'location':
      return (
        <div style={blockStyle} onClick={onClick}>
          <BlockBackgroundLayer data={block.data} />
          <div style={contentZ}>
            {isSelected && <span className="block-selected-label">SELECTED: LOCATION</span>}
            <div style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginBottom: 8 }}>
                <div><span className="label-caps" style={{ fontSize: 10 }}>Date</span><p style={{ fontWeight: 500, fontSize: 14 }}>{block.data.date || 'TBD'}</p></div>
                <div><span className="label-caps" style={{ fontSize: 10 }}>Time</span><p style={{ fontWeight: 500, fontSize: 14 }}>{block.data.time || 'TBD'}</p></div>
                <div><span className="label-caps" style={{ fontSize: 10 }}>Location</span><p style={{ fontWeight: 500, fontSize: 14 }}>{block.data.venue || 'TBD'}</p></div>
              </div>
            </div>
          </div>
        </div>
      )
    case 'rsvp':
      return (
        <div style={blockStyle} onClick={onClick}>
          <BlockBackgroundLayer data={block.data} />
          <div style={contentZ}>
            {isSelected && <span className="block-selected-label">SELECTED: RSVP</span>}
            <div style={{ textAlign: 'center' }}>
              <h4 className="serif-italic" style={{ marginBottom: 12 }}>{block.data.title || 'RSVP'}</h4>
              <div style={{ maxWidth: 220, margin: '0 auto' }}>
                <div style={{ background: 'var(--cream)', borderRadius: 6, padding: '10px 14px', marginBottom: 8, fontSize: 13, color: 'var(--text-light)', textAlign: 'left' }}>Name</div>
                <div style={{ background: 'var(--cream)', borderRadius: 6, padding: '10px 14px', marginBottom: 12, fontSize: 13, color: 'var(--text-light)', textAlign: 'left' }}>Email</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ flex: 1, background: 'var(--olive)', color: '#fff', borderRadius: 6, padding: '8px', fontSize: 12, fontWeight: 600, textAlign: 'center' }}>Will Attend</div>
                  <div style={{ flex: 1, border: '1px solid var(--border)', borderRadius: 6, padding: '8px', fontSize: 12, fontWeight: 500, textAlign: 'center' }}>Decline</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    case 'gallery':
      const images = block.data.images || [];
      return (
        <div style={blockStyle} onClick={onClick}>
          <BlockBackgroundLayer data={block.data} />
          <div style={contentZ}>
            {isSelected && <span className="block-selected-label">SELECTED: GALLERY</span>}
            <div style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${block.data.columns || 2}, 1fr)`,
              gap: 8,
            }}>
              {images.length > 0 ? images.map((img, i) => (
                <div key={i} style={{ aspectRatio: '1/1', background: '#f0eded', borderRadius: 4, overflow: 'hidden' }}>
                  <img src={img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )) : (
                <div style={{ gridColumn: '1 / -1', padding: 32, background: '#f0eded', borderRadius: 8, textAlign: 'center', color: 'var(--text-light)', fontSize: 13 }}>
                  📸 Click to add gallery images
                </div>
              )}
            </div>
          </div>
        </div>
      )
    case 'gift':
      return (
        <div style={blockStyle} onClick={onClick}>
          <BlockBackgroundLayer data={block.data} />
          <div style={contentZ}>
            {isSelected && <span className="block-selected-label">SELECTED: GIFT</span>}
            <div style={{ textAlign: 'center', padding: 16, border: '1px solid var(--border)', borderRadius: 8 }}>
              <h4 className="serif-italic" style={{ marginBottom: 16, fontSize: 18 }}>{block.data.title || 'Wedding Gift'}</h4>
              {block.data.bankName ? (
                <div style={{ background: 'var(--cream)', padding: 16, borderRadius: 6, display: 'inline-block', textAlign: 'left', minWidth: 200 }}>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Bank</div>
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>{block.data.bankName}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Account Number</div>
                  <div style={{ fontWeight: 600, letterSpacing: 1 }}>{block.data.accountNumber || '-'}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>A/N</div>
                  <div style={{ fontWeight: 600 }}>{block.data.accountName || '-'}</div>
                </div>
              ) : (
                <p style={{ color: 'var(--text-light)', fontSize: 13, margin: 0 }}>Click to configure bank details</p>
              )}
            </div>
          </div>
        </div>
      )
    case 'music':
      return (
        <div style={blockStyle} onClick={onClick}>
          <BlockBackgroundLayer data={block.data} />
          <div style={contentZ}>
            {isSelected && <span className="block-selected-label">SELECTED: MUSIC</span>}
            <div style={{ textAlign: 'center', padding: 16, background: hasBg ? 'transparent' : '#f0eded', borderRadius: 8 }}>
              <span style={{ fontSize: 24 }}>🎵</span>
              {block.data.url ? (
                <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>Background Music Configured</p>
              ) : (
                <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--text-light)' }}>Click to add audio URL</p>
              )}
            </div>
          </div>
        </div>
      )
    case 'divider':
      return (
        <div style={blockStyle} onClick={onClick}>
          <BlockBackgroundLayer data={block.data} />
          <div style={contentZ}>
            {isSelected && <span className="block-selected-label">SELECTED: DIVIDER</span>}
            <div style={{ borderTop: `1px solid ${block.data.color || '#E0DCD8'}`, margin: '16px 40px' }} />
          </div>
        </div>
      )
    case 'signature':
      return (
        <div style={blockStyle} onClick={onClick}>
          <BlockBackgroundLayer data={block.data} />
          <div style={contentZ}>
            {isSelected && <span className="block-selected-label">SELECTED: SIGNATURE</span>}
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <h3 style={{
                fontFamily: 'Gambarino, serif',
                fontSize: '3rem',
                color: 'var(--olive)',
                margin: 0,
                fontStyle: 'italic',
                fontWeight: 400
              }}>
                {(block.data.names || []).join(' & ')}
              </h3>
            </div>
          </div>
        </div>
      )
    case 'registry':
      return (
        <div style={blockStyle} onClick={onClick}>
          <BlockBackgroundLayer data={block.data} />
          <div style={contentZ}>
            {isSelected && <span className="block-selected-label">SELECTED: REGISTRY</span>}
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <h4 className="serif-italic" style={{ fontSize: 20, marginBottom: 16 }}>{block.data.title || 'Gift Registry'}</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
                {(block.data.items || []).length > 0 ? (
                  block.data.items.map((item, i) => (
                    <div key={i} style={{ padding: '12px 24px', border: '1px solid var(--border)', borderRadius: 24, fontSize: 13, minWidth: 200, color: 'var(--text-light)' }}>
                      {item.label || 'Store Name'}
                    </div>
                  ))
                ) : (
                  <p style={{ color: 'var(--text-light)', fontSize: 13, margin: 0 }}>Click to configure registry links</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )
    case 'couple':
      return (
        <div style={blockStyle} onClick={onClick}>
          <BlockBackgroundLayer data={block.data} />
          <div style={contentZ}>
            {isSelected && <span className="block-selected-label">SELECTED: COUPLE</span>}
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 16 }}>
                {/* Person 1 */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 100, height: 130, borderRadius: '50px 50px 0 0', backgroundColor: '#f0eded', overflow: 'hidden' }}>
                    {block.data.photo1 ? <img src={block.data.photo1} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'var(--text-light)'}}>Photo 1</span>}
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, margin: '0 0 2px', color: '#2D2D2D' }}>{block.data.name1 || 'Name 1'}</p>
                    {block.data.title1 && <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>{block.data.title1}</p>}
                  </div>
                  {block.data.instagram1 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: 'var(--cream)', borderRadius: 20, fontSize: 11, color: 'var(--text-light)' }}>
                      📷 @{block.data.instagram1}
                    </div>
                  )}
                </div>
                {/* Person 2 */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginTop: 24 }}>
                  <div style={{ width: 100, height: 130, borderRadius: '50px 50px 0 0', backgroundColor: '#f0eded', overflow: 'hidden' }}>
                    {block.data.photo2 ? <img src={block.data.photo2} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'var(--text-light)'}}>Photo 2</span>}
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, margin: '0 0 2px', color: '#2D2D2D' }}>{block.data.name2 || 'Name 2'}</p>
                    {block.data.title2 && <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>{block.data.title2}</p>}
                  </div>
                  {block.data.instagram2 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: 'var(--cream)', borderRadius: 20, fontSize: 11, color: 'var(--text-light)' }}>
                      📷 @{block.data.instagram2}
                    </div>
                  )}
                </div>
              </div>
              {block.data.description && <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '8px 0 0' }}>{block.data.description}</p>}
            </div>
          </div>
        </div>
      )
    case 'story':
      return (
        <div style={blockStyle} onClick={onClick}>
          <BlockBackgroundLayer data={block.data} />
          <div style={contentZ}>
            {isSelected && <span className="block-selected-label">SELECTED: STORY</span>}
            <div style={{ textAlign: 'center', padding: '20px 16px' }}>
              <h4 className="serif-italic" style={{ fontSize: 20, marginBottom: 20 }}>Our Story</h4>
              <div style={{ borderLeft: '1px dashed var(--olive)', paddingLeft: 16, marginLeft: '50%', transform: 'translateX(-50%)', display: 'inline-block', textAlign: 'left' }}>
                {(block.data.items || []).map((item, i) => (
                  <div key={i} style={{ position: 'relative', marginBottom: 20 }}>
                    <div style={{ position: 'absolute', left: -21, top: 4, width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--olive)' }} />
                    <span className="label-caps" style={{ fontSize: 10, color: 'var(--text-muted)' }}>{item.date || 'Date'}</span>
                    <h5 style={{ margin: '4px 0', fontSize: 15, fontFamily: 'Gambarino, serif' }}>{item.title || 'Milestone Title'}</h5>
                    <p style={{ margin: 0, fontSize: 13, color: 'var(--text-light)' }}>{item.description || 'Brief description goes here.'}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )
    case 'wishes':
      return (
        <div style={blockStyle} onClick={onClick}>
          <BlockBackgroundLayer data={block.data} />
          <div style={contentZ}>
            {isSelected && <span className="block-selected-label">SELECTED: WISHES</span>}
            <div style={{ textAlign: 'center', padding: '24px 16px', background: hasBg ? 'transparent' : 'rgba(86,95,52,0.05)', borderRadius: 8 }}>
              <h4 className="serif-italic" style={{ fontSize: 20, marginBottom: 16 }}>{block.data.title || 'Wishes'}</h4>
              <div style={{ maxHeight: 200, overflowY: 'auto', paddingRight: 8, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {(block.data.messages || []).length > 0 ? (
                  block.data.messages.map((msg, i) => (
                    <div key={i} style={{ background: '#fff', padding: 12, borderRadius: 8, textAlign: 'left', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                      <p style={{ margin: '0 0 8px 0', fontSize: 13, color: 'var(--text-light)', lineHeight: 1.5 }}>"{msg.content}"</p>
                      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--olive)' }}>- {msg.author || 'Guest'}</span>
                    </div>
                  ))
                ) : (
                  <p style={{ color: 'var(--text-light)', fontSize: 13, margin: 0 }}>No wishes added yet. Configure in settings.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )
    case 'footer':
      const footerPhotos = block.data.photos || [];
      return (
        <div style={{ ...blockStyle, background: '#2D2D2D', borderRadius: 8, overflow: 'hidden', position: 'relative' }} onClick={onClick}>
          <div style={{ textAlign: 'center', padding: '32px 20px', color: '#fff' }}>
            {isSelected && <span className="block-selected-label" style={{ color: '#fff', background: 'rgba(86,95,52,0.8)' }}>SELECTED: FOOTER</span>}
            {footerPhotos.length > 0 && (
              <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginBottom: 20, borderRadius: 8, overflow: 'hidden' }}>
                {footerPhotos.slice(0, 3).map((p, i) => (
                  <div key={i} style={{ width: 60, height: 80, overflow: 'hidden' }}>
                    <img src={p} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ))}
              </div>
            )}
            <p style={{ fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', margin: '0 0 6px' }}>{block.data.thankYouText || 'Thank You'}</p>
            <h3 style={{ fontFamily: 'Gambarino, serif', fontSize: 28, fontWeight: 400, fontStyle: 'italic', color: '#fff', margin: '0 0 8px' }}>{block.data.coupleName || 'Couple Name'}</h3>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', margin: 0 }}>{block.data.subtitle || ''}</p>
            {block.data.showWatermark && (
              <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', margin: 0 }}>Made with Invitori</p>
              </div>
            )}
          </div>
        </div>
      )
    default:
      return (
        <div style={blockStyle} onClick={onClick}>
          <BlockBackgroundLayer data={block.data} />
          <div style={contentZ}>
            {isSelected && <span className="block-selected-label">SELECTED: {block.type.toUpperCase()}</span>}
            <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)', fontSize: 13 }}>
              {BLOCK_TYPES[block.type]?.icon} {BLOCK_TYPES[block.type]?.label || block.type}
            </div>
          </div>
        </div>
      )
  }
}

function GuestListModal({ invitation, onClose }) {
  const [guests, setGuests] = useState([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [adding, setAdding] = useState(false)
  const [copiedId, setCopiedId] = useState(null)

  const baseUrl = `${window.location.origin}/undangan/${invitation.slug}`

  const fetchGuests = async () => {
    const { data } = await supabase
      .from('guests')
      .select('*')
      .eq('invitation_id', invitation.id)
      .order('created_at', { ascending: true })
    if (data) setGuests(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchGuests()
  }, [invitation.id])

  const handleAdd = async () => {
    if (!newName.trim()) return
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
    await supabase.from('guests').delete().eq('id', guestId)
    setGuests(prev => prev.filter(g => g.id !== guestId))
  }

  const getLink = (name) => `${baseUrl}?to=${encodeURIComponent(name)}&preview=true`

  const copyLink = (guest) => {
    navigator.clipboard.writeText(getLink(guest.name))
    setCopiedId(guest.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="modal-overlay" onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, width: '92%', maxWidth: 680, maxHeight: '88vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        
        {/* Header */}
        <div style={{ padding: '24px 28px 0', borderBottom: '1px solid var(--border)', paddingBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h3 className="serif-italic" style={{ margin: 0, fontSize: 26, color: 'var(--olive)' }}>Guest List</h3>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
                Tambahkan nama tamu dan bagikan link undangan personal mereka
              </p>
            </div>
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, marginLeft: 16 }}>
              <HiX size={22} color="var(--text-light)"/>
            </button>
          </div>
        </div>

        {/* Add Guest Form */}
        <div style={{ padding: '20px 28px', background: '#fafaf8', borderBottom: '1px solid var(--border)' }}>
          <p className="label-caps" style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 12 }}>Tambah Tamu Baru</p>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <div style={{ flex: 2 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Nama Tamu *</label>
              <input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
                placeholder="cth: Budi Santoso"
                style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ flex: 2 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>No. HP / WA (opsional)</label>
              <input
                value={newPhone}
                onChange={e => setNewPhone(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
                placeholder="cth: 08123456789"
                style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <button
              onClick={handleAdd}
              disabled={adding || !newName.trim()}
              style={{ padding: '10px 20px', background: adding || !newName.trim() ? '#ccc' : 'var(--olive)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: adding || !newName.trim() ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', height: 42 }}
            >
              {adding ? 'Menambah...' : '+ Tambah'}
            </button>
          </div>
        </div>

        {/* Guest List */}
        <div style={{ padding: '0 28px 28px', flex: 1 }}>
          {loading ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0', fontSize: 14 }}>Memuat daftar tamu...</p>
          ) : guests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
              <p className="serif-italic" style={{ fontSize: 18, color: 'var(--text-light)', margin: 0 }}>Belum ada tamu ditambahkan</p>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>Tambahkan nama tamu di atas untuk membuat link undangan personal mereka</p>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0 12px' }}>
                <span className="label-caps" style={{ fontSize: 10, color: 'var(--text-muted)' }}>{guests.length} Tamu Terdaftar</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {guests.map((guest, i) => {
                  const link = getLink(guest.name)
                  const waLink = guest.phone
                    ? `https://wa.me/${guest.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Halo ${guest.name},\n\nKami mengundang Anda untuk hadir di acara kami 🌿\n${link}`)}`
                    : null
                  return (
                    <div key={guest.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', border: '1px solid var(--border)', borderRadius: 10, background: '#fafaf8', transition: 'box-shadow 0.2s' }}>
                      {/* Number */}
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--olive)', flexShrink: 0 }}>
                        {i + 1}
                      </div>
                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 15, color: '#2D2D2D', marginBottom: 3 }}>{guest.name}</div>
                        {guest.phone && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{guest.phone}</div>}
                        <div style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          🔗 {link}
                        </div>
                      </div>
                      {/* Actions */}
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        <button
                          onClick={() => copyLink(guest)}
                          title="Salin Link"
                          style={{ padding: '7px 12px', background: copiedId === guest.id ? '#edf5ed' : '#fff', color: copiedId === guest.id ? '#3a7a3a' : 'var(--olive)', border: `1px solid ${copiedId === guest.id ? '#3a7a3a' : 'var(--border)'}`, borderRadius: 6, fontSize: 12, cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s' }}
                        >
                          {copiedId === guest.id ? '✓ Tersalin' : '📋 Salin Link'}
                        </button>
                        {waLink && (
                          <a href={waLink} target="_blank" rel="noopener noreferrer"
                            title="Kirim via WhatsApp"
                            style={{ padding: '7px 12px', background: '#25D366', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center' }}
                          >
                            WA
                          </a>
                        )}
                        <button
                          onClick={() => handleDelete(guest.id)}
                          title="Hapus Tamu"
                          style={{ padding: '7px 10px', background: 'transparent', color: '#ccc', border: '1px solid #eee', borderRadius: 6, fontSize: 13, cursor: 'pointer' }}
                        >
                          🗑
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function SettingsModal({ invitation, onSave, onClose }) {
  const [data, setData] = useState({ title: invitation.title, slug: invitation.slug, theme_fontFamily: invitation.theme?.fontFamily || 'Inter', theme_primaryColor: invitation.theme?.primaryColor || '#565F34', theme_backgroundColor: invitation.theme?.backgroundColor || '#EDE9E7' })

  return (
    <div className="modal-overlay" onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ background: '#fff', padding: 24, borderRadius: 12, width: '90%', maxWidth: 450 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 className="serif-italic" style={{ margin: 0, fontSize: 24, color: 'var(--olive)' }}>Invitation Settings</h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><HiX size={20} color="var(--text-light)"/></button>
        </div>
        
        <div className="input-group" style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Project Title</label>
          <input className="settings-input" value={data.title} onChange={e => setData({...data, title: e.target.value})} style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 6 }} />
        </div>
        <div className="input-group" style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>URL Slug</label>
          <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden' }}>
            <span style={{ padding: '0 12px', fontSize: 13, color: 'var(--text-muted)', background: '#f8f8f8', borderRight: '1px solid var(--border)', display: 'flex', alignItems: 'center', height: 42 }}>/undangan/</span>
            <input className="settings-input" style={{ border: 'none', borderRadius: 0, flex: 1, padding: '10px 12px', outline: 'none' }} value={data.slug} onChange={e => setData({...data, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')})} />
          </div>
        </div>

        <span className="label-caps" style={{ marginTop: 24, marginBottom: 12, display: 'block', fontSize: 11, color: 'var(--text-muted)' }}>Global Theme</span>
        <div className="input-group" style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Base Font</label>
          <select className="settings-select" value={data.theme_fontFamily} onChange={e => setData({...data, theme_fontFamily: e.target.value})} style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 6 }}>
            <option value="Inter">Inter (Modern Sans)</option>
            <option value="Gambarino, serif">Gambarino (Elegant Serif)</option>
            <option value="Outfit">Outfit (Clean Sans)</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <div className="input-group" style={{ flex: 1 }}>
            <label style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Primary Color</label>
            <input type="color" className="settings-input" style={{ width: '100%', padding: 4, height: 42, cursor: 'pointer', border: '1px solid var(--border)', borderRadius: 6 }} value={data.theme_primaryColor} onChange={e => setData({...data, theme_primaryColor: e.target.value})} />
          </div>
          <div className="input-group" style={{ flex: 1 }}>
            <label style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Background Color</label>
            <input type="color" className="settings-input" style={{ width: '100%', padding: 4, height: 42, cursor: 'pointer', border: '1px solid var(--border)', borderRadius: 6 }} value={data.theme_backgroundColor} onChange={e => setData({...data, theme_backgroundColor: e.target.value})} />
          </div>
        </div>

        <button className="btn btn-primary btn-full" style={{ marginTop: 32, padding: '12px 0', fontSize: 14 }} onClick={() => {
          onSave({
            title: data.title,
            slug: data.slug,
            theme: {
              ...(invitation.theme || {}),
              fontFamily: data.theme_fontFamily,
              primaryColor: data.theme_primaryColor,
              backgroundColor: data.theme_backgroundColor,
            }
          })
          onClose()
        }}>Save Changes</button>
      </div>
    </div>
  )
}

export default function EditorPage() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { invitations, addInvitation, addBlock: ctxAddBlock, updateBlock: ctxUpdateBlock, deleteBlock: ctxDeleteBlock, reorderBlocks, updateInvitation } = useInvitations()
  const [selectedBlock, setSelectedBlock] = useState(null)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [activeModal, setActiveModal] = useState(null)
  const hasCreated = useRef(false)
  const hasAppliedPreset = useRef(false)

  // Create new invitation if needed
  useEffect(() => {
    if (id === 'new' && !hasCreated.current) {
      hasCreated.current = true
      const title = searchParams.get('title') || 'Untitled Invitation'
      addInvitation({ title }).then(newInv => {
        if (newInv) {
          navigate(`/editor/${newInv.id}`, { replace: true })
        }
      })
    }
  }, [])

  // Apply preset blocks if ?preset= param exists
  useEffect(() => {
    const presetKey = searchParams.get('preset')
    if (!presetKey || hasAppliedPreset.current) return
    const invitation = invitations.find(inv => inv.id === id)
    if (!invitation) return
    // Only apply if invitation has no blocks yet
    if (invitation.blocks && invitation.blocks.length > 0) return

    const preset = PRESETS[presetKey]
    if (!preset || preset.blocks.length === 0) {
      hasAppliedPreset.current = true
      return
    }

    hasAppliedPreset.current = true
    // Add blocks sequentially
    const addBlocksSequentially = async () => {
      for (let i = 0; i < preset.blocks.length; i++) {
        const blockDef = preset.blocks[i]
        await ctxAddBlock(id, blockDef.type, blockDef.data, i)
      }
    }
    addBlocksSequentially()
  }, [id, invitations, searchParams])

  // Find invitation
  const invitation = invitations.find(inv => inv.id === id)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  )

  if (id === 'new') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'var(--font-body)' }}>
        <p className="serif-italic" style={{ color: 'var(--text-muted)' }}>Creating invitation...</p>
      </div>
    )
  }

  if (!invitation) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'var(--font-body)' }}>
        <div style={{ textAlign: 'center' }}>
          <h2 className="serif-italic">Invitation not found</h2>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/admin')}>Back to Dashboard</button>
        </div>
      </div>
    )
  }

  const blocks = invitation.blocks || []
  const selected = blocks.find(b => b.id === selectedBlock)

  const addBlock = (type) => {
    const defaults = BLOCK_TYPES[type]?.defaults || {}
    ctxAddBlock(invitation.id, type, { ...defaults })
    
    // Auto-scroll to bottom of the canvas when adding a block
    setTimeout(() => {
      const pScreen = document.querySelector('.phone-screen')
      if (pScreen) pScreen.scrollTo({ top: pScreen.scrollHeight, behavior: 'smooth' })
    }, 150)
  }

  const deleteBlock = (blockId) => {
    ctxDeleteBlock(invitation.id, blockId)
    if (selectedBlock === blockId) setSelectedBlock(null)
  }

  const updateBlock = (blockId, data) => {
    ctxUpdateBlock(invitation.id, blockId, data)
  }

  const handleDragEnd = (event) => {
    const { active, over } = event
    if (active.id !== over?.id) {
      const oldIndex = blocks.findIndex(b => b.id === active.id)
      const newIndex = blocks.findIndex(b => b.id === over.id)
      const newBlocks = arrayMove(blocks, oldIndex, newIndex)
      reorderBlocks(invitation.id, newBlocks)
    }
  }

  const handlePublish = () => {
    const isPublishing = invitation.status !== 'published'
    updateInvitation(invitation.id, { status: isPublishing ? 'published' : 'draft' })
    
    if (isPublishing) {
      alert(`Invitation published successfully!\n\nPublic link is live at:\n${window.location.origin}/undangan/${invitation.slug}`)
    }
  }

  const handleSidebarRegistry = () => {
    const hasRegistry = invitation.blocks?.find(b => b.type === 'registry' || b.type === 'gift')
    if (!hasRegistry) {
      addBlock('registry')
    } else {
      setSelectedBlock(hasRegistry.id)
      setSettingsOpen(true)
      setTimeout(() => {
        const el = document.getElementById(hasRegistry.id)
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 150)
    }
  }

  return (
    <div className="editor-page">
      {/* Sidebar */}
      <div className="editor-sidebar">
        <div className="sidebar-header">
          <div>
            <div className="sidebar-brand">
              <img src={Logo} alt="Invori Logo" style={{ height: 28, width: 'auto', display: 'block', marginBottom: 4 }} />
            </div>
            <span className="label-caps" style={{ fontSize: 10 }}>Premium Member</span>
          </div>
        </div>
        <nav className="sidebar-nav">
          <a className="sidebar-link" onClick={() => navigate('/admin')}><HiOutlineViewGrid size={18} /><span>DASHBOARD</span></a>
          <a className="sidebar-link active"><HiOutlineMail size={18} /><span>INVITATIONS</span></a>
          <a className="sidebar-link" onClick={() => setActiveModal('guestlist')}><HiOutlineUserGroup size={18} /><span>GUEST LIST</span></a>
          <a className="sidebar-link" onClick={handleSidebarRegistry}><HiOutlineGift size={18} /><span>REGISTRY</span></a>
          <a className="sidebar-link" onClick={() => setActiveModal('settings')}><HiOutlineCog size={18} /><span>SETTINGS</span></a>
        </nav>
        <div className="sidebar-bottom">
          <button className="btn btn-primary btn-full sidebar-create" onClick={() => navigate('/editor/new')}>
            <HiPlus size={16} /> Create New
          </button>
        </div>
      </div>

      {/* Block Palette */}
      <div className={`editor-palette ${paletteOpen ? 'open' : ''}`}>
        <div className="palette-header">
          <div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem' }}>Invori Blocks</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Drag blocks onto the canvas to construct your masterpiece.</p>
          </div>
          <button className="palette-close" onClick={() => setPaletteOpen(false)}><HiX size={18} /></button>
        </div>
        <div className="palette-blocks">
          {BLOCK_CATEGORIES.map(cat => {
            const catBlocks = Object.entries(BLOCK_TYPES).filter(([, v]) => v.category === cat.key)
            if (catBlocks.length === 0) return null
            return (
              <div key={cat.key} className="palette-category">
                <span className="label-caps" style={{ fontSize: 10, marginBottom: 8, display: 'block' }}>{cat.label}</span>
                <div className="palette-grid">
                  {catBlocks.map(([key, val]) => (
                    <button key={key} className="palette-block" onClick={() => addBlock(key)}>
                      <span className="palette-icon">{val.icon}</span>
                      <span className="palette-label">{val.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
        <div className="palette-footer">
          <button className="btn btn-primary btn-full" onClick={handlePublish}>
            ▶ {invitation.status === 'published' ? 'Unpublish' : 'Publish Design'}
          </button>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, textAlign: 'center' }}>
            ℹ️ Need Help? <a href="#" style={{ color: 'var(--olive)' }}>Contact Concierge</a>
          </p>
        </div>
      </div>

      {/* Canvas */}
      <div className="editor-canvas">
        <div className="canvas-toolbar">
          <button className="canvas-toolbar-btn" onClick={() => setPaletteOpen(true)} title="Blocks">
            <HiOutlineMenuAlt2 size={18} />
          </button>
          <div className="canvas-breadcrumb">
            <span onClick={() => navigate('/admin')} style={{ cursor: 'pointer' }}>Dashboard</span>
            <span>/</span>
            <span>{invitation.title}</span>
          </div>
          <div className="canvas-toolbar-actions">
            <button className="btn btn-outline btn-sm" onClick={() => window.open(`/undangan/${invitation.slug}?preview=true`, '_blank')}>
              <HiOutlineEye size={14} /> Preview
            </button>
            <button className="btn btn-primary btn-sm" onClick={handlePublish}>
              {invitation.status === 'published' ? 'Unpublish' : 'Publish'}
            </button>
          </div>
        </div>

        <div className="canvas-area" onClick={() => setSelectedBlock(null)}>
          <div className="phone-frame">
            <div className="phone-notch" />
            <div className="phone-screen" style={{ background: invitation.theme?.backgroundColor || '#EDE9E7' }}>
              {blocks.length === 0 ? (
                <div className="phone-empty">
                  <p>Your canvas is empty.</p>
                  <p style={{ fontSize: 12, color: 'var(--text-light)' }}>Add blocks from the palette to start designing.</p>
                </div>
              ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
                    {blocks.map(block => (
                      <SortableBlock key={block.id} id={block.id}>
                        <div style={{ paddingTop: block.data?.spacingTop ?? 0, paddingBottom: block.data?.spacingBottom ?? 0 }}>
                          {renderBlock(block, selectedBlock === block.id, (id) => {
                            setSelectedBlock(id)
                            setSettingsOpen(true)
                          })}
                          {selectedBlock === block.id && (
                            <button className="block-delete-btn" onClick={(e) => { e.stopPropagation(); deleteBlock(block.id) }}>
                              <HiOutlineTrash size={14} />
                            </button>
                          )}
                        </div>
                      </SortableBlock>
                    ))}
                  </SortableContext>
                </DndContext>
              )}
            </div>
          </div>
          <div className="canvas-zoom">
            <button onClick={() => {}}>+</button>
            <button onClick={() => {}}>−</button>
          </div>
        </div>
      </div>

      {/* Block Settings */}
      <div className={`editor-settings ${settingsOpen && selected ? 'open' : ''}`}>
        <div className="settings-header">
          <h3>Block Settings</h3>
          <button onClick={() => { setSettingsOpen(false); setSelectedBlock(null) }}><HiX size={18} /></button>
        </div>
        {selected && (
          <div className="settings-body">
            <BlockSettingsPanel block={selected} onChange={(data) => updateBlock(selected.id, data)} />
            <div className="settings-actions">
              <button className="btn btn-ghost btn-sm" onClick={() => { setSettingsOpen(false); setSelectedBlock(null) }}>Discard</button>
              <button className="btn btn-primary btn-sm" onClick={() => setSettingsOpen(false)}>Apply Changes</button>
            </div>
          </div>
        )}
      </div>

      {activeModal === 'guestlist' && (
        <GuestListModal invitation={invitation} onClose={() => setActiveModal(null)} />
      )}
      {activeModal === 'settings' && (
        <SettingsModal 
          invitation={invitation} 
          onClose={() => setActiveModal(null)} 
          onSave={(data) => updateInvitation(invitation.id, data)}
        />
      )}
    </div>
  )
}

/* ImageUploader inline component */
function ImageUploader({ currentUrl, onUpload }) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const fileInputRef = useRef(null)

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setProgress(0)

    try {
      const result = await uploadToCloudinary(file, (p) => setProgress(p))
      onUpload(result.url)
    } catch (err) {
      console.error('Upload error:', err)
      alert(`Gagal mengunggah foto: ${err.message}`)
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }

  return (
    <div className="image-uploader">
      {currentUrl && (
        <div className="image-uploader-preview">
          <img src={currentUrl} alt="Preview" />
        </div>
      )}
      <button
        type="button"
        className="btn btn-outline btn-sm"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        style={{ width: '100%', marginTop: 8 }}
      >
        {uploading ? (
          <span>Uploading... {progress}%</span>
        ) : (
          <><HiOutlineUpload size={14} /> {currentUrl ? 'Change Image' : 'Upload Image'}</>
        )}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
    </div>
  )
}

function BlockSettingsPanel({ block, onChange }) {
  const type = block.type
  const data = block.data

  if (type === 'cover') {
    return (
      <>
        <div className="settings-section">
          <span className="label-caps">Cover Background</span>
          <div style={{ marginTop: 8 }}>
            <ImageUploader
              currentUrl={data.backgroundImage}
              onUpload={(url) => onChange({ backgroundImage: url })}
            />
          </div>
          <div className="input-group" style={{ marginTop: 12 }}>
            <label>Or paste URL</label>
            <input className="settings-input" value={data.backgroundImage || ''} onChange={e => onChange({ backgroundImage: e.target.value })} placeholder="https://..." />
          </div>
          {data.backgroundImage && (
            <>
              <div style={{ marginTop: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>Overlay Opacity</label>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--olive)', minWidth: 32, textAlign: 'right' }}>{Math.round((data.overlayOpacity ?? 0.4) * 100)}%</span>
                </div>
                <input type="range" min={0} max={1} step={0.05} value={data.overlayOpacity ?? 0.4} onChange={e => onChange({ overlayOpacity: Number(e.target.value) })} style={{ width: '100%', accentColor: 'var(--olive)', cursor: 'pointer' }} />
              </div>
              <div className="input-group" style={{ marginTop: 10 }}>
                <label>Overlay Color</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input type="color" value={data.overlayColor || '#000000'} onChange={e => onChange({ overlayColor: e.target.value })} style={{ width: 36, height: 36, padding: 2, border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer' }} />
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{data.overlayColor || '#000000'}</span>
                </div>
              </div>
            </>
          )}
        </div>
        <div className="settings-section">
          <span className="label-caps">Cover Content</span>
          <div className="input-group" style={{ marginTop: 8 }}>
            <label>Subtitle</label>
            <input className="settings-input" value={data.subtitle || ''} onChange={e => onChange({ subtitle: e.target.value })} placeholder="We Are Getting Married" />
          </div>
          <div className="input-group" style={{ marginTop: 8 }}>
            <label>Couple Name</label>
            <input className="settings-input" value={data.coupleName || ''} onChange={e => onChange({ coupleName: e.target.value })} placeholder="Aqil & Anty" />
          </div>
          <div className="input-group" style={{ marginTop: 8 }}>
            <label>Date</label>
            <input className="settings-input" value={data.date || ''} onChange={e => onChange({ date: e.target.value })} placeholder="Senin, 30 Maret 2026" />
          </div>
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
              <input type="checkbox" checked={data.showGuestName ?? true} onChange={e => onChange({ showGuestName: e.target.checked })} />
              Show Guest Name
            </label>
            <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
              <input type="checkbox" checked={data.showScrollIndicator ?? true} onChange={e => onChange({ showScrollIndicator: e.target.checked })} />
              Show Scroll Indicator
            </label>
          </div>
        </div>
        <SpacingSection data={data} onChange={onChange} />
      </>
    )
  }

  if (type === 'heading' || type === 'paragraph') {
    return (
      <>
        <div className="settings-section">
          <span className="label-caps">Typography</span>
          <div className="input-group" style={{ marginTop: 8 }}>
            <label>Font Family</label>
            <select className="settings-select" value={data.fontFamily || 'Gambarino'} onChange={e => onChange({ fontFamily: e.target.value })}>
              <option value="Gambarino">Gambarino (Serif)</option>
              <option value="Inter">Inter (Sans Serif)</option>
              <option value="Georgia">Georgia</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <div className="input-group" style={{ flex: 1 }}>
              <label>Size</label>
              <input type="number" className="settings-input" value={data.fontSize || 16} onChange={e => onChange({ fontSize: Number(e.target.value) })} />
            </div>
            <div className="input-group" style={{ flex: 1 }}>
              <label>Align</label>
              <select className="settings-select" value={data.align || 'center'} onChange={e => onChange({ align: e.target.value })}>
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </div>
          </div>
        </div>
        <div className="settings-section">
          <span className="label-caps">Appearance</span>
          <div className="color-swatches">
            {['#565F34', '#BE1A32', '#EDE9E7', '#A7BF66', '#8A8A8A', '#2D2D2D'].map(c => (
              <button key={c} className={`swatch ${data.color === c ? 'active' : ''}`} style={{ background: c }} onClick={() => onChange({ color: c })} />
            ))}
            <input type="color" value={data.color || '#2D2D2D'} onChange={e => onChange({ color: e.target.value })} className="swatch-picker" />
          </div>
        </div>
        <div className="settings-section">
          <span className="label-caps">Content</span>
          <textarea className="settings-textarea" value={data.content || ''} onChange={e => onChange({ content: e.target.value })} rows={4} />
        </div>
        <SpacingSection data={data} onChange={onChange} />
        <SizeSection data={data} onChange={onChange} />
        <BackgroundImageSection data={data} onChange={onChange} />
        <AdvancedDesignSection data={data} onChange={onChange} />
      </>
    )
  }

  if (type === 'photo') {
    return (
      <>
        <div className="settings-section">
          <span className="label-caps">Image</span>
          <div style={{ marginTop: 8 }}>
            <ImageUploader
              currentUrl={data.url}
              onUpload={(url) => onChange({ url })}
            />
          </div>
          <div className="input-group" style={{ marginTop: 12 }}>
            <label>Or paste URL</label>
            <input className="settings-input" value={data.url || ''} onChange={e => onChange({ url: e.target.value })} placeholder="https://..." />
          </div>
          <div className="input-group">
            <label>Caption</label>
            <input className="settings-input" value={data.caption || ''} onChange={e => onChange({ caption: e.target.value })} />
          </div>
        </div>
        <SpacingSection data={data} onChange={onChange} />
        <SizeSection data={data} onChange={onChange} />
        <BackgroundImageSection data={data} onChange={onChange} />
        <AdvancedDesignSection data={data} onChange={onChange} />
      </>
    )
  }

  if (type === 'video') {
    return (
      <div className="settings-section">
        <span className="label-caps">Video</span>
        <div className="input-group" style={{ marginTop: 8 }}>
          <label>Video URL (MP4, WebM)</label>
          <input className="settings-input" value={data.url || ''} onChange={e => onChange({ url: e.target.value })} placeholder="https://.../video.mp4" />
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
          <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="checkbox" checked={data.autoplay || false} onChange={e => onChange({ autoplay: e.target.checked })} />
            Autoplay (muted)
          </label>
          <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="checkbox" checked={data.loop || false} onChange={e => onChange({ loop: e.target.checked })} />
            Loop
          </label>
        </div>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>Autoplay videos are automatically muted by modern browsers.</p>
        <SpacingSection data={data} onChange={onChange} />
        <SizeSection data={data} onChange={onChange} />
        <BackgroundImageSection data={data} onChange={onChange} />
        <AdvancedDesignSection data={data} onChange={onChange} />
      </div>
    )
  }

  if (type === 'countdown') {
    return (
      <div className="settings-section">
        <span className="label-caps">Countdown</span>
        <div className="input-group" style={{ marginTop: 8 }}>
          <label>Target Date</label>
          <input type="datetime-local" className="settings-input" value={data.targetDate?.slice(0, 16) || ''} onChange={e => onChange({ targetDate: e.target.value })} />
        </div>
        <div className="input-group">
          <label>Label</label>
          <input className="settings-input" value={data.label || ''} onChange={e => onChange({ label: e.target.value })} />
        </div>
        <SpacingSection data={data} onChange={onChange} />
        <SizeSection data={data} onChange={onChange} />
        <BackgroundImageSection data={data} onChange={onChange} />
        <AdvancedDesignSection data={data} onChange={onChange} />
      </div>
    )
  }

  if (type === 'location') {
    return (
      <>
        <div className="settings-section">
          <span className="label-caps">Event Details</span>
          <div className="input-group" style={{ marginTop: 8 }}>
            <label>Venue</label>
            <input className="settings-input" value={data.venue || ''} onChange={e => onChange({ venue: e.target.value })} />
          </div>
          <div className="input-group">
            <label>Address</label>
            <input className="settings-input" value={data.address || ''} onChange={e => onChange({ address: e.target.value })} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div className="input-group" style={{ flex: 1 }}>
              <label>Date</label>
              <input className="settings-input" value={data.date || ''} onChange={e => onChange({ date: e.target.value })} />
            </div>
            <div className="input-group" style={{ flex: 1 }}>
              <label>Time</label>
              <input className="settings-input" value={data.time || ''} onChange={e => onChange({ time: e.target.value })} />
            </div>
          </div>
          <div className="input-group" style={{ marginTop: 8 }}>
            <label>Google Maps Link URL</label>
            <input className="settings-input" value={data.mapUrl || ''} onChange={e => onChange({ mapUrl: e.target.value })} placeholder="https://maps.app.goo.gl/..." />
          </div>
        </div>
        <SpacingSection data={data} onChange={onChange} />
        <SizeSection data={data} onChange={onChange} />
        <BackgroundImageSection data={data} onChange={onChange} />
        <AdvancedDesignSection data={data} onChange={onChange} />
      </>
    )
  }

  if (type === 'rsvp') {
    return (
      <div className="settings-section">
        <span className="label-caps">RSVP Form</span>
        <div className="input-group" style={{ marginTop: 8 }}>
          <label>Title</label>
          <input className="settings-input" value={data.title || ''} onChange={e => onChange({ title: e.target.value })} />
        </div>
        <SpacingSection data={data} onChange={onChange} />
        <SizeSection data={data} onChange={onChange} />
        <BackgroundImageSection data={data} onChange={onChange} />
        <AdvancedDesignSection data={data} onChange={onChange} />
      </div>
    )
  }

  if (type === 'divider') {
    return (
      <div className="settings-section">
        <span className="label-caps">Divider</span>
        <div className="color-swatches" style={{ marginTop: 8 }}>
          {['#E0DCD8', '#565F34', '#BE1A32', '#A7BF66', '#2D2D2D'].map(c => (
            <button key={c} className={`swatch ${data.color === c ? 'active' : ''}`} style={{ background: c }} onClick={() => onChange({ color: c })} />
          ))}
        </div>
        <SpacingSection data={data} onChange={onChange} />
        <SizeSection data={data} onChange={onChange} />
        <BackgroundImageSection data={data} onChange={onChange} />
        <AdvancedDesignSection data={data} onChange={onChange} />
      </div>
    )
  }

  if (type === 'gallery') {
    return (
      <div className="settings-section">
        <span className="label-caps">Gallery</span>
        <div className="input-group" style={{ marginTop: 8 }}>
          <label>Columns</label>
          <select className="settings-select" value={data.columns || 2} onChange={e => onChange({ columns: Number(e.target.value) })}>
            <option value={1}>1 Column</option>
            <option value={2}>2 Columns</option>
            <option value={3}>3 Columns</option>
          </select>
        </div>
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label className="label-caps" style={{ fontSize: 10 }}>Images</label>
          {(data.images || []).map((img, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <img src={img} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }} />
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => {
                const newImgs = [...(data.images || [])];
                newImgs.splice(i, 1);
                onChange({ images: newImgs });
              }} style={{ padding: 4 }}>Remove</button>
            </div>
          ))}
          <ImageUploader currentUrl="" onUpload={(url) => {
            onChange({ images: [...(data.images || []), url] })
          }} />
        </div>
        <SpacingSection data={data} onChange={onChange} />
        <SizeSection data={data} onChange={onChange} />
        <BackgroundImageSection data={data} onChange={onChange} />
        <AdvancedDesignSection data={data} onChange={onChange} />
      </div>
    )
  }

  if (type === 'gift') {
    return (
      <div className="settings-section">
        <span className="label-caps">Gift Details</span>
        <div className="input-group" style={{ marginTop: 8 }}>
          <label>Title</label>
          <input className="settings-input" value={data.title || ''} onChange={e => onChange({ title: e.target.value })} />
        </div>
        <div className="input-group" style={{ marginTop: 8 }}>
          <label>Bank Name</label>
          <input className="settings-input" value={data.bankName || ''} onChange={e => onChange({ bankName: e.target.value })} placeholder="BCA / Mandiri" />
        </div>
        <div className="input-group" style={{ marginTop: 8 }}>
          <label>Account Number</label>
          <input className="settings-input" value={data.accountNumber || ''} onChange={e => onChange({ accountNumber: e.target.value })} />
        </div>
        <div className="input-group" style={{ marginTop: 8 }}>
          <label>Account Name</label>
          <input className="settings-input" value={data.accountName || ''} onChange={e => onChange({ accountName: e.target.value })} />
        </div>
        <SpacingSection data={data} onChange={onChange} />
        <SizeSection data={data} onChange={onChange} />
        <BackgroundImageSection data={data} onChange={onChange} />
        <AdvancedDesignSection data={data} onChange={onChange} />
      </div>
    )
  }

  if (type === 'music') {
    return (
      <div className="settings-section">
        <span className="label-caps">Background Music</span>
        <div className="input-group" style={{ marginTop: 8 }}>
          <label>Audio URL (MP3)</label>
          <input className="settings-input" value={data.url || ''} onChange={e => onChange({ url: e.target.value })} placeholder="https://.../song.mp3" />
        </div>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>Background music requires the user to interact with the page before it can play.</p>
        <SpacingSection data={data} onChange={onChange} />
        <SizeSection data={data} onChange={onChange} />
        <BackgroundImageSection data={data} onChange={onChange} />
        <AdvancedDesignSection data={data} onChange={onChange} />
      </div>
    )
  }

  if (type === 'signature') {
    return (
      <div className="settings-section">
        <span className="label-caps">Signature Names</span>
        <div className="input-group" style={{ marginTop: 8 }}>
          <label>Name 1</label>
          <input className="settings-input" value={data.names?.[0] || ''} onChange={e => {
            const newNames = [...(data.names || [])];
            newNames[0] = e.target.value;
            onChange({ names: newNames });
          }} />
        </div>
        <div className="input-group" style={{ marginTop: 8 }}>
          <label>Name 2</label>
          <input className="settings-input" value={data.names?.[1] || ''} onChange={e => {
            const newNames = [...(data.names || [])];
            newNames[1] = e.target.value;
            onChange({ names: newNames });
          }} />
        </div>
        <SpacingSection data={data} onChange={onChange} />
        <SizeSection data={data} onChange={onChange} />
        <BackgroundImageSection data={data} onChange={onChange} />
        <AdvancedDesignSection data={data} onChange={onChange} />
      </div>
    )
  }

  if (type === 'registry') {
    return (
      <div className="settings-section">
        <span className="label-caps">Gift Registry</span>
        <div className="input-group" style={{ marginTop: 8 }}>
          <label>Title</label>
          <input className="settings-input" value={data.title || ''} onChange={e => onChange({ title: e.target.value })} />
        </div>
        <div style={{ marginTop: 16 }}>
          <span className="label-caps" style={{ fontSize: 10 }}>Registry Links</span>
          {(data.items || []).map((item, i) => (
            <div key={i} style={{ border: '1px solid var(--border)', padding: 12, borderRadius: 6, marginTop: 8 }}>
              <div className="input-group">
                <label>Store Name</label>
                <input className="settings-input" value={item.label || ''} onChange={e => {
                  const newItems = [...(data.items || [])];
                  newItems[i] = { ...item, label: e.target.value };
                  onChange({ items: newItems });
                }} />
              </div>
              <div className="input-group" style={{ marginTop: 8 }}>
                <label>URL Link</label>
                <input className="settings-input" value={item.url || ''} onChange={e => {
                  const newItems = [...(data.items || [])];
                  newItems[i] = { ...item, url: e.target.value };
                  onChange({ items: newItems });
                }} placeholder="https://..." />
              </div>
              <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop: 8, color: 'var(--error)' }} onClick={() => {
                const newItems = [...(data.items || [])];
                newItems.splice(i, 1);
                onChange({ items: newItems });
              }}>Remove Link</button>
            </div>
          ))}
          <button type="button" className="btn btn-outline btn-sm" style={{ width: '100%', marginTop: 12 }} onClick={() => {
            onChange({ items: [...(data.items || []), { label: '', url: '' }] })
          }}>+ Add Registry Link</button>
        </div>
        <SpacingSection data={data} onChange={onChange} />
        <SizeSection data={data} onChange={onChange} />
        <BackgroundImageSection data={data} onChange={onChange} />
        <AdvancedDesignSection data={data} onChange={onChange} />
      </div>
    )
  }

  if (type === 'couple') {
    return (
      <div className="settings-section">
        <span className="label-caps">Couple Profiles</span>
        
        <div style={{ padding: 12, border: '1px solid var(--border)', borderRadius: 6, marginTop: 12 }}>
          <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-light)' }}>Person 1 (Bride/Groom)</label>
          <div className="input-group" style={{ marginTop: 8 }}>
            <label>Name</label>
            <input className="settings-input" value={data.name1 || ''} onChange={e => onChange({ name1: e.target.value })} />
          </div>
          <div className="input-group" style={{ marginTop: 8 }}>
            <label>Title / Gelar</label>
            <input className="settings-input" value={data.title1 || ''} onChange={e => onChange({ title1: e.target.value })} placeholder="Putra pertama dari Bpk. ... & Ibu ..." />
          </div>
          <div style={{ marginTop: 8 }}>
            <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>Photo</label>
            <ImageUploader currentUrl={data.photo1} onUpload={url => onChange({ photo1: url })} />
          </div>
          <div className="input-group" style={{ marginTop: 8 }}>
            <label>Instagram Username</label>
            <input className="settings-input" value={data.instagram1 || ''} onChange={e => onChange({ instagram1: e.target.value })} placeholder="username" />
          </div>
        </div>

        <div style={{ padding: 12, border: '1px solid var(--border)', borderRadius: 6, marginTop: 12 }}>
          <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-light)' }}>Person 2 (Bride/Groom)</label>
          <div className="input-group" style={{ marginTop: 8 }}>
            <label>Name</label>
            <input className="settings-input" value={data.name2 || ''} onChange={e => onChange({ name2: e.target.value })} />
          </div>
          <div className="input-group" style={{ marginTop: 8 }}>
            <label>Title / Gelar</label>
            <input className="settings-input" value={data.title2 || ''} onChange={e => onChange({ title2: e.target.value })} placeholder="Putri kedua dari Bpk. ... & Ibu ..." />
          </div>
          <div style={{ marginTop: 8 }}>
            <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>Photo</label>
            <ImageUploader currentUrl={data.photo2} onUpload={url => onChange({ photo2: url })} />
          </div>
          <div className="input-group" style={{ marginTop: 8 }}>
            <label>Instagram Username</label>
            <input className="settings-input" value={data.instagram2 || ''} onChange={e => onChange({ instagram2: e.target.value })} placeholder="username" />
          </div>
        </div>

        <div className="input-group" style={{ marginTop: 12 }}>
          <label>Short Description / Bio</label>
          <textarea className="settings-textarea" value={data.description || ''} onChange={e => onChange({ description: e.target.value })} rows={3} />
        </div>
        <SpacingSection data={data} onChange={onChange} />
        <SizeSection data={data} onChange={onChange} />
        <BackgroundImageSection data={data} onChange={onChange} />
        <AdvancedDesignSection data={data} onChange={onChange} />
      </div>
    )
  }

  if (type === 'story') {
    return (
      <div className="settings-section">
        <span className="label-caps">Our Story Timeline</span>
        <div style={{ marginTop: 16 }}>
          {(data.items || []).map((item, i) => (
            <div key={i} style={{ border: '1px solid var(--border)', padding: 12, borderRadius: 6, marginTop: 8 }}>
              <div className="input-group">
                <label>Date / Year</label>
                <input className="settings-input" value={item.date || ''} onChange={e => {
                  const newItems = [...(data.items || [])];
                  newItems[i] = { ...item, date: e.target.value };
                  onChange({ items: newItems });
                }} placeholder="e.g. 2018 or Dec 2020" />
              </div>
              <div className="input-group" style={{ marginTop: 8 }}>
                <label>Title</label>
                <input className="settings-input" value={item.title || ''} onChange={e => {
                  const newItems = [...(data.items || [])];
                  newItems[i] = { ...item, title: e.target.value };
                  onChange({ items: newItems });
                }} placeholder="First Met" />
              </div>
              <div className="input-group" style={{ marginTop: 8 }}>
                <label>Description</label>
                <textarea className="settings-textarea" value={item.description || ''} onChange={e => {
                  const newItems = [...(data.items || [])];
                  newItems[i] = { ...item, description: e.target.value };
                  onChange({ items: newItems });
                }} rows={2} />
              </div>
              <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop: 8, color: 'var(--error)' }} onClick={() => {
                const newItems = [...(data.items || [])];
                newItems.splice(i, 1);
                onChange({ items: newItems });
              }}>Remove Milestone</button>
            </div>
          ))}
          <button type="button" className="btn btn-outline btn-sm" style={{ width: '100%', marginTop: 12 }} onClick={() => {
            onChange({ items: [...(data.items || []), { date: '', title: '', description: '' }] })
          }}>+ Add Milestone</button>
        </div>
        <SpacingSection data={data} onChange={onChange} />
        <SizeSection data={data} onChange={onChange} />
        <BackgroundImageSection data={data} onChange={onChange} />
        <AdvancedDesignSection data={data} onChange={onChange} />
      </div>
    )
  }

  if (type === 'wishes') {
    return (
      <div className="settings-section">
        <span className="label-caps">Guest Wishes</span>
        <div className="input-group" style={{ marginTop: 8 }}>
          <label>Title</label>
          <input className="settings-input" value={data.title || ''} onChange={e => onChange({ title: e.target.value })} />
        </div>
        <div style={{ marginTop: 16 }}>
          <span className="label-caps" style={{ fontSize: 10 }}>Pinned Messages</span>
          {(data.messages || []).map((msg, i) => (
            <div key={i} style={{ border: '1px solid var(--border)', padding: 12, borderRadius: 6, marginTop: 8 }}>
              <div className="input-group">
                <label>Guest Name</label>
                <input className="settings-input" value={msg.author || ''} onChange={e => {
                  const newMsgs = [...(data.messages || [])];
                  newMsgs[i] = { ...msg, author: e.target.value };
                  onChange({ messages: newMsgs });
                }} />
              </div>
              <div className="input-group" style={{ marginTop: 8 }}>
                <label>Message</label>
                <textarea className="settings-textarea" value={msg.content || ''} onChange={e => {
                  const newMsgs = [...(data.messages || [])];
                  newMsgs[i] = { ...msg, content: e.target.value };
                  onChange({ messages: newMsgs });
                }} rows={2} />
              </div>
              <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop: 8, color: 'var(--error)' }} onClick={() => {
                const newMsgs = [...(data.messages || [])];
                newMsgs.splice(i, 1);
                onChange({ messages: newMsgs });
              }}>Remove Message</button>
            </div>
          ))}
          <button type="button" className="btn btn-outline btn-sm" style={{ width: '100%', marginTop: 12 }} onClick={() => {
            onChange({ messages: [...(data.messages || []), { author: '', content: '' }] })
          }}>+ Add Message</button>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 12 }}>
            These messages are manually curated by you to be displayed on the public invitation.
          </p>
        </div>
        <SpacingSection data={data} onChange={onChange} />
        <SizeSection data={data} onChange={onChange} />
        <BackgroundImageSection data={data} onChange={onChange} />
        <AdvancedDesignSection data={data} onChange={onChange} />
      </div>
    )
  }

  if (type === 'footer') {
    return (
      <>
        <div className="settings-section">
          <span className="label-caps">Footer Content</span>
          <div className="input-group" style={{ marginTop: 8 }}>
            <label>Thank You Text</label>
            <input className="settings-input" value={data.thankYouText || ''} onChange={e => onChange({ thankYouText: e.target.value })} placeholder="Thank You" />
          </div>
          <div className="input-group" style={{ marginTop: 8 }}>
            <label>Couple Name</label>
            <input className="settings-input" value={data.coupleName || ''} onChange={e => onChange({ coupleName: e.target.value })} placeholder="Aqil & Anty" />
          </div>
          <div className="input-group" style={{ marginTop: 8 }}>
            <label>Subtitle</label>
            <input className="settings-input" value={data.subtitle || ''} onChange={e => onChange({ subtitle: e.target.value })} placeholder="For Being Part of Our Special Day" />
          </div>
          <div style={{ marginTop: 12 }}>
            <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
              <input type="checkbox" checked={data.showWatermark ?? true} onChange={e => onChange({ showWatermark: e.target.checked })} />
              Show Invitori Watermark
            </label>
          </div>
        </div>
        <div className="settings-section">
          <span className="label-caps">Photo Slideshow</span>
          <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(data.photos || []).map((photo, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <img src={photo} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }} />
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => {
                  const newPhotos = [...(data.photos || [])];
                  newPhotos.splice(i, 1);
                  onChange({ photos: newPhotos });
                }} style={{ padding: 4 }}>Remove</button>
              </div>
            ))}
            <ImageUploader currentUrl="" onUpload={(url) => {
              onChange({ photos: [...(data.photos || []), url] })
            }} />
          </div>
        </div>
        <SpacingSection data={data} onChange={onChange} />
      </>
    )
  }

  // Generic fallback
  return (
    <div className="settings-section">
      <span className="label-caps">Settings</span>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>Settings for {BLOCK_TYPES[type]?.label || type} block.</p>
      <SpacingSection data={data} onChange={onChange} />
      <SizeSection data={data} onChange={onChange} />
      <BackgroundImageSection data={data} onChange={onChange} />
      <AdvancedDesignSection data={data} onChange={onChange} />
    </div>
  )
}

function SpacingSection({ data, onChange }) {
  const spacingTop = data.spacingTop ?? 16
  const spacingBottom = data.spacingBottom ?? 16
  return (
    <div className="settings-section" style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 16 }}>
      <span className="label-caps" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        ↕ Spacing
      </span>
      <div style={{ marginTop: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>Space Above</label>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--olive)', minWidth: 32, textAlign: 'right' }}>{spacingTop}px</span>
        </div>
        <input
          type="range"
          min={0} max={120} step={4}
          value={spacingTop}
          onChange={e => onChange({ spacingTop: Number(e.target.value) })}
          style={{ width: '100%', accentColor: 'var(--olive)', cursor: 'pointer' }}
        />
      </div>
      <div style={{ marginTop: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>Space Below</label>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--olive)', minWidth: 32, textAlign: 'right' }}>{spacingBottom}px</span>
        </div>
        <input
          type="range"
          min={0} max={120} step={4}
          value={spacingBottom}
          onChange={e => onChange({ spacingBottom: Number(e.target.value) })}
          style={{ width: '100%', accentColor: 'var(--olive)', cursor: 'pointer' }}
        />
      </div>
    </div>
  )
}

function BackgroundImageSection({ data, onChange }) {
  const detectAndSetAspectRatio = (url) => {
    if (!url) return
    const img = new Image()
    img.onload = () => {
      const ratio = `${img.naturalWidth}/${img.naturalHeight}`
      onChange({ backgroundAspectRatio: ratio })
    }
    img.src = url
  }

  const handleUpload = (url) => {
    onChange({ backgroundImage: url })
    detectAndSetAspectRatio(url)
  }

  const handlePasteUrl = (url) => {
    onChange({ backgroundImage: url })
    if (url) detectAndSetAspectRatio(url)
  }

  return (
    <div className="settings-section" style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 16 }}>
      <span className="label-caps" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        🖼 Background Image
      </span>
      <div style={{ marginTop: 12 }}>
        <ImageUploader
          currentUrl={data.backgroundImage || ''}
          onUpload={handleUpload}
        />
        <div className="input-group" style={{ marginTop: 10 }}>
          <label>Or paste URL</label>
          <input
            className="settings-input"
            value={data.backgroundImage || ''}
            onChange={e => handlePasteUrl(e.target.value)}
            placeholder="https://..."
          />
        </div>
        {data.backgroundImage && (
          <>
            {data.backgroundAspectRatio && (
              <div style={{ marginTop: 10, padding: '8px 10px', background: 'rgba(86,95,52,0.06)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>📐 Aspect Ratio: <strong style={{ color: 'var(--olive)' }}>{data.backgroundAspectRatio}</strong></span>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ padding: '2px 8px', fontSize: 10 }}
                  onClick={() => onChange({ backgroundAspectRatio: '' })}
                >Reset</button>
              </div>
            )}
            <div className="input-group" style={{ marginTop: 10 }}>
              <label>Fit Mode</label>
              <select
                className="settings-select"
                value={data.backgroundFit || 'cover'}
                onChange={e => onChange({ backgroundFit: e.target.value })}
              >
                <option value="cover">Cover (fill)</option>
                <option value="contain">Contain (fit)</option>
                <option value="fill">Stretch</option>
              </select>
            </div>
            <div style={{ marginTop: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>Overlay Opacity</label>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--olive)', minWidth: 32, textAlign: 'right' }}>{Math.round((data.backgroundOverlay ?? 0.3) * 100)}%</span>
              </div>
              <input
                type="range"
                min={0} max={1} step={0.05}
                value={data.backgroundOverlay ?? 0.3}
                onChange={e => onChange({ backgroundOverlay: Number(e.target.value) })}
                style={{ width: '100%', accentColor: 'var(--olive)', cursor: 'pointer' }}
              />
            </div>
            <div className="input-group" style={{ marginTop: 10 }}>
              <label>Overlay Color</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="color"
                  value={data.backgroundOverlayColor || '#000000'}
                  onChange={e => onChange({ backgroundOverlayColor: e.target.value })}
                  style={{ width: 36, height: 36, padding: 2, border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer' }}
                />
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{data.backgroundOverlayColor || '#000000'}</span>
              </div>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{ marginTop: 12, color: 'var(--error)', width: '100%' }}
              onClick={() => onChange({ backgroundImage: '', backgroundOverlay: 0.3, backgroundFit: 'cover', backgroundOverlayColor: '#000000', backgroundAspectRatio: '' })}
            >
              ✕ Remove Background
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function SizeSection({ data, onChange }) {
  const minHeight = data.blockMinHeight ?? 0
  return (
    <div className="settings-section" style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 16 }}>
      <span className="label-caps" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        📏 Block Size
      </span>
      <div style={{ marginTop: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>Min Height</label>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--olive)', minWidth: 40, textAlign: 'right' }}>{minHeight === 0 ? 'Auto' : `${minHeight}px`}</span>
        </div>
        <input
          type="range"
          min={0} max={600} step={10}
          value={minHeight}
          onChange={e => onChange({ blockMinHeight: Number(e.target.value) })}
          style={{ width: '100%', accentColor: 'var(--olive)', cursor: 'pointer' }}
        />
        <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4, margin: '0' }}>Set to 0 for auto height.</p>
      </div>
    </div>
  )
}

function AdvancedDesignSection({ data, onChange }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="settings-section" style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 16 }}>
      <button 
        type="button" 
        onClick={() => setIsOpen(!isOpen)}
        style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="label-caps">✨ Advanced Design</span>
        </div>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{isOpen ? '▲' : '▼'}</span>
      </button>
      
      {isOpen && (
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="input-group">
            <label>Background Color Override</label>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <input type="color" value={data.customBgColor || '#ffffff'} onChange={e => onChange({ customBgColor: e.target.value })} style={{ width: 40, height: 32, padding: 0, cursor: 'pointer', borderRadius: 4, border: '1px solid var(--border)' }} />
              <input type="text" className="settings-input" value={data.customBgColor || ''} onChange={e => onChange({ customBgColor: e.target.value })} placeholder="HEX or transparent" style={{ flex: 1 }} />
            </div>
            <button className="btn btn-ghost btn-sm" style={{ marginTop: 8 }} onClick={() => onChange({ customBgColor: '' })}>Clear Override</button>
          </div>
          
          <div className="input-group">
            <label>Text Color Override</label>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <input type="color" value={data.customTextColor || '#000000'} onChange={e => onChange({ customTextColor: e.target.value })} style={{ width: 40, height: 32, padding: 0, cursor: 'pointer', borderRadius: 4, border: '1px solid var(--border)' }} />
              <input type="text" className="settings-input" value={data.customTextColor || ''} onChange={e => onChange({ customTextColor: e.target.value })} placeholder="HEX e.g. #2a3125" style={{ flex: 1 }} />
            </div>
            <button className="btn btn-ghost btn-sm" style={{ marginTop: 8 }} onClick={() => onChange({ customTextColor: '' })}>Clear Override</button>
          </div>

          <div className="input-group">
            <label>Text Alignment</label>
            <select className="settings-input" value={data.customTextAlign || ''} onChange={e => onChange({ customTextAlign: e.target.value })} style={{ marginTop: 8 }}>
              <option value="">Default Center</option>
              <option value="left">Left Align</option>
              <option value="center">Center Align</option>
              <option value="right">Right Align</option>
              <option value="justify">Justify</option>
            </select>
          </div>

          <div className="input-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <label>Corner Radius</label>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--olive)' }}>{data.customBorderRadius || 0}px</span>
            </div>
            <input type="range" min="0" max="100" value={data.customBorderRadius || 0} onChange={e => onChange({ customBorderRadius: Number(e.target.value) })} style={{ accentColor: 'var(--olive)' }} />
          </div>
        </div>
      )}
    </div>
  )
}

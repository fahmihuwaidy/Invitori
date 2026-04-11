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
import './PublicInvitationPage.css'
import { renderPublicBlock, isMediaVideo, MediaRenderer } from './PublicInvitationPage'

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
      <MediaRenderer
        src={data.backgroundImage}
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

function renderBlock(block, isSelected, onSelect, theme) {
  const hasBg = !!block.data.backgroundImage
  const isCover = block.type === 'cover'
  const isFooter = block.type === 'footer'
  const isFullWidthBlock = isCover || isFooter
  const blockMinHeight = block.data.blockMinHeight || 0
  const bgAspectRatio = block.data.backgroundAspectRatio || null

  const blockStyle = {
    opacity: 1, // override .public-block default
    paddingTop: isFullWidthBlock ? 0 : (block.data?.spacingTop ?? 40),
    paddingBottom: isFullWidthBlock ? 0 : (block.data?.spacingBottom ?? 40),
    cursor: 'pointer',
    border: isSelected ? '2px solid var(--olive)' : '2px solid transparent',
    borderRadius: block.data.customBorderRadius ? `${block.data.customBorderRadius}px` : undefined,
    transition: 'border-color 0.2s ease',
    position: hasBg ? 'relative' : undefined,
    background: block.data.customBgColor || (isSelected ? 'rgba(86,95,52,0.04)' : undefined),
    color: block.data.customTextColor || undefined,
    textAlign: block.data.customTextAlign || undefined,
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

  const px = isCover || isFooter ? 0 : 32
  const contentStyle = {
    ...((hasBg && !isCover) ? { position: 'relative', zIndex: 2 } : {}),
    ...(block.data.fullWidth !== false ? { padding: 0, maxWidth: 'none', paddingLeft: px, paddingRight: px } : { paddingLeft: px, paddingRight: px })
  }

  const onClick = (e) => { e.stopPropagation(); onSelect(block.id) }

  return (
    <div className={`public-block ${isCover ? 'public-block-cover' : ''} ${isFooter ? 'public-block-footer' : ''}`} style={blockStyle} onClick={onClick}>
      {hasBg && !isCover && <BlockBackgroundLayer data={block.data} />}
      
      <div className="public-block-content" style={contentStyle}>
        {isSelected && (
          <span className="block-selected-label">SELECTED: {BLOCK_TYPES[block.type]?.label?.toUpperCase() || block.type.toUpperCase()}</span>
        )}
        <div style={{ pointerEvents: 'none', width: '100%' }}>
           {renderPublicBlock(
             block, 
             theme || { primaryColor: 'var(--olive)' }, 
             { name: '', email: '', attendance: '' }, // rsvpForm
             () => {}, // setRsvpForm
             () => {}, // handleRsvp
             false,    // rsvpSent
             { name: '', content: '' }, // wishForm
             () => {}, // setWishForm
             () => {}, // handleSendWish
             false,    // wishSent
             'Tamu Undangan', // guestName (for editor preview)
             true,            // isPreviewUrl
             []               // wishes (Empty by default)
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
  const [isSaving, setIsSaving] = useState(false)
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

  const deleteBlock = async (blockId) => {
    if (!blockId) return
    
    // Clear selection immediately
    setSelectedBlock(null)
    setSettingsOpen(false)
    
    // Trigger delete in context
    try {
      await ctxDeleteBlock(invitation.id, blockId)
    } catch (err) {
      console.error('Delete failed:', err)
    }
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

  const handleSave = async () => {
    setIsSaving(true)
    
    // Create a timeout promise to ensure the UI doesn't stay stuck
    const timeoutPromise = new Promise(resolve => setTimeout(resolve, 3000))
    
    try {
      // Race the update against the timeout
      await Promise.race([
        updateInvitation(invitation.id, { updatedAt: new Date().toISOString() }),
        timeoutPromise
      ])
    } catch (error) {
      console.error('Error saving:', error)
    } finally {
      // Ensure we stay in "Saving..." for at least 800ms for visual feedback, 
      // but definitely reset after the race is over.
      setTimeout(() => setIsSaving(false), 500)
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
          <a className="sidebar-link active"><HiOutlineMail size={18} /><span>EDITOR</span></a>
          <a className="sidebar-link" onClick={() => navigate('/admin?tab=rsvps')}><HiOutlineGift size={18} /><span>RSVPS & WISHES</span></a>
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
        <div className="palette-footer" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button className="btn btn-outline btn-full" onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : '💾 Save Changes'}
          </button>
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
            <button className="btn btn-outline btn-sm" onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save'}
            </button>
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
            {/* Native Status Bar */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 48,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '0 28px', zIndex: 50, pointerEvents: 'none',
              color: '#fff', mixBlendMode: 'difference',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', 
              fontSize: 15, fontWeight: 600, letterSpacing: '-0.02em'
            }}>
              <span style={{ marginTop: 2 }}>9:41</span>
              <div style={{ display: 'flex', gap: 7, alignItems: 'center', opacity: 0.9 }}>
                <svg width="18" height="12" viewBox="0 0 18 12" fill="none"><path d="M1 11H3V8H1V11ZM5 11H7V5H5V11ZM9 11H11V2H9V11ZM13 11H15V0H13V11Z" fill="currentColor"/></svg>
                <svg width="16" height="12" viewBox="0 0 16 12" fill="none"><path d="M8 12C9.10457 12 10 11.1046 10 10C10 8.89543 9.10457 8 8 8C6.89543 8 6 8.89543 6 10C6 11.1046 6.89543 12 8 12Z" fill="currentColor"/><path d="M2.34315 5.65685C3.84277 4.15723 5.87673 3.31481 8 3.31481C10.1233 3.31481 12.1572 4.15723 13.6569 5.65685L16 3.31371C13.8752 1.18893 11.0028 0 8 0C4.99718 0 2.12479 1.18893 0 3.31371L2.34315 5.65685Z" fill="currentColor"/></svg>
                <svg width="25" height="12" viewBox="0 0 25 12" fill="none"><rect x="0.5" y="0.5" width="21" height="11" rx="3.5" fill="none" stroke="currentColor"/><rect x="2" y="2" width="18" height="8" rx="2" fill="currentColor"/><path d="M24 4V8" stroke="currentColor" strokeLinecap="round"/></svg>
              </div>
            </div>

            {/* Native Home Indicator */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, height: 34,
              display: 'flex', justifyContent: 'center', alignItems: 'center',
              pointerEvents: 'none', zIndex: 50,
            }}>
              <div style={{ width: 134, height: 5, backgroundColor: '#fff', borderRadius: 10, mixBlendMode: 'difference' }} />
            </div>

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
                        <div style={{ position: 'relative' }}>
                          {renderBlock(block, selectedBlock === block.id, (id) => {
                            setSelectedBlock(id)
                            setSettingsOpen(true)
                          }, invitation?.theme)}
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
              <button 
                className="btn btn-ghost btn-sm" 
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this block?')) {
                    deleteBlock(selected.id)
                  }
                }}
                style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.2)' }}
              >
                Delete
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => { setSettingsOpen(false); setSelectedBlock(null) }}>Discard</button>
              <button className="btn btn-primary btn-sm" onClick={() => setSettingsOpen(false)}>Apply</button>
            </div>
          </div>
        )}
      </div>


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

/* MediaUploader inline component */
function MediaUploader({ currentUrl, onUpload }) {
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
      alert(`Gagal mengunggah media: ${err.message}`)
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }

  return (
    <div className="image-uploader">
      {currentUrl && (
        <div className="image-uploader-preview">
          <MediaRenderer src={currentUrl} alt="Preview" />
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
          <><HiOutlineUpload size={14} /> {currentUrl ? 'Change Media' : 'Upload Video / Photo'}</>
        )}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
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
            <MediaUploader
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
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <div className="input-group" style={{ flex: 1 }}>
              <label>Vertical Align</label>
              <select className="settings-select" value={data.coverAlignItems || 'center'} onChange={e => onChange({ coverAlignItems: e.target.value })}>
                <option value="flex-start">Top</option>
                <option value="center">Center</option>
                <option value="flex-end">Bottom</option>
              </select>
            </div>
            <div className="input-group" style={{ flex: 1 }}>
              <label>Text Align</label>
              <select className="settings-select" value={data.coverTextAlign || 'center'} onChange={e => onChange({ coverTextAlign: e.target.value })}>
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </div>
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
          <span className="label-caps">Media (Video / Image)</span>
          <div style={{ marginTop: 8 }}>
            <MediaUploader
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
          <label className="label-caps" style={{ fontSize: 10 }}>Media Items</label>
          {(data.images || []).map((img, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ width: 40, height: 40, borderRadius: 4, overflow: 'hidden' }}>
                <MediaRenderer src={img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => {
                const newImgs = [...(data.images || [])];
                newImgs.splice(i, 1);
                onChange({ images: newImgs });
              }} style={{ padding: 4 }}>Remove</button>
            </div>
          ))}
          <MediaUploader currentUrl="" onUpload={(url) => {
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
            <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>Media</label>
            <MediaUploader currentUrl={data.photo1} onUpload={url => onChange({ photo1: url })} />
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
            <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>Media</label>
            <MediaUploader currentUrl={data.photo2} onUpload={url => onChange({ photo2: url })} />
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
        <div style={{ marginTop: 16, padding: 12, background: 'rgba(86,95,52,0.05)', borderRadius: 8, fontSize: 13, color: 'var(--text-muted)' }}>
          Wishes and messages will automatically populate here when guests submit their RSVP via the public invitation link.
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
              Show Invori Watermark
            </label>
          </div>
        </div>
        <div className="settings-section">
          <span className="label-caps">Photo Slideshow</span>
          <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(data.photos || []).map((photo, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ width: 40, height: 40, borderRadius: 4, overflow: 'hidden' }}>
                  <MediaRenderer src={photo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => {
                  const newPhotos = [...(data.photos || [])];
                  newPhotos.splice(i, 1);
                  onChange({ photos: newPhotos });
                }} style={{ padding: 4 }}>Remove</button>
              </div>
            ))}
            <MediaUploader currentUrl="" onUpload={(url) => {
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
  const spacingTop = data.spacingTop ?? 40
  const spacingBottom = data.spacingBottom ?? 40
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
    
    if (isMediaVideo(url)) {
      const video = document.createElement('video')
      video.onloadedmetadata = () => {
        const ratio = `${video.videoWidth}/${video.videoHeight}`
        onChange({ backgroundAspectRatio: ratio })
      }
      video.src = url
    } else {
      const img = new Image()
      img.onload = () => {
        const ratio = `${img.naturalWidth}/${img.naturalHeight}`
        onChange({ backgroundAspectRatio: ratio })
      }
      img.src = url
    }
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
        <MediaUploader
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
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-dark)' }}>
              <input type="checkbox" checked={data.fullWidth !== false} onChange={e => onChange({ fullWidth: e.target.checked })} />
              Full Width (Edge-to-Edge)
            </label>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '4px 0 0 20px', lineHeight: 1.4 }}>Removes padding/margins so this block spans the entire screen width.</p>
          </div>

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

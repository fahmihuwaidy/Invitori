import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useInvitations } from '../contexts/InvitationContext'
import { BLOCK_TYPES, BLOCK_CATEGORIES } from '../utils/blockDefaults'
import { PRESETS } from '../utils/presets'
import { uploadToCloudinary } from '../lib/cloudinary'
import { DndContext, closestCenter, PointerSensor, MouseSensor, TouchSensor, useSensor, useSensors, useDraggable, useDroppable, DragOverlay, defaultDropAnimationSideEffects } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { HiOutlineArrowLeft, HiOutlineMenuAlt2, HiX, HiOutlineEye, HiOutlineTrash, HiPlus,
  HiOutlineViewGrid, HiOutlineMail, HiOutlineUserGroup, HiOutlineGift, HiOutlineCog, HiOutlineUpload } from 'react-icons/hi'
import Logo from '../assets/Logo.png'
import './EditorPage.css'
import './PublicInvitationPage.css'
import { renderPublicBlock, isMediaVideo, MediaRenderer } from './PublicInvitationPage'

/* Draggable Palette Block wrapper */
function DraggablePaletteItem({ type, label, icon, onClick }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${type}`,
    data: {
      type: 'paletteItem',
      blockType: type,
    }
  })

  return (
    <button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`palette-block ${isDragging ? 'is-dragging' : ''}`}
      onClick={() => {
        // Prevent click action if it's currently dragging, else act as click-to-add
        if (!isDragging) {
           onClick()
        }
      }}
      style={{ opacity: isDragging ? 0.4 : 1, touchAction: 'none' }}
    >
      <span className="palette-icon">{icon}</span>
      <span className="palette-label">{label}</span>
    </button>
  )
}

/* Sortable block wrapper */
function SortableBlock({ id, children }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    position: 'relative',
    zIndex: isDragging ? 20 : 1,
  }
  return (
    <div ref={setNodeRef} id={id} style={style} className={`sortable-block ${isDragging ? 'is-dragging' : ''}`}>
      {/* Drag Handle — only this area triggers drag */}
      <div
        className="block-drag-handle"
        {...attributes}
        {...listeners}
        title="Drag to reorder"
        style={{
          position: 'absolute',
          top: 8,
          right: 36, // Keep it clear of common UI elements
          zIndex: 10,
          width: 32,
          height: 32,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: isDragging ? 'grabbing' : 'grab',
          opacity: 0,
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          borderRadius: 8,
          background: 'var(--white)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          fontSize: 16,
          color: 'var(--olive)',
          userSelect: 'none',
          touchAction: 'none',
          border: '1px solid var(--border-light)',
        }}
      >
        ⠿
      </div>
      {children}
    </div>
  )
}

function InsertBlockButton({ onClick, index, visible = false, isDropTarget = false }) {
  return (
    <div 
      className={`insert-block-container ${visible ? 'is-first' : ''} ${isDropTarget ? 'is-drop-target' : ''}`}
      style={{
        height: isDropTarget ? '40px' : 0,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 5,
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <button
        className="insert-block-btn"
        onClick={(e) => { e.stopPropagation(); onClick(index) }}
        title="Insert block here"
        style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: 'var(--olive)',
          color: 'white',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(86,95,52,0.3)',
          opacity: isDropTarget ? 1 : 0,
          transform: isDropTarget ? 'scale(1)' : 'scale(0.8)',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          pointerEvents: 'auto',
          position: 'absolute',
        }}
      >
        <HiPlus size={16} />
      </button>
      <div className="insert-block-line" style={{
        width: isDropTarget ? '80%' : '60%',
        height: isDropTarget ? 3 : 1,
        background: 'var(--olive)',
        opacity: isDropTarget ? 1 : 0,
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: isDropTarget ? '0 0 12px var(--olive)' : 'none',
      }} />
      {isDropTarget && (
        <span style={{ 
          position: 'absolute', 
          bottom: -20, 
          fontSize: 10, 
          fontWeight: 700, 
          color: 'var(--olive)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          Drop Here
        </span>
      )}
    </div>
  )
}

function CanvasDroppable({ id, children, style }) {
  const { setNodeRef, isOver } = useDroppable({ id })
  return (
    <div 
      ref={setNodeRef} 
      id={id} 
      style={{ 
        ...style, 
        backgroundColor: isOver ? 'rgba(86,95,52,0.05)' : style?.backgroundColor,
        transition: 'background-color 0.2s ease'
      }}
    >
      {children}
    </div>
  )
}

/* EditorCountdownBlock removed — countdown preview is handled by renderPublicBlock */

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
  const [data, setData] = useState({ 
    title: invitation.title, 
    slug: invitation.slug, 
    musicUrl: invitation.musicUrl || '',
    theme_fontFamily: invitation.theme?.fontFamily || 'Inter', 
    theme_primaryColor: invitation.theme?.primaryColor || '#565F34', 
    theme_backgroundColor: invitation.theme?.backgroundColor || '#EDE9E7' 
  })

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
        <div className="input-group" style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>URL Slug</label>
          <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden' }}>
            <span style={{ padding: '0 12px', fontSize: 13, color: 'var(--text-muted)', background: '#f8f8f8', borderRight: '1px solid var(--border)', display: 'flex', alignItems: 'center', height: 42 }}>/undangan/</span>
            <input className="settings-input" style={{ border: 'none', borderRadius: 0, flex: 1, padding: '10px 12px', outline: 'none' }} value={data.slug} onChange={e => setData({...data, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')})} />
          </div>
        </div>
        <div className="input-group" style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Background Music URL</label>
          <input className="settings-input" value={data.musicUrl} onChange={e => setData({...data, musicUrl: e.target.value})} placeholder="https://.../song.mp3" style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 6 }} />
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
            musicUrl: data.musicUrl,
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
  const { invitations, addInvitation, addBlock: ctxAddBlock, addBlocks: ctxAddBlocks, updateBlock: ctxUpdateBlock, deleteBlock: ctxDeleteBlock, reorderBlocks, updateInvitation } = useInvitations()
  const [selectedBlock, setSelectedBlock] = useState(null)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [activeModal, setActiveModal] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [insertIndex, setInsertIndex] = useState(null)
  const [activeDragItem, setActiveDragItem] = useState(null)
  const [overId, setOverId] = useState(null)
  const [phoneScale, setPhoneScale] = useState(1)
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
  }, [id, searchParams, addInvitation, navigate])

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
    // Add blocks in bulk to ensure correct ordering
    ctxAddBlocks(id, preset.blocks)
  }, [id, invitations, searchParams, ctxAddBlocks])

  // Find invitation
  const invitation = invitations.find(inv => inv.id === id)

  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: 5,
    },
  })
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 250,
      tolerance: 5,
    },
  })
  const sensors = useSensors(mouseSensor, touchSensor)

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

  const addBlock = (type, index = null) => {
    const targetIdx = index !== null ? index : blocks.length
    const defaults = BLOCK_TYPES[type]?.defaults || {}
    ctxAddBlock(invitation.id, type, { ...defaults }, targetIdx)
    
    setPaletteOpen(false)
    setInsertIndex(null)
    
    // Auto-scroll logic if added at end
    if (index === null) {
      setTimeout(() => {
        const pScreen = document.querySelector('.phone-screen')
        if (pScreen) pScreen.scrollTo({ top: pScreen.scrollHeight, behavior: 'smooth' })
      }, 150)
    }
  }

  const openPaletteAt = (index) => {
    setInsertIndex(index)
    setPaletteOpen(true)
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

  const handleDragStart = (event) => {
    setActiveDragItem(event.active)
    setOverId(event.active.id)
  }

  const handleDragOver = (event) => {
    setOverId(event.over?.id)
  }

  const handleDragEnd = (event) => {
    setActiveDragItem(null)
    setOverId(null)
    const { active, over } = event
    if (!over) {
      return
    }

    // Handle dragged item from Palette
    if (active.data.current?.type === 'paletteItem') {
      const blockType = active.data.current.blockType
      let dropIndex = blocks.length
      
      // Determine what block it was dropped over
      if (over.id && over.id !== 'canvas') {
        const overIndex = blocks.findIndex(b => b.id === over.id)
        if (overIndex !== -1) {
          dropIndex = overIndex
        }
      }
      
      addBlock(blockType, dropIndex)
      return
    }

    // Existing reorder logic
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
    <DndContext 
      sensors={sensors} 
      collisionDetection={closestCenter} 
      onDragStart={handleDragStart} 
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
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
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {insertIndex !== null ? `Inserting at position ${insertIndex + 1}` : 'Construct your masterpiece with these blocks.'}
            </p>
          </div>
          <button className="palette-close" onClick={() => { setPaletteOpen(false); setInsertIndex(null); }}><HiX size={18} /></button>
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
                    <DraggablePaletteItem 
                      key={key}
                      type={key}
                      label={val.label}
                      icon={val.icon}
                      onClick={() => addBlock(key, insertIndex)} 
                    />
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
          <div className="phone-frame" style={{ transform: `scale(${phoneScale})`, transformOrigin: 'top center', transition: 'transform 0.2s ease' }}>
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
              <CanvasDroppable id="canvas" style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
                {blocks.length === 0 ? (
                  <div className="phone-empty" style={{ flex: 1 }}>
                    <p>Your canvas is empty.</p>
                    <p style={{ fontSize: 12, color: 'var(--text-light)' }}>Drag and drop blocks here.</p>
                  </div>
                ) : (
                  <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
                    <div className="blocks-list" style={{ minHeight: '100%', paddingBottom: 100 }}>
                      <InsertBlockButton 
                        index={0} 
                        onClick={openPaletteAt} 
                        visible={blocks.length > 0} 
                        isDropTarget={activeDragItem && (overId === blocks[0]?.id || (blocks.length === 0 && overId === 'canvas'))}
                      />
                      {blocks.map((block, idx) => (
                        <div key={block.id}>
                          <SortableBlock id={block.id}>
                            <div style={{ position: 'relative' }}>
                              {renderBlock(block, selectedBlock === block.id, (id) => {
                                setSelectedBlock(id)
                                setSettingsOpen(true)
                              }, invitation?.theme)}
                            </div>
                          </SortableBlock>
                          <InsertBlockButton 
                            index={idx + 1} 
                            onClick={openPaletteAt} 
                            isDropTarget={activeDragItem && (
                              overId === blocks[idx + 1]?.id || 
                              (idx === blocks.length - 1 && overId === 'canvas')
                            )}
                          />
                        </div>
                      ))}
                    </div>
                  </SortableContext>
                )}
              </CanvasDroppable>
            </div>
          </div>
          <div className="canvas-zoom">
            <button onClick={() => setPhoneScale(s => Math.min(s + 0.1, 1.3))} title="Zoom In">+</button>
            <button onClick={() => setPhoneScale(s => Math.max(s - 0.1, 0.5))} title="Zoom Out">−</button>
            {phoneScale !== 1 && <button onClick={() => setPhoneScale(1)} title="Reset Zoom" style={{ fontSize: 12 }}>↺</button>}
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

      {/* Drag Overlay positioned contextually at the end of DndContext */}
      <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.4' } } }) }}>
        {activeDragItem?.data.current?.type === 'paletteItem' ? (
          <div className="palette-block" style={{ width: 100, background: 'var(--white)', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', transform: 'scale(1.05)' }}>
            <span className="palette-icon">{BLOCK_TYPES[activeDragItem.data.current.blockType].icon}</span>
            <span className="palette-label">{BLOCK_TYPES[activeDragItem.data.current.blockType].label}</span>
          </div>
        ) : null}
      </DragOverlay>

      </div>
    </DndContext>
  )
}

/* MediaUploader inline component */
function MediaUploader({ currentUrl, onUpload, multiple = false }) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [batchInfo, setBatchInfo] = useState({ current: 0, total: 0 })
  const fileInputRef = useRef(null)

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    setUploading(true)
    setProgress(0)
    
    if (multiple) {
      setBatchInfo({ current: 0, total: files.length })
      const uploadedUrls = []
      
      for (let i = 0; i < files.length; i++) {
        setBatchInfo(prev => ({ ...prev, current: i + 1 }))
        setProgress(0)
        try {
          const result = await uploadToCloudinary(files[i], (p) => setProgress(p))
          uploadedUrls.push(result.url)
        } catch (err) {
          console.error(`Upload error for file ${i + 1}:`, err)
          // Continue with others even if one fails
        }
      }
      
      if (uploadedUrls.length > 0) {
        onUpload(uploadedUrls)
      }
    } else {
      try {
        const result = await uploadToCloudinary(files[0], (p) => setProgress(p))
        onUpload(result.url)
      } catch (err) {
        console.error('Upload error:', err)
        alert(`Failed to upload media: ${err.message}`)
      }
    }

    setUploading(false)
    setProgress(0)
    setBatchInfo({ current: 0, total: 0 })
  }

  return (
    <div className="image-uploader">
      {!multiple && currentUrl && (
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
          <span>
            {multiple ? `Uploading ${batchInfo.current}/${batchInfo.total}...` : 'Uploading...'} {progress}%
          </span>
        ) : (
          <><HiOutlineUpload size={14} /> {multiple ? 'Add Multiple Media' : (currentUrl ? 'Change Media' : 'Upload Video / Photo')}</>
        )}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        multiple={multiple}
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
    </div>
  )
}

function BlockSettingsPanel({ block, onChange }) {
  const type = block.type
  const data = block.data

  // ── COVER ────────────────────────────────────────────────────────────
  if (type === 'cover') {
    return (
      <>
        <div className="settings-section">
          <span className="label-caps">Layout</span>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            {[['classic','Classic'],['minimal','Minimal']].map(([val, lbl]) => (
              <button key={val} type="button" onClick={() => onChange({ coverLayout: val })}
                style={{ flex: 1, padding: '8px', borderRadius: 8, border: `2px solid ${(data.coverLayout || 'classic') === val ? 'var(--olive)' : 'var(--border)'}`, background: (data.coverLayout || 'classic') === val ? 'rgba(86,95,52,0.08)' : 'var(--white)', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: (data.coverLayout || 'classic') === val ? 'var(--olive)' : 'var(--text-muted)' }}>{lbl}</button>
            ))}
          </div>
        </div>
        <div className="settings-section">
          <span className="label-caps">Cover Background</span>
          <div style={{ marginTop: 8 }}>
            <MediaUploader currentUrl={data.backgroundImage} onUpload={(url) => onChange({ backgroundImage: url })} />
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
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--olive)' }}>{Math.round((data.overlayOpacity ?? 0.4) * 100)}%</span>
                </div>
                <input type="range" min={0} max={1} step={0.05} value={data.overlayOpacity ?? 0.4} onChange={e => onChange({ overlayOpacity: Number(e.target.value) })} style={{ width: '100%', accentColor: 'var(--olive)' }} />
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
            <input className="settings-input" value={data.date || ''} onChange={e => onChange({ date: e.target.value })} placeholder="Monday, March 30, 2026" />
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
        <AnimationSection data={data} onChange={onChange} />
        <SpacingSection data={data} onChange={onChange} />
      </>
    )
  }

  // ── HEADING ───────────────────────────────────────────────────────────
  if (type === 'heading') {
    const STYLE_PRESETS = [
      { label: 'Elegant Serif', fontFamily: 'Gambarino', fontSize: 36, fontStyle: 'italic', fontWeight: 'normal', letterSpacing: 0.02, color: '#2D2D2D' },
      { label: 'Modern Bold', fontFamily: 'Inter', fontSize: 28, fontStyle: 'normal', fontWeight: 'bold', letterSpacing: -0.02, color: '#2D2D2D' },
      { label: 'Display Italic', fontFamily: 'Gambarino', fontSize: 42, fontStyle: 'italic', fontWeight: 'normal', letterSpacing: 0, color: '#565F34' },
      { label: 'Small Caps', fontFamily: 'Inter', fontSize: 14, fontStyle: 'normal', fontWeight: 'bold', letterSpacing: 0.2, color: '#8A8A8A' },
    ]
    return (
      <>
        <div className="settings-section">
          <span className="label-caps">Style Presets</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
            {STYLE_PRESETS.map((p, i) => (
              <button key={i} type="button" onClick={() => onChange(p)}
                style={{ padding: '6px 10px', borderRadius: 8, border: '1.5px solid var(--border)', background: 'var(--white)', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{p.label}</button>
            ))}
          </div>
        </div>
        <div className="settings-section">
          <span className="label-caps">Typography</span>
          <div className="input-group" style={{ marginTop: 8 }}>
            <label>Font Family</label>
            <select className="settings-select" value={data.fontFamily || 'Gambarino'} onChange={e => onChange({ fontFamily: e.target.value })}>
              <option value="Gambarino">Gambarino (Serif)</option>
              <option value="Inter">Inter (Sans Serif)</option>
              <option value="Georgia">Georgia</option>
              <option value="Cormorant Garamond">Cormorant Garamond</option>
              <option value="Playfair Display">Playfair Display</option>
              <option value="DM Serif Display">DM Serif Display</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <div className="input-group" style={{ flex: 1 }}>
              <label>Size (px)</label>
              <input type="number" className="settings-input" value={data.fontSize || 32} onChange={e => onChange({ fontSize: Number(e.target.value) })} />
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
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <div className="input-group" style={{ flex: 1 }}>
              <label>Style</label>
              <select className="settings-select" value={data.fontStyle || 'normal'} onChange={e => onChange({ fontStyle: e.target.value })}>
                <option value="normal">Normal</option>
                <option value="italic">Italic</option>
              </select>
            </div>
            <div className="input-group" style={{ flex: 1 }}>
              <label>Weight</label>
              <select className="settings-select" value={data.fontWeight || 'normal'} onChange={e => onChange({ fontWeight: e.target.value })}>
                <option value="300">Light</option>
                <option value="normal">Regular</option>
                <option value="600">SemiBold</option>
                <option value="bold">Bold</option>
              </select>
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>Letter Spacing</label>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--olive)' }}>{data.letterSpacing || 0}em</span>
            </div>
            <input type="range" min={-0.05} max={0.3} step={0.01} value={data.letterSpacing || 0} onChange={e => onChange({ letterSpacing: Number(e.target.value) })} style={{ width: '100%', accentColor: 'var(--olive)' }} />
          </div>
          <div style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>Line Height</label>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--olive)' }}>{data.lineHeight || 1.2}</span>
            </div>
            <input type="range" min={0.9} max={2.5} step={0.05} value={data.lineHeight || 1.2} onChange={e => onChange({ lineHeight: Number(e.target.value) })} style={{ width: '100%', accentColor: 'var(--olive)' }} />
          </div>
          <div style={{ marginTop: 10 }}>
            <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
              <input type="checkbox" checked={data.textShadow || false} onChange={e => onChange({ textShadow: e.target.checked })} />
              Text Shadow
            </label>
          </div>
        </div>
        <div className="settings-section">
          <span className="label-caps">Color</span>
          <div className="color-swatches" style={{ marginTop: 8 }}>
            {['#565F34', '#BE1A32', '#EDE9E7', '#A7BF66', '#8A8A8A', '#2D2D2D', '#C4A882'].map(c => (
              <button key={c} className={`swatch ${data.color === c ? 'active' : ''}`} style={{ background: c }} onClick={() => onChange({ color: c })} />
            ))}
            <input type="color" value={data.color || '#2D2D2D'} onChange={e => onChange({ color: e.target.value })} className="swatch-picker" />
          </div>
        </div>
        <div className="settings-section">
          <span className="label-caps">Content</span>
          <textarea className="settings-textarea" value={data.content || ''} onChange={e => onChange({ content: e.target.value })} rows={3} />
        </div>
        <AnimationSection data={data} onChange={onChange} />
        <SpacingSection data={data} onChange={onChange} />
        <SizeSection data={data} onChange={onChange} />
        <BackgroundImageSection data={data} onChange={onChange} />
        <AdvancedDesignSection data={data} onChange={onChange} />
      </>
    )
  }

  // ── PARAGRAPH ─────────────────────────────────────────────────────────
  if (type === 'paragraph') {
    return (
      <>
        <div className="settings-section">
          <span className="label-caps">Typography</span>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <div className="input-group" style={{ flex: 1 }}>
              <label>Size</label>
              <input type="number" className="settings-input" value={data.fontSize || 15} onChange={e => onChange({ fontSize: Number(e.target.value) })} />
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
          <div style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>Line Height</label>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--olive)' }}>{data.lineHeight || 1.7}</span>
            </div>
            <input type="range" min={1.2} max={2.4} step={0.05} value={data.lineHeight || 1.7} onChange={e => onChange({ lineHeight: Number(e.target.value) })} style={{ width: '100%', accentColor: 'var(--olive)' }} />
          </div>
          <div style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>Letter Spacing</label>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--olive)' }}>{data.letterSpacing || 0}em</span>
            </div>
            <input type="range" min={-0.05} max={0.2} step={0.01} value={data.letterSpacing || 0} onChange={e => onChange({ letterSpacing: Number(e.target.value) })} style={{ width: '100%', accentColor: 'var(--olive)' }} />
          </div>
          <div className="input-group" style={{ marginTop: 12 }}>
            <label>Max Width (px)</label>
            <select className="settings-select" value={data.maxWidth || 600} onChange={e => onChange({ maxWidth: Number(e.target.value) })}>
              <option value={400}>Narrow (400px)</option>
              <option value={600}>Medium (600px)</option>
              <option value={800}>Wide (800px)</option>
            </select>
          </div>
        </div>
        <div className="settings-section">
          <span className="label-caps">Color</span>
          <div className="color-swatches" style={{ marginTop: 8 }}>
            {['#565F34', '#BE1A32', '#EDE9E7', '#A7BF66', '#8A8A8A', '#2D2D2D'].map(c => (
              <button key={c} className={`swatch ${data.color === c ? 'active' : ''}`} style={{ background: c }} onClick={() => onChange({ color: c })} />
            ))}
            <input type="color" value={data.color || '#8A8A8A'} onChange={e => onChange({ color: e.target.value })} className="swatch-picker" />
          </div>
        </div>
        <div className="settings-section">
          <span className="label-caps">Content</span>
          <textarea className="settings-textarea" value={data.content || ''} onChange={e => onChange({ content: e.target.value })} rows={5} placeholder="Use Enter for new lines" />
        </div>
        <AnimationSection data={data} onChange={onChange} />
        <SpacingSection data={data} onChange={onChange} />
        <SizeSection data={data} onChange={onChange} />
        <BackgroundImageSection data={data} onChange={onChange} />
        <AdvancedDesignSection data={data} onChange={onChange} />
      </>
    )
  }

  // ── QUOTE ─────────────────────────────────────────────────────────────
  if (type === 'quote') {
    return (
      <>
        <div className="settings-section">
          <span className="label-caps">Quote Style</span>
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            {[['minimal','Minimal'],['bordered','Bordered'],['framed','Framed']].map(([val, lbl]) => (
              <button key={val} type="button" onClick={() => onChange({ style: val })}
                style={{ flex: 1, padding: '8px 4px', borderRadius: 8, border: `2px solid ${(data.style || 'framed') === val ? 'var(--olive)' : 'var(--border)'}`, background: (data.style || 'framed') === val ? 'rgba(86,95,52,0.08)' : 'var(--white)', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: (data.style || 'framed') === val ? 'var(--olive)' : 'var(--text-muted)' }}>{lbl}</button>
            ))}
          </div>
        </div>
        <div className="settings-section">
          <span className="label-caps">Content</span>
          <div className="input-group" style={{ marginTop: 8 }}>
            <label>Quote Text</label>
            <textarea className="settings-textarea" value={data.text || ''} onChange={e => onChange({ text: e.target.value })} rows={4} placeholder="Your quote or verse..." />
          </div>
          <div className="input-group" style={{ marginTop: 8 }}>
            <label>Source / Attribution</label>
            <input className="settings-input" value={data.source || ''} onChange={e => onChange({ source: e.target.value })} placeholder="— QS. Ar-Rum: 21" />
          </div>
        </div>
        <div className="settings-section">
          <span className="label-caps">Accent Color</span>
          <div className="color-swatches" style={{ marginTop: 8 }}>
            {['#565F34', '#C4A882', '#BE1A32', '#8A8A8A', '#2D2D2D'].map(c => (
              <button key={c} className={`swatch ${data.color === c ? 'active' : ''}`} style={{ background: c }} onClick={() => onChange({ color: c })} />
            ))}
            <input type="color" value={data.color || '#565F34'} onChange={e => onChange({ color: e.target.value })} className="swatch-picker" />
          </div>
        </div>
        <AnimationSection data={data} onChange={onChange} />
        <SpacingSection data={data} onChange={onChange} />
        <BackgroundImageSection data={data} onChange={onChange} />
        <AdvancedDesignSection data={data} onChange={onChange} />
      </>
    )
  }

  // ── PHOTO ─────────────────────────────────────────────────────────────
  if (type === 'photo') {
    return (
      <>
        <div className="settings-section">
          <span className="label-caps">Media</span>
          <div style={{ marginTop: 8 }}>
            <MediaUploader currentUrl={data.url} onUpload={(url) => onChange({ url })} />
          </div>
          <div className="input-group" style={{ marginTop: 12 }}>
            <label>Or paste URL</label>
            <input className="settings-input" value={data.url || ''} onChange={e => onChange({ url: e.target.value })} placeholder="https://..." />
          </div>
          <div className="input-group" style={{ marginTop: 8 }}>
            <label>Caption</label>
            <input className="settings-input" value={data.caption || ''} onChange={e => onChange({ caption: e.target.value })} />
          </div>
        </div>
        <div className="settings-section">
          <span className="label-caps">Appearance</span>
          <div className="input-group" style={{ marginTop: 8 }}>
            <label>Aspect Ratio</label>
            <select className="settings-select" value={data.aspectRatio || 'auto'} onChange={e => onChange({ aspectRatio: e.target.value })}>
              <option value="auto">Auto</option>
              <option value="1/1">Square (1:1)</option>
              <option value="4/3">Landscape (4:3)</option>
              <option value="16/9">Widescreen (16:9)</option>
              <option value="3/4">Portrait (3:4)</option>
            </select>
          </div>
          <div className="input-group" style={{ marginTop: 8 }}>
            <label>Border Style</label>
            <select className="settings-select" value={data.borderStyle || 'none'} onChange={e => onChange({ borderStyle: e.target.value })}>
              <option value="none">None</option>
              <option value="shadow">Drop Shadow</option>
              <option value="solid">Solid Border</option>
            </select>
          </div>
          {data.borderStyle === 'shadow' && (
            <div style={{ marginTop: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>Shadow Intensity</label>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--olive)' }}>{data.shadowIntensity || 0}</span>
              </div>
              <input type="range" min={0} max={5} step={1} value={data.shadowIntensity || 0} onChange={e => onChange({ shadowIntensity: Number(e.target.value) })} style={{ width: '100%', accentColor: 'var(--olive)' }} />
            </div>
          )}
        </div>
        <AnimationSection data={data} onChange={onChange} />
        <SpacingSection data={data} onChange={onChange} />
        <BackgroundImageSection data={data} onChange={onChange} />
        <AdvancedDesignSection data={data} onChange={onChange} />
      </>
    )
  }

  // ── PHOTO FRAME ───────────────────────────────────────────────────────
  if (type === 'photoFrame') {
    return (
      <>
        <div className="settings-section">
          <span className="label-caps">Frame Style</span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
            {[['polaroid','🖼 Polaroid'],['natural','✨ Natural'],['film','🎞 Film'],['oval','🔵 Oval']].map(([val, lbl]) => (
              <button key={val} type="button" onClick={() => onChange({ frameStyle: val })}
                style={{ padding: '10px 8px', borderRadius: 8, border: `2px solid ${(data.frameStyle || 'polaroid') === val ? 'var(--olive)' : 'var(--border)'}`, background: (data.frameStyle || 'polaroid') === val ? 'rgba(86,95,52,0.08)' : 'var(--white)', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: (data.frameStyle || 'polaroid') === val ? 'var(--olive)' : 'var(--text-muted)' }}>{lbl}</button>
            ))}
          </div>
        </div>
        <div className="settings-section">
          <span className="label-caps">Photo</span>
          <div style={{ marginTop: 8 }}>
            <MediaUploader currentUrl={data.url} onUpload={(url) => onChange({ url })} />
          </div>
          <div className="input-group" style={{ marginTop: 12 }}>
            <label>Or paste URL</label>
            <input className="settings-input" value={data.url || ''} onChange={e => onChange({ url: e.target.value })} placeholder="https://..." />
          </div>
          <div className="input-group" style={{ marginTop: 8 }}>
            <label>Caption</label>
            <input className="settings-input" value={data.caption || ''} onChange={e => onChange({ caption: e.target.value })} />
          </div>
          {data.caption && (
            <div className="input-group" style={{ marginTop: 8 }}>
              <label>Caption Position</label>
              <select className="settings-select" value={data.captionPosition || 'outside'} onChange={e => onChange({ captionPosition: e.target.value })}>
                <option value="outside">Below Photo</option>
                <option value="overlay">Overlay on Photo</option>
              </select>
            </div>
          )}
        </div>
        <AnimationSection data={data} onChange={onChange} />
        <SpacingSection data={data} onChange={onChange} />
        <AdvancedDesignSection data={data} onChange={onChange} />
      </>
    )
  }

  // ── VIDEO ─────────────────────────────────────────────────────────────
  if (type === 'video') {
    return (
      <div className="settings-section">
        <span className="label-caps">Video Content</span>
        <div style={{ marginTop: 8 }}>
          <MediaUploader currentUrl={data.url} onUpload={(url) => onChange({ url })} />
        </div>
        <div className="input-group" style={{ marginTop: 12 }}>
          <label>Or Video URL (MP4, YouTube, Vimeo)</label>
          <input className="settings-input" value={data.url || ''} onChange={e => onChange({ url: e.target.value })} placeholder="https://.../video.mp4 or youtube.com/watch..." />
        </div>
        <div className="input-group" style={{ marginTop: 8 }}>
          <label>Thumbnail Override (poster image URL)</label>
          <input className="settings-input" value={data.thumbnailUrl || ''} onChange={e => onChange({ thumbnailUrl: e.target.value })} placeholder="https://..." />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
          <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="checkbox" checked={data.autoplay || false} onChange={e => onChange({ autoplay: e.target.checked })} />
            Autoplay (muted)
          </label>
          <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="checkbox" checked={data.loop || false} onChange={e => onChange({ loop: e.target.checked })} />
            Loop
          </label>
          <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="checkbox" checked={data.showControls !== false} onChange={e => onChange({ showControls: e.target.checked })} />
            Show Controls
          </label>
        </div>
        <AnimationSection data={data} onChange={onChange} />
        <SpacingSection data={data} onChange={onChange} />
        <AdvancedDesignSection data={data} onChange={onChange} />
      </div>
    )
  }

  // ── GALLERY ───────────────────────────────────────────────────────────
  if (type === 'gallery') {
    return (
      <div className="settings-section">
        <span className="label-caps">Gallery Layout</span>
        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          {[['masonry','Masonry'],['grid','Grid'],['slideshow','Slideshow']].map(([val, lbl]) => (
            <button key={val} type="button" onClick={() => onChange({ layoutMode: val })}
              style={{ flex: 1, padding: '8px 4px', borderRadius: 8, border: `2px solid ${(data.layoutMode || 'masonry') === val ? 'var(--olive)' : 'var(--border)'}`, background: (data.layoutMode || 'masonry') === val ? 'rgba(86,95,52,0.08)' : 'var(--white)', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: (data.layoutMode || 'masonry') === val ? 'var(--olive)' : 'var(--text-muted)' }}>{lbl}</button>
          ))}
        </div>
        <div className="input-group" style={{ marginTop: 12 }}>
          <label>Columns</label>
          <select className="settings-select" value={data.columns || 2} onChange={e => onChange({ columns: Number(e.target.value) })}>
            <option value={2}>2 Columns</option>
            <option value={3}>3 Columns</option>
          </select>
        </div>
        <div style={{ marginTop: 12 }}>
          <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="checkbox" checked={data.enableLightbox !== false} onChange={e => onChange({ enableLightbox: e.target.checked })} />
            Enable Lightbox (tap to expand)
          </label>
        </div>

        <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '16px 0 8px' }}>
          Upload multiple photos. Arrange them by order.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 12 }}>
          {(data.images || []).map((img, i) => (
            <div key={i} style={{ position: 'relative', aspectRatio: '1/1', borderRadius: 6, overflow: 'hidden', border: '1px solid var(--border)' }}>
              <MediaRenderer src={img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <button type="button" onClick={() => {
                const newImgs = [...(data.images || [])]; newImgs.splice(i, 1); onChange({ images: newImgs });
              }} style={{ position: 'absolute', top: 2, right: 2, width: 18, height: 18, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 10 }}>
                ×
              </button>
            </div>
          ))}
        </div>
        <MediaUploader multiple={true} currentUrl="" onUpload={(newUrls) => onChange({ images: [...(data.images || []), ...newUrls] })} />
        <AnimationSection data={data} onChange={onChange} />
        <SpacingSection data={data} onChange={onChange} />
        <AdvancedDesignSection data={data} onChange={onChange} />
      </div>
    )
  }

  // ── LOCATION ──────────────────────────────────────────────────────────
  if (type === 'location') {
    // Support old single-event format by migrating to events array
    const events = data.events || (data.venue ? [{ name: 'Event', date: data.date, time: data.time, venue: data.venue, address: data.address, mapUrl: data.mapUrl, mapEmbed: '' }] : [{ name: 'Akad Nikah', date: '', time: '', venue: '', address: '', mapUrl: '', mapEmbed: '' }])

    return (
      <>
        <div className="settings-section">
          <span className="label-caps">Map Display</span>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            {[['button','Link Button'],['iframe','Embed Map']].map(([val, lbl]) => (
              <button key={val} type="button" onClick={() => onChange({ mapDisplay: val })}
                style={{ flex: 1, padding: '8px', borderRadius: 8, border: `2px solid ${(data.mapDisplay || 'button') === val ? 'var(--olive)' : 'var(--border)'}`, background: (data.mapDisplay || 'button') === val ? 'rgba(86,95,52,0.08)' : 'var(--white)', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: (data.mapDisplay || 'button') === val ? 'var(--olive)' : 'var(--text-muted)' }}>{lbl}</button>
            ))}
          </div>
        </div>
        <div className="settings-section">
          <span className="label-caps">Events</span>
          {events.map((event, i) => (
            <div key={i} style={{ border: '1px solid var(--border)', padding: 12, borderRadius: 8, marginTop: 10 }}>
              <div className="input-group">
                <label>Event Name</label>
                <input className="settings-input" value={event.name || ''} placeholder="Akad Nikah / Resepsi" onChange={e => {
                  const newEvts = [...events]; newEvts[i] = { ...event, name: e.target.value }; onChange({ events: newEvts });
                }} />
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <div className="input-group" style={{ flex: 1 }}>
                  <label>Date</label>
                  <input className="settings-input" value={event.date || ''} onChange={e => {
                    const newEvts = [...events]; newEvts[i] = { ...event, date: e.target.value }; onChange({ events: newEvts });
                  }} />
                </div>
                <div className="input-group" style={{ flex: 1 }}>
                  <label>Time</label>
                  <input className="settings-input" value={event.time || ''} onChange={e => {
                    const newEvts = [...events]; newEvts[i] = { ...event, time: e.target.value }; onChange({ events: newEvts });
                  }} />
                </div>
              </div>
              <div className="input-group" style={{ marginTop: 8 }}>
                <label>Venue</label>
                <input className="settings-input" value={event.venue || ''} onChange={e => {
                  const newEvts = [...events]; newEvts[i] = { ...event, venue: e.target.value }; onChange({ events: newEvts });
                }} />
              </div>
              <div className="input-group" style={{ marginTop: 8 }}>
                <label>Address</label>
                <input className="settings-input" value={event.address || ''} onChange={e => {
                  const newEvts = [...events]; newEvts[i] = { ...event, address: e.target.value }; onChange({ events: newEvts });
                }} />
              </div>
              <div className="input-group" style={{ marginTop: 8 }}>
                <label>Google Maps Link</label>
                <input className="settings-input" value={event.mapUrl || ''} placeholder="https://maps.app.goo.gl/..." onChange={e => {
                  const newEvts = [...events]; newEvts[i] = { ...event, mapUrl: e.target.value }; onChange({ events: newEvts });
                }} />
              </div>
              {events.length > 1 && (
                <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop: 8, color: 'var(--error)' }} onClick={() => {
                  const newEvts = [...events]; newEvts.splice(i, 1); onChange({ events: newEvts });
                }}>Remove Event</button>
              )}
            </div>
          ))}
          <button type="button" className="btn btn-outline btn-sm" style={{ width: '100%', marginTop: 12 }} onClick={() => {
            onChange({ events: [...events, { name: '', date: '', time: '', venue: '', address: '', mapUrl: '' }] })
          }}>+ Add Event</button>
        </div>
        <AnimationSection data={data} onChange={onChange} />
        <SpacingSection data={data} onChange={onChange} />
        <BackgroundImageSection data={data} onChange={onChange} />
        <AdvancedDesignSection data={data} onChange={onChange} />
      </>
    )
  }

  // ── COUNTDOWN ─────────────────────────────────────────────────────────
  if (type === 'countdown') {
    return (
      <>
        <div className="settings-section">
          <span className="label-caps">Style</span>
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            {[['minimal','Minimal'],['boxed','Boxed'],['outlined','Outlined']].map(([val, lbl]) => (
              <button key={val} type="button" onClick={() => onChange({ style: val })}
                style={{ flex: 1, padding: '8px 4px', borderRadius: 8, border: `2px solid ${(data.style || 'boxed') === val ? 'var(--olive)' : 'var(--border)'}`, background: (data.style || 'boxed') === val ? 'rgba(86,95,52,0.08)' : 'var(--white)', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: (data.style || 'boxed') === val ? 'var(--olive)' : 'var(--text-muted)' }}>{lbl}</button>
            ))}
          </div>
        </div>
        <div className="settings-section">
          <span className="label-caps">Countdown</span>
          <div className="input-group" style={{ marginTop: 8 }}>
            <label>Target Date & Time</label>
            <input type="datetime-local" className="settings-input" value={data.targetDate?.slice(0, 16) || ''} onChange={e => onChange({ targetDate: e.target.value })} />
          </div>
          <div className="input-group" style={{ marginTop: 8 }}>
            <label>Label</label>
            <input className="settings-input" value={data.label || ''} onChange={e => onChange({ label: e.target.value })} placeholder="Days until the big day" />
          </div>
          <div className="input-group" style={{ marginTop: 8 }}>
            <label>Expired Message</label>
            <input className="settings-input" value={data.expiredMessage || ''} onChange={e => onChange({ expiredMessage: e.target.value })} placeholder="🎉 The day has come!" />
          </div>
          <div style={{ marginTop: 10 }}>
            <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
              <input type="checkbox" checked={data.showSeconds !== false} onChange={e => onChange({ showSeconds: e.target.checked })} />
              Show Seconds
            </label>
          </div>
        </div>
        <AnimationSection data={data} onChange={onChange} />
        <SpacingSection data={data} onChange={onChange} />
        <BackgroundImageSection data={data} onChange={onChange} />
        <AdvancedDesignSection data={data} onChange={onChange} />
      </>
    )
  }

  // ── SCHEDULE ──────────────────────────────────────────────────────────
  if (type === 'schedule') {
    const items = data.items || []
    return (
      <>
        <div className="settings-section">
          <span className="label-caps">Layout</span>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            {[['timeline','Timeline'],['cards','Cards']].map(([val, lbl]) => (
              <button key={val} type="button" onClick={() => onChange({ layoutMode: val })}
                style={{ flex: 1, padding: '8px', borderRadius: 8, border: `2px solid ${(data.layoutMode || 'timeline') === val ? 'var(--olive)' : 'var(--border)'}`, background: (data.layoutMode || 'timeline') === val ? 'rgba(86,95,52,0.08)' : 'var(--white)', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: (data.layoutMode || 'timeline') === val ? 'var(--olive)' : 'var(--text-muted)' }}>{lbl}</button>
            ))}
          </div>
        </div>
        <div className="settings-section">
          <span className="label-caps">Schedule Title</span>
          <input className="settings-input" style={{ marginTop: 8 }} value={data.title || ''} onChange={e => onChange({ title: e.target.value })} placeholder="Wedding Agenda" />
        </div>
        <div className="settings-section">
          <span className="label-caps">Events</span>
          {items.map((item, i) => (
            <div key={i} style={{ border: '1px solid var(--border)', padding: 12, borderRadius: 8, marginTop: 10 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <div className="input-group" style={{ flex: 0, minWidth: 80 }}>
                  <label>Time</label>
                  <input className="settings-input" value={item.time || ''} placeholder="08:00" onChange={e => {
                    const ni = [...items]; ni[i] = { ...item, time: e.target.value }; onChange({ items: ni });
                  }} />
                </div>
                <div className="input-group" style={{ flex: 0, minWidth: 40 }}>
                  <label>Icon</label>
                  <input className="settings-input" value={item.icon || ''} placeholder="💍" onChange={e => {
                    const ni = [...items]; ni[i] = { ...item, icon: e.target.value }; onChange({ items: ni });
                  }} />
                </div>
              </div>
              <div className="input-group" style={{ marginTop: 8 }}>
                <label>Title</label>
                <input className="settings-input" value={item.title || ''} placeholder="Akad Nikah" onChange={e => {
                  const ni = [...items]; ni[i] = { ...item, title: e.target.value }; onChange({ items: ni });
                }} />
              </div>
              <div className="input-group" style={{ marginTop: 8 }}>
                <label>Description</label>
                <input className="settings-input" value={item.description || ''} onChange={e => {
                  const ni = [...items]; ni[i] = { ...item, description: e.target.value }; onChange({ items: ni });
                }} />
              </div>
              <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop: 8, color: 'var(--error)' }} onClick={() => {
                const ni = [...items]; ni.splice(i, 1); onChange({ items: ni });
              }}>Remove</button>
            </div>
          ))}
          <button type="button" className="btn btn-outline btn-sm" style={{ width: '100%', marginTop: 12 }} onClick={() => onChange({ items: [...items, { time: '', title: '', description: '', icon: '' }] })}>+ Add Event</button>
        </div>
        <AnimationSection data={data} onChange={onChange} />
        <SpacingSection data={data} onChange={onChange} />
        <BackgroundImageSection data={data} onChange={onChange} />
        <AdvancedDesignSection data={data} onChange={onChange} />
      </>
    )
  }

  // ── RSVP ──────────────────────────────────────────────────────────────
  if (type === 'rsvp') {
    return (
      <div className="settings-section">
        <span className="label-caps">RSVP Form</span>
        <div className="input-group" style={{ marginTop: 8 }}>
          <label>Title</label>
          <input className="settings-input" value={data.title || ''} onChange={e => onChange({ title: e.target.value })} />
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <div className="input-group" style={{ flex: 1 }}>
            <label>Attending Button</label>
            <input className="settings-input" value={data.attendingLabel || ''} placeholder="Attending ✓" onChange={e => onChange({ attendingLabel: e.target.value })} />
          </div>
          <div className="input-group" style={{ flex: 1 }}>
            <label>Decline Button</label>
            <input className="settings-input" value={data.declineLabel || ''} placeholder="Decline" onChange={e => onChange({ declineLabel: e.target.value })} />
          </div>
        </div>
        <div className="input-group" style={{ marginTop: 8 }}>
          <label>Confirmation Message</label>
          <input className="settings-input" value={data.confirmationMessage || ''} placeholder="Thank you! We look forward..." onChange={e => onChange({ confirmationMessage: e.target.value })} />
        </div>
        <div style={{ marginTop: 10 }}>
          <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="checkbox" checked={data.showGuestCount !== false} onChange={e => onChange({ showGuestCount: e.target.checked })} />
            Show Number of Guests field
          </label>
        </div>
        <AnimationSection data={data} onChange={onChange} />
        <SpacingSection data={data} onChange={onChange} />
        <BackgroundImageSection data={data} onChange={onChange} />
        <AdvancedDesignSection data={data} onChange={onChange} />
      </div>
    )
  }

  // ── COUPLE ────────────────────────────────────────────────────────────
  if (type === 'couple') {
    return (
      <div className="settings-section">
        <span className="label-caps">Layout & Style</span>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          {[['staggered','Staggered'],['side-by-side','Side by Side'],['stacked','Stacked']].map(([val, lbl]) => (
            <button key={val} type="button" onClick={() => onChange({ layout: val })}
              style={{ flex: 1, padding: '7px 4px', borderRadius: 8, border: `2px solid ${(data.layout || 'staggered') === val ? 'var(--olive)' : 'var(--border)'}`, background: (data.layout || 'staggered') === val ? 'rgba(86,95,52,0.08)' : 'var(--white)', cursor: 'pointer', fontSize: 10, fontWeight: 600, color: (data.layout || 'staggered') === val ? 'var(--olive)' : 'var(--text-muted)' }}>{lbl}</button>
          ))}
        </div>
        <div className="input-group" style={{ marginTop: 10 }}>
          <label>Photo Shape</label>
          <select className="settings-select" value={data.photoShape || 'portrait'} onChange={e => onChange({ photoShape: e.target.value })}>
            <option value="portrait">Arch Portrait</option>
            <option value="circle">Circle</option>
            <option value="rounded">Rounded Square</option>
          </select>
        </div>
        <div style={{ marginTop: 10 }}>
          <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="checkbox" checked={data.showAmpersand !== false} onChange={e => onChange({ showAmpersand: e.target.checked })} />
            Show "&" connector
          </label>
        </div>

        <div style={{ padding: 12, border: '1px solid var(--border)', borderRadius: 8, marginTop: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Person 1</label>
          <div className="input-group" style={{ marginTop: 8 }}><label>Name</label><input className="settings-input" value={data.name1 || ''} onChange={e => onChange({ name1: e.target.value })} /></div>
          <div className="input-group" style={{ marginTop: 8 }}><label>Title / Description</label><input className="settings-input" value={data.title1 || ''} onChange={e => onChange({ title1: e.target.value })} /></div>
          <div style={{ marginTop: 8 }}><label style={{ fontSize: 11, color: 'var(--text-muted)' }}>Photo</label><MediaUploader currentUrl={data.photo1} onUpload={url => onChange({ photo1: url })} /></div>
          <div className="input-group" style={{ marginTop: 8 }}><label>Instagram</label><input className="settings-input" value={data.instagram1 || ''} onChange={e => onChange({ instagram1: e.target.value })} placeholder="username" /></div>
        </div>

        <div style={{ padding: 12, border: '1px solid var(--border)', borderRadius: 8, marginTop: 12 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Person 2</label>
          <div className="input-group" style={{ marginTop: 8 }}><label>Name</label><input className="settings-input" value={data.name2 || ''} onChange={e => onChange({ name2: e.target.value })} /></div>
          <div className="input-group" style={{ marginTop: 8 }}><label>Title / Description</label><input className="settings-input" value={data.title2 || ''} onChange={e => onChange({ title2: e.target.value })} /></div>
          <div style={{ marginTop: 8 }}><label style={{ fontSize: 11, color: 'var(--text-muted)' }}>Photo</label><MediaUploader currentUrl={data.photo2} onUpload={url => onChange({ photo2: url })} /></div>
          <div className="input-group" style={{ marginTop: 8 }}><label>Instagram</label><input className="settings-input" value={data.instagram2 || ''} onChange={e => onChange({ instagram2: e.target.value })} placeholder="username" /></div>
        </div>

        <div className="input-group" style={{ marginTop: 12 }}><label>Bio / Description</label><textarea className="settings-textarea" value={data.description || ''} onChange={e => onChange({ description: e.target.value })} rows={3} /></div>
        <AnimationSection data={data} onChange={onChange} />
        <SpacingSection data={data} onChange={onChange} />
        <BackgroundImageSection data={data} onChange={onChange} />
        <AdvancedDesignSection data={data} onChange={onChange} />
      </div>
    )
  }

  // ── STORY ─────────────────────────────────────────────────────────────
  if (type === 'story') {
    return (
      <div className="settings-section">
        <span className="label-caps">Our Story Timeline</span>
        <div style={{ marginTop: 16 }}>
          {(data.items || []).map((item, i) => (
            <div key={i} style={{ border: '1px solid var(--border)', padding: 12, borderRadius: 8, marginTop: 8 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <div className="input-group" style={{ flex: 1 }}>
                  <label>Date / Year</label>
                  <input className="settings-input" value={item.date || ''} placeholder="e.g. 2020" onChange={e => {
                    const ni = [...(data.items || [])]; ni[i] = { ...item, date: e.target.value }; onChange({ items: ni });
                  }} />
                </div>
              </div>
              <div className="input-group" style={{ marginTop: 8 }}>
                <label>Title</label>
                <input className="settings-input" value={item.title || ''} placeholder="First Met" onChange={e => {
                  const ni = [...(data.items || [])]; ni[i] = { ...item, title: e.target.value }; onChange({ items: ni });
                }} />
              </div>
              <div className="input-group" style={{ marginTop: 8 }}>
                <label>Description</label>
                <textarea className="settings-textarea" value={item.description || ''} onChange={e => {
                  const ni = [...(data.items || [])]; ni[i] = { ...item, description: e.target.value }; onChange({ items: ni });
                }} rows={2} />
              </div>
              <div style={{ marginTop: 8 }}>
                <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>Photo (optional)</label>
                <MediaUploader currentUrl={item.photo} onUpload={url => {
                  const ni = [...(data.items || [])]; ni[i] = { ...item, photo: url }; onChange({ items: ni });
                }} />
              </div>
              <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop: 8, color: 'var(--error)' }} onClick={() => {
                const ni = [...(data.items || [])]; ni.splice(i, 1); onChange({ items: ni });
              }}>Remove</button>
            </div>
          ))}
          <button type="button" className="btn btn-outline btn-sm" style={{ width: '100%', marginTop: 12 }} onClick={() => onChange({ items: [...(data.items || []), { date: '', title: '', description: '', photo: '' }] })}>+ Add Milestone</button>
        </div>
        <AnimationSection data={data} onChange={onChange} />
        <SpacingSection data={data} onChange={onChange} />
        <BackgroundImageSection data={data} onChange={onChange} />
        <AdvancedDesignSection data={data} onChange={onChange} />
      </div>
    )
  }

  // ── DRESS CODE ────────────────────────────────────────────────────────
  if (type === 'dressCode') {
    const swatches = data.swatches || []
    return (
      <>
        <div className="settings-section">
          <span className="label-caps">Content</span>
          <div className="input-group" style={{ marginTop: 8 }}>
            <label>Title</label>
            <input className="settings-input" value={data.title || ''} placeholder="Dress Code" onChange={e => onChange({ title: e.target.value })} />
          </div>
          <div className="input-group" style={{ marginTop: 8 }}>
            <label>Description</label>
            <textarea className="settings-textarea" value={data.description || ''} onChange={e => onChange({ description: e.target.value })} rows={3} />
          </div>
          <div className="input-group" style={{ marginTop: 8 }}>
            <label>Note (optional)</label>
            <input className="settings-input" value={data.note || ''} placeholder="Please avoid white..." onChange={e => onChange({ note: e.target.value })} />
          </div>
        </div>
        <div className="settings-section">
          <span className="label-caps">Color Swatches</span>
          {swatches.map((swatch, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 10 }}>
              <input type="color" value={swatch.color || '#ffffff'} onChange={e => {
                const ns = [...swatches]; ns[i] = { ...swatch, color: e.target.value }; onChange({ swatches: ns });
              }} style={{ width: 36, height: 36, padding: 2, border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer', flexShrink: 0 }} />
              <input className="settings-input" value={swatch.label || ''} placeholder="Color name" onChange={e => {
                const ns = [...swatches]; ns[i] = { ...swatch, label: e.target.value }; onChange({ swatches: ns });
              }} style={{ flex: 1 }} />
              <button type="button" onClick={() => {
                const ns = [...swatches]; ns.splice(i, 1); onChange({ swatches: ns });
              }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>×</button>
            </div>
          ))}
          <button type="button" className="btn btn-outline btn-sm" style={{ width: '100%', marginTop: 12 }} onClick={() => onChange({ swatches: [...swatches, { color: '#EDE9E7', label: 'Color' }] })}>+ Add Color</button>
        </div>
        <AnimationSection data={data} onChange={onChange} />
        <SpacingSection data={data} onChange={onChange} />
        <BackgroundImageSection data={data} onChange={onChange} />
        <AdvancedDesignSection data={data} onChange={onChange} />
      </>
    )
  }

  // ── GIFT ──────────────────────────────────────────────────────────────
  if (type === 'gift') {
    // Handle migration from old format
    const accounts = data.accounts?.length > 0
      ? data.accounts
      : (data.bankName ? [{ bankName: data.bankName, accountNumber: data.accountNumber, accountName: data.accountName, logo: '' }] : [])

    return (
      <div className="settings-section">
        <span className="label-caps">Gift Section</span>
        <div className="input-group" style={{ marginTop: 8 }}>
          <label>Title</label>
          <input className="settings-input" value={data.title || ''} onChange={e => onChange({ title: e.target.value })} />
        </div>
        <div className="input-group" style={{ marginTop: 8 }}>
          <label>Subtitle</label>
          <textarea className="settings-textarea" value={data.subtitle || ''} onChange={e => onChange({ subtitle: e.target.value })} rows={2} />
        </div>

        <span className="label-caps" style={{ fontSize: 10, display: 'block', marginTop: 20, marginBottom: 8 }}>Bank Accounts / E-Wallets</span>
        {accounts.map((acc, i) => (
          <div key={i} style={{ border: '1px solid var(--border)', padding: 12, borderRadius: 8, marginTop: 8 }}>
            <div className="input-group"><label>Bank / E-Wallet Name</label><input className="settings-input" value={acc.bankName || ''} placeholder="BCA / GoPay" onChange={e => {
              const na = [...accounts]; na[i] = { ...acc, bankName: e.target.value }; onChange({ accounts: na });
            }} /></div>
            <div className="input-group" style={{ marginTop: 8 }}><label>Account Number</label><input className="settings-input" value={acc.accountNumber || ''} onChange={e => {
              const na = [...accounts]; na[i] = { ...acc, accountNumber: e.target.value }; onChange({ accounts: na });
            }} /></div>
            <div className="input-group" style={{ marginTop: 8 }}><label>Account Name</label><input className="settings-input" value={acc.accountName || ''} onChange={e => {
              const na = [...accounts]; na[i] = { ...acc, accountName: e.target.value }; onChange({ accounts: na });
            }} /></div>
            <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop: 8, color: 'var(--error)' }} onClick={() => {
              const na = [...accounts]; na.splice(i, 1); onChange({ accounts: na });
            }}>Remove</button>
          </div>
        ))}
        <button type="button" className="btn btn-outline btn-sm" style={{ width: '100%', marginTop: 12 }} onClick={() => onChange({ accounts: [...accounts, { bankName: '', accountNumber: '', accountName: '' }] })}>+ Add Account</button>

        <span className="label-caps" style={{ fontSize: 10, display: 'block', marginTop: 20, marginBottom: 8 }}>QRIS Code</span>
        <MediaUploader currentUrl={data.qrisImage} onUpload={url => onChange({ qrisImage: url })} />
        {data.qrisImage && (
          <button className="btn btn-ghost btn-sm" style={{ marginTop: 8, color: 'var(--error)' }} onClick={() => onChange({ qrisImage: '' })}>Remove QRIS</button>
        )}

        <span className="label-caps" style={{ fontSize: 10, display: 'block', marginTop: 20, marginBottom: 8 }}>Registry Links</span>
        {(data.registryLinks || []).map((link, i) => (
          <div key={i} style={{ border: '1px solid var(--border)', padding: 12, borderRadius: 8, marginTop: 8 }}>
            <div className="input-group"><label>Store Name</label><input className="settings-input" value={link.label || ''} onChange={e => {
              const nl = [...(data.registryLinks || [])]; nl[i] = { ...link, label: e.target.value }; onChange({ registryLinks: nl });
            }} /></div>
            <div className="input-group" style={{ marginTop: 8 }}><label>URL</label><input className="settings-input" value={link.url || ''} placeholder="https://..." onChange={e => {
              const nl = [...(data.registryLinks || [])]; nl[i] = { ...link, url: e.target.value }; onChange({ registryLinks: nl });
            }} /></div>
            <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop: 8, color: 'var(--error)' }} onClick={() => {
              const nl = [...(data.registryLinks || [])]; nl.splice(i, 1); onChange({ registryLinks: nl });
            }}>Remove</button>
          </div>
        ))}
        <button type="button" className="btn btn-outline btn-sm" style={{ width: '100%', marginTop: 12 }} onClick={() => onChange({ registryLinks: [...(data.registryLinks || []), { label: '', url: '' }] })}>+ Add Registry Link</button>

        <AnimationSection data={data} onChange={onChange} />
        <SpacingSection data={data} onChange={onChange} />
        <BackgroundImageSection data={data} onChange={onChange} />
        <AdvancedDesignSection data={data} onChange={onChange} />
      </div>
    )
  }

  // ── WISHES ────────────────────────────────────────────────────────────
  if (type === 'wishes') {
    return (
      <div className="settings-section">
        <span className="label-caps">Guest Wishes</span>
        <div className="input-group" style={{ marginTop: 8 }}>
          <label>Title</label>
          <input className="settings-input" value={data.title || ''} onChange={e => onChange({ title: e.target.value })} />
        </div>
        <div className="input-group" style={{ marginTop: 8 }}>
          <label>Display Mode</label>
          <select className="settings-select" value={data.displayMode || 'masonry'} onChange={e => onChange({ displayMode: e.target.value })}>
            <option value="masonry">Masonry</option>
            <option value="list">List</option>
          </select>
        </div>
        <div style={{ marginTop: 16, padding: 12, background: 'rgba(86,95,52,0.05)', borderRadius: 8, fontSize: 13, color: 'var(--text-muted)' }}>
          Wishes submitted by guests will appear here automatically.
        </div>
        <AnimationSection data={data} onChange={onChange} />
        <SpacingSection data={data} onChange={onChange} />
        <BackgroundImageSection data={data} onChange={onChange} />
        <AdvancedDesignSection data={data} onChange={onChange} />
      </div>
    )
  }

  // ── ORNAMENT (was divider) ────────────────────────────────────────────
  if (type === 'ornament' || type === 'divider') {
    return (
      <div className="settings-section">
        <span className="label-caps">Ornament Style</span>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
          {[['floral','✿ Floral'],['line','— Line'],['double-line','= Double'],['dots','··· Dots'],['wave','〜 Wave']].map(([val, lbl]) => (
            <button key={val} type="button" onClick={() => onChange({ style: val })}
              style={{ padding: '10px 8px', borderRadius: 8, border: `2px solid ${(data.style || 'floral') === val ? 'var(--olive)' : 'var(--border)'}`, background: (data.style || 'floral') === val ? 'rgba(86,95,52,0.08)' : 'var(--white)', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: (data.style || 'floral') === val ? 'var(--olive)' : 'var(--text-muted)' }}>{lbl}</button>
          ))}
        </div>
        <div className="input-group" style={{ marginTop: 12 }}>
          <label>Color</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {['#C4A882', '#565F34', '#BE1A32', '#E0DCD8', '#2D2D2D'].map(c => (
              <button key={c} className={`swatch ${data.color === c ? 'active' : ''}`} style={{ background: c }} onClick={() => onChange({ color: c })} />
            ))}
            <input type="color" value={data.color || '#C4A882'} onChange={e => onChange({ color: e.target.value })} className="swatch-picker" />
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>Width</label>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--olive)' }}>{data.width || 60}%</span>
          </div>
          <input type="range" min={20} max={100} step={5} value={data.width || 60} onChange={e => onChange({ width: Number(e.target.value) })} style={{ width: '100%', accentColor: 'var(--olive)' }} />
        </div>
        <AnimationSection data={data} onChange={onChange} />
        <SpacingSection data={data} onChange={onChange} />
      </div>
    )
  }

  // ── FOOTER ────────────────────────────────────────────────────────────
  if (type === 'footer') {
    return (
      <>
        <div className="settings-section">
          <span className="label-caps">Background Style</span>
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            {[['dark','Dark'],['gradient','Gradient'],['slideshow','Slideshow']].map(([val, lbl]) => (
              <button key={val} type="button" onClick={() => onChange({ bgStyle: val })}
                style={{ flex: 1, padding: '8px 4px', borderRadius: 8, border: `2px solid ${(data.bgStyle || 'dark') === val ? 'var(--olive)' : 'var(--border)'}`, background: (data.bgStyle || 'dark') === val ? 'rgba(86,95,52,0.08)' : 'var(--white)', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: (data.bgStyle || 'dark') === val ? 'var(--olive)' : 'var(--text-muted)' }}>{lbl}</button>
            ))}
          </div>
          {(data.bgStyle === 'gradient') && (
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <div className="input-group" style={{ flex: 1 }}>
                <label>From</label>
                <input type="color" value={data.gradientFrom || '#2D2D2D'} onChange={e => onChange({ gradientFrom: e.target.value })} style={{ width: '100%', height: 36, padding: 2, border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer' }} />
              </div>
              <div className="input-group" style={{ flex: 1 }}>
                <label>To</label>
                <input type="color" value={data.gradientTo || '#1a1a1a'} onChange={e => onChange({ gradientTo: e.target.value })} style={{ width: '100%', height: 36, padding: 2, border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer' }} />
              </div>
            </div>
          )}
        </div>
        <div className="settings-section">
          <span className="label-caps">Footer Content</span>
          <div className="input-group" style={{ marginTop: 8 }}>
            <label>Thank You Text</label>
            <input className="settings-input" value={data.thankYouText || ''} onChange={e => onChange({ thankYouText: e.target.value })} placeholder="Thank You" />
          </div>
          <div className="input-group" style={{ marginTop: 8 }}>
            <label>Couple Name</label>
            <input className="settings-input" value={data.coupleName || ''} onChange={e => onChange({ coupleName: e.target.value })} />
          </div>
          <div className="input-group" style={{ marginTop: 8 }}>
            <label>Subtitle</label>
            <input className="settings-input" value={data.subtitle || ''} onChange={e => onChange({ subtitle: e.target.value })} />
          </div>
          <div style={{ marginTop: 12 }}>
            <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
              <input type="checkbox" checked={data.showWatermark ?? true} onChange={e => onChange({ showWatermark: e.target.checked })} />
              Show Invori Watermark
            </label>
          </div>
        </div>
        {(data.bgStyle === 'slideshow' || !data.bgStyle) && (
          <div className="settings-section">
            <span className="label-caps">Photo Slideshow</span>
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(data.photos || []).map((photo, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 4, overflow: 'hidden' }}>
                    <MediaRenderer src={photo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => {
                    const np = [...(data.photos || [])]; np.splice(i, 1); onChange({ photos: np });
                  }} style={{ padding: 4 }}>Remove</button>
                </div>
              ))}
              <MediaUploader currentUrl="" onUpload={(url) => onChange({ photos: [...(data.photos || []), url] })} />
            </div>
          </div>
        )}
        <SpacingSection data={data} onChange={onChange} />
      </>
    )
  }

  // Generic fallback
  return (
    <div className="settings-section">
      <span className="label-caps">Settings</span>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>Settings for {BLOCK_TYPES[type]?.label || type} block.</p>
      <AnimationSection data={data} onChange={onChange} />
      <SpacingSection data={data} onChange={onChange} />
      <BackgroundImageSection data={data} onChange={onChange} />
      <AdvancedDesignSection data={data} onChange={onChange} />
    </div>
  )
}

function AnimationSection({ data, onChange }) {
  const animation = data.animation || 'fade-in-up'
  const [previewKey, setPreviewKey] = useState(0)

  const ANIMATION_OPTIONS = [
    { value: 'none', label: 'None', icon: '—' },
    { value: 'fade-in', label: 'Fade In', icon: '○' },
    { value: 'fade-in-up', label: 'Fade Up', icon: '↑' },
    { value: 'fade-in-down', label: 'Fade Down', icon: '↓' },
    { value: 'slide-in-left', label: 'Slide Left', icon: '←' },
    { value: 'slide-in-right', label: 'Slide Right', icon: '→' },
    { value: 'zoom-in', label: 'Zoom In', icon: '⊕' },
  ]

  const ANIM_CLASS_MAP = {
    'none': '',
    'fade-in': 'animate-fade-in',
    'fade-in-up': 'animate-fade-in-up',
    'fade-in-down': 'animate-fade-in-down',
    'slide-in-left': 'animate-slide-in-left',
    'slide-in-right': 'animate-slide-in-right',
    'zoom-in': 'animate-zoom-in',
  }

  const handleSelect = (value) => {
    onChange({ animation: value })
    setPreviewKey(prev => prev + 1)
  }

  return (
    <div className="settings-section" style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 16 }}>
      <span className="label-caps" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        ✦ Entrance Animation
      </span>

      <div style={{ marginTop: 12, padding: '20px 16px', background: 'var(--cream)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', minHeight: 80 }}>
        <div key={previewKey} className={ANIM_CLASS_MAP[animation] || ''} style={{ opacity: animation === 'none' ? 1 : 0, width: '80%', display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
          <div style={{ width: '100%', height: 8, background: 'var(--olive)', borderRadius: 4, opacity: 0.6 }} />
          <div style={{ width: '60%', height: 6, background: 'var(--border)', borderRadius: 3 }} />
          <div style={{ width: '75%', height: 6, background: 'var(--border)', borderRadius: 3 }} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 6, marginTop: 10 }}>
        {ANIMATION_OPTIONS.map(opt => (
          <button key={opt.value} type="button" onClick={() => handleSelect(opt.value)}
            style={{ padding: '10px 6px', borderRadius: 8, border: animation === opt.value ? '2px solid var(--olive)' : '1.5px solid var(--border)', background: animation === opt.value ? 'rgba(86,95,52,0.08)' : 'var(--white)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, transition: 'all 0.15s ease', fontSize: 11, fontWeight: animation === opt.value ? 700 : 500, color: animation === opt.value ? 'var(--olive)' : 'var(--text-muted)' }}>
            <span style={{ fontSize: 16, lineHeight: 1 }}>{opt.icon}</span>
            <span>{opt.label}</span>
          </button>
        ))}
      </div>
      <p style={{ fontSize: 10, color: 'var(--text-light)', marginTop: 8, lineHeight: 1.4 }}>Animation plays when the block scrolls into view.</p>
    </div>
  )
}

function SpacingSection({ data, onChange }) {
  const spacingTop = data.spacingTop ?? 40
  const spacingBottom = data.spacingBottom ?? 40
  return (
    <div className="settings-section" style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 16 }}>
      <span className="label-caps" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>↕ Spacing</span>
      <div style={{ marginTop: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>Space Above</label>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--olive)' }}>{spacingTop}px</span>
        </div>
        <input type="range" min={0} max={200} step={4} value={spacingTop} onChange={e => onChange({ spacingTop: Number(e.target.value) })} style={{ width: '100%', accentColor: 'var(--olive)', cursor: 'pointer' }} />
      </div>
      <div style={{ marginTop: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>Space Below</label>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--olive)' }}>{spacingBottom}px</span>
        </div>
        <input type="range" min={0} max={200} step={4} value={spacingBottom} onChange={e => onChange({ spacingBottom: Number(e.target.value) })} style={{ width: '100%', accentColor: 'var(--olive)', cursor: 'pointer' }} />
      </div>
    </div>
  )
}

function BackgroundImageSection({ data, onChange }) {
  const detectAndSetAspectRatio = (url) => {
    if (!url) return
    if (isMediaVideo(url)) {
      const video = document.createElement('video')
      video.onloadedmetadata = () => onChange({ backgroundAspectRatio: `${video.videoWidth}/${video.videoHeight}` })
      video.src = url
    } else {
      const img = new Image()
      img.onload = () => onChange({ backgroundAspectRatio: `${img.naturalWidth}/${img.naturalHeight}` })
      img.src = url
    }
  }

  const handleUpload = (url) => { onChange({ backgroundImage: url }); detectAndSetAspectRatio(url) }
  const handlePasteUrl = (url) => { onChange({ backgroundImage: url }); if (url) detectAndSetAspectRatio(url) }

  return (
    <div className="settings-section" style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 16 }}>
      <span className="label-caps" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>🖼 Background Image</span>
      <div style={{ marginTop: 12 }}>
        <MediaUploader currentUrl={data.backgroundImage || ''} onUpload={handleUpload} />
        <div className="input-group" style={{ marginTop: 10 }}>
          <label>Or paste URL</label>
          <input className="settings-input" value={data.backgroundImage || ''} onChange={e => handlePasteUrl(e.target.value)} placeholder="https://..." />
        </div>
        {data.backgroundImage && (
          <>
            <div className="input-group" style={{ marginTop: 10 }}>
              <label>Fit Mode</label>
              <select className="settings-select" value={data.backgroundFit || 'cover'} onChange={e => onChange({ backgroundFit: e.target.value })}>
                <option value="cover">Cover (fill)</option>
                <option value="contain">Contain (fit)</option>
                <option value="fill">Stretch</option>
              </select>
            </div>
            <div style={{ marginTop: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>Overlay Opacity</label>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--olive)' }}>{Math.round((data.backgroundOverlay ?? 0.3) * 100)}%</span>
              </div>
              <input type="range" min={0} max={1} step={0.05} value={data.backgroundOverlay ?? 0.3} onChange={e => onChange({ backgroundOverlay: Number(e.target.value) })} style={{ width: '100%', accentColor: 'var(--olive)', cursor: 'pointer' }} />
            </div>
            <div className="input-group" style={{ marginTop: 10 }}>
              <label>Overlay Color</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input type="color" value={data.backgroundOverlayColor || '#000000'} onChange={e => onChange({ backgroundOverlayColor: e.target.value })} style={{ width: 36, height: 36, padding: 2, border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer' }} />
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{data.backgroundOverlayColor || '#000000'}</span>
              </div>
            </div>
            <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop: 12, color: 'var(--error)', width: '100%' }}
              onClick={() => onChange({ backgroundImage: '', backgroundOverlay: 0.3, backgroundFit: 'cover', backgroundOverlayColor: '#000000', backgroundAspectRatio: '' })}>
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
      <span className="label-caps" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>📏 Block Size</span>
      <div style={{ marginTop: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>Min Height</label>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--olive)' }}>{minHeight === 0 ? 'Auto' : `${minHeight}px`}</span>
        </div>
        <input type="range" min={0} max={600} step={10} value={minHeight} onChange={e => onChange({ blockMinHeight: Number(e.target.value) })} style={{ width: '100%', accentColor: 'var(--olive)', cursor: 'pointer' }} />
        <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: '4px 0 0' }}>Set to 0 for auto height.</p>
      </div>
    </div>
  )
}

function AdvancedDesignSection({ data, onChange }) {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <div className="settings-section" style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 16 }}>
      <button type="button" onClick={() => setIsOpen(!isOpen)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
        <span className="label-caps">✨ Advanced Design</span>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{isOpen ? '▲' : '▼'}</span>
      </button>
      {isOpen && (
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="input-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
              <input type="checkbox" checked={data.fullWidth !== false} onChange={e => onChange({ fullWidth: e.target.checked })} />
              Full Width (Edge-to-Edge)
            </label>
          </div>
          <div className="input-group">
            <label>Background Color Override</label>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <input type="color" value={data.customBgColor || '#ffffff'} onChange={e => onChange({ customBgColor: e.target.value })} style={{ width: 40, height: 32, padding: 0, cursor: 'pointer', borderRadius: 4, border: '1px solid var(--border)' }} />
              <input type="text" className="settings-input" value={data.customBgColor || ''} onChange={e => onChange({ customBgColor: e.target.value })} placeholder="HEX or transparent" style={{ flex: 1 }} />
            </div>
            <button className="btn btn-ghost btn-sm" style={{ marginTop: 8 }} onClick={() => onChange({ customBgColor: '' })}>Clear</button>
          </div>
          <div className="input-group">
            <label>Text Color Override</label>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <input type="color" value={data.customTextColor || '#000000'} onChange={e => onChange({ customTextColor: e.target.value })} style={{ width: 40, height: 32, padding: 0, cursor: 'pointer', borderRadius: 4, border: '1px solid var(--border)' }} />
              <input type="text" className="settings-input" value={data.customTextColor || ''} onChange={e => onChange({ customTextColor: e.target.value })} placeholder="#2a3125" style={{ flex: 1 }} />
            </div>
            <button className="btn btn-ghost btn-sm" style={{ marginTop: 8 }} onClick={() => onChange({ customTextColor: '' })}>Clear</button>
          </div>
          <div className="input-group">
            <label>Text Alignment</label>
            <select className="settings-input" value={data.customTextAlign || ''} onChange={e => onChange({ customTextAlign: e.target.value })} style={{ marginTop: 8 }}>
              <option value="">Default Center</option>
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
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

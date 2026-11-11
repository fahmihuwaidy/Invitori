import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useInvitations } from '../contexts/InvitationContext'
import { BLOCK_TYPES, BLOCK_CATEGORIES } from '../utils/blockDefaults'
import { PRESETS, PRESET_LIST, THEME_PALETTES } from '../utils/presets'
import { uploadToCloudinary } from '../lib/cloudinary'
import { 
  DndContext, 
  closestCenter, 
  pointerWithin, 
  rectIntersection, 
  MouseSensor,
  PointerSensor, 
  TouchSensor, 
  useSensor, 
  useSensors, 
  useDraggable, 
  useDroppable, 
  DragOverlay, 
  defaultDropAnimationSideEffects 
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { 
  HiOutlineArrowLeft, HiOutlineMenuAlt2, HiX, HiOutlineEye, HiOutlineTrash, HiPlus,
  HiOutlineViewGrid, HiOutlineMail, HiOutlineUserGroup, HiOutlineGift, HiOutlineCog, 
  HiOutlineUpload, HiOutlineSave, HiOutlineShare, HiOutlineFolderOpen, HiOutlineRefresh, 
  HiOutlineDocumentText, HiOutlineQuestionMarkCircle, HiOutlineDuplicate, HiOutlineLockClosed, 
  HiOutlineLockOpen, HiOutlineEyeOff, HiChevronUp, HiChevronDown, HiOutlineSearch, HiOutlineStar, 
  HiStar, HiOutlineDesktopComputer, HiOutlineDeviceTablet, HiOutlineDeviceMobile, HiOutlineFolderDownload,
  HiOutlineArrowsExpand, HiOutlineCheckCircle, HiOutlineExclamationCircle
} from 'react-icons/hi'
import Logo from '../assets/Logo.png'
import './EditorPage.css'
import './PublicInvitationPage.css'
import { renderPublicBlock, isMediaVideo, MediaRenderer } from './PublicInvitationPage'

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT WRAPPERS & DND-KIT STUFF
// ─────────────────────────────────────────────────────────────────────────────

function DraggablePaletteItem({ id, type, label, icon, onClick, isFavorite, onToggleFavorite }) {
  const draggableId = id || `palette-${type}`
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: draggableId,
    data: {
      type: 'paletteItem',
      blockType: type,
    }
  })

  return (
    <div 
      className={`palette-block-wrapper ${isDragging ? 'is-dragging' : ''}`}
      style={{ position: 'relative' }}
    >
      <div
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        className="palette-block"
        role="button"
        tabIndex={0}
        onClick={() => {
          if (!isDragging) onClick()
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onClick()
          }
        }}
        style={{ touchAction: 'none', cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <span className="palette-icon">{icon}</span>
        <span className="palette-label">{label}</span>
      </div>
      <button 
        type="button" 
        className={`palette-favorite-btn ${isFavorite ? 'active' : ''}`}
        onClick={(e) => { e.stopPropagation(); onToggleFavorite(type) }}
        title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
      >
        {isFavorite ? <HiStar size={14} /> : <HiOutlineStar size={14} />}
      </button>
    </div>
  )
}

function SortableBlock({ id, isLocked, children }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ 
    id,
    disabled: isLocked // Disable dragging if the block is locked
  })
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    position: 'relative',
    zIndex: isDragging ? 20 : 1,
  }
  
  return (
    <div ref={setNodeRef} id={id} style={style} className={`sortable-block ${isDragging ? 'is-dragging' : ''}`}>
      {!isLocked && (
        <div
          className="block-drag-handle"
          {...attributes}
          {...listeners}
          title="Drag to reorder"
        >
          ⠿
        </div>
      )}
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
      >
        <HiPlus size={16} />
      </button>
      <div className="insert-block-line" />
      {isDropTarget && <span className="drop-here-indicator">Drop Here</span>}
    </div>
  )
}

function CanvasDroppable({ id, children, style, isDropActive }) {
  const { setNodeRef, isOver } = useDroppable({ id })
  return (
    <div 
      ref={setNodeRef} 
      id={id} 
      className={`canvas-droppable-zone ${isOver ? 'is-over' : ''} ${isDropActive ? 'is-drag-active' : ''}`}
      style={{ 
        ...style, 
        backgroundColor: isOver ? 'rgba(86,95,52,0.08)' : style?.backgroundColor,
        transition: 'all 0.2s ease'
      }}
    >
      {children}
    </div>
  )
}

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

// ─────────────────────────────────────────────────────────────────────────────
// EDITOR SETTINGS PANELS (STYLE, LAYOUT, ANIMATION, RESPONSIVE, ADVANCED, INTERACTIONS)
// ─────────────────────────────────────────────────────────────────────────────

function BlockGeneralStylePanel({ data, onChange }) {
  return (
    <div className="settings-section border-top">
      <span className="label-caps">🎨 Visual Overrides</span>
      <div className="input-group">
        <label>Custom Bg Color</label>
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <input type="color" value={data.customBgColor || '#ffffff'} onChange={e => onChange({ customBgColor: e.target.value })} style={{ width: 40, height: 32, padding: 0, cursor: 'pointer', borderRadius: 4, border: '1px solid var(--border-color)' }} />
          <input type="text" className="settings-input" value={data.customBgColor || ''} onChange={e => onChange({ customBgColor: e.target.value })} placeholder="HEX or transparent" style={{ flex: 1, marginTop: 0 }} />
        </div>
        <button className="btn btn-ghost btn-sm" style={{ marginTop: 8 }} onClick={() => onChange({ customBgColor: '' })}>Clear</button>
      </div>
      
      <div className="input-group">
        <label>Custom Text Color</label>
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <input type="color" value={data.customTextColor || '#000000'} onChange={e => onChange({ customTextColor: e.target.value })} style={{ width: 40, height: 32, padding: 0, cursor: 'pointer', borderRadius: 4, border: '1px solid var(--border-color)' }} />
          <input type="text" className="settings-input" value={data.customTextColor || ''} onChange={e => onChange({ customTextColor: e.target.value })} placeholder="#2a3125" style={{ flex: 1, marginTop: 0 }} />
        </div>
        <button className="btn btn-ghost btn-sm" style={{ marginTop: 8 }} onClick={() => onChange({ customTextColor: '' })}>Clear</button>
      </div>

      <div className="input-group">
        <label>Text Alignment</label>
        <select className="settings-select" value={data.customTextAlign || ''} onChange={e => onChange({ customTextAlign: e.target.value })}>
          <option value="">Default (Center)</option>
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
        <input type="range" min="0" max="100" value={data.customBorderRadius || 0} onChange={e => onChange({ customBorderRadius: Number(e.target.value) })} style={{ accentColor: 'var(--olive)', width: '100%' }} />
      </div>
    </div>
  )
}

function SpacingSection({ data, onChange }) {
  const spacingTop = data.spacingTop ?? 40
  const spacingBottom = data.spacingBottom ?? 40
  return (
    <div className="settings-section">
      <span className="label-caps">Spacing (Margins)</span>
      <div style={{ marginTop: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>Space Above</label>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--olive)' }}>{spacingTop}px</span>
        </div>
        <input type="range" min={0} max={200} step={4} value={spacingTop} onChange={e => onChange({ spacingTop: Number(e.target.value) })} style={{ width: '100%', accentColor: 'var(--olive)', cursor: 'pointer' }} />
      </div>
      <div style={{ marginTop: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>Space Below</label>
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
    <div className="settings-section border-top">
      <span className="label-caps">🖼 Background Media</span>
      <div style={{ marginTop: 12 }}>
        <MediaUploader currentUrl={data.backgroundImage || ''} onUpload={handleUpload} />
        <div className="input-group">
          <label>Or paste URL</label>
          <input className="settings-input" value={data.backgroundImage || ''} onChange={e => handlePasteUrl(e.target.value)} placeholder="https://..." />
        </div>
        {data.backgroundImage && (
          <>
            <div className="input-group">
              <label>Fit Mode</label>
              <select className="settings-select" value={data.backgroundFit || 'cover'} onChange={e => onChange({ backgroundFit: e.target.value })}>
                <option value="cover">Cover (fill)</option>
                <option value="contain">Contain (fit)</option>
                <option value="fill">Stretch</option>
              </select>
            </div>
            <div style={{ marginTop: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>Overlay Opacity</label>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--olive)' }}>{Math.round((data.backgroundOverlay ?? 0.3) * 100)}%</span>
              </div>
              <input type="range" min={0} max={1} step={0.05} value={data.backgroundOverlay ?? 0.3} onChange={e => onChange({ backgroundOverlay: Number(e.target.value) })} style={{ width: '100%', accentColor: 'var(--olive)', cursor: 'pointer' }} />
            </div>
            <div className="input-group">
              <label>Overlay Color</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
                <input type="color" value={data.backgroundOverlayColor || '#000000'} onChange={e => onChange({ backgroundOverlayColor: e.target.value })} style={{ width: 36, height: 36, padding: 2, border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer' }} />
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{data.backgroundOverlayColor || '#000000'}</span>
              </div>
            </div>
            <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop: 12, color: 'var(--red)', width: '100%' }}
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
    <div className="settings-section border-top">
      <span className="label-caps">📏 Sizing</span>
      <div style={{ marginTop: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>Min Height</label>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--olive)' }}>{minHeight === 0 ? 'Auto' : `${minHeight}px`}</span>
        </div>
        <input type="range" min={0} max={600} step={10} value={minHeight} onChange={e => onChange({ blockMinHeight: Number(e.target.value) })} style={{ width: '100%', accentColor: 'var(--olive)', cursor: 'pointer' }} />
        <p style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 4 }}>Set to 0 for automatic height.</p>
      </div>
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
    <div className="settings-section">
      <span className="label-caps">✦ Entrance Animation</span>
      <div style={{ marginTop: 12, padding: '20px 16px', background: 'var(--olive-bg)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', minHeight: 80 }}>
        <div key={previewKey} className={ANIM_CLASS_MAP[animation] || ''} style={{ opacity: animation === 'none' ? 1 : 0, width: '80%', display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
          <div style={{ width: '100%', height: 8, background: 'var(--olive)', borderRadius: 4, opacity: 0.6 }} />
          <div style={{ width: '60%', height: 6, background: 'var(--border-color)', borderRadius: 3 }} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 6, marginTop: 12 }}>
        {ANIMATION_OPTIONS.map(opt => (
          <button key={opt.value} type="button" onClick={() => handleSelect(opt.value)}
            className={`btn-animation-picker ${animation === opt.value ? 'active' : ''}`}
          >
            <span style={{ fontSize: 14, lineHeight: 1 }}>{opt.icon}</span>
            <span>{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function BlockSpecificStylePanel({ block, onChange }) {
  const type = block.type
  const data = block.data || {}

  // ── DESKTOP SHOWCASE COVER (DESKTOP HERO OVERLAY) ─────────────────────
  if (type === 'desktopHero') {
    return (
      <>
        <div className="settings-section">
          <span className="label-caps">Foto Showcase Desktop</span>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '4px 0 10px', lineHeight: 1.5 }}>
            Foto ini khusus tampil di layar sebelah kiri pada tampilan desktop (dual-pane showcase). Saat upload, Anda dapat memotong foto secara presisi.
          </p>
          <div style={{ marginTop: 8 }}>
            <MediaUploader
              currentUrl={data.backgroundImage}
              onUpload={(url) => onChange({ backgroundImage: url })}
              withCrop={true}
              cropAspectRatio={16 / 9}
              cropTitle="Potong Foto Desktop Showcase (16:9)"
            />
          </div>
          <div className="input-group">
            <label>Atau tempel URL Gambar</label>
            <input
              className="settings-input"
              value={data.backgroundImage || ''}
              onChange={e => onChange({ backgroundImage: e.target.value })}
              placeholder="https://images.unsplash.com/..."
            />
          </div>
        </div>

        <div className="settings-section">
          <span className="label-caps">Overlay & Visual Efek</span>
          <div className="input-group">
            <label>Gradient Overlay Style</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 6 }}>
              {[
                ['cinematic', 'Cinematic Dark'],
                ['dark', 'Deep Charcoal'],
                ['warm', 'Warm Mocha'],
                ['subtle', 'Subtle Mist'],
                ['none', 'Tanpa Overlay'],
              ].map(([val, lbl]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => onChange({ overlayGradient: val })}
                  className={`btn-tabs-choice ${(data.overlayGradient || 'cinematic') === val ? 'active' : ''}`}
                >
                  {lbl}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>Overlay Opacity</label>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--olive)' }}>{Math.round((data.overlayOpacity ?? 0.7) * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={data.overlayOpacity ?? 0.7}
              onChange={e => onChange({ overlayOpacity: Number(e.target.value) })}
              style={{ width: '100%', accentColor: 'var(--olive)' }}
            />
          </div>
        </div>

        <div className="settings-section">
          <span className="label-caps">Teks & Kustomisasi Khusus Desktop</span>
          <div className="input-group">
            <label>Custom Title (Default: Judul Undangan)</label>
            <input
              className="settings-input"
              value={data.title || ''}
              onChange={e => onChange({ title: e.target.value })}
              placeholder="Kosongkan untuk pakai judul default"
            />
          </div>
          <div className="input-group">
            <label>Custom Subtitle / Kicker</label>
            <input
              className="settings-input"
              value={data.subtitle || ''}
              onChange={e => onChange({ subtitle: e.target.value })}
              placeholder="Kosongkan untuk pakai subtitle cover"
            />
          </div>
          <div className="input-group">
            <label>Custom Date</label>
            <input
              className="settings-input"
              value={data.date || ''}
              onChange={e => onChange({ date: e.target.value })}
              placeholder="Contoh: Saturday, 12 December 2026"
            />
          </div>

          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={data.showMonogram ?? true}
                onChange={e => onChange({ showMonogram: e.target.checked })}
              />
              Tampilkan Monogram Crest Badge
            </label>
            <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={data.showGuestTag ?? true}
                onChange={e => onChange({ showGuestTag: e.target.checked })}
              />
              Tampilkan Tag Nama Tamu ("Khusus Kepada Yth:")
            </label>
            <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={data.showScrollGuide ?? true}
                onChange={e => onChange({ showScrollGuide: e.target.checked })}
              />
              Tampilkan Indikator Gulir Mouse
            </label>
          </div>
        </div>
      </>
    )
  }

  // ── COVER ────────────────────────────────────────────────────────────
  if (type === 'cover') {
    return (
      <>
        <div className="settings-section">
          <span className="label-caps">Layout Style</span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
            {[['classic','Classic Full'],['arch','Arch Window'],['editorial','Editorial'],['minimal','Minimal']].map(([val, lbl]) => (
              <button key={val} type="button" onClick={() => onChange({ coverLayout: val })}
                className={`btn-tabs-choice ${(data.coverLayout || 'classic') === val ? 'active' : ''}`}>{lbl}</button>
            ))}
          </div>
        </div>
        <div className="settings-section">
          <span className="label-caps">Media Cover</span>
          <div style={{ marginTop: 8 }}>
            <MediaUploader
              currentUrl={data.backgroundImage}
              onUpload={(url) => onChange({ backgroundImage: url })}
              withCrop={true}
              cropAspectRatio={9 / 16}
              cropTitle="Potong Foto Cover (9:16)"
            />
          </div>
          <div className="input-group">
            <label>Or paste URL</label>
            <input className="settings-input" value={data.backgroundImage || ''} onChange={e => onChange({ backgroundImage: e.target.value })} placeholder="https://..." />
          </div>
          {data.backgroundImage && (
            <>
              <div style={{ marginTop: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>Overlay Opacity</label>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--olive)' }}>{Math.round((data.overlayOpacity ?? 0.4) * 100)}%</span>
                </div>
                <input type="range" min={0} max={1} step={0.05} value={data.overlayOpacity ?? 0.4} onChange={e => onChange({ overlayOpacity: Number(e.target.value) })} style={{ width: '100%', accentColor: 'var(--olive)' }} />
              </div>
              <div className="input-group">
                <label>Overlay Color</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
                  <input type="color" value={data.overlayColor || '#000000'} onChange={e => onChange({ overlayColor: e.target.value })} style={{ width: 36, height: 36, padding: 2, border: '1px solid var(--border-color)', borderRadius: 6, cursor: 'pointer' }} />
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{data.overlayColor || '#000000'}</span>
                </div>
              </div>
            </>
          )}
        </div>
        <div className="settings-section">
          <span className="label-caps">Content Texts</span>
          <div className="input-group">
            <label>Subtitle</label>
            <input className="settings-input" value={data.subtitle || ''} onChange={e => onChange({ subtitle: e.target.value })} placeholder="We Are Getting Married" />
          </div>
          <div className="input-group">
            <label>Couple Name</label>
            <input className="settings-input" value={data.coupleName || ''} onChange={e => onChange({ coupleName: e.target.value })} placeholder="Romeo & Juliet" />
          </div>
          <div className="input-group">
            <label>Date Label</label>
            <input className="settings-input" value={data.date || ''} onChange={e => onChange({ date: e.target.value })} placeholder="Monday, March 30, 2026" />
          </div>
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
              <input type="checkbox" checked={data.showGuestName ?? true} onChange={e => onChange({ showGuestName: e.target.checked })} />
              Show Guest Name Card
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
                style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-panel)', cursor: 'pointer', fontSize: 11, color: 'var(--text-secondary)' }}>{p.label}</button>
            ))}
          </div>
        </div>
        <div className="settings-section">
          <span className="label-caps">Typography</span>
          <div className="input-group">
            <label>Font Family</label>
            <select className="settings-select" value={data.fontFamily || 'Gambarino'} onChange={e => onChange({ fontFamily: e.target.value })}>
              <option value="Gambarino">Gambarino (Serif)</option>
              <option value="Inter">Inter (Sans Serif)</option>
              <option value="Outfit">Outfit (Clean Sans)</option>
              <option value="Playfair Display">Playfair Display (Classy Serif)</option>
              <option value="Great Vibes">Great Vibes (Formal Calligraphy)</option>
              <option value="Montserrat">Montserrat</option>
              <option value="Sacramento">Sacramento</option>
              <option value="Cinzel">Cinzel (Roman Caps)</option>
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
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>Letter Spacing</label>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--olive)' }}>{data.letterSpacing || 0}em</span>
            </div>
            <input type="range" min={-0.05} max={0.3} step={0.01} value={data.letterSpacing || 0} onChange={e => onChange({ letterSpacing: Number(e.target.value) })} style={{ width: '100%', accentColor: 'var(--olive)' }} />
          </div>
          <div style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>Line Height</label>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--olive)' }}>{data.lineHeight || 1.2}</span>
            </div>
            <input type="range" min={0.9} max={2.5} step={0.05} value={data.lineHeight || 1.2} onChange={e => onChange({ lineHeight: Number(e.target.value) })} style={{ width: '100%', accentColor: 'var(--olive)' }} />
          </div>
          <div style={{ marginTop: 10 }}>
            <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
              <input type="checkbox" checked={data.textShadow || false} onChange={e => onChange({ textShadow: e.target.checked })} />
              Enable Subtle Text Shadow
            </label>
          </div>
        </div>
        <div className="settings-section">
          <span className="label-caps">Color</span>
          <div className="color-swatches" style={{ marginTop: 8 }}>
            {['#565F34', '#BE1A32', '#C4A882', '#8A8A8A', '#2D2D2D'].map(c => (
              <button key={c} className={`swatch ${data.color === c ? 'active' : ''}`} style={{ background: c }} onClick={() => onChange({ color: c })} />
            ))}
            <input type="color" value={data.color || '#2D2D2D'} onChange={e => onChange({ color: e.target.value })} className="swatch-picker" />
          </div>
        </div>
        <div className="settings-section">
          <span className="label-caps">Content Text</span>
          <textarea className="settings-textarea" value={data.content || ''} onChange={e => onChange({ content: e.target.value })} rows={3} />
        </div>
      </>
    )
  }

  // ── PARAGRAPH ─────────────────────────────────────────────────────────
  if (type === 'paragraph') {
    return (
      <>
        <div className="settings-section">
          <span className="label-caps">Typography</span>
          <div className="input-group">
            <label>Font Family</label>
            <select className="settings-select" value={data.fontFamily || 'Inter'} onChange={e => onChange({ fontFamily: e.target.value })}>
              <option value="Inter">Inter (Sans Serif)</option>
              <option value="Outfit">Outfit (Clean Sans)</option>
              <option value="Gambarino">Gambarino (Serif)</option>
              <option value="Georgia">Georgia</option>
              <option value="Montserrat">Montserrat</option>
            </select>
          </div>
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
          <div className="input-group" style={{ marginTop: 8 }}>
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
            {['#8A8A8A', '#2D2D2D', '#565F34', '#C4A882'].map(c => (
              <button key={c} className={`swatch ${data.color === c ? 'active' : ''}`} style={{ background: c }} onClick={() => onChange({ color: c })} />
            ))}
            <input type="color" value={data.color || '#8A8A8A'} onChange={e => onChange({ color: e.target.value })} className="swatch-picker" />
          </div>
        </div>
        <div className="settings-section">
          <span className="label-caps">Paragraph Content</span>
          <textarea className="settings-textarea" value={data.content || ''} onChange={e => onChange({ content: e.target.value })} rows={5} placeholder="Use Enter for new lines" />
        </div>
      </>
    )
  }

  // ── THANK YOU ─────────────────────────────────────────────────────────
  if (type === 'thankYou') {
    return (
      <div className="settings-section">
        <span className="label-caps">Content</span>
        <div className="input-group">
          <label>Title</label>
          <input className="settings-input" value={data.title || ''} onChange={e => onChange({ title: e.target.value })} placeholder="Terima Kasih" />
        </div>
        <div className="input-group">
          <label>Description</label>
          <textarea className="settings-textarea" value={data.description || ''} onChange={e => onChange({ description: e.target.value })} rows={4} />
        </div>
        <div className="input-group">
          <label>Signature Left</label>
          <input className="settings-input" value={data.signature1 || ''} onChange={e => onChange({ signature1: e.target.value })} placeholder="Keluarga Bpk..." />
        </div>
        <div className="input-group">
          <label>Signature Right</label>
          <input className="settings-input" value={data.signature2 || ''} onChange={e => onChange({ signature2: e.target.value })} placeholder="Keluarga Ibu..." />
        </div>
        <div className="input-group">
          <label>Couple Signature Script</label>
          <input className="settings-input" value={data.coupleSignature || ''} onChange={e => onChange({ coupleSignature: e.target.value })} placeholder="Romeo & Juliet" />
        </div>
      </div>
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
                className={`btn-tabs-choice ${(data.style || 'framed') === val ? 'active' : ''}`}>{lbl}</button>
            ))}
          </div>
        </div>
        <div className="settings-section">
          <span className="label-caps">Quote Texts</span>
          <div className="input-group">
            <label>Verse / Quote</label>
            <textarea className="settings-textarea" value={data.text || ''} onChange={e => onChange({ text: e.target.value })} rows={4} placeholder="Your quote..." />
          </div>
          <div className="input-group">
            <label>Author / Source</label>
            <input className="settings-input" value={data.source || ''} onChange={e => onChange({ source: e.target.value })} placeholder="— QS. Ar-Rum: 21" />
          </div>
        </div>
      </>
    )
  }

  // ── PHOTO ─────────────────────────────────────────────────────────────
  if (type === 'photo') {
    return (
      <>
        <div className="settings-section">
          <span className="label-caps">Media File</span>
          <div style={{ marginTop: 8 }}>
            <MediaUploader currentUrl={data.url} onUpload={(url) => onChange({ url })} />
          </div>
          <div className="input-group">
            <label>Or paste URL</label>
            <input className="settings-input" value={data.url || ''} onChange={e => onChange({ url: e.target.value })} placeholder="https://..." />
          </div>
          <div className="input-group">
            <label>Caption text</label>
            <input className="settings-input" value={data.caption || ''} onChange={e => onChange({ caption: e.target.value })} />
          </div>
        </div>
        <div className="settings-section">
          <span className="label-caps">Border & Ratio</span>
          <div className="input-group">
            <label>Aspect Ratio</label>
            <select className="settings-select" value={data.aspectRatio || 'auto'} onChange={e => onChange({ aspectRatio: e.target.value })}>
              <option value="auto">Auto</option>
              <option value="1/1">Square (1:1)</option>
              <option value="4/3">Landscape (4:3)</option>
              <option value="16/9">Widescreen (16:9)</option>
              <option value="3/4">Portrait (3:4)</option>
            </select>
          </div>
          <div className="input-group">
            <label>Border Style</label>
            <select className="settings-select" value={data.borderStyle || 'none'} onChange={e => onChange({ borderStyle: e.target.value })}>
              <option value="none">None</option>
              <option value="shadow">Drop Shadow</option>
              <option value="solid">Solid Border</option>
            </select>
          </div>
        </div>
      </>
    )
  }

  // ── PHOTO FRAME ───────────────────────────────────────────────────────
  if (type === 'photoFrame') {
    return (
      <>
        <div className="settings-section">
          <span className="label-caps">Frame Mode</span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
            {[['polaroid','Polaroid'],['natural','Natural'],['film','Film Strip'],['oval','Oval Frame']].map(([val, lbl]) => (
              <button key={val} type="button" onClick={() => onChange({ frameStyle: val })}
                className={`btn-tabs-choice ${(data.frameStyle || 'polaroid') === val ? 'active' : ''}`}>{lbl}</button>
            ))}
          </div>
        </div>
        <div className="settings-section">
          <span className="label-caps">Media File</span>
          <div style={{ marginTop: 8 }}>
            <MediaUploader currentUrl={data.url} onUpload={(url) => onChange({ url })} />
          </div>
          <div className="input-group">
            <label>Or paste URL</label>
            <input className="settings-input" value={data.url || ''} onChange={e => onChange({ url: e.target.value })} placeholder="https://..." />
          </div>
          <div className="input-group">
            <label>Caption</label>
            <input className="settings-input" value={data.caption || ''} onChange={e => onChange({ caption: e.target.value })} />
          </div>
        </div>
      </>
    )
  }

  // ── VIDEO ─────────────────────────────────────────────────────────────
  if (type === 'video') {
    return (
      <div className="settings-section">
        <span className="label-caps">Video settings</span>
        <div style={{ marginTop: 8 }}>
          <MediaUploader currentUrl={data.url} onUpload={(url) => onChange({ url })} />
        </div>
        <div className="input-group">
          <label>Or Video URL (MP4, YouTube, Vimeo)</label>
          <input className="settings-input" value={data.url || ''} onChange={e => onChange({ url: e.target.value })} placeholder="youtube.com/watch..." />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
          <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="checkbox" checked={data.autoplay || false} onChange={e => onChange({ autoplay: e.target.checked })} />
            Autoplay (Muted)
          </label>
          <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="checkbox" checked={data.loop || false} onChange={e => onChange({ loop: e.target.checked })} />
            Loop Video
          </label>
        </div>
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
              className={`btn-tabs-choice ${(data.layoutMode || 'masonry') === val ? 'active' : ''}`}>{lbl}</button>
          ))}
        </div>
        <div className="input-group">
          <label>Columns (Grid / Masonry)</label>
          <select className="settings-select" value={data.columns || 2} onChange={e => onChange({ columns: Number(e.target.value) })}>
            <option value={2}>2 Columns</option>
            <option value={3}>3 Columns</option>
          </select>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, margin: '16px 0' }}>
          {(data.images || []).map((img, i) => (
            <div key={i} style={{ position: 'relative', aspectRatio: '1/1', borderRadius: 6, overflow: 'hidden', border: '1px solid var(--border-color)' }}>
              <MediaRenderer src={img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <button type="button" onClick={() => {
                const newImgs = [...(data.images || [])]; newImgs.splice(i, 1); onChange({ images: newImgs });
              }} style={{ position: 'absolute', top: 2, right: 2, width: 18, height: 18, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', cursor: 'pointer', fontSize: 10 }}>✕</button>
            </div>
          ))}
        </div>
        <MediaUploader multiple={true} currentUrl="" onUpload={(newUrls) => onChange({ images: [...(data.images || []), ...newUrls] })} />
      </div>
    )
  }

  // ── LOCATION ──────────────────────────────────────────────────────────
  if (type === 'location') {
    const events = data.events || []
    return (
      <div className="settings-section">
        <span className="label-caps">Map display mode</span>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          {[['button','Directions Button'],['iframe','Interactive Map']].map(([val, lbl]) => (
            <button key={val} type="button" onClick={() => onChange({ mapDisplay: val })}
              className={`btn-tabs-choice ${(data.mapDisplay || 'button') === val ? 'active' : ''}`}>{lbl}</button>
          ))}
        </div>
        <span className="label-caps" style={{ display: 'block', marginTop: 20 }}>Events List</span>
        {events.map((event, i) => (
          <div key={i} style={{ border: '1px solid var(--border-color)', padding: 12, borderRadius: 8, marginTop: 10 }}>
            <div className="input-group">
              <label>Event Name</label>
              <input className="settings-input" value={event.name || ''} placeholder="Akad / Resepsi" onChange={e => {
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
            <div className="input-group">
              <label>Venue Name</label>
              <input className="settings-input" value={event.venue || ''} onChange={e => {
                const newEvts = [...events]; newEvts[i] = { ...event, venue: e.target.value }; onChange({ events: newEvts });
              }} />
            </div>
            <div className="input-group">
              <label>Address Details</label>
              <input className="settings-input" value={event.address || ''} onChange={e => {
                const newEvts = [...events]; newEvts[i] = { ...event, address: e.target.value }; onChange({ events: newEvts });
              }} />
            </div>
            <div className="input-group">
              <label>Maps Share URL</label>
              <input className="settings-input" value={event.mapUrl || ''} onChange={e => {
                const newEvts = [...events]; newEvts[i] = { ...event, mapUrl: e.target.value }; onChange({ events: newEvts });
              }} />
            </div>
            <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop: 8, color: 'var(--red)' }} onClick={() => {
              const newEvts = [...events]; newEvts.splice(i, 1); onChange({ events: newEvts });
            }}>Remove Event</button>
          </div>
        ))}
        <button type="button" className="btn btn-outline btn-sm" style={{ width: '100%', marginTop: 12 }} onClick={() => {
          onChange({ events: [...events, { name: '', date: '', time: '', venue: '', address: '', mapUrl: '' }] })
        }}>+ Add Event Section</button>
      </div>
    )
  }

  // ── COUNTDOWN ─────────────────────────────────────────────────────────
  if (type === 'countdown') {
    return (
      <div className="settings-section">
        <span className="label-caps">Countdown Target</span>
        <div className="input-group">
          <label>Target Date & Time</label>
          <input type="datetime-local" className="settings-input" value={data.targetDate?.slice(0, 16) || ''} onChange={e => onChange({ targetDate: e.target.value })} />
        </div>
        <div className="input-group">
          <label>Widget Label</label>
          <input className="settings-input" value={data.label || ''} onChange={e => onChange({ label: e.target.value })} placeholder="Counting down to wedding day" />
        </div>
        <div className="input-group">
          <label>Box Style</label>
          <select className="settings-select" value={data.style || 'boxed'} onChange={e => onChange({ style: e.target.value })}>
            <option value="boxed">Boxed</option>
            <option value="outlined">Outlined</option>
            <option value="minimal">Minimal</option>
          </select>
        </div>
      </div>
    )
  }

  // ── SCHEDULE ──────────────────────────────────────────────────────────
  if (type === 'schedule') {
    const items = data.items || []
    return (
      <div className="settings-section">
        <span className="label-caps">Timeline Items</span>
        {items.map((item, i) => (
          <div key={i} style={{ border: '1px solid var(--border-color)', padding: 12, borderRadius: 8, marginTop: 10 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <input className="settings-input" style={{ width: 80 }} value={item.time || ''} placeholder="08:00" onChange={e => {
                const ni = [...items]; ni[i] = { ...item, time: e.target.value }; onChange({ items: ni });
              }} />
              <input className="settings-input" style={{ flex: 1 }} value={item.title || ''} placeholder="Event title" onChange={e => {
                const ni = [...items]; ni[i] = { ...item, title: e.target.value }; onChange({ items: ni });
              }} />
            </div>
            <textarea className="settings-textarea" style={{ marginTop: 8 }} value={item.description || ''} placeholder="Description..." onChange={e => {
              const ni = [...items]; ni[i] = { ...item, description: e.target.value }; onChange({ items: ni });
            }} />
            <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop: 8, color: 'var(--red)' }} onClick={() => {
              const ni = [...items]; ni.splice(i, 1); onChange({ items: ni });
            }}>Remove Item</button>
          </div>
        ))}
        <button type="button" className="btn btn-outline btn-sm" style={{ width: '100%', marginTop: 12 }} onClick={() => onChange({ items: [...items, { time: '', title: '', description: '', icon: '' }] })}>+ Add Step</button>
      </div>
    )
  }

  // ── COUPLE ────────────────────────────────────────────────────────────
  if (type === 'couple') {
    return (
      <div className="settings-section">
        <span className="label-caps">Couple Profiles</span>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          {[['staggered','Staggered'],['side-by-side','Side by Side']].map(([val, lbl]) => (
            <button key={val} type="button" onClick={() => onChange({ layout: val })}
              className={`btn-tabs-choice ${(data.layout || 'staggered') === val ? 'active' : ''}`}>{lbl}</button>
          ))}
        </div>
        <div className="input-group">
          <label>Photo Crop Shape</label>
          <select className="settings-select" value={data.photoShape || 'portrait'} onChange={e => onChange({ photoShape: e.target.value })}>
            <option value="portrait">Arch Portrait</option>
            <option value="circle">Circle</option>
            <option value="rounded">Rounded Square</option>
          </select>
        </div>

        <div style={{ border: '1px solid var(--border-color)', padding: 12, borderRadius: 8, marginTop: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 700 }}>Person 1 (Groom/Bride)</label>
          <input className="settings-input" value={data.name1 || ''} placeholder="Name" onChange={e => onChange({ name1: e.target.value })} />
          <input className="settings-input" value={data.title1 || ''} placeholder="Parenthood bio / details" onChange={e => onChange({ title1: e.target.value })} />
          <div style={{ marginTop: 8 }}>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Profile Image</label>
            <MediaUploader currentUrl={data.photo1} onUpload={url => onChange({ photo1: url })} />
          </div>
          <input className="settings-input" value={data.instagram1 || ''} placeholder="Instagram username" onChange={e => onChange({ instagram1: e.target.value })} />
        </div>

        <div style={{ border: '1px solid var(--border-color)', padding: 12, borderRadius: 8, marginTop: 12 }}>
          <label style={{ fontSize: 12, fontWeight: 700 }}>Person 2 (Groom/Bride)</label>
          <input className="settings-input" value={data.name2 || ''} placeholder="Name" onChange={e => onChange({ name2: e.target.value })} />
          <input className="settings-input" value={data.title2 || ''} placeholder="Parenthood bio / details" onChange={e => onChange({ title2: e.target.value })} />
          <div style={{ marginTop: 8 }}>
            <label style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Profile Image</label>
            <MediaUploader currentUrl={data.photo2} onUpload={url => onChange({ photo2: url })} />
          </div>
          <input className="settings-input" value={data.instagram2 || ''} placeholder="Instagram username" onChange={e => onChange({ instagram2: e.target.value })} />
        </div>
      </div>
    )
  }

  // ── STORY ─────────────────────────────────────────────────────────────
  if (type === 'story') {
    const items = data.items || []
    return (
      <div className="settings-section">
        <span className="label-caps">Milestones Timeline</span>
        {items.map((item, i) => (
          <div key={i} style={{ border: '1px solid var(--border-color)', padding: 12, borderRadius: 8, marginTop: 10 }}>
            <input className="settings-input" value={item.date || ''} placeholder="Year (e.g. 2020)" onChange={e => {
              const ni = [...items]; ni[i] = { ...item, date: e.target.value }; onChange({ items: ni });
            }} />
            <input className="settings-input" value={item.title || ''} placeholder="Title (e.g. First Meeting)" onChange={e => {
              const ni = [...items]; ni[i] = { ...item, title: e.target.value }; onChange({ items: ni });
            }} />
            <textarea className="settings-textarea" value={item.description || ''} placeholder="Describe the memory..." onChange={e => {
              const ni = [...items]; ni[i] = { ...item, description: e.target.value }; onChange({ items: ni });
            }} rows={3} />
            <div style={{ marginTop: 8 }}>
              <label style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Event Photo</label>
              <MediaUploader currentUrl={item.photo} onUpload={url => {
                const ni = [...items]; ni[i] = { ...item, photo: url }; onChange({ items: ni });
              }} />
            </div>
            <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop: 8, color: 'var(--red)' }} onClick={() => {
              const ni = [...items]; ni.splice(i, 1); onChange({ items: ni });
            }}>Remove Milestone</button>
          </div>
        ))}
        <button type="button" className="btn btn-outline btn-sm" style={{ width: '100%', marginTop: 12 }} onClick={() => onChange({ items: [...items, { date: '', title: '', description: '', photo: '' }] })}>+ Add Milestone</button>
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
          <div className="input-group">
            <label>Title</label>
            <input className="settings-input" value={data.title || ''} placeholder="Dress Code" onChange={e => onChange({ title: e.target.value })} />
          </div>
          <div className="input-group">
            <label>Description</label>
            <textarea className="settings-textarea" value={data.description || ''} onChange={e => onChange({ description: e.target.value })} rows={3} />
          </div>
          <div className="input-group">
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
              }} style={{ width: 36, height: 36, padding: 2, border: '1px solid var(--border-color)', borderRadius: 6, cursor: 'pointer', flexShrink: 0 }} />
              <input className="settings-input" value={swatch.label || ''} placeholder="Color name" onChange={e => {
                const ns = [...swatches]; ns[i] = { ...swatch, label: e.target.value }; onChange({ swatches: ns });
              }} style={{ flex: 1, marginTop: 0 }} />
              <button type="button" onClick={() => {
                const ns = [...swatches]; ns.splice(i, 1); onChange({ swatches: ns });
              }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 4 }}>✕</button>
            </div>
          ))}
          <button type="button" className="btn btn-outline btn-sm" style={{ width: '100%', marginTop: 12 }} onClick={() => onChange({ swatches: [...swatches, { color: '#EDE9E7', label: 'Color' }] })}>+ Add Color</button>
        </div>
      </>
    )
  }

  // ── SOCIAL SHARE ──────────────────────────────────────────────────────
  if (type === 'socialShare') {
    return (
      <div className="settings-section">
        <span className="label-caps">Social Share Config</span>
        <div className="input-group">
          <label>Pre-filled Share Message</label>
          <textarea className="settings-textarea" value={data.message || ''} onChange={e => onChange({ message: e.target.value })} rows={4} />
        </div>
      </div>
    )
  }

  // ── WEDDING AR FILTER ─────────────────────────────────────────────────
  if (type === 'weddingAR') {
    return (
      <div className="settings-section">
        <span className="label-caps">AR Filter Settings</span>
        <div className="input-group">
          <label>Filter Title</label>
          <input className="settings-input" value={data.title || ''} onChange={e => onChange({ title: e.target.value })} />
        </div>
        <div className="input-group">
          <label>Description text</label>
          <textarea className="settings-textarea" value={data.subtitle || ''} onChange={e => onChange({ subtitle: e.target.value })} rows={3} />
        </div>
        <div className="input-group">
          <label>AR Filter URL</label>
          <input className="settings-input" value={data.url || ''} onChange={e => onChange({ url: e.target.value })} placeholder="Instagram effect link" />
        </div>
        <div style={{ marginTop: 12 }}>
          <label style={{ fontSize: 11, color: 'var(--text-secondary)' }}>QR Code Image (optional)</label>
          <MediaUploader currentUrl={data.qrCode} onUpload={url => onChange({ qrCode: url })} />
        </div>
      </div>
    )
  }

  // ── RSVP FORM ─────────────────────────────────────────────────────────
  if (type === 'rsvp') {
    return (
      <div className="settings-section">
        <span className="label-caps">RSVP Config</span>
        <div className="input-group">
          <label>Form Title</label>
          <input className="settings-input" value={data.title || ''} onChange={e => onChange({ title: e.target.value })} />
        </div>
        <div className="input-group">
          <label>Confirmation success toast message</label>
          <input className="settings-input" value={data.confirmationMessage || ''} onChange={e => onChange({ confirmationMessage: e.target.value })} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
          <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="checkbox" checked={data.showGuestCount !== false} onChange={e => onChange({ showGuestCount: e.target.checked })} />
            Tampilkan Pilihan Jumlah Tamu (Pax)
          </label>
          <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="checkbox" checked={data.showSessionChoice !== false} onChange={e => onChange({ showSessionChoice: e.target.checked })} />
            Tampilkan Pilihan Sesi (Akad / Resepsi)
          </label>
          <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="checkbox" checked={data.showQrTicket !== false} onChange={e => onChange({ showQrTicket: e.target.checked })} />
            Tampilkan E-Ticket QR Pass setelah RSVP Hadir
          </label>
        </div>
      </div>
    )
  }

  // ── DIGITAL GIFT ──────────────────────────────────────────────────────
  if (type === 'gift') {
    const accounts = data.accounts || []
    return (
      <div className="settings-section">
        <span className="label-caps">Gift Configuration</span>
        <div className="input-group">
          <label>Title</label>
          <input className="settings-input" value={data.title || ''} onChange={e => onChange({ title: e.target.value })} />
        </div>
        <div className="input-group">
          <label>Description subtitle</label>
          <textarea className="settings-textarea" value={data.subtitle || ''} onChange={e => onChange({ subtitle: e.target.value })} rows={3} />
        </div>
        
        <span className="label-caps" style={{ display: 'block', marginTop: 20 }}>Bank/E-wallet Accounts</span>
        {accounts.map((acc, i) => (
          <div key={i} style={{ border: '1px solid var(--border-color)', padding: 12, borderRadius: 8, marginTop: 10 }}>
            <input className="settings-input" value={acc.bankName || ''} placeholder="Bank/E-Wallet (e.g. BCA)" onChange={e => {
              const na = [...accounts]; na[i] = { ...acc, bankName: e.target.value }; onChange({ accounts: na });
            }} />
            <input className="settings-input" value={acc.accountNumber || ''} placeholder="Account Number" onChange={e => {
              const na = [...accounts]; na[i] = { ...acc, accountNumber: e.target.value }; onChange({ accounts: na });
            }} />
            <input className="settings-input" value={acc.accountName || ''} placeholder="Account Holder Name" onChange={e => {
              const na = [...accounts]; na[i] = { ...acc, accountName: e.target.value }; onChange({ accounts: na });
            }} />
            <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop: 8, color: 'var(--red)' }} onClick={() => {
              const na = [...accounts]; na.splice(i, 1); onChange({ accounts: na });
            }}>Remove Account</button>
          </div>
        ))}
        <button type="button" className="btn btn-outline btn-sm" style={{ width: '100%', marginTop: 12 }} onClick={() => {
          onChange({ accounts: [...accounts, { bankName: '', accountNumber: '', accountName: '' }] })
        }}>+ Add Account</button>

        <span className="label-caps" style={{ display: 'block', marginTop: 20 }}>Alamat Kirim Kado Fisik (Opsional)</span>
        <div className="input-group">
          <label>Nama Penerima Kado</label>
          <input className="settings-input" value={data.physicalRecipient || ''} onChange={e => onChange({ physicalRecipient: e.target.value })} placeholder="Contoh: Larasati Putri" />
        </div>
        <div className="input-group">
          <label>Nomor HP Penerima</label>
          <input className="settings-input" value={data.physicalPhone || ''} onChange={e => onChange({ physicalPhone: e.target.value })} placeholder="0812xxxx" />
        </div>
        <div className="input-group">
          <label>Alamat Lengkap Pengiriman</label>
          <textarea className="settings-textarea" rows={3} value={data.physicalAddress || ''} onChange={e => onChange({ physicalAddress: e.target.value })} placeholder="Jl. Wijaya II No. 48, Kebayoran Baru..." />
        </div>

        <div style={{ marginTop: 16 }}>
          <label style={{ fontSize: 11, color: 'var(--text-secondary)' }}>QRIS Code Image</label>
          <MediaUploader currentUrl={data.qrisImage} onUpload={url => onChange({ qrisImage: url })} />
        </div>
      </div>
    )
  }

  // ── LIVE STREAMING ────────────────────────────────────────────────────
  if (type === 'liveStreaming') {
    return (
      <div className="settings-section">
        <span className="label-caps">Live Stream Setup</span>
        <div className="input-group">
          <label>Title</label>
          <input className="settings-input" value={data.title || ''} onChange={e => onChange({ title: e.target.value })} />
        </div>
        <div className="input-group">
          <label>Description</label>
          <textarea className="settings-textarea" value={data.description || ''} onChange={e => onChange({ description: e.target.value })} rows={3} />
        </div>
        <div className="input-group">
          <label>Provider</label>
          <select className="settings-select" value={data.provider || 'youtube'} onChange={e => onChange({ provider: e.target.value })}>
            <option value="youtube">YouTube Live</option>
            <option value="zoom">Zoom Meeting</option>
            <option value="custom">Custom Link / Webcast</option>
          </select>
        </div>
        <div className="input-group">
          <label>Stream / Meeting URL</label>
          <input className="settings-input" value={data.url || ''} onChange={e => onChange({ url: e.target.value })} placeholder="https://..." />
        </div>
      </div>
    )
  }

  // ── ORNAMENT / DIVIDER ────────────────────────────────────────────────
  if (type === 'ornament' || type === 'divider') {
    return (
      <div className="settings-section">
        <span className="label-caps">Ornament Divider</span>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
          {[['floral','Floral'],['line','Solid Line'],['dots','Dotted'],['wave','Wavy Line']].map(([val, lbl]) => (
            <button key={val} type="button" onClick={() => onChange({ style: val })}
              className={`btn-tabs-choice ${(data.style || 'floral') === val ? 'active' : ''}`}>{lbl}</button>
          ))}
        </div>
        <div style={{ marginTop: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>Ornament Width</label>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--olive)' }}>{data.width || 60}%</span>
          </div>
          <input type="range" min={20} max={100} step={5} value={data.width || 60} onChange={e => onChange({ width: Number(e.target.value) })} style={{ width: '100%', accentColor: 'var(--olive)' }} />
        </div>
      </div>
    )
  }

  // ── FLOATING ORNAMENT ──────────────────────────────────────────────────
  if (type === 'floatingOrnament') {
    return (
      <div className="settings-section">
        <span className="label-caps">Floating sticker details</span>
        <div style={{ marginTop: 8 }}>
          <MediaUploader currentUrl={data.url} onUpload={(url) => onChange({ url })} />
        </div>
        <div className="input-group">
          <label>Horizontal Align (X %)</label>
          <input type="range" min={-50} max={150} value={data.xPosition ?? 50} onChange={e => onChange({ xPosition: Number(e.target.value) })} style={{ width: '100%', accentColor: 'var(--olive)' }} />
        </div>
        <div className="input-group">
          <label>Vertical Offset (Y px)</label>
          <input type="range" min={-1000} max={1000} step={5} value={data.yPosition ?? 0} onChange={e => onChange({ yPosition: Number(e.target.value) })} style={{ width: '100%', accentColor: 'var(--olive)' }} />
        </div>
        <div className="input-group">
          <label>Rotation degrees</label>
          <input type="range" min={0} max={360} step={5} value={data.rotation ?? 0} onChange={e => onChange({ rotation: Number(e.target.value) })} style={{ width: '100%', accentColor: 'var(--olive)' }} />
        </div>
        <div className="input-group">
          <label>Scale Width (px)</label>
          <input type="range" min={20} max={500} value={data.width ?? 120} onChange={e => onChange({ width: Number(e.target.value) })} style={{ width: '100%', accentColor: 'var(--olive)' }} />
        </div>
      </div>
    )
  }

  // ── BACKGROUND MUSIC ──────────────────────────────────────────────────
  if (type === 'backgroundMusic') {
    return (
      <div className="settings-section">
        <span className="label-caps">Background Music</span>
        <div className="input-group">
          <label>Song Title / Artist Label</label>
          <input className="settings-input" value={data.songTitle || ''} onChange={e => onChange({ songTitle: e.target.value })} placeholder="Eternal Vows (Instrumental)" />
        </div>
        <div className="input-group">
          <label>MP3 Song URL</label>
          <input className="settings-input" value={data.url || ''} onChange={e => onChange({ url: e.target.value })} placeholder="https://.../music.mp3" />
        </div>
        <div className="input-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <label>Default Volume</label>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--olive)' }}>{data.volume ?? 80}%</span>
          </div>
          <input type="range" min={0} max={100} value={data.volume ?? 80} onChange={e => onChange({ volume: Number(e.target.value) })} style={{ width: '100%', accentColor: 'var(--olive)' }} />
        </div>
      </div>
    )
  }

  // ── PARTICLES EFFECT ──────────────────────────────────────────────────
  if (type === 'particles') {
    return (
      <div className="settings-section">
        <span className="label-caps">Particle Overlay Effect</span>
        <div className="input-group">
          <label>Animation Style</label>
          <select className="settings-select" value={data.effect || 'sakura'} onChange={e => onChange({ effect: e.target.value })}>
            <option value="sakura">🌸 Falling Sakura Petals</option>
            <option value="hearts">❤️ Rising Heart Emotes</option>
            <option value="snow">❄️ Winter Snowflakes</option>
            <option value="confetti">🎉 Party Confetti</option>
          </select>
        </div>
        <div className="input-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <label>Petals Count (Intensity)</label>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--olive)' }}>{data.intensity || 20} items</span>
          </div>
          <input type="range" min={5} max={40} value={data.intensity || 20} onChange={e => onChange({ intensity: Number(e.target.value) })} style={{ width: '100%', accentColor: 'var(--olive)' }} />
        </div>
      </div>
    )
  }

  // ── ENVELOPE CONFIRMATION ─────────────────────────────────────────────
  if (type === 'envelopeAnimation') {
    return (
      <div className="settings-section">
        <span className="label-caps">Opening Gate / Envelope Style</span>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
          {[
            ['arch-gate', 'Split Arch Gate'],
            ['wax-seal', 'Wax Seal Card'],
            ['editorial', 'Editorial Cover'],
          ].map(([val, lbl]) => (
            <button
              key={val}
              type="button"
              onClick={() => onChange({ gateStyle: val })}
              className={`btn-tabs-choice ${(data.gateStyle || 'arch-gate') === val ? 'active' : ''}`}
            >
              {lbl}
            </button>
          ))}
        </div>
        <div className="input-group" style={{ marginTop: 12 }}>
          <label>Monogram Crest (Optional)</label>
          <input className="settings-input" value={data.monogram || ''} onChange={e => onChange({ monogram: e.target.value })} placeholder="Auto (e.g. A & L)" />
        </div>
        <div className="input-group">
          <label>Action Button text</label>
          <input className="settings-input" value={data.openButtonText || 'Buka Undangan'} onChange={e => onChange({ openButtonText: e.target.value })} />
        </div>
        <div className="input-group">
          <label>Gate / Envelope Exterior Color</label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
            <input type="color" value={data.envelopeColor || '#344c2d'} onChange={e => onChange({ envelopeColor: e.target.value })} style={{ width: 36, height: 36, padding: 2, border: '1px solid var(--border-color)', borderRadius: 6, cursor: 'pointer' }} />
            <span style={{ fontSize: 12 }}>{data.envelopeColor || '#344c2d'}</span>
          </div>
        </div>
        <div className="input-group">
          <label>Card Paper Color</label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
            <input type="color" value={data.paperColor || '#fbf9f6'} onChange={e => onChange({ paperColor: e.target.value })} style={{ width: 36, height: 36, padding: 2, border: '1px solid var(--border-color)', borderRadius: 6, cursor: 'pointer' }} />
            <span style={{ fontSize: 12 }}>{data.paperColor || '#fbf9f6'}</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="input-group">
      <label>Content details</label>
      <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>No block-specific styles for {BLOCK_TYPES[type]?.label || type}. Customize variables in other tabs.</p>
    </div>
  )
}

function RightSettingsPanel({ block, onChange, activeTab, allBlocks }) {
  const data = block.data || {}
  
  if (activeTab === 'style') {
    return (
      <div className="settings-tab-content">
        <BlockSpecificStylePanel block={block} onChange={onChange} />
        {block.type !== 'ornament' && block.type !== 'divider' && block.type !== 'floatingOrnament' && (
          <BackgroundImageSection data={data} onChange={onChange} />
        )}
        <BlockGeneralStylePanel data={data} onChange={onChange} />
      </div>
    )
  }
  
  if (activeTab === 'layout') {
    return (
      <div className="settings-tab-content">
        <SpacingSection data={data} onChange={onChange} />
        <SizeSection data={data} onChange={onChange} />
        <div className="settings-section border-top" style={{ paddingTop: 16 }}>
          <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="checkbox" checked={data.fullWidth !== false} onChange={e => onChange({ fullWidth: e.target.checked })} />
            Full Width Layout (Edge-to-Edge)
          </label>
        </div>
      </div>
    )
  }
  
  if (activeTab === 'animation') {
    return (
      <div className="settings-tab-content">
        <AnimationSection data={data} onChange={onChange} />
        <div className="settings-section border-top" style={{ paddingTop: 16 }}>
          <span className="label-caps">Floating Hover Animation</span>
          <select className="settings-select" value={data.hoverEffect || 'none'} onChange={e => onChange({ hoverEffect: e.target.value })} style={{ marginTop: 8 }}>
            <option value="none">None</option>
            <option value="float">Float (up/down loop)</option>
            <option value="pulse">Pulse (breathe scale)</option>
            <option value="bounce">Bounce (quick hop)</option>
          </select>
        </div>
      </div>
    )
  }
  
  if (activeTab === 'responsive') {
    return (
      <div className="settings-tab-content">
        <div className="settings-section">
          <span className="label-caps">Viewport Visibility</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
            <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
              <input type="checkbox" checked={data.hideOnMobile || false} onChange={e => onChange({ hideOnMobile: e.target.checked })} />
              Hide on Mobile Devices
            </label>
            <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
              <input type="checkbox" checked={data.hideOnTablet || false} onChange={e => onChange({ hideOnTablet: e.target.checked })} />
              Hide on Tablet Devices
            </label>
            <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
              <input type="checkbox" checked={data.hideOnDesktop || false} onChange={e => onChange({ hideOnDesktop: e.target.checked })} />
              Hide on Desktop Devices
            </label>
          </div>
        </div>
      </div>
    )
  }
  
  if (activeTab === 'advanced') {
    return (
      <div className="settings-tab-content">
        <div className="settings-section">
          <div className="input-group">
            <label>Custom CSS Element ID</label>
            <input className="settings-input" value={data.customCssId || ''} onChange={e => onChange({ customCssId: e.target.value })} placeholder="e.g. custom-heading-1" />
          </div>
          <div className="input-group">
            <label>Custom Class Names</label>
            <input className="settings-input" value={data.customClassName || ''} onChange={e => onChange({ customClassName: e.target.value })} placeholder="e.g. p-heading my-custom-class" />
          </div>
          <div className="input-group">
            <label>Display Visibility Condition</label>
            <input className="settings-input" value={data.displayCondition || ''} onChange={e => onChange({ displayCondition: e.target.value })} placeholder="e.g. guestName=SpecialGuest" />
            <p style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 4 }}>Example: `guestName=VIP` shows only to VIP query link.</p>
          </div>
          <div className="input-group">
            <label>Custom inline CSS styles</label>
            <textarea className="settings-textarea" value={data.customCss || ''} onChange={e => onChange({ customCss: e.target.value })} rows={4} placeholder="background: rgba(0,0,0,0.5); opacity: 0.8;" />
          </div>
        </div>
      </div>
    )
  }
  
  if (activeTab === 'interactions') {
    return (
      <div className="settings-tab-content">
        <div className="settings-section">
          <div className="input-group">
            <label>Click Action Interaction</label>
            <select className="settings-select" value={data.clickAction || 'none'} onChange={e => onChange({ clickAction: e.target.value })}>
              <option value="none">No Action</option>
              <option value="scrollTo">Scroll to block section</option>
              <option value="openUrl">Navigate to External URL</option>
            </select>
          </div>
          
          {data.clickAction === 'scrollTo' && (
            <div className="input-group">
              <label>Target Block Destination</label>
              <select className="settings-select" value={data.clickActionTarget || ''} onChange={e => onChange({ clickActionTarget: e.target.value })}>
                <option value="">Select a block...</option>
                {allBlocks.filter(b => b.id !== block.id).map(b => (
                  <option key={b.id} value={b.id}>{BLOCK_TYPES[b.type]?.label || b.type} ({b.id.slice(0, 6)}...)</option>
                ))}
              </select>
            </div>
          )}
          
          {data.clickAction === 'openUrl' && (
            <div className="input-group">
              <label>Target Web URL</label>
              <input className="settings-input" value={data.clickActionTarget || ''} onChange={e => onChange({ clickActionTarget: e.target.value })} placeholder="https://..." />
            </div>
          )}
        </div>
      </div>
    )
  }
  
  return null
}

// ─────────────────────────────────────────────────────────────────────────────
// MEDIA UPLOADER & MODALS (IMAGE CROPPER, SETTINGS, VERSION, SEO, ACCESS AUDIT)
// ─────────────────────────────────────────────────────────────────────────────

function ImageCropperModal({ file, onCropComplete, onClose, defaultAspectRatio = 16 / 9, title = 'Potong & Sesuaikan Foto' }) {
  const [imgSrc, setImgSrc] = useState(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [rotation, setRotation] = useState(0)
  const [aspectRatio, setAspectRatio] = useState(defaultAspectRatio)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const imgRef = useRef(null)

  useEffect(() => {
    if (!file) return
    const url = URL.createObjectURL(file)
    setImgSrc(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const handleMouseDown = (e) => {
    e.preventDefault()
    setIsDragging(true)
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
  }

  const handleMouseMove = (e) => {
    if (!isDragging) return
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })
  }

  const handleMouseUp = () => setIsDragging(false)

  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      setIsDragging(true)
      setDragStart({ x: e.touches[0].clientX - pan.x, y: e.touches[0].clientY - pan.y })
    }
  }

  const handleTouchMove = (e) => {
    if (!isDragging || e.touches.length !== 1) return
    setPan({ x: e.touches[0].clientX - dragStart.x, y: e.touches[0].clientY - dragStart.y })
  }

  const handleTouchEnd = () => setIsDragging(false)

  const ASPECT_PRESETS = [
    { label: '16:9 (Desktop)', value: 16 / 9 },
    { label: '4:3 (Standard)', value: 4 / 3 },
    { label: '1:1 (Persegi)', value: 1 },
    { label: '9:16 (Story)', value: 9 / 16 },
  ]

  // Compute crop box dimensions inside standard stage area
  const stageWidth = 520
  const stageHeight = 320
  let cropWidth = stageWidth * 0.88
  let cropHeight = cropWidth / (aspectRatio || 16 / 9)
  if (cropHeight > stageHeight * 0.88) {
    cropHeight = stageHeight * 0.88
    cropWidth = cropHeight * (aspectRatio || 16 / 9)
  }

  const handlePerformCrop = async () => {
    const img = imgRef.current
    if (!img) return

    setUploading(true)
    setProgress(0)

    try {
      const exportWidth = Math.min(1920, Math.max(1200, cropWidth * 2.5))
      const exportHeight = Math.round(exportWidth / (aspectRatio || 16 / 9))

      const canvas = document.createElement('canvas')
      canvas.width = exportWidth
      canvas.height = exportHeight
      const ctx = canvas.getContext('2d')

      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'

      const ratio = exportWidth / cropWidth

      ctx.save()
      ctx.translate(exportWidth / 2, exportHeight / 2)
      ctx.translate(pan.x * ratio, pan.y * ratio)
      ctx.rotate((rotation * Math.PI) / 180)
      ctx.scale(zoom, zoom)

      const baseScale = Math.max(cropWidth / img.naturalWidth, cropHeight / img.naturalHeight)
      const drawW = img.naturalWidth * baseScale * ratio
      const drawH = img.naturalHeight * baseScale * ratio

      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH)
      ctx.restore()

      canvas.toBlob(async (blob) => {
        if (!blob) {
          alert('Gagal memproses gambar.')
          setUploading(false)
          return
        }
        try {
          const result = await uploadToCloudinary(blob, (p) => setProgress(p))
          onCropComplete(result.url)
          onClose()
        } catch (err) {
          console.error(err)
          alert('Gagal mengunggah foto: ' + err.message)
        } finally {
          setUploading(false)
        }
      }, 'image/jpeg', 0.92)
    } catch (err) {
      console.error(err)
      alert('Terjadi kesalahan saat memotong foto.')
      setUploading(false)
    }
  }

  const handleUploadOriginal = async () => {
    setUploading(true)
    setProgress(0)
    try {
      const result = await uploadToCloudinary(file, (p) => setProgress(p))
      onCropComplete(result.url)
      onClose()
    } catch (err) {
      alert('Gagal mengunggah foto: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={uploading ? undefined : onClose}>
      <div className="modal-content cropper-modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="serif-italic">{title}</h3>
          {!uploading && (
            <button type="button" onClick={onClose}><HiX size={20} /></button>
          )}
        </div>

        <div className="modal-body">
          <div
            className="cropper-stage"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div
              className="cropper-image-wrapper"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                transition: isDragging ? 'none' : 'transform 0.1s ease-out'
              }}
            >
              {imgSrc && (
                <img
                  ref={imgRef}
                  src={imgSrc}
                  alt="Crop preview"
                  style={{
                    width: cropWidth,
                    height: 'auto',
                    minHeight: cropHeight,
                    objectFit: 'cover'
                  }}
                  draggable={false}
                />
              )}
            </div>

            <div
              className="cropper-frame"
              style={{
                width: cropWidth,
                height: cropHeight,
              }}
            >
              <div className="cropper-grid">
                <div className="cropper-grid-cell" />
                <div className="cropper-grid-cell" />
                <div className="cropper-grid-cell" />
                <div className="cropper-grid-cell" />
                <div className="cropper-grid-cell" />
                <div className="cropper-grid-cell" />
                <div className="cropper-grid-cell" />
                <div className="cropper-grid-cell" />
                <div className="cropper-grid-cell" />
              </div>
            </div>
          </div>

          <p className="cropper-hint-text">
            💡 Geser / drag untuk atur posisi foto, gunakan slider untuk zoom & atur rasio crop.
          </p>

          <div className="cropper-controls">
            <div className="cropper-aspect-row">
              <span className="cropper-aspect-label">Rasio:</span>
              {ASPECT_PRESETS.map(preset => (
                <button
                  key={preset.label}
                  type="button"
                  className={`cropper-tool-btn ${Math.abs(aspectRatio - preset.value) < 0.01 ? 'active' : ''}`}
                  onClick={() => setAspectRatio(preset.value)}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="cropper-zoom-row">
              <span className="cropper-aspect-label">Zoom:</span>
              <button
                type="button"
                className="cropper-tool-btn"
                onClick={() => setZoom(z => Math.max(1, +(z - 0.1).toFixed(2)))}
              >
                −
              </button>
              <input
                type="range"
                min={1}
                max={3}
                step={0.05}
                value={zoom}
                onChange={e => setZoom(Number(e.target.value))}
                className="cropper-zoom-slider"
              />
              <button
                type="button"
                className="cropper-tool-btn"
                onClick={() => setZoom(z => Math.min(3, +(z + 0.1).toFixed(2)))}
              >
                +
              </button>
              <span style={{ fontSize: 12, minWidth: 38, textAlign: 'right', fontWeight: 600 }}>
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                className="cropper-tool-btn"
                onClick={() => setRotation(r => (r + 90) % 360)}
                title="Putar 90 Derajat"
              >
                ↻ 90°
              </button>
              <button
                type="button"
                className="cropper-tool-btn"
                onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); setRotation(0); }}
                title="Reset Posisi"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          {uploading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', justifyContent: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Mengunggah foto... {progress}%</span>
            </div>
          ) : (
            <>
              <button type="button" className="btn btn-ghost" onClick={onClose}>
                Batal
              </button>
              <button type="button" className="btn btn-outline" onClick={handleUploadOriginal} title="Unggah foto langsung tanpa dipotong">
                Gunakan Foto Asli
              </button>
              <button type="button" className="btn btn-primary" onClick={handlePerformCrop}>
                Potong & Unggah
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function MediaUploader({ currentUrl, onUpload, multiple = false, withCrop = false, cropAspectRatio = 16 / 9, cropTitle = 'Potong & Sesuaikan Foto' }) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [batchInfo, setBatchInfo] = useState({ current: 0, total: 0 })
  const [pendingCropFile, setPendingCropFile] = useState(null)
  const fileInputRef = useRef(null)

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    // If withCrop is requested for single image upload, open ImageCropperModal preview
    if (withCrop && !multiple && files[0]?.type?.startsWith('image/')) {
      setPendingCropFile(files[0])
      e.target.value = ''
      return
    }

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
        alert(`Failed to upload: ${err.message}`)
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

      {pendingCropFile && (
        <ImageCropperModal
          file={pendingCropFile}
          defaultAspectRatio={cropAspectRatio}
          title={cropTitle}
          onCropComplete={(url) => {
            onUpload(url)
            setPendingCropFile(null)
          }}
          onClose={() => setPendingCropFile(null)}
        />
      )}
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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
        <div className="modal-header">
          <h3 className="serif-italic">Invitation & Theme Settings</h3>
          <button onClick={onClose}><HiX size={20}/></button>
        </div>
        <div className="modal-body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
          <div className="input-group">
            <label>Project Title</label>
            <input className="settings-input" value={data.title} onChange={e => setData({...data, title: e.target.value})} />
          </div>
          <div className="input-group">
            <label>URL Slug</label>
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border-color)', borderRadius: 6, overflow: 'hidden', marginTop: 4 }}>
              <span style={{ padding: '0 12px', fontSize: 13, color: 'var(--text-secondary)', background: 'var(--olive-bg)', borderRight: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', height: 42 }}>/undangan/</span>
              <input className="settings-input" style={{ border: 'none', borderRadius: 0, flex: 1, padding: '10px 12px', outline: 'none', marginTop: 0 }} value={data.slug} onChange={e => setData({...data, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')})} />
            </div>
          </div>
          <div className="input-group">
            <label>Background Music URL</label>
            <input className="settings-input" value={data.musicUrl} onChange={e => setData({...data, musicUrl: e.target.value})} placeholder="https://.../song.mp3" />
          </div>

          <span className="label-caps" style={{ marginTop: 22, marginBottom: 8, display: 'block' }}>Curated Design Worlds (1-Click Palette)</span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
            {Object.values(THEME_PALETTES).map(pal => {
              const isCurrent = data.theme_primaryColor?.toLowerCase() === pal.primaryColor.toLowerCase()
              return (
                <button
                  key={pal.key}
                  type="button"
                  onClick={() => setData({
                    ...data,
                    theme_primaryColor: pal.primaryColor,
                    theme_backgroundColor: pal.backgroundColor,
                    theme_fontFamily: pal.fontFamily,
                  })}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '9px 11px',
                    borderRadius: 8,
                    border: isCurrent ? '1.5px solid var(--olive)' : '1px solid var(--border-color)',
                    background: isCurrent ? 'var(--olive-bg)' : 'var(--bg-panel)',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
                    <span style={{ width: 14, height: 14, borderRadius: '50%', background: pal.primaryColor, border: '1px solid rgba(0,0,0,0.2)' }} />
                    <span style={{ width: 14, height: 14, borderRadius: '50%', background: pal.backgroundColor, border: '1px solid rgba(0,0,0,0.2)' }} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{pal.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{pal.subtitle}</div>
                  </div>
                </button>
              )
            })}
          </div>

          <span className="label-caps" style={{ marginTop: 18, marginBottom: 8, display: 'block' }}>Custom Theme Tokens</span>
          <div className="input-group">
            <label>Base Font</label>
            <select className="settings-select" value={data.theme_fontFamily} onChange={e => setData({...data, theme_fontFamily: e.target.value})}>
              <option value="Inter">Inter (Modern Sans)</option>
              <option value="Gambarino, serif">Gambarino (Elegant Serif)</option>
              <option value="Outfit">Outfit (Clean Sans)</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
            <div className="input-group" style={{ flex: 1 }}>
              <label>Primary Color</label>
              <input type="color" className="settings-input" style={{ width: '100%', padding: 4, height: 42, cursor: 'pointer', border: '1px solid var(--border-color)', borderRadius: 6 }} value={data.theme_primaryColor} onChange={e => setData({...data, theme_primaryColor: e.target.value})} />
            </div>
            <div className="input-group" style={{ flex: 1 }}>
              <label>Background Color</label>
              <input type="color" className="settings-input" style={{ width: '100%', padding: 4, height: 42, cursor: 'pointer', border: '1px solid var(--border-color)', borderRadius: 6 }} value={data.theme_backgroundColor} onChange={e => setData({...data, theme_backgroundColor: e.target.value})} />
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => {
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
    </div>
  )
}

function VersionModal({ invitationId, currentBlocks, onRestore, onClose }) {
  const [versions, setVersions] = useState(() => {
    const saved = localStorage.getItem(`invitori_versions_${invitationId}`)
    return saved ? JSON.parse(saved) : []
  })

  const handleCreateBackup = () => {
    const newVer = {
      timestamp: new Date().toISOString(),
      blocks: currentBlocks
    }
    const updated = [newVer, ...versions].slice(0, 10)
    setVersions(updated)
    localStorage.setItem(`invitori_versions_${invitationId}`, JSON.stringify(updated))
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 450 }}>
        <div className="modal-header">
          <h3 className="serif-italic">Version History</h3>
          <button onClick={onClose}><HiX size={20}/></button>
        </div>
        <div className="modal-body">
          <button className="btn btn-outline btn-full" style={{ marginBottom: 16 }} onClick={handleCreateBackup}>
            Create Restore Point (Save current)
          </button>
          
          {versions.length === 0 ? (
            <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)', padding: '24px 0' }}>
              No restore points saved yet. Points are saved locally on this browser.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {versions.map((ver, idx) => (
                <div key={idx} className="version-history-item" style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: 12, border: '1px solid var(--border-color)', borderRadius: 8,
                  background: 'var(--bg-app)'
                }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>Version {versions.length - idx}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                      {new Date(ver.timestamp).toLocaleString()}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--olive)', marginTop: 1, fontWeight: 600 }}>
                      {ver.blocks?.length || 0} blocks
                    </div>
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={() => { onRestore(ver.blocks); onClose(); }}>
                    Restore
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function SeoModal({ coverBlock, onSave, onClose }) {
  const [seo, setSeo] = useState({
    title: coverBlock?.data?.seoTitle || coverBlock?.data?.coupleName || '',
    description: coverBlock?.data?.seoDescription || coverBlock?.data?.subtitle || '',
    image: coverBlock?.data?.seoImage || coverBlock?.data?.backgroundImage || ''
  })

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 450 }}>
        <div className="modal-header">
          <h3 className="serif-italic">SEO & Meta Settings</h3>
          <button onClick={onClose}><HiX size={20}/></button>
        </div>
        <div className="modal-body">
          <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.4 }}>
            Customize how this digital invitation appears when shared on social networks like WhatsApp, Facebook, or Twitter.
          </p>
          <div className="input-group">
            <label>Meta Title</label>
            <input className="settings-input" value={seo.title} onChange={e => setSeo({ ...seo, title: e.target.value })} placeholder="Title for link previews..." />
          </div>
          <div className="input-group">
            <label>Meta Description</label>
            <textarea className="settings-textarea" value={seo.description} onChange={e => setSeo({ ...seo, description: e.target.value })} rows={3} placeholder="Brief wedding description..." />
          </div>
          <div className="input-group">
            <label>Social OG Image</label>
            <MediaUploader currentUrl={seo.image} onUpload={url => setSeo({ ...seo, image: url })} />
            <input className="settings-input" value={seo.image} onChange={e => setSeo({ ...seo, image: e.target.value })} placeholder="Image link URL..." style={{ marginTop: 8 }} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => {
            onSave(seo)
            onClose()
          }}>Save SEO Tags</button>
        </div>
      </div>
    </div>
  )
}

function AccessAuditModal({ blocks, onClose, onSelectBlock }) {
  const issues = useMemo(() => {
    const found = []
    
    // Check cover
    const hasCover = blocks.some(b => b.type === 'cover')
    if (!hasCover) {
      found.push({
        id: 'no-cover',
        type: 'critical',
        message: 'No Hero Cover Block found. Visual invitations require a cover block for standard greetings.'
      })
    }

    // Check images lacking description
    blocks.forEach(b => {
      if (b.type === 'photo' && !b.data?.caption && !b.data?.altText) {
        found.push({
          id: b.id,
          type: 'warning',
          message: 'Single Photo block lacks an alt text description or caption for accessibility reader support.',
          blockId: b.id
        })
      }
      if (b.type === 'photoFrame' && !b.data?.caption) {
        found.push({
          id: b.id,
          type: 'warning',
          message: 'Photo Frame block has no caption text attached.',
          blockId: b.id
        })
      }
    })

    // Contrast warnings
    blocks.forEach(b => {
      if (b.data?.customBgColor && b.data?.customTextColor) {
        const bg = b.data.customBgColor.toLowerCase()
        const text = b.data.customTextColor.toLowerCase()
        if (bg === text) {
          found.push({
            id: b.id + '-contrast',
            type: 'critical',
            message: 'Block has same text color as background color override, making text invisible!',
            blockId: b.id
          })
        }
      }
    })

    return found
  }, [blocks])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 450 }}>
        <div className="modal-header">
          <h3 className="serif-italic">Accessibility & Layout Audit</h3>
          <button onClick={onClose}><HiX size={20}/></button>
        </div>
        <div className="modal-body">
          {issues.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <HiOutlineCheckCircle size={40} color="var(--olive)" />
              <p style={{ fontWeight: 600 }}>All checks passed!</p>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Your layout complies with standard web design accessibility metrics.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>We detected the following issues in your design layout:</p>
              {issues.map((issue, idx) => (
                <div key={idx} style={{
                  display: 'flex', gap: 12, padding: 12,
                  borderRadius: 8, borderLeft: `4px solid ${issue.type === 'critical' ? 'var(--red)' : '#f59e0b'}`,
                  background: 'var(--bg-app)'
                }}>
                  <div style={{ color: issue.type === 'critical' ? 'var(--red)' : '#f59e0b', marginTop: 2 }}>
                    <HiOutlineExclamationCircle size={18} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: issue.type === 'critical' ? 'var(--red)' : '#d97706' }}>
                      {issue.type}
                    </div>
                    <div style={{ fontSize: 12, marginTop: 2, color: 'var(--text-primary)', lineHeight: 1.4 }}>{issue.message}</div>
                    {issue.blockId && (
                      <button className="btn btn-ghost btn-sm" style={{ marginTop: 8, padding: '2px 8px', fontSize: 10 }} onClick={() => { onSelectBlock(issue.blockId); onClose(); }}>
                        Select Block to Fix
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function JsonModal({ blocks, onImport, onClose }) {
  const [jsonText, setJsonText] = useState(JSON.stringify(blocks, null, 2))
  const fileInputRef = useRef(null)

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonText)
    alert('JSON config copied to clipboard!')
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target.result)
        if (Array.isArray(parsed)) {
          setJsonText(JSON.stringify(parsed, null, 2))
        } else {
          alert('Invalid layout JSON format.')
        }
      } catch (err) {
        alert('Failed to parse file: ' + err.message)
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
        <div className="modal-header">
          <h3 className="serif-italic">JSON Layout Configuration</h3>
          <button onClick={onClose}><HiX size={20}/></button>
        </div>
        <div className="modal-body">
          <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 10 }}>
            Export or import blocks lists config. You can paste JSON layout details directly.
          </p>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <button className="btn btn-outline btn-sm" onClick={() => fileInputRef.current?.click()}>
              Load from File (.json)
            </button>
            <button className="btn btn-outline btn-sm" onClick={handleCopy}>
              Copy JSON
            </button>
            <input type="file" ref={fileInputRef} accept=".json" onChange={handleFileChange} style={{ display: 'none' }} />
          </div>
          <textarea
            className="settings-textarea"
            style={{ fontFamily: 'monospace', fontSize: 11, background: '#111', color: '#10b981', height: 280 }}
            value={jsonText}
            onChange={e => setJsonText(e.target.value)}
          />
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => {
            try {
              const parsed = JSON.parse(jsonText)
              if (Array.isArray(parsed)) {
                onImport(parsed)
                onClose()
              } else {
                alert('Invalid JSON: Must be an array of blocks.')
              }
            } catch (err) {
              alert('JSON Syntax Error: ' + err.message)
            }
          }}>Import Config</button>
        </div>
      </div>
    </div>
  )
}

function ShortcutsHelpModal({ onClose }) {
  const keys = [
    { key: 'Ctrl + K  /  ⌘ + K', desc: 'Open Command Action Palette' },
    { key: '?', desc: 'Open Keyboard Shortcuts Help Overlay' },
    { key: 'Ctrl + Z  /  ⌘ + Z', desc: 'Undo last change' },
    { key: 'Ctrl + Y  /  ⌘ + Y', desc: 'Redo last change' },
    { key: 'Ctrl + S  /  ⌘ + S', desc: 'Force save changes' },
    { key: 'Ctrl + D  /  ⌘ + D', desc: 'Duplicate selected block' },
    { key: 'Backspace  /  Delete', desc: 'Delete selected block (if unlocked)' },
    { key: 'Escape', desc: 'Close modals / Cancel selection' },
  ]
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 450 }}>
        <div className="modal-header">
          <h3 className="serif-italic">Keyboard Shortcuts</h3>
          <button onClick={onClose}><HiX size={20}/></button>
        </div>
        <div className="modal-body">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {keys.map((k, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: 6 }}>
                <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: 'var(--olive)' }}>{k.key}</span>
                <span style={{ fontSize: 12, color: 'var(--text-primary)' }}>{k.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// COMMAND ACTION PALETTE (Ctrl+K)
// ─────────────────────────────────────────────────────────────────────────────

function CommandPalette({ onClose, commands }) {
  const [search, setSearch] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 80)
  }, [])

  const filtered = commands.filter(c => 
    c.label.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 999999 }}>
      <div className="command-palette-modal" onClick={e => e.stopPropagation()}>
        <div className="command-palette-search">
          <HiOutlineSearch size={18} color="var(--text-secondary)" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or action..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <kbd>ESC</kbd>
        </div>
        <div className="command-palette-list">
          {filtered.length === 0 ? (
            <p className="no-commands">No actions found matching "{search}"</p>
          ) : (
            filtered.map((cmd, i) => (
              <button key={i} className="command-palette-item" onClick={() => { cmd.action(); onClose(); }}>
                <span>{cmd.label}</span>
                <span className="shortcut-desc">{cmd.shortcut || 'Action'}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EDITOR PAGE COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function EditorPage() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { 
    invitations, 
    loading,
    addInvitation, 
    addBlock: ctxAddBlock, 
    addBlocks: ctxAddBlocks, 
    updateBlock: ctxUpdateBlock, 
    deleteBlock: ctxDeleteBlock, 
    reorderBlocks, 
    updateInvitation 
  } = useInvitations()

  // Layout & UI States
  const [themeMode, setThemeMode] = useState('dark') // 'dark' | 'light'
  const [leftTab, setLeftTab] = useState('library') // 'library' | 'layers'
  const [rightTab, setRightTab] = useState('style') // 'style' | 'layout' | 'animation' | 'responsive' | 'advanced' | 'interactions'
  const [viewportMode, setViewportMode] = useState('mobile') // 'mobile' | 'tablet' | 'desktop'
  const [phoneScale, setPhoneScale] = useState(1.0)
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false)
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false)

  // Block states
  const [selectedBlockId, setSelectedBlockId] = useState(null)
  const [activeDragItem, setActiveDragItem] = useState(null)
  const [overId, setOverId] = useState(null)

  // History states (Undo/Redo)
  const [history, setHistory] = useState([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const blockSaveTimeoutRef = useRef(null)

  // Search, Categories, Favorites, Recent list
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [favorites, setFavorites] = useState([])
  const [recentBlocks, setRecentBlocks] = useState([])

  // Modal drawers toggles
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [seoOpen, setSeoOpen] = useState(false)
  const [auditOpen, setAuditOpen] = useState(false)
  const [versionOpen, setVersionOpen] = useState(false)
  const [jsonOpen, setJsonOpen] = useState(false)
  const [activeModal, setActiveModal] = useState(null)

  // Status indicators
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState(null)
  const [timeAgoText, setTimeAgoText] = useState('All changes saved')

  const hasCreated = useRef(false)
  const hasAppliedPreset = useRef(false)

  // Find invitation
  const invitation = invitations.find(inv => inv.id === id)
  const blocks = useMemo(() => (invitation?.blocks || []).filter(b => b.type !== 'navigationMenu'), [invitation?.blocks])
  const selectedBlock = blocks.find(b => b.id === selectedBlockId)

  // Setup Sensors
  const mouseSensor = useSensor(MouseSensor, { activationConstraint: { distance: 5 } })
  const pointerSensor = useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  const touchSensor = useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } })
  const sensors = useSensors(mouseSensor, pointerSensor, touchSensor)

  // Create new invitation if needed
  useEffect(() => {
    if (id === 'new' && !hasCreated.current) {
      hasCreated.current = true
      const title = searchParams.get('title') || 'Untitled Invitation'
      const presetKey = searchParams.get('preset')
      const preset = presetKey ? PRESETS[presetKey] : null
      let initialBlocks = []
      if (preset && preset.blocks) {
        initialBlocks = preset.blocks.map(b => {
          if (b.type === 'cover' || b.type === 'footer') {
            return { ...b, data: { ...b.data, coupleName: title } }
          }
          return b
        })
      }
      addInvitation({
        title,
        category: preset?.labelId || 'Wedding',
        theme: preset?.theme,
        initialBlocks,
      }).then(newInv => {
        if (newInv) {
          navigate(`/editor/${newInv.id}`, { replace: true })
        }
      })
    }
  }, [id, searchParams, addInvitation, navigate])

  // Apply preset blocks if ?preset= param exists
  useEffect(() => {
    const presetKey = searchParams.get('preset')
    if (!presetKey || hasAppliedPreset.current || !invitation) return
    if (invitation.blocks && invitation.blocks.length > 0) return

    const preset = PRESETS[presetKey]
    if (!preset || preset.blocks.length === 0) {
      hasAppliedPreset.current = true
      return
    }

    const coupleTitle = searchParams.get('title') || invitation.title
    const blocksToApply = preset.blocks.map(b => {
      if (b.type === 'cover' && coupleTitle) {
        return { ...b, data: { ...b.data, coupleName: coupleTitle } }
      }
      if (b.type === 'footer' && coupleTitle) {
        return { ...b, data: { ...b.data, coupleName: coupleTitle } }
      }
      return b
    })

    hasAppliedPreset.current = true
    setIsSaving(true)
    ctxAddBlocks(id, blocksToApply, 0).then(() => {
      setIsSaving(false)
      setLastSaved(new Date())
    }).catch(() => {
      setIsSaving(false)
    })
  }, [id, invitation, searchParams, ctxAddBlocks])

  // Local storage: Favorites and Recent
  useEffect(() => {
    const savedFavs = localStorage.getItem('invitori_favorites')
    if (savedFavs) setFavorites(JSON.parse(savedFavs))

    const savedRecents = localStorage.getItem('invitori_recent')
    if (savedRecents) setRecentBlocks(JSON.parse(savedRecents))
  }, [])

  // Initialize history when invitation blocks load for the first time
  useEffect(() => {
    if (blocks.length > 0 && history.length === 0) {
      setHistory([blocks])
      setHistoryIndex(0)
    }
  }, [blocks, history.length])

  // Keep saved relative time updated
  useEffect(() => {
    if (!lastSaved) return
    const updateRelative = () => {
      const diff = Math.floor((new Date() - lastSaved) / 1000)
      if (diff < 5) setTimeAgoText('Saved just now')
      else if (diff < 60) setTimeAgoText(`Saved ${diff}s ago`)
      else setTimeAgoText(`Saved ${Math.floor(diff / 60)}m ago`)
    }
    updateRelative()
    const interval = setInterval(updateRelative, 5000)
    return () => clearInterval(interval)
  }, [lastSaved])

  // Push list of blocks to Undo/Redo history stack
  const pushHistory = useCallback((newBlocks) => {
    setHistory(prevHistory => {
      const cleanHistory = prevHistory.slice(0, historyIndex + 1)
      return [...cleanHistory, newBlocks]
    })
    setHistoryIndex(prevIndex => prevIndex + 1)
  }, [historyIndex])

  const handleSave = useCallback(async () => {
    if (!invitation) return
    setIsSaving(true)
    try {
      await updateInvitation(invitation.id, { updatedAt: new Date().toISOString() })
      setLastSaved(new Date())
    } catch (err) {
      console.error(err)
    } finally {
      setIsSaving(false)
    }
  }, [invitation, updateInvitation])

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const prevBlocks = history[historyIndex - 1]
      setHistoryIndex(historyIndex - 1)
      reorderBlocks(invitation.id, prevBlocks)
      setLastSaved(new Date())
    }
  }, [history, historyIndex, invitation?.id, reorderBlocks])

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextBlocks = history[historyIndex + 1]
      setHistoryIndex(historyIndex + 1)
      reorderBlocks(invitation.id, nextBlocks)
      setLastSaved(new Date())
    }
  }, [history, historyIndex, invitation?.id, reorderBlocks])

  const toggleFavorite = (type) => {
    let nextFavs
    if (favorites.includes(type)) {
      nextFavs = favorites.filter(t => t !== type)
    } else {
      nextFavs = [...favorites, type]
    }
    setFavorites(nextFavs)
    localStorage.setItem('invitori_favorites', JSON.stringify(nextFavs))
  }

  const updateRecentList = (type) => {
    const nextRecents = [type, ...recentBlocks.filter(t => t !== type)].slice(0, 5)
    setRecentBlocks(nextRecents)
    localStorage.setItem('invitori_recent', JSON.stringify(nextRecents))
  }

  const addBlock = async (type, index = null) => {
    if (!invitation) return
    const targetIdx = index !== null ? index : blocks.length
    const defaults = BLOCK_TYPES[type]?.defaults || {}
    setIsSaving(true)
    try {
      await ctxAddBlock(invitation.id, type, { ...defaults }, targetIdx)
      updateRecentList(type)
      setLastSaved(new Date())
      
      // Update history
      const updatedBlocks = [...blocks]
      updatedBlocks.splice(targetIdx, 0, { id: 'temp-id', type, data: defaults })
      pushHistory(updatedBlocks)
    } catch (err) {
      console.error(err)
    } finally {
      setIsSaving(false)
    }
  }

  const deleteBlock = useCallback(async (blockId) => {
    if (!blockId || !invitation) return
    setSelectedBlockId(null)
    setIsSaving(true)
    try {
      await ctxDeleteBlock(invitation.id, blockId)
      setLastSaved(new Date())
      
      const updated = blocks.filter(b => b.id !== blockId)
      pushHistory(updated)
    } catch (err) {
      console.error(err)
    } finally {
      setIsSaving(false)
    }
  }, [invitation, blocks, ctxDeleteBlock, pushHistory])

  const updateBlock = (blockId, data) => {
    ctxUpdateBlock(invitation.id, blockId, data)
    
    // Debounce history saving for block data settings editing to avoid lag
    if (blockSaveTimeoutRef.current) clearTimeout(blockSaveTimeoutRef.current)
    blockSaveTimeoutRef.current = setTimeout(() => {
      const updated = blocks.map(b => b.id === blockId ? { ...b, data: { ...b.data, ...data } } : b)
      pushHistory(updated)
      setLastSaved(new Date())
    }, 800)
  }

  const duplicateBlock = useCallback(async (blockToClone) => {
    if (!blockToClone || !invitation) return
    const idx = blocks.findIndex(b => b.id === blockToClone.id)
    if (idx === -1) return
    setIsSaving(true)
    try {
      await ctxAddBlock(invitation.id, blockToClone.type, { ...blockToClone.data }, idx + 1)
      setLastSaved(new Date())
      const updated = [...blocks]
      updated.splice(idx + 1, 0, { ...blockToClone, id: 'temp-dup' })
      pushHistory(updated)
    } catch (err) {
      console.error(err)
    } finally {
      setIsSaving(false)
    }
  }, [invitation, blocks, ctxAddBlock, pushHistory])
  // Handle global shortcuts
  useEffect(() => {
    const handleKeydown = (e) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
      const cmdKey = isMac ? e.metaKey : e.ctrlKey

      if (cmdKey && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setCommandPaletteOpen(prev => !prev)
      } else if (e.key === '?') {
        if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
          e.preventDefault()
          setShortcutsOpen(prev => !prev)
        }
      } else if (cmdKey && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        handleUndo()
      } else if (cmdKey && e.key.toLowerCase() === 'y') {
        e.preventDefault()
        handleRedo()
      } else if (cmdKey && e.key.toLowerCase() === 's') {
        e.preventDefault()
        handleSave()
      } else if (e.key === 'Escape') {
        setCommandPaletteOpen(false)
        setShortcutsOpen(false)
        setSelectedBlockId(null)
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedBlockId && !selectedBlock?.data?.locked) {
          if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
            e.preventDefault()
            deleteBlock(selectedBlockId)
          }
        }
      } else if (cmdKey && e.key.toLowerCase() === 'd') {
        if (selectedBlockId) {
          if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
            e.preventDefault()
            duplicateBlock(selectedBlock)
          }
        }
      }
    }
    window.addEventListener('keydown', handleKeydown)
    return () => window.removeEventListener('keydown', handleKeydown)
  }, [selectedBlockId, selectedBlock, handleUndo, handleRedo, handleSave, deleteBlock, duplicateBlock])


  const moveBlockByBtn = (blockId, direction) => {
    const idx = blocks.findIndex(b => b.id === blockId)
    if (idx === -1) return
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1
    if (targetIdx < 0 || targetIdx >= blocks.length) return
    
    const nextBlocks = [...blocks]
    const [moved] = nextBlocks.splice(idx, 1)
    nextBlocks.splice(targetIdx, 0, moved)
    reorderBlocks(invitation.id, nextBlocks)
    pushHistory(nextBlocks)
    setLastSaved(new Date())
  }

  const toggleHide = (b) => {
    updateBlock(b.id, { hidden: !b.data?.hidden })
  }

  const toggleLock = (b) => {
    updateBlock(b.id, { locked: !b.data?.locked })
  }

  const collisionDetectionStrategy = useCallback((args) => {
    // 1. Prioritize pointer collisions directly hitting drop targets
    const pointerCollisions = pointerWithin(args)
    if (pointerCollisions && pointerCollisions.length > 0) {
      const blockCollision = pointerCollisions.find(c => c.id !== 'canvas' && c.id !== 'canvas-area' && !String(c.id).startsWith('palette-') && !String(c.id).startsWith('recent-'))
      if (blockCollision) {
        return [blockCollision, ...pointerCollisions.filter(c => c.id !== blockCollision.id)]
      }
      return pointerCollisions
    }
    // 2. Fall back to rect intersections
    const rectCollisions = rectIntersection(args)
    if (rectCollisions && rectCollisions.length > 0) {
      const blockCollision = rectCollisions.find(c => c.id !== 'canvas' && c.id !== 'canvas-area' && !String(c.id).startsWith('palette-') && !String(c.id).startsWith('recent-'))
      if (blockCollision) {
        return [blockCollision, ...rectCollisions.filter(c => c.id !== blockCollision.id)]
      }
      return rectCollisions
    }
    // 3. Fall back to closestCenter
    return closestCenter(args)
  }, [])

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
    if (!over) return

    if (active.data.current?.type === 'paletteItem') {
      const blockType = active.data.current.blockType
      if (!blockType) return

      // Don't drop back onto the palette itself
      const overIdStr = String(over.id)
      if (overIdStr.startsWith('palette-') || overIdStr.startsWith('recent-')) {
        return
      }

      let dropIndex = blocks.length
      if (over.id && over.id !== 'canvas' && over.id !== 'canvas-area') {
        const overIndex = blocks.findIndex(b => b.id === over.id)
        if (overIndex !== -1) dropIndex = overIndex
      }
      
      addBlock(blockType, dropIndex)
      return
    }

    if (active.id !== over.id) {
      const oldIndex = blocks.findIndex(b => b.id === active.id)
      const newIndex = blocks.findIndex(b => b.id === over.id)
      if (oldIndex !== -1 && newIndex !== -1) {
        const newBlocks = arrayMove(blocks, oldIndex, newIndex)
        reorderBlocks(invitation.id, newBlocks)
        pushHistory(newBlocks)
        setLastSaved(new Date())
      }
    }
  }

  const handlePublish = () => {
    const isPublishing = invitation.status !== 'published'
    updateInvitation(invitation.id, { status: isPublishing ? 'published' : 'draft' })
    alert(isPublishing 
      ? `Undangan berhasil dipublikasikan!\n\nLink public:\n${window.location.origin}/undangan/${invitation.slug}`
      : 'Undangan telah diubah menjadi draft.'
    )
  }

  const applyPreset = async (presetKey) => {
    const preset = PRESETS[presetKey]
    if (!preset || preset.blocks.length === 0) return
    setIsSaving(true)
    try {
      await ctxAddBlocks(id, preset.blocks)
      setLastSaved(new Date())
      pushHistory(preset.blocks)
    } catch (err) {
      console.error(err)
    } finally {
      setIsSaving(false)
    }
  }

  const saveSeoSettings = (seoData) => {
    const firstCover = blocks.find(b => b.type === 'cover')
    if (firstCover) {
      updateBlock(firstCover.id, {
        seoTitle: seoData.title,
        seoDescription: seoData.description,
        seoImage: seoData.image
      })
    } else {
      alert('SEO settings require a Cover block to exist first. Add a cover block.')
    }
  }

  // Commands lists for Command Palette (Ctrl+K)
  const commandList = [
    { label: 'Add Cover Hero Block', action: () => addBlock('cover'), shortcut: 'Essential' },
    { label: 'Add RSVP Attendance Block', action: () => addBlock('rsvp'), shortcut: 'Interactive' },
    { label: 'Add Wishes Wall Comments Block', action: () => addBlock('wishes'), shortcut: 'Interactive' },
    { label: 'Add Digital Gift Registry Block', action: () => addBlock('gift'), shortcut: 'Interactive' },
    { label: 'Add Love Story Milestones Block', action: () => addBlock('story'), shortcut: 'Story' },
    { label: 'Add Live Streaming Block', action: () => addBlock('liveStreaming'), shortcut: 'Interactive' },
    { label: 'Add Instagram AR Filter QR Block', action: () => addBlock('weddingAR'), shortcut: 'Social' },
    { label: 'Add Health Protocol Guidelines Block', action: () => addBlock('healthProtocol'), shortcut: 'Social' },
    { label: 'Add QR Entry Pass E-Invitation Block', action: () => addBlock('qrPass'), shortcut: 'Interactive' },
    { label: 'Add Background Music Block', action: () => addBlock('backgroundMusic'), shortcut: 'Decorative' },
    { label: 'Add Particles Cherry Blossom/Heart Block', action: () => addBlock('particles'), shortcut: 'Decorative' },
    { label: 'Add Envelope confirmation Folding Block', action: () => addBlock('envelopeAnimation'), shortcut: 'Decorative' },
    { label: 'Open Global SEO Tag Settings', action: () => setSeoOpen(true), shortcut: 'Ctrl+S' },
    { label: 'Trigger accessibility checker audit', action: () => setAuditOpen(true), shortcut: 'Auditor' },
    { label: 'Import Layout config from JSON File', action: () => setJsonOpen(true), shortcut: 'Import' },
    { label: 'Export Current Invitation Blocks to JSON', action: () => setJsonOpen(true), shortcut: 'Export' },
    { label: 'Open Version Restore History', action: () => setVersionOpen(true), shortcut: 'Versioning' },
    { label: 'Toggle Interface Light/Dark Mode', action: () => setThemeMode(t => t === 'dark' ? 'light' : 'dark'), shortcut: 'Mode' },
    { label: 'Zoom Canvas In', action: () => setPhoneScale(s => Math.min(s + 0.1, 1.3)), shortcut: '+' },
    { label: 'Zoom Canvas Out', action: () => setPhoneScale(s => Math.max(s - 0.1, 0.5)), shortcut: '-' },
    { label: 'Reset Canvas scale viewport', action: () => setPhoneScale(1.0), shortcut: '0' },
    { label: 'Switch Viewport to Mobile Screen', action: () => setViewportMode('mobile'), shortcut: 'Device' },
    { label: 'Switch Viewport to Tablet Screen', action: () => setViewportMode('tablet'), shortcut: 'Device' },
    { label: 'Switch Viewport to Desktop Browser', action: () => setViewportMode('desktop'), shortcut: 'Device' },
    { label: 'Show Keyboard Shortcut Overlay Help', action: () => setShortcutsOpen(true), shortcut: '?' },
  ]

  // Filtering palette items
  const filteredPaletteKeys = Object.keys(BLOCK_TYPES).filter(key => {
    const item = BLOCK_TYPES[key]
    const matchesSearch = item.label.toLowerCase().includes(searchQuery.toLowerCase())
    if (selectedCategory === 'all') return matchesSearch
    if (selectedCategory === 'favorites') return matchesSearch && favorites.includes(key)
    return matchesSearch && item.category === selectedCategory
  })

  if (id !== 'new') {
    if (loading) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#0f140e', color: '#e8dfd5', fontFamily: 'var(--font-body)' }}>
          <div style={{ width: 36, height: 36, border: '3px solid rgba(86,95,52,0.3)', borderTopColor: '#899c75', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: 16 }} />
          <p className="serif-italic" style={{ fontSize: 18 }}>Memuat studio editor...</p>
        </div>
      )
    }

    if (!invitation) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#0f140e', color: '#e8dfd5', fontFamily: 'var(--font-body)', textAlign: 'center', padding: 24 }}>
          <h2 className="serif-italic" style={{ fontSize: '2rem', marginBottom: 12 }}>Undangan Tidak Ditemukan</h2>
          <p style={{ color: '#a4aba0', maxWidth: 400, marginBottom: 24 }}>Undangan yang Anda cari mungkin telah dihapus atau Anda tidak memiliki akses.</p>
          <button className="btn btn-primary" onClick={() => navigate('/admin')}>
            Kembali ke Dashboard
          </button>
        </div>
      )
    }
  }

  const theme = invitation?.theme || {}

  return (
    <DndContext 
      sensors={sensors} 
      collisionDetection={collisionDetectionStrategy} 
      onDragStart={handleDragStart} 
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className={`editor-page ${themeMode === 'dark' ? 'editor-dark' : 'editor-light'}`}>
        
        {/* TOP TOOLBAR */}
        <div className="editor-top-bar">
          <div className="bar-section left">
            <button className="toolbar-icon-btn back-btn" onClick={() => navigate('/admin')} title="Back to Dashboard">
              <HiOutlineArrowLeft size={18} />
            </button>
            <div className="invitation-details">
              <span className="inv-title">{invitation?.title || 'Untitled Invitation'}</span>
              <div className="save-indicator">
                <span className={`save-dot ${isSaving ? 'saving' : 'saved'}`} />
                <span className="save-text">{isSaving ? 'Saving...' : timeAgoText}</span>
              </div>
            </div>
          </div>

          <div className="bar-section center">
            {/* Viewport Selectors */}
            <div className="viewport-toggle">
              <button 
                className={`viewport-btn ${viewportMode === 'mobile' ? 'active' : ''}`}
                onClick={() => setViewportMode('mobile')}
                title="Mobile Screen Port"
              >
                <HiOutlineDeviceMobile size={16} />
              </button>
              <button 
                className={`viewport-btn ${viewportMode === 'tablet' ? 'active' : ''}`}
                onClick={() => setViewportMode('tablet')}
                title="Tablet Screen Port"
              >
                <HiOutlineDeviceTablet size={16} />
              </button>
              <button 
                className={`viewport-btn ${viewportMode === 'desktop' ? 'active' : ''}`}
                onClick={() => setViewportMode('desktop')}
                title="Desktop Viewport"
              >
                <HiOutlineDesktopComputer size={16} />
              </button>
            </div>

            <div className="toolbar-separator" />

            {/* Undo/Redo */}
            <div className="undo-redo-ctrl">
              <button 
                className="toolbar-icon-btn" 
                onClick={handleUndo} 
                disabled={historyIndex <= 0}
                title="Undo last edit (Ctrl+Z)"
              >
                <HiOutlineRefresh size={16} style={{ transform: 'scaleX(-1)' }} />
              </button>
              <button 
                className="toolbar-icon-btn" 
                onClick={handleRedo} 
                disabled={historyIndex >= history.length - 1}
                title="Redo (Ctrl+Y)"
              >
                <HiOutlineRefresh size={16} />
              </button>
            </div>
          </div>

          <div className="bar-section right">
            {/* Action Tools */}
            <button className="toolbar-icon-btn" onClick={() => setActiveModal('settings')} title="Theme & Invitation Settings">
              <HiOutlineCog size={16} />
            </button>
            <button className="toolbar-icon-btn" onClick={() => setVersionOpen(true)} title="Version Restore Points">
              <HiOutlineFolderOpen size={16} />
            </button>
            <button className="toolbar-icon-btn" onClick={() => setSeoOpen(true)} title="SEO & Share Meta Tags">
              <HiOutlineDocumentText size={16} />
            </button>
            <button className="toolbar-icon-btn" onClick={() => setJsonOpen(true)} title="JSON Import/Export Code">
              <HiOutlineFolderDownload size={16} />
            </button>
            <button className="toolbar-icon-btn" onClick={() => setAuditOpen(true)} title="A11y Accessibility Audit">
              <HiOutlineCheckCircle size={16} />
            </button>
            <button className="toolbar-icon-btn theme-toggle-btn" onClick={() => setThemeMode(t => t === 'dark' ? 'light' : 'dark')} title="Toggle Light/Dark Theme">
              <span style={{ fontSize: 13 }}>{themeMode === 'dark' ? '☀️' : '🌙'}</span>
            </button>
            <button className="toolbar-icon-btn" onClick={() => setShortcutsOpen(true)} title="Keyboard Shortcuts Overlay (?)">
              <HiOutlineQuestionMarkCircle size={17} />
            </button>
            <button className="toolbar-icon-btn" onClick={() => setCommandPaletteOpen(true)} title="Command Action Palette (Ctrl+K)" style={{ fontSize: 11, fontWeight: 700 }}>
              ⌘K
            </button>

            <div className="toolbar-separator" />

            <button className="btn btn-outline btn-sm" onClick={() => window.open(`/undangan/${invitation.slug}?preview=true`, '_blank')}>
              <HiOutlineEye size={14} /> Preview
            </button>
            <button className="btn btn-primary btn-sm" onClick={handlePublish}>
              {invitation.status === 'published' ? 'Unpublish' : 'Publish'}
            </button>
          </div>
        </div>

        {/* WORKSPACE AREA */}
        <div className="editor-workspace">
          
          {/* LEFT PANEL */}
          <div className={`editor-left-panel ${leftPanelCollapsed ? 'collapsed' : ''}`}>
            <div className="panel-tabs">
              <button 
                className={`panel-tab-btn ${leftTab === 'library' ? 'active' : ''}`}
                onClick={() => { setLeftTab('library'); setLeftPanelCollapsed(false); }}
              >
                Blocks Library
              </button>
              <button 
                className={`panel-tab-btn ${leftTab === 'layers' ? 'active' : ''}`}
                onClick={() => { setLeftTab('layers'); setLeftPanelCollapsed(false); }}
              >
                Layers Manager
              </button>
              <button className="panel-collapse-arrow" onClick={() => setLeftPanelCollapsed(!leftPanelCollapsed)}>
                {leftPanelCollapsed ? <HiOutlineMenuAlt2 size={16} /> : <HiX size={14} />}
              </button>
            </div>

            <div className="panel-tab-content">
              {/* LIBRARY TAB */}
              {leftTab === 'library' && (
                <div className="library-wrapper">
                  <div className="library-search-wrapper">
                    <HiOutlineSearch size={16} color="var(--text-secondary)" />
                    <input 
                      type="text" 
                      placeholder="Search blocks..." 
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                  </div>
                  
                  <div className="category-scroll-container">
                    <button 
                      className={`cat-pill ${selectedCategory === 'all' ? 'active' : ''}`}
                      onClick={() => setSelectedCategory('all')}
                    >
                      All Blocks
                    </button>
                    <button 
                      className={`cat-pill ${selectedCategory === 'favorites' ? 'active' : ''}`}
                      onClick={() => setSelectedCategory('favorites')}
                    >
                      ★ Favorites
                    </button>
                    {BLOCK_CATEGORIES.map(cat => (
                      <button 
                        key={cat.key}
                        className={`cat-pill ${selectedCategory === cat.key ? 'active' : ''}`}
                        onClick={() => setSelectedCategory(cat.key)}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>

                  {recentBlocks.length > 0 && selectedCategory === 'all' && searchQuery === '' && (
                    <div className="recent-blocks-section">
                      <span className="section-label">Recently Added</span>
                      <div className="palette-grid">
                        {recentBlocks.map(type => {
                          const val = BLOCK_TYPES[type]
                          if (!val) return null
                          return (
                            <DraggablePaletteItem 
                              key={`recent-${type}`}
                              id={`recent-${type}`}
                              type={type}
                              label={val.label}
                              icon={val.icon}
                              onClick={() => addBlock(type)}
                              isFavorite={favorites.includes(type)}
                              onToggleFavorite={toggleFavorite}
                            />
                          )
                        })}
                      </div>
                    </div>
                  )}

                  <span className="section-label">Available Elements</span>
                  <div className="palette-grid">
                    {filteredPaletteKeys.map(key => {
                      const val = BLOCK_TYPES[key]
                      return (
                        <DraggablePaletteItem 
                          key={key}
                          type={key}
                          label={val.label}
                          icon={val.icon}
                          onClick={() => addBlock(key)}
                          isFavorite={favorites.includes(key)}
                          onToggleFavorite={toggleFavorite}
                        />
                      )
                    })}
                  </div>
                </div>
              )}

              {/* LAYERS TAB */}
              {leftTab === 'layers' && (
                <div className="layers-wrapper">
                  {blocks.length === 0 ? (
                    <p className="no-layers">No layers added. Drag elements onto screen canvas.</p>
                  ) : (
                    <div className="layers-list">
                      {blocks.map((block, idx) => (
                        <div 
                          key={block.id} 
                          className={`layer-item ${selectedBlockId === block.id ? 'active' : ''}`}
                          onClick={() => { setSelectedBlockId(block.id); setSettingsOpen(true); }}
                        >
                          <span className="layer-num">{idx + 1}</span>
                          <span className="layer-icon">{BLOCK_TYPES[block.type]?.icon || '✦'}</span>
                          <span className="layer-name">{BLOCK_TYPES[block.type]?.label || block.type}</span>
                          
                          <div className="layer-actions" onClick={e => e.stopPropagation()}>
                            <button className="layer-btn" onClick={() => moveBlockByBtn(block.id, 'up')} disabled={idx === 0}>
                              <HiChevronUp size={14} />
                            </button>
                            <button className="layer-btn" onClick={() => moveBlockByBtn(block.id, 'down')} disabled={idx === blocks.length - 1}>
                              <HiChevronDown size={14} />
                            </button>
                            <button className={`layer-btn ${block.data?.hidden ? 'active' : ''}`} onClick={() => toggleHide(block)}>
                              {block.data?.hidden ? <HiOutlineEyeOff size={13} /> : <HiOutlineEye size={13} />}
                            </button>
                            <button className={`layer-btn ${block.data?.locked ? 'active' : ''}`} onClick={() => toggleLock(block)}>
                              {block.data?.locked ? <HiOutlineLockClosed size={13} /> : <HiOutlineLockOpen size={13} />}
                            </button>
                            <button className="layer-btn" onClick={() => duplicateBlock(block)}>
                              <HiOutlineDuplicate size={13} />
                            </button>
                            <button className="layer-btn hover-red" onClick={() => deleteBlock(block.id)}>
                              <HiOutlineTrash size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* CANVAS PREVIEW PANEL */}
          <div className="editor-canvas-center">
            <div className="canvas-zoom-control">
              <button onClick={() => setPhoneScale(s => Math.min(s + 0.1, 1.3))} title="Zoom In">+</button>
              <span>{Math.round(phoneScale * 100)}%</span>
              <button onClick={() => setPhoneScale(s => Math.max(s - 0.1, 0.5))} title="Zoom Out">−</button>
              {phoneScale !== 1 && <button onClick={() => setPhoneScale(1.0)} title="Reset Scale">↺</button>}
            </div>

            <div className="canvas-area" onClick={() => setSelectedBlockId(null)}>
              <div 
                className={`phone-frame device-${viewportMode}`} 
                style={{ 
                  transform: `scale(${phoneScale})`, 
                  transformOrigin: 'top center', 
                  transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)' 
                }}
              >
                {/* Native Status Bar */}
                <div className="phone-top-status">
                  <span>9:41</span>
                  <div className="status-icons">
                    <svg width="18" height="12" viewBox="0 0 18 12" fill="none"><path d="M1 11H3V8H1V11ZM5 11H7V5H5V11ZM9 11H11V2H9V11ZM13 11H15V0H13V11Z" fill="currentColor"/></svg>
                    <svg width="16" height="12" viewBox="0 0 16 12" fill="none"><path d="M8 12C9.10457 12 10 11.1046 10 10C10 8.89543 9.10457 8 8 8C6.89543 8 6 8.89543 6 10C6 11.1046 6.89543 12 8 12Z" fill="currentColor"/><path d="M2.34315 5.65685C3.84277 4.15723 5.87673 3.31481 8 3.31481C10.1233 3.31481 12.1572 4.15723 13.6569 5.65685L16 3.31371C13.8752 1.18893 11.0028 0 8 0C4.99718 0 2.12479 1.18893 0 3.31371L2.34315 5.65685Z" fill="currentColor"/></svg>
                    <svg width="25" height="12" viewBox="0 0 25 12" fill="none"><rect x="0.5" y="0.5" width="21" height="11" rx="3.5" fill="none" stroke="currentColor"/><rect x="2" y="2" width="18" height="8" rx="2" fill="currentColor"/><path d="M24 4V8" stroke="currentColor" strokeLinecap="round"/></svg>
                  </div>
                </div>

                {/* Native Home Indicator */}
                <div className="phone-bottom-home">
                  <div className="home-line" />
                </div>

                <div className="phone-screen" style={{ background: invitation.theme?.backgroundColor || '#EDE9E7' }}>
                  <CanvasDroppable id="canvas" isDropActive={activeDragItem?.data.current?.type === 'paletteItem'} style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
                    {blocks.length === 0 ? (
                      <div className="phone-empty-templates">
                        <h3 className="serif-italic">Choose Template</h3>
                        <p>Start with a pre-built design or build from scratch.</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', marginTop: 16 }}>
                          {PRESET_LIST.filter(p => p.key !== 'custom').map(preset => (
                            <button
                              key={preset.key}
                              className="canvas-template-btn"
                              onClick={() => applyPreset(preset.key)}
                            >
                              <span className="preset-icon">{preset.icon}</span>
                              <div style={{ flex: 1 }}>
                                <div className="preset-name">{preset.label}</div>
                                <div className="preset-count">{preset.blocks.length} blocks</div>
                              </div>
                              <span className="preset-arrow">→</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
                        <div className="blocks-list" style={{ minHeight: '100%', paddingBottom: 100 }}>
                          <InsertBlockButton 
                            index={0} 
                            onClick={addBlock} 
                            visible={blocks.length > 0} 
                            isDropTarget={activeDragItem && (overId === blocks[0]?.id || (blocks.length === 0 && overId === 'canvas'))}
                          />
                          {blocks.map((block, idx) => {
                            const isSelected = selectedBlockId === block.id
                            const isLocked = !!block.data?.locked
                            const isHidden = !!block.data?.hidden
                            const isDesktopHero = block.type === 'desktopHero'

                            return (
                              <div key={block.id} style={{ position: 'relative', display: (isDesktopHero && !isSelected) ? 'none' : undefined }}>
                                <SortableBlock id={block.id} isLocked={isLocked}>
                                  <div 
                                    className={`canvas-block-wrapper ${isSelected ? 'is-selected' : ''} ${isLocked ? 'is-locked' : ''} ${isHidden ? 'is-hidden' : ''}`}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setSelectedBlockId(block.id)
                                      setSettingsOpen(true)
                                    }}
                                  >
                                    {isDesktopHero && isSelected && (
                                      <div style={{ padding: '12px 14px', margin: '6px 0', background: 'var(--ed-surface-hover)', borderRadius: 10, border: '1px dashed var(--ed-border)', textAlign: 'center', fontSize: 11.5, color: 'var(--ed-text-secondary)' }}>
                                        🖥️ Desktop Showcase Cover (Aktif hanya di layar PC/Laptop sebelah kiri, tersembunyi di kolom kanan & HP)
                                      </div>
                                    )}
                                    {/* Selected Block Tag */}
                                    {isSelected && (
                                      <span className="block-selected-label">
                                        {isLocked ? '🔒 LOCKED: ' : 'SELECTED: '}
                                        {BLOCK_TYPES[block.type]?.label?.toUpperCase() || block.type.toUpperCase()}
                                      </span>
                                    )}

                                    {/* CONTEXTUAL FLOATING MINI-TOOLBAR */}
                                    {isSelected && (
                                      <div className="canvas-block-mini-toolbar" onClick={e => e.stopPropagation()}>
                                        <button onClick={() => moveBlockByBtn(block.id, 'up')} disabled={idx === 0} title="Move Up">
                                          <HiChevronUp size={16} />
                                        </button>
                                        <button onClick={() => moveBlockByBtn(block.id, 'down')} disabled={idx === blocks.length - 1} title="Move Down">
                                          <HiChevronDown size={16} />
                                        </button>
                                        <button onClick={() => duplicateBlock(block)} title="Duplicate Block">
                                          <HiOutlineDuplicate size={15} />
                                        </button>
                                        <button onClick={() => toggleLock(block)} title={isLocked ? "Unlock Block" : "Lock Block"}>
                                          {isLocked ? <HiOutlineLockClosed size={15} color="#ef4444" /> : <HiOutlineLockOpen size={15} />}
                                        </button>
                                        <button onClick={() => toggleHide(block)} title={isHidden ? "Show Block" : "Hide Block"}>
                                          {isHidden ? <HiOutlineEyeOff size={15} color="#ef4444" /> : <HiOutlineEye size={15} />}
                                        </button>
                                        <button className="hover-red" onClick={() => deleteBlock(block.id)} title="Delete Block">
                                          <HiOutlineTrash size={15} />
                                        </button>
                                      </div>
                                    )}

                                    {/* Block Content Rendered */}
                                    <div 
                                      className={`public-block ${block.type === 'cover' ? 'public-block-cover' : ''} ${block.type === 'footer' ? 'public-block-footer' : ''}`}
                                      style={{
                                        opacity: isHidden ? 0.4 : 1,
                                        paddingTop: (block.type === 'cover' || block.type === 'footer' || block.type === 'desktopHero') ? 0 : (block.data?.spacingTop ?? 40),
                                        paddingBottom: (block.type === 'cover' || block.type === 'footer' || block.type === 'desktopHero') ? 0 : (block.data?.spacingBottom ?? 40),
                                        borderRadius: block.data?.customBorderRadius ? `${block.data?.customBorderRadius}px` : undefined,
                                        background: block.data?.customBgColor || undefined,
                                        color: block.data?.customTextColor || undefined,
                                        textAlign: block.data?.customTextAlign || undefined,
                                        minHeight: block.data?.blockMinHeight || undefined,
                                        position: 'relative'
                                      }}
                                    >
                                      {isHidden && (
                                        <div className="canvas-hidden-overlay">
                                          <HiOutlineEyeOff size={14} />
                                          <span>Hidden Block Preview</span>
                                        </div>
                                      )}
                                      {isLocked && (
                                        <div className="canvas-locked-indicator">
                                          <HiOutlineLockClosed size={12} />
                                          <span>Locked</span>
                                        </div>
                                      )}

                                      {block.data?.backgroundImage && block.type !== 'cover' && block.type !== 'desktopHero' && <BlockBackgroundLayer data={block.data} />}
                                      
                                      <div 
                                        className="public-block-content"
                                        style={{
                                          position: (block.data?.backgroundImage && block.type !== 'cover' && block.type !== 'desktopHero') ? 'relative' : undefined,
                                          zIndex: (block.data?.backgroundImage && block.type !== 'cover' && block.type !== 'desktopHero') ? 2 : undefined,
                                          paddingLeft: (block.type === 'cover' || block.type === 'footer' || block.type === 'desktopHero') ? 0 : 24,
                                          paddingRight: (block.type === 'cover' || block.type === 'footer' || block.type === 'desktopHero') ? 0 : 24,
                                        }}
                                      >
                                        <div style={{ pointerEvents: 'none' }}>
                                          {renderPublicBlock(
                                            block,
                                            theme,
                                            { name: '', email: '', attendance: '' },
                                            () => {},
                                            () => {},
                                            false,
                                            { name: '', content: '' },
                                            () => {},
                                            () => {},
                                            false,
                                            'Guest Preview',
                                            true,
                                            [],
                                            false,
                                            false,
                                            true,
                                            'yes',
                                            invitation?.title || 'The Wedding',
                                            () => {}
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </SortableBlock>
                                <InsertBlockButton 
                                  index={idx + 1} 
                                  onClick={addBlock} 
                                  isDropTarget={activeDragItem && (
                                    overId === blocks[idx + 1]?.id || 
                                    (idx === blocks.length - 1 && overId === 'canvas')
                                  )}
                                />
                              </div>
                            )
                          })}
                        </div>
                      </SortableContext>
                    )}
                  </CanvasDroppable>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL (PROPERTIES PANEL) */}
          <div className={`editor-right-panel ${rightPanelCollapsed ? 'collapsed' : ''} ${settingsOpen && selectedBlock ? 'open' : ''}`}>
            <div className="panel-tabs">
              <button className="panel-collapse-arrow" onClick={() => setRightPanelCollapsed(!rightPanelCollapsed)}>
                {rightPanelCollapsed ? <HiOutlineMenuAlt2 size={16} /> : <HiX size={14} />}
              </button>
              <h3 className="settings-panel-header">Settings Panel</h3>
            </div>

            {selectedBlock ? (
              <>
                <div className="right-tabs-header">
                  {['style', 'layout', 'animation', 'responsive', 'advanced', 'interactions'].map(tab => (
                    <button 
                      key={tab}
                      className={`right-tab-btn ${rightTab === tab ? 'active' : ''}`}
                      onClick={() => setRightTab(tab)}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>

                <div className="right-tab-content">
                  <RightSettingsPanel
                    block={selectedBlock}
                    onChange={(data) => updateBlock(selectedBlock.id, data)}
                    activeTab={rightTab}
                    allBlocks={blocks}
                  />
                  
                  <div className="settings-actions">
                    <button className="btn btn-ghost btn-sm btn-delete" onClick={() => deleteBlock(selectedBlock.id)}>
                      Delete Block
                    </button>
                    <button className="btn btn-primary btn-sm" onClick={() => setSelectedBlockId(null)}>
                      Done
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="no-selection-placeholder">
                <span>🖱</span>
                <p>Select an element on the canvas to configure its style, spacing, animations, and options.</p>
              </div>
            )}
          </div>

        </div>

        {/* MODAL WINDOWS */}
        {activeModal === 'settings' && (
          <SettingsModal 
            invitation={invitation} 
            onClose={() => setActiveModal(null)} 
            onSave={(data) => updateInvitation(invitation.id, data)}
          />
        )}
        {versionOpen && (
          <VersionModal
            key={invitation.id}
            invitationId={invitation.id}
            currentBlocks={blocks}
            onRestore={(restoredBlocks) => {
              reorderBlocks(invitation.id, restoredBlocks)
              pushHistory(restoredBlocks)
            }}
            onClose={() => setVersionOpen(false)}
          />
        )}
        {seoOpen && (
          <SeoModal
            coverBlock={blocks.find(b => b.type === 'cover')}
            onSave={saveSeoSettings}
            onClose={() => setSeoOpen(false)}
          />
        )}
        {auditOpen && (
          <AccessAuditModal
            blocks={blocks}
            onClose={() => setAuditOpen(false)}
            onSelectBlock={(blockId) => {
              setSelectedBlockId(blockId)
              setSettingsOpen(true)
            }}
          />
        )}
        {jsonOpen && (
          <JsonModal
            blocks={blocks}
            onImport={(importedBlocks) => {
              reorderBlocks(invitation.id, importedBlocks)
              pushHistory(importedBlocks)
            }}
            onClose={() => setJsonOpen(false)}
          />
        )}
        {shortcutsOpen && (
          <ShortcutsHelpModal onClose={() => setShortcutsOpen(false)} />
        )}

        {/* Command Action Palette */}
        {commandPaletteOpen && (
          <CommandPalette
            onClose={() => setCommandPaletteOpen(false)}
            commands={commandList}
          />
        )}

        {/* Drag Overlay positioned contextually at the end of DndContext */}
        <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.4' } } }) }}>
          {activeDragItem?.data.current?.type === 'paletteItem' ? (
            <div className="palette-block drag-overlay-item">
              <span className="palette-icon">{BLOCK_TYPES[activeDragItem.data.current.blockType]?.icon}</span>
              <span className="palette-label">{BLOCK_TYPES[activeDragItem.data.current.blockType]?.label}</span>
            </div>
          ) : null}
        </DragOverlay>

      </div>
    </DndContext>
  )
}

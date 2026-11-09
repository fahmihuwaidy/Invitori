import { useMemo, useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useInvitations } from '../contexts/InvitationContext'
import { PRESET_LIST, PRESETS } from '../utils/presets'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts'
import { HiOutlinePlus, HiOutlinePencil, HiOutlineExternalLink, HiOutlineTrash, HiOutlineEye, HiOutlineUserGroup, HiOutlineMail, HiOutlineCheck, HiOutlineX, HiX, HiSelector, HiOutlineLink, HiOutlineDocumentDuplicate, HiOutlineCog, HiOutlineHeart, HiOutlineViewGrid, HiOutlineChatAlt2 } from 'react-icons/hi'
import './DashboardPage.css'

const WA_TEMPLATES = {
  formal: {
    label: 'Formal & Elegan',
    text: `Kepada Yth. *{nama}*,\n\nTanpa mengurangi rasa hormat, perkenankan kami mengundang Bapak/Ibu/Saudara/i untuk hadir dan memberikan doa restu pada acara pernikahan kami:\n\n*{judul}*\n\nInformasi lengkap mengenai waktu, lokasi, dan konfirmasi kehadiran dapat diakses melalui tautan undangan digital berikut:\n{link}\n\nMerupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir.\n\nKami yang berbahagia,\n*{judul}*`,
  },
  islami: {
    label: 'Islami (Syar\'i)',
    text: `Assalamu'alaikum Warahmatullahi Wabarakatuh.\n\nKepada Yth. *{nama}*,\n\nDengan memohon rahmat dan ridho Allah SWT, kami bermaksud mengundang Bapak/Ibu/Saudara/i untuk menghadiri acara syukuran pernikahan kami:\n\n*{judul}*\n\nDetail acara dan konfirmasi kehadiran dapat dibuka melalui tautan berikut:\n{link}\n\nKehadiran serta doa restu Bapak/Ibu/Saudara/i merupakan hadiah terindah bagi kami.\n\nWassalamu'alaikum Warahmatullahi Wabarakatuh.`,
  },
  santai: {
    label: 'Hangat & Santai',
    text: `Halo *{nama}*! ✨\n\nKami punya kabar bahagia dan ingin mengundangmu untuk hadir di hari spesial kami:\n\n*{judul}*\n\nCek detail acara, lokasi, dan isi RSVP kamu lewat link undangan khusus ini ya:\n{link}\n\nSampai bertemu di hari bahagia kami! 🤍`,
  },
  english: {
    label: 'Modern English',
    text: `Dear *{nama}*,\n\nTogether with our families, we joyfully invite you to celebrate our wedding:\n\n*{judul}*\n\nKindly view your personal digital invitation and confirm your attendance via the link below:\n{link}\n\nWe look forward to celebrating this special day with you.`,
  },
}

/* ---- Create New Invitation Modal with Curated Preset Gallery ---- */
function CreateInvitationModal({ onClose, onSelect }) {
  const [title, setTitle] = useState('')
  const [selectedPreset, setSelectedPreset] = useState('wedding')
  const [isCreating, setIsCreating] = useState(false)

  const handleCreate = async () => {
    if (!title.trim() || isCreating) return
    setIsCreating(true)
    try {
      await onSelect(title.trim(), selectedPreset)
    } catch (err) {
      console.error(err)
      alert('Gagal membuat undangan. Silakan coba lagi.')
      setIsCreating(false)
    }
  }

  return (
    <div className="preset-modal-overlay" onClick={isCreating ? null : onClose}>
      <div className="preset-modal" style={{ maxWidth: 680 }} onClick={e => e.stopPropagation()}>
        {!isCreating && <button className="preset-modal-close" onClick={onClose}><HiX size={20} /></button>}

        <div className="preset-modal-header" style={{ marginBottom: 16 }}>
          <h2 className="serif-italic" style={{ fontSize: '1.6rem' }}>Buat Undangan Baru</h2>
          <p>Pilih tema desain kurasi kami dan beri judul undangan Anda.</p>
        </div>

        <div className="preset-title-form" style={{ marginTop: 8 }}>
          <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--olive)', display: 'block', marginBottom: 6 }}>
            Judul Undangan / Nama Mempelai
          </label>
          <input
            type="text"
            className="preset-title-input"
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            placeholder="Contoh: Aris & Laras"
            autoFocus
            disabled={isCreating}
            style={{ marginBottom: 18 }}
          />

          <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--olive)', display: 'block', marginBottom: 10 }}>
            Pilih Tema Desain ({PRESET_LIST.length} Pilihan)
          </label>
          <div className="preset-cards-grid">
            {PRESET_LIST.map(preset => {
              const isSelected = selectedPreset === preset.key
              return (
                <button
                  type="button"
                  key={preset.key}
                  onClick={() => setSelectedPreset(preset.key)}
                  disabled={isCreating}
                  className={`preset-choice-card ${isSelected ? 'selected' : ''}`}
                >
                  <div className="preset-choice-top">
                    <span className="preset-choice-icon">{preset.icon}</span>
                    <div className="preset-choice-swatches">
                      <span style={{ background: preset.theme?.primaryColor || '#3D4828' }} />
                      <span style={{ background: preset.theme?.backgroundColor || '#FAF7F2' }} />
                    </div>
                  </div>
                  <div className="preset-choice-title">{preset.label}</div>
                  {preset.badge && <span className="preset-choice-badge">{preset.badge}</span>}
                  <p className="preset-choice-desc">{preset.description}</p>
                </button>
              )
            })}
          </div>

          <button
            className="btn btn-primary btn-full preset-create-btn"
            onClick={handleCreate}
            disabled={!title.trim() || isCreating}
            style={{ marginTop: 20 }}
          >
            {isCreating ? (
              <>
                <div className="spinner-sm" style={{ marginRight: 8 }}></div>
                Menyiapkan Tema & Blok...
              </>
            ) : (
              <>
                <HiOutlinePlus size={16} /> Buat Undangan dengan Tema "{PRESETS[selectedPreset]?.label}"
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

function GuestListTab({ invitation, guests, setGuests, loading }) {
  const [newName, setNewName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [adding, setAdding] = useState(false)
  const [copiedId, setCopiedId] = useState(null)
  const [copiedMsgId, setCopiedMsgId] = useState(null)
  const [waTemplateKey, setWaTemplateKey] = useState('formal')
  const [customWaText, setCustomWaText] = useState(WA_TEMPLATES.formal.text)
  const [sentMap, setSentMap] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(`invori_wa_sent_${invitation?.id}`) || '{}')
    } catch {
      return {}
    }
  })

  useEffect(() => {
    try {
      setSentMap(JSON.parse(localStorage.getItem(`invori_wa_sent_${invitation?.id}`) || '{}'))
    } catch {
      setSentMap({})
    }
  }, [invitation?.id])

  const toggleSentStatus = (guestId, forceTrue = false) => {
    setSentMap(prev => {
      const next = { ...prev, [guestId]: forceTrue ? true : !prev[guestId] }
      try {
        localStorage.setItem(`invori_wa_sent_${invitation?.id}`, JSON.stringify(next))
      } catch {
        // Ignore storage errors
      }
      return next
    })
  }

  const handleSelectWaTemplate = (key) => {
    setWaTemplateKey(key)
    if (WA_TEMPLATES[key]) {
      setCustomWaText(WA_TEMPLATES[key].text)
    }
  }
  
  // Google Spreadsheet Import states
  const [addMethod, setAddMethod] = useState('manual') // 'manual' or 'sheet'
  const [sheetUrl, setSheetUrl] = useState('')
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState('')
  const [importSuccess, setImportSuccess] = useState('')

  const baseUrl = `${window.location.origin}/undangan/${invitation?.slug || ''}`

  const handleAdd = async () => {
    if (!newName.trim() || !invitation?.id) return
    setAdding(true)
    const { data, error } = await supabase
      .from('guests')
      .insert({ invitation_id: invitation.id, name: newName.trim(), phone: newPhone.trim() || null })
      .select()
      .single()
    if (error) {
      console.error('Error adding guest:', error)
      alert('Gagal menambahkan tamu: ' + error.message)
    } else if (data) {
      setGuests(prev => [...prev, data])
      setNewName('')
      setNewPhone('')
    }
    setAdding(false)
  }

  // Parse CSV format supporting quoted fields with newlines/commas
  const parseCSV = (text) => {
    const lines = []
    let row = ['']
    let inQuotes = false

    for (let i = 0; i < text.length; i++) {
      const c = text[i]
      const next = text[i + 1]
      if (c === '"') {
        if (inQuotes && next === '"') {
          row[row.length - 1] += '"'
          i++
        } else {
          inQuotes = !inQuotes
        }
      } else if (c === ',' && !inQuotes) {
        row.push('')
      } else if ((c === '\r' || c === '\n') && !inQuotes) {
        if (c === '\r' && next === '\n') {
          i++
        }
        lines.push(row)
        row = ['']
      } else {
        row[row.length - 1] += c
      }
    }
    if (row.length > 1 || row[0] !== '') {
      lines.push(row)
    }
    return lines
  }

  const handleImportSheet = async () => {
    if (!sheetUrl.trim() || !invitation?.id) return
    setImporting(true)
    setImportError('')
    setImportSuccess('')

    try {
      const idMatch = sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/)
      if (!idMatch) {
        throw new Error('Link Google Spreadsheet tidak valid. Pastikan link berisi ID spreadsheet.')
      }
      const spreadsheetId = idMatch[1]
      const gidMatch = sheetUrl.match(/gid=([0-9]+)/)
      const gid = gidMatch ? gidMatch[1] : '0'

      const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&gid=${gid}`
      const response = await fetch(csvUrl)
      
      if (!response.ok) {
        throw new Error('Gagal mengakses Spreadsheet. Pastikan akses diatur ke "Siapa saja yang memiliki link dapat melihat" (Anyone with link can view).')
      }

      const text = await response.text()
      if (!text.trim()) {
        throw new Error('Spreadsheet kosong atau tidak dapat dibaca.')
      }

      const rows = parseCSV(text)
      if (rows.length < 2) {
        throw new Error('Data tidak cukup. Butuh minimal baris header dan satu baris data.')
      }

      const headerRow = rows[0].map(h => h.toLowerCase().trim())
      
      let nameIdx = headerRow.findIndex(h => h.includes('nama') || h.includes('name') || h.includes('tamu') || h.includes('guest') || h.includes('lengkap'))
      let phoneIdx = headerRow.findIndex(h => h.includes('phone') || h.includes('hp') || h.includes('telp') || h.includes('telepon') || h.includes('wa') || h.includes('whatsapp') || h.includes('kontak') || h.includes('contact'))

      if (nameIdx === -1) {
        nameIdx = 0
      }
      if (phoneIdx === -1 && headerRow.length > 1) {
        phoneIdx = nameIdx === 0 ? 1 : 0
      }

      const guestsToInsert = []
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i]
        const nameVal = row[nameIdx] ? row[nameIdx].trim() : ''
        let phoneVal = ''
        if (phoneIdx !== -1 && phoneIdx < row.length && row[phoneIdx]) {
          phoneVal = row[phoneIdx].trim()
        }

        if (nameVal) {
          guestsToInsert.push({
            invitation_id: invitation.id,
            name: nameVal,
            phone: phoneVal || null
          })
        }
      }

      if (guestsToInsert.length === 0) {
        throw new Error('Tidak ditemukan nama tamu untuk diimpor.')
      }

      const { data, error } = await supabase
        .from('guests')
        .insert(guestsToInsert)
        .select()

      if (error) throw error

      if (data) {
        setGuests(prev => [...prev, ...data])
        setImportSuccess(`Berhasil mengimpor ${data.length} tamu!`)
        setSheetUrl('')
      }
    } catch (err) {
      console.error(err)
      setImportError(err.message || 'Terjadi kesalahan saat mengimpor data.')
    } finally {
      setImporting(false)
    }
  }

  const handleDelete = async (guestId) => {
    if (!confirm('Delete this guest?')) return
    const { error } = await supabase.from('guests').delete().eq('id', guestId)
    if (error) {
      console.error('Error deleting guest:', error)
      alert('Gagal menghapus tamu: ' + error.message)
    } else {
      setGuests(prev => prev.filter(g => g.id !== guestId))
    }
  }

  const getLink = (name) => `${baseUrl}?to=${encodeURIComponent(name)}`

  const buildWaMessage = (guest) => {
    const link = getLink(guest.name)
    const invTitle = invitation?.title || 'Pernikahan Kami'
    return (customWaText || WA_TEMPLATES.formal.text)
      .replace(/\{nama\}/g, guest.name)
      .replace(/\{link\}/g, link)
      .replace(/\{judul\}/g, invTitle)
  }

  const copyLink = (guest) => {
    navigator.clipboard.writeText(getLink(guest.name))
    setCopiedId(guest.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const copyMessage = (guest) => {
    navigator.clipboard.writeText(buildWaMessage(guest))
    setCopiedMsgId(guest.id)
    toggleSentStatus(guest.id, true)
    setTimeout(() => setCopiedMsgId(null), 2000)
  }

  const sendWhatsApp = (guest) => {
    const msg = encodeURIComponent(buildWaMessage(guest))
    let cleanPhone = (guest.phone || '').replace(/[^0-9]/g, '')
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.slice(1)
    }
    const waUrl = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${msg}`
      : `https://api.whatsapp.com/send?text=${msg}`
    toggleSentStatus(guest.id, true)
    window.open(waUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="card animate-fade-in-up" style={{ padding: 28 }}>
      <div className="card-header">
        <div>
          <h3 className="serif-italic" style={{ fontSize: '1.4rem', color: 'var(--olive)' }}>Guest List & WhatsApp Broadcast</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>Kelola daftar tamu, atur template pesan pengantar, dan kirim langsung ke WhatsApp.</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ background: 'rgba(52,76,45,0.1)', color: 'var(--olive)', padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
            {guests.length} Tamu ({Object.values(sentMap).filter(Boolean).length} Terkirim)
          </div>
          <button 
            className="btn btn-outline btn-sm"
            onClick={() => {
              const csv = [
                ['Name', 'Phone', 'Invitation Link'].join(','),
                ...guests.map(g => [g.name, g.phone || '-', getLink(g.name)].join(','))
              ].join('\n');
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `GuestList_${invitation?.title || 'Invitation'}.csv`;
              a.click();
            }}
            disabled={guests.length === 0}
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* WhatsApp Broadcast Template Studio */}
      <div className="wa-template-studio">
        <div className="wa-template-header">
          <div>
            <span className="label-caps" style={{ color: 'var(--olive)', fontSize: 11, fontWeight: 700 }}>Template Pesan Pengantar WhatsApp</span>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              Gunakan variabel <code>{'{nama}'}</code>, <code>{'{link}'}</code>, dan <code>{'{judul}'}</code> agar pesan otomatis terisi untuk setiap tamu.
            </p>
          </div>
          <div className="wa-template-pills">
            {Object.entries(WA_TEMPLATES).map(([key, tpl]) => (
              <button
                key={key}
                type="button"
                onClick={() => handleSelectWaTemplate(key)}
                className={`wa-template-pill ${waTemplateKey === key ? 'active' : ''}`}
              >
                {tpl.label}
              </button>
            ))}
          </div>
        </div>
        <textarea
          className="settings-input wa-template-textarea"
          rows={5}
          value={customWaText}
          onChange={e => setCustomWaText(e.target.value)}
        />
      </div>

      <div className="guest-add-section">
        <div className="guest-add-tabs">
          <button 
            onClick={() => setAddMethod('manual')} 
            className={`guest-add-tab ${addMethod === 'manual' ? 'active' : ''}`}
          >
            INPUT MANUAL
          </button>
          <button 
            onClick={() => setAddMethod('sheet')} 
            className={`guest-add-tab ${addMethod === 'sheet' ? 'active' : ''}`}
          >
            GOOGLE SPREADSHEET
          </button>
        </div>

        {addMethod === 'manual' ? (
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: '2 1 240px' }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-dark)', display: 'block', marginBottom: 6 }}>Guest Full Name *</label>
              <input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
                placeholder="e.g.: Mr. John Doe & Family"
                className="settings-input"
                style={{ width: '100%', background: 'white' }}
              />
            </div>
            <div style={{ flex: '1 1 180px' }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-dark)', display: 'block', marginBottom: 6 }}>Phone Number (optional)</label>
              <input
                value={newPhone}
                onChange={e => setNewPhone(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
                placeholder="e.g.: 08123456..."
                className="settings-input"
                style={{ width: '100%', background: 'white' }}
              />
            </div>
            <button
              onClick={handleAdd}
              disabled={adding || !newName.trim()}
              className="btn btn-primary"
              style={{ padding: '0 24px', height: 44, marginBottom: 2 }}
            >
              {adding ? '...' : 'Add'}
            </button>
          </div>
        ) : (
          <div style={{ width: '100%' }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-dark)', display: 'block', marginBottom: 6 }}>Link Google Spreadsheet</label>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <input
                value={sheetUrl}
                onChange={e => setSheetUrl(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleImportSheet()}
                placeholder="https://docs.google.com/spreadsheets/d/.../edit?usp=sharing"
                className="settings-input"
                style={{ flex: 1, minWidth: 280, background: 'white' }}
              />
              <button
                onClick={handleImportSheet}
                disabled={importing || !sheetUrl.trim()}
                className="btn btn-primary"
                style={{ padding: '0 24px', height: 44 }}
              >
                {importing ? 'Importing...' : 'Import'}
              </button>
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.5 }}>
              💡 <strong>Penting:</strong> Pastikan spreadsheet Anda diatur agar <strong>"Siapa saja yang memiliki link dapat melihat"</strong> (Anyone with link can view). Kolom pertama akan dideteksi sebagai Nama Tamu, dan kolom nomor telepon (jika ada) akan otomatis terdeteksi jika memiliki header "HP", "Phone", atau sejenisnya.
            </p>
            {importError && (
              <div style={{ marginTop: 12, padding: '8px 12px', background: 'rgba(208,156,167,0.1)', color: 'var(--pink-dusty)', borderRadius: 8, fontSize: 12, border: '1px solid rgba(208,156,167,0.2)' }}>
                ⚠️ {importError}
              </div>
            )}
            {importSuccess && (
              <div style={{ marginTop: 12, padding: '8px 12px', background: 'rgba(86,95,52,0.1)', color: 'var(--olive)', borderRadius: 8, fontSize: 12, border: '1px solid rgba(86,95,52,0.2)' }}>
                ✅ {importSuccess}
              </div>
            )}
          </div>
        )}
      </div>

      <div>
        {loading ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0', fontSize: 14 }}>Loading guest list...</p>
        ) : guests.length === 0 ? (
          <div className="empty-state" style={{ textAlign: 'center', padding: '60px 0', background: 'var(--cream-light)', borderRadius: 16, border: '1px dashed var(--border)' }}>
            <HiOutlineUserGroup size={40} color="var(--text-light)" style={{ marginBottom: 16, opacity: 0.5 }} />
            <p className="serif-italic" style={{ color: 'var(--text-muted)', fontSize: 16 }}>No guests added yet</p>
            <p style={{ color: 'var(--text-light)', fontSize: 12, marginTop: 4 }}>Use the form above to start adding guests.</p>
          </div>
        ) : (
          <div className="guest-table-container">
            <div className="guest-table-header">
              <div style={{ flex: 1 }}>Informasi Tamu</div>
              <div style={{ width: 280, textAlign: 'right' }}>Aksi & Kirim Undangan</div>
            </div>
            {guests.map((g, idx) => {
              const isSent = !!sentMap[g.id]
              return (
                <div key={g.id} className="guest-row" style={{ borderBottom: idx < guests.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                  <div style={{ flex: 1, minWidth: 0, paddingRight: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                      <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--text-dark)' }}>{g.name}</p>
                      <button
                        type="button"
                        onClick={() => toggleSentStatus(g.id)}
                        className={`guest-sent-badge ${isSent ? 'sent' : ''}`}
                        title="Klik untuk menandai sudah/belum dikirim"
                      >
                        {isSent ? '✓ Terkirim' : 'Belum Dikirim'}
                      </button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-light)', fontSize: 12 }}>
                        <HiOutlineLink size={14} />
                        <span style={{ fontFamily: 'monospace', opacity: 0.8 }}>...{getLink(g.name).slice(-30)}</span>
                      </div>
                      {g.phone && (
                        <div style={{ fontSize: 12, color: 'var(--text-light)', padding: '2px 10px', background: 'var(--cream)', borderRadius: 6 }}>
                          {g.phone}
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={() => sendWhatsApp(g)}
                      className="btn btn-sm guest-wa-btn"
                      title="Kirim via WhatsApp"
                    >
                      <HiOutlineChatAlt2 size={15} />
                      <span>Kirim WA</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => copyMessage(g)}
                      className="btn btn-outline btn-sm"
                      style={{ padding: '8px 10px' }}
                      title="Salin Teks Pengantar + Link"
                    >
                      {copiedMsgId === g.id ? <><HiOutlineCheck size={14} color="var(--olive)" /> Tersalin</> : 'Salin Pesan'}
                    </button>
                    <button onClick={() => copyLink(g)} className="btn btn-outline btn-sm" style={{ padding: '8px 10px', minWidth: 38 }} title="Salin Link Saja">
                      {copiedId === g.id ? <HiOutlineCheck size={15} color="var(--olive)"/> : <HiOutlineDocumentDuplicate size={15} />}
                    </button>
                    <button onClick={() => window.open(getLink(g.name), '_blank')} className="btn btn-outline btn-sm" style={{ padding: '8px 10px' }} title="Buka Undangan">
                      <HiOutlineExternalLink size={15} />
                    </button>
                    <button onClick={() => handleDelete(g.id)} className="btn-icon-only" style={{ color: 'var(--pink-dusty)', padding: '8px' }} title="Hapus Tamu">
                      <HiOutlineTrash size={15} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const { invitations, loading, deleteInvitation, addInvitation, addBlocks, deleteRsvp } = useInvitations()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedInvId, setSelectedInvId] = useState(searchParams.get('inv') || '')
  const [allRsvps, setAllRsvps] = useState([])
  const [rsvpsLoading, setRsvpsLoading] = useState(false)
  const [allGuests, setAllGuests] = useState([])
  const [guestsLoading, setGuestsLoading] = useState(false)

  const rawTab = searchParams.get('tab') || 'overview'
  const activeTab = rawTab

  // Keep selectedInvId in sync with the search params and invitation list changes (e.g. deletions)
  useEffect(() => {
    if (invitations.length === 0) {
      if (selectedInvId !== '') setSelectedInvId('')
      return
    }
    const paramInvId = searchParams.get('inv')
    const isValidId = invitations.some(i => i.id === paramInvId)
    if (paramInvId && isValidId) {
      if (paramInvId !== selectedInvId) {
        setSelectedInvId(paramInvId)
      }
    } else {
      const defaultId = invitations[0].id
      setSelectedInvId(defaultId)
      const params = new URLSearchParams(searchParams)
      params.set('inv', defaultId)
      setSearchParams(params, { replace: true })
    }
  }, [invitations, searchParams, selectedInvId, setSearchParams])

  const setTab = (tabId) => {
    const params = new URLSearchParams(searchParams)
    params.set('tab', tabId)
    setSearchParams(params)
  }

  const handleInvChange = (e) => {
    const newId = e.target.value
    setSelectedInvId(newId)
    const params = new URLSearchParams(searchParams)
    params.set('inv', newId)
    setSearchParams(params)
  }

  const selectedInv = useMemo(() => {
    if (invitations.length === 0) return null
    return invitations.find(i => i.id === selectedInvId) || invitations[0]
  }, [invitations, selectedInvId])

  // ---- Fetch ALL RSVPs for selected invitation ----
  const fetchAllRsvps = useCallback(async (invId) => {
    if (!invId) return
    setRsvpsLoading(true)
    setAllRsvps([]) // Clear previous RSVPs to avoid showing stale data
    try {
      const { data, error } = await supabase
        .from('rsvps')
        .select('*')
        .eq('invitation_id', invId)
        .order('sent_at', { ascending: false })
      
      if (error) throw error
      setAllRsvps(data || [])
    } catch (err) {
      console.error('Error fetching all RSVPs:', err)
    } finally {
      setRsvpsLoading(false)
    }
  }, [])

  const fetchAllGuests = useCallback(async (invId) => {
    if (!invId) return
    setGuestsLoading(true)
    setAllGuests([]) // Clear previous guests
    try {
      const { data, error } = await supabase
        .from('guests')
        .select('*')
        .eq('invitation_id', invId)
        .order('created_at', { ascending: true })
      
      if (error) throw error
      setAllGuests(data || [])
    } catch (err) {
      console.error('Error fetching guests:', err)
    } finally {
      setGuestsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (selectedInv?.id) {
      fetchAllRsvps(selectedInv.id)
      fetchAllGuests(selectedInv.id)
    }
  }, [selectedInv?.id, fetchAllRsvps, fetchAllGuests])

  // ---- Computed Stats from REAL data (filtered by selected invitation) ----
  const totalViews = useMemo(() => selectedInv?.analytics?.totalViews || 0, [selectedInv])
  const totalRsvps = useMemo(() => selectedInv?.analytics?.rsvpCount || 0, [selectedInv])

  const responseRate = totalViews > 0 ? ((totalRsvps / totalViews) * 100).toFixed(1) : 0

  // Chart data per invitation (Attending vs Not Attending vs Unknown)
  const chartData = useMemo(() => {
    if (!selectedInv || !allRsvps) return []
    if (allRsvps.length === 0 && totalViews === 0) return []
    
    const attending = allRsvps.filter(r => r.attendance === 'attending' || r.attendance === 'yes' || r.attendance === true).length
    const declined = allRsvps.filter(r => r.attendance === 'declined' || r.attendance === 'no' || r.attendance === false).length
    const pending = totalViews - (attending + declined) // Approximation of those who viewed but haven't decided
    const validPending = pending > 0 ? pending : 0
    return [
      { name: 'Attending', count: attending, fill: '#565F34' },
      { name: 'Declined', count: declined, fill: '#d09ca7' },
      { name: 'No Response', count: validPending, fill: '#E0DCD8' }
    ]
  }, [selectedInv, allRsvps, totalViews])

  // ---- Activity Feed from ALL RSVPs for selected inv ----
  // ---- Activity Feed from ALL RSVPs for selected inv ----
  const activityItems = useMemo(() => {
    if (!allRsvps || allRsvps.length === 0) return []
    return allRsvps.map(rsvp => {
      const isAttending = rsvp.attendance === 'attending' || rsvp.attendance === 'yes' || rsvp.attendance === true
      const isDeclined = rsvp.attendance === 'declined' || rsvp.attendance === 'no' || rsvp.attendance === false
      let color = 'var(--olive)'
      let icon = '💌'
      if (isAttending) { color = 'var(--olive)'; icon = '✅' }
      else if (isDeclined) { color = 'var(--pink-dusty)'; icon = '❌' }

      const sentAtDate = rsvp.sent_at || rsvp.sentAt // Handle both snake_case and camelCase
      let timeStr = 'Baru saja'
      if (sentAtDate) {
        try {
          const date = new Date(sentAtDate)
          if (!isNaN(date.getTime())) {
            timeStr = date.toLocaleDateString('en-US', {day: 'numeric', month: 'short'}) + ' ' + 
                      date.toLocaleTimeString('en-US', {hour:'2-digit', minute:'2-digit'})
          }
        } catch {
          console.warn('Invalid date:', sentAtDate)
        }
      }

      return {
        id: rsvp.id,
        color,
        icon,
        isAttending,
        isDeclined,
        guestCount: Number(rsvp.guest_count) || 1,
        name: rsvp.name || 'Tamu',
        message: rsvp.message,
        time: timeStr,
        text: (
          <>
            <strong>{rsvp.name || 'Guest'}</strong>{' '}
            {isAttending ? `is attending (${Number(rsvp.guest_count) || 1} pax)` : isDeclined ? 'is not attending' : 'sent a message'}
            {rsvp.message && <span className="activity-message">: "{rsvp.message}"</span>}
          </>
        ),
      }
    })
  }, [allRsvps])

  const [pendingDelete, setPendingDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = (id) => {
    if (!id || deleting) return
    setPendingDelete(invitations.find(inv => inv.id === id) || { id, title: 'undangan ini' })
  }

  const confirmDelete = async () => {
    if (!pendingDelete || deleting) return
    const target = pendingDelete
    const id = target.id
    setDeleting(true)
    
    // Compute next selection before state change
    const remaining = invitations.filter(inv => inv.id !== id)
    const nextId = remaining.length > 0 ? remaining[0].id : ''
    
    try {
      const success = await deleteInvitation(id)
      if (success) {
        if (selectedInvId === id) {
          setSelectedInvId(nextId)
          const params = new URLSearchParams(searchParams)
          if (nextId) {
            params.set('inv', nextId)
          } else {
            params.delete('inv')
          }
          setSearchParams(params, { replace: true })
        }
      }
    } finally {
      setDeleting(false)
      setPendingDelete(null)
    }
  }

  useEffect(() => {
    if (!pendingDelete) return
    const onKey = (e) => { if (e.key === 'Escape' && !deleting) setPendingDelete(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [pendingDelete, deleting])

  const handleCreateInvitation = async (title, presetKey = 'wedding') => {
    const preset = PRESETS[presetKey] || PRESETS.custom
    const newInv = await addInvitation({
      title,
      category: preset.labelId || 'Wedding',
      theme: preset.theme,
    })
    if (!newInv) {
      throw new Error('Gagal membuat undangan baru di database. Periksa koneksi internet Anda.')
    }

    if (preset.blocks && preset.blocks.length > 0) {
      const blocksToCreate = preset.blocks.map(b => {
        if (b.type === 'cover') {
          return { ...b, data: { ...b.data, coupleName: title } }
        }
        if (b.type === 'footer') {
          return { ...b, data: { ...b.data, coupleName: title } }
        }
        return b
      })
      await addBlocks(newInv.id, blocksToCreate, 0)
    }

    setSelectedInvId(newInv.id)
    const params = new URLSearchParams(searchParams)
    params.set('inv', newInv.id)
    setSearchParams(params, { replace: true })
    setShowCreateModal(false)

    navigate(`/editor/${newInv.id}`)
  }

  if (loading && invitations.length === 0) {
    return (
      <div className="dashboard animate-fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p className="serif-italic" style={{ color: 'var(--olive)', marginTop: 16 }}>Loading your project...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard animate-fade-in">
      {/* Welcome & Invitation Selector */}
      <div className="dash-header" style={{ alignItems: 'flex-start' }}>
        <div className="dash-header-left">
          <h1 className="serif-italic dash-welcome">Welcome, {user?.name || 'Member'}</h1>
          <p className="dash-subtitle">Manage your digital invitations here.</p>
        </div>
        <div className="dash-profile" style={{ flexWrap: 'wrap', gap: 16, alignItems: 'flex-end' }}>
          {invitations.length > 0 && selectedInv && (
            <div className="dash-inv-selector-wrapper" style={{ minWidth: 240 }}>
              <span className="label-caps" style={{ fontSize: 10, display: 'block', marginBottom: 6, color: 'var(--olive)', fontWeight: 600 }}>Select Invitation</span>
              <div style={{ position: 'relative' }}>
                <select 
                  className="settings-input" 
                  value={selectedInvId} 
                  onChange={handleInvChange}
                  style={{ 
                    width: '100%', 
                    paddingRight: 36, 
                    appearance: 'none', 
                    fontWeight: 600,
                    height: 44,
                  }}
                >
                  {invitations.map(inv => (
                    <option key={inv.id} value={inv.id}>{inv.title || 'Untitled Project'}</option>
                  ))}
                </select>
                <HiSelector size={16} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--olive)' }} />
              </div>
            </div>
          )}
          <button 
            className="btn btn-primary dash-create-btn" 
            onClick={() => setShowCreateModal(true)}
          >
            <HiOutlinePlus size={18} /> Create New
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      {invitations.length > 0 && selectedInv && (
        <div className="dash-tabs">
          {[
            { id: 'overview', label: 'Overview', icon: HiOutlineViewGrid },
            { id: 'rsvps', label: 'RSVPs', icon: HiOutlineMail },
            { id: 'wishes', label: 'Wishes', icon: HiOutlineHeart },
            { id: 'guests', label: 'Guest List', icon: HiOutlineUserGroup },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`dash-tab-btn ${activeTab === t.id ? 'active' : ''}`}
            >
              <t.icon size={16} />
              <span className="tab-label-text">{t.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Tab Contents */}
      {invitations.length === 0 ? (
        <div className="empty-state card" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <div className="project-new-icon" style={{ margin: '0 auto 16px auto' }}><HiOutlinePlus size={32} /></div>
          <h2 className="serif-italic" style={{ fontSize: '1.5rem', marginBottom: 8 }}>No Invitations Yet</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>Start by creating your first invitation now.</p>
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>Create New Invitation</button>
        </div>
      ) : activeTab === 'overview' ? (
        /* ----- OVERVIEW TAB ----- */
        <>
          <div className="dash-stats stagger">
            <div className="stat-card">
              <span className="label-caps"><HiOutlineEye size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />Total Views</span>
              <div className="stat-value">{totalViews.toLocaleString()}</div>
              <span className="stat-detail">Untuk undangan ini</span>
            </div>
            <div className="stat-card">
              <span className="label-caps"><HiOutlineMail size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />Total RSVP</span>
              <div className="stat-value">{totalRsvps.toLocaleString()}</div>
              <span className="stat-detail">{responseRate > 0 ? `${responseRate}% response rate` : 'No responses yet'}</span>
            </div>
            <div className="stat-card">
              <span className="label-caps"><HiOutlineCheck size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />Status</span>
              <div className="stat-value" style={{ fontSize: '1.5rem' }}>{selectedInv.status === 'published' ? 'Live' : 'Draft'}</div>
              <span className="stat-badge">{selectedInv.status === 'published' ? 'Ready to Send' : 'Not Published'}</span>
            </div>
          </div>

          <div className="dash-analytics-row">
            <div className="card analytics-card">
              <div className="analytics-header">
                <h3 className="serif-italic" style={{ fontSize: '1.3rem' }}>Response Breakdown</h3>
                <span className="label-caps">Attending vs Not</span>
              </div>
              <div className="analytics-chart">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={chartData} barCategoryGap="25%">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0eded" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#8A8A8A' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#8A8A8A' }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip contentStyle={{ background: '#fff', border: '1px solid #E0DCD8', borderRadius: 8, fontSize: 13 }} labelStyle={{ fontWeight: 600 }} />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="empty-chart">
                    <HiOutlineEye size={32} style={{ color: 'var(--text-light)', marginBottom: 8 }} />
                    <p className="serif-italic" style={{ color: 'var(--text-muted)', fontSize: 14 }}>No data yet</p>
                  </div>
                )}
              </div>
            </div>

            <div className="card activity-card">
              <h4 className="serif-italic" style={{ marginBottom: 20 }}>Recent Guests</h4>
              <div className="activity-list">
                {activityItems.length > 0 ? (
                  activityItems.slice(0, 5).map((item) => (
                    <div key={item.id} className="activity-item">
                      <div className="activity-icon">{item.icon}</div>
                      <div className="activity-content">
                        <p>{item.text}</p>
                        <span className="label-caps" style={{ fontSize: 9 }}>{item.time}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-activity">
                    <HiOutlineMail size={28} style={{ color: 'var(--text-light)', marginBottom: 8 }} />
                    <p className="serif-italic" style={{ color: 'var(--text-muted)', fontSize: 13 }}>No RSVPs yet</p>
                  </div>
                )}
              </div>
              {activityItems.length > 5 && (
                <button className="btn btn-ghost btn-sm" style={{ width: '100%', marginTop: 12 }} onClick={() => setTab('rsvps')}>View All RSVPs</button>
              )}
            </div>
          </div>

          <div className="dash-projects" style={{ marginTop: 40 }}>
            <div className="projects-header">
              <h2 className="serif-italic" style={{ fontSize: '1.4rem' }}>Quick Actions</h2>
            </div>
            <div className="card action-bar">
              <div className="action-bar-preview" style={{ background: selectedInv?.theme?.backgroundColor || '#EDE9E7', minHeight: 100 }}>
                <span className={`badge ${selectedInv?.status === 'published' ? 'badge-published' : 'badge-draft'}`}>
                  {selectedInv?.status === 'published' ? 'Published' : 'Draft'}
                </span>
                <div className="project-thumb-content serif-italic" style={{ color: selectedInv?.theme?.primaryColor || '#565F34', fontSize: '1rem' }}>
                  {selectedInv?.title || 'Untitled'}
                </div>
              </div>
              <div className="action-bar-info">
                <div className="action-bar-title serif-italic">{selectedInv?.title || 'Untitled'}</div>
                <div className="action-bar-meta">
                  {selectedInv?.status === 'published' ? '🟢 Published & Live' : '📝 Draft — not published yet'}
                </div>
                <div className="project-actions">
                  <button className="btn btn-outline btn-sm" onClick={() => navigate(`/editor/${selectedInv?.id}`)}>
                    <HiOutlinePencil size={14} /> Edit Design
                  </button>
                  {selectedInv?.status === 'published' && (
                    <button className="btn btn-ghost btn-sm" onClick={() => window.open(`/undangan/${selectedInv?.slug}`, '_blank')}>
                      <HiOutlineExternalLink size={14} /> View Site
                    </button>
                  )}
                  <button className="project-delete" onClick={() => handleDelete(selectedInv?.id)}>
                    <HiOutlineTrash size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : activeTab === 'rsvps' ? (
        /* ----- RSVPs TAB ----- */
        <div className="rsvps-tab animate-fade-in-up">
          <div className="card" style={{ padding: 28 }}>
            <div className="card-header">
              <div>
                <h3 className="serif-italic" style={{ fontSize: '1.4rem', color: 'var(--olive)' }}>Attendance Confirmation</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>See who is coming to your event.</p>
              </div>
              <button 
                className="btn btn-outline btn-sm" 
                onClick={() => {
                  const csv = [
                    ['Name', 'Attendance', 'Sent At'].join(','),
                    ...activityItems.filter(i => i.isAttending || i.isDeclined).map(i => [i.name, i.isAttending ? 'Attending' : 'Not Attending', i.time].join(','))
                  ].join('\n');
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `RSVP_${selectedInv?.title || 'Invitation'}.csv`;
                  a.click();
                }}
                disabled={activityItems.filter(i => i.isAttending || i.isDeclined).length === 0}
              >
                Export CSV
              </button>
            </div>

            <div className="rsvp-summary-grid">
              <div className="rsvp-summary-card total">
                <div className="rsvp-summary-label" style={{ color: 'var(--text-light)' }}>Total RSVP</div>
                <div className="rsvp-summary-value" style={{ color: 'var(--text-dark)' }}>{activityItems.filter(i => i.isAttending || i.isDeclined).length}</div>
              </div>
              <div className="rsvp-summary-card attending">
                <div className="rsvp-summary-label" style={{ color: 'var(--olive)' }}>Attending</div>
                <div className="rsvp-summary-value" style={{ color: 'var(--olive)' }}>{activityItems.filter(i => i.isAttending).length}</div>
              </div>
              <div className="rsvp-summary-card attending">
                <div className="rsvp-summary-label" style={{ color: 'var(--olive)' }}>Total Pax Hadir</div>
                <div className="rsvp-summary-value" style={{ color: 'var(--olive)' }}>
                  {activityItems.filter(i => i.isAttending).reduce((sum, i) => sum + (i.guestCount || 1), 0)}
                </div>
              </div>
              <div className="rsvp-summary-card declined">
                <div className="rsvp-summary-label" style={{ color: 'var(--pink-dusty)' }}>Not Attending</div>
                <div className="rsvp-summary-value" style={{ color: 'var(--pink-dusty)' }}>{activityItems.filter(i => i.isDeclined).length}</div>
              </div>
            </div>

            {rsvpsLoading ? (
              <p style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>Loading RSVP data...</p>
            ) : activityItems.length === 0 ? (
              <div className="empty-state" style={{ padding: '48px 0', textAlign: 'center' }}>
                <HiOutlineMail size={36} style={{ color: 'var(--text-light)', marginBottom: 12 }} />
                <p className="serif-italic" style={{ color: 'var(--text-light)', fontSize: 15 }}>No guests have filled out this RSVP yet.</p>
              </div>
            ) : (
              <div className="rsvp-table-container">
                <table className="rsvp-table">
                  <thead>
                    <tr>
                      <th>Guest Name</th>
                      <th>Attendance</th>
                      <th>Pax</th>
                      <th>Time</th>
                      <th style={{ width: 50 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {activityItems.filter(item => item.isAttending || item.isDeclined).map((item) => (
                      <tr key={item.id}>
                        <td style={{ fontWeight: 500 }}>{item.name || 'Anonymous'}</td>
                        <td>
                          <span className={`rsvp-attendance-badge ${item.isAttending ? 'attending' : item.isDeclined ? 'declined' : 'unknown'}`}>
                            {item.isAttending ? '✓ Attending' : item.isDeclined ? '✕ Not Attending' : 'Wishes Only'}
                          </span>
                        </td>
                        <td style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-dark)' }}>
                          {item.isAttending ? `${item.guestCount || 1} Orang` : '-'}
                        </td>
                        <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.time}</td>
                        <td style={{ textAlign: 'right' }}>
                          <button 
                            className="btn-icon-only rsvp-delete-btn" 
                            style={{ color: 'var(--pink-dusty)' }}
                            onClick={async () => { 
                              if(confirm('Delete this RSVP?')) {
                                const success = await deleteRsvp(item.id);
                                if (success) {
                                  setAllRsvps(prev => prev.filter(r => r.id !== item.id));
                                }
                              }
                            }}
                            title="Delete"
                          >
                            <HiOutlineTrash size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : activeTab === 'wishes' ? (
               <div className="wishes-tab animate-fade-in-up">
          <div className="card" style={{ padding: 28 }}>
            <div className="card-header">
              <div>
                <h3 className="serif-italic" style={{ fontSize: '1.4rem', color: 'var(--olive)' }}>Wishes & Prayers</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>A collection of sweet messages from your guests.</p>
              </div>
              <button 
                className="btn btn-outline btn-sm" 
                onClick={() => {
                  const wishes = activityItems.filter(item => item.message)
                  const csv = [
                    ['Name', 'Message', 'Sent At'].join(','),
                    ...wishes.map(i => [
                      `"${(i.name || 'Guest').replace(/"/g, '""')}"`,
                      `"${(i.message || '').replace(/"/g, '""')}"`,
                      `"${(i.time || '').replace(/"/g, '""')}"`
                    ].join(','))
                  ].join('\n');
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `Wishes_${selectedInv?.title || 'Invitation'}.csv`;
                  a.click();
                }}
                disabled={activityItems.filter(item => item.message).length === 0}
              >
                Export CSV
              </button>
            </div>

            {rsvpsLoading ? (
              <p style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>Memuat ucapan...</p>
            ) : activityItems.filter(item => item.message).length === 0 ? (
              <div className="empty-state" style={{ padding: '48px 0', textAlign: 'center' }}>
                <HiOutlineHeart size={36} style={{ color: 'var(--text-light)', marginBottom: 12 }} />
                <p className="serif-italic" style={{ color: 'var(--text-light)', fontSize: 15 }}>No wishes from guests yet.</p>
              </div>
            ) : (
              <div className="wishes-masonry">
                {activityItems.filter(item => item.message).map((item) => (
                  <div key={item.id} className="card wish-card">
                    <div className="wish-card-header">
                      <div className="wish-card-author">
                        <div className="wish-card-avatar">
                          {(item.name || 'G').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="wish-card-name">{item.name}</div>
                          <div className="wish-card-time">{item.time}</div>
                        </div>
                      </div>
                      <div className="wish-card-actions">
                        <button 
                          className="btn-icon-only" 
                          style={{ color: 'var(--pink-dusty)' }}
                          onClick={async () => { 
                            if(confirm('Delete this wish?')) {
                              const success = await deleteRsvp(item.id);
                              if (success) {
                                setAllRsvps(prev => prev.filter(r => r.id !== item.id));
                              }
                            }
                          }} 
                        >
                          <HiOutlineTrash size={14} />
                        </button>
                      </div>
                    </div>
                    <p className="wish-card-message">
                      {item.message}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : activeTab === 'guests' ? (
        <GuestListTab 
          invitation={selectedInv} 
          guests={allGuests} 
          setGuests={setAllGuests} 
          loading={guestsLoading} 
        />
      ) : null}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateInvitationModal
          onClose={() => setShowCreateModal(false)}
          onSelect={handleCreateInvitation}
        />
      )}

      {pendingDelete && (
        <div className="confirm-overlay" onClick={() => !deleting && setPendingDelete(null)}>
          <div className="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" onClick={e => e.stopPropagation()}>
            <h3 id="confirm-title">Hapus “{pendingDelete.title}”?</h3>
            <p>Tamu, RSVP, dan ucapan yang masuk ke undangan ini ikut terhapus dan tidak bisa dikembalikan.</p>
            <div className="confirm-actions">
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPendingDelete(null)} disabled={deleting}>Batal</button>
              <button type="button" className="confirm-danger" onClick={confirmDelete} disabled={deleting}>
                {deleting ? 'Menghapus...' : 'Hapus undangan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

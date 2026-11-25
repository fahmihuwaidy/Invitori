/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { nanoid } from 'nanoid'
import { supabase, isConfigured } from '../lib/supabase'
import { useAuth } from './AuthContext'
import { DEMO_INVITATION_SLUGS, getDemoInvitationBySlug } from '../utils/presets'
import { generatePassToken } from '../utils/qr'

const InvitationContext = createContext(null)

const LOCAL_STORAGE_KEYS = {
  invitations: 'invori_local_invitations_v1',
  rsvps: 'invori_local_rsvps_v1',
  guests: 'invori_local_guests_v1',
  views: 'invori_local_views_v1',
}

function readLocalStore(key, fallback) {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function writeLocalStore(key, value) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Ignore storage quota errors
  }
}

function createId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return nanoid()
}

function normalizeGuest(row) {
  if (!row) return null
  return {
    id: row.id,
    invitationId: row.invitation_id ?? row.invitationId,
    name: row.name || '',
    phone: row.phone || '',
    groupName: row.group_name ?? row.groupName ?? 'Regular',
    maxPax: Number(row.max_pax ?? row.maxPax ?? 2) || 2,
    tableName: row.table_name ?? row.tableName ?? '',
    passToken: row.pass_token ?? row.passToken ?? '',
    waSentAt: row.wa_sent_at ?? row.waSentAt ?? null,
    checkedInAt: row.checked_in_at ?? row.checkedInAt ?? null,
    checkedInPax: row.checked_in_pax ?? row.checkedInPax ?? null,
    souvenirClaimed: Boolean(row.souvenir_claimed ?? row.souvenirClaimed ?? false),
    createdAt: row.created_at ?? row.createdAt ?? new Date().toISOString(),
  }
}

function normalizeRsvp(row, invitationTitle = 'Unknown') {
  if (!row) return null
  const inferredType = row.entry_type ?? row.entryType ?? (
    row.attendance == null && row.email === 'wish@invori.com' ? 'wish' : 'rsvp'
  )
  return {
    id: row.id,
    invitationId: row.invitation_id ?? row.invitationId,
    invitationTitle,
    name: row.name || '',
    email: row.email || '',
    whatsapp: row.whatsapp || '',
    entryType: inferredType,
    attendance: row.attendance ?? null,
    guestCount: Number(row.guest_count ?? row.guestCount ?? 1) || 1,
    session: row.session || '',
    dietaryNote: row.dietary_note ?? row.dietaryNote ?? '',
    message: row.message ?? '',
    isHidden: Boolean(row.is_hidden ?? row.isHidden ?? false),
    sentAt: row.sent_at ?? row.sentAt ?? new Date().toISOString(),
  }
}

function isMissingColumnError(error) {
  if (!error) return false
  const code = String(error.code || '')
  const msg = String(error.message || '').toLowerCase()
  return code === '42703' || code === 'PGRST204' || msg.includes('column') || msg.includes('schema cache')
}

export function InvitationProvider({ children }) {
  const { user } = useAuth()
  const [invitations, setInvitations] = useState([])
  const [recentRsvps, setRecentRsvps] = useState([])
  const [loading, setLoading] = useState(true)

  // Ids deleted this session: a refetch already in flight must not bring them back
  const deletedIdsRef = useRef(new Set())
  // Debounced block update timers & pending patches keyed by blockId
  const blockUpdateTimersRef = useRef(new Map())
  const pendingBlockPatchesRef = useRef(new Map())

  useEffect(() => {
    const timersMap = blockUpdateTimersRef.current
    return () => {
      timersMap.forEach((timerId) => clearTimeout(timerId))
      timersMap.clear()
    }
  }, [])

  // Fetch all invitations for the current user (with local fallback when unconfigured)
  const fetchInvitations = useCallback(async (isSilent = false) => {
    if (!user) {
      if (!isConfigured) {
        const localInvs = readLocalStore(LOCAL_STORAGE_KEYS.invitations, [])
        const localRsvps = readLocalStore(LOCAL_STORAGE_KEYS.rsvps, [])
        setInvitations(localInvs.filter(i => !deletedIdsRef.current.has(i.id)))
        const titleMap = {}
        localInvs.forEach(inv => { titleMap[inv.id] = inv.title })
        setRecentRsvps(localRsvps.slice(0, 30).map(r => normalizeRsvp(r, titleMap[r.invitationId || r.invitation_id] || 'Demo Invitation')))
      } else {
        setInvitations([])
        setRecentRsvps([])
      }
      setLoading(false)
      return
    }

    if (!isSilent) {
      setLoading(true)
    }

    if (!isConfigured) {
      const localInvs = readLocalStore(LOCAL_STORAGE_KEYS.invitations, [])
      const localRsvps = readLocalStore(LOCAL_STORAGE_KEYS.rsvps, [])
      setInvitations(localInvs.filter(i => !deletedIdsRef.current.has(i.id)))
      const titleMap = {}
      localInvs.forEach(inv => { titleMap[inv.id] = inv.title })
      setRecentRsvps(localRsvps.slice(0, 30).map(r => normalizeRsvp(r, titleMap[r.invitationId || r.invitation_id] || 'Unknown')))
      setLoading(false)
      return
    }

    try {
      let { data: invData, error: invError } = await supabase
        .from('invitations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (invError) throw invError

      invData = (invData || []).filter(i => !deletedIdsRef.current.has(i.id))
      const invIds = invData.map(i => i.id)
      const blocksMap = {}
      const rsvpCountMap = {}
      let allRsvps = []

      if (invIds.length > 0) {
        const [blocksResult, rsvpsResult] = await Promise.all([
          supabase
            .from('blocks')
            .select('id, invitation_id, type, data, sort_order')
            .in('invitation_id', invIds)
            .order('sort_order', { ascending: true }),
          supabase
            .from('rsvps')
            .select('*')
            .in('invitation_id', invIds)
            .order('sent_at', { ascending: false }),
        ])

        if (!blocksResult.error && blocksResult.data) {
          blocksResult.data.forEach(b => {
            if (!blocksMap[b.invitation_id]) blocksMap[b.invitation_id] = []
            blocksMap[b.invitation_id].push(b)
          })
        }

        if (!rsvpsResult.error && rsvpsResult.data) {
          allRsvps = rsvpsResult.data
          allRsvps.forEach(r => {
            const type = r.entry_type || (r.attendance == null && r.email === 'wish@invori.com' ? 'wish' : 'rsvp')
            if (type === 'rsvp') {
              rsvpCountMap[r.invitation_id] = (rsvpCountMap[r.invitation_id] || 0) + 1
            }
          })
        }
      }

      const composed = invData.map(inv => ({
        id: inv.id,
        title: inv.title,
        slug: inv.slug,
        category: inv.category,
        guestCount: inv.guest_count,
        status: inv.status,
        musicUrl: inv.music_url,
        theme: {
          primaryColor: inv.primary_color,
          backgroundColor: inv.background_color,
          fontFamily: inv.font_family,
        },
        blocks: (blocksMap[inv.id] || []).map(b => {
          let parsedData = b.data
          if (typeof b.data === 'string') {
            try { parsedData = JSON.parse(b.data) } catch { /* ignore parsing errors */ }
          }
          return {
            id: b.id,
            type: b.type,
            data: parsedData || {},
            sortOrder: b.sort_order,
          }
        }),
        analytics: {
          totalViews: inv.total_views || 0,
          rsvpCount: rsvpCountMap[inv.id] || 0,
        },
        createdAt: inv.created_at,
        updatedAt: inv.updated_at,
      }))

      setInvitations(composed)

      const titleMap = {}
      invData.forEach(inv => { titleMap[inv.id] = inv.title })
      const enrichedRsvps = allRsvps
        .slice(0, 30)
        .map(r => normalizeRsvp(r, titleMap[r.invitation_id] || 'Unknown'))
      setRecentRsvps(enrichedRsvps)
    } catch (err) {
      console.error('Error fetching invitations:', err)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchInvitations()
  }, [fetchInvitations])

  // --- Slug validation ---

  const isSlugAvailable = useCallback(async (slug, excludeInvitationId = null) => {
    const cleanSlug = String(slug || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')

    if (!cleanSlug || cleanSlug.length < 3) return false
    if (DEMO_INVITATION_SLUGS.includes(cleanSlug)) return false

    if (!isConfigured) {
      const localInvs = readLocalStore(LOCAL_STORAGE_KEYS.invitations, [])
      return !localInvs.some(
        inv => inv.slug?.toLowerCase() === cleanSlug && inv.id !== excludeInvitationId
      )
    }

    try {
      const { data: rpcAvailable, error: rpcError } = await supabase.rpc('is_slug_available', {
        p_slug: cleanSlug,
        p_exclude_id: excludeInvitationId,
      })
      if (!rpcError && typeof rpcAvailable === 'boolean') {
        return rpcAvailable
      }

      let query = supabase
        .from('invitations')
        .select('id')
        .eq('slug', cleanSlug)
        .limit(1)

      if (excludeInvitationId) {
        query = query.neq('id', excludeInvitationId)
      }

      const { data, error } = await query
      if (error) {
        console.warn('Slug availability check failed, falling back to local check:', error.message)
        return !invitations.some(inv => inv.slug?.toLowerCase() === cleanSlug && inv.id !== excludeInvitationId)
      }
      return !data || data.length === 0
    } catch {
      return !invitations.some(inv => inv.slug?.toLowerCase() === cleanSlug && inv.id !== excludeInvitationId)
    }
  }, [invitations])

  // --- Invitation CRUD Operations ---

  const addInvitation = async ({ title, category, theme, initialBlocks = [] }) => {
    const cleanTitle = (title || 'untitled')
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'invitation'
    const slug = `${cleanTitle}-${Date.now().toString(36)}-${nanoid(6)}`

    if (!isConfigured || !user) {
      if (isConfigured && !user) return null
      const now = new Date().toISOString()
      const invId = createId()
      const preparedBlocks = (initialBlocks || []).map((b, idx) => ({
        id: b.id || createId(),
        type: b.type,
        data: b.data || {},
        sortOrder: idx,
      }))
      const newInv = {
        id: invId,
        title: title || 'Untitled Invitation',
        slug,
        category: category || 'Wedding',
        guestCount: 0,
        status: 'draft',
        theme: {
          primaryColor: theme?.primaryColor || '#344c2d',
          backgroundColor: theme?.backgroundColor || '#f4efea',
          fontFamily: theme?.fontFamily || 'Inter',
        },
        blocks: preparedBlocks,
        analytics: { totalViews: 0, rsvpCount: 0 },
        createdAt: now,
        updatedAt: now,
      }
      setInvitations(prev => {
        const next = [newInv, ...prev]
        writeLocalStore(LOCAL_STORAGE_KEYS.invitations, next)
        return next
      })
      return newInv
    }

    const insertPayload = {
      user_id: user.id,
      title: title || 'Untitled Invitation',
      slug,
      category: category || 'Wedding',
    }
    if (theme?.primaryColor) insertPayload.primary_color = theme.primaryColor
    if (theme?.backgroundColor) insertPayload.background_color = theme.backgroundColor
    if (theme?.fontFamily) insertPayload.font_family = theme.fontFamily

    const { data, error } = await supabase
      .from('invitations')
      .insert(insertPayload)
      .select('id, title, slug, category, guest_count, status, primary_color, background_color, font_family, created_at, updated_at')
      .single()

    if (error || !data) {
      console.error('Error creating invitation:', error)
      return null
    }

    const preparedBlocks = (initialBlocks || []).map((b, idx) => ({
      id: b.id || createId(),
      type: b.type,
      data: b.data || {},
      sortOrder: idx,
    }))

    const newInv = {
      id: data.id,
      title: data.title,
      slug: data.slug,
      category: data.category,
      guestCount: data.guest_count,
      status: data.status,
      theme: {
        primaryColor: data.primary_color || theme?.primaryColor || '#344c2d',
        backgroundColor: data.background_color || theme?.backgroundColor || '#f4efea',
        fontFamily: data.font_family || theme?.fontFamily || 'Inter',
      },
      blocks: preparedBlocks,
      analytics: { totalViews: 0, rsvpCount: 0 },
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }

    setInvitations(prev => [newInv, ...prev])

    if (preparedBlocks.length > 0) {
      const blocksToInsert = preparedBlocks.map(b => ({
        id: b.id,
        invitation_id: data.id,
        type: b.type,
        data: b.data,
        sort_order: b.sortOrder,
      }))

      supabase
        .from('blocks')
        .insert(blocksToInsert)
        .then(({ error: blockError }) => {
          if (blockError) {
            console.error('Background blocks insert error:', blockError)
          }
        })
    }

    return newInv
  }

  const updateInvitation = async (id, updates) => {
    const dbUpdates = {}
    if (updates.title !== undefined) dbUpdates.title = updates.title
    if (updates.slug !== undefined) dbUpdates.slug = updates.slug
    if (updates.category !== undefined) dbUpdates.category = updates.category
    if (updates.guestCount !== undefined) dbUpdates.guest_count = updates.guestCount
    if (updates.status !== undefined) dbUpdates.status = updates.status
    if (updates.updatedAt !== undefined) dbUpdates.updated_at = updates.updatedAt
    if (updates.musicUrl !== undefined) dbUpdates.music_url = updates.musicUrl
    if (updates.theme) {
      if (updates.theme.primaryColor !== undefined) dbUpdates.primary_color = updates.theme.primaryColor
      if (updates.theme.backgroundColor !== undefined) dbUpdates.background_color = updates.theme.backgroundColor
      if (updates.theme.fontFamily !== undefined) dbUpdates.font_family = updates.theme.fontFamily
    }

    const updatedAt = updates.updatedAt || new Date().toISOString()
    setInvitations(prev => {
      const next = prev.map(inv =>
        inv.id === id ? { ...inv, ...updates, updatedAt } : inv
      )
      if (!isConfigured) writeLocalStore(LOCAL_STORAGE_KEYS.invitations, next)
      return next
    })

    if (!isConfigured || Object.keys(dbUpdates).length === 0) return true

    try {
      const { error } = await supabase
        .from('invitations')
        .update(dbUpdates)
        .eq('id', id)

      if (error) {
        console.error('Error updating invitation in DB:', error)
        fetchInvitations(true)
        return false
      }
      return true
    } catch (err) {
      console.error('Critical error in updateInvitation:', err)
      fetchInvitations(true)
      return false
    }
  }

  const deleteInvitation = async (id) => {
    if (!id) return false

    deletedIdsRef.current.add(id)
    setInvitations(prev => {
      const next = prev.filter(inv => inv.id !== id)
      if (!isConfigured) writeLocalStore(LOCAL_STORAGE_KEYS.invitations, next)
      return next
    })

    if (!isConfigured) return true

    try {
      const { error } = await supabase
        .from('invitations')
        .delete()
        .eq('id', id)

      if (error) {
        if (error.code === '23503') {
          await Promise.allSettled([
            supabase.from('blocks').delete().eq('invitation_id', id),
            supabase.from('rsvps').delete().eq('invitation_id', id),
            supabase.from('guests').delete().eq('invitation_id', id),
          ])
          const { error: retryError } = await supabase.from('invitations').delete().eq('id', id)
          if (retryError) throw retryError
        } else {
          throw error
        }
      }

      return true
    } catch (err) {
      console.error('Critical error in deleteInvitation:', err)
      deletedIdsRef.current.delete(id)
      await fetchInvitations(true)
      return false
    }
  }

  // --- Block Operations ---

  const addBlock = async (invId, blockType, blockData, explicitOrder) => {
    const targetIndex = explicitOrder !== undefined ? explicitOrder : 0

    if (!isConfigured) {
      const newBlock = {
        id: createId(),
        type: blockType,
        data: blockData || {},
        sortOrder: targetIndex,
      }
      setInvitations(prev => {
        const next = prev.map(item => {
          if (item.id !== invId) return item
          const updatedBlocks = [...item.blocks]
          const actualIndex = explicitOrder !== undefined ? explicitOrder : updatedBlocks.length
          updatedBlocks.splice(actualIndex, 0, newBlock)
          return {
            ...item,
            blocks: updatedBlocks.map((b, idx) => ({ ...b, sortOrder: idx })),
            updatedAt: new Date().toISOString(),
          }
        })
        writeLocalStore(LOCAL_STORAGE_KEYS.invitations, next)
        return next
      })
      return newBlock
    }

    const { data, error } = await supabase
      .from('blocks')
      .insert({
        invitation_id: invId,
        type: blockType,
        data: blockData,
        sort_order: targetIndex,
      })
      .select()
      .single()

    if (error || !data) {
      console.error('Error adding block:', error)
      return null
    }

    const newBlock = { id: data.id, type: data.type, data: data.data, sortOrder: data.sort_order }
    let reindexedBlocks = []

    setInvitations(prev => {
      return prev.map(item => {
        if (item.id !== invId) return item
        const updatedBlocks = [...item.blocks]
        const actualIndex = explicitOrder !== undefined ? explicitOrder : updatedBlocks.length
        updatedBlocks.splice(actualIndex, 0, newBlock)

        reindexedBlocks = updatedBlocks.map((b, idx) => ({ ...b, sortOrder: idx }))
        return {
          ...item,
          blocks: reindexedBlocks,
          updatedAt: new Date().toISOString(),
        }
      })
    })

    setTimeout(async () => {
      if (reindexedBlocks.length > 0) {
        const syncPromises = reindexedBlocks.map((b, idx) =>
          supabase.from('blocks').update({ sort_order: idx }).eq('id', b.id)
        )
        await Promise.all(syncPromises)
      }
    }, 0)

    return newBlock
  }

  const addBlocks = async (invId, blocksArray, explicitBaseOrder) => {
    let baseOrder = explicitBaseOrder
    if (baseOrder === undefined) {
      const inv = invitations.find(i => i.id === invId)
      baseOrder = inv?.blocks ? inv.blocks.length : 0
    }

    const blocksToInsert = blocksArray.map((b, index) => ({
      id: b.id || createId(),
      invitation_id: invId,
      type: b.type,
      data: b.data,
      sort_order: baseOrder + index,
    }))

    const newBlocksSorted = blocksToInsert.map(d => ({
      id: d.id,
      type: d.type,
      data: typeof d.data === 'string' ? JSON.parse(d.data) : d.data,
      sortOrder: d.sort_order,
    }))

    setInvitations(prev => {
      const next = prev.map(item => {
        if (item.id !== invId) return item
        const combined = [...item.blocks, ...newBlocksSorted]
        const finalBlocks = combined.map((b, idx) => ({ ...b, sortOrder: idx }))
        return {
          ...item,
          blocks: finalBlocks,
          updatedAt: new Date().toISOString(),
        }
      })
      if (!isConfigured) writeLocalStore(LOCAL_STORAGE_KEYS.invitations, next)
      return next
    })

    if (!isConfigured) return newBlocksSorted

    try {
      const { error } = await supabase
        .from('blocks')
        .insert(blocksToInsert)

      if (error) {
        console.error('Error adding bulk blocks in DB:', error)
        fetchInvitations(true)
        return null
      }

      return newBlocksSorted
    } catch (err) {
      console.error('Exception in addBlocks:', err)
      fetchInvitations(true)
      return null
    }
  }

  // Instant optimistic local state update + 400ms debounced DB persistence
  const updateBlock = useCallback((invId, blockId, blockData) => {
    setInvitations(prev => {
      const next = prev.map(inv => {
        if (inv.id !== invId) return inv
        return {
          ...inv,
          blocks: inv.blocks.map(b =>
            b.id === blockId ? { ...b, data: { ...b.data, ...blockData } } : b
          ),
          updatedAt: new Date().toISOString(),
        }
      })
      if (!isConfigured) writeLocalStore(LOCAL_STORAGE_KEYS.invitations, next)
      return next
    })

    if (!isConfigured) return

    // Merge pending patch for this blockId so rapid typing coalesces cleanly
    const existingPatch = pendingBlockPatchesRef.current.get(blockId) || {}
    pendingBlockPatchesRef.current.set(blockId, { ...existingPatch, ...blockData })

    const existingTimer = blockUpdateTimersRef.current.get(blockId)
    if (existingTimer) {
      clearTimeout(existingTimer)
    }

    const timerId = setTimeout(async () => {
      blockUpdateTimersRef.current.delete(blockId)
      const accumulatedPatch = pendingBlockPatchesRef.current.get(blockId)
      pendingBlockPatchesRef.current.delete(blockId)

      if (!accumulatedPatch) return

      try {
        const { data: currentBlock } = await supabase
          .from('blocks')
          .select('data')
          .eq('id', blockId)
          .single()

        let parsedCurrentData = currentBlock?.data || {}
        if (typeof parsedCurrentData === 'string') {
          try {
            parsedCurrentData = JSON.parse(parsedCurrentData)
          } catch {
            parsedCurrentData = {}
          }
        }

        const finalMergedData = { ...parsedCurrentData, ...accumulatedPatch }
        const { error } = await supabase
          .from('blocks')
          .update({ data: finalMergedData })
          .eq('id', blockId)

        if (error) {
          console.error('Error updating block:', error)
        }
      } catch (err) {
        console.error('Exception in debounced updateBlock:', err)
      }
    }, 400)

    blockUpdateTimersRef.current.set(blockId, timerId)
  }, [])

  const deleteBlock = async (invId, blockId) => {
    const pendingTimer = blockUpdateTimersRef.current.get(blockId)
    if (pendingTimer) {
      clearTimeout(pendingTimer)
      blockUpdateTimersRef.current.delete(blockId)
      pendingBlockPatchesRef.current.delete(blockId)
    }

    setInvitations(prev => {
      const next = prev.map(inv => {
        if (inv.id !== invId) return inv
        return {
          ...inv,
          blocks: inv.blocks.filter(b => b.id !== blockId),
          updatedAt: new Date().toISOString(),
        }
      })
      if (!isConfigured) writeLocalStore(LOCAL_STORAGE_KEYS.invitations, next)
      return next
    })

    if (!isConfigured) return

    const { error } = await supabase
      .from('blocks')
      .delete()
      .eq('id', blockId)

    if (error) {
      console.error('Error deleting block:', error)
      fetchInvitations(true)
    }
  }

  const reorderBlocks = async (invId, newBlocks) => {
    setInvitations(prev => {
      const next = prev.map(inv => {
        if (inv.id !== invId) return inv
        return { ...inv, blocks: newBlocks, updatedAt: new Date().toISOString() }
      })
      if (!isConfigured) writeLocalStore(LOCAL_STORAGE_KEYS.invitations, next)
      return next
    })

    if (!isConfigured) return

    const updates = newBlocks.map((b, index) =>
      supabase.from('blocks').update({ sort_order: index }).eq('id', b.id)
    )

    try {
      await Promise.all(updates)
    } catch (err) {
      console.error('Error reordering blocks:', err)
    }
  }

  // --- Public page operations (no auth required) ---

  const fetchPublicInvitation = useCallback(async (slug, isPreview = false) => {
    if (!isConfigured) {
      const localInvs = readLocalStore(LOCAL_STORAGE_KEYS.invitations, [])
      const localMatch = localInvs.find(i =>
        i.slug === slug && (isPreview || i.status === 'published')
      )
      const base = localMatch || getDemoInvitationBySlug(slug)
      if (!base) return null

      const localRsvps = readLocalStore(LOCAL_STORAGE_KEYS.rsvps, [])
      const invWishes = localRsvps
        .filter(r => (r.invitationId || r.invitation_id) === base.id && !r.isHidden && !r.is_hidden && (r.message || '').trim().length > 0)
        .map(r => ({
          id: r.id,
          author: r.name,
          content: r.message,
          attendance: r.attendance,
          entryType: r.entryType || r.entry_type || 'wish',
          date: r.sentAt || r.sent_at,
        }))

      return {
        ...base,
        wishes: [...invWishes, ...(base.wishes || [])],
      }
    }

    try {
      let query = supabase
        .from('invitations')
        .select('*')
        .eq('slug', slug)
        .limit(1)

      if (!isPreview) {
        query = query.eq('status', 'published')
      }

      const { data: inv, error: invError } = await query.maybeSingle()

      if (invError || !inv) {
        return getDemoInvitationBySlug(slug)
      }

      let blockData = []
      try {
        const { data, error: blockErr } = await supabase
          .from('blocks')
          .select('*')
          .eq('invitation_id', inv.id)
          .order('sort_order', { ascending: true })
        if (!blockErr && data) blockData = data
      } catch (err) {
        console.warn('Failed to fetch invitation blocks:', err)
      }

      let rsvpData = []
      try {
        const { data, error: rsvpErr } = await supabase
          .from('rsvps')
          .select('*')
          .eq('invitation_id', inv.id)
          .not('message', 'is', null)
          .order('sent_at', { ascending: false })
        if (!rsvpErr && data) rsvpData = data
      } catch (err) {
        console.warn('Failed to fetch public wishes (pending migration or RLS):', err)
      }

      const visibleWishes = (rsvpData || [])
        .filter(r => !r.is_hidden && (r.message || '').trim().length > 0)
        .map(r => ({
          id: r.id,
          author: r.name,
          content: r.message,
          attendance: r.attendance,
          entryType: r.entry_type || (r.attendance == null && r.email === 'wish@invori.com' ? 'wish' : 'rsvp'),
          date: r.sent_at,
        }))

      return {
        id: inv.id,
        title: inv.title,
        slug: inv.slug,
        category: inv.category,
        guestCount: inv.guest_count,
        status: inv.status,
        musicUrl: inv.music_url,
        theme: {
          primaryColor: inv.primary_color,
          backgroundColor: inv.background_color,
          fontFamily: inv.font_family,
        },
        blocks: (blockData || []).map(b => {
          let parsedData = b.data
          if (typeof b.data === 'string') {
            try {
              parsedData = JSON.parse(b.data)
            } catch (e) {
              console.error('Error parsing block data:', e)
            }
          }
          return {
            id: b.id,
            type: b.type,
            data: parsedData || {},
            sortOrder: b.sort_order,
          }
        }),
        wishes: visibleWishes,
        analytics: { totalViews: inv.total_views || 0 },
        createdAt: inv.created_at,
      }
    } catch {
      return getDemoInvitationBySlug(slug)
    }
  }, [])

  const incrementView = useCallback(async (invId, meta = {}) => {
    if (!invId) return
    if (!isConfigured || String(invId).startsWith('demo-')) {
      const views = readLocalStore(LOCAL_STORAGE_KEYS.views, [])
      views.push({
        id: createId(),
        invitationId: invId,
        guestToken: meta.guestToken || null,
        source: meta.source || null,
        viewedAt: new Date().toISOString(),
      })
      writeLocalStore(LOCAL_STORAGE_KEYS.views, views.slice(-500))
      return
    }

    const { error } = await supabase.rpc('increment_view', {
      inv_id: invId,
      p_guest_token: meta.guestToken || null,
      p_source: meta.source || null,
    })

    if (error) {
      // Fallback for older 1-arg RPC signature
      await supabase.rpc('increment_view', { inv_id: invId })
    }
  }, [])

  // --- RSVPs & Wishes ---

  const addRsvp = useCallback(async (invId, rsvpData) => {
    const inferredEntryType = rsvpData.entryType || rsvpData.entry_type || (
      rsvpData.attendance == null && rsvpData.email === 'wish@invori.com' ? 'wish' : 'rsvp'
    )

    const fullPayload = {
      invitation_id: invId,
      name: rsvpData.name,
      email: rsvpData.email || null,
      whatsapp: rsvpData.whatsapp || null,
      entry_type: inferredEntryType,
      attendance: inferredEntryType === 'wish' ? (rsvpData.attendance ?? null) : (rsvpData.attendance || 'yes'),
      guest_count: rsvpData.guestCount || rsvpData.guest_count || 1,
      session: rsvpData.session || null,
      dietary_note: rsvpData.dietaryNote || rsvpData.dietary_note || null,
      message: rsvpData.message || null,
      is_hidden: Boolean(rsvpData.isHidden ?? rsvpData.is_hidden ?? false),
    }

    if (!isConfigured || String(invId).startsWith('demo-')) {
      const localRsvps = readLocalStore(LOCAL_STORAGE_KEYS.rsvps, [])
      const created = normalizeRsvp({
        id: createId(),
        ...fullPayload,
        sent_at: rsvpData.sentAt || new Date().toISOString(),
      })
      const next = [created, ...localRsvps]
      writeLocalStore(LOCAL_STORAGE_KEYS.rsvps, next)
      setRecentRsvps(prev => [created, ...prev].slice(0, 30))
      return true
    }

    let { error } = await supabase.from('rsvps').insert(fullPayload)

    // Resilience fallback if schema migration hasn't been applied yet
    if (error && isMissingColumnError(error)) {
      console.warn('New rsvps columns missing in DB; falling back to legacy insert payload:', error.message)
      const legacyPayload = {
        invitation_id: invId,
        name: fullPayload.name,
        email: fullPayload.email,
        attendance: fullPayload.attendance,
        guest_count: fullPayload.guest_count,
        message: fullPayload.message,
      }
      const retry = await supabase.from('rsvps').insert(legacyPayload)
      error = retry.error
    }

    if (error) {
      console.error('Error adding RSVP:', error)
      return false
    }
    return true
  }, [])

  const fetchInvitationRsvps = useCallback(async (invId) => {
    if (!invId) return []
    const invTitle = invitations.find(i => i.id === invId)?.title || 'Unknown'

    if (!isConfigured || String(invId).startsWith('demo-')) {
      const localRsvps = readLocalStore(LOCAL_STORAGE_KEYS.rsvps, [])
      return localRsvps
        .filter(r => (r.invitationId || r.invitation_id) === invId)
        .map(r => normalizeRsvp(r, invTitle))
    }

    const { data, error } = await supabase
      .from('rsvps')
      .select('*')
      .eq('invitation_id', invId)
      .order('sent_at', { ascending: false })

    if (error) {
      console.error('Error fetching invitation RSVPs:', error)
      return []
    }
    return (data || []).map(r => normalizeRsvp(r, invTitle))
  }, [invitations])

  const toggleWishVisibility = useCallback(async (rsvpId, nextHidden) => {
    if (!rsvpId) return false

    let resolvedHidden = nextHidden
    if (typeof resolvedHidden !== 'boolean') {
      const existing = recentRsvps.find(r => r.id === rsvpId)
      resolvedHidden = existing ? !existing.isHidden : true
    }

    setRecentRsvps(prev => prev.map(r => (r.id === rsvpId ? { ...r, isHidden: resolvedHidden } : r)))

    if (!isConfigured) {
      const localRsvps = readLocalStore(LOCAL_STORAGE_KEYS.rsvps, [])
      const next = localRsvps.map(r => (r.id === rsvpId ? { ...r, isHidden: resolvedHidden, is_hidden: resolvedHidden } : r))
      writeLocalStore(LOCAL_STORAGE_KEYS.rsvps, next)
      return true
    }

    const { error } = await supabase
      .from('rsvps')
      .update({ is_hidden: resolvedHidden })
      .eq('id', rsvpId)

    if (error) {
      console.error('Error toggling wish visibility:', error)
      fetchInvitations(true)
      return false
    }
    return true
  }, [recentRsvps, fetchInvitations])

  const deleteRsvp = useCallback(async (rsvpId) => {
    setRecentRsvps(prev => prev.filter(r => r.id !== rsvpId))

    if (!isConfigured) {
      const localRsvps = readLocalStore(LOCAL_STORAGE_KEYS.rsvps, [])
      writeLocalStore(LOCAL_STORAGE_KEYS.rsvps, localRsvps.filter(r => r.id !== rsvpId))
      return true
    }

    const { error } = await supabase.from('rsvps').delete().eq('id', rsvpId)
    if (error) {
      console.error('Error deleting RSVP:', error)
      fetchInvitations(true)
      return false
    }
    fetchInvitations(true)
    return true
  }, [fetchInvitations])

  // --- Guest Management & Gate Check-In ---

  const fetchGuests = useCallback(async (invId) => {
    if (!invId) return []

    if (!isConfigured || String(invId).startsWith('demo-')) {
      const localGuests = readLocalStore(LOCAL_STORAGE_KEYS.guests, [])
      return localGuests
        .filter(g => (g.invitationId || g.invitation_id) === invId)
        .map(normalizeGuest)
    }

    const { data, error } = await supabase
      .from('guests')
      .select('*')
      .eq('invitation_id', invId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching guests:', error)
      return []
    }
    return (data || []).map(normalizeGuest)
  }, [])

  const addGuest = useCallback(async (invId, guestData) => {
    if (!invId || !guestData?.name) return null

    const insertPayload = {
      invitation_id: invId,
      name: String(guestData.name).trim(),
      phone: guestData.phone ? String(guestData.phone).trim() : null,
      group_name: guestData.groupName || guestData.group_name || 'Regular',
      max_pax: Math.max(1, Number(guestData.maxPax ?? guestData.max_pax ?? 2) || 2),
      table_name: guestData.tableName ?? guestData.table_name ?? null,
      pass_token: guestData.passToken || guestData.pass_token || generatePassToken(),
      souvenir_claimed: Boolean(guestData.souvenirClaimed ?? guestData.souvenir_claimed ?? false),
    }

    if (!isConfigured || String(invId).startsWith('demo-')) {
      const created = normalizeGuest({
        id: createId(),
        ...insertPayload,
        created_at: new Date().toISOString(),
      })
      const localGuests = readLocalStore(LOCAL_STORAGE_KEYS.guests, [])
      writeLocalStore(LOCAL_STORAGE_KEYS.guests, [created, ...localGuests])
      return created
    }

    let { data, error } = await supabase
      .from('guests')
      .insert(insertPayload)
      .select()
      .single()

    if (error && isMissingColumnError(error)) {
      console.warn('New guests columns missing in DB; falling back to legacy guest insert:', error.message)
      const retry = await supabase
        .from('guests')
        .insert({
          invitation_id: invId,
          name: insertPayload.name,
          phone: insertPayload.phone,
        })
        .select()
        .single()
      data = retry.data
      error = retry.error
    }

    if (error || !data) {
      console.error('Error adding guest:', error)
      return null
    }
    return normalizeGuest(data)
  }, [])

  const addGuestsBulk = useCallback(async (invId, guestsArray) => {
    if (!invId || !Array.isArray(guestsArray) || guestsArray.length === 0) return []

    const rows = guestsArray
      .filter(g => g?.name && String(g.name).trim())
      .map(g => ({
        invitation_id: invId,
        name: String(g.name).trim(),
        phone: g.phone ? String(g.phone).trim() : null,
        group_name: g.groupName || g.group_name || 'Regular',
        max_pax: Math.max(1, Number(g.maxPax ?? g.max_pax ?? 2) || 2),
        table_name: g.tableName ?? g.table_name ?? null,
        pass_token: g.passToken || g.pass_token || generatePassToken(),
        souvenir_claimed: false,
      }))

    if (rows.length === 0) return []

    if (!isConfigured || String(invId).startsWith('demo-')) {
      const now = new Date().toISOString()
      const created = rows.map(r => normalizeGuest({ id: createId(), ...r, created_at: now }))
      const localGuests = readLocalStore(LOCAL_STORAGE_KEYS.guests, [])
      writeLocalStore(LOCAL_STORAGE_KEYS.guests, [...created, ...localGuests])
      return created
    }

    let { data, error } = await supabase
      .from('guests')
      .insert(rows)
      .select()

    if (error && isMissingColumnError(error)) {
      console.warn('New guests columns missing in DB; falling back to legacy bulk guest insert:', error.message)
      const retry = await supabase
        .from('guests')
        .insert(rows.map(r => ({ invitation_id: r.invitation_id, name: r.name, phone: r.phone })))
        .select()
      data = retry.data
      error = retry.error
    }

    if (error || !data) {
      console.error('Error bulk inserting guests:', error)
      return []
    }
    return data.map(normalizeGuest)
  }, [])

  const updateGuest = useCallback(async (guestId, updates) => {
    if (!guestId) return null

    const dbUpdates = {}
    if (updates.name !== undefined) dbUpdates.name = String(updates.name).trim()
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone ? String(updates.phone).trim() : null
    if (updates.groupName !== undefined || updates.group_name !== undefined) {
      dbUpdates.group_name = updates.groupName ?? updates.group_name
    }
    if (updates.maxPax !== undefined || updates.max_pax !== undefined) {
      dbUpdates.max_pax = Math.max(1, Number(updates.maxPax ?? updates.max_pax) || 1)
    }
    if (updates.tableName !== undefined || updates.table_name !== undefined) {
      dbUpdates.table_name = updates.tableName ?? updates.table_name ?? null
    }
    if (updates.waSentAt !== undefined || updates.wa_sent_at !== undefined) {
      dbUpdates.wa_sent_at = updates.waSentAt ?? updates.wa_sent_at
    }
    if (updates.checkedInAt !== undefined || updates.checked_in_at !== undefined) {
      dbUpdates.checked_in_at = updates.checkedInAt ?? updates.checked_in_at
    }
    if (updates.checkedInPax !== undefined || updates.checked_in_pax !== undefined) {
      dbUpdates.checked_in_pax = updates.checkedInPax ?? updates.checked_in_pax
    }
    if (updates.souvenirClaimed !== undefined || updates.souvenir_claimed !== undefined) {
      dbUpdates.souvenir_claimed = Boolean(updates.souvenirClaimed ?? updates.souvenir_claimed)
    }

    if (!isConfigured) {
      const localGuests = readLocalStore(LOCAL_STORAGE_KEYS.guests, [])
      let updatedGuest = null
      const next = localGuests.map(g => {
        if (g.id !== guestId) return g
        updatedGuest = normalizeGuest({ ...g, ...dbUpdates, ...updates })
        return updatedGuest
      })
      writeLocalStore(LOCAL_STORAGE_KEYS.guests, next)
      return updatedGuest
    }

    const { data, error } = await supabase
      .from('guests')
      .update(dbUpdates)
      .eq('id', guestId)
      .select()
      .single()

    if (error || !data) {
      console.error('Error updating guest:', error)
      return null
    }
    return normalizeGuest(data)
  }, [])

  const deleteGuest = useCallback(async (guestId) => {
    if (!guestId) return false

    if (!isConfigured) {
      const localGuests = readLocalStore(LOCAL_STORAGE_KEYS.guests, [])
      writeLocalStore(LOCAL_STORAGE_KEYS.guests, localGuests.filter(g => g.id !== guestId))
      return true
    }

    const { error } = await supabase.from('guests').delete().eq('id', guestId)
    if (error) {
      console.error('Error deleting guest:', error)
      return false
    }
    return true
  }, [])

  const markGuestWaSent = useCallback(async (guestId) => {
    return updateGuest(guestId, { waSentAt: new Date().toISOString() })
  }, [updateGuest])

  /**
   * Anti-duplicate check-in by passToken or guestId.
   * Accepts either an options object:
   *   checkInGuest({ invitationId, passToken, guestId, checkedInPax, souvenirClaimed })
   * or positional args:
   *   checkInGuest(passTokenOrId, { invitationId, checkedInPax, souvenirClaimed })
   */
  const checkInGuest = useCallback(async (identifierOrPayload, maybeOptions = {}) => {
    const payload = typeof identifierOrPayload === 'string'
      ? { passToken: identifierOrPayload, ...maybeOptions }
      : (identifierOrPayload || {})

    const invitationId = payload.invitationId || payload.invitation_id || null
    const passToken = payload.passToken || payload.pass_token || null
    const guestId = payload.guestId || payload.guest_id || null
    const requestedPax = payload.checkedInPax ?? payload.checked_in_pax
    const souvenirClaimed = Boolean(payload.souvenirClaimed ?? payload.souvenir_claimed ?? false)

    if (!passToken && !guestId) {
      return { success: false, status: 'invalid_input', error: 'A pass token or guest ID is required.' }
    }

    if (!isConfigured) {
      const localGuests = readLocalStore(LOCAL_STORAGE_KEYS.guests, [])
      const match = localGuests.find(g => {
        if (invitationId && (g.invitationId || g.invitation_id) !== invitationId) return false
        if (guestId && g.id === guestId) return true
        if (passToken && (g.passToken || g.pass_token) === passToken) return true
        return false
      })

      if (!match) {
        return { success: false, status: 'not_found', error: 'Guest pass not found.' }
      }

      const normalized = normalizeGuest(match)
      if (normalized.checkedInAt) {
        return {
          success: false,
          alreadyCheckedIn: true,
          status: 'already_checked_in',
          guest: normalized,
          error: `${normalized.name} has already checked in.`,
        }
      }

      const now = new Date().toISOString()
      const finalPax = Math.max(1, Number(requestedPax ?? normalized.maxPax ?? 1) || 1)
      const updated = normalizeGuest({
        ...normalized,
        checkedInAt: now,
        checkedInPax: finalPax,
        souvenirClaimed,
      })

      const next = localGuests.map(g => (g.id === updated.id ? updated : g))
      writeLocalStore(LOCAL_STORAGE_KEYS.guests, next)

      return {
        success: true,
        alreadyCheckedIn: false,
        status: 'checked_in',
        guest: updated,
      }
    }

    // Supabase lookup
    let lookup = supabase.from('guests').select('*')
    if (invitationId) lookup = lookup.eq('invitation_id', invitationId)
    if (guestId) {
      lookup = lookup.eq('id', guestId)
    } else {
      lookup = lookup.eq('pass_token', passToken)
    }

    const { data: existingRow, error: lookupError } = await lookup.maybeSingle()
    if (lookupError) {
      console.error('Error finding guest for check-in:', lookupError)
      return { success: false, status: 'error', error: lookupError.message }
    }

    if (!existingRow) {
      return { success: false, status: 'not_found', error: 'Guest pass not found for this invitation.' }
    }

    const existingGuest = normalizeGuest(existingRow)
    if (existingGuest.checkedInAt) {
      return {
        success: false,
        alreadyCheckedIn: true,
        status: 'already_checked_in',
        guest: existingGuest,
        error: `${existingGuest.name} has already checked in.`,
      }
    }

    const finalPax = Math.max(1, Number(requestedPax ?? existingGuest.maxPax ?? 1) || 1)
    const now = new Date().toISOString()

    // Conditional update (.is('checked_in_at', null)) guards against concurrent double check-in
    const { data: updatedRow, error: updateError } = await supabase
      .from('guests')
      .update({
        checked_in_at: now,
        checked_in_pax: finalPax,
        souvenir_claimed: souvenirClaimed,
      })
      .eq('id', existingGuest.id)
      .is('checked_in_at', null)
      .select()
      .maybeSingle()

    if (updateError) {
      console.error('Error checking in guest:', updateError)
      return { success: false, status: 'error', error: updateError.message }
    }

    if (!updatedRow) {
      // Concurrent check-in happened between read and write
      const { data: freshRow } = await supabase.from('guests').select('*').eq('id', existingGuest.id).maybeSingle()
      const freshGuest = normalizeGuest(freshRow) || existingGuest
      return {
        success: false,
        alreadyCheckedIn: true,
        status: 'already_checked_in',
        guest: freshGuest,
        error: `${freshGuest.name} has already checked in.`,
      }
    }

    return {
      success: true,
      alreadyCheckedIn: false,
      status: 'checked_in',
      guest: normalizeGuest(updatedRow),
    }
  }, [])

  // --- Analytics ---

  const fetchInvitationAnalytics = useCallback(async (invId) => {
    if (!invId) return { views: [], totalViews: 0 }

    if (!isConfigured || String(invId).startsWith('demo-')) {
      const views = readLocalStore(LOCAL_STORAGE_KEYS.views, []).filter(v => v.invitationId === invId)
      return { views, totalViews: views.length }
    }

    const { data, error } = await supabase
      .from('invitation_views')
      .select('id, guest_token, source, viewed_at')
      .eq('invitation_id', invId)
      .order('viewed_at', { ascending: false })
      .limit(500)

    if (error) {
      return { views: [], totalViews: 0 }
    }

    return {
      views: (data || []).map(v => ({
        id: v.id,
        guestToken: v.guest_token,
        source: v.source,
        viewedAt: v.viewed_at,
      })),
      totalViews: (data || []).length,
    }
  }, [])

  const value = {
    invitations,
    recentRsvps,
    loading,
    addInvitation,
    updateInvitation,
    deleteInvitation,
    addBlock,
    addBlocks,
    updateBlock,
    deleteBlock,
    reorderBlocks,
    fetchPublicInvitation,
    incrementView,
    addRsvp,
    fetchInvitationRsvps,
    toggleWishVisibility,
    deleteRsvp,
    fetchGuests,
    addGuest,
    addGuestsBulk,
    updateGuest,
    deleteGuest,
    markGuestWaSent,
    checkInGuest,
    isSlugAvailable,
    fetchInvitationAnalytics,
    refreshInvitations: fetchInvitations,
  }

  return (
    <InvitationContext.Provider value={value}>
      {children}
    </InvitationContext.Provider>
  )
}

export function useInvitations() {
  const ctx = useContext(InvitationContext)
  if (!ctx) throw new Error('useInvitations must be inside InvitationProvider')
  return ctx
}

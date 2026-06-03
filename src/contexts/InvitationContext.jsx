/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { nanoid } from 'nanoid'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

const InvitationContext = createContext(null)

export function InvitationProvider({ children }) {
  const { user } = useAuth()
  const [invitations, setInvitations] = useState([])
  const [recentRsvps, setRecentRsvps] = useState([])
  const [loading, setLoading] = useState(true)

  // Fetch all invitations for the current user
  const fetchInvitations = useCallback(async (isSilent = false) => {
    if (!user) {
      setInvitations([])
      setLoading(false)
      return
    }

    if (!isSilent) {
      setLoading(true)
    }
    try {
      // Fetch invitations
      const { data: invData, error: invError } = await supabase
        .from('invitations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (invError) throw invError

      // Fetch blocks for all invitations
      const invIds = invData.map(i => i.id)
      let blocksMap = {}
      if (invIds.length > 0) {
        const { data: blockData, error: blockError } = await supabase
          .from('blocks')
          .select('*')
          .in('invitation_id', invIds)
          .order('sort_order', { ascending: true })

        if (blockError) throw blockError

        blockData.forEach(b => {
          if (!blocksMap[b.invitation_id]) blocksMap[b.invitation_id] = []
          blocksMap[b.invitation_id].push(b)
        })
      }

      // Fetch RSVPs with full details
      let rsvpMap = {}
      let allRsvps = []
      if (invIds.length > 0) {
        const { data: rsvpData, error: rsvpError } = await supabase
          .from('rsvps')
          .select('*')
          .in('invitation_id', invIds)
          .order('sent_at', { ascending: false })

        if (!rsvpError && rsvpData) {
          allRsvps = rsvpData
          rsvpData.forEach(r => {
            rsvpMap[r.invitation_id] = (rsvpMap[r.invitation_id] || 0) + 1
          })
        }
      }

      // Compose full invitation objects
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
          let parsedData = b.data;
          if (typeof b.data === 'string') {
            try { parsedData = JSON.parse(b.data); } catch { /* ignore parsing errors */ }
          }
          return {
            id: b.id,
            type: b.type,
            data: parsedData || {},
            sortOrder: b.sort_order,
          }
        }),
        analytics: {
          totalViews: inv.total_views,
          rsvpCount: rsvpMap[inv.id] || 0,
        },
        createdAt: inv.created_at,
        updatedAt: inv.updated_at,
      }))

      setInvitations(composed)

      // Store recent RSVPs with invitation title info
      const titleMap = {}
      invData.forEach(inv => { titleMap[inv.id] = inv.title })
      const enrichedRsvps = allRsvps.slice(0, 20).map(r => ({
        id: r.id,
        name: r.name,
        email: r.email,
        attendance: r.attendance,
        message: r.message,
        invitationId: r.invitation_id,
        invitationTitle: titleMap[r.invitation_id] || 'Unknown',
        sentAt: r.sent_at,
      }))
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

  // --- CRUD Operations ---

  const addInvitation = async ({ title, category }) => {
    if (!user) return null

    const slug = (title || 'untitled').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + nanoid(4)

    const { data, error } = await supabase
      .from('invitations')
      .insert({
        user_id: user.id,
        title: title || 'Untitled Invitation',
        slug,
        category: category || 'Wedding',
      })
      .select()
      .single()

    if (error || !data) {
      console.error('Error creating invitation:', error)
      return null
    }

    const newInv = {
      id: data.id,
      title: data.title,
      slug: data.slug,
      category: data.category,
      guestCount: data.guest_count,
      status: data.status,
      theme: {
        primaryColor: data.primary_color,
        backgroundColor: data.background_color,
        fontFamily: data.font_family,
      },
      blocks: [],
      analytics: { totalViews: 0, rsvpCount: 0 },
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }

    setInvitations(prev => [newInv, ...prev])
    return newInv
  }

  const updateInvitation = async (id, updates) => {
    // 1. Map frontend keys to DB columns
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

    // 2. Local/Optimistic update
    const updatedAt = updates.updatedAt || new Date().toISOString()
    setInvitations(prev =>
      prev.map(inv =>
        inv.id === id ? { ...inv, ...updates, updatedAt } : inv
      )
    )

    // 3. Skip DB if no DB columns to update
    if (Object.keys(dbUpdates).length === 0) return

    // 4. Perform DB update
    try {
      const { error } = await supabase
        .from('invitations')
        .update(dbUpdates)
        .eq('id', id)

      if (error) {
        console.error('Error updating invitation in DB:', error)
        // Optionally refresh to sync with server state if update failed
        fetchInvitations(true)
      }
    } catch (err) {
      console.error('Critical error in updateInvitation:', err)
      fetchInvitations(true)
    }
  }

  const deleteInvitation = async (id) => {
    const { error } = await supabase
      .from('invitations')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting invitation:', error)
      alert('Gagal menghapus undangan: ' + error.message)
      return false
    }

    setInvitations(prev => prev.filter(inv => inv.id !== id))
    return true
  }

  // --- Block Operations ---

  const addBlock = async (invId, blockType, blockData, explicitOrder) => {
    const targetIndex = explicitOrder !== undefined ? explicitOrder : 0

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

    // Use a variable to capture reindexed blocks from the functional update
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

    // Sync all sort orders to DB after state update
    // Use setTimeout(0) to ensure setInvitations callback has executed
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

  const addBlocks = async (invId, blocksArray) => {
    const inv = invitations.find(i => i.id === invId)
    // Even if inv is not found in local state yet (very new), we still want to insert
    
    const baseOrder = inv ? inv.blocks.length : 0
    const blocksToInsert = blocksArray.map((b, index) => ({
      invitation_id: invId,
      type: b.type,
      data: b.data,
      sort_order: baseOrder + index
    }))

    const { data, error } = await supabase
      .from('blocks')
      .insert(blocksToInsert)
      .select()

    if (error || !data) {
      console.error('Error adding bulk blocks:', error)
      return null
    }

    const newBlocksSorted = data.sort((a, b) => a.sort_order - b.sort_order).map(d => ({
      id: d.id,
      type: d.type,
      data: d.data,
      sortOrder: d.sort_order
    }))

    setInvitations(prev =>
      prev.map(item => {
        if (item.id !== invId) return item
        // Merging and ensuring absolute correct order
        const combined = [...item.blocks, ...newBlocksSorted]
        const finalBlocks = combined.map((b, idx) => ({ ...b, sortOrder: idx }))
        
        return {
          ...item,
          blocks: finalBlocks,
          updatedAt: new Date().toISOString(),
        }
      })
    )

    return newBlocksSorted
  }

  const updateBlock = async (invId, blockId, blockData) => {
    setInvitations(prev => {
      return prev.map(inv => {
        if (inv.id !== invId) return inv
        return {
          ...inv,
          blocks: inv.blocks.map(b =>
            b.id === blockId ? { ...b, data: { ...b.data, ...blockData } } : b
          ),
          updatedAt: new Date().toISOString(),
        }
      })
    })

    // Fetch the absolute latest from DB for merging to prevent race conditions during rapid typing
    const { data: currentBlock } = await supabase.from('blocks').select('data').eq('id', blockId).single();
    
    let parsedCurrentData = currentBlock?.data || {};
    if (typeof parsedCurrentData === 'string') {
      try {
        parsedCurrentData = JSON.parse(parsedCurrentData);
      } catch {
        parsedCurrentData = {};
      }
    }

    const finalMergedData = { ...parsedCurrentData, ...blockData };

    const { error } = await supabase
      .from('blocks')
      .update({ data: finalMergedData })
      .eq('id', blockId)

    if (error) {
      console.error('Error updating block:', error)
    }
  }

  const deleteBlock = async (invId, blockId) => {
    // 1. Optimistic update (UI reacts immediately)
    setInvitations(prev =>
      prev.map(inv => {
        if (inv.id !== invId) return inv
        return {
          ...inv,
          blocks: inv.blocks.filter(b => b.id !== blockId),
          updatedAt: new Date().toISOString(),
        }
      })
    )

    // 2. Perform DB operation
    const { error } = await supabase
      .from('blocks')
      .delete()
      .eq('id', blockId)

    if (error) {
      console.error('Error deleting block:', error)
      // Rollback on error if necessary
      fetchInvitations(true)
    }
  }

  const reorderBlocks = async (invId, newBlocks) => {
    // Optimistic update
    setInvitations(prev =>
      prev.map(inv => {
        if (inv.id !== invId) return inv
        return { ...inv, blocks: newBlocks, updatedAt: new Date().toISOString() }
      })
    )

    // Update sort_order in DB
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

  const fetchPublicInvitation = async (slug, isPreview = false) => {
    let query = supabase
      .from('invitations')
      .select('*')
      .eq('slug', slug)
      .limit(1);

    // Add a tiny delay or ensure fresh fetch if needed
    // Supabase caches can sometimes be aggressive on rapid changes
    const t = isPreview ? Date.now() : 0; 
    console.log(`Fetching invitation for slug: ${slug}, preview: ${isPreview}, t: ${t}`);

    if (!isPreview) {
      query = query.eq('status', 'published')
    }

    const { data: inv, error: invError } = await query.single()

    if (invError || !inv) return null

    const { data: blockData } = await supabase
      .from('blocks')
      .select('*')
      .eq('invitation_id', inv.id)
      .order('sort_order', { ascending: true })

    const { data: rsvpData } = await supabase
      .from('rsvps')
      .select('name, message, sent_at')
      .eq('invitation_id', inv.id)
      .not('message', 'is', null)
      .order('sent_at', { ascending: false })

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
        let parsedData = b.data;
        if (typeof b.data === 'string') {
          try {
            parsedData = JSON.parse(b.data);
          } catch (e) {
            console.error('Error parsing block data:', e);
          }
        }
        return {
          id: b.id,
          type: b.type,
          data: parsedData || {},
          sortOrder: b.sort_order,
        };
      }),
      wishes: (rsvpData || []).filter(r => r.message?.trim().length > 0).map(r => ({
        author: r.name,
        content: r.message,
        date: r.sent_at,
      })),
      analytics: { totalViews: inv.total_views },
      createdAt: inv.created_at,
    }
  }

  const incrementView = async (invId) => {
    await supabase.rpc('increment_view', { inv_id: invId })
  }

  const addRsvp = async (invId, rsvpData) => {
    const { error } = await supabase
      .from('rsvps')
      .insert({
        invitation_id: invId,
        name: rsvpData.name,
        email: rsvpData.email,
        attendance: rsvpData.attendance,
        message: rsvpData.message || null,
      })

    if (error) {
      console.error('Error adding RSVP:', error)
      return false
    }
    return true
  }

  const deleteRsvp = async (rsvpId) => {
    const { error } = await supabase.from('rsvps').delete().eq('id', rsvpId)
    if (error) {
      console.error('Error deleting RSVP:', error)
      return false
    }
    // Refresh to update UI silently
    fetchInvitations(true)
    return true
  }

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
    deleteRsvp,
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

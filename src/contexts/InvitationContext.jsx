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
  const fetchInvitations = useCallback(async () => {
    if (!user) {
      setInvitations([])
      setLoading(false)
      return
    }

    setLoading(true)
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
          .order('created_at', { ascending: false })

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
        theme: {
          primaryColor: inv.primary_color,
          backgroundColor: inv.background_color,
          fontFamily: inv.font_family,
        },
        blocks: (blocksMap[inv.id] || []).map(b => ({
          id: b.id,
          type: b.type,
          data: b.data,
          sortOrder: b.sort_order,
        })),
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
        createdAt: r.created_at,
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

    if (error) {
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
    // Map frontend keys to DB columns
    const dbUpdates = {}
    if (updates.title !== undefined) dbUpdates.title = updates.title
    if (updates.slug !== undefined) dbUpdates.slug = updates.slug
    if (updates.category !== undefined) dbUpdates.category = updates.category
    if (updates.guestCount !== undefined) dbUpdates.guest_count = updates.guestCount
    if (updates.status !== undefined) dbUpdates.status = updates.status
    if (updates.theme) {
      if (updates.theme.primaryColor !== undefined) dbUpdates.primary_color = updates.theme.primaryColor
      if (updates.theme.backgroundColor !== undefined) dbUpdates.background_color = updates.theme.backgroundColor
      if (updates.theme.fontFamily !== undefined) dbUpdates.font_family = updates.theme.fontFamily
    }

    const { error } = await supabase
      .from('invitations')
      .update(dbUpdates)
      .eq('id', id)

    if (error) {
      console.error('Error updating invitation:', error)
      return
    }

    // Optimistic update
    setInvitations(prev =>
      prev.map(inv =>
        inv.id === id ? { ...inv, ...updates, updatedAt: new Date().toISOString() } : inv
      )
    )
  }

  const deleteInvitation = async (id) => {
    const { error } = await supabase
      .from('invitations')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting invitation:', error)
      return
    }

    setInvitations(prev => prev.filter(inv => inv.id !== id))
  }

  // --- Block Operations ---

  const addBlock = async (invId, blockType, blockData) => {
    // Get current max sort_order
    const inv = invitations.find(i => i.id === invId)
    const maxOrder = inv?.blocks?.length || 0

    const { data, error } = await supabase
      .from('blocks')
      .insert({
        invitation_id: invId,
        type: blockType,
        data: blockData,
        sort_order: maxOrder,
      })
      .select()
      .single()

    if (error) {
      console.error('Error adding block:', error)
      return
    }

    setInvitations(prev =>
      prev.map(inv => {
        if (inv.id !== invId) return inv
        return {
          ...inv,
          blocks: [...inv.blocks, { id: data.id, type: data.type, data: data.data, sortOrder: data.sort_order }],
          updatedAt: new Date().toISOString(),
        }
      })
    )
  }

  const updateBlock = async (invId, blockId, blockData) => {
    // Optimistic update first
    setInvitations(prev =>
      prev.map(inv => {
        if (inv.id !== invId) return inv
        return {
          ...inv,
          blocks: inv.blocks.map(b =>
            b.id === blockId ? { ...b, data: { ...b.data, ...blockData } } : b
          ),
          updatedAt: new Date().toISOString(),
        }
      })
    )

    // Find the current full block data after merge
    const inv = invitations.find(i => i.id === invId)
    const block = inv?.blocks.find(b => b.id === blockId)
    const mergedData = { ...block?.data, ...blockData }

    const { error } = await supabase
      .from('blocks')
      .update({ data: mergedData })
      .eq('id', blockId)

    if (error) {
      console.error('Error updating block:', error)
    }
  }

  const deleteBlock = async (invId, blockId) => {
    const { error } = await supabase
      .from('blocks')
      .delete()
      .eq('id', blockId)

    if (error) {
      console.error('Error deleting block:', error)
      return
    }

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

    return {
      id: inv.id,
      title: inv.title,
      slug: inv.slug,
      category: inv.category,
      guestCount: inv.guest_count,
      status: inv.status,
      theme: {
        primaryColor: inv.primary_color,
        backgroundColor: inv.background_color,
        fontFamily: inv.font_family,
      },
      blocks: (blockData || []).map(b => ({
        id: b.id,
        type: b.type,
        data: b.data,
        sortOrder: b.sort_order,
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

  const value = {
    invitations,
    recentRsvps,
    loading,
    addInvitation,
    updateInvitation,
    deleteInvitation,
    addBlock,
    updateBlock,
    deleteBlock,
    reorderBlocks,
    fetchPublicInvitation,
    incrementView,
    addRsvp,
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

export const BLOCK_TYPES = {
  heading: {
    label: 'Heading',
    category: 'typography',
    icon: 'T',
    defaults: { content: 'Your Heading', fontSize: 32, fontFamily: 'Gambarino', color: '#2D2D2D', align: 'center', fontStyle: 'normal' }
  },
  paragraph: {
    label: 'Paragraph',
    category: 'typography',
    icon: '≡',
    defaults: { content: 'Write your text here...', fontSize: 15, color: '#8A8A8A', align: 'center' }
  },
  photo: {
    label: 'Photo',
    category: 'media',
    icon: '📷',
    defaults: { url: '', caption: '', fit: 'cover', borderRadius: 8 }
  },
  video: {
    label: 'Video',
    category: 'media',
    icon: '🎬',
    defaults: { url: '', autoplay: false, loop: false }
  },
  location: {
    label: 'Location',
    category: 'media',
    icon: '📍',
    defaults: { venue: 'Venue Name', address: 'Address', date: '', time: '', mapUrl: '' }
  },
  rsvp: {
    label: 'RSVP',
    category: 'media',
    icon: '✉️',
    defaults: { title: 'RSVP', fields: ['name', 'email', 'attendance'] }
  },
  signature: {
    label: 'Signature',
    category: 'details',
    icon: '✍️',
    defaults: { names: ['Name 1', 'Name 2'], style: 'elegant' }
  },
  registry: {
    label: 'Registry',
    category: 'details',
    icon: '🔗',
    defaults: { title: 'Gift Registry', items: [] }
  },
  music: {
    label: 'Music',
    category: 'media',
    icon: '🎵',
    defaults: { url: '', autoplay: true, volume: 0.5 }
  },
  countdown: {
    label: 'Countdown',
    category: 'details',
    icon: '⏰',
    defaults: { targetDate: '', label: 'Days until the big day' }
  },
  couple: {
    label: 'Couple',
    category: 'details',
    icon: '💑',
    defaults: { name1: '', name2: '', photo1: '', photo2: '', description: '' }
  },
  story: {
    label: 'Story',
    category: 'details',
    icon: '📖',
    defaults: { items: [{ date: '', title: '', description: '' }] }
  },
  gift: {
    label: 'Gift',
    category: 'details',
    icon: '🎁',
    defaults: { title: 'Wedding Gift', bankName: '', accountNumber: '', accountName: '' }
  },
  divider: {
    label: 'Divider',
    category: 'details',
    icon: '—',
    defaults: { style: 'line', color: '#E0DCD8' }
  },
  wishes: {
    label: 'Wishes',
    category: 'details',
    icon: '💬',
    defaults: { title: 'Send Your Wishes', messages: [] }
  },
  gallery: {
    label: 'Gallery',
    category: 'media',
    icon: '📸',
    defaults: { images: [], layout: 'grid', columns: 2 }
  },
}

export const BLOCK_CATEGORIES = [
  { key: 'typography', label: 'TYPOGRAPHY' },
  { key: 'media', label: 'MEDIA & VISUALS' },
  { key: 'details', label: 'DETAILS' },
]

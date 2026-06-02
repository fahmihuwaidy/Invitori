export const BLOCK_TYPES = {
  cover: {
    label: 'Cover',
    category: 'essential',
    icon: '🎴',
    defaults: {
      backgroundImage: '',
      coupleName: 'Oliver & Sophia',
      date: 'Monday, March 30, 2026',
      subtitle: 'We Are Getting Married',
      showGuestName: true,
      showScrollIndicator: true,
      overlayOpacity: 0.4,
      overlayColor: '#000000',
      fullWidth: true,
    }
  },
  heading: {
    label: 'Heading',
    category: 'typography',
    icon: 'T',
    defaults: { content: 'Your Heading', fontSize: 32, fontFamily: 'Gambarino', color: '#2D2D2D', align: 'center', fontStyle: 'normal', fullWidth: true }
  },
  paragraph: {
    label: 'Paragraph',
    category: 'typography',
    icon: '≡',
    defaults: { content: 'Write your text here...', fontSize: 15, color: '#8A8A8A', align: 'center', fullWidth: true }
  },
  photo: {
    label: 'Photo',
    category: 'media',
    icon: '📷',
    defaults: { url: '', caption: '', fit: 'cover', borderRadius: 8, fullWidth: true }
  },
  video: {
    label: 'Video',
    category: 'media',
    icon: '🎬',
    defaults: { url: '', autoplay: false, loop: false, fullWidth: true }
  },
  location: {
    label: 'Location',
    category: 'media',
    icon: '📍',
    defaults: { venue: 'Venue Name', address: 'Address', date: '', time: '', mapUrl: '', fullWidth: true }
  },
  rsvp: {
    label: 'RSVP',
    category: 'media',
    icon: '✉️',
    defaults: { title: 'RSVP', fields: ['name', 'email', 'attendance'], fullWidth: true }
  },
  signature: {
    label: 'Signature',
    category: 'details',
    icon: '✍️',
    defaults: { names: ['Name 1', 'Name 2'], style: 'elegant', fullWidth: true }
  },
  registry: {
    label: 'Registry',
    category: 'details',
    icon: '🔗',
    defaults: { title: 'Gift Registry', items: [], fullWidth: true }
  },

  countdown: {
    label: 'Countdown',
    category: 'details',
    icon: '⏰',
    defaults: { targetDate: '', label: 'Days until the big day', fullWidth: true }
  },
  couple: {
    label: 'Couple',
    category: 'details',
    icon: '💑',
    defaults: { name1: '', name2: '', photo1: '', photo2: '', description: '', instagram1: '', instagram2: '', title1: '', title2: '', fullWidth: true }
  },
  story: {
    label: 'Story',
    category: 'details',
    icon: '📖',
    defaults: { items: [{ date: '', title: '', description: '' }], fullWidth: true }
  },
  gift: {
    label: 'Gift',
    category: 'details',
    icon: '🎁',
    defaults: { title: 'Wedding Gift', bankName: '', accountNumber: '', accountName: '', fullWidth: true }
  },
  divider: {
    label: 'Divider',
    category: 'details',
    icon: '—',
    defaults: { style: 'line', color: '#E0DCD8', fullWidth: true }
  },
  wishes: {
    label: 'Wishes',
    category: 'details',
    icon: '💬',
    defaults: { title: 'Send Your Wishes', messages: [], fullWidth: true }
  },
  gallery: {
    label: 'Gallery',
    category: 'media',
    icon: '📸',
    defaults: { images: [], fullWidth: true }
  },
  footer: {
    label: 'Footer',
    category: 'essential',
    icon: '🏁',
    defaults: {
      thankYouText: 'Thank You',
      coupleName: 'Oliver & Sophia',
      subtitle: 'For Being Part of Our Special Day',
      photos: [],
      showWatermark: true,
      backgroundGradient: 'linear-gradient(180deg, #2D2D2D 0%, #1a1a1a 100%)',
      fullWidth: true,
    }
  },
}

export const BLOCK_CATEGORIES = [
  { key: 'essential', label: 'ESSENTIALS' },
  { key: 'typography', label: 'TYPOGRAPHY' },
  { key: 'media', label: 'MEDIA & VISUALS' },
  { key: 'details', label: 'DETAILS' },
]

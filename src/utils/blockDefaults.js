export const BLOCK_TYPES = {
  // ─── ESSENTIALS ──────────────────────────────────────────
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
      // layout: 'classic' | 'minimal' | 'split'
      coverLayout: 'classic',
      coverAlignItems: 'center',
      coverTextAlign: 'center',
      fullWidth: true,
    }
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
      // bgStyle: 'dark' | 'gradient' | 'slideshow'
      bgStyle: 'dark',
      gradientFrom: '#2D2D2D',
      gradientTo: '#1a1a1a',
      fullWidth: true,
    }
  },

  // ─── TYPOGRAPHY ───────────────────────────────────────────
  heading: {
    label: 'Heading',
    category: 'typography',
    icon: 'T',
    defaults: {
      content: 'Your Heading',
      fontSize: 32,
      fontFamily: 'Gambarino',
      color: '#2D2D2D',
      align: 'center',
      fontStyle: 'normal',
      fontWeight: 'normal',
      letterSpacing: 0,
      lineHeight: 1.2,
      textShadow: false,
      fullWidth: true,
    }
  },
  paragraph: {
    label: 'Paragraph',
    category: 'typography',
    icon: '≡',
    defaults: {
      content: 'Write your text here...',
      fontSize: 15,
      color: '#8A8A8A',
      align: 'center',
      lineHeight: 1.7,
      letterSpacing: 0,
      maxWidth: 600,
      fullWidth: true,
    }
  },
  quote: {
    label: 'Quote',
    category: 'typography',
    icon: '❝',
    defaults: {
      text: '"And of His signs is that He created for you from yourselves mates that you may find tranquility in them."',
      source: '— QS. Ar-Rum: 21',
      // style: 'minimal' | 'bordered' | 'framed'
      style: 'framed',
      color: '#565F34',
      fullWidth: true,
    }
  },

  // ─── MEDIA & VISUALS ─────────────────────────────────────
  photo: {
    label: 'Photo',
    category: 'media',
    icon: '📷',
    defaults: {
      url: '',
      caption: '',
      fit: 'cover',
      // aspectRatio: '1/1' | '4/3' | '16/9' | '3/4' | 'auto'
      aspectRatio: 'auto',
      // borderStyle: 'none' | 'shadow' | 'solid' | 'double'
      borderStyle: 'none',
      borderRadius: 8,
      borderColor: '#E0DCD8',
      shadowIntensity: 0,
      fullWidth: true,
    }
  },
  photoFrame: {
    label: 'Photo Frame',
    category: 'media',
    icon: '🖼',
    defaults: {
      url: '',
      caption: '',
      captionPosition: 'outside', // 'outside' | 'overlay'
      // frameStyle: 'natural' | 'polaroid' | 'film' | 'oval'
      frameStyle: 'polaroid',
      fullWidth: true,
    }
  },
  video: {
    label: 'Video',
    category: 'media',
    icon: '🎬',
    defaults: {
      url: '',
      autoplay: false,
      loop: false,
      showControls: true,
      thumbnailUrl: '',
      fullWidth: true,
    }
  },
  gallery: {
    label: 'Gallery',
    category: 'media',
    icon: '📸',
    defaults: {
      images: [],
      // layoutMode: 'grid' | 'masonry' | 'slideshow'
      layoutMode: 'masonry',
      columns: 2,
      gap: 8,
      enableLightbox: true,
      showCaptions: false,
      fullWidth: true,
    }
  },
  location: {
    label: 'Location',
    category: 'media',
    icon: '📍',
    defaults: {
      // Multi-event support
      events: [
        { name: 'Akad Nikah', date: '', time: '', venue: 'Venue Name', address: 'Address', mapUrl: '', mapEmbed: '' }
      ],
      // mapDisplay: 'button' | 'iframe'
      mapDisplay: 'button',
      fullWidth: true,
    }
  },

  // ─── DETAILS ─────────────────────────────────────────────
  couple: {
    label: 'Couple',
    category: 'details',
    icon: '💑',
    defaults: {
      name1: '',
      name2: '',
      photo1: '',
      photo2: '',
      description: '',
      instagram1: '',
      instagram2: '',
      title1: '',
      title2: '',
      // photoShape: 'circle' | 'rounded' | 'portrait'
      photoShape: 'portrait',
      // layout: 'staggered' | 'side-by-side' | 'stacked'
      layout: 'staggered',
      showAmpersand: true,
      fullWidth: true,
    }
  },
  countdown: {
    label: 'Countdown',
    category: 'details',
    icon: '⏰',
    defaults: {
      targetDate: '',
      label: 'Days until the big day',
      expiredMessage: '🎉 The day has come!',
      showSeconds: true,
      // style: 'minimal' | 'boxed' | 'outlined'
      style: 'boxed',
      fullWidth: true,
    }
  },
  schedule: {
    label: 'Schedule',
    category: 'details',
    icon: '📅',
    defaults: {
      title: 'Wedding Agenda',
      // layoutMode: 'timeline' | 'cards'
      layoutMode: 'timeline',
      items: [
        { time: '08:00', title: 'Akad Nikah', description: 'Sacred wedding ceremony', icon: '💍' },
        { time: '11:00', title: 'Resepsi', description: 'Wedding reception & lunch', icon: '🥂' },
        { time: '18:00', title: 'Dinner', description: 'Evening dinner celebration', icon: '🕯️' },
      ],
      fullWidth: true,
    }
  },
  story: {
    label: 'Our Story',
    category: 'details',
    icon: '📖',
    defaults: {
      items: [
        { date: '', title: '', description: '', photo: '' }
      ],
      fullWidth: true,
    }
  },
  dressCode: {
    label: 'Dress Code',
    category: 'details',
    icon: '👗',
    defaults: {
      title: 'Dress Code',
      description: 'We kindly request that guests dress according to the theme of the event.',
      swatches: [
        { color: '#EDE9E7', label: 'Cream' },
        { color: '#8B956D', label: 'Sage Green' },
        { color: '#C4A882', label: 'Warm Sand' },
      ],
      note: 'Please avoid wearing white, black, or bright neon colors.',
      fullWidth: true,
    }
  },
  gift: {
    label: 'Gift',
    category: 'details',
    icon: '🎁',
    defaults: {
      title: 'Wedding Gift',
      subtitle: 'Your presence is our greatest gift. If you wish to give, below are our details.',
      // Bank accounts / e-wallets
      accounts: [
        { bankName: '', accountNumber: '', accountName: '', logo: '' }
      ],
      // QRIS
      qrisImage: '',
      // Registry links (replaces removed registry block)
      registryLinks: [],
      fullWidth: true,
    }
  },
  wishes: {
    label: 'Wishes',
    category: 'details',
    icon: '💬',
    defaults: {
      title: 'Send Your Wishes',
      // displayMode: 'list' | 'masonry'
      displayMode: 'masonry',
      messages: [],
      fullWidth: true,
    }
  },
  ornament: {
    label: 'Ornament',
    category: 'details',
    icon: '✦',
    defaults: {
      // style: 'line' | 'double-line' | 'dots' | 'floral' | 'wave'
      style: 'floral',
      color: '#C4A882',
      width: 60,
      fullWidth: true,
    }
  },
  rsvp: {
    label: 'RSVP',
    category: 'details',
    icon: '✉️',
    defaults: {
      title: 'Attendance Confirmation',
      attendingLabel: 'Attending',
      declineLabel: 'Decline',
      showGuestCount: true,
      confirmationMessage: 'Thank you! We look forward to celebrating with you.',
      fullWidth: true,
    }
  },
  floatingOrnament: {
    label: 'Floating Ornament',
    category: 'media',
    icon: '🔮',
    defaults: {
      url: '',
      width: 120,
      height: 120,
      xPosition: 50,
      yPosition: 0,
      zIndex: 10,
      rotation: 0,
      opacity: 100,
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

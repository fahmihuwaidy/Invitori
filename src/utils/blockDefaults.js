export const BLOCK_TYPES = {
  // ─── ESSENTIALS ──────────────────────────────────────────
  desktopHero: {
    label: 'Desktop Showcase Cover',
    category: 'essential',
    icon: '🖥️',
    description: 'Dedicated photo and showcase view for desktop screens (dual-pane left showcase)',
    defaults: {
      backgroundImage: '',
      title: '',
      subtitle: '',
      date: '',
      overlayGradient: 'cinematic', // 'cinematic' | 'dark' | 'warm' | 'subtle' | 'none'
      overlayOpacity: 0.7,
      showMonogram: true,
      showGuestTag: true,
      showScrollGuide: true,
      fullWidth: true,
    }
  },
  cover: {
    label: 'Hero Cover',
    category: 'essential',
    icon: '🎴',
    defaults: {
      backgroundImage: '',
      coupleName: 'Oliver & Sophia',
      date: 'Monday, March 30, 2026',
      subtitle: 'We Are Getting Married',
      displayFont: 'Gambarino',
      showGuestName: true,
      showScrollIndicator: true,
      overlayOpacity: 0.4,
      overlayColor: '#000000',
      coverLayout: 'classic',
      coverAlignItems: 'center',
      coverTextAlign: 'center',
      fullWidth: true,
    }
  },
  heading: {
    label: 'Heading',
    category: 'essential',
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
    category: 'essential',
    icon: '≡',
    defaults: {
      content: 'Write your text here...',
      fontSize: 15,
      color: '#666E62',
      align: 'center',
      lineHeight: 1.7,
      letterSpacing: 0,
      maxWidth: 600,
      fullWidth: true,
    }
  },
  thankYou: {
    label: 'Thank You',
    category: 'essential',
    icon: '✍️',
    defaults: {
      title: 'Thank You',
      description: 'It is a great honor and joy for us if you are able to attend and share your warmest blessings with us.',
      signature1: 'The Montague Family',
      signature2: 'The Capulet Family',
      coupleSignature: 'Romeo & Juliet',
      fullWidth: true,
    }
  },
  footer: {
    label: 'Footer Credits',
    category: 'essential',
    icon: '🏁',
    defaults: {
      thankYouText: 'Thank You',
      coupleName: 'Oliver & Sophia',
      subtitle: 'For Being Part of Our Special Day',
      photos: [],
      showWatermark: true,
      bgStyle: 'dark',
      gradientFrom: '#2D2D2D',
      gradientTo: '#1a1a1a',
      fullWidth: true,
    }
  },

  // ─── COUPLE ──────────────────────────────────────────────
  couple: {
    label: 'Couple Profile',
    category: 'couple',
    icon: '💑',
    defaults: {
      name1: 'Romeo Montague',
      name2: 'Juliet Capulet',
      photo1: '',
      photo2: '',
      description: 'We found love in an unexpected place, and now we pledge our lives to one another.',
      instagram1: 'romeo',
      instagram2: 'juliet',
      title1: 'Son of Mr. & Mrs. Montague',
      title2: 'Daughter of Mr. & Mrs. Capulet',
      photoShape: 'portrait',
      layout: 'staggered',
      showAmpersand: true,
      fullWidth: true,
    }
  },

  // ─── EVENT ───────────────────────────────────────────────
  location: {
    label: 'Event Details',
    category: 'event',
    icon: '📍',
    defaults: {
      events: [
        { name: 'Akad Nikah', date: 'Saturday, August 30, 2026', time: '08:00 AM - 10:00 AM', venue: 'Grand Mosque', address: 'Jl. Masjid Agung No. 12', mapUrl: '' },
        { name: 'Wedding Reception', date: 'Saturday, August 30, 2026', time: '11:00 AM - 02:00 PM', venue: 'Grand Ballroom', address: 'Jl. Pemuda Kencana No. 45', mapUrl: '' }
      ],
      mapDisplay: 'iframe',
      fullWidth: true,
    }
  },
  schedule: {
    label: 'Timeline Agenda',
    category: 'event',
    icon: '📅',
    defaults: {
      title: 'Event Schedule',
      layoutMode: 'timeline',
      items: [
        { time: '08:00', title: 'Akad Nikah', description: 'Sacred wedding vow ceremony', icon: '💍' },
        { time: '11:00', title: 'Resepsi', description: 'Wedding reception & guest greetings', icon: '🥂' },
        { time: '18:00', title: 'Evening Soirée', description: 'Intimate dinner celebration with family & friends', icon: '🕯️' },
      ],
      fullWidth: true,
    }
  },
  countdown: {
    label: 'Countdown Timer',
    category: 'event',
    icon: '⏰',
    defaults: {
      targetDate: '2026-08-30T08:00:00',
      label: 'Counting Down to the Day',
      expiredMessage: 'The celebration has arrived!',
      showSeconds: true,
      style: 'boxed',
      fullWidth: true,
    }
  },

  // ─── GALLERY ─────────────────────────────────────────────
  gallery: {
    label: 'Photo Gallery',
    category: 'gallery',
    icon: '📸',
    defaults: {
      title: '',
      images: [],
      layoutMode: 'masonry',
      columns: 2,
      gap: 8,
      enableLightbox: true,
      showCaptions: false,
      fullWidth: true,
    }
  },
  video: {
    label: 'Video Player',
    category: 'gallery',
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
  photo: {
    label: 'Single Photo',
    category: 'gallery',
    icon: '📷',
    defaults: {
      url: '',
      caption: '',
      fit: 'cover',
      aspectRatio: 'auto',
      borderStyle: 'none',
      borderRadius: 8,
      borderColor: '#E0DCD8',
      shadowIntensity: 0,
      fullWidth: true,
    }
  },
  photoFrame: {
    label: 'Photo Frame',
    category: 'gallery',
    icon: '🖼',
    defaults: {
      url: '',
      caption: '',
      captionPosition: 'outside',
      frameStyle: 'polaroid',
      fullWidth: true,
    }
  },

  // ─── STORY ───────────────────────────────────────────────
  story: {
    label: 'Love Story',
    category: 'story',
    icon: '📖',
    defaults: {
      items: [
        { date: '2020', title: 'First Meet', description: 'We crossed paths in an unexpected moment and talked until evening.', photo: '' },
        { date: '2023', title: 'The Proposal', description: 'Underneath a quiet twilight sky, we promised to walk forward together.', photo: '' }
      ],
      fullWidth: true,
    }
  },

  // ─── SOCIAL ──────────────────────────────────────────────
  socialShare: {
    label: 'Social Share',
    category: 'social',
    icon: '🔗',
    defaults: {
      message: 'You are warmly invited to celebrate with Romeo & Juliet. Tap the link below to view our digital invitation.',
      platforms: ['whatsapp', 'facebook', 'twitter', 'telegram'],
      fullWidth: true,
    }
  },
  weddingAR: {
    label: 'Event AR Filter',
    category: 'social',
    icon: '🤳',
    defaults: {
      title: 'Instagram AR Filter',
      subtitle: 'Capture and share moments from our celebration using our custom Instagram AR filter.',
      url: 'https://instagram.com/a/r/filter',
      qrCode: '',
      fullWidth: true,
    }
  },

  // ─── INTERACTIVE ─────────────────────────────────────────
  rsvp: {
    label: 'RSVP Form',
    category: 'interactive',
    icon: '✉️',
    defaults: {
      title: 'RSVP',
      attendingLabel: 'Joyfully Accepts',
      declineLabel: 'Regretfully Declines',
      showGuestCount: true,
      showSessionChoice: true,
      showQrTicket: true,
      confirmationMessage: 'Thank you for confirming your attendance! Save your QR entry pass below for check-in at the venue.',
      fullWidth: true,
    }
  },
  wishes: {
    label: 'Wishes Wall',
    category: 'interactive',
    icon: '💬',
    defaults: {
      title: 'Wishes & Blessings',
      displayMode: 'masonry',
      messages: [],
      fullWidth: true,
    }
  },
  gift: {
    label: 'Digital Gift',
    category: 'interactive',
    icon: '🎁',
    defaults: {
      title: 'Digital Gift',
      subtitle: 'Your presence and blessings mean the world to us. Should you wish to send a token of love, you may use the details below:',
      accounts: [
        { bankName: 'BCA', accountNumber: '8420918273', accountName: 'Romeo Montague', logo: '' }
      ],
      qrisImage: '',
      physicalRecipient: '',
      physicalPhone: '',
      physicalAddress: '',
      registryLinks: [],
      fullWidth: true,
    }
  },
  liveStreaming: {
    label: 'Live Streaming',
    category: 'interactive',
    icon: '📺',
    defaults: {
      title: 'Live Streaming',
      description: 'Join us virtually as we celebrate this sacred moment from afar.',
      provider: 'youtube', // 'youtube' | 'zoom' | 'custom'
      url: '',
      fullWidth: true,
    }
  },

  // ─── DECORATIVE ──────────────────────────────────────────
  ornament: {
    label: 'Divider Ornament',
    category: 'decorative',
    icon: '✦',
    defaults: {
      style: 'floral',
      color: '#C4A882',
      width: 60,
      fullWidth: true,
    }
  },
  floatingOrnament: {
    label: 'Floating Ornament',
    category: 'decorative',
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
  backgroundMusic: {
    label: 'Background Music',
    category: 'decorative',
    icon: '🎵',
    defaults: {
      url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      songTitle: 'Eternal Vows (Instrumental)',
      autoplay: true,
      loop: true,
      volume: 80,
      fullWidth: true,
    }
  },
  navigationMenu: {
    label: 'Floating Nav Menu',
    category: 'deprecated',
    icon: '🧭',
    defaults: {
      showCover: true,
      showCouple: true,
      showEvent: true,
      showGallery: true,
      showWishes: true,
      showGift: true,
      fullWidth: true,
    }
  },
  particles: {
    label: 'Particle Effects',
    category: 'decorative',
    icon: '🌸',
    defaults: {
      effect: 'sakura', // 'sakura' | 'hearts' | 'snow' | 'confetti'
      intensity: 30,
      fullWidth: true,
    }
  },
  envelopeAnimation: {
    label: 'Envelope Opener',
    category: 'decorative',
    icon: '✉️',
    defaults: {
      gateStyle: 'arch-gate', // 'arch-gate' | 'wax-seal' | 'editorial' | 'classic'
      monogram: '',
      openButtonText: 'Open Invitation',
      envelopeColor: '#344c2d',
      paperColor: '#fbf9f6',
      fullWidth: true,
    }
  },
  quote: {
    label: 'Quote & Verse',
    category: 'decorative',
    icon: '❝',
    defaults: {
      text: '"And among His signs is that He created for you spouses from among yourselves so that you may find tranquility in them, and He placed between you affection and mercy."',
      source: '— QS. Ar-Rum: 21',
      style: 'framed',
      color: '#565F34',
      textColor: '#2D2D2D',
      fullWidth: true,
    }
  },
  dressCode: {
    label: 'Dress Code',
    category: 'event',
    icon: '👔',
    defaults: {
      title: 'Dress Code',
      description: 'Formal attire is appreciated. Earth tones and soft neutrals are encouraged.',
      note: '',
      swatches: [
        { label: 'Sage', color: '#899c75' },
        { label: 'Dusty Rose', color: '#d09ca7' },
        { label: 'Cream', color: '#f4efea' },
      ],
      fullWidth: true,
    }
  },
  healthProtocol: {
    label: 'Health & Safety',
    category: 'social',
    icon: '😷',
    defaults: {
      title: 'Health & Safety Guidelines',
      description: 'For everyone’s comfort and wellbeing, please observe the following guidelines:',
      fullWidth: true,
    }
  },
  qrPass: {
    label: 'QR Entry Pass',
    category: 'interactive',
    icon: '🎟️',
    defaults: {
      title: 'QR E-Invitation',
      subtitle: 'Present this QR code to our reception host at the venue for check-in and souvenir redemption.',
      showGuestName: true,
      cardColor: '#FAF7F2',
      accentColor: '#652128',
      fullWidth: true,
    }
  },
}

export const BLOCK_CATEGORIES = [
  { key: 'essential', label: 'ESSENTIAL' },
  { key: 'couple', label: 'COUPLE' },
  { key: 'event', label: 'EVENT' },
  { key: 'gallery', label: 'GALLERY' },
  { key: 'story', label: 'STORY' },
  { key: 'social', label: 'SOCIAL' },
  { key: 'interactive', label: 'INTERACTIVE' },
  { key: 'decorative', label: 'DECORATIVE' },
]

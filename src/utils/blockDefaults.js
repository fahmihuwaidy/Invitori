export const BLOCK_TYPES = {
  // ─── ESSENTIALS ──────────────────────────────────────────
  desktopHero: {
    label: 'Desktop Showcase Cover',
    category: 'essential',
    icon: '🖥️',
    description: 'Foto & tampilan khusus layar desktop (dual-pane left showcase)',
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
      color: '#8A8A8A',
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
      title: 'Terima Kasih',
      description: 'Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir untuk memberikan doa restu kepada kedua mempelai.',
      signature1: 'Keluarga Bpk. Montague & Ibu Montague',
      signature2: 'Keluarga Bpk. Capulet & Ibu Capulet',
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
      description: 'We found love in a hopeless place, and now we pledge our lives to one another under the stars.',
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
        { name: 'Resepsi Pernikahan', date: 'Saturday, August 30, 2026', time: '11:00 AM - 02:00 PM', venue: 'Grand Ballroom', address: 'Jl. Pemuda Kencana No. 45', mapUrl: '' }
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
      title: 'Wedding Agenda',
      layoutMode: 'timeline',
      items: [
        { time: '08:00', title: 'Akad Nikah', description: 'Sacred wedding vow ceremony', icon: '💍' },
        { time: '11:00', title: 'Resepsi', description: 'Wedding reception guest greetings', icon: '🥂' },
        { time: '18:00', title: 'Dinner Party', description: 'Intimate dinner party with family', icon: '🕯️' },
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
      label: 'Menuju Hari Bahagia',
      expiredMessage: '🎉 The day has come!',
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
        { date: '2020', title: 'First Meet', description: 'We locked eyes across a crowded room and knew instantly.', photo: '' },
        { date: '2023', title: 'The Proposal', description: 'Underneath a canopy of stars, he asked and she said yes!', photo: '' }
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
      message: 'Anda diundang ke pernikahan Romeo & Juliet. Klik link berikut untuk melihat undangan digital kami.',
      platforms: ['whatsapp', 'facebook', 'twitter', 'telegram'],
      fullWidth: true,
    }
  },
  weddingAR: {
    label: 'Wedding Filter / AR',
    category: 'social',
    icon: '🤳',
    defaults: {
      title: 'Instagram AR Filter',
      subtitle: 'Abadikan momen bahagia kami dengan menggunakan filter Instagram khusus pernikahan kami!',
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
      title: 'Konfirmasi Kehadiran',
      attendingLabel: 'Hadir',
      declineLabel: 'Berhalangan',
      showGuestCount: true,
      showSessionChoice: true,
      showQrTicket: true,
      confirmationMessage: 'Terima kasih atas konfirmasi kehadiran Anda! Simpan tiket QR di bawah ini untuk akses buku tamu.',
      fullWidth: true,
    }
  },
  wishes: {
    label: 'Wishes Wall',
    category: 'interactive',
    icon: '💬',
    defaults: {
      title: 'Ucapan & Doa Restu',
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
      title: 'Tanda Kasih',
      subtitle: 'Doa restu Anda adalah karunia terindah. Namun jika ingin mengirimkan tanda kasih, Anda dapat menyalurkannya melalui rekening atau alamat berikut:',
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
      description: 'Bergabunglah bersama kami secara virtual dalam merayakan momen suci ini.',
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
      openButtonText: 'Buka Undangan',
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
      text: '"Dan di antara tanda-tanda kekuasaan-Nya ialah Dia menciptakan untukmu isteri-isteri dari jenismu sendiri, supaya kamu cenderung dan merasa tenteram kepadanya."',
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
      description: 'Formal attire is appreciated. Earth tones and pastels are encouraged.',
      note: '',
      swatches: [
        { name: 'Sage', color: '#899c75' },
        { name: 'Dusty Rose', color: '#d09ca7' },
        { name: 'Cream', color: '#f4efea' },
      ],
      fullWidth: true,
    }
  },
  healthProtocol: {
    label: 'Health Protocol',
    category: 'social',
    icon: '😷',
    defaults: {
      title: 'Protokol Kesehatan',
      description: 'Untuk kenyamanan bersama, mohon patuhi protokol kesehatan berikut:',
      fullWidth: true,
    }
  },
  qrPass: {
    label: 'QR Entry Pass',
    category: 'interactive',
    icon: '🎟️',
    defaults: {
      title: 'QR E-Invitation',
      subtitle: 'Tunjukkan QR code ini kepada penerima tamu di lokasi acara untuk check-in dan menukarkan suvenir.',
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

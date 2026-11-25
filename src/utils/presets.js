import { BLOCK_TYPES } from './blockDefaults.js'

/**
 * Curated Design World Palettes for 1-click theme switching in Editor & Creation Modal.
 */
export const THEME_PALETTES = [
  {
    key: 'atelier',
    name: 'Atelier Botanical',
    subtitle: 'Olive & Warm Paper',
    primaryColor: '#3d4d33',
    backgroundColor: '#f6f2ec',
    accentColor: '#c4a882',
    fontFamily: 'Plus Jakarta Sans',
    headingFont: 'Cormorant Garamond',
    gateStyle: 'arch-gate',
    envelopeColor: '#283620',
    paperColor: '#fcfaf7',
  },
  {
    key: 'vogue',
    name: 'Vogue Monochrome',
    subtitle: 'Editorial Noir & Ivory',
    primaryColor: '#1a1918',
    backgroundColor: '#faf8f5',
    accentColor: '#968c7e',
    fontFamily: 'Inter',
    headingFont: 'Bodoni Moda',
    gateStyle: 'editorial',
    envelopeColor: '#141413',
    paperColor: '#faf8f5',
  },
  {
    key: 'royal',
    name: 'Royal Heritage Nusantara',
    subtitle: 'Deep Burgundy & Antique Gold',
    primaryColor: '#652128',
    backgroundColor: '#f6f0e2',
    accentColor: '#b2a380',
    fontFamily: 'Inter',
    headingFont: 'Lora',
    gateStyle: 'arch-gate',
    envelopeColor: '#4a151b',
    paperColor: '#faf5ed',
  },
  {
    key: 'islamic',
    name: 'Celestial Islamic',
    subtitle: 'Deep Emerald & Pearl',
    primaryColor: '#1b4332',
    backgroundColor: '#f2f6f4',
    accentColor: '#bfa46d',
    fontFamily: 'Plus Jakarta Sans',
    headingFont: 'Amiri',
    gateStyle: 'arch-gate',
    envelopeColor: '#132f23',
    paperColor: '#fbfdfb',
  },
  {
    key: 'terracotta',
    name: 'Tuscan Terracotta',
    subtitle: 'Warm Earth & Sunlit Sand',
    primaryColor: '#8a4831',
    backgroundColor: '#f8f2ec',
    accentColor: '#c88d70',
    fontFamily: 'DM Sans',
    headingFont: 'Fraunces',
    gateStyle: 'wax-seal',
    envelopeColor: '#6b3622',
    paperColor: '#fdf9f5',
  },
  {
    key: 'blush',
    name: 'Blush Romance',
    subtitle: 'Dusty Rose & Alabaster',
    primaryColor: '#8a4f5b',
    backgroundColor: '#fbf6f6',
    accentColor: '#d09ca7',
    fontFamily: 'Plus Jakarta Sans',
    headingFont: 'Playfair Display',
    gateStyle: 'wax-seal',
    envelopeColor: '#6b3a43',
    paperColor: '#fffcfc',
  },
  {
    key: 'festive-sky',
    name: 'Festive Ocean & Gold',
    subtitle: 'Vibrant Blue & Sunset Gold (Birthday)',
    primaryColor: '#1e40af',
    backgroundColor: '#f0f6ff',
    accentColor: '#d97706',
    fontFamily: 'Plus Jakarta Sans',
    headingFont: 'Plus Jakarta Sans',
    gateStyle: 'editorial',
    envelopeColor: '#1e3a8a',
    paperColor: '#ffffff',
  },
  {
    key: 'baby-sage',
    name: 'Soft Sage & Pearl',
    subtitle: 'Calm Sage & Mint Milk (Aqiqah)',
    primaryColor: '#3b7a57',
    backgroundColor: '#f3f8f5',
    accentColor: '#c5a059',
    fontFamily: 'Plus Jakarta Sans',
    headingFont: 'Lora',
    gateStyle: 'arch-gate',
    envelopeColor: '#2b5a40',
    paperColor: '#fcfffd',
  },
]

const SAMPLE_PHOTOS = {
  coverAtelier: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1000&q=80',
  coverVogue: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=1000&q=80',
  coverRoyal: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1000&q=80',
  coverIslamic: 'https://images.unsplash.com/photo-1542042161784-26ab9e041e89?auto=format&fit=crop&w=1000&q=80',
  coverTerracotta: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=1000&q=80',
  coverBlush: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1000&q=80',
  groom1: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
  bride1: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
  gallery: [
    'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=800&q=80',
  ],
}

function buildWeddingBlocks({
  primaryColor,
  accentColor,
  envelopeColor,
  paperColor,
  gateStyle = 'arch-gate',
  coverLayout = 'arch',
  coverPhoto = SAMPLE_PHOTOS.coverAtelier,
  subtitle = 'The Wedding Celebration Of',
  coupleName = 'Sarah & Dimas',
  date = 'Saturday, October 24, 2026',
  targetDate = '2026-10-24T08:30:00',
  name1 = 'Dimas Wicaksono, M.Arch.',
  name2 = 'Sarah Amalia, S.Ds.',
  title1 = 'First Son of Mr. Bambang Wicaksono & Mrs. Rini Astuti',
  title2 = 'Youngest Daughter of Mr. Farhan Syahputra & Mrs. Ratna Kirana',
  coupleDescription = 'With gratitude and joyful hearts, we invite you to celebrate the union of our lives and families.',
  headingFont = 'Cormorant Garamond',
  displayFont = headingFont,
  ornamentStyle = 'line',
  showIntroOrnament = true,
  quoteText = '"Two souls walking one path, growing together like twin trees whose roots intertwine beneath the earth."',
  quoteSource = '— Kahlil Gibran',
  quoteStyle = 'framed',
  showBismillah = false,
  countdownStyle = 'boxed',
  coupleLayout = 'staggered',
  photoShape = 'portrait',
  includeCouplePhotos = true,
  songTitle = 'Eternal Vows (Instrumental)',
  events = [
    {
      name: 'Akad Nikah',
      date: 'Saturday, October 24, 2026',
      time: '08:30 - 10:30 WIB',
      venue: 'The Conservatory Glasshouse',
      address: 'Jl. Brawijaya Raya No. 28, Kebayoran Baru, South Jakarta',
      mapUrl: 'https://maps.google.com/?q=The+Conservatory+Jakarta',
    },
    {
      name: 'Resepsi & Garden Soirée',
      date: 'Saturday, October 24, 2026',
      time: '11:30 - 15:00 WIB',
      venue: 'Pine Pavilion Courtyard',
      address: 'Jl. Brawijaya Raya No. 28, Kebayoran Baru, South Jakarta',
      mapUrl: 'https://maps.google.com/?q=The+Conservatory+Jakarta',
    },
  ],
  scheduleItems = [
    { time: '08:30', title: 'Akad Nikah & Ijab Qabul', description: 'Sacred exchange of vows surrounded by immediate family.' },
    { time: '10:00', title: 'Sungkeman & Blessings', description: 'Seeking heartfelt blessings from both sets of parents.' },
    { time: '11:30', title: 'Garden Soirée & Acoustic Lunch', description: 'Relaxed courtyard reception accompanied by live acoustic music.' },
    { time: '14:00', title: 'Toast & Portraits', description: 'Warm afternoon portraits and celebratory toasts with friends.' },
  ],
  scheduleMode = 'timeline',
  swatches = [
    { label: 'Olive Leaf', color: '#3d4d33' },
    { label: 'Warm Sage', color: '#889a7a' },
    { label: 'Champagne Linen', color: '#e8dfd5' },
  ],
  dressCodeNote = 'Semi-Formal or Garden Chic attire in earth tones, sage, or warm neutrals.',
  includeStory = true,
  storyItems = [
    {
      date: 'September 2021',
      title: 'First Encounter',
      description: 'A chance meeting at a Bandung design exhibition turned into an endless afternoon conversation over coffee.',
      photo: SAMPLE_PHOTOS.gallery[0],
    },
    {
      date: 'July 2024',
      title: 'Twilight Proposal at Bromo',
      description: 'Beneath a golden mountain sunset, we promised to build a lifetime of quiet mornings and shared adventures.',
      photo: SAMPLE_PHOTOS.gallery[2],
    },
    {
      date: 'October 2026',
      title: 'Our Wedding Day',
      description: 'The morning our prayers meet in marriage, witnessed by everyone we hold dear.',
      photo: SAMPLE_PHOTOS.gallery[1],
    },
  ],
  includeGallery = true,
  galleryMode = 'masonry',
  galleryImages = SAMPLE_PHOTOS.gallery,
  accounts = [
    { bankName: 'BCA', accountNumber: '5220918273', accountName: 'Dimas Wicaksono' },
    { bankName: 'Bank Mandiri', accountNumber: '1370019283741', accountName: 'Sarah Amalia' },
  ],
  physicalRecipient = 'Sarah & Dimas',
  physicalPhone = '0812-3456-7890',
  physicalAddress = 'Jl. Senopati Dalam II No. 14, Kebayoran Baru, South Jakarta 12190',
  thankYouTitle = 'With Heartfelt Gratitude',
  thankYouDesc = 'Nothing could mean more to us than your presence, warm wishes, and prayers as we begin this new chapter together.',
  signature1 = 'Family of Mr. Bambang Wicaksono & Mrs. Rini Astuti',
  signature2 = 'Family of Mr. Farhan Syahputra & Mrs. Ratna Kirana',
  coupleSignature = coupleName,
  coverTextAlign = 'center',
  coverAlignItems = 'center',
  overlayOpacity = 0.42,
  rsvpConfirmation = 'Thank you for confirming your attendance. Keep this QR entry pass ready for check-in at the venue.',
}) {
  const blocks = [
    {
      type: 'envelopeAnimation',
      data: {
        ...(BLOCK_TYPES.envelopeAnimation?.defaults || {}),
        gateStyle,
        openButtonText: 'Open Invitation',
        envelopeColor,
        paperColor,
      },
    },
    {
      type: 'backgroundMusic',
      data: {
        ...(BLOCK_TYPES.backgroundMusic?.defaults || {}),
        songTitle,
        volume: 75,
      },
    },
    {
      type: 'desktopHero',
      data: {
        ...(BLOCK_TYPES.desktopHero?.defaults || {}),
        backgroundImage: coverPhoto,
        title: coupleName,
        subtitle,
        date,
        overlayGradient: 'cinematic',
        overlayOpacity: 0.65,
        showMonogram: true,
        showGuestTag: true,
        showScrollGuide: true,
      },
    },
    {
      type: 'cover',
      data: {
        ...(BLOCK_TYPES.cover?.defaults || {}),
        backgroundImage: coverPhoto,
        subtitle,
        coupleName,
        date,
        coverLayout,
        displayFont,
        coverTextAlign,
        coverAlignItems,
        overlayOpacity,
        overlayColor: '#141413',
        showGuestName: true,
        showScrollIndicator: false,
      },
    },
  ]

  if (showIntroOrnament && ornamentStyle) {
    blocks.push({
      type: 'ornament',
      data: { ...(BLOCK_TYPES.ornament?.defaults || {}), style: ornamentStyle, color: accentColor },
    })
  }

  if (showBismillah) {
    blocks.push({
      type: 'heading',
      data: {
        ...(BLOCK_TYPES.heading?.defaults || {}),
        content: '﷽',
        fontSize: 30,
        color: primaryColor,
        spacingTop: 16,
        spacingBottom: 8,
      },
    })
  }

  blocks.push(
    {
      type: 'quote',
      data: {
        ...(BLOCK_TYPES.quote?.defaults || {}),
        text: quoteText,
        source: quoteSource,
        style: quoteStyle,
        color: primaryColor,
      },
    },
    {
      type: 'couple',
      data: {
        ...(BLOCK_TYPES.couple?.defaults || {}),
        name1,
        name2,
        title1,
        title2,
        photo1: includeCouplePhotos ? SAMPLE_PHOTOS.groom1 : '',
        photo2: includeCouplePhotos ? SAMPLE_PHOTOS.bride1 : '',
        instagram1: name1.toLowerCase().replace(/[^a-z0-9]/g, ''),
        instagram2: name2.toLowerCase().replace(/[^a-z0-9]/g, ''),
        layout: coupleLayout,
        photoShape,
        description: coupleDescription,
      },
    },
    {
      type: 'heading',
      data: {
        ...(BLOCK_TYPES.heading?.defaults || {}),
        content: 'Save The Date',
        fontSize: 34,
        fontStyle: 'italic',
        fontFamily: displayFont,
        color: primaryColor,
        spacingBottom: 12,
      },
    },
    {
      type: 'countdown',
      data: {
        ...(BLOCK_TYPES.countdown?.defaults || {}),
        targetDate,
        label: 'Counting Down to the Day',
        style: countdownStyle,
      },
    },
    {
      type: 'location',
      data: {
        ...(BLOCK_TYPES.location?.defaults || {}),
        events,
        mapDisplay: 'button',
      },
    },
    {
      type: 'schedule',
      data: {
        ...(BLOCK_TYPES.schedule?.defaults || {}),
        title: 'Event Schedule',
        layoutMode: scheduleMode,
        items: scheduleItems,
      },
    },
    {
      type: 'dressCode',
      data: {
        ...(BLOCK_TYPES.dressCode?.defaults || {}),
        title: 'Dress Code',
        description: 'We kindly invite you to dress within the color palette below.',
        note: dressCodeNote,
        swatches,
      },
    },
  )

  if (includeStory && storyItems && storyItems.length > 0) {
    blocks.push(
      {
        type: 'heading',
        data: {
          ...(BLOCK_TYPES.heading?.defaults || {}),
          content: 'Our Story',
          fontSize: 32,
          fontStyle: 'italic',
          fontFamily: displayFont,
          color: primaryColor,
          spacingBottom: 12,
        },
      },
      {
        type: 'story',
        data: {
          ...(BLOCK_TYPES.story?.defaults || {}),
          items: storyItems,
        },
      },
    )
  }

  if (includeGallery) {
    blocks.push(
      {
        type: 'heading',
        data: {
          ...(BLOCK_TYPES.heading?.defaults || {}),
          content: 'Captured Moments',
          fontSize: 32,
          fontStyle: 'italic',
          fontFamily: displayFont,
          color: primaryColor,
          spacingBottom: 12,
        },
      },
      {
        type: 'gallery',
        data: {
          ...(BLOCK_TYPES.gallery?.defaults || {}),
          columns: 2,
          layoutMode: galleryMode,
          images: galleryImages,
        },
      },
    )
  }

  blocks.push(
    {
      type: 'rsvp',
      data: {
        ...(BLOCK_TYPES.rsvp?.defaults || {}),
        title: 'RSVP',
        attendingLabel: 'Joyfully Accepts',
        declineLabel: 'Regretfully Declines',
        showGuestCount: true,
        showSessionChoice: true,
        showQrTicket: true,
        confirmationMessage: rsvpConfirmation,
      },
    },
    {
      type: 'wishes',
      data: {
        ...(BLOCK_TYPES.wishes?.defaults || {}),
        title: 'Wishes & Blessings',
        displayMode: 'masonry',
      },
    },
    {
      type: 'gift',
      data: {
        ...(BLOCK_TYPES.gift?.defaults || {}),
        title: 'Wedding Gift',
        subtitle: 'Your presence and blessings are the greatest gift of all. Should you wish to send a token of love, you may use the details below:',
        accounts,
        physicalRecipient,
        physicalPhone,
        physicalAddress,
      },
    },
    {
      type: 'qrPass',
      data: {
        ...(BLOCK_TYPES.qrPass?.defaults || {}),
        title: 'QR E-Invitation',
        subtitle: 'Present this QR code to our reception host at the venue for check-in and souvenir redemption.',
        showGuestName: true,
        cardColor: paperColor,
        accentColor: primaryColor,
      },
    },
    {
      type: 'thankYou',
      data: {
        ...(BLOCK_TYPES.thankYou?.defaults || {}),
        title: thankYouTitle,
        description: thankYouDesc,
        signature1,
        signature2,
        coupleSignature,
      },
    },
    {
      type: 'footer',
      data: {
        ...(BLOCK_TYPES.footer?.defaults || {}),
        thankYouText: 'Thank You',
        coupleName,
        subtitle: 'We Look Forward to Celebrating With You',
        bgStyle: 'dark',
        photos: galleryImages,
      },
    }
  )

  return blocks
}

function buildBirthdayBlocks({
  primaryColor = '#1e40af',
  accentColor = '#d97706',
  envelopeColor = '#1e3a8a',
  paperColor = '#ffffff',
  gateStyle = 'editorial',
  coverPhoto = 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=1200&q=80',
  title = "Alvaro's 17th Birthday",
  subtitle = 'A Night of Celebration & Music',
  date = 'Saturday, November 14, 2026',
  targetDate = '2026-11-14T19:00:00',
  celebrantName = 'Alvaro Putra Dewanto',
  headingFont = 'Plus Jakarta Sans',
  displayFont = headingFont,
  songTitle = 'Celebration & Good Times',
} = {}) {
  return [
    {
      type: 'envelopeAnimation',
      data: {
        ...(BLOCK_TYPES.envelopeAnimation?.defaults || {}),
        gateStyle,
        openButtonText: 'Open Invitation',
        envelopeColor,
        paperColor,
      },
    },
    {
      type: 'backgroundMusic',
      data: {
        ...(BLOCK_TYPES.backgroundMusic?.defaults || {}),
        songTitle,
        volume: 75,
      },
    },
    {
      type: 'desktopHero',
      data: {
        ...(BLOCK_TYPES.desktopHero?.defaults || {}),
        backgroundImage: coverPhoto,
        title,
        subtitle,
        date,
        overlayGradient: 'cinematic',
        overlayOpacity: 0.65,
        showMonogram: true,
        showGuestTag: true,
        showScrollGuide: true,
      },
    },
    {
      type: 'cover',
      data: {
        ...(BLOCK_TYPES.cover?.defaults || {}),
        backgroundImage: coverPhoto,
        coupleName: title,
        subtitle,
        date,
        displayFont,
        coverLayout: 'editorial',
        coverTextAlign: 'center',
        overlayOpacity: 0.45,
      },
    },
    {
      type: 'heading',
      data: {
        ...(BLOCK_TYPES.heading?.defaults || {}),
        content: 'You Are Invited!',
        fontSize: 32,
        fontFamily: displayFont,
        color: primaryColor,
        spacingBottom: 12,
      },
    },
    {
      type: 'quote',
      data: {
        ...(BLOCK_TYPES.quote?.defaults || {}),
        text: '"Counting memories, not candles! Join us for an unforgettable evening of music, dinner, and celebration as we mark this milestone."',
        source: `— ${celebrantName}`,
        style: 'bordered',
        color: primaryColor,
      },
    },
    {
      type: 'countdown',
      data: {
        ...(BLOCK_TYPES.countdown?.defaults || {}),
        targetDate,
        label: 'Counting Down to the Party',
        style: 'boxed',
      },
    },
    {
      type: 'location',
      data: {
        ...(BLOCK_TYPES.location?.defaults || {}),
        events: [
          {
            name: 'The 17th Birthday Soirée',
            date,
            time: '19:00 - 22:30 WIB',
            venue: 'Skyline Lounge & Rooftop Garden',
            address: 'Jl. Jenderal Sudirman Kav. 52, SCBD, South Jakarta',
            mapUrl: 'https://maps.google.com/?q=SCBD+Jakarta',
          },
        ],
      },
    },
    {
      type: 'schedule',
      data: {
        ...(BLOCK_TYPES.schedule?.defaults || {}),
        title: 'Evening Lineup',
        layoutMode: 'timeline',
        items: [
          { time: '19:00', title: 'Doors Open & Mocktails', description: 'Guest check-in, welcome drinks, and portrait booth.' },
          { time: '19:45', title: 'Dinner & Acoustic Set', description: 'Buffet dinner accompanied by live acoustic music.' },
          { time: '20:30', title: 'Cake Cutting & Toast', description: 'Candle moment, wishes, and celebratory toast.' },
          { time: '21:15', title: 'Games & DJ Finale', description: 'Interactive party games and late-evening dance floor.' },
        ],
      },
    },
    {
      type: 'dressCode',
      data: {
        ...(BLOCK_TYPES.dressCode?.defaults || {}),
        title: 'Dress Code',
        description: 'Smart Casual or Evening Cocktail attire.',
        note: 'Suggested color palette:',
        swatches: [
          { label: 'Deep Cobalt', color: primaryColor },
          { label: 'Amber Gold', color: accentColor },
          { label: 'Crisp Ivory', color: '#ffffff' },
        ],
      },
    },
    {
      type: 'gallery',
      data: {
        ...(BLOCK_TYPES.gallery?.defaults || {}),
        title: 'Photo Highlights',
        layoutMode: 'masonry',
        images: [
          'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=800&q=80',
        ],
      },
    },
    {
      type: 'gift',
      data: {
        ...(BLOCK_TYPES.gift?.defaults || {}),
        title: 'Birthday Gift & Wishlist',
        subtitle: 'Your presence is the best gift of all. If you would like to share a birthday token, you may send it via the account below:',
        accounts: [
          { bankName: 'BCA', accountNumber: '7829103948', accountName: celebrantName },
        ],
      },
    },
    {
      type: 'rsvp',
      data: {
        ...(BLOCK_TYPES.rsvp?.defaults || {}),
        title: 'RSVP',
        showSessionChoice: false,
      },
    },
    {
      type: 'wishes',
      data: {
        ...(BLOCK_TYPES.wishes?.defaults || {}),
        title: 'Birthday Wishes',
      },
    },
    {
      type: 'footer',
      data: {
        ...(BLOCK_TYPES.footer?.defaults || {}),
        thankYouText: 'See You at the Party!',
        coupleName: celebrantName,
        subtitle: 'Thank you for your warm wishes and celebration.',
        bgStyle: 'dark',
      },
    },
  ]
}

function buildAqiqahBlocks({
  primaryColor = '#3b7a57',
  accentColor = '#c5a059',
  envelopeColor = '#2b5a40',
  paperColor = '#fcfffd',
  gateStyle = 'arch-gate',
  coverPhoto = 'https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&w=1200&q=80',
  babyName = 'Rayyan Al-Fatih Wicaksono',
  parentsName = 'Farhan & Nadia',
  date = 'Sunday, December 20, 2026',
  targetDate = '2026-12-20T09:00:00',
  headingFont = 'Lora',
  displayFont = headingFont,
  songTitle = 'Sholawat Badar (Acoustic)',
} = {}) {
  return [
    {
      type: 'envelopeAnimation',
      data: {
        ...(BLOCK_TYPES.envelopeAnimation?.defaults || {}),
        gateStyle,
        openButtonText: 'Open Invitation',
        envelopeColor,
        paperColor,
      },
    },
    {
      type: 'backgroundMusic',
      data: {
        ...(BLOCK_TYPES.backgroundMusic?.defaults || {}),
        songTitle,
        volume: 75,
      },
    },
    {
      type: 'desktopHero',
      data: {
        ...(BLOCK_TYPES.desktopHero?.defaults || {}),
        backgroundImage: coverPhoto,
        title: `Tasyakuran Aqiqah ${babyName}`,
        subtitle: `Beloved Son of ${parentsName}`,
        date,
        overlayGradient: 'warm',
        overlayOpacity: 0.65,
        showMonogram: true,
        showGuestTag: true,
        showScrollGuide: true,
      },
    },
    {
      type: 'cover',
      data: {
        ...(BLOCK_TYPES.cover?.defaults || {}),
        backgroundImage: coverPhoto,
        coupleName: babyName,
        subtitle: 'Tasyakuran & Aqiqah Celebration',
        date,
        displayFont,
        coverLayout: 'arch',
        coverTextAlign: 'center',
        overlayOpacity: 0.4,
      },
    },
    {
      type: 'heading',
      data: {
        ...(BLOCK_TYPES.heading?.defaults || {}),
        content: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
        fontSize: 28,
        fontFamily: displayFont,
        color: primaryColor,
        spacingBottom: 8,
      },
    },
    {
      type: 'quote',
      data: {
        ...(BLOCK_TYPES.quote?.defaults || {}),
        text: '"May Allah bless this child for you, grant you gratitude to the Giver, and raise him to become a pious, gentle, and devoted son."',
        source: '— Aqiqah Blessing Prayer',
        style: 'framed',
        color: primaryColor,
      },
    },
    {
      type: 'countdown',
      data: {
        ...(BLOCK_TYPES.countdown?.defaults || {}),
        targetDate,
        label: 'Counting Down to the Tasyakuran',
        style: 'minimal',
      },
    },
    {
      type: 'location',
      data: {
        ...(BLOCK_TYPES.location?.defaults || {}),
        events: [
          {
            name: 'Tasyakuran & Joint Prayer',
            date,
            time: '09:00 - 12:00 WIB',
            venue: 'Wicaksono Family Residence',
            address: 'Jl. Taman Cilandak No. 8, Cilandak Barat, South Jakarta',
            mapUrl: 'https://maps.google.com/?q=Cilandak+Jakarta',
          },
        ],
      },
    },
    {
      type: 'schedule',
      data: {
        ...(BLOCK_TYPES.schedule?.defaults || {}),
        title: 'Program Rundown',
        layoutMode: 'timeline',
        items: [
          { time: '09:00', title: 'Opening & Recitation', description: 'Qur’an recitation and welcoming sholawat.' },
          { time: '09:45', title: 'Short Tausiyah & Prayer', description: 'Reflections on gratitude and blessings for the baby.' },
          { time: '10:30', title: 'Tasmiyah & Hair Cutting', description: 'Formal naming ceremony and symbolic hair cutting.' },
          { time: '11:15', title: 'Closing Prayer & Luncheon', description: 'Warm family gathering and shared luncheon.' },
        ],
      },
    },
    {
      type: 'dressCode',
      data: {
        ...(BLOCK_TYPES.dressCode?.defaults || {}),
        title: 'Dress Code',
        description: 'Modest, comfortable attire in soft, serene tones.',
        note: 'Suggested color palette:',
        swatches: [
          { label: 'Sage Leaf', color: primaryColor },
          { label: 'Soft Sand', color: accentColor },
          { label: 'Pure White', color: '#ffffff' },
        ],
      },
    },
    {
      type: 'gallery',
      data: {
        ...(BLOCK_TYPES.gallery?.defaults || {}),
        title: 'Precious Moments',
        layoutMode: 'grid',
        images: [
          'https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=800&q=80',
        ],
      },
    },
    {
      type: 'gift',
      data: {
        ...(BLOCK_TYPES.gift?.defaults || {}),
        title: 'Blessings & Gift Registry',
        subtitle: 'Your heartfelt prayers are our greatest treasure. Should you wish to send a gift for our little one, you may use the account below:',
        accounts: [
          { bankName: 'BSI (Bank Syariah Indonesia)', accountNumber: '7192837465', accountName: `Family of ${parentsName}` },
        ],
      },
    },
    {
      type: 'rsvp',
      data: {
        ...(BLOCK_TYPES.rsvp?.defaults || {}),
        title: 'RSVP',
        showSessionChoice: false,
      },
    },
    {
      type: 'wishes',
      data: {
        ...(BLOCK_TYPES.wishes?.defaults || {}),
        title: 'Prayers & Warm Wishes',
      },
    },
    {
      type: 'footer',
      data: {
        ...(BLOCK_TYPES.footer?.defaults || {}),
        thankYouText: 'Jazakumullah Khairan Katsiran',
        coupleName: `Family of ${parentsName}`,
        subtitle: 'Thank you for your prayers, presence, and warmth.',
        bgStyle: 'dark',
      },
    },
  ]
}

export const PRESETS = {
  wedding: {
    key: 'wedding',
    label: 'Wedding',
    labelId: 'Wedding Suite',
    badge: 'Popular',
    icon: '💍',
    description: 'An editorial wedding invitation featuring hero cover, couple profiles, countdown, schedule, RSVP, QR pass, and digital gifts.',
    color: '#344c2d',
    bgColor: '#f4efea',
    accentColor: '#c4a882',
    theme: {
      primaryColor: '#344c2d',
      backgroundColor: '#f4efea',
      accentColor: '#c4a882',
      fontFamily: 'Plus Jakarta Sans',
      headingFont: 'Cormorant Garamond',
      gateStyle: 'arch-gate',
    },
    buildBlocks: (palette = {}) =>
      buildWeddingBlocks({
        primaryColor: palette.primaryColor || '#344c2d',
        accentColor: palette.accentColor || '#c4a882',
        envelopeColor: palette.envelopeColor || '#24351f',
        paperColor: palette.paperColor || '#fbf9f6',
        gateStyle: palette.gateStyle || 'arch-gate',
        headingFont: palette.headingFont || 'Cormorant Garamond',
        displayFont: palette.headingFont || 'Cormorant Garamond',
      }),
    get blocks() {
      return this.buildBlocks()
    },
  },

  birthday: {
    key: 'birthday',
    label: 'Birthday',
    labelId: 'Birthday Soirée',
    badge: 'Celebration',
    icon: '🎂',
    description: 'A vibrant birthday celebration suite with event rundown, dress code swatches, photo gallery, RSVP, and gift details.',
    color: '#1e40af',
    bgColor: '#f0f6ff',
    accentColor: '#d97706',
    theme: {
      primaryColor: '#1e40af',
      backgroundColor: '#f0f6ff',
      accentColor: '#d97706',
      fontFamily: 'Plus Jakarta Sans',
      headingFont: 'Plus Jakarta Sans',
      gateStyle: 'editorial',
    },
    buildBlocks: (palette = {}) =>
      buildBirthdayBlocks({
        primaryColor: palette.primaryColor || '#1e40af',
        accentColor: palette.accentColor || '#d97706',
        envelopeColor: palette.envelopeColor || '#1e3a8a',
        paperColor: palette.paperColor || '#ffffff',
        gateStyle: palette.gateStyle || 'editorial',
        headingFont: palette.headingFont || 'Plus Jakarta Sans',
      }),
    get blocks() {
      return this.buildBlocks()
    },
  },

  aqiqah: {
    key: 'aqiqah',
    label: 'Aqiqah',
    labelId: 'Tasyakuran & Aqiqah',
    badge: 'Family Blessing',
    icon: '👶',
    description: 'A serene Tasyakuran & Aqiqah invitation featuring blessing verses, ceremony rundown, location details, and wishes wall.',
    color: '#3b7a57',
    bgColor: '#f3f8f5',
    accentColor: '#c5a059',
    theme: {
      primaryColor: '#3b7a57',
      backgroundColor: '#f3f8f5',
      accentColor: '#c5a059',
      fontFamily: 'Plus Jakarta Sans',
      headingFont: 'Lora',
      gateStyle: 'arch-gate',
    },
    buildBlocks: (palette = {}) =>
      buildAqiqahBlocks({
        primaryColor: palette.primaryColor || '#3b7a57',
        accentColor: palette.accentColor || '#c5a059',
        envelopeColor: palette.envelopeColor || '#2b5a40',
        paperColor: palette.paperColor || '#fcfffd',
        gateStyle: palette.gateStyle || 'arch-gate',
        headingFont: palette.headingFont || 'Lora',
      }),
    get blocks() {
      return this.buildBlocks()
    },
  },

  custom: {
    key: 'custom',
    label: 'Blank Canvas',
    labelId: 'Custom',
    badge: 'Start from Scratch',
    icon: '✨',
    description: 'Begin with a clean editorial canvas and compose each invitation block freely.',
    color: '#6b655e',
    bgColor: '#ffffff',
    accentColor: '#3b82f6',
    theme: {
      primaryColor: '#1e293b',
      backgroundColor: '#ffffff',
      accentColor: '#3b82f6',
      fontFamily: 'Inter',
      headingFont: 'Plus Jakarta Sans',
      gateStyle: 'editorial',
    },
    buildBlocks: () => [],
    blocks: [],
  },
}

// Aliases for backward compatibility with old database invitations
PRESETS.vogue = PRESETS.wedding
PRESETS.royal = PRESETS.wedding
PRESETS.islamic = PRESETS.wedding
PRESETS.terracotta = PRESETS.wedding
PRESETS.blush = PRESETS.wedding

export const PRESET_LIST = [
  PRESETS.wedding,
  PRESETS.birthday,
  PRESETS.aqiqah,
  PRESETS.custom,
]

function hydrateDemoBlocks(rawBlocks, prefix) {
  return (rawBlocks || []).map((b, idx) => ({
    id: `${prefix}_block_${idx}`,
    type: b.type,
    data: b.data || {},
    sortOrder: idx,
  }))
}

export const DEMO_INVITATION_SLUGS = [
  'elena-julian',
  'sarah-dimas',
  'the-wedding-suite',
  'the-gala-collection',
  'the-secret-garden',
  'alvaro-17th',
  'rayyan-aqiqah',
]

/**
 * Returns a complete, ready-to-render demo invitation for built-in showcase slugs
 * when Supabase is unconfigured or when previewing curated showcase links.
 */
export function getDemoInvitationBySlug(slug) {
  const clean = String(slug || '').trim().toLowerCase()
  if (!clean) return null

  const catalog = {
    'elena-julian': {
      id: 'demo-elena-julian',
      title: 'Elena & Julian',
      slug: 'elena-julian',
      category: 'Wedding',
      theme: {
        primaryColor: '#3d4d33',
        backgroundColor: '#f6f2ec',
        fontFamily: 'Plus Jakarta Sans',
      },
      blocks: buildWeddingBlocks({
        primaryColor: '#3d4d33',
        accentColor: '#c4a882',
        envelopeColor: '#283620',
        paperColor: '#fcfaf7',
        coupleName: 'Elena & Julian',
        name1: 'Julian Hartono, M.Arch.',
        name2: 'Elena Suryadi, S.Ds.',
        date: 'Saturday, October 24, 2026',
        coverPhoto: SAMPLE_PHOTOS.coverAtelier,
        coupleSignature: 'Elena & Julian',
      }),
    },
    'sarah-dimas': {
      id: 'demo-sarah-dimas',
      title: 'Sarah & Dimas',
      slug: 'sarah-dimas',
      category: 'Wedding',
      theme: {
        primaryColor: '#344c2d',
        backgroundColor: '#f4efea',
        fontFamily: 'Plus Jakarta Sans',
      },
      blocks: PRESETS.wedding.buildBlocks(),
    },
    'the-wedding-suite': {
      id: 'demo-wedding-suite',
      title: 'The Wedding Suite — Elena & Julian',
      slug: 'the-wedding-suite',
      category: 'Wedding',
      theme: {
        primaryColor: '#652128',
        backgroundColor: '#f6f0e2',
        fontFamily: 'Inter',
      },
      blocks: buildWeddingBlocks({
        primaryColor: '#652128',
        accentColor: '#b2a380',
        envelopeColor: '#4a151b',
        paperColor: '#faf5ed',
        headingFont: 'Lora',
        coupleName: 'Elena & Julian',
        name1: 'Julian Hartono',
        name2: 'Elena Suryadi',
        coverPhoto: SAMPLE_PHOTOS.coverRoyal,
        coupleSignature: 'Elena & Julian',
      }),
    },
    'the-gala-collection': {
      id: 'demo-gala-collection',
      title: 'The Gala Collection — Vogue Monochrome',
      slug: 'the-gala-collection',
      category: 'Wedding',
      theme: {
        primaryColor: '#1a1918',
        backgroundColor: '#faf8f5',
        fontFamily: 'Inter',
      },
      blocks: buildWeddingBlocks({
        primaryColor: '#1a1918',
        accentColor: '#968c7e',
        envelopeColor: '#141413',
        paperColor: '#faf8f5',
        gateStyle: 'editorial',
        coverLayout: 'editorial',
        headingFont: 'Bodoni Moda',
        coupleName: 'Clara & Adrian',
        name1: 'Adrian Kusuma',
        name2: 'Clara Wijaya',
        coverPhoto: SAMPLE_PHOTOS.coverVogue,
        coupleSignature: 'Clara & Adrian',
      }),
    },
    'the-secret-garden': {
      id: 'demo-secret-garden',
      title: 'The Secret Garden — Blush Romance',
      slug: 'the-secret-garden',
      category: 'Wedding',
      theme: {
        primaryColor: '#8a4f5b',
        backgroundColor: '#fbf6f6',
        fontFamily: 'Plus Jakarta Sans',
      },
      blocks: buildWeddingBlocks({
        primaryColor: '#8a4f5b',
        accentColor: '#d09ca7',
        envelopeColor: '#6b3a43',
        paperColor: '#fffcfc',
        gateStyle: 'wax-seal',
        headingFont: 'Playfair Display',
        coupleName: 'Nadia & Kenji',
        name1: 'Kenji Pratama',
        name2: 'Nadia Larasati',
        coverPhoto: SAMPLE_PHOTOS.coverBlush,
        coupleSignature: 'Nadia & Kenji',
      }),
    },
    'alvaro-17th': {
      id: 'demo-alvaro-17th',
      title: "Alvaro's 17th Birthday",
      slug: 'alvaro-17th',
      category: 'Birthday',
      theme: {
        primaryColor: '#1e40af',
        backgroundColor: '#f0f6ff',
        fontFamily: 'Plus Jakarta Sans',
      },
      blocks: PRESETS.birthday.buildBlocks(),
    },
    'rayyan-aqiqah': {
      id: 'demo-rayyan-aqiqah',
      title: 'Tasyakuran Aqiqah Rayyan',
      slug: 'rayyan-aqiqah',
      category: 'Aqiqah',
      theme: {
        primaryColor: '#3b7a57',
        backgroundColor: '#f3f8f5',
        fontFamily: 'Plus Jakarta Sans',
      },
      blocks: PRESETS.aqiqah.buildBlocks(),
    },
  }

  const entry = catalog[clean]
  if (!entry) return null

  return {
    id: entry.id,
    title: entry.title,
    slug: entry.slug,
    category: entry.category,
    guestCount: 120,
    status: 'published',
    musicUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    theme: entry.theme,
    blocks: hydrateDemoBlocks(entry.blocks, entry.id),
    wishes: [
      {
        id: `${entry.id}_wish_1`,
        author: 'Aulia & Reza',
        content: 'Wishing you a lifetime of warmth, laughter, and beautiful memories together!',
        attendance: 'yes',
        entryType: 'wish',
        isHidden: false,
        date: '2026-08-12T10:00:00.000Z',
      },
      {
        id: `${entry.id}_wish_2`,
        author: 'Dr. Hendra Wijaya',
        content: 'Congratulations to both families. May your celebration be filled with joy and blessings.',
        attendance: 'yes',
        entryType: 'wish',
        isHidden: false,
        date: '2026-08-10T14:30:00.000Z',
      },
    ],
    analytics: { totalViews: 342, rsvpCount: 28 },
    createdAt: '2026-08-01T08:00:00.000Z',
    isDemo: true,
  }
}

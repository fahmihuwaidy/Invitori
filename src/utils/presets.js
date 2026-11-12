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
    subtitle: 'Vibrant Blue & Sunset Gold (Ultah)',
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
  date = 'Sabtu, 24 Oktober 2026',
  targetDate = '2026-10-24T08:30:00',
  name1 = 'Dimas Wicaksono, M.Arch.',
  name2 = 'Sarah Amalia, S.Ds.',
  title1 = 'Putra Pertama dari Bpk. Bambang Wicaksono & Ibu Rini Astuti',
  title2 = 'Putri Bungsu dari Bpk. Ir. Farhan Syahputra & Ibu Ratna Kirana',
  coupleDescription = 'Dengan memohon rahmat dan ridho Tuhan Yang Maha Esa, kami bermaksud menyelenggarakan acara pernikahan putra-putri kami.',
  headingFont = 'Cormorant Garamond',
  displayFont = headingFont,
  ornamentStyle = 'line',
  showIntroOrnament = true,
  quoteText = '"Dua jiwa yang berjalan di jalan yang sama, bertumbuh seperti rerimbunan pohon yang akarnya saling bertaut erat."',
  quoteSource = 'Kahlil Gibran',
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
      date: 'Sabtu, 24 Oktober 2026',
      time: '08:30 - 10:30 WIB',
      venue: 'The Conservatory Glasshouse',
      address: 'Jl. Brawijaya Raya No. 28, Kebayoran Baru, Jakarta Selatan',
      mapUrl: 'https://maps.google.com/?q=The+Conservatory+Jakarta',
    },
    {
      name: 'Garden Soirée & Lunch',
      date: 'Sabtu, 24 Oktober 2026',
      time: '11:30 - 15:00 WIB',
      venue: 'Pine Pavilion Courtyard',
      address: 'Jl. Brawijaya Raya No. 28, Kebayoran Baru, Jakarta Selatan',
      mapUrl: 'https://maps.google.com/?q=The+Conservatory+Jakarta',
    },
  ],
  scheduleItems = [
    { time: '08:30', title: 'Akad Nikah & Ijab Qabul', description: 'Pengucapan janji suci pernikahan di hadapan keluarga.' },
    { time: '10:00', title: 'Sungkeman & Doa Restu', description: 'Permohonan doa restu kepada kedua orang tua tercinta.' },
    { time: '11:30', title: 'Garden Soirée & Acoustic Lunch', description: 'Jamuan makan siang santai diiringi musik akustik.' },
    { time: '14:00', title: 'Toast & Photos with Friends', description: 'Momen kebersamaan dan sesi foto hangat bersama sahabat.' },
  ],
  scheduleMode = 'timeline',
  swatches = [
    { label: 'Olive Leaf', color: '#3d4d33' },
    { label: 'Warm Sage', color: '#889a7a' },
    { label: 'Champagne Linen', color: '#e8dfd5' },
  ],
  dressCodeNote = 'Busana Semi-Formal atau Casual Chic dalam palet bernuansa earth tones / sage.',
  includeStory = true,
  storyItems = [
    {
      date: 'September 2021',
      title: 'Pertemuan Pertama',
      description: 'Sebuah ketidaksengajaan di pameran desain Bandung yang berlanjut menjadi obrolan kopi tanpa henti.',
      photo: SAMPLE_PHOTOS.gallery[0],
    },
    {
      date: 'Juli 2024',
      title: 'Lamaran di Bromo',
      description: 'Di bawah langit senja Bromo yang magis, kami berjanji untuk melangkah bersama seumur hidup.',
      photo: SAMPLE_PHOTOS.gallery[2],
    },
    {
      date: 'Oktober 2026',
      title: 'Hari Bahagia Kami',
      description: 'Hari ketika doa-doa kami berlabuh dalam ikatan pernikahan yang suci.',
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
  physicalAddress = 'Jl. Senopati Dalam II No. 14, Kebayoran Baru, Jakarta Selatan 12190',
  thankYouTitle = 'Merupakan Suatu Kehormatan',
  thankYouDesc = 'Tiada kesan yang lebih mendalam selain kehadiran dan doa restu Bapak/Ibu/Saudara/i untuk mengiringi langkah awal rumah tangga kami.',
  signature1 = 'Kel. Bpk. Bambang Wicaksono & Ibu Rini Astuti',
  signature2 = 'Kel. Bpk. Ir. Farhan Syahputra & Ibu Ratna Kirana',
  coupleSignature = coupleName,
  coverTextAlign = 'center',
  coverAlignItems = 'center',
  overlayOpacity = 0.42,
  rsvpConfirmation = 'Terima kasih atas konfirmasi kehadiran Anda. Simpan tiket QR ini untuk ditunjukkan kepada penerima tamu.',
}) {
  const blocks = [
    {
      type: 'envelopeAnimation',
      data: {
        ...(BLOCK_TYPES.envelopeAnimation?.defaults || {}),
        gateStyle,
        openButtonText: 'Buka Undangan',
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
        label: 'Menuju Hari Bahagia',
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
        title: 'Rangkaian Acara',
        layoutMode: scheduleMode,
        items: scheduleItems,
      },
    },
    {
      type: 'dressCode',
      data: {
        ...(BLOCK_TYPES.dressCode?.defaults || {}),
        title: 'Dress Code',
        description: 'Kami mengundang Anda mengenakan busana dalam palet warna berikut.',
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
          content: 'Kisah Kami',
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
          content: 'Galeri Momen',
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
        title: 'Konfirmasi Kehadiran',
        attendingLabel: 'Saya akan hadir',
        declineLabel: 'Mohon maaf, berhalangan',
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
        title: 'Ucapan & Doa Restu',
        displayMode: 'masonry',
      },
    },
    {
      type: 'gift',
      data: {
        ...(BLOCK_TYPES.gift?.defaults || {}),
        title: 'Tanda Kasih Digital',
        subtitle: 'Kehadiran dan doa restu Anda merupakan hadiah terindah bagi kami. Namun apabila Anda ingin memberikan tanda kasih secara digital maupun fisik, dapat melalui informasi berikut:',
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
        subtitle: 'Tunjukkan QR code ini kepada penerima tamu di lokasi acara untuk check-in dan menukarkan suvenir.',
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
        thankYouText: 'Terima Kasih',
        coupleName,
        subtitle: 'Sampai Jumpa di Hari Bahagia Kami',
        bgStyle: 'dark',
        photos: galleryImages,
      },
    }
  )

  return blocks
}

function buildBirthdayBlocks({
  primaryColor = "#1e40af",
  accentColor = "#d97706",
  envelopeColor = "#1e3a8a",
  paperColor = "#ffffff",
  gateStyle = "editorial",
  coverPhoto = "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=1200&q=80",
  title = "Alvaro's 17th Birthday",
  subtitle = "A Night of Celebration & Music",
  date = "Sabtu, 14 November 2026",
  targetDate = "2026-11-14T19:00:00",
  celebrantName = "Alvaro Putra Dewanto",
  headingFont = "Plus Jakarta Sans",
  displayFont = headingFont,
  songTitle = "Celebration & Good Times",
} = {}) {
  return [
    {
      type: "envelopeAnimation",
      data: {
        ...(BLOCK_TYPES.envelopeAnimation?.defaults || {}),
        gateStyle,
        openButtonText: "Buka Undangan",
        envelopeColor,
        paperColor,
      },
    },
    {
      type: "backgroundMusic",
      data: {
        ...(BLOCK_TYPES.backgroundMusic?.defaults || {}),
        songTitle,
        volume: 75,
      },
    },
    {
      type: "desktopHero",
      data: {
        ...(BLOCK_TYPES.desktopHero?.defaults || {}),
        backgroundImage: coverPhoto,
        title,
        subtitle,
        date,
        overlayGradient: "cinematic",
        overlayOpacity: 0.65,
        showMonogram: true,
        showGuestTag: true,
        showScrollGuide: true,
      },
    },
    {
      type: "cover",
      data: {
        ...(BLOCK_TYPES.cover?.defaults || {}),
        backgroundImage: coverPhoto,
        coupleName: title,
        subtitle,
        date,
        coverLayout: "editorial",
        coverTextAlign: "center",
        overlayOpacity: 0.45,
      },
    },
    {
      type: "heading",
      data: {
        ...(BLOCK_TYPES.heading?.defaults || {}),
        content: "You Are Invited!",
        fontSize: 32,
        fontFamily: displayFont,
        color: primaryColor,
        spacingBottom: 12,
      },
    },
    {
      type: "quote",
      data: {
        ...(BLOCK_TYPES.quote?.defaults || {}),
        content: "\"Counting memories, not calories! Join us for a fun night of music, feast, and good vibes to mark my special milestone.\"",
        author: celebrantName,
        style: "modern",
      },
    },
    {
      type: "countdown",
      data: {
        ...(BLOCK_TYPES.countdown?.defaults || {}),
        targetDate,
        label: "Menuju Pesta Ulang Tahun",
        style: "boxed",
      },
    },
    {
      type: "location",
      data: {
        ...(BLOCK_TYPES.location?.defaults || {}),
        events: [
          {
            name: "The 17th Birthday Bash",
            date,
            time: "19:00 - 22:30 WIB",
            venue: "Skyline Lounge & Rooftop Garden",
            address: "Jl. Jenderal Sudirman Kav. 52, SCBD, Jakarta Selatan",
            mapUrl: "https://maps.google.com/?q=SCBD+Jakarta",
          },
        ],
      },
    },
    {
      type: "schedule",
      data: {
        ...(BLOCK_TYPES.schedule?.defaults || {}),
        title: "Rundown Pesta",
        layoutMode: "timeline",
        items: [
          { time: "19:00", title: "Open Gate & Mocktails", description: "Registrasi tamu, welcome drinks, dan photo booth." },
          { time: "19:45", title: "Dinner & Acoustic Session", description: "Santap malam buffet diiringi live music akustik santai." },
          { time: "20:30", title: "Cake Cutting & Birthday Toast", description: "Tiup lilin, potong kue, dan doa bersama sahabat tercinta." },
          { time: "21:15", title: "Party Games & DJ Session", description: "Keseruan games berhadiah dan dance floor sampai akhir acara." },
        ],
      },
    },
    {
      type: "dressCode",
      data: {
        ...(BLOCK_TYPES.dressCode?.defaults || {}),
        title: "Dress Code",
        description: "Tampil keren dan percaya diri dalam busana Smart Casual / Semi-Formal!",
        note: "Pilihan warna yang disarankan:",
        swatches: [
          { label: "Deep Blue", color: primaryColor },
          { label: "Gold Glam", color: accentColor },
          { label: "Crisp White", color: "#ffffff" },
        ],
      },
    },
    {
      type: "gallery",
      data: {
        ...(BLOCK_TYPES.gallery?.defaults || {}),
        title: "Photo Highlights",
        layout: "masonry",
        images: [
          "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=800&q=80",
          "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80",
          "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=800&q=80",
          "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=800&q=80",
        ],
      },
    },
    {
      type: "bankInfo",
      data: {
        ...(BLOCK_TYPES.bankInfo?.defaults || {}),
        title: "Birthday Gift / Wishlist",
        description: "Kehadiran Anda adalah kado terindah. Namun jika ingin berbagi tanda kasih, Anda dapat mengirimkannya melalui:",
        accounts: [
          { bankName: "BCA", accountNumber: "7829103948", accountName: celebrantName },
        ],
      },
    },
    {
      type: "rsvp",
      data: {
        ...(BLOCK_TYPES.rsvp?.defaults || {}),
        title: "Konfirmasi Kehadiran (RSVP)",
        showSessionChoice: false,
      },
    },
    {
      type: "wishes",
      data: {
        ...(BLOCK_TYPES.wishes?.defaults || {}),
        title: "Ucapan & Doa Ulang Tahun",
      },
    },
    {
      type: "footer",
      data: {
        ...(BLOCK_TYPES.footer?.defaults || {}),
        thankYouText: "See You at the Party!",
        coupleName: celebrantName,
        subtitle: "Terima kasih banyak atas kehadiran & doa baik Anda.",
        bgStyle: "dark",
      },
    },
  ];
}

function buildAqiqahBlocks({
  primaryColor = "#3b7a57",
  accentColor = "#c5a059",
  envelopeColor = "#2b5a40",
  paperColor = "#fcfffd",
  gateStyle = "arch-gate",
  coverPhoto = "https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&w=1200&q=80",
  babyName = "Rayyan Al-Fatih Wicaksono",
  parentsName = "Farhan & Nadia",
  date = "Minggu, 20 Desember 2026",
  targetDate = "2026-12-20T09:00:00",
  headingFont = "Lora",
  displayFont = headingFont,
  songTitle = "Sholawat Badar (Acoustic)",
} = {}) {
  return [
    {
      type: "envelopeAnimation",
      data: {
        ...(BLOCK_TYPES.envelopeAnimation?.defaults || {}),
        gateStyle,
        openButtonText: "Buka Undangan",
        envelopeColor,
        paperColor,
      },
    },
    {
      type: "backgroundMusic",
      data: {
        ...(BLOCK_TYPES.backgroundMusic?.defaults || {}),
        songTitle,
        volume: 75,
      },
    },
    {
      type: "desktopHero",
      data: {
        ...(BLOCK_TYPES.desktopHero?.defaults || {}),
        backgroundImage: coverPhoto,
        title: `Tasyakuran Aqiqah ${babyName}`,
        subtitle: `Putra Tercinta dari ${parentsName}`,
        date,
        overlayGradient: "warm",
        overlayOpacity: 0.65,
        showMonogram: true,
        showGuestTag: true,
        showScrollGuide: true,
      },
    },
    {
      type: "cover",
      data: {
        ...(BLOCK_TYPES.cover?.defaults || {}),
        backgroundImage: coverPhoto,
        coupleName: babyName,
        subtitle: "Tasyakuran & Aqiqah Putra Tercinta",
        date,
        coverLayout: "arch",
        coverTextAlign: "center",
        overlayOpacity: 0.4,
      },
    },
    {
      type: "heading",
      data: {
        ...(BLOCK_TYPES.heading?.defaults || {}),
        content: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
        fontSize: 28,
        fontFamily: displayFont,
        color: primaryColor,
        spacingBottom: 8,
      },
    },
    {
      type: "quote",
      data: {
        ...(BLOCK_TYPES.quote?.defaults || {}),
        content: "\"Semoga Allah memberkahi anak ini untukmu, dan engkau bersyukur kepada Dzat Yang Maha Memberi, serta ia tumbuh menjadi anak yang berbakti dan sholeh.\"",
        author: "Doa Keberkahan Anak",
        style: "framed",
      },
    },
    {
      type: "countdown",
      data: {
        ...(BLOCK_TYPES.countdown?.defaults || {}),
        targetDate,
        label: "Menuju Hari Tasyakuran",
        style: "minimal",
      },
    },
    {
      type: "location",
      data: {
        ...(BLOCK_TYPES.location?.defaults || {}),
        events: [
          {
            name: "Tasyakuran & Doa Bersama",
            date,
            time: "09:00 - 12:00 WIB",
            venue: "Kediaman Keluarga Besar",
            address: "Jl. Taman Cilandak No. 8, Cilandak Barat, Jakarta Selatan",
            mapUrl: "https://maps.google.com/?q=Cilandak+Jakarta",
          },
        ],
      },
    },
    {
      type: "schedule",
      data: {
        ...(BLOCK_TYPES.schedule?.defaults || {}),
        title: "Susunan Acara",
        layoutMode: "timeline",
        items: [
          { time: "09:00", title: "Pembukaan & Kalam Ilahi", description: "Tilawah Al-Qur'an dan lantunan sholawat berkah." },
          { time: "09:45", title: "Tausiyah Singkat & Makna Aqiqah", description: "Untaian nasihat agama dan doa untuk buah hati." },
          { time: "10:30", title: "Prosesi Tasmiyah & Cukur Rambut", description: "Pemberian nama resmi serta pemotongan rambut bayi." },
          { time: "11:15", title: "Doa Penutup & Ramah Tamah", description: "Santap siang bersama keluarga dan para tamu undangan." },
        ],
      },
    },
    {
      type: "dressCode",
      data: {
        ...(BLOCK_TYPES.dressCode?.defaults || {}),
        title: "Dress Code",
        description: "Disarankan mengenakan busana muslim / sopan bernuansa tenang dan bersih.",
        note: "Palet warna yang disarankan:",
        swatches: [
          { label: "Sage Leaf", color: primaryColor },
          { label: "Soft Sand", color: accentColor },
          { label: "Pure White", color: "#ffffff" },
        ],
      },
    },
    {
      type: "gallery",
      data: {
        ...(BLOCK_TYPES.gallery?.defaults || {}),
        title: "Momen Bahagia",
        layout: "grid",
        images: [
          "https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&w=800&q=80",
          "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?auto=format&fit=crop&w=800&q=80",
          "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=800&q=80",
        ],
      },
    },
    {
      type: "bankInfo",
      data: {
        ...(BLOCK_TYPES.bankInfo?.defaults || {}),
        title: "Tanda Kasih untuk Buah Hati",
        description: "Doa tulus Anda adalah hadiah terbaik bagi putra kami. Jika berkenan memberi tanda kasih, dapat disalurkan melalui rekening berikut:",
        accounts: [
          { bankName: "BSI (Bank Syariah Indonesia)", accountNumber: "7192837465", accountName: `Kel. ${parentsName}` },
        ],
      },
    },
    {
      type: "rsvp",
      data: {
        ...(BLOCK_TYPES.rsvp?.defaults || {}),
        title: "Konfirmasi Kehadiran",
        showSessionChoice: false,
      },
    },
    {
      type: "wishes",
      data: {
        ...(BLOCK_TYPES.wishes?.defaults || {}),
        title: "Doa & Harapan untuk Buah Hati",
      },
    },
    {
      type: "footer",
      data: {
        ...(BLOCK_TYPES.footer?.defaults || {}),
        thankYouText: "Jazakumullah Khairan Katsiran",
        coupleName: `Kel. ${parentsName}`,
        subtitle: "Atas doa restu, kehadiran, dan kehangatan dari Bapak/Ibu/Saudara/i.",
        bgStyle: "dark",
      },
    },
  ];
}

export const PRESETS = {
  wedding: {
    key: "wedding",
    label: "Wedding",
    labelId: "Pernikahan",
    badge: "Populer",
    icon: "💍",
    description: "Undangan pernikahan elegan & romantis dengan cover foto, profil mempelai, countdown, rundown acara, rsvp & ucapan doa.",
    color: "#344c2d",
    bgColor: "#f4efea",
    accentColor: "#c4a882",
    theme: {
      primaryColor: "#344c2d",
      backgroundColor: "#f4efea",
      accentColor: "#c4a882",
      fontFamily: "Plus Jakarta Sans",
      headingFont: "Cormorant Garamond",
      gateStyle: "arch-gate",
    },
    buildBlocks: (palette = {}) =>
      buildWeddingBlocks({
        primaryColor: palette.primaryColor || "#344c2d",
        accentColor: palette.accentColor || "#c4a882",
        envelopeColor: palette.envelopeColor || "#24351f",
        paperColor: palette.paperColor || "#fbf9f6",
        gateStyle: palette.gateStyle || "arch-gate",
        headingFont: palette.headingFont || "Cormorant Garamond",
        displayFont: palette.headingFont || "Cormorant Garamond",
      }),
    get blocks() {
      return this.buildBlocks();
    },
  },

  birthday: {
    key: "birthday",
    label: "Birthday",
    labelId: "Ulang Tahun",
    badge: "Ceria & Meriah",
    icon: "🎂",
    description: "Undangan perayaan ulang tahun ceria & seru dengan rundown pesta, dress code, gallery, rsvp & hadiah digital.",
    color: "#1e40af",
    bgColor: "#f0f6ff",
    accentColor: "#d97706",
    theme: {
      primaryColor: "#1e40af",
      backgroundColor: "#f0f6ff",
      accentColor: "#d97706",
      fontFamily: "Plus Jakarta Sans",
      headingFont: "Plus Jakarta Sans",
      gateStyle: "editorial",
    },
    buildBlocks: (palette = {}) =>
      buildBirthdayBlocks({
        primaryColor: palette.primaryColor || "#1e40af",
        accentColor: palette.accentColor || "#d97706",
        envelopeColor: palette.envelopeColor || "#1e3a8a",
        paperColor: palette.paperColor || "#ffffff",
        gateStyle: palette.gateStyle || "editorial",
        headingFont: palette.headingFont || "Plus Jakarta Sans",
      }),
    get blocks() {
      return this.buildBlocks();
    },
  },

  aqiqah: {
    key: "aqiqah",
    label: "Aqiqah",
    labelId: "Tasyakuran",
    badge: "Keluarga & Berkah",
    icon: "👶",
    description: "Undangan tasyakuran kelahiran & aqiqah buah hati bernuansa islami lembut, doa berkah, lokasi syukuran, serta ucapan selamat.",
    color: "#3b7a57",
    bgColor: "#f3f8f5",
    accentColor: "#c5a059",
    theme: {
      primaryColor: "#3b7a57",
      backgroundColor: "#f3f8f5",
      accentColor: "#c5a059",
      fontFamily: "Plus Jakarta Sans",
      headingFont: "Lora",
      gateStyle: "arch-gate",
    },
    buildBlocks: (palette = {}) =>
      buildAqiqahBlocks({
        primaryColor: palette.primaryColor || "#3b7a57",
        accentColor: palette.accentColor || "#c5a059",
        envelopeColor: palette.envelopeColor || "#2b5a40",
        paperColor: palette.paperColor || "#fcfffd",
        gateStyle: palette.gateStyle || "arch-gate",
        headingFont: palette.headingFont || "Lora",
      }),
    get blocks() {
      return this.buildBlocks();
    },
  },

  custom: {
    key: "custom",
    label: "Kanvas Kosong",
    labelId: "Custom",
    badge: "Mulai dari Nol",
    icon: "✨",
    description: "Mulai dari kanvas bersih dan susun blok undangan sesuai imajinasi Anda sendiri secara bebas.",
    color: "#6b655e",
    bgColor: "#ffffff",
    accentColor: "#3b82f6",
    theme: {
      primaryColor: "#1e293b",
      backgroundColor: "#ffffff",
      accentColor: "#3b82f6",
      fontFamily: "Inter",
      headingFont: "Plus Jakarta Sans",
      gateStyle: "editorial",
    },
    buildBlocks: () => [],
    blocks: [],
  },
};

// Aliases for backward compatibility with old database invitations
PRESETS.vogue = PRESETS.wedding;
PRESETS.royal = PRESETS.wedding;
PRESETS.islamic = PRESETS.wedding;
PRESETS.terracotta = PRESETS.wedding;
PRESETS.blush = PRESETS.wedding;

export const PRESET_LIST = [
  PRESETS.wedding,
  PRESETS.birthday,
  PRESETS.aqiqah,
  PRESETS.custom,
];

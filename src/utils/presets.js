import { BLOCK_TYPES } from './blockDefaults'

/**
 * Preset templates for different invitation categories.
 * Each preset defines a sequence of blocks with pre-filled data
 * that matches the reference layout.
 */

export const PRESETS = {
  wedding: {
    key: 'wedding',
    label: 'Wedding',
    labelId: 'Pernikahan',
    icon: '💍',
    description: 'Undangan pernikahan elegan dengan cover, profil pasangan, countdown, galeri, RSVP, dan lainnya.',
    color: '#565F34',
    blocks: [
      {
        type: 'cover',
        data: {
          ...BLOCK_TYPES.cover.defaults,
          subtitle: 'We Are Getting Married',
          coupleName: 'Romeo & Juliet',
          date: 'Sabtu, 30 Agustus 2026',
        }
      },
      {
        type: 'photo',
        data: {
          ...BLOCK_TYPES.photo.defaults,
          caption: '',
          borderRadius: 0,
        }
      },
      {
        type: 'heading',
        data: {
          ...BLOCK_TYPES.heading.defaults,
          content: '﷽',
          fontSize: 28,
          color: '#2D2D2D',
        }
      },
      {
        type: 'paragraph',
        data: {
          ...BLOCK_TYPES.paragraph.defaults,
          content: '"Dan di antara tanda-tanda (kebesaran)-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri, agar kamu cenderung dan merasa tenteram kepadanya, dan Dia menjadikan di antaramu rasa kasih dan sayang." — QS. Ar-Rum: 21',
          fontSize: 14,
          color: '#8A8A8A',
        }
      },
      {
        type: 'divider',
        data: { ...BLOCK_TYPES.divider.defaults }
      },
      {
        type: 'couple',
        data: {
          ...BLOCK_TYPES.couple.defaults,
          name1: 'Romeo',
          name2: 'Juliet',
          title1: 'Putra pertama dari Bpk. Montague & Ibu Montague',
          title2: 'Putri kedua dari Bpk. Capulet & Ibu Capulet',
          instagram1: '',
          instagram2: '',
        }
      },
      {
        type: 'heading',
        data: {
          ...BLOCK_TYPES.heading.defaults,
          content: 'Wedding Event',
          fontSize: 28,
        }
      },
      {
        type: 'countdown',
        data: {
          ...BLOCK_TYPES.countdown.defaults,
          targetDate: '',
          label: 'Counting down to the big day',
        }
      },
      {
        type: 'location',
        data: {
          ...BLOCK_TYPES.location.defaults,
          venue: 'Grand Ballroom Hotel',
          address: 'Jl. Contoh No. 123, Kota',
          date: '30 Agustus 2026',
          time: '10:00 WIB',
          mapUrl: '',
        }
      },
      {
        type: 'heading',
        data: {
          ...BLOCK_TYPES.heading.defaults,
          content: 'Our Moments',
          fontSize: 26,
        }
      },
      {
        type: 'gallery',
        data: {
          ...BLOCK_TYPES.gallery.defaults,
          columns: 2,
          images: [],
        }
      },
      {
        type: 'heading',
        data: {
          ...BLOCK_TYPES.heading.defaults,
          content: 'Love Story',
          fontSize: 26,
        }
      },
      {
        type: 'story',
        data: {
          ...BLOCK_TYPES.story.defaults,
          items: [
            { date: '2020', title: 'Pertama Bertemu', description: 'Ceritakan di mana kalian pertama kali bertemu...' },
            { date: '2022', title: 'Mulai Berpacaran', description: 'Moment memulai hubungan...' },
            { date: '2026', title: 'Lamaran', description: 'Moment lamaran yang tak terlupakan...' },
          ]
        }
      },
      {
        type: 'video',
        data: {
          ...BLOCK_TYPES.video.defaults,
          autoplay: true,
          loop: true,
        }
      },
      {
        type: 'wishes',
        data: {
          ...BLOCK_TYPES.wishes.defaults,
          title: 'Send Your Wishes',
        }
      },
      {
        type: 'gift',
        data: {
          ...BLOCK_TYPES.gift.defaults,
          title: 'Wedding Gift',
        }
      },
      {
        type: 'rsvp',
        data: {
          ...BLOCK_TYPES.rsvp.defaults,
          title: 'Konfirmasi Kehadiran',
        }
      },
      {
        type: 'footer',
        data: {
          ...BLOCK_TYPES.footer.defaults,
          thankYouText: 'Thank You',
          coupleName: 'Romeo & Juliet',
          subtitle: 'For Being Part of Our Special Day',
        }
      },
    ]
  },

  birthday: {
    key: 'birthday',
    label: 'Birthday',
    labelId: 'Ulang Tahun',
    icon: '🎂',
    description: 'Undangan ulang tahun ceria dengan cover, countdown, galeri foto, RSVP, dan info lokasi.',
    color: '#C06C84',
    blocks: [
      {
        type: 'cover',
        data: {
          ...BLOCK_TYPES.cover.defaults,
          subtitle: "You're Invited To",
          coupleName: 'Birthday Party!',
          date: 'Sabtu, 15 November 2026',
          showGuestName: true,
        }
      },
      {
        type: 'heading',
        data: {
          ...BLOCK_TYPES.heading.defaults,
          content: "🎉 Let's Celebrate!",
          fontSize: 28,
          color: '#C06C84',
        }
      },
      {
        type: 'paragraph',
        data: {
          ...BLOCK_TYPES.paragraph.defaults,
          content: 'Dengan penuh suka cita, kami mengundang Anda untuk hadir merayakan hari spesial ini bersama kami.',
          fontSize: 15,
        }
      },
      {
        type: 'photo',
        data: {
          ...BLOCK_TYPES.photo.defaults,
          caption: 'Birthday Star ⭐',
        }
      },
      {
        type: 'countdown',
        data: {
          ...BLOCK_TYPES.countdown.defaults,
          label: 'Counting down to the party!',
        }
      },
      {
        type: 'location',
        data: {
          ...BLOCK_TYPES.location.defaults,
          venue: 'Venue Nama',
          address: 'Alamat lengkap',
          date: '15 November 2026',
          time: '16:00 WIB',
        }
      },
      {
        type: 'gallery',
        data: {
          ...BLOCK_TYPES.gallery.defaults,
          columns: 3,
        }
      },
      {
        type: 'rsvp',
        data: {
          ...BLOCK_TYPES.rsvp.defaults,
          title: 'Konfirmasi Kehadiran',
        }
      },
      {
        type: 'wishes',
        data: {
          ...BLOCK_TYPES.wishes.defaults,
          title: 'Birthday Wishes 🎁',
        }
      },
      {
        type: 'footer',
        data: {
          ...BLOCK_TYPES.footer.defaults,
          thankYouText: 'Thank You',
          coupleName: 'See You There!',
          subtitle: 'Your presence is the best gift',
        }
      },
    ]
  },

  aqiqah: {
    key: 'aqiqah',
    label: 'Newborn / Aqiqah',
    labelId: 'Aqiqah / Kelahiran',
    icon: '👶',
    description: 'Undangan aqiqah atau perayaan kelahiran bayi dengan foto, countdown, dan detail acara.',
    color: '#6B9080',
    blocks: [
      {
        type: 'cover',
        data: {
          ...BLOCK_TYPES.cover.defaults,
          subtitle: 'Menyambut Kelahiran',
          coupleName: 'Baby Name',
          date: 'Sabtu, 20 Desember 2026',
          showGuestName: true,
        }
      },
      {
        type: 'heading',
        data: {
          ...BLOCK_TYPES.heading.defaults,
          content: '﷽',
          fontSize: 28,
          color: '#6B9080',
        }
      },
      {
        type: 'paragraph',
        data: {
          ...BLOCK_TYPES.paragraph.defaults,
          content: 'Dengan rasa syukur kepada Allah SWT, kami mengundang Bapak/Ibu/Saudara/i untuk menghadiri acara Aqiqah putra/putri kami.',
          fontSize: 14,
        }
      },
      {
        type: 'photo',
        data: {
          ...BLOCK_TYPES.photo.defaults,
          caption: 'Our Little One 💕',
        }
      },
      {
        type: 'paragraph',
        data: {
          ...BLOCK_TYPES.paragraph.defaults,
          content: 'Lahir pada tanggal ...\nBerat: ... kg\nPanjang: ... cm',
          fontSize: 14,
        }
      },
      {
        type: 'countdown',
        data: {
          ...BLOCK_TYPES.countdown.defaults,
          label: 'Hari menuju acara',
        }
      },
      {
        type: 'location',
        data: {
          ...BLOCK_TYPES.location.defaults,
          venue: 'Rumah / Gedung',
          address: 'Alamat lengkap acara',
          date: '20 Desember 2026',
          time: '09:00 WIB',
        }
      },
      {
        type: 'gallery',
        data: {
          ...BLOCK_TYPES.gallery.defaults,
          columns: 2,
        }
      },
      {
        type: 'rsvp',
        data: {
          ...BLOCK_TYPES.rsvp.defaults,
          title: 'Konfirmasi Kehadiran',
        }
      },
      {
        type: 'gift',
        data: {
          ...BLOCK_TYPES.gift.defaults,
          title: 'Kado untuk Si Kecil 🎁',
        }
      },
      {
        type: 'wishes',
        data: {
          ...BLOCK_TYPES.wishes.defaults,
          title: "Doa & Ucapan 🤲",
        }
      },
      {
        type: 'footer',
        data: {
          ...BLOCK_TYPES.footer.defaults,
          thankYouText: 'Terima Kasih',
          coupleName: 'Keluarga Besar',
          subtitle: 'Atas doa dan kehadiran Anda',
        }
      },
    ]
  },

  custom: {
    key: 'custom',
    label: 'Custom',
    labelId: 'Kosong',
    icon: '✨',
    description: 'Mulai dari kanvas kosong. Pilih dan susun blok sesuka hati Anda.',
    color: '#8A8A8A',
    blocks: []
  }
}

export const PRESET_LIST = Object.values(PRESETS)

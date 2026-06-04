import { BLOCK_TYPES } from './blockDefaults.js'

/**
 * Preset templates for different invitation categories.
 * Each preset defines a sequence of blocks with pre-filled data
 * that matches the reference layout.
 */

export const PRESETS = {
  wedding: {
    key: 'wedding',
    label: 'Wedding',
    labelId: 'Wedding',
    icon: '💍',
    description: 'Elegant wedding invitation with cover, couple profile, schedule, countdown, gallery, RSVP, and more.',
    color: '#565F34',
    blocks: [
      {
        type: 'cover',
        data: {
          ...BLOCK_TYPES.cover.defaults,
          subtitle: 'We Are Getting Married',
          coupleName: 'Romeo & Juliet',
          date: 'Saturday, August 30, 2026',
          coverLayout: 'classic',
        }
      },
      {
        type: 'ornament',
        data: { ...BLOCK_TYPES.ornament.defaults, style: 'floral' }
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
        type: 'quote',
        data: {
          ...BLOCK_TYPES.quote.defaults,
          text: '"And of His signs is that He created for you from yourselves mates that you may find tranquility in them."',
          source: '— QS. Ar-Rum: 21',
          style: 'framed',
          color: '#565F34',
        }
      },
      {
        type: 'ornament',
        data: { ...BLOCK_TYPES.ornament.defaults, style: 'floral' }
      },
      {
        type: 'couple',
        data: {
          ...BLOCK_TYPES.couple.defaults,
          name1: 'Romeo',
          name2: 'Juliet',
          title1: 'First son of Mr. Montague & Mrs. Montague',
          title2: 'Second daughter of Mr. Capulet & Mrs. Capulet',
          layout: 'staggered',
          photoShape: 'portrait',
        }
      },
      {
        type: 'ornament',
        data: { ...BLOCK_TYPES.ornament.defaults, style: 'floral' }
      },
      {
        type: 'heading',
        data: {
          ...BLOCK_TYPES.heading.defaults,
          content: 'Wedding Event',
          fontSize: 32,
          fontStyle: 'italic',
          fontFamily: 'Gambarino',
        }
      },
      {
        type: 'countdown',
        data: {
          ...BLOCK_TYPES.countdown.defaults,
          label: 'Counting down to the big day',
          style: 'boxed',
        }
      },
      {
        type: 'location',
        data: {
          ...BLOCK_TYPES.location.defaults,
          events: [
            { name: 'Akad Nikah', date: 'August 30, 2026', time: '08:00 AM', venue: 'Grand Mosque', address: 'Jl. Example No. 1, City', mapUrl: '' },
            { name: 'Resepsi', date: 'August 30, 2026', time: '11:00 AM', venue: 'Grand Ballroom Hotel', address: 'Jl. Example No. 10, City', mapUrl: '' },
          ],
          mapDisplay: 'button',
        }
      },
      {
        type: 'schedule',
        data: {
          ...BLOCK_TYPES.schedule.defaults,
          title: 'Wedding Agenda',
          layoutMode: 'timeline',
        }
      },
      {
        type: 'dressCode',
        data: {
          ...BLOCK_TYPES.dressCode.defaults,
        }
      },
      {
        type: 'heading',
        data: {
          ...BLOCK_TYPES.heading.defaults,
          content: 'Our Moments',
          fontSize: 30,
          fontStyle: 'italic',
          fontFamily: 'Gambarino',
        }
      },
      {
        type: 'gallery',
        data: {
          ...BLOCK_TYPES.gallery.defaults,
          columns: 2,
          layoutMode: 'masonry',
          images: [],
        }
      },
      {
        type: 'heading',
        data: {
          ...BLOCK_TYPES.heading.defaults,
          content: 'Love Story',
          fontSize: 30,
          fontStyle: 'italic',
          fontFamily: 'Gambarino',
        }
      },
      {
        type: 'story',
        data: {
          ...BLOCK_TYPES.story.defaults,
          items: [
            { date: '2020', title: 'First Meeting', description: 'Tell the story of when you first met...', photo: '' },
            { date: '2022', title: 'Start Dating', description: 'The moment your journey began...', photo: '' },
            { date: '2026', title: 'Engagement', description: 'A moment that changed everything...', photo: '' },
          ]
        }
      },
      {
        type: 'video',
        data: {
          ...BLOCK_TYPES.video.defaults,
          autoplay: false,
          loop: false,
        }
      },
      {
        type: 'wishes',
        data: {
          ...BLOCK_TYPES.wishes.defaults,
          title: 'Send Your Wishes',
          displayMode: 'masonry',
        }
      },
      {
        type: 'gift',
        data: {
          ...BLOCK_TYPES.gift.defaults,
          title: 'Wedding Gift',
          accounts: [],
        }
      },
      {
        type: 'rsvp',
        data: {
          ...BLOCK_TYPES.rsvp.defaults,
          title: 'Attendance Confirmation',
        }
      },
      {
        type: 'footer',
        data: {
          ...BLOCK_TYPES.footer.defaults,
          thankYouText: 'Thank You',
          coupleName: 'Romeo & Juliet',
          subtitle: 'For Being Part of Our Special Day',
          bgStyle: 'dark',
        }
      },
    ]
  },

  birthday: {
    key: 'birthday',
    label: 'Birthday',
    labelId: 'Birthday',
    icon: '🎂',
    description: 'Cheerful birthday invitation with cover, countdown, photo gallery, RSVP, and location info.',
    color: '#C06C84',
    blocks: [
      {
        type: 'cover',
        data: {
          ...BLOCK_TYPES.cover.defaults,
          subtitle: "You're Invited To",
          coupleName: 'Birthday Party!',
          date: 'Saturday, November 15, 2026',
          showGuestName: true,
        }
      },
      {
        type: 'heading',
        data: {
          ...BLOCK_TYPES.heading.defaults,
          content: "🎉 Let's Celebrate!",
          fontSize: 30,
          color: '#C06C84',
        }
      },
      {
        type: 'paragraph',
        data: {
          ...BLOCK_TYPES.paragraph.defaults,
          content: 'With great happiness, we invite you to attend and celebrate this special day with us.',
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
          style: 'boxed',
        }
      },
      {
        type: 'location',
        data: {
          ...BLOCK_TYPES.location.defaults,
          events: [
            { name: 'Birthday Party', date: 'November 15, 2026', time: '4:00 PM', venue: 'Venue Name', address: 'Complete address', mapUrl: '' }
          ],
        }
      },
      {
        type: 'gallery',
        data: {
          ...BLOCK_TYPES.gallery.defaults,
          columns: 3,
          layoutMode: 'grid',
        }
      },
      {
        type: 'rsvp',
        data: {
          ...BLOCK_TYPES.rsvp.defaults,
          title: 'Attendance Confirmation',
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
    labelId: 'Aqiqah / Newborn',
    icon: '👶',
    description: 'Aqiqah or newborn celebration invitation with photos, countdown, and event details.',
    color: '#6B9080',
    blocks: [
      {
        type: 'cover',
        data: {
          ...BLOCK_TYPES.cover.defaults,
          subtitle: 'Welcoming the Birth',
          coupleName: 'Baby Name',
          date: 'Saturday, December 20, 2026',
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
        type: 'quote',
        data: {
          ...BLOCK_TYPES.quote.defaults,
          text: '"With gratitude to Allah SWT, we are blessed with a child."',
          source: '',
          style: 'minimal',
          color: '#6B9080',
        }
      },
      {
        type: 'photoFrame',
        data: {
          ...BLOCK_TYPES.photoFrame.defaults,
          caption: 'Our Little One 💕',
          frameStyle: 'polaroid',
        }
      },
      {
        type: 'paragraph',
        data: {
          ...BLOCK_TYPES.paragraph.defaults,
          content: 'Born on ...\nWeight: ... kg | Length: ... cm',
          fontSize: 14,
        }
      },
      {
        type: 'countdown',
        data: {
          ...BLOCK_TYPES.countdown.defaults,
          label: 'Days until event',
          style: 'boxed',
        }
      },
      {
        type: 'location',
        data: {
          ...BLOCK_TYPES.location.defaults,
          events: [
            { name: 'Aqiqah Ceremony', date: 'December 20, 2026', time: '9:00 AM', venue: 'Home / Venue', address: 'Complete event address', mapUrl: '' }
          ],
        }
      },
      {
        type: 'gallery',
        data: {
          ...BLOCK_TYPES.gallery.defaults,
          columns: 2,
          layoutMode: 'masonry',
        }
      },
      {
        type: 'rsvp',
        data: {
          ...BLOCK_TYPES.rsvp.defaults,
          title: 'Attendance Confirmation',
        }
      },
      {
        type: 'gift',
        data: {
          ...BLOCK_TYPES.gift.defaults,
          title: 'Gift for the Little One 🎁',
          accounts: [],
        }
      },
      {
        type: 'wishes',
        data: {
          ...BLOCK_TYPES.wishes.defaults,
          title: "Prayers & Wishes 🤲",
        }
      },
      {
        type: 'footer',
        data: {
          ...BLOCK_TYPES.footer.defaults,
          thankYouText: 'Thank You',
          coupleName: 'Big Family',
          subtitle: 'For your prayers and presence',
        }
      },
    ]
  },

  custom: {
    key: 'custom',
    label: 'Custom',
    labelId: 'Empty',
    icon: '✨',
    description: 'Start from an empty canvas. Choose and arrange blocks as you wish.',
    color: '#8A8A8A',
    blocks: []
  }
}

export const PRESET_LIST = Object.values(PRESETS)

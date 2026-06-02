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
    labelId: 'Wedding',
    icon: '💍',
    description: 'Elegant wedding invitation with cover, couple profile, countdown, gallery, RSVP, and more.',
    color: '#565F34',
    blocks: [
      {
        type: 'cover',
        data: {
          ...BLOCK_TYPES.cover.defaults,
          subtitle: 'We Are Getting Married',
          coupleName: 'Romeo & Juliet',
          date: 'Saturday, August 30, 2026',
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
          content: '"And of His signs is that He created for you from yourselves mates that you may find tranquility in them; and He placed between you affection and mercy." — QS. Ar-Rum: 21',
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
          title1: 'First son of Mr. Montague & Mrs. Montague',
          title2: 'Second daughter of Mr. Capulet & Mrs. Capulet',
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
          address: '123 Example St., City',
          date: 'August 30, 2026',
          time: '10:00 AM',
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
            { date: '2020', title: 'First Meeting', description: 'Tell the story of when you first met...' },
            { date: '2022', title: 'Start Dating', description: 'The moment your journey began...' },
            { date: '2026', title: 'Engagement', description: 'A moment that changed everything...' },
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
          fontSize: 28,
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
        }
      },
      {
        type: 'location',
        data: {
          ...BLOCK_TYPES.location.defaults,
          venue: 'Venue Name',
          address: 'Complete address',
          date: 'November 15, 2026',
          time: '4:00 PM',
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
        type: 'paragraph',
        data: {
          ...BLOCK_TYPES.paragraph.defaults,
          content: 'With gratitude to Allah SWT, we invite you to attend the Aqiqah ceremony for our son/daughter.',
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
          content: 'Born on ...\nWeight: ... kg\nLength: ... cm',
          fontSize: 14,
        }
      },
      {
        type: 'countdown',
        data: {
          ...BLOCK_TYPES.countdown.defaults,
          label: 'Days until event',
        }
      },
      {
        type: 'location',
        data: {
          ...BLOCK_TYPES.location.defaults,
          venue: 'Home / Venue',
          address: 'Complete event address',
          date: 'December 20, 2026',
          time: '9:00 AM',
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
          title: 'Attendance Confirmation',
        }
      },
      {
        type: 'gift',
        data: {
          ...BLOCK_TYPES.gift.defaults,
          title: 'Gift for the Little One 🎁',
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

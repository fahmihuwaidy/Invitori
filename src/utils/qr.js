import QRCode from 'qrcode'
import { nanoid } from 'nanoid'

/**
 * Generate a unique, human-readable guest entry pass token.
 */
export function generatePassToken() {
  return `INV-${nanoid(8).toUpperCase()}`
}

/**
 * Build a canonical scannable string for a guest QR entry pass.
 */
export function encodePassQrValue(input) {
  if (!input) return ''
  if (typeof input === 'string') return input.trim()
  if (input.passToken) return String(input.passToken).trim()
  return JSON.stringify({
    invitationId: input.invitationId || '',
    guestId: input.guestId || '',
    guestName: input.guestName || 'Guest',
  })
}

/**
 * Parse a scanned QR string into normalized pass lookup fields.
 * Supports:
 * - Raw pass tokens (e.g. "INV-ABC12345")
 * - URI/prefixed tokens (e.g. "INVORI:INV-ABC12345" or "invori://pass/INV-ABC12345")
 * - JSON payloads ({ passToken, invitationId, guestId, guestName })
 * - Legacy pipe-delimited format ("title|guestName|ENTRY-PASS")
 */
export function parsePassQrValue(rawText) {
  const raw = String(rawText || '').trim()
  if (!raw) {
    return { passToken: '', guestId: '', invitationId: '', guestName: '', raw: '' }
  }

  if (raw.startsWith('{')) {
    try {
      const parsed = JSON.parse(raw)
      return {
        passToken: String(parsed.passToken || parsed.pass_token || parsed.token || '').trim(),
        guestId: String(parsed.guestId || parsed.guest_id || '').trim(),
        invitationId: String(parsed.invitationId || parsed.invitation_id || '').trim(),
        guestName: String(parsed.guestName || parsed.name || '').trim(),
        raw,
      }
    } catch {
      // Fall through to string parsers
    }
  }

  if (raw.startsWith('INVORI:')) {
    return {
      passToken: raw.slice('INVORI:'.length).trim(),
      guestId: '',
      invitationId: '',
      guestName: '',
      raw,
    }
  }

  if (raw.includes('/pass/')) {
    const token = raw.split('/pass/').pop()?.split(/[?#]/)[0]?.trim() || ''
    return { passToken: token, guestId: '', invitationId: '', guestName: '', raw }
  }

  if (raw.includes('|ENTRY-PASS')) {
    const parts = raw.split('|')
    return {
      passToken: '',
      guestId: '',
      invitationId: '',
      guestName: (parts[1] || '').trim(),
      raw,
    }
  }

  return { passToken: raw, guestId: '', invitationId: '', guestName: '', raw }
}

/**
 * Generate a scannable QR code PNG Data URL.
 */
export async function generateQrDataUrl(text, options = {}) {
  const payload = encodePassQrValue(text)
  if (!payload) return ''

  const {
    size = 240,
    margin = 1,
    color = '#2a3125',
    backgroundColor = '#ffffff',
    errorCorrectionLevel = 'M',
  } = options

  return QRCode.toDataURL(payload, {
    width: size,
    margin,
    errorCorrectionLevel,
    color: {
      dark: color,
      light: backgroundColor,
    },
  })
}

/**
 * Generate a scannable QR code SVG string.
 */
export async function generateQrSvg(text, options = {}) {
  const payload = encodePassQrValue(text)
  if (!payload) return ''

  const {
    size = 240,
    margin = 1,
    color = '#2a3125',
    backgroundColor = '#ffffff',
    errorCorrectionLevel = 'M',
  } = options

  return QRCode.toString(payload, {
    type: 'svg',
    width: size,
    margin,
    errorCorrectionLevel,
    color: {
      dark: color,
      light: backgroundColor,
    },
  })
}

/**
 * Trigger a browser download of a QR code as a PNG image.
 */
export async function downloadQrPng(text, filename = 'invori-qr-pass.png', options = {}) {
  const dataUrl = await generateQrDataUrl(text, { size: 512, margin: 2, ...options })
  if (!dataUrl || typeof document === 'undefined') return false

  const link = document.createElement('a')
  link.href = dataUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  return true
}

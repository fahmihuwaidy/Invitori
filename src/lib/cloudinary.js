const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

/**
 * Upload a file to Cloudinary using unsigned upload.
 * @param {File} file - The file to upload
 * @param {(progress: number) => void} [onProgress] - Optional progress callback (0-100)
 * @returns {Promise<{ url: string, publicId: string }>}
 */
export function uploadToCloudinary(file, onProgress) {
  return new Promise((resolve, reject) => {
    if (!file) {
      return reject(new Error('Berkas tidak ditemukan.'))
    }

    // Maximum 25MB file size limit
    const MAX_SIZE = 25 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      return reject(new Error('Ukuran file melebihi batas maksimal 25MB.'))
    }

    const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', UPLOAD_PRESET)
    formData.append('folder', 'invori')

    const xhr = new XMLHttpRequest()
    xhr.open('POST', url)

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    })

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText)
          resolve({ url: data.secure_url, publicId: data.public_id })
        } catch {
          reject(new Error('Invalid response from Cloudinary'))
        }
      } else {
        try {
          const errData = JSON.parse(xhr.responseText)
          reject(new Error(errData.error?.message || `Upload failed: ${xhr.statusText}`))
        } catch {
          reject(new Error(`Upload failed HTTP ${xhr.status}: ${xhr.statusText}`))
        }
      }
    })

    xhr.addEventListener('error', () => {
      reject(new Error('Koneksi terputus. Pastikan internet stabil dan matikan Ad-Blocker (pemblokir iklan) jika ada.'))
    })
    
    try {
      xhr.send(formData)
    } catch (e) {
      reject(new Error(`Gagal mengirim data: ${e.message}`))
    }
  })
}

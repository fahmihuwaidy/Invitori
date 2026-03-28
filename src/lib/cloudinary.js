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
    const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`
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
        const data = JSON.parse(xhr.responseText)
        resolve({ url: data.secure_url, publicId: data.public_id })
      } else {
        reject(new Error(`Upload failed: ${xhr.statusText}`))
      }
    })

    xhr.addEventListener('error', () => reject(new Error('Upload failed')))
    xhr.send(formData)
  })
}

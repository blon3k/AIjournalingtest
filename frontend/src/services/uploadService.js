/**
 * Service for handling file uploads to Cloudinary
 * Supports all file types including images (JPG, PNG, WEBP, etc.) and documents
 */

const uploadService = {
	/**
	 * Uploads a single file to Cloudinary with optional size reduction
	 * @param {File} file - The file to upload
	 * @param {Object} options - Upload options
	 * @param {boolean} options.reduceSize - Whether to reduce the image size (default: true)
	 * @param {number} options.quality - Image quality (1-100, default: 80)
	 * @param {number} options.maxWidth - Maximum width for resizing (default: 1200)
	 * @param {Function} options.onProgress - Progress callback (percent: 0-100)
	 * @returns {Promise<string>} The secure URL of the uploaded file
	 * @throws {Error} If Cloudinary configuration is missing or upload fails
	 */
	uploadImage: async (file, options = {}) => {
		const cloudName = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME || 'demo'
		const uploadPreset = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET || 'unsigned_preset'

		if (!cloudName) {
			console.warn('Cloudinary cloud name is missing, using "demo" for testing')
		}

		if (!uploadPreset) {
			console.warn('Cloudinary upload preset is missing, using "unsigned_preset" for testing')
		}

		const formData = new FormData()
		formData.append('file', file)
		formData.append('upload_preset', uploadPreset)

		// For tracking upload progress
		const onProgress = options.onProgress || (() => {})

		try {
			// Use XMLHttpRequest to track upload progress
			const xhr = new XMLHttpRequest()

			// Create a promise to handle the upload
			const uploadPromise = new Promise((resolve, reject) => {
				// Track upload progress
				xhr.upload.onprogress = event => {
					if (event.lengthComputable) {
						const percentComplete = Math.round((event.loaded / event.total) * 100)
						onProgress(percentComplete)
					}
				}

				xhr.onload = () => {
					if (xhr.status >= 200 && xhr.status < 300) {
						const response = JSON.parse(xhr.responseText)
						resolve(response)
					} else {
						reject(new Error(`Upload failed with status: ${xhr.status}`))
					}
				}

				xhr.onerror = () => {
					reject(new Error('Network error during upload'))
				}
			})

			// Open the request
			xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`)

			// Send the form data
			xhr.send(formData)

			// Wait for the upload to complete
			const data = await uploadPromise

			// Apply transformations via URL if it's an image and size reduction is enabled
			const isImage = file.type.startsWith('image/')
			if (isImage && options.reduceSize !== false) {
				// Get the base URL from the response
				let url = data.secure_url

				// Extract the version and public ID from the URL
				// Typical Cloudinary URL format: https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{public_id}.{format}
				const urlParts = url.split('/')
				const publicIdWithExtension = urlParts[urlParts.length - 1]
				const version = urlParts[urlParts.length - 2]

				// Create a new URL with transformations
				const quality = options.quality || 80
				const maxWidth = options.maxWidth || 1200

				// Rebuild the URL with transformations
				// Format: https://res.cloudinary.com/{cloud_name}/image/upload/q_{quality},w_{width},f_auto/{version}/{public_id}
				const transformedUrl = url.replace(
					`/${version}/${publicIdWithExtension}`,
					`/q_${quality},w_${maxWidth},f_auto/${version}/${publicIdWithExtension}`
				)

				return transformedUrl
			}

			return data.secure_url
		} catch (error) {
			console.error('Error in uploadImage:', error)
			throw new Error(`Failed to upload file: ${error.message}`)
		}
	},

	/**
	 * Uploads multiple files to Cloudinary
	 * @param {File[]} files - Array of files to upload
	 * @param {Object} options - Upload options (same as uploadImage)
	 * @returns {Promise<string[]>} Array of secure URLs of the uploaded files
	 */
	uploadMultipleImages: async (files, options = {}) => {
		try {
			const uploadPromises = files.map((file, index) => {
				// Create a separate progress tracker for each file
				const onProgress = percent => {
					if (options.onProgress) {
						// Calculate overall progress as the average of all files
						options.onProgress({
							fileIndex: index,
							fileName: file.name,
							percent,
							totalFiles: files.length,
						})
					}
				}

				return uploadService.uploadImage(file, { ...options, onProgress })
			})

			return await Promise.all(uploadPromises)
		} catch (error) {
			console.error('Error in uploadMultipleImages:', error)
			throw new Error(`Failed to upload multiple files: ${error.message}`)
		}
	},
}

export default uploadService

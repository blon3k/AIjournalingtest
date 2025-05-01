import api from './api'

// Upload a file
const uploadFile = async formData => {
	const response = await api.post('/files/upload', formData, {
		headers: {
			'Content-Type': 'multipart/form-data',
		},
	})
	return response.data // Should return { success: true, data: newFile }
}

// Get user files
const getUserFiles = async () => {
	const response = await api.get('/files')
	return response.data // Should return { success: true, count: Number, data: [files] }
}

// Delete a file
const deleteFile = async fileId => {
	const response = await api.delete(`/files/${fileId}`)
	return response.data // Should return { success: true, message: String }
}

const fileService = {
	uploadFile,
	getUserFiles,
	deleteFile,
}

export default fileService

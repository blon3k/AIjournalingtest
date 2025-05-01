const express = require('express')
const router = express.Router()
const multer = require('multer')
const { uploadFile, getUserFiles, deleteFile } = require('../controllers/fileController')
const { protect } = require('../middleware/auth')

// Configure multer for memory storage and file size limit (e.g., 25MB)
const upload = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB limit
})

// @route   POST /api/files/upload
// @desc    Upload a text file
// @access  Private
router.post('/upload', protect, upload.single('file'), uploadFile)

// @route   GET /api/files
// @desc    Get all files for the logged-in user
// @access  Private
router.get('/', protect, getUserFiles)

// @route   DELETE /api/files/:fileId
// @desc    Delete a file
// @access  Private
router.delete('/:fileId', protect, deleteFile)

module.exports = router

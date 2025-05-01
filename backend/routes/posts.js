const express = require('express')
const router = express.Router()
const {
	getPosts,
	getPost,
	createPost,
	updatePost,
	deletePost,
	likePost,
	savePost,
	getUserPosts,
	getPostsByTag,
} = require('../controllers/postController')
const { protect } = require('../middleware/auth')

// Public routes
router.get('/', getPosts)
router.get('/:id', getPost)
router.get('/user/:userId', getUserPosts)
router.get('/tags/:tag', getPostsByTag)

// Protected routes (require authentication)
router.post('/', protect, createPost)
router.put('/:id', protect, updatePost)
router.delete('/:id', protect, deletePost)
router.put('/:id/like', protect, likePost)
router.put('/:id/save', protect, savePost)

module.exports = router

import api from './api'

// Get all posts with optional filters
const getPosts = async (filter = 'recent', tag = '', page = 1, limit = 10) => {
	const response = await api.get(`/posts?filter=${filter}&tag=${tag}&page=${page}&limit=${limit}`)
	return response.data
}

// Get a single post by ID
const getPostById = async id => {
	const response = await api.get(`/posts/${id}`)
	return response.data.data
}

// Create a new post
const createPost = async postData => {
	const response = await api.post('/posts', postData)
	return response.data.data
}

// Update an existing post
const updatePost = async (id, postData) => {
	const response = await api.put(`/posts/${id}`, postData)
	return response.data.data
}

// Delete a post
const deletePost = async id => {
	const response = await api.delete(`/posts/${id}`)
	return response.data
}

// Like or unlike a post
const likePost = async id => {
	const response = await api.put(`/posts/${id}/like`)
	return response.data
}

// Save or unsave a post
const savePost = async id => {
	const response = await api.put(`/posts/${id}/save`)
	return response.data
}

// Get posts by user ID
const getUserPosts = async (userId, page = 1, limit = 10) => {
	const response = await api.get(`/posts/user/${userId}?page=${page}&limit=${limit}`)
	return response.data
}

// Get posts by tag
const getPostsByTag = async (tag, page = 1, limit = 10) => {
	const response = await api.get(`/posts/tags/${tag}?page=${page}&limit=${limit}`)
	return response.data
}

const postService = {
	getPosts,
	getPostById,
	createPost,
	updatePost,
	deletePost,
	likePost,
	savePost,
	getUserPosts,
	getPostsByTag,
}

export default postService

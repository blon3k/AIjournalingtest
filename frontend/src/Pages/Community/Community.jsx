import React, { useState, useEffect, useRef } from 'react'
import './Community.css'
import { useNavigate, useLocation } from 'react-router-dom'
import {
	Heart,
	ThumbsUp,
	Users,
	ExternalLink,
	Bookmark,
	Share2,
	Filter,
	X,
	Copy,
	Plus,
	FileCode,
	User,
	Search,
	MessageSquare,
	PlusCircle,
	List,
} from 'lucide-react'
import SharePostModal from '../../components/modal/SharePostModal'
import postService from '../../services/postService'
import { useAuth } from '../../context/AuthContext'

const Community = ({ sidebarFilter, updateSidebarFilter }) => {
	const [posts, setPosts] = useState([])
	const [isLoading, setIsLoading] = useState(true)
	const [activeFilter, setActiveFilter] = useState('popular')
	const [selectedPost, setSelectedPost] = useState(null)
	const [isShareModalOpen, setIsShareModalOpen] = useState(false)
	const [sharedContent, setSharedContent] = useState(null)
	const [isShareOptionsOpen, setIsShareOptionsOpen] = useState(false)
	const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 })
	const [currentTag, setCurrentTag] = useState('')
	const navigate = useNavigate()
	const location = useLocation()
	const shareDropdownRef = useRef(null)
	const { user } = useAuth()

	// Handle click outside of share dropdown
	useEffect(() => {
		function handleClickOutside(event) {
			if (shareDropdownRef.current && !shareDropdownRef.current.contains(event.target)) {
				setIsShareOptionsOpen(false)
			}
		}

		// Add event listener
		document.addEventListener('mousedown', handleClickOutside)
		return () => {
			// Clean up
			document.removeEventListener('mousedown', handleClickOutside)
		}
	}, [])

	// Check for share query parameter and shared content in sessionStorage
	useEffect(() => {
		const queryParams = new URLSearchParams(location.search)
		const shouldOpenShareModal = queryParams.get('share') === 'true'

		if (shouldOpenShareModal) {
			const storedContent = sessionStorage.getItem('sharedContent')
			if (storedContent) {
				try {
					setSharedContent(JSON.parse(storedContent))
					setIsShareModalOpen(true)
					// Clear from session storage once used
					sessionStorage.removeItem('sharedContent')
					// Clean up URL
					const newUrl = new URL(window.location)
					newUrl.searchParams.delete('share')
					window.history.replaceState({}, '', newUrl)
				} catch (error) {
					console.error('Error parsing shared content:', error)
				}
			}
		}
	}, [location])

	// Fetch posts from API
	useEffect(() => {
		fetchPosts(activeFilter, currentTag)
	}, [activeFilter, currentTag])

	// Fetch posts from API
	const fetchPosts = async (filter = 'popular', tag = '', page = 1, limit = 10) => {
		try {
			setIsLoading(true)
			const response = await postService.getPosts(filter, tag, page, limit)
			setPosts(response.data)
			setPagination(response.pagination)
		} catch (error) {
			console.error('Error fetching posts:', error)
		} finally {
			setIsLoading(false)
		}
	}

	// Toggle save status of a post
	const toggleSave = async (id, e) => {
		e.stopPropagation()
		try {
			if (!user) {
				// Redirect to login if not authenticated
				navigate('/login')
				return
			}

			const response = await postService.savePost(id)

			// Update posts state to reflect the change
			setPosts(prevPosts => prevPosts.map(post => (post._id === id ? { ...post, saved: response.saved } : post)))
		} catch (error) {
			console.error('Error saving post:', error)
		}
	}

	// Handle liking a post
	const handleLikePost = async (id, e) => {
		e.stopPropagation()
		try {
			if (!user) {
				// Redirect to login if not authenticated
				navigate('/login')
				return
			}

			const response = await postService.likePost(id)

			// Update posts state to reflect the change
			setPosts(prevPosts =>
				prevPosts.map(post =>
					post._id === id ? { ...post, hearts: response.data.hearts, liked: response.liked } : post
				)
			)
		} catch (error) {
			console.error('Error liking post:', error)
		}
	}

	// Filter posts
	const filterPosts = filter => {
		setActiveFilter(filter)
		// Update the sidebar filter to keep UI in sync
		if (updateSidebarFilter) {
			updateSidebarFilter('browse', filter)
		}

		// Fetch posts with the selected filter
		fetchPosts(filter, currentTag)
	}

	// Filter posts by tag
	const filterPostsByTag = tag => {
		setCurrentTag(tag)
		fetchPosts(activeFilter, tag)
	}

	// Apply filters from sidebar when they change
	useEffect(() => {
		if (sidebarFilter && sidebarFilter.type) {
			console.log(`Applying sidebar filter: ${sidebarFilter.type} - ${sidebarFilter.value}`)

			// Handle different filter types
			if (sidebarFilter.type === 'browse') {
				setActiveFilter(sidebarFilter.value)
				fetchPosts(sidebarFilter.value, currentTag)
			} else if (sidebarFilter.type === 'category') {
				filterPostsByTag(sidebarFilter.value)
			} else if (sidebarFilter.type === 'engagement' && sidebarFilter.value === 'saved') {
				// For saved posts, we'll need to fetch user's saved posts
				if (user) {
					fetchUserSavedPosts()
				} else {
					navigate('/login')
				}
			}
		}
	}, [sidebarFilter])

	// Fetch user's saved posts
	const fetchUserSavedPosts = async () => {
		try {
			setIsLoading(true)
			const response = await postService.getUserPosts(user.id)
			setPosts(response.data.filter(post => post.savedBy.includes(user.id)))
		} catch (error) {
			console.error('Error fetching saved posts:', error)
		} finally {
			setIsLoading(false)
		}
	}

	// View full post
	const viewPost = post => {
		setSelectedPost(post)
	}

	// Close full post view
	const closePostView = () => {
		setSelectedPost(null)
	}

	// Copy system prompt
	const copySystemPrompt = (e, prompt) => {
		e.stopPropagation()
		// In a real app, this would add the prompt to the user's library
		alert(`Prompt systemowy "${prompt.title}" dodany do twojej biblioteki promptów`)
		// Navigate to prompts page
		navigate('/prompts')
	}

	// Add assistant
	const addAssistant = (e, assistant) => {
		e.stopPropagation()
		// In a real app, this would add the assistant to the user's collection
		alert(`Asystent "${assistant.name}" dodany do twojej kolekcji`)
		// Navigate to assistants page
		navigate('/assistants')
	}

	// Handle creating a new post directly
	const handleCreatePost = () => {
		if (!user) {
			navigate('/login')
			return
		}
		setSharedContent(null)
		setIsShareModalOpen(true)
	}

	// Navigate to specific sections to find content to share
	const navigateToShareableContent = type => {
		setIsShareOptionsOpen(false)
		switch (type) {
			case 'prompts':
				navigate('/prompts')
				break
			case 'assistants':
				navigate('/assistants')
				break
			case 'chats':
				navigate('/chat')
				break
			default:
				break
		}
	}

	// Helper function to get initials from name
	const getInitials = name => {
		if (!name) return 'U'
		return name
			.split(' ')
			.map(part => part[0])
			.join('')
			.toUpperCase()
			.substring(0, 2)
	}

	// Helper function to get formatted date
	const getFormattedDate = post => {
		return post.formattedDate || 'Niedawno'
	}

	// Check if user has liked a post
	const hasUserLikedPost = post => {
		return user && post.likedBy && post.likedBy.includes(user.id)
	}

	// Check if user has saved a post
	const hasUserSavedPost = post => {
		return user && post.savedBy && post.savedBy.includes(user.id)
	}

	return (
		<div className="community-container">
			<div className="community-header">
				<h1 className="community-title">Społeczność</h1>
				<p className="community-description">
					Ucz się, dziel się i łącz z innymi na temat wskazówek dotyczących AI, przypadków użycia i kreatywnych
					implementacji.
				</p>
			</div>

			<div className="community-filters">
				<button
					className={`filter-button ${activeFilter === 'popular' ? 'active' : ''}`}
					onClick={() => filterPosts('popular')}>
					<ThumbsUp size={16} />
					<span>Popularne</span>
				</button>
				<button
					className={`filter-button ${activeFilter === 'recent' ? 'active' : ''}`}
					onClick={() => filterPosts('recent')}>
					<Heart size={16} />
					<span>Najnowsze</span>
				</button>
				<button
					className={`filter-button ${activeFilter === 'trending' ? 'active' : ''}`}
					onClick={() => filterPosts('trending')}>
					<Filter size={16} />
					<span>Trendy</span>
				</button>
				<div className="community-actions">
					<div className="share-dropdown" ref={shareDropdownRef}>
						<button className="share-button" onClick={() => setIsShareOptionsOpen(!isShareOptionsOpen)}>
							<Share2 size={16} />
							<span>Udostępnij</span>
						</button>
						{isShareOptionsOpen && (
							<div className="share-options">
								<button className="share-option" onClick={() => navigateToShareableContent('prompts')}>
									<FileCode size={16} />
									<span>Udostępnij Prompt</span>
								</button>
								<button className="share-option" onClick={() => navigateToShareableContent('assistants')}>
									<User size={16} />
									<span>Udostępnij Asystenta</span>
								</button>
								<button className="share-option" onClick={() => navigateToShareableContent('chats')}>
									<MessageSquare size={16} />
									<span>Udostępnij Podsumowanie</span>
								</button>
							</div>
						)}
					</div>
					<button className="create-post-button" onClick={handleCreatePost}>
						<PlusCircle size={16} />
						<span>Utwórz Post</span>
					</button>
				</div>
			</div>

			{isLoading ? (
				<div className="community-loading">
					<div className="loading-spinner"></div>
					<p>Ładowanie postów społeczności...</p>
				</div>
			) : (
				<div className="posts-container">
					{posts.map(post => (
						<div className="post-card" key={post._id} onClick={() => viewPost(post)}>
							<div className="post-header">
								<div className="post-author">
									{(post.authorId === user?.id && user?.avatar) || post.authorAvatar ? (
										<img
											src={post.authorId === user?.id && user?.avatar ? user.avatar : post.authorAvatar}
											alt={post.authorName}
											className="author-avatar"
										/>
									) : (
										<div className="author-avatar">{getInitials(post.authorName)}</div>
									)}
									<div className="author-info">
										<div className="author-name">{post.authorName}</div>
										<div className="post-date">{getFormattedDate(post)}</div>
									</div>
								</div>
								<button
									className={`save-button ${hasUserSavedPost(post) ? 'saved' : ''}`}
									onClick={e => toggleSave(post._id, e)}
									aria-label={hasUserSavedPost(post) ? 'Usuń z zapisanych' : 'Zapisz post'}>
									<Bookmark size={18} strokeWidth={1.5} />
								</button>
							</div>
							<div className="post-content">
								<h3 className="post-title">{post.title}</h3>
								<p className="post-excerpt">{post.content}</p>
							</div>
							<div className="post-tags">
								{post.tags &&
									post.tags.map((tag, index) => (
										<span className="post-tag" key={index}>
											{tag}
										</span>
									))}
							</div>
							<div className="post-footer">
								<div className="post-stats">
									<div className="post-stat">
										<Heart
											size={16}
											fill={hasUserLikedPost(post) ? 'currentColor' : 'none'}
											onClick={e => handleLikePost(post._id, e)}
										/>
										<span>{post.hearts}</span>
									</div>
								</div>
								<div className="post-actions">
									{post.systemPrompt && (
										<button
											className="post-action has-tooltip"
											aria-label="Kopiuj prompt systemowy"
											onClick={e => copySystemPrompt(e, post.systemPrompt)}>
											<FileCode size={16} strokeWidth={1.5} />
											<span className="action-tooltip">Kopiuj prompt</span>
										</button>
									)}
									{post.assistant && (
										<button
											className="post-action has-tooltip"
											aria-label="Dodaj asystenta"
											onClick={e => addAssistant(e, post.assistant)}>
											<User size={16} strokeWidth={1.5} />
											<span className="action-tooltip">Dodaj asystenta</span>
										</button>
									)}
									<button className="post-action" aria-label="Udostępnij post" onClick={e => e.stopPropagation()}>
										<Share2 size={16} strokeWidth={1.5} />
									</button>
									<button className="post-action" aria-label="Otwórz post">
										<ExternalLink size={16} strokeWidth={1.5} />
									</button>
								</div>
							</div>
						</div>
					))}
				</div>
			)}

			{/* Full post view modal */}
			{selectedPost && (
				<div className="post-modal-overlay" onClick={closePostView}>
					<div className="post-modal-content" onClick={e => e.stopPropagation()}>
						<button className="post-modal-close" onClick={closePostView}>
							<X size={20} strokeWidth={1.5} />
						</button>

						<div className="post-modal-header">
							<div className="post-author">
								{(selectedPost.authorId === user?.id && user?.avatar) || selectedPost.authorAvatar ? (
									<img
										src={selectedPost.authorId === user?.id && user?.avatar ? user.avatar : selectedPost.authorAvatar}
										alt={selectedPost.authorName}
										className="author-avatar"
									/>
								) : (
									<div className="author-avatar">{getInitials(selectedPost.authorName)}</div>
								)}
								<div className="author-info">
									<div className="author-name">{selectedPost.authorName}</div>
									<div className="post-date">{getFormattedDate(selectedPost)}</div>
								</div>
							</div>
							<button
								className={`save-button ${hasUserSavedPost(selectedPost) ? 'saved' : ''}`}
								onClick={e => toggleSave(selectedPost._id, e)}>
								<Bookmark size={18} strokeWidth={1.5} />
							</button>
						</div>

						<h2 className="post-modal-title">{selectedPost.title}</h2>

						<div className="post-modal-tags">
							{selectedPost.tags &&
								selectedPost.tags.map((tag, index) => (
									<span className="post-tag" key={index}>
										{tag}
									</span>
								))}
						</div>

						<div className="post-modal-content-text">
							<p>{selectedPost.content}</p>
						</div>

						{selectedPost.systemPrompt && (
							<div className="post-modal-prompt">
								<div className="prompt-header">
									<div className="prompt-title">
										<FileCode size={18} strokeWidth={1.5} />
										<h3>Prompt Systemowy: {selectedPost.systemPrompt.title}</h3>
									</div>
									<button className="copy-button" onClick={e => copySystemPrompt(e, selectedPost.systemPrompt)}>
										<Copy size={16} strokeWidth={1.5} />
										<span>Dodaj do Biblioteki Promptów</span>
									</button>
								</div>
								<div className="prompt-content">
									<p>{selectedPost.systemPrompt.content}</p>
								</div>
							</div>
						)}

						{selectedPost.assistant && (
							<div className="post-modal-assistant">
								<div className="assistant-header">
									<div className="assistant-title">
										<User size={18} strokeWidth={1.5} />
										<h3>Asystent</h3>
									</div>
									<button className="add-button" onClick={e => addAssistant(e, selectedPost.assistant)}>
										<Plus size={16} strokeWidth={1.5} />
										<span>Dodaj do Asystentów</span>
									</button>
								</div>
								<div className="assistant-content">
									{selectedPost.assistant.avatar ? (
										<img
											src={selectedPost.assistant.avatar}
											alt={selectedPost.assistant.name}
											className="assistant-avatar"
										/>
									) : (
										<div className="assistant-avatar">{getInitials(selectedPost.assistant.name)}</div>
									)}
									<div className="assistant-info">
										<h4>{selectedPost.assistant.name}</h4>
										<p>{selectedPost.assistant.role}</p>
									</div>
								</div>
							</div>
						)}

						<div className="post-modal-stats">
							<div className="post-stat">
								<Heart
									size={18}
									fill={hasUserLikedPost(selectedPost) ? 'currentColor' : 'none'}
									onClick={e => handleLikePost(selectedPost._id, e)}
								/>
								<span>{selectedPost.hearts} serc</span>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Share Post Modal */}
			<SharePostModal
				isOpen={isShareModalOpen}
				onClose={() => setIsShareModalOpen(false)}
				sharedContent={sharedContent}
			/>
		</div>
	)
}

export default Community

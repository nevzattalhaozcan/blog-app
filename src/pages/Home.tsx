import React, { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext';
import PostModal from '../components/PostModal';
import CreatePostButton from '../components/CreatePostButton';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface Post {
  _id: number,
  title: string,
  content: string,
  featured: boolean,
  user_id: number,
  createdAt: string,
  updatedAt: string,
}

interface PostResponse {
  posts: Post[],
  totalPages: number,
  currentPage: number,
  total: number,
}

const Home: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([])
  const [expandedPosts, setExpandedPosts] = useState<Set<number>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const { token } = useAuth();
  const [showPostModal, setShowPostModal] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);

  const handlePostCreated = () => {
    fetchPosts();
  };

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/posts?page=${currentPage}&limit=${limit}&featured=true`);
      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }
      const data = (await response.json()) as PostResponse;
      setPosts(data.posts);
      setTotalPages(data.totalPages);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePost = async (postData: { title: string; content: string; featured: boolean; categories: string[] }) => {
    try {
      const response = await fetch(`${BASE_URL}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ ...postData, featured: true })
      });

      if (!response.ok) {
        throw new Error('Failed to create post');
      }

      setShowPostModal(false);
      fetchPosts();
    } catch (error: any) {
      setError(error.message);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [currentPage]); // Add currentPage as dependency

  const toggleReadMore = (postId: number) => {
    setExpandedPosts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const renderPaginationItems = () => {
    if (totalPages <= 0) return null;

    const items = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // Add first page and ellipsis
    if (startPage > 1) {
      items.push(
        <li key={1} className="page-item">
          <button className="page-link" onClick={() => handlePageChange(1)}>1</button>
        </li>
      );
      if (startPage > 2) {
        items.push(
          <li key="ellipsis1" className="page-item disabled">
            <span className="page-link">...</span>
          </li>
        );
      }
    }

    // Add page numbers
    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <li key={i} className={`page-item ${currentPage === i ? 'active' : ''}`}>
          <button 
            className="page-link" 
            onClick={() => handlePageChange(i)}
            aria-current={currentPage === i ? 'page' : undefined}
          >
            {i}
          </button>
        </li>
      );
    }

    // Add last page and ellipsis
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        items.push(
          <li key="ellipsis2" className="page-item disabled">
            <span className="page-link">...</span>
          </li>
        );
      }
      items.push(
        <li key={totalPages} className="page-item">
          <button className="page-link" onClick={() => handlePageChange(totalPages)}>
            {totalPages}
          </button>
        </li>
      );
    }

    return items;
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-center mb-4">
        <button 
          className="btn btn-secondary" 
          onClick={() => setShowPostModal(true)}
        >
          <i className="bi bi-plus-circle me-2"></i>Create Post
        </button>
      </div>

      <PostModal
        show={showPostModal}
        onClose={() => setShowPostModal(false)}
        onSubmit={handleCreatePost}
        initialData={{ title: '', content: '', featured: true, categories: [] }}
      />

      <CreatePostButton onPostCreated={handlePostCreated} />
      {error && <div className="alert alert-danger">{error}</div>}
      
      {isLoading ? (
        <div className="d-flex justify-content-center my-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        posts.map((post, index) => {
          const isExpanded = expandedPosts.has(post._id);
          return (
            <div key={"post-card-" + index} className="card mb-4">
              <div className="card-body">
                <h3 className="card-title">{post.title}</h3>
                <div 
                  className="card-text mb-3 text-break"
                  style={{ whiteSpace: 'pre-line' }}
                  dangerouslySetInnerHTML={{
                    __html: `<div class="formatted-text">
                      ${isExpanded ? post.content : `${post.content.substring(0, 200)}...`}
                    </div>`
                  }}
                />
                <button 
                  className={`btn ${isExpanded ? 'btn-outline-secondary' : 'btn-outline-primary'} btn-sm`}
                  onClick={() => toggleReadMore(post._id)}
                >
                  {isExpanded ? (
                    <><i className="bi bi-chevron-up me-1"></i>Read Less</>
                  ) : (
                    <><i className="bi bi-chevron-down me-1"></i>Read More</>
                  )}
                </button>
              </div>
            </div>
          )
        })
      )}

      {!isLoading && posts.length > 0 && totalPages > 1 && (
        <nav aria-label="Page navigation" className="my-4">
          <ul className="pagination justify-content-center">
            <li className={`page-item ${currentPage <= 1 ? 'disabled' : ''}`}>
              <button
                className="page-link"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
              >
                <i className="bi bi-chevron-left me-1"></i>
                Previous
              </button>
            </li>
            {renderPaginationItems()}
            <li className={`page-item ${currentPage >= totalPages ? 'disabled' : ''}`}>
              <button
                className="page-link"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
              >
                Next
                <i className="bi bi-chevron-right ms-1"></i>
              </button>
            </li>
          </ul>
          <div className="text-center mt-2 text-muted">
            Page {currentPage} of {totalPages}
          </div>
        </nav>
      )}
    </div>
  )
}

export default Home
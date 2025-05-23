import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import PostModal from '../components/PostModal';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface Post {
  _id: number;
  title: string;
  content: string;
  featured: boolean;
  user_id: number;
  categories: string[];
  created_at: string;
  updated_at: string;
}

interface PostResponse {
  posts: Post[];
  total: number;
  totalPages: number;
}

interface FilterParams {
  sort: string;
  category: string;
  featured: boolean;
  search: string;
  startDate: string;
  endDate: string;
  page: number;
  limit: number;
}

const Posts: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [expandedPosts, setExpandedPosts] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterParams>({
    sort: 'newest',
    category: '',
    featured: false,
    search: '',
    startDate: '',
    endDate: '',
    page: 1,
    limit: 10,
  });
  const [availableCategories] = useState([
    'Technology',
    'Travel',
    'Health',
    'Etymology',
    'Self Improvement',
    'Psychology',
    'Philosophy',
    'Religion',
    'Sociology',
    'Economics',
    'Politics',
    'Science',
    'History',
    'Art',
    'Music',
    'Movies',
    'Literature',
    'Other',
  ]);
  const { token } = useAuth();
  const [showPostModal, setShowPostModal] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [totalPages, setTotalPages] = useState<number>(1);

  const handlePostCreated = () => {
    fetchPosts();
  };

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        // Skip adding featured to query params if it's false (default state)
        if (key === 'featured' && !value) {
          return;
        }
        if (value !== '' && value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });

      const response = await fetch(`${BASE_URL}/posts?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }
      const data = (await response.json()) as PostResponse;
      setPosts(data.posts);
      setTotalPages(data.totalPages); // Use totalPages from API response
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [filters]);

  const toggleReadMore = (postId: number) => {
    setExpandedPosts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  const handleFilterChange = (name: keyof FilterParams, value: string | boolean | number) => {
    setFilters((prev) => ({
      ...prev,
      [name]: value,
      // Reset to page 1 when any filter changes except page
      page: name === 'page' ? prev.page : 1,
    }));
  };

  const handleResetFilters = () => {
    setFilters({
      sort: 'newest',
      category: '',
      featured: false,
      search: '',
      startDate: '',
      endDate: '',
      page: 1,
      limit: 10,
    });
  };

  const handleCreatePost = async (postData: {
    title: string;
    content: string;
    featured: boolean;
    categories: string[];
  }) => {
    try {
      const response = await fetch(`${BASE_URL}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(postData),
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

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({
      ...prev,
      page: newPage,
    }));
  };

  const renderPaginationItems = () => {
    if (totalPages <= 0) return null;

    const items = [];
    // Show max 5 pages at a time
    const maxVisiblePages = 5;
    let startPage = Math.max(1, filters.page - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    // Adjust startPage if we're near the end
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // Add first page and ellipsis if needed
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

    // Add visible page numbers
    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <li key={i} className={`page-item ${filters.page === i ? 'active' : ''}`}>
          <button 
            className="page-link" 
            onClick={() => handlePageChange(i)}
            aria-current={filters.page === i ? 'page' : undefined}
          >
            {i}
          </button>
        </li>
      );
    }

    // Add last page and ellipsis if needed
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
    <div className="container mt-4" data-testid="posts-container">
      <div className="d-flex justify-content-between align-items-center mb-4" data-testid="header-actions">
        <div className="flex-grow-1"></div>
        <div className="text-center flex-grow-1">
          <button
            className="btn btn-secondary"
            onClick={() => setShowPostModal(true)}
            data-testid="create-post-button"
          >
            <i className="bi bi-plus-circle me-2"></i>Create Post
          </button>
        </div>
        <div className="flex-grow-1 text-end">
          <button
            className="btn btn-outline-secondary"
            onClick={() => setShowFilters(!showFilters)}
            data-testid="toggle-filters-button"
          >
            <i className={`bi bi-funnel${showFilters ? '-fill' : ''} me-2`}></i>
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
        </div>
      </div>

      <PostModal
        show={showPostModal}
        onClose={() => setShowPostModal(false)}
        onSubmit={handleCreatePost}
        data-testid="post-modal"
      />

      <div className={`collapse ${showFilters ? 'show' : ''}`} data-testid="filters-section">
        <div className="card card-body mb-4 shadow-sm">
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label" data-testid="filter-text-label">Filter by text</label>
              <div className="input-group">
                <span className="input-group-text">
                  <i className="bi bi-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Post contains..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  data-testid="filter-text-input"
                />
              </div>
            </div>

            <div className="col-md-4">
              <label className="form-label" data-testid="category-label">Category</label>
              <select
                className="form-select"
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                data-testid="category-select"
              >
                <option value="" data-testid="category-option-all">All Categories</option>
                {availableCategories.map((category) => (
                  <option key={category} value={category} data-testid={`category-option-${category}`}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-4">
              <label className="form-label">Sort By</label>
              <select
                className="form-select"
                value={filters.sort}
                onChange={(e) => handleFilterChange('sort', e.target.value)}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>

            <div className="col-md-4">
              <label className="form-label">Start Date</label>
              <input
                type="date"
                className="form-control"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
            </div>

            <div className="col-md-4">
              <label className="form-label">End Date</label>
              <input
                type="date"
                className="form-control"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
            </div>

            <div className="col-md-4">
              <label className="form-label d-block">Options</label>
              <div className="form-check">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="featuredCheck"
                  checked={filters.featured}
                  onChange={(e) => handleFilterChange('featured', e.target.checked)}
                />
                <label className="form-check-label" htmlFor="featuredCheck">
                  Featured Posts Only
                </label>
              </div>
            </div>

            <div className="col-12">
              <button
                className="btn btn-secondary"
                onClick={handleResetFilters}
                data-testid="reset-filters-button"
              >
                <i className="bi bi-arrow-counterclockwise me-2"></i>
                Reset Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-danger" data-testid="error-message">{error}</div>}

      {isLoading ? (
        <div className="d-flex justify-content-center my-5" data-testid="loading-spinner">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        posts.map((post, index) => {
          const isExpanded = expandedPosts.has(post._id);
          return (
            <div key={'post-card-' + index} className="card mb-4" data-testid={`post-card-${post._id}`}>
              <div className="card-body">
                <h5 className="card-title mb-3" data-testid={`post-title-${post._id}`}>{post.title}</h5>
                <div
                  className="card-text post-content mb-3"
                  dangerouslySetInnerHTML={{
                    __html:
                      post.content.length > 200
                        ? isExpanded
                          ? post.content
                          : `${post.content.substring(0, 200)}...`
                        : post.content,
                  }}
                  data-testid={`post-content-${post._id}`}
                />
                {post.content.length > 200 && (
                  <button
                    className={`btn ${
                      isExpanded ? 'btn-outline-secondary' : 'btn-outline-primary'
                    } btn-sm mb-3`}
                    onClick={() => toggleReadMore(post._id)}
                    data-testid={`toggle-read-more-${post._id}`}
                  >
                    {isExpanded ? (
                      <>
                        <i className="bi bi-chevron-up me-1"></i>Read Less
                      </>
                    ) : (
                      <>
                        <i className="bi bi-chevron-down me-1"></i>Read More
                      </>
                    )}
                  </button>
                )}
                <div className="d-flex justify-content-between align-items-center">
                  <div className="text-muted small" data-testid={`post-metadata-${post._id}`}>
                    <span>
                      <i className="bi bi-clock me-1"></i>Created:{' '}
                      {post.created_at ? new Date(post.created_at).toLocaleString() : 'Unknown'}
                    </span>
                    {post.updated_at && post.created_at && post.updated_at !== post.created_at && (
                      <span className="ms-3">
                        <i className="bi bi-pencil-square me-1"></i>Updated:{' '}
                        {new Date(post.updated_at).toLocaleString()}
                      </span>
                    )}
                    {post.categories && post.categories.length > 0 && (
                      <span className="ms-3">
                        <i className="bi bi-tags me-1"></i>
                        {post.categories.map((category, idx) => (
                          <span
                            key={idx}
                            className="badge rounded-pill bg-info text-dark ms-1"
                            data-testid={`post-category-${post._id}-${idx}`}
                          >
                            {category}
                          </span>
                        ))}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })
      )}

      {!isLoading && totalPages > 1 && (
        <nav aria-label="Page navigation" className="my-4" data-testid="pagination">
          <ul className="pagination justify-content-center">
            <li
              className={`page-item ${filters.page <= 1 ? 'disabled' : ''}`}
              data-testid="pagination-previous"
            >
              <button
                className="page-link"
                onClick={() => handlePageChange(filters.page - 1)}
                disabled={filters.page <= 1}
              >
                <i className="bi bi-chevron-left me-1"></i>
                Previous
              </button>
            </li>
            {renderPaginationItems()}
            <li
              className={`page-item ${filters.page >= totalPages ? 'disabled' : ''}`}
              data-testid="pagination-next"
            >
              <button
                className="page-link"
                onClick={() => handlePageChange(filters.page + 1)}
                disabled={filters.page >= totalPages}
              >
                Next
                <i className="bi bi-chevron-right ms-1"></i>
              </button>
            </li>
          </ul>
          <div className="text-center mt-2 text-muted" data-testid="pagination-info">
            Page {filters.page} of {totalPages}
          </div>
        </nav>
      )}

      {!isLoading && posts.length === 0 && (
        <div className="alert alert-info" data-testid="no-posts-message">No posts found.</div>
      )}
    </div>
  );
};

export default Posts;

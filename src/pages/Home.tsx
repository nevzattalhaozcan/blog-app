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
}

const Home: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([])
  const [expandedPosts, setExpandedPosts] = useState<Set<number>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const { token } = useAuth();
  const [showPostModal, setShowPostModal] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const handlePostCreated = () => {
    fetchPosts();
  };

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/posts`);
      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }
      const data = (await response.json()) as PostResponse;
      setPosts(data.posts.filter(post => post.featured));
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
  }, []);

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
    </div>
  )
}

export default Home
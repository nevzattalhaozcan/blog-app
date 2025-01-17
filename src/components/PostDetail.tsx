import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface Post {
  _id: number;
  title: string;
  content: string;
  categories: string[];
  created_at: string;
  updated_at: string;
  user_id: string;
  featured?: boolean;
}

const PostDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await fetch(`${BASE_URL}/posts/${id}`);
        if (!response.ok) {
          throw new Error('Post not found');
        }
        const data = await response.json();
        setPost(data.post); // Update to handle the nested post object
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load post');
        setTimeout(() => {
          navigate('/posts');
        }, 3000);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="alert alert-danger m-3">Error: {error}</div>;
  }

  if (!post) {
    return null;
  }

  return (
    <div className="container mt-4">
      <h1>{post.title}</h1>
      <div className="mb-3">
        <small className="text-muted">
          Posted on {new Date(post.created_at).toLocaleDateString()}
          {post.updated_at !== post.created_at && 
            ` (Updated: ${new Date(post.updated_at).toLocaleDateString()})`}
        </small>
        {post.featured && 
          <span className="ms-2 badge bg-warning">Featured</span>
        }
      </div>
      {post.categories && post.categories.length > 0 && (
        <div className="mb-3">
          {post.categories.map((category, idx) => (
            <span key={idx} className="badge bg-secondary me-1">
              {category}
            </span>
          ))}
        </div>
      )}
      <div className="post-content" dangerouslySetInnerHTML={{ __html: post.content }} />
    </div>
  );
};

export default PostDetail;

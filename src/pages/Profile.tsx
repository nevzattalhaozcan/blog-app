import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { useAuth } from '../contexts/AuthContext';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import PostModal from '../components/PostModal';

const BASE_URL = 'https://blog-app-backend-xw51.onrender.com';

const modules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['blockquote', 'code-block'],
    ['link'],
    ['clean'],
  ],
};

const formats = [
  'header',
  'bold',
  'italic',
  'underline',
  'strike',
  'list',
  'bullet',
  'ordered',
  'link',
  'blockquote',
  'code-block',
];

interface User {
  _id: number;
  username: string;
  email: string;
  bio: string;
  createdAt: string;
  updatedAt: string;
}

interface Post {
  _id: number;
  title: string;
  content: string;
  featured: boolean;
  user_id: string; // Change user_id to string
  created_at: string;
  updated_at: string;
  categories: string[];
}

interface PostResponse {
  posts: Post[];
  totalPages: number;
  currentPage: number;
  total: number;
}

const Profile: React.FC = () => {
  const { userId, token } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [expandedPosts, setExpandedPosts] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [showPostModal, setShowPostModal] = useState<boolean>(false);
  const [currentPost, setCurrentPost] = useState<Post | null>(null);
  const [updatedTitle, setUpdatedTitle] = useState<string>('');
  const [updatedContent, setUpdatedContent] = useState<string>('');
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [postToDelete, setPostToDelete] = useState<number | null>(null);
  const [showUserSettings, setShowUserSettings] = useState<boolean>(false);
  const [showUpdateUserModal, setShowUpdateUserModal] = useState<boolean>(false);
  const [showUpdatePasswordModal, setShowUpdatePasswordModal] = useState<boolean>(false);
  const [showDeleteUserModal, setShowDeleteUserModal] = useState<boolean>(false);
  const [updatedUsername, setUpdatedUsername] = useState<string>('');
  const [updatedEmail, setUpdatedEmail] = useState<string>('');
  const [updatedBio, setUpdatedBio] = useState<string>('');
  const [oldPassword, setOldPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [deleteAccountPassword, setDeleteAccountPassword] = useState<string>('');
  const [showOldPassword, setShowOldPassword] = useState<boolean>(false);
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([fetchUser(), fetchPosts()]);
      } finally {
        setIsLoading(false);
      }
    };

    if (userId && token) {
      fetchData();
    }
  }, [userId, token]);

  const fetchUser = async () => {
    try {
      const response = await fetch(`${BASE_URL}/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch user details');
      }
      const data = (await response.json()) as User;
      setUser(data);
    } catch (error: any) {
      setError(error.message);
    }
  };

  const fetchPosts = async () => {
    try {
      const response = await fetch(`${BASE_URL}/posts?page=${currentPage}&limit=${limit}&user_id=${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }
      const data = (await response.json()) as PostResponse;
      setPosts(data.posts);
      setTotalPages(data.totalPages);
    } catch (error: any) {
      setError(error.message);
    }
  };

  useEffect(() => {
    if (userId && token) {
      fetchPosts();
    }
  }, [userId, token, currentPage]); // Add currentPage as dependency

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

  const handleUpdatePost = (post: Post) => {
    setUpdatedTitle(post.title);
    setUpdatedContent(post.content);
    setCurrentPost({
      ...post,
      categories: post.categories || []
    });
    setShowPostModal(true);
  };

  const handleSaveChanges = async (postData: { title: string; content: string; featured: boolean; categories: string[] }) => {
    if (currentPost) {
      try {
        const response = await fetch(`${BASE_URL}/posts/${currentPost._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(postData),
        });
        if (!response.ok) {
          throw new Error('Failed to update post');
        }
        const updatedPost = await response.json();
        setPosts((prevPosts) => 
          prevPosts.map((post) => 
            post._id === currentPost._id 
              ? {
                  ...post,
                  ...updatedPost,
                  title: postData.title,
                  content: postData.content,
                  featured: postData.featured,
                  categories: postData.categories,
                  updated_at: new Date().toISOString()
                }
              : post
          )
        );
        setShowPostModal(false);
      } catch (error: any) {
        setError(error.message);
      }
    }
  };

  const handleDeletePost = async () => {
    if (postToDelete !== null) {
      try {
        const response = await fetch(`${BASE_URL}/posts/${postToDelete}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error('Failed to delete post');
        }
        setPosts((prevPosts) => prevPosts.filter((post) => post._id !== postToDelete));
        setShowDeleteModal(false);
      } catch (error: any) {
        setError(error.message);
      }
    }
  };

  const confirmDeletePost = (postId: number) => {
    setPostToDelete(postId);
    setShowDeleteModal(true);
  };

  const handleUpdateUser = async () => {
    try {
      const response = await fetch(`${BASE_URL}/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ username: updatedUsername, email: updatedEmail, bio: updatedBio }),
      });

      if (!response.ok) {
        throw new Error('Failed to update user details');
      }

      // After successful update, fetch the updated user details
      const getUserResponse = await fetch(`${BASE_URL}/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!getUserResponse.ok) {
        throw new Error('Failed to fetch updated user details');
      }

      const updatedUser = (await getUserResponse.json()) as User;
      setUser(updatedUser);
      setShowUpdateUserModal(false);
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleUpdatePassword = async () => {
    if (newPassword !== confirmPassword) {
      setError('New password and confirm password do not match');
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/users/${userId}/password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      if (!response.ok) {
        throw new Error('Failed to update password');
      }
      setShowUpdatePasswordModal(false);
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleDeleteUser = async () => {
    try {
      // First verify the password
      const verifyResponse = await fetch(`${BASE_URL}/users/${userId}/password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          oldPassword: deleteAccountPassword,
          newPassword: deleteAccountPassword,
        }),
      });

      if (!verifyResponse.ok) {
        throw new Error('Incorrect password');
      }

      // If password is verified, proceed with deletion
      const deleteResponse = await fetch(`${BASE_URL}/users/${userId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!deleteResponse.ok) {
        throw new Error('Failed to delete user');
      }

      setShowDeleteUserModal(false);
      // Handle successful deletion (e.g., redirect to login page)
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleUpdateUserClick = () => {
    if (user) {
      setUpdatedUsername(user.username);
      setUpdatedEmail(user.email);
      setUpdatedBio(user.bio || '');
      setShowUpdateUserModal(true);
    }
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const renderPaginationItems = () => {
    const items = [];
    for (let i = 1; i <= totalPages; i++) {
      items.push(
        <li key={i} className={`page-item ${currentPage === i ? 'active' : ''}`}>
          <button className="page-link" onClick={() => handlePageChange(i)}>
            {i}
          </button>
        </li>
      );
    }
    return items;
  };

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4" data-testid="profile-container">
      {error && <div className="alert alert-danger" data-testid="error-message">{error}</div>}
      {user && (
        <div className="card mb-4 shadow-sm" data-testid="user-card">
          <div className="card-header bg-body py-3" data-testid="user-card-header">
            <div className="d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center">
                <div className="bg-primary bg-opacity-25 rounded-circle p-3 me-3" data-testid="user-avatar">
                  <i className="bi bi-person-circle fs-2 text-primary"></i>
                </div>
                <div>
                  <h4 className="mb-0" data-testid="user-username">{user.username}</h4>
                  <small className="text-muted" data-testid="user-joined-date">
                    <i className="bi bi-calendar3 me-1"></i>
                    Joined {new Date(user.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </small>
                </div>
              </div>
              <div className="dropdown" data-testid="user-settings-dropdown">
                <button
                  className="btn btn-outline-secondary dropdown-toggle"
                  type="button"
                  id="userSettingsDropdown"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                  data-testid="settings-button"
                >
                  <i className="bi bi-gear me-1"></i>
                  Settings
                </button>
                <ul className="dropdown-menu dropdown-menu-end shadow-sm" data-testid="settings-menu">
                  <li>
                    <button
                      className="dropdown-item"
                      onClick={handleUpdateUserClick}
                      data-testid="update-details-button"
                    >
                      <i className="bi bi-pencil me-2"></i>Update Details
                    </button>
                  </li>
                  <li>
                    <button
                      className="dropdown-item"
                      onClick={() => setShowUpdatePasswordModal(true)}
                      data-testid="change-password-button"
                    >
                      <i className="bi bi-key me-2"></i>Change Password
                    </button>
                  </li>
                  <li><hr className="dropdown-divider" data-testid="settings-divider" /></li>
                  <li>
                    <button
                      className="dropdown-item text-danger"
                      onClick={() => setShowDeleteUserModal(true)}
                      data-testid="delete-account-button"
                    >
                      <i className="bi bi-trash me-2"></i>Delete Account
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="card-body" data-testid="user-card-body">
            <div className="row g-4">
              <div className="col-md-6">
                <div className="p-3 border rounded bg-body" data-testid="user-email-section">
                  <h6 className="text-muted mb-2">Email Address</h6>
                  <div className="d-flex align-items-center">
                    <i className="bi bi-envelope me-2 text-primary"></i>
                    <span data-testid="user-email">{user.email}</span>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="p-3 border rounded bg-body" data-testid="user-status-section">
                  <h6 className="text-muted mb-2">Account Status</h6>
                  <div className="d-flex align-items-center">
                    <i className="bi bi-check-circle-fill me-2 text-success"></i>
                    <span data-testid="user-status">Active</span>
                  </div>
                </div>
              </div>
              {user.bio && (
                <div className="col-12">
                  <div className="p-3 border rounded bg-body" data-testid="user-bio-section">
                    <h6 className="text-muted mb-2">Bio</h6>
                    <div className="d-flex">
                      <i className="bi bi-person-lines-fill me-2 text-primary"></i>
                      <p className="mb-0" data-testid="user-bio">{user.bio}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <h3 className="mb-4" data-testid="user-posts-title">Your Posts</h3>
      {posts.map((post, index) => {
        const isExpanded = expandedPosts.has(post._id);
        return (
          <div key={'post-card-' + index} className="card mb-4 shadow-sm" data-testid={`post-card-${post._id}`}>
            <div className="card-body">
              <h5 className="card-title mb-2" data-testid={`post-title-${post._id}`}>{post.title}</h5>
              <div
                className="card-text post-content mb-3"
                dangerouslySetInnerHTML={{
                  __html: isExpanded
                    ? post.content
                    : post.content.length > 200
                    ? `${post.content.substring(0, 200)}...`
                    : post.content,
                }}
                data-testid={`post-content-${post._id}`}
              />
              {post.content.length > 200 && (
                <div className="text-left mb-3">
                  <button
                    className={`btn ${isExpanded ? 'btn-outline-secondary' : 'btn-outline-primary'} btn-sm`}
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
                </div>
              )}
              <div className="d-flex justify-content-between align-items-center">
                <div className="text-muted small" data-testid={`post-metadata-${post._id}`}>
                  <span>
                    <i className="bi bi-clock me-1"></i>Created: {post.created_at ? new Date(post.created_at).toLocaleString() : 'Unknown'}
                  </span>
                  {post.updated_at && post.created_at && post.updated_at !== post.created_at && (
                    <span className="ms-3">
                      <i className="bi bi-pencil-square me-1"></i>Updated:{' '}
                      {new Date(post.updated_at).toLocaleString()}
                    </span>
                  )}
                </div>

                <div className="btn-group">
                  <button
                    className="btn btn-outline-primary btn-sm"
                    onClick={() => handleUpdatePost(post)}
                    data-testid={`edit-post-button-${post._id}`}
                  >
                    <i className="bi bi-pencil me-1"></i>
                    Edit
                  </button>
                  <button
                    className="btn btn-outline-danger btn-sm"
                    onClick={() => confirmDeletePost(post._id)}
                    data-testid={`delete-post-button-${post._id}`}
                  >
                    <i className="bi bi-trash me-1"></i>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {!isLoading && posts.length > 0 && totalPages > 1 && (
        <nav aria-label="Page navigation" className="my-4" data-testid="pagination">
          <ul className="pagination justify-content-center">
            <li
              className={`page-item ${currentPage <= 1 ? 'disabled' : ''}`}
              data-testid="pagination-previous"
            >
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
            <li
              className={`page-item ${currentPage >= totalPages ? 'disabled' : ''}`}
              data-testid="pagination-next"
            >
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
          <div className="text-center mt-2 text-muted" data-testid="pagination-info">
            Page {currentPage} of {totalPages}
          </div>
        </nav>
      )}

      <PostModal
        show={showPostModal}
        onClose={() => setShowPostModal(false)}
        onSubmit={handleSaveChanges}
        initialData={currentPost ? {
          title: currentPost.title,
          content: currentPost.content,
          featured: currentPost.featured,
          categories: currentPost.categories || []
        } : undefined}
        isEditMode={true}
      />

      {showDeleteModal && (
        <div className="modal show d-block" tabIndex={-1}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirm Delete</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowDeleteModal(false)}
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to delete this post?</p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>
                  Cancel
                </button>
                <button type="button" className="btn btn-danger" onClick={handleDeletePost}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showUpdateUserModal && (
        <div className="modal show d-block" tabIndex={-1}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Update User Details</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowUpdateUserModal(false)}
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body">
                <form>
                  <div className="form-group mb-2">
                    <label htmlFor="formUsername">Username</label>
                    <input
                      type="text"
                      className="form-control mt-2"
                      id="formUsername"
                      value={updatedUsername}
                      onChange={(e) => setUpdatedUsername(e.target.value)}
                    />
                  </div>
                  <div className="form-group mb-2">
                    <label htmlFor="formEmail">Email</label>
                    <input
                      type="email"
                      className="form-control mt-2"
                      id="formEmail"
                      value={updatedEmail}
                      onChange={(e) => setUpdatedEmail(e.target.value)}
                    />
                  </div>
                  <div className="form-group mb-2">
                    <label htmlFor="formBio">Bio</label>
                    <textarea
                      className="form-control mt-2"
                      id="formBio"
                      rows={3}
                      style={{ resize: 'none' }}
                      value={updatedBio}
                      onChange={(e) => setUpdatedBio(e.target.value)}
                    />
                  </div>
                </form>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowUpdateUserModal(false)}
                >
                  Close
                </button>
                <button type="button" className="btn btn-primary" onClick={handleUpdateUser}>
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showUpdatePasswordModal && (
        <div className="modal show d-block" tabIndex={-1}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Update Password</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowUpdatePasswordModal(false)}
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body">
                <form>
                  <div className="form-group mb-2">
                    <label htmlFor="formOldPassword">Old Password</label>
                    <div className="input-group mt-2">
                      <input
                        type={showOldPassword ? 'text' : 'password'}
                        className="form-control"
                        id="formOldPassword"
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                      />
                      <button
                        className="btn btn-outline-secondary"
                        type="button"
                        onClick={() => setShowOldPassword(!showOldPassword)}
                      >
                        <i className={`bi bi-eye${showOldPassword ? '-slash' : ''}`}></i>
                      </button>
                    </div>
                  </div>
                  <div className="form-group mb-2">
                    <label htmlFor="formNewPassword">New Password</label>
                    <div className="input-group mt-2">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        className="form-control"
                        id="formNewPassword"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                      <button
                        className="btn btn-outline-secondary"
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        <i className={`bi bi-eye${showNewPassword ? '-slash' : ''}`}></i>
                      </button>
                    </div>
                  </div>
                  <div className="form-group mb-2">
                    <label htmlFor="formConfirmPassword">Confirm Password</label>
                    <div className="input-group mt-2">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        className="form-control"
                        id="formConfirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                      <button
                        className="btn btn-outline-secondary"
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        <i className={`bi bi-eye${showConfirmPassword ? '-slash' : ''}`}></i>
                      </button>
                    </div>
                  </div>
                </form>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowUpdatePasswordModal(false)}
                >
                  Close
                </button>
                <button type="button" className="btn btn-primary" onClick={handleUpdatePassword}>
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDeleteUserModal && (
        <div className="modal show d-block" tabIndex={-1}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirm Delete User</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowDeleteUserModal(false);
                    setDeleteAccountPassword('');
                  }}
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to delete your account? This action cannot be undone.</p>
                <form>
                  <div className="form-group mb-2">
                    <label htmlFor="deleteAccountPassword">Enter your password to confirm:</label>
                    <input
                      type="password"
                      className="form-control mt-2"
                      id="deleteAccountPassword"
                      value={deleteAccountPassword}
                      onChange={(e) => setDeleteAccountPassword(e.target.value)}
                    />
                  </div>
                </form>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowDeleteUserModal(false);
                    setDeleteAccountPassword('');
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleDeleteUser}
                  disabled={!deleteAccountPassword}
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;

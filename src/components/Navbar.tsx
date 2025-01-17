import React, { useState, useRef, useCallback, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface LoginResponse {
  token: string;
  user: {
    _id: string;
  };
}

interface RegisterResponse {
  token: string;
  user: {
    _id: string;
    username: string;
    email: string;
  };
}

interface SearchSuggestion {
  _id: number;
  title: string;
  content: string;
  categories: string[];
  created_at: string;
}

const Navbar: React.FC = () => {
  const searchRef = useRef<HTMLDivElement>(null);
  const { isDarkMode, toggleTheme } = useTheme();
  const { isAuthenticated, login, logout } = useAuth();
  const navigate = useNavigate();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [signupData, setSignupData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [signupError, setSignupError] = useState<string | null>(null);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupConfirmPassword, setShowSignupConfirmPassword] = useState(false);
  const [loginData, setLoginData] = useState({
    username: '',
    password: ''
  });
  const [loginError, setLoginError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout>();

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError(null);

    if (signupData.password !== signupData.confirmPassword) {
      setSignupError("Passwords don't match");
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: signupData.username,
          email: signupData.email,
          password: signupData.password
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Signup failed');
      }

      const data = await response.json() as RegisterResponse;
      login(data.token, data.user._id);
      setSignupData({ username: '', email: '', password: '', confirmPassword: '' });
      setShowAuthModal(false);
    } catch (error: any) {
      setSignupError(error.message);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    try {
      const response = await fetch(`${BASE_URL}/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: loginData.username,
          password: loginData.password
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      const data = await response.json() as LoginResponse;
      login(data.token, data.user._id);
      setLoginData({ username: '', password: '' });
      setShowAuthModal(false);
    } catch (error: any) {
      setLoginError(error.message);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
      setShowSuggestions(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [handleClickOutside]);

  const debouncedSearch = useCallback(async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsSearching(true);
    try {
      const queryParams = new URLSearchParams({
        search: query,
        sort: 'newest',
        limit: '5'
      });

      const response = await fetch(`${BASE_URL}/posts?${queryParams.toString()}`);
      if (!response.ok) throw new Error('Search failed');
      const data = await response.json();
      setSuggestions(data.posts);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Search error:', error);
      setSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    searchTimeout.current = setTimeout(() => {
      debouncedSearch(query);
    }, 300);
  };

  const handleSuggestionClick = async (suggestion: SearchSuggestion) => {
    try {
      // First verify the post exists
      const response = await fetch(`${BASE_URL}/posts/${suggestion._id}`);
      if (!response.ok) {
        throw new Error('Post not found');
      }
      
      // If post exists, navigate to it
      navigate(`/posts/${suggestion._id}`);
      setShowSuggestions(false);
      setSearchQuery('');
    } catch (error) {
      console.error('Error accessing post:', error);
      // Optionally show an error message to the user
      alert('Sorry, this post is no longer available');
    }
  };

  return (
    <>
      <nav className="navbar navbar-expand-lg shadow-sm sticky-top" 
           style={{ 
             background: isDarkMode ? '#1a1a1a' : '#ffffff',
             borderBottom: `1px solid ${isDarkMode ? '#2d2d2d' : '#e5e5e5'}`
           }}>
        <div className="container">
          <Link className="navbar-brand fw-bold" to="/">
            <i className="bi bi-pencil-square me-2"></i>
            Simple Blog
          </Link>
          <button
            className="navbar-toggler border-0"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarSupportedContent"
            aria-controls="navbarSupportedContent"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarSupportedContent">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              <li className="nav-item">
                <Link className="nav-link px-3" aria-current="page" to="/">
                  <i className="bi bi-house-door me-1"></i>Home
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link px-3" to="/posts">
                  <i className="bi bi-collection me-1"></i>All Posts
                </Link>
              </li>
              {isAuthenticated && (
                <li className="nav-item">
                  <Link className="nav-link px-3" to="/profile">
                    <i className="bi bi-person me-1"></i>Profile
                  </Link>
                </li>
              )}
            </ul>
            
            <div className="d-flex position-relative mx-auto" 
                 style={{ width: '40%' }} 
                 ref={searchRef}>
              <div className="input-group">
                <input
                  className="form-control rounded-start px-3"
                  type="search"
                  placeholder="Search posts..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={() => {
                    if (searchQuery.length >= 3) {
                      setShowSuggestions(true);
                    }
                  }}
                />
                <button className="btn btn-primary px-3">
                  {isSearching ? (
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  ) : (
                    <i className="bi bi-search"></i>
                  )}
                </button>
              </div>
              {showSuggestions && suggestions.length > 0 && (
                  <div className="position-absolute top-100 start-0 end-0 mt-1" 
                       style={{ 
                         zIndex: 1055,
                         maxHeight: '400px',
                         overflowY: 'auto',
                         boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                       }}>
                    <ul className="list-group list-group-flush">
                      {suggestions.map((suggestion) => (
                        <li
                          key={suggestion._id}
                          className="list-group-item list-group-item-action border"
                          role="button"
                          onClick={() => handleSuggestionClick(suggestion)}
                        >
                          <div className="d-flex flex-column gap-1">
                            <div className="d-flex justify-content-between align-items-start">
                              <span className="fw-bold text-truncate pe-2">{suggestion.title}</span>
                              <small className="text-muted flex-shrink-0">
                                {new Date(suggestion.created_at).toLocaleDateString()}
                              </small>
                            </div>
                            <small className="text-muted text-truncate">
                              {suggestion.content.replace(/<[^>]*>/g, '').substring(0, 100)}...
                            </small>
                            {suggestion.categories && suggestion.categories.length > 0 && (
                              <div className="mt-1">
                                {suggestion.categories.map((category, idx) => (
                                  <span key={idx} className="badge bg-secondary me-1 small">
                                    {category}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
            </div>

            <div className="d-flex align-items-center gap-3 ms-auto">
              {isAuthenticated ? (
                <button className="btn btn-outline-danger rounded-pill px-4" onClick={handleLogout}>
                  <i className="bi bi-box-arrow-right me-2"></i>Logout
                </button>
              ) : (
                <button className="btn btn-primary rounded-pill px-4" onClick={() => setShowAuthModal(true)}>
                  <i className="bi bi-person-circle me-2"></i>Login
                </button>
              )}
              <div className="form-check form-switch d-flex align-items-center ms-2">
                <input
                  className="form-check-input me-2"
                  type="checkbox"
                  role="switch"
                  id="flexSwitchCheckDefault"
                  checked={isDarkMode}
                  onChange={toggleTheme}
                  style={{ cursor: 'pointer' }}
                />
                <i className={`bi ${isDarkMode ? 'bi-moon-stars-fill' : 'bi-sun-fill'}`}></i>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {showAuthModal && (
        <>
          <div className="modal-backdrop fade show" style={{ zIndex: 1040 }}></div>
          <div className="modal show d-block" style={{ zIndex: 1045 }} tabIndex={-1}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <ul className="nav nav-tabs card-header-tabs">
                    <li className="nav-item">
                      <button
                        className={`nav-link ${activeTab === 'login' ? 'active' : ''}`}
                        onClick={() => setActiveTab('login')}
                      >
                        Login
                      </button>
                    </li>
                    <li className="nav-item">
                      <button
                        className={`nav-link ${activeTab === 'signup' ? 'active' : ''}`}
                        onClick={() => setActiveTab('signup')}
                      >
                        Sign Up
                      </button>
                    </li>
                  </ul>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowAuthModal(false)}
                    aria-label="Close"
                  ></button>
                </div>
                <div className="modal-body">
                  {activeTab === 'login' ? (
                    <form onSubmit={handleLoginSubmit}>
                      {loginError && (
                        <div className="alert alert-danger">{loginError}</div>
                      )}
                      <div className="mb-3">
                        <label htmlFor="loginUsername" className="form-label">Username</label>
                        <input
                          type="text"
                          className="form-control"
                          id="loginUsername"
                          value={loginData.username}
                          onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label htmlFor="loginPassword" className="form-label">Password</label>
                        <div className="input-group">
                          <input 
                            type={showLoginPassword ? "text" : "password"} 
                            className="form-control" 
                            id="loginPassword" 
                            value={loginData.password}
                            onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                            required
                          />
                          <button
                            className="btn btn-outline-secondary"
                            type="button"
                            onClick={() => setShowLoginPassword(!showLoginPassword)}
                          >
                            <i className={`bi bi-eye${showLoginPassword ? '-slash' : ''}`}></i>
                          </button>
                        </div>
                      </div>
                      <button type="submit" className="btn btn-primary w-100">Login</button>
                    </form>
                  ) : (
                    <form onSubmit={handleSignupSubmit}>
                      {signupError && (
                        <div className="alert alert-danger">{signupError}</div>
                      )}
                      <div className="mb-3">
                        <label htmlFor="signupUsername" className="form-label">Username</label>
                        <input
                          type="text"
                          className="form-control"
                          id="signupUsername"
                          value={signupData.username}
                          onChange={(e) => setSignupData({ ...signupData, username: e.target.value })}
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label htmlFor="signupEmail" className="form-label">Email address</label>
                        <input
                          type="email"
                          className="form-control"
                          id="signupEmail"
                          value={signupData.email}
                          onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label htmlFor="signupPassword" className="form-label">Password</label>
                        <div className="input-group">
                          <input
                            type={showSignupPassword ? "text" : "password"}
                            className="form-control"
                            id="signupPassword"
                            value={signupData.password}
                            onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                            required
                          />
                          <button
                            className="btn btn-outline-secondary"
                            type="button"
                            onClick={() => setShowSignupPassword(!showSignupPassword)}
                          >
                            <i className={`bi bi-eye${showSignupPassword ? '-slash' : ''}`}></i>
                          </button>
                        </div>
                      </div>
                      <div className="mb-3">
                        <label htmlFor="signupConfirmPassword" className="form-label">Confirm Password</label>
                        <div className="input-group">
                          <input
                            type={showSignupConfirmPassword ? "text" : "password"}
                            className="form-control"
                            id="signupConfirmPassword"
                            value={signupData.confirmPassword}
                            onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                            required
                          />
                          <button
                            className="btn btn-outline-secondary"
                            type="button"
                            onClick={() => setShowSignupConfirmPassword(!showSignupConfirmPassword)}
                          >
                            <i className={`bi bi-eye${showSignupConfirmPassword ? '-slash' : ''}`}></i>
                          </button>
                        </div>
                      </div>
                      <button type="submit" className="btn btn-primary w-100">Sign Up</button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default Navbar;

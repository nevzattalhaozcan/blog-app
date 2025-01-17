import React, { useState, useEffect } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

interface PostModalProps {
  show: boolean;
  onClose: () => void;
  onSubmit: (postData: PostData) => void;
  initialData?: PostData;
  isEditMode?: boolean;
}

interface PostData {
  title: string;
  content: string;
  featured: boolean;
  categories: string[];
}

const modules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['blockquote', 'code-block'],
    ['link'],
    ['clean']
  ]
};

const formats = [
  'header',
  'bold', 'italic', 'underline', 'strike',
  'list', 'bullet', 'ordered',
  'link', 'blockquote', 'code-block'
];

const PostModal: React.FC<PostModalProps> = ({ show, onClose, onSubmit, initialData, isEditMode }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [featured, setFeatured] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setContent(initialData.content);
      setFeatured(initialData.featured);
      setCategories(initialData.categories);
    }
  }, [initialData]);

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    setCategories(selectedOptions);
  };

  const processContent = (htmlContent: string): string => {
    // Remove empty paragraphs
    let content = htmlContent.replace(/<p><br><\/p>/g, '<br>');
    // Extract text content and preserve <br> tags
    content = content.replace(/<p>(.*?)<\/p>/g, '$1<br>');
    // Remove the last <br> if it exists
    content = content.replace(/<br>$/, '');
    // Wrap everything in a single p tag
    return `<p>${content}</p>`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const processedContent = processContent(content);
    onSubmit({ title, content: processedContent, featured, categories });
  };

  return (
    <>
      {show && (
        <>
          <div className="modal-backdrop fade show" style={{ zIndex: 1040 }}></div>
          <div className="modal show d-block" style={{ zIndex: 1045 }} tabIndex={-1}>
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">{isEditMode ? 'Update Post' : 'Create New Post'}</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={onClose}
                  ></button>
                </div>
                <form onSubmit={handleSubmit}>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label htmlFor="post-title" className="form-label">Title</label>
                      <input
                        type="text"
                        className="form-control"
                        id="post-title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label htmlFor="post-category" className="form-label">Categories</label>
                      <select
                        className="form-select"
                        id="post-category"
                        multiple
                        value={categories}
                        onChange={handleCategoryChange}
                        required
                        size={5}
                        style={{ minHeight: '120px' }}
                      >
                        <option value="Technology">Technology</option>
                        <option value="Travel">Travel</option>
                        <option value="Health">Health</option>
                        <option value="Etymology">Etymology</option>
                        <option value="Self Improvement">Self Improvement</option>
                        <option value="Psychology">Psychology</option>
                        <option value="Philosophy">Philosophy</option>
                        <option value="Religion">Religion</option>
                        <option value="Sociology">Sociology</option>
                        <option value="Economics">Economics</option>
                        <option value="Politics">Politics</option>
                        <option value="Science">Science</option>
                        <option value="History">History</option>
                        <option value="Art">Art</option>
                        <option value="Music">Music</option>
                        <option value="Movies">Movies</option>
                        <option value="Literature">Literature</option>
                        <option value="Other">Other</option>
                      </select>
                      <div className="form-text">
                        <i className="bi bi-info-circle me-1"></i>
                        Hold Ctrl (Windows) or Command (Mac) to select multiple categories
                      </div>
                      <div className="mt-2">
                        Selected: {categories.length ? (
                          categories.map((cat, idx) => (
                            <span key={idx} className="badge bg-primary me-1">
                              {cat}
                            </span>
                          ))
                        ) : (
                          <span className="text-muted">No categories selected</span>
                        )}
                      </div>
                    </div>
                    <div className="mb-3">
                      <label htmlFor="post-content" className="form-label">Content</label>
                      <ReactQuill
                        theme="snow"
                        value={content}
                        onChange={(value) => setContent(value)}
                        modules={modules}
                        formats={formats}
                        style={{ 
                          height: '200px', 
                          marginBottom: '50px' 
                        }}
                        className="quill-editor"
                      />
                      <style>
                        {`
                          .quill-editor .ql-editor {
                            white-space: pre-wrap;
                            line-height: 1.42;
                          }
                          .quill-editor .ql-editor p {
                            margin: 0;
                            padding: 0;
                          }
                          .quill-editor .ql-editor p + p {
                            margin-top: 0.5em;
                          }
                        `}
                      </style>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={onClose}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      {isEditMode ? 'Save Changes' : 'Create Post'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default PostModal;

// src/components/BurstEditor.jsx

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Type,
  List,
  ListOrdered,
  Quote,
  Minus,
  Link2,
  Image as ImageIcon,
  Undo2,
  Redo2,
  RemoveFormatting,
  Eye,
  PenLine,
  Upload,
  X,
  Check,
  Clock,
  Sparkles,
} from 'lucide-react';
import { compressImageToDataURL, isValidImageSrc } from '../utils/imageUtils';
import Avatar from './Avatar';
import styles from './BurstEditor.module.css';

function calculateReadTime(text) {
  if (!text) return '1 min read';
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}

function BurstEditor({
  value = '',
  onChange,
  placeholder = 'Write your story here... Let your ideas burst into life.',
  title = '',
  authorName = 'Author',
  authorPhoto = '',
  authorId = '',
  category = '',
}) {
  const editorRef = useRef(null);
  const initialLoadedRef = useRef(false);
  const savedSelectionRef = useRef(null);
  const fileInputRef = useRef(null);

  const [activeTab, setActiveTab] = useState('write'); // 'write' | 'preview'
  const [activeStyles, setActiveStyles] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikeThrough: false,
    insertUnorderedList: false,
    insertOrderedList: false,
  });

  // Link Modal State
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');

  // Image Modal State
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [imageTab, setImageTab] = useState('upload'); // 'upload' | 'url'
  const [imageUrl, setImageUrl] = useState('');
  const [imageCaption, setImageCaption] = useState('');
  const [uploadedDataUrl, setUploadedDataUrl] = useState('');
  const [imageError, setImageError] = useState('');
  const [isCompressing, setIsCompressing] = useState(false);

  // Sync internal editor HTML to parent callback
  const syncContent = useCallback(() => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    if (onChange) {
      onChange(html);
    }
  }, [onChange]);

  // Set initial content once when editor mounts or value arrives initially
  useEffect(() => {
    if (!initialLoadedRef.current && editorRef.current && value) {
      editorRef.current.innerHTML = value;
      initialLoadedRef.current = true;
    }
  }, [value]);

  // If editor is empty on load, ensure it has initial state
  useEffect(() => {
    if (editorRef.current && !initialLoadedRef.current && !value) {
      initialLoadedRef.current = true;
    }
  }, [value]);

  // Update active formatting states for toolbar highlighting
  const updateActiveCommands = useCallback(() => {
    try {
      setActiveStyles({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        strikeThrough: document.queryCommandState('strikeThrough'),
        insertUnorderedList: document.queryCommandState('insertUnorderedList'),
        insertOrderedList: document.queryCommandState('insertOrderedList'),
      });
    } catch {
      // Ignore if document selection is unavailable
    }
  }, []);

  // Save current cursor / range selection before opening modals
  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedSelectionRef.current = sel.getRangeAt(0).cloneRange();
    } else {
      savedSelectionRef.current = null;
    }
  };

  // Restore cursor / range selection when modal confirms
  const restoreSelection = () => {
    if (savedSelectionRef.current && editorRef.current) {
      editorRef.current.focus();
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(savedSelectionRef.current);
      }
    } else if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  const insertNodeAtSelection = (node) => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      range.deleteContents();
      range.insertNode(node);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
      syncContent();
    } else if (editorRef.current) {
      editorRef.current.appendChild(node);
      syncContent();
    }
  };

  // Core formatting handler
  const executeCommand = (command, val = null) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand(command, false, val);
    syncContent();
    updateActiveCommands();
  };

  const handleFormatBlock = (tag) => {
    executeCommand('formatBlock', tag);
  };

  const handleInsertDivider = () => {
    executeCommand('insertHorizontalRule');
  };

  const handleInsertQuote = () => {
    executeCommand('formatBlock', 'blockquote');
  };

  const handleInsertCodeBlock = () => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    const sel = window.getSelection();
    const selectedText = sel ? sel.toString() : '';
    const pre = document.createElement('pre');
    pre.className = styles.codeBlock;
    const code = document.createElement('code');
    code.textContent = selectedText || 'console.log("Hello Burst!");';
    pre.appendChild(code);
    insertNodeAtSelection(pre);
  };

  // Link Modal Handlers
  const handleOpenLinkModal = () => {
    saveSelection();
    const sel = window.getSelection();
    const text = sel ? sel.toString() : '';
    setLinkText(text);
    setLinkUrl('');
    setIsLinkModalOpen(true);
  };

  const handleConfirmLink = (e) => {
    e.preventDefault();
    if (!linkUrl.trim()) return;
    restoreSelection();

    const formattedUrl = /^https?:\/\//i.test(linkUrl.trim())
      ? linkUrl.trim()
      : `https://${linkUrl.trim()}`;

    if (linkText.trim()) {
      const a = document.createElement('a');
      a.href = formattedUrl;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = linkText.trim();
      a.className = styles.editorLink;
      insertNodeAtSelection(a);
    } else {
      executeCommand('createLink', formattedUrl);
    }

    setIsLinkModalOpen(false);
    setLinkUrl('');
    setLinkText('');
  };

  // Image Modal Handlers
  const handleOpenImageModal = () => {
    saveSelection();
    setImageUrl('');
    setImageCaption('');
    setUploadedDataUrl('');
    setImageError('');
    setImageTab('upload');
    setIsImageModalOpen(true);
  };

  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageError('');
    setIsCompressing(true);
    try {
      const dataUrl = await compressImageToDataURL(file, {
        maxWidth: 1000,
        maxHeight: 700,
        quality: 0.82,
      });
      setUploadedDataUrl(dataUrl);
    } catch (err) {
      setImageError(err.message || 'Failed to process image file.');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleConfirmImage = (e) => {
    e.preventDefault();
    const finalSrc = imageTab === 'upload' ? uploadedDataUrl : imageUrl.trim();
    if (!finalSrc || !isValidImageSrc(finalSrc)) {
      setImageError('Please select or enter a valid image.');
      return;
    }

    restoreSelection();

    const figure = document.createElement('figure');
    figure.className = styles.imageFigure;

    const img = document.createElement('img');
    img.src = finalSrc;
    img.alt = imageCaption || 'Story illustration';
    img.className = styles.storyImage;
    figure.appendChild(img);

    if (imageCaption.trim()) {
      const figcaption = document.createElement('figcaption');
      figcaption.textContent = imageCaption.trim();
      figcaption.className = styles.imageCaption;
      figure.appendChild(figcaption);
    }

    const spacer = document.createElement('p');
    spacer.innerHTML = '<br>';

    insertNodeAtSelection(figure);
    insertNodeAtSelection(spacer);

    setIsImageModalOpen(false);
    setImageUrl('');
    setImageCaption('');
    setUploadedDataUrl('');
  };

  // Keyboard Shortcuts inside Editor
  const handleKeyDown = (e) => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const modifier = isMac ? e.metaKey : e.ctrlKey;

    if (modifier) {
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault();
          executeCommand('bold');
          break;
        case 'i':
          e.preventDefault();
          executeCommand('italic');
          break;
        case 'u':
          e.preventDefault();
          executeCommand('underline');
          break;
        case 'k':
          e.preventDefault();
          handleOpenLinkModal();
          break;
        case 'z':
          if (e.shiftKey) {
            e.preventDefault();
            executeCommand('redo');
          } else {
            e.preventDefault();
            executeCommand('undo');
          }
          break;
        case 'y':
          e.preventDefault();
          executeCommand('redo');
          break;
        default:
          break;
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      executeCommand('insertHTML', '&nbsp;&nbsp;&nbsp;&nbsp;');
    }
  };

  // Calculate live statistics
  const rawText = editorRef.current
    ? editorRef.current.innerText || editorRef.current.textContent || ''
    : value.replace(/<[^>]*>/g, ' ');

  const cleanWords = rawText.trim().split(/\s+/).filter(Boolean);
  const wordCount = cleanWords.length === 1 && cleanWords[0] === '' ? 0 : cleanWords.length;
  const charCount = rawText.replace(/\s/g, '').length;
  const readTime = calculateReadTime(rawText);

  return (
    <div className={styles.burstEditorWrapper}>
      {/* Studio Header Toolbar */}
      <header className={styles.studioHeader}>
        <div className={styles.brandingGroup}>
          <div className={styles.studioBadge}>
            <Sparkles size={14} className={styles.sparkleIcon} />
            <span>Burst Story Studio</span>
          </div>
        </div>

        {/* Mode Switcher: Write vs Preview */}
        <div className={styles.modeSwitcher} role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'write'}
            onClick={() => setActiveTab('write')}
            className={`${styles.modeButton} ${activeTab === 'write' ? styles.modeButtonActive : ''}`}
          >
            <PenLine size={15} />
            <span>Write</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'preview'}
            onClick={() => {
              syncContent();
              setActiveTab('preview');
            }}
            className={`${styles.modeButton} ${activeTab === 'preview' ? styles.modeButtonActive : ''}`}
          >
            <Eye size={15} />
            <span>Preview</span>
          </button>
        </div>
      </header>

      {/* Formatting Toolbar (Only active in 'Write' mode) */}
      {activeTab === 'write' && (
        <div className={styles.formattingToolbar} role="toolbar" aria-label="Formatting tools">
          {/* History Group */}
          <div className={styles.toolGroup}>
            <button
              type="button"
              onClick={() => executeCommand('undo')}
              className={styles.toolBtn}
              title="Undo (Ctrl+Z)"
              aria-label="Undo"
            >
              <Undo2 size={16} />
            </button>
            <button
              type="button"
              onClick={() => executeCommand('redo')}
              className={styles.toolBtn}
              title="Redo (Ctrl+Y)"
              aria-label="Redo"
            >
              <Redo2 size={16} />
            </button>
          </div>

          <div className={styles.separator} />

          {/* Heading Selector */}
          <div className={styles.toolGroup}>
            <button
              type="button"
              onClick={() => handleFormatBlock('p')}
              className={styles.toolBtn}
              title="Normal text"
              aria-label="Paragraph"
            >
              <Type size={16} />
            </button>
            <button
              type="button"
              onClick={() => handleFormatBlock('h1')}
              className={styles.toolBtn}
              title="Heading 1"
              aria-label="Heading 1"
            >
              <Heading1 size={17} />
            </button>
            <button
              type="button"
              onClick={() => handleFormatBlock('h2')}
              className={styles.toolBtn}
              title="Heading 2"
              aria-label="Heading 2"
            >
              <Heading2 size={17} />
            </button>
            <button
              type="button"
              onClick={() => handleFormatBlock('h3')}
              className={styles.toolBtn}
              title="Heading 3"
              aria-label="Heading 3"
            >
              <Heading3 size={17} />
            </button>
          </div>

          <div className={styles.separator} />

          {/* Inline Text Formatting */}
          <div className={styles.toolGroup}>
            <button
              type="button"
              onClick={() => executeCommand('bold')}
              className={`${styles.toolBtn} ${activeStyles.bold ? styles.toolBtnActive : ''}`}
              title="Bold (Ctrl+B)"
              aria-label="Bold"
            >
              <Bold size={16} />
            </button>
            <button
              type="button"
              onClick={() => executeCommand('italic')}
              className={`${styles.toolBtn} ${activeStyles.italic ? styles.toolBtnActive : ''}`}
              title="Italic (Ctrl+I)"
              aria-label="Italic"
            >
              <Italic size={16} />
            </button>
            <button
              type="button"
              onClick={() => executeCommand('underline')}
              className={`${styles.toolBtn} ${activeStyles.underline ? styles.toolBtnActive : ''}`}
              title="Underline (Ctrl+U)"
              aria-label="Underline"
            >
              <Underline size={16} />
            </button>
            <button
              type="button"
              onClick={() => executeCommand('strikeThrough')}
              className={`${styles.toolBtn} ${activeStyles.strikeThrough ? styles.toolBtnActive : ''}`}
              title="Strikethrough"
              aria-label="Strikethrough"
            >
              <Strikethrough size={16} />
            </button>
            <button
              type="button"
              onClick={() => executeCommand('removeFormat')}
              className={styles.toolBtn}
              title="Clear formatting"
              aria-label="Clear formatting"
            >
              <RemoveFormatting size={16} />
            </button>
          </div>

          <div className={styles.separator} />

          {/* Lists & Quotes */}
          <div className={styles.toolGroup}>
            <button
              type="button"
              onClick={() => executeCommand('insertUnorderedList')}
              className={`${styles.toolBtn} ${activeStyles.insertUnorderedList ? styles.toolBtnActive : ''}`}
              title="Bullet list"
              aria-label="Bullet list"
            >
              <List size={16} />
            </button>
            <button
              type="button"
              onClick={() => executeCommand('insertOrderedList')}
              className={`${styles.toolBtn} ${activeStyles.insertOrderedList ? styles.toolBtnActive : ''}`}
              title="Numbered list"
              aria-label="Numbered list"
            >
              <ListOrdered size={16} />
            </button>
            <button
              type="button"
              onClick={handleInsertQuote}
              className={styles.toolBtn}
              title="Quote block"
              aria-label="Quote"
            >
              <Quote size={16} />
            </button>
            <button
              type="button"
              onClick={handleInsertCodeBlock}
              className={styles.toolBtn}
              title="Code snippet"
              aria-label="Code block"
            >
              <Code size={16} />
            </button>
            <button
              type="button"
              onClick={handleInsertDivider}
              className={styles.toolBtn}
              title="Horizontal divider"
              aria-label="Horizontal rule"
            >
              <Minus size={16} />
            </button>
          </div>

          <div className={styles.separator} />

          {/* Rich Media Inserts */}
          <div className={styles.toolGroup}>
            <button
              type="button"
              onClick={handleOpenLinkModal}
              className={styles.toolBtn}
              title="Insert Link (Ctrl+K)"
              aria-label="Insert Link"
            >
              <Link2 size={16} />
            </button>
            <button
              type="button"
              onClick={handleOpenImageModal}
              className={styles.toolBtn}
              title="Insert Image (Upload or URL)"
              aria-label="Insert Image"
            >
              <ImageIcon size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Editor Main Canvas */}
      <div className={styles.editorContainer}>
        {activeTab === 'write' ? (
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={syncContent}
            onKeyUp={updateActiveCommands}
            onMouseUp={updateActiveCommands}
            onSelect={updateActiveCommands}
            onKeyDown={handleKeyDown}
            data-placeholder={placeholder}
            className={styles.editorArea}
            role="textbox"
            aria-multiline="true"
            aria-label="Story content"
          />
        ) : (
          /* Live Authentic Preview Mode */
          <div className={styles.previewContainer}>
            <header className={styles.previewHeader}>
              {category && <span className={styles.previewCategory}>{category}</span>}
              <h1 className={styles.previewTitle}>{title || 'Untitled Story'}</h1>
              <div className={styles.previewAuthorRow}>
                <Avatar userId={authorId} src={authorPhoto} name={authorName} size="md" />
                <div className={styles.previewAuthorMeta}>
                  <p className={styles.previewAuthorName}>{authorName}</p>
                  <div className={styles.previewStatsRow}>
                    <span>Today</span>
                    <span>•</span>
                    <span className={styles.previewReadTime}>
                      <Clock size={12} />
                      {readTime}
                    </span>
                  </div>
                </div>
              </div>
            </header>
            <div
              className={styles.previewContent}
              dangerouslySetInnerHTML={{
                __html:
                  editorRef.current?.innerHTML ||
                  value ||
                  '<p style="color:var(--text-muted);font-style:italic;">No story content yet. Switch to Write mode to craft your story!</p>',
              }}
            />
          </div>
        )}
      </div>

      {/* Studio Live Footer Metrics */}
      <footer className={styles.studioFooter}>
        <div className={styles.metricTags}>
          <span className={styles.metricPill}>
            <strong>{wordCount}</strong> {wordCount === 1 ? 'word' : 'words'}
          </span>
          <span className={styles.metricPill}>
            <strong>{charCount}</strong> characters
          </span>
          <span className={styles.metricPill}>
            <Clock size={12} />
            {readTime}
          </span>
        </div>
        <div className={styles.autoSavedNotice}>
          <Check size={13} className={styles.checkIcon} />
          <span>Native Burst Studio Active</span>
        </div>
      </footer>

      {/* In-App Link Insertion Modal */}
      {isLinkModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsLinkModalOpen(false)}>
          <div
            className={styles.modalCard}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="link-modal-title"
          >
            <div className={styles.modalHeader}>
              <h3 id="link-modal-title">Insert Hyperlink</h3>
              <button
                type="button"
                onClick={() => setIsLinkModalOpen(false)}
                className={styles.modalCloseBtn}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleConfirmLink} className={styles.modalForm}>
              <div className={styles.modalField}>
                <label htmlFor="link-url-input">Link URL</label>
                <input
                  id="link-url-input"
                  type="text"
                  placeholder="https://example.com/article"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  autoFocus
                  required
                  className={styles.modalInput}
                />
              </div>
              <div className={styles.modalField}>
                <label htmlFor="link-text-input">Display Text (Optional)</label>
                <input
                  id="link-text-input"
                  type="text"
                  placeholder="e.g., Read documentation"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  className={styles.modalInput}
                />
              </div>
              <div className={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => setIsLinkModalOpen(false)}
                  className={styles.modalCancelBtn}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.modalSubmitBtn}>
                  Apply Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* In-App Image Insertion Modal */}
      {isImageModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsImageModalOpen(false)}>
          <div
            className={styles.modalCard}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="image-modal-title"
          >
            <div className={styles.modalHeader}>
              <h3 id="image-modal-title">Insert Story Visual</h3>
              <button
                type="button"
                onClick={() => setIsImageModalOpen(false)}
                className={styles.modalCloseBtn}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className={styles.modalTabSwitcher}>
              <button
                type="button"
                onClick={() => setImageTab('upload')}
                className={`${styles.modalTabBtn} ${imageTab === 'upload' ? styles.modalTabBtnActive : ''}`}
              >
                <Upload size={14} />
                <span>Upload from Device</span>
              </button>
              <button
                type="button"
                onClick={() => setImageTab('url')}
                className={`${styles.modalTabBtn} ${imageTab === 'url' ? styles.modalTabBtnActive : ''}`}
              >
                <Link2 size={14} />
                <span>Image Web URL</span>
              </button>
            </div>

            <form onSubmit={handleConfirmImage} className={styles.modalForm}>
              {imageTab === 'upload' ? (
                <div className={styles.uploadBox}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    style={{ display: 'none' }}
                  />
                  {uploadedDataUrl ? (
                    <div className={styles.uploadPreview}>
                      <img src={uploadedDataUrl} alt="Upload preview" className={styles.previewThumb} />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className={styles.changeImageBtn}
                      >
                        Change Photo
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className={styles.dropZone}
                      disabled={isCompressing}
                    >
                      <Upload size={32} className={styles.dropZoneIcon} />
                      <p className={styles.dropZonePrimary}>
                        {isCompressing ? 'Optimizing image...' : 'Click to select an image from your device'}
                      </p>
                      <p className={styles.dropZoneSecondary}>
                        PNG, JPG, WebP. Automatically optimized for lightning-fast reading.
                      </p>
                    </button>
                  )}
                </div>
              ) : (
                <div className={styles.modalField}>
                  <label htmlFor="image-url-input">Image URL</label>
                  <input
                    id="image-url-input"
                    type="url"
                    placeholder="https://images.unsplash.com/photo-..."
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    autoFocus
                    className={styles.modalInput}
                  />
                </div>
              )}

              <div className={styles.modalField}>
                <label htmlFor="image-caption-input">Caption / Alt Text (Optional)</label>
                <input
                  id="image-caption-input"
                  type="text"
                  placeholder="Describe this visual or credit the photographer"
                  value={imageCaption}
                  onChange={(e) => setImageCaption(e.target.value)}
                  className={styles.modalInput}
                />
              </div>

              {imageError && <p className={styles.modalError}>{imageError}</p>}

              <div className={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => setIsImageModalOpen(false)}
                  className={styles.modalCancelBtn}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    isCompressing || (imageTab === 'upload' ? !uploadedDataUrl : !imageUrl.trim())
                  }
                  className={styles.modalSubmitBtn}
                >
                  Insert Image
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default BurstEditor;

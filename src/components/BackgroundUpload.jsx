import { useState, useRef, useEffect } from 'react';

const STORAGE_KEY = 'gfm_bgImage';
const MAX_SIZE_MB = 5;

function applyBackground(dataUrl) {
  if (dataUrl) {
    document.documentElement.style.setProperty('--user-bg', `url("${dataUrl}")`);
    document.documentElement.setAttribute('data-custom-bg', 'true');
  } else {
    document.documentElement.style.removeProperty('--user-bg');
    document.documentElement.removeAttribute('data-custom-bg');
  }
}

// Apply saved background on first load
const savedBg = localStorage.getItem(STORAGE_KEY);
if (savedBg) applyBackground(savedBg);

export default function BackgroundUpload() {
  const [preview, setPreview] = useState(() => localStorage.getItem(STORAGE_KEY) || '');
  const fileRef = useRef(null);

  useEffect(() => {
    applyBackground(preview || null);
  }, [preview]);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (JPG, PNG, etc.).');
      return;
    }

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      alert(`Image must be under ${MAX_SIZE_MB}MB.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      try {
        localStorage.setItem(STORAGE_KEY, dataUrl);
        setPreview(dataUrl);
      } catch {
        alert('Image is too large to save in browser storage. Try a smaller image.');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = () => {
    localStorage.removeItem(STORAGE_KEY);
    setPreview('');
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="bg-upload">
      {preview ? (
        <div className="bg-upload-preview">
          <img src={preview} alt="Background preview" className="bg-upload-thumb" />
          <div className="bg-upload-actions">
            <button className="btn btn-outline btn-sm" onClick={() => fileRef.current?.click()}>
              Change
            </button>
            <button className="btn btn-danger btn-sm" onClick={handleRemove}>
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button className="bg-upload-btn" onClick={() => fileRef.current?.click()}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          <span>Upload Background Image</span>
        </button>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        style={{ display: 'none' }}
      />
      <p className="bg-upload-hint">Best results: 1920x1080 or larger, JPG or PNG</p>
    </div>
  );
}

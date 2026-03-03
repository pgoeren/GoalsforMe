import { useState, useEffect, useRef, useCallback } from 'react';
import { inspirationVideos, speakerColors } from '../data/inspirationVideos';

const CATEGORIES = ['All', 'Mindset', 'Goals', 'Discipline', 'Action', 'Planning'];
const BATCH = 8;

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function VideoCard({ video, onSelect }) {
  const [thumbFailed, setThumbFailed] = useState(false);
  const colorClass = speakerColors[video.speaker] || 'speaker-tony';

  return (
    <article className="video-card">
      <button className="video-card-btn" onClick={() => onSelect(video)}>
        <div className="video-thumb-wrap">
          {thumbFailed ? (
            <div className="video-thumb-fallback">
              <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" strokeWidth="1.5">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </div>
          ) : (
            <img
              className="video-thumb"
              src={`https://img.youtube.com/vi/${video.id}/mqdefault.jpg`}
              alt={video.title}
              loading="lazy"
              onError={() => setThumbFailed(true)}
            />
          )}
          <div className="video-play-overlay" aria-hidden="true">
            <div className="video-play-btn">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <polygon points="6 4 20 12 6 20 6 4" />
              </svg>
            </div>
          </div>
        </div>
        <div className="video-card-body">
          <span className={`video-speaker-chip ${colorClass}`}>{video.speaker}</span>
          <p className="video-title">{video.title}</p>
          <p className="video-meta">
            <span>{video.category.charAt(0).toUpperCase() + video.category.slice(1)}</span>
            <span className="video-dot">·</span>
            <span>{video.duration}</span>
          </p>
        </div>
      </button>
    </article>
  );
}

function VideoModal({ video, onClose }) {
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className="video-modal-backdrop" onClick={onClose}>
      <div className="video-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="video-modal-close" onClick={onClose} aria-label="Close">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <div className="video-modal-frame">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&rel=0`}
            title={video.title}
            allow="autoplay; encrypted-media; fullscreen"
            allowFullScreen
          />
        </div>
        <div className="video-modal-info">
          <p className="video-modal-title">{video.title}</p>
          <p className="video-modal-speaker">{video.speaker}</p>
        </div>
      </div>
    </div>
  );
}

export default function Inspiration() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [shuffled, setShuffled] = useState([]);
  const [visibleCount, setVisibleCount] = useState(BATCH);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const sentinelRef = useRef(null);

  // Build filtered + shuffled list whenever category changes
  useEffect(() => {
    const filtered =
      activeCategory === 'All'
        ? [...inspirationVideos]
        : inspirationVideos.filter(
            (v) => v.category === activeCategory.toLowerCase()
          );
    setShuffled(shuffleArray(filtered));
    setVisibleCount(BATCH);
  }, [activeCategory]);

  // IntersectionObserver: load next batch when sentinel enters view
  const loadMore = useCallback(() => {
    setVisibleCount((n) => {
      if (n >= shuffled.length) {
        // Re-shuffle and start over for the endless feel
        setShuffled((prev) => shuffleArray(prev));
        return BATCH;
      }
      return n + BATCH;
    });
  }, [shuffled.length]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadMore(); },
      { rootMargin: '300px' }
    );
    obs.observe(sentinel);
    return () => obs.disconnect();
  }, [loadMore]);

  const visible = shuffled.slice(0, visibleCount);

  return (
    <div className="inspire-page">
      {/* Hero */}
      <div className="inspire-hero">
        <h1 className="inspire-title">Inspire</h1>
        <p className="inspire-tagline">Fuel your goals with the right voices.</p>
      </div>

      {/* Category filters */}
      <div className="inspire-filters">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`inspire-filter-btn${activeCategory === cat ? ' active' : ''}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Video feed */}
      <div className="inspire-feed">
        {visible.length === 0 ? (
          <p className="inspire-empty">No videos in this category yet.</p>
        ) : (
          visible.map((video, i) => (
            <VideoCard key={`${video.id}-${i}`} video={video} onSelect={setSelectedVideo} />
          ))
        )}
        <div ref={sentinelRef} className="inspire-sentinel" />
      </div>

      {/* Video modal */}
      {selectedVideo && (
        <VideoModal video={selectedVideo} onClose={() => setSelectedVideo(null)} />
      )}
    </div>
  );
}

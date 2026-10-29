import React, { useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { getYoutubeEmbedUrl } from '../utils/youtube';

const YouTubeIcon = ({ size = 20, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    style={{ display: 'inline-block', verticalAlign: 'middle' }}
  >
    <path
      fill="#FF0000"
      d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.5 12 3.5 12 3.5s-7.505 0-9.377.55a3.016 3.016 0 0 0-2.122 2.136C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.55 9.376.55 9.376.55s7.505 0 9.377-.55a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z"
    />
    <path fill="#FFFFFF" d="M9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

const TrailerModal = ({ isOpen, onClose, trailerUrl, movieTitle = 'Movie' }) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    // Lock body scroll while modal is active
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const embedUrl = getYoutubeEmbedUrl(trailerUrl);

  return (
    <div
      className="trailer-modal-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1060,
        backgroundColor: 'rgba(10, 15, 30, 0.85)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="trailer-modal-title"
    >
      <div
        className="trailer-modal-dialog"
        style={{
          width: '100%',
          maxWidth: '880px',
          backgroundColor: '#0f172a',
          borderRadius: '16px',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(255, 255, 255, 0.1)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          animation: 'scaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          className="d-flex align-items-center justify-content-between px-3 py-3 px-md-4 border-bottom"
          style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}
        >
          <div className="d-flex align-items-center gap-2 overflow-hidden me-2">
            <YouTubeIcon size={22} />
            <h5
              id="trailer-modal-title"
              className="text-white fw-bold mb-0 text-truncate"
              style={{ fontSize: '1.05rem' }}
            >
              {movieTitle} — Official Trailer
            </h5>
          </div>

          <button
            type="button"
            className="btn btn-icon text-light rounded-circle p-1 d-flex align-items-center justify-content-center"
            style={{
              width: '36px',
              height: '36px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onClick={onClose}
            aria-label="Close trailer dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body / 16:9 Video Player */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            aspectRatio: '16 / 9',
            backgroundColor: '#000000',
          }}
        >
          {embedUrl ? (
            <iframe
              src={embedUrl}
              title={`${movieTitle} Official Trailer`}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                border: 0,
              }}
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div
              className="d-flex flex-column align-items-center justify-content-center text-center p-4 h-100"
              style={{ color: '#94a3b8' }}
            >
              <AlertCircle size={44} className="text-warning mb-3" />
              <h5 className="text-white fw-bold mb-2">Trailer is currently unavailable.</h5>
              <p className="small mb-4" style={{ maxWidth: '420px' }}>
                We could not locate an official trailer stream for this title. Please check back later.
              </p>
              <button
                type="button"
                className="btn btn-sm btn-outline-light px-3"
                onClick={onClose}
              >
                Close Window
              </button>
            </div>
          )}
        </div>

        {/* Footer info note */}
        <div
          className="d-flex align-items-center justify-content-between px-3 py-2 px-md-4 text-muted small"
          style={{
            backgroundColor: '#090d16',
            fontSize: '0.78rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          <span>Official Studio Preview</span>
          <span>Press ESC or tap outside to close</span>
        </div>
      </div>
    </div>
  );
};

export { YouTubeIcon };
export default TrailerModal;


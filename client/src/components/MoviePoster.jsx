import React, { useState } from 'react';
import { Film } from 'lucide-react';

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

/**
 * Resolve poster URL correctly:
 * - /uploads/... -> http://localhost:5001/uploads/...
 * - /<tmdb_path>.jpg -> https://image.tmdb.org/t/p/w500/<tmdb_path>.jpg
 * - full http/https url -> untouched
 */
export const resolvePosterUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('/uploads')) {
    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';
    const serverHost = apiBase.replace(/\/api\/?$/, '');
    return `${serverHost}${trimmed}`;
  }
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return `${TMDB_IMAGE_BASE}${trimmed}`;
  }
  return trimmed;
};

const MoviePoster = ({
  src,
  title = 'Movie',
  genre,
  language,
  className = '',
  style = {},
  aspectRatio = '2 / 3',
  hoverLift = false,
  rounded = 'rounded-3',
  alt,
}) => {
  const [imageError, setImageError] = useState(false);
  const resolvedSrc = resolvePosterUrl(src);

  // Genre display text
  const genreText = Array.isArray(genre)
    ? genre.slice(0, 2).join(' / ')
    : typeof genre === 'string'
    ? genre.split(',').slice(0, 2).join(' / ').trim()
    : '';

  const subtitle = genreText || language || 'IMovies Exclusive';

  // If source is missing, or image failed to load, render the graceful navy fallback poster
  if (!resolvedSrc || imageError) {
    return (
      <div
        className={`movie-poster-fallback ${rounded} ${hoverLift ? 'poster-hover-lift' : ''} ${className}`}
        style={{
          aspectRatio,
          background: 'linear-gradient(150deg, #091322 0%, #0f1d35 60%, #080d18 100%)',
          color: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '1.25rem 1rem',
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
          ...style,
        }}
        role="img"
        aria-label={alt || title}
      >
        {/* Subtle decorative glow circle in background */}
        <div
          style={{
            position: 'absolute',
            top: '-20%',
            right: '-20%',
            width: '140px',
            height: '140px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(229, 9, 20, 0.25) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        {/* Small IMovies label */}
        <div className="d-flex align-items-center justify-content-between z-1">
          <span
            className="badge bg-danger text-uppercase px-2 py-1 fw-bold"
            style={{
              fontSize: '0.65rem',
              letterSpacing: '1px',
              boxShadow: '0 2px 6px rgba(229, 9, 20, 0.4)',
            }}
          >
            IMovies
          </span>
          <Film size={14} className="text-secondary opacity-75" />
        </div>

        {/* Center: Film Icon + Movie Title */}
        <div className="text-center my-auto py-2 z-1">
          <div
            className="mx-auto mb-2 d-flex align-items-center justify-content-center rounded-circle"
            style={{
              width: '42px',
              height: '42px',
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <Film size={20} className="text-danger" />
          </div>
          <h6
            className="fw-bold mb-1 text-white text-truncate-2"
            style={{
              fontSize: '0.92rem',
              lineHeight: 1.3,
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.6)',
            }}
            title={title}
          >
            {title}
          </h6>
        </div>

        {/* Bottom: Genre or Language */}
        <div className="text-center z-1">
          <span
            className="badge rounded-pill text-truncate px-2 py-1"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              color: '#cbd5e1',
              fontSize: '0.68rem',
              maxWidth: '100%',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            {subtitle}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`movie-poster-wrapper ${rounded} ${hoverLift ? 'poster-hover-lift' : ''} ${className}`}
      style={{
        aspectRatio,
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: '#091322',
        ...style,
      }}
    >
      <img
        src={resolvedSrc}
        alt={alt || title}
        className="w-100 h-100"
        style={{
          objectFit: 'cover',
          display: 'block',
          transition: 'transform 0.35s ease',
        }}
        onError={() => setImageError(true)}
        loading="lazy"
      />
    </div>
  );
};

export default MoviePoster;


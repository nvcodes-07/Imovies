import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Clock } from 'lucide-react';
import MoviePoster from './MoviePoster';
import { formatRuntime } from '../utils/formatRuntime';

const MovieCard = ({ movie }) => {
  if (!movie) return null;

  const genres = movie.genres || movie.genre || [];
  const runtimeDisplay = formatRuntime(movie.runtimeMinutes || movie.duration);

  return (
    <div className="movie-card">
      <div className="movie-poster-container position-relative">
        <MoviePoster
          src={movie.posterUrl}
          title={movie.title}
          genre={genres}
          language={movie.language}
          aspectRatio="2 / 3"
          rounded="rounded-top-3"
          alt={movie.title}
        />
        {movie.rating && (
          <div className="movie-rating-badge">
            <Star size={13} fill="#FFC107" color="#FFC107" />
            <span>{movie.rating.toFixed(1)}</span>
          </div>
        )}
        {movie.certification && (
          <div
            className="position-absolute bottom-0 start-0 m-2 badge bg-dark bg-opacity-75 text-white border border-secondary"
            style={{ fontSize: '0.68rem', letterSpacing: '0.5px' }}
          >
            {movie.certification}
          </div>
        )}
      </div>

      <div className="p-3 d-flex flex-column flex-grow-1 justify-content-between">
        <div>
          <h6 className="fw-bold text-truncate mb-1" title={movie.title}>
            {movie.title}
          </h6>

          <div className="d-flex align-items-center gap-2 mb-2 text-muted small">
            <span>{movie.language}</span>
            {runtimeDisplay && (
              <>
                <span>•</span>
                <span className="d-flex align-items-center gap-1">
                  <Clock size={12} />
                  {runtimeDisplay}
                </span>
              </>
            )}
          </div>

          <div className="d-flex flex-wrap gap-1 mb-3">
            {genres.slice(0, 2).map((g, idx) => (
              <span
                key={idx}
                className="badge bg-light text-secondary border fw-normal"
                style={{ fontSize: '0.72rem' }}
              >
                {g}
              </span>
            ))}
          </div>
        </div>

        <Link
          to={`/movies/${movie._id}`}
          className="btn btn-sm btn-cinema w-100 text-center"
        >
          {movie.status === 'coming_soon' ? 'View Details' : 'Book Tickets'}
        </Link>
      </div>
    </div>
  );
};

export default MovieCard;

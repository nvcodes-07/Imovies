import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setActiveShow } from '../redux/slices/bookingSlice';
import api from '../api/axios';
import LoadingSpinner from '../components/LoadingSpinner';
import MoviePoster from '../components/MoviePoster';
import TrailerModal, { YouTubeIcon } from '../components/TrailerModal';
import { formatRuntime } from '../utils/formatRuntime';
import { isValidYouTubeUrl } from '../utils/youtube';
import { Star, Clock, Calendar, MapPin, User, Ticket, Award, Film, Clapperboard } from 'lucide-react';

const MovieDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [movie, setMovie] = useState(null);
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');
  const [availableDates, setAvailableDates] = useState([]);
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);

  useEffect(() => {
    fetchMovieDetails();
  }, [id]);

  const fetchMovieDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/movies/${id}`);
      if (res.data.success) {
        setMovie(res.data.movie);
        setShows(res.data.shows || []);

        const uniqueDates = Array.from(
          new Set((res.data.shows || []).map((s) => s.showDate))
        ).sort();

        setAvailableDates(uniqueDates);
        if (uniqueDates.length > 0) {
          setSelectedDate(uniqueDates[0]);
        } else {
          setSelectedDate(new Date().toISOString().split('T')[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load movie details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectShowtime = (show) => {
    dispatch(
      setActiveShow({
        ...show,
        movie,
      })
    );
    navigate(`/shows/${show._id}/seats`);
  };

  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T00:00:00');
    const day = date.toLocaleDateString('en-US', { weekday: 'short' });
    const dayNum = date.getDate();
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    return { day, dayNum, month };
  };

  if (loading) {
    return <LoadingSpinner message="Loading movie details and cinema showtimes..." />;
  }

  if (!movie) {
    return (
      <div className="container py-5 text-center">
        <h4 className="fw-bold">Movie Not Found</h4>
        <p className="text-muted">The requested cinema title could not be found or has been archived.</p>
        <Link to="/movies" className="btn btn-sm btn-cinema mt-3">
          Back to Catalog
        </Link>
      </div>
    );
  }

  const genres = movie.genres || movie.genre || [];
  const runtimeText = formatRuntime(movie.runtimeMinutes || movie.duration);
  const synopsisText = movie.synopsis || movie.description;
  const hasValidTrailer = Boolean(movie.trailerUrl && isValidYouTubeUrl(movie.trailerUrl));

  // Group shows on the selected date by theatre
  const showsOnSelectedDate = shows.filter((s) => s.showDate === selectedDate);
  const showsByTheatre = {};
  showsOnSelectedDate.forEach((s) => {
    const theatreId = s.theatreId?._id || 'unknown';
    if (!showsByTheatre[theatreId]) {
      showsByTheatre[theatreId] = {
        theatre: s.theatreId,
        shows: [],
      };
    }
    showsByTheatre[theatreId].shows.push(s);
  });

  return (
    <div>
      {/* Backdrop Hero Header */}
      <div
        className="position-relative text-white py-4 py-md-5"
        style={{
          background: `linear-gradient(180deg, rgba(10, 15, 30, 0.90) 0%, rgba(15, 23, 42, 0.96) 100%), url(${
            movie.backdropUrl || movie.posterUrl
          }) center/cover no-repeat`,
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div className="container">
          <div className="row g-4 align-items-center">
            {/* Desktop: Poster on Left / Mobile: Poster on Top */}
            <div className="col-12 col-md-4 col-lg-3 text-center text-md-start">
              <div
                className="mx-auto mx-md-0 shadow-lg"
                style={{ maxWidth: '280px' }}
              >
                <MoviePoster
                  src={movie.posterUrl}
                  title={movie.title}
                  genre={genres}
                  language={movie.language}
                  aspectRatio="2 / 3"
                  rounded="rounded-3"
                  hoverLift={true}
                  alt={movie.title}
                />
              </div>
            </div>

            {/* Movie Info Main Section */}
            <div className="col-12 col-md-8 col-lg-9">
              {/* Badges row: Status, Certification, Language, Rating */}
              <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
                <span
                  className={`badge text-uppercase px-2 py-1 fw-bold ${
                    movie.status === 'coming_soon' ? 'bg-primary' : 'bg-danger'
                  }`}
                  style={{ letterSpacing: '0.5px' }}
                >
                  {movie.status === 'coming_soon' ? 'Coming Soon' : 'Now Showing'}
                </span>

                {movie.certification && (
                  <span
                    className="badge bg-dark bg-opacity-75 text-light border border-secondary px-2 py-1 fw-semibold d-inline-flex align-items-center gap-1"
                    title={`Certification: ${movie.certification}`}
                  >
                    <Award size={12} className="text-warning" />
                    <span>{movie.certification}</span>
                  </span>
                )}

                <span className="badge bg-light text-dark fw-semibold px-2 py-1">
                  {movie.language}
                </span>

                {movie.rating && (
                  <span className="badge bg-warning text-dark d-flex align-items-center gap-1 px-2 py-1">
                    <Star size={13} fill="#000" />
                    <strong>{movie.rating.toFixed(1)}/10</strong>
                  </span>
                )}
              </div>

              {/* Movie Title */}
              <h1 className="display-6 fw-bold mb-2 text-white">
                {movie.title}
              </h1>

              {/* Metadata Info Row: Runtime, Release Date, Director */}
              <div className="d-flex flex-wrap align-items-center gap-3 text-light small mb-3 opacity-90">
                {runtimeText && (
                  <span className="d-flex align-items-center gap-1">
                    <Clock size={14} className="text-danger" />
                    <span>{runtimeText}</span>
                  </span>
                )}

                {runtimeText && movie.releaseDate && <span>•</span>}

                {movie.releaseDate && (
                  <span className="d-flex align-items-center gap-1">
                    <Calendar size={14} className="text-danger" />
                    <span>
                      {new Date(movie.releaseDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </span>
                )}

                {movie.director && (
                  <>
                    <span>•</span>
                    <span className="d-flex align-items-center gap-1">
                      <Clapperboard size={14} className="text-danger" />
                      <span>Dir. {movie.director}</span>
                    </span>
                  </>
                )}
              </div>

              {/* Genre Pills */}
              <div className="d-flex flex-wrap gap-1 mb-3">
                {genres.map((g, idx) => (
                  <span
                    key={idx}
                    className="badge bg-secondary bg-opacity-50 text-light fw-normal border border-secondary px-2 py-1"
                    style={{ fontSize: '0.78rem' }}
                  >
                    {g}
                  </span>
                ))}
              </div>

              {/* Movie Synopsis */}
              {synopsisText && (
                <p
                  className="text-light mb-4"
                  style={{
                    fontSize: '0.94rem',
                    lineHeight: '1.6',
                    maxWidth: '820px',
                    color: '#e2e8f0',
                  }}
                >
                  {synopsisText}
                </p>
              )}

              {/* Actions row: Watch Trailer + Book Tickets */}
              <div className="d-flex flex-wrap align-items-center gap-3 pt-1">
                {/* Watch Trailer Button */}
                {hasValidTrailer && (
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-light d-inline-flex align-items-center gap-2 px-3 py-2 fw-semibold"
                    onClick={() => setIsTrailerOpen(true)}
                    style={{
                      borderRadius: '8px',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.25)',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <YouTubeIcon size={18} />
                    <span>Watch trailer</span>
                  </button>
                )}

                {/* Booking Jump Action */}
                {movie.status !== 'coming_soon' ? (
                  <a
                    href="#booking-section"
                    className="btn btn-sm btn-cinema d-inline-flex align-items-center gap-2 px-3 py-2 fw-semibold"
                    style={{ borderRadius: '8px' }}
                  >
                    <Ticket size={16} />
                    <span>Book Tickets</span>
                  </a>
                ) : (
                  <span className="text-muted small d-inline-flex align-items-center gap-1">
                    <Calendar size={14} />
                    Advance bookings will open soon
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area: Showtimes & Cast */}
      <div className="container py-5" id="booking-section">
        <div className="row g-4">
          {/* Main Column: Show Date & Time Selection */}
          <div className="col-12 col-lg-8">
            <div className="bg-white p-4 rounded-3 border mb-4 shadow-sm">
              <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
                <h4 className="fw-bold mb-0">Select Show Date & Time</h4>
                {selectedDate && (
                  <span className="text-muted small">
                    Showing available screens for {selectedDate}
                  </span>
                )}
              </div>

              {/* Date Selector Tabs */}
              {availableDates.length === 0 ? (
                <div className="p-4 text-center text-muted bg-light rounded-3 border">
                  <p className="mb-0">
                    No scheduled showtimes available for this title right now. Please check back soon or browse another movie.
                  </p>
                </div>
              ) : (
                <div className="d-flex gap-2 overflow-auto pb-2 mb-4 border-bottom">
                  {availableDates.map((dateStr) => {
                    const { day, dayNum, month } = formatDateDisplay(dateStr);
                    const isSelected = selectedDate === dateStr;

                    return (
                      <button
                        key={dateStr}
                        className={`btn btn-sm p-2 text-center rounded-3 border transition-all ${
                          isSelected
                            ? 'btn-danger shadow-sm'
                            : 'btn-light hover-bg-subtle'
                        }`}
                        style={{ minWidth: '72px' }}
                        onClick={() => setSelectedDate(dateStr)}
                      >
                        <div className="small fw-bold text-uppercase">{day}</div>
                        <div className="fs-5 fw-bold">{dayNum}</div>
                        <div className="small text-muted">{month}</div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Theatres and Showtimes on Selected Date */}
              {availableDates.length > 0 && Object.keys(showsByTheatre).length === 0 ? (
                <p className="text-muted small my-3">
                  No shows running on {selectedDate}. Please select another date above.
                </p>
              ) : (
                <div className="d-flex flex-column gap-4">
                  {Object.values(showsByTheatre).map(({ theatre, shows }) => (
                    <div key={theatre._id} className="border-bottom pb-4 last-no-border">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div>
                          <h6 className="fw-bold mb-1">{theatre.name}</h6>
                          <p className="text-muted small mb-0 d-flex align-items-center gap-1">
                            <MapPin size={13} className="text-danger flex-shrink-0" />
                            <span>
                              {theatre.location}, {theatre.city}
                            </span>
                          </p>
                        </div>
                      </div>

                      {/* Amenities pills */}
                      <div className="d-flex flex-wrap gap-1 mb-3">
                        {theatre.facilities?.slice(0, 3).map((f, i) => (
                          <span
                            key={i}
                            className="badge bg-light text-muted border fw-normal"
                            style={{ fontSize: '0.68rem' }}
                          >
                            {f}
                          </span>
                        ))}
                      </div>

                      {/* Showtimes row */}
                      <div className="d-flex flex-wrap gap-2">
                        {shows.map((show) => (
                          <button
                            key={show._id}
                            className="showtime-pill border text-start"
                            onClick={() => handleSelectShowtime(show)}
                          >
                            <span className="fw-bold d-block">{show.startTime}</span>
                            <span className="text-muted" style={{ fontSize: '0.72rem' }}>
                              Screen {show.screenNumber} • From ₹{show.ticketPricing?.classic || 180}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar: Compact Cast Section & Digital Ticket Assurance */}
          <div className="col-12 col-lg-4">
            {/* Cast Section */}
            <div className="bg-white p-4 rounded-3 border mb-4 shadow-sm">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h5 className="fw-bold mb-0">Cast</h5>
                <span className="text-muted small">
                  {movie.cast?.length || 0} Listed
                </span>
              </div>

              {movie.cast && movie.cast.length > 0 ? (
                <div className="d-flex flex-column gap-2">
                  {movie.cast.map((actor, idx) => (
                    <div
                      key={idx}
                      className="d-flex align-items-center gap-3 p-2 rounded-2 bg-light bg-opacity-50 border border-light"
                    >
                      {actor.image ? (
                        <img
                          src={actor.image}
                          alt={actor.name}
                          className="rounded-circle border"
                          style={{
                            width: '40px',
                            height: '40px',
                            objectFit: 'cover',
                            flexShrink: 0,
                          }}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div
                        className="rounded-circle bg-white border d-flex align-items-center justify-content-center text-secondary shadow-sm"
                        style={{
                          width: '40px',
                          height: '40px',
                          flexShrink: 0,
                          display: actor.image ? 'none' : 'flex',
                        }}
                      >
                        <User size={18} />
                      </div>
                      <div className="overflow-hidden">
                        <p className="fw-bold mb-0 small text-truncate">
                          {actor.name}
                        </p>
                        {(actor.character || actor.role) && (
                          <span
                            className="text-muted text-truncate d-block"
                            style={{ fontSize: '0.76rem' }}
                          >
                            as {actor.character || actor.role}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted small mb-0">Cast information not listed.</p>
              )}
            </div>

            {/* Instant Digital Ticket Assurance */}
            <div className="bg-white p-3 rounded-3 border small shadow-sm">
              <h6 className="fw-bold mb-1 text-danger">Instant Digital Ticket</h6>
              <p className="text-muted mb-0" style={{ fontSize: '0.82rem', lineHeight: '1.4' }}>
                Confirmed tickets with unique QR verification codes are issued instantly to your booking history upon payment.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Material UI Styled YouTube Trailer Modal */}
      <TrailerModal
        isOpen={isTrailerOpen}
        onClose={() => setIsTrailerOpen(false)}
        trailerUrl={movie.trailerUrl}
        movieTitle={movie.title}
      />
    </div>
  );
};

export default MovieDetailPage;

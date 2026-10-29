import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import MoviePoster from '../../components/MoviePoster';
import { formatRuntime } from '../../utils/formatRuntime';
import { isValidYouTubeUrl } from '../../utils/youtube';
import { toast } from 'react-toastify';
import { Plus, Edit, Trash2, Search, Play, Award, Clapperboard, Clock } from 'lucide-react';

const AdminMoviesPage = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMovie, setEditingMovie] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [synopsis, setSynopsis] = useState('');
  const [genre, setGenre] = useState('');
  const [language, setLanguage] = useState('English');
  const [runtimeMinutes, setRuntimeMinutes] = useState('120');
  const [releaseDate, setReleaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [director, setDirector] = useState('');
  const [certification, setCertification] = useState('U/A 13+');
  const [trailerUrl, setTrailerUrl] = useState('');
  const [posterUrl, setPosterUrl] = useState('');
  const [posterFile, setPosterFile] = useState(null);
  const [castInput, setCastInput] = useState('');
  const [rating, setRating] = useState('8.0');
  const [status, setStatus] = useState('now_showing');

  // Field validation errors
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    try {
      setLoading(true);
      const res = await api.get('/movies?limit=50&status=all');
      if (res.data.success) {
        setMovies(res.data.movies);
      }
    } catch (err) {
      console.error('Failed to load movies:', err);
      toast.error('Failed to load movies.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingMovie(null);
    setTitle('');
    setSynopsis('');
    setGenre('Action, Sci-Fi');
    setLanguage('English');
    setRuntimeMinutes('120');
    setReleaseDate(new Date().toISOString().split('T')[0]);
    setDirector('');
    setCertification('U/A 13+');
    setTrailerUrl('');
    setPosterUrl('https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg');
    setPosterFile(null);
    setCastInput('');
    setRating('8.0');
    setStatus('now_showing');
    setErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEdit = (movie) => {
    setEditingMovie(movie);
    setTitle(movie.title || '');
    setSynopsis(movie.synopsis || movie.description || '');
    const genresList = movie.genres || movie.genre || [];
    setGenre(Array.isArray(genresList) ? genresList.join(', ') : genresList);
    setLanguage(movie.language || 'English');
    setRuntimeMinutes((movie.runtimeMinutes || movie.duration || 120).toString());
    setReleaseDate(
      movie.releaseDate
        ? new Date(movie.releaseDate).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0]
    );
    setDirector(movie.director || '');
    setCertification(movie.certification || 'U/A 13+');
    setTrailerUrl(movie.trailerUrl || '');
    setPosterUrl(movie.posterUrl || '');
    setPosterFile(null);

    // Format cast as "Name (Character), Name (Character)"
    if (Array.isArray(movie.cast) && movie.cast.length > 0) {
      const castStr = movie.cast
        .map((c) => (c.character ? `${c.name} (${c.character})` : c.name))
        .join(', ');
      setCastInput(castStr);
    } else {
      setCastInput('');
    }

    setRating((movie.rating || 8.0).toString());
    setStatus(movie.status || 'now_showing');
    setErrors({});
    setIsModalOpen(true);
  };

  const validateForm = () => {
    const errs = {};

    // 1. Title required
    if (!title.trim()) {
      errs.title = 'Title is required.';
    }

    // 2. Synopsis required
    if (!synopsis.trim()) {
      errs.synopsis = 'Synopsis / Description is required.';
    }

    // 3. Language required
    if (!language.trim()) {
      errs.language = 'Language is required.';
    }

    // 4. Genre required
    if (!genre.trim()) {
      errs.genre = 'At least one genre is required.';
    }

    // 5. Release date required
    if (!releaseDate) {
      errs.releaseDate = 'Release date is required.';
    }

    // 6. Runtime must be a positive number
    const mins = Number(runtimeMinutes);
    if (!runtimeMinutes || isNaN(mins) || mins <= 0) {
      errs.runtimeMinutes = 'Runtime must be a positive number of minutes (e.g. 138).';
    }

    // 7. Poster URL validation
    if (!posterFile && !posterUrl.trim()) {
      errs.posterUrl = 'Poster URL or uploaded file is required.';
    } else if (posterUrl.trim() && !posterFile) {
      const trimmed = posterUrl.trim();
      const isRelativeUpload = trimmed.startsWith('/uploads/');
      const isValidWebUrl = /^https?:\/\/.+/i.test(trimmed);
      const isTmdbPath = /^\/[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp)$/i.test(trimmed);
      if (!isRelativeUpload && !isValidWebUrl && !isTmdbPath) {
        errs.posterUrl = 'Poster URL must be a valid URL (e.g. https://image.tmdb.org/t/p/w500/...).';
      }
    }

    // 8. Trailer URL must be a valid YouTube URL when supplied
    if (trailerUrl.trim()) {
      if (!isValidYouTubeUrl(trailerUrl.trim())) {
        errs.trailerUrl = 'Trailer URL must be a valid YouTube URL (e.g. https://www.youtube.com/watch?v=...).';
      }
    }

    setErrors(errs);
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      const firstError = Object.values(validationErrors)[0];
      toast.error(firstError);
      return;
    }

    try {
      setSubmitting(true);

      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('synopsis', synopsis.trim());
      formData.append('description', synopsis.trim());
      formData.append('genre', genre.trim());
      formData.append('language', language.trim());
      formData.append('runtimeMinutes', runtimeMinutes);
      formData.append('duration', runtimeMinutes);
      formData.append('releaseDate', releaseDate);
      formData.append('director', director.trim());
      formData.append('certification', certification.trim());
      formData.append('trailerUrl', trailerUrl.trim());
      formData.append('rating', rating);
      formData.append('status', status);

      // Parse cast input: "Name (Character), Name"
      const parsedCast = castInput
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
        .map((entry) => {
          const match = entry.match(/^(.+?)\s*\((.+?)\)$/);
          if (match) {
            return { name: match[1].trim(), character: match[2].trim(), role: match[2].trim() };
          }
          return { name: entry, character: '', role: 'Actor' };
        });

      formData.append('cast', JSON.stringify(parsedCast));

      if (posterFile) {
        formData.append('poster', posterFile);
      } else {
        formData.append('posterUrl', posterUrl.trim());
      }

      if (editingMovie) {
        await api.put(`/movies/${editingMovie._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Movie updated successfully.');
      } else {
        await api.post('/movies', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('New movie created successfully.');
      }

      setIsModalOpen(false);
      fetchMovies();
    } catch (err) {
      const serverMessage = err.response?.data?.message || 'Failed to save movie.';
      toast.error(serverMessage);
      if (err.response?.data?.errors) {
        setErrors((prev) => ({ ...prev, ...err.response.data.errors }));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, movieTitle) => {
    if (!window.confirm(`Are you sure you want to delete "${movieTitle}"?`)) return;

    try {
      const res = await api.delete(`/movies/${id}`);
      if (res.data.success) {
        toast.success('Movie deleted successfully.');
        fetchMovies();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete movie.');
    }
  };

  const filtered = movies.filter((m) =>
    m.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container py-4">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
        <div>
          <h3 className="fw-bold mb-1">Movie Management</h3>
          <p className="text-muted small mb-0">
            Create, edit, or archive cinema titles with posters, trailers, runtime, and cast
          </p>
        </div>

        <div className="d-flex gap-2">
          <button
            className="btn btn-sm btn-cinema d-flex align-items-center gap-1"
            onClick={handleOpenAdd}
          >
            <Plus size={16} />
            <span>Add New Movie</span>
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white p-3 rounded-3 border mb-4 shadow-sm">
        <div className="input-group input-group-sm" style={{ maxWidth: '350px' }}>
          <span className="input-group-text bg-white">
            <Search size={14} className="text-muted" />
          </span>
          <input
            type="text"
            className="form-control"
            placeholder="Search movie by title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <LoadingSpinner message="Loading movie library..." />
      ) : (
        <div className="bg-white rounded-3 border overflow-hidden shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover align-middle small mb-0">
              <thead className="table-light">
                <tr>
                  <th style={{ width: '60px' }}>Poster</th>
                  <th>Title & Director</th>
                  <th>Certification</th>
                  <th>Genre & Language</th>
                  <th>Runtime</th>
                  <th>Trailer</th>
                  <th>Release Date</th>
                  <th>Rating</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((movie) => {
                  const genresList = movie.genres || movie.genre || [];
                  const runtimeStr = formatRuntime(movie.runtimeMinutes || movie.duration);
                  const hasTrailer = Boolean(movie.trailerUrl && isValidYouTubeUrl(movie.trailerUrl));

                  return (
                    <tr key={movie._id}>
                      <td>
                        <div style={{ width: '40px', height: '56px' }}>
                          <MoviePoster
                            src={movie.posterUrl}
                            title={movie.title}
                            aspectRatio="2 / 3"
                            rounded="rounded"
                            alt={movie.title}
                          />
                        </div>
                      </td>
                      <td>
                        <div className="fw-bold">{movie.title}</div>
                        {movie.director && (
                          <span className="text-muted" style={{ fontSize: '0.76rem' }}>
                            Dir: {movie.director}
                          </span>
                        )}
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border">
                          {movie.certification || 'U/A 13+'}
                        </span>
                      </td>
                      <td>
                        <div>{Array.isArray(genresList) ? genresList.join(', ') : genresList}</div>
                        <span className="text-muted">{movie.language}</span>
                      </td>
                      <td>
                        <span className="d-flex align-items-center gap-1">
                          <Clock size={12} className="text-muted" />
                          <span>{runtimeStr || `${movie.duration || movie.runtimeMinutes}m`}</span>
                        </span>
                      </td>
                      <td>
                        {hasTrailer ? (
                          <a
                            href={movie.trailerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="badge bg-danger-subtle text-danger d-inline-flex align-items-center gap-1 text-decoration-none"
                            title="Open Trailer"
                          >
                            <Play size={10} fill="currentColor" />
                            <span>Trailer</span>
                          </a>
                        ) : (
                          <span className="text-muted small">—</span>
                        )}
                      </td>
                      <td>{new Date(movie.releaseDate).toLocaleDateString()}</td>
                      <td>★ {movie.rating?.toFixed(1) || '8.0'}</td>
                      <td>
                        <span
                          className={`badge ${
                            movie.status === 'now_showing'
                              ? 'bg-success-subtle text-success'
                              : movie.status === 'coming_soon'
                              ? 'bg-primary-subtle text-primary'
                              : 'bg-secondary'
                          }`}
                        >
                          {movie.status === 'now_showing'
                            ? 'Now Showing'
                            : movie.status === 'coming_soon'
                            ? 'Coming Soon'
                            : 'Archived'}
                        </span>
                      </td>
                      <td className="text-end">
                        <div className="d-flex justify-content-end gap-1">
                          <button
                            className="btn btn-sm btn-light border p-1"
                            onClick={() => handleOpenEdit(movie)}
                            title="Edit Movie"
                          >
                            <Edit size={14} className="text-primary" />
                          </button>
                          <button
                            className="btn btn-sm btn-light border p-1"
                            onClick={() => handleDelete(movie._id, movie.title)}
                            title="Delete Movie"
                          >
                            <Trash2 size={14} className="text-danger" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Movie Modal */}
      {isModalOpen && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(4px)' }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content rounded-3 shadow-lg border-0">
              <form onSubmit={handleSubmit} noValidate>
                <div className="modal-header border-bottom">
                  <h5 className="modal-title fw-bold">
                    {editingMovie ? 'Edit Movie Details' : 'Add New Movie Title'}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setIsModalOpen(false)}
                  ></button>
                </div>

                <div className="modal-body p-4">
                  <div className="row g-3">
                    {/* Title */}
                    <div className="col-12 col-md-8">
                      <label className="form-label small fw-semibold text-secondary">
                        Movie Title <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className={`form-control form-control-sm ${errors.title ? 'is-invalid' : ''}`}
                        value={title}
                        onChange={(e) => {
                          setTitle(e.target.value);
                          if (errors.title) setErrors((prev) => ({ ...prev, title: '' }));
                        }}
                        placeholder="e.g. Interstellar"
                        required
                      />
                      {errors.title && (
                        <div className="invalid-feedback">{errors.title}</div>
                      )}
                    </div>

                    {/* Status */}
                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-semibold text-secondary">
                        Status
                      </label>
                      <select
                        className="form-select form-select-sm"
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                      >
                        <option value="now_showing">Now Showing</option>
                        <option value="coming_soon">Coming Soon</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>

                    {/* Synopsis / Description */}
                    <div className="col-12">
                      <label className="form-label small fw-semibold text-secondary">
                        Synopsis / Description <span className="text-danger">*</span>
                      </label>
                      <textarea
                        className={`form-control form-control-sm ${errors.synopsis ? 'is-invalid' : ''}`}
                        rows="3"
                        value={synopsis}
                        onChange={(e) => {
                          setSynopsis(e.target.value);
                          if (errors.synopsis) setErrors((prev) => ({ ...prev, synopsis: '' }));
                        }}
                        placeholder="Concise, realistic movie synopsis..."
                        required
                      ></textarea>
                      {errors.synopsis && (
                        <div className="invalid-feedback">{errors.synopsis}</div>
                      )}
                    </div>

                    {/* Genre */}
                    <div className="col-6 col-md-4">
                      <label className="form-label small fw-semibold text-secondary">
                        Genre (comma-separated) <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className={`form-control form-control-sm ${errors.genre ? 'is-invalid' : ''}`}
                        value={genre}
                        onChange={(e) => {
                          setGenre(e.target.value);
                          if (errors.genre) setErrors((prev) => ({ ...prev, genre: '' }));
                        }}
                        placeholder="Action, Sci-Fi"
                        required
                      />
                      {errors.genre && (
                        <div className="invalid-feedback">{errors.genre}</div>
                      )}
                    </div>

                    {/* Language */}
                    <div className="col-6 col-md-4">
                      <label className="form-label small fw-semibold text-secondary">
                        Language <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className={`form-control form-control-sm ${errors.language ? 'is-invalid' : ''}`}
                        value={language}
                        onChange={(e) => {
                          setLanguage(e.target.value);
                          if (errors.language) setErrors((prev) => ({ ...prev, language: '' }));
                        }}
                        placeholder="English"
                        required
                      />
                      {errors.language && (
                        <div className="invalid-feedback">{errors.language}</div>
                      )}
                    </div>

                    {/* Runtime in Minutes */}
                    <div className="col-6 col-md-4">
                      <label className="form-label small fw-semibold text-secondary">
                        Runtime (minutes) <span className="text-danger">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        className={`form-control form-control-sm ${errors.runtimeMinutes ? 'is-invalid' : ''}`}
                        value={runtimeMinutes}
                        onChange={(e) => {
                          setRuntimeMinutes(e.target.value);
                          if (errors.runtimeMinutes) setErrors((prev) => ({ ...prev, runtimeMinutes: '' }));
                        }}
                        placeholder="138"
                        required
                      />
                      {errors.runtimeMinutes && (
                        <div className="invalid-feedback">{errors.runtimeMinutes}</div>
                      )}
                      {runtimeMinutes && Number(runtimeMinutes) > 0 && (
                        <span className="text-muted small" style={{ fontSize: '0.72rem' }}>
                          Displays as: {formatRuntime(runtimeMinutes)}
                        </span>
                      )}
                    </div>

                    {/* Release Date */}
                    <div className="col-6 col-md-4">
                      <label className="form-label small fw-semibold text-secondary">
                        Release Date <span className="text-danger">*</span>
                      </label>
                      <input
                        type="date"
                        className={`form-control form-control-sm ${errors.releaseDate ? 'is-invalid' : ''}`}
                        value={releaseDate}
                        onChange={(e) => {
                          setReleaseDate(e.target.value);
                          if (errors.releaseDate) setErrors((prev) => ({ ...prev, releaseDate: '' }));
                        }}
                        required
                      />
                      {errors.releaseDate && (
                        <div className="invalid-feedback">{errors.releaseDate}</div>
                      )}
                    </div>

                    {/* Certification */}
                    <div className="col-6 col-md-4">
                      <label className="form-label small fw-semibold text-secondary">
                        Certification
                      </label>
                      <select
                        className="form-select form-select-sm"
                        value={certification}
                        onChange={(e) => setCertification(e.target.value)}
                      >
                        <option value="U">U (Universal)</option>
                        <option value="U/A 13+">U/A 13+</option>
                        <option value="U/A 16+">U/A 16+</option>
                        <option value="A">A (Adults Only)</option>
                        <option value="PG-13">PG-13</option>
                        <option value="R">R</option>
                      </select>
                    </div>

                    {/* Director */}
                    <div className="col-6 col-md-4">
                      <label className="form-label small fw-semibold text-secondary">
                        Director
                      </label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="e.g. Christopher Nolan"
                        value={director}
                        onChange={(e) => setDirector(e.target.value)}
                      />
                    </div>

                    {/* YouTube Trailer URL */}
                    <div className="col-12 col-md-8">
                      <label className="form-label small fw-semibold text-secondary">
                        YouTube Trailer URL
                      </label>
                      <input
                        type="url"
                        className={`form-control form-control-sm ${errors.trailerUrl ? 'is-invalid' : ''}`}
                        placeholder="https://www.youtube.com/watch?v=..."
                        value={trailerUrl}
                        onChange={(e) => {
                          setTrailerUrl(e.target.value);
                          if (errors.trailerUrl) setErrors((prev) => ({ ...prev, trailerUrl: '' }));
                        }}
                      />
                      {errors.trailerUrl && (
                        <div className="invalid-feedback">{errors.trailerUrl}</div>
                      )}
                      <span className="text-muted small" style={{ fontSize: '0.72rem' }}>
                        Supports youtube.com/watch?v= or youtu.be/ links
                      </span>
                    </div>

                    {/* Rating */}
                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-semibold text-secondary">
                        Rating (0 - 10)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="10"
                        className="form-control form-control-sm"
                        value={rating}
                        onChange={(e) => setRating(e.target.value)}
                      />
                    </div>

                    {/* Poster URL or File Upload */}
                    <div className="col-12 col-md-7">
                      <label className="form-label small fw-semibold text-secondary">
                        Poster Image URL <span className="text-danger">*</span>
                      </label>
                      <input
                        type="url"
                        className={`form-control form-control-sm ${errors.posterUrl ? 'is-invalid' : ''}`}
                        placeholder="https://image.tmdb.org/t/p/w500/..."
                        value={posterUrl}
                        onChange={(e) => {
                          setPosterUrl(e.target.value);
                          if (errors.posterUrl) setErrors((prev) => ({ ...prev, posterUrl: '' }));
                        }}
                        disabled={!!posterFile}
                      />
                      {errors.posterUrl && (
                        <div className="invalid-feedback">{errors.posterUrl}</div>
                      )}
                    </div>

                    <div className="col-12 col-md-5">
                      <label className="form-label small fw-semibold text-secondary">
                        Or Upload Poster File
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        className="form-control form-control-sm"
                        onChange={(e) => {
                          setPosterFile(e.target.files[0] || null);
                          if (errors.posterUrl) setErrors((prev) => ({ ...prev, posterUrl: '' }));
                        }}
                      />
                    </div>

                    {/* Cast list */}
                    <div className="col-12">
                      <label className="form-label small fw-semibold text-secondary">
                        Cast (comma-separated with optional character in parentheses)
                      </label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="e.g. Matthew McConaughey (Cooper), Anne Hathaway (Brand)"
                        value={castInput}
                        onChange={(e) => setCastInput(e.target.value)}
                      />
                      <span className="text-muted small" style={{ fontSize: '0.72rem' }}>
                        Format: "Actor Name (Character Name)" or simply "Actor Name"
                      </span>
                    </div>
                  </div>
                </div>

                <div className="modal-footer border-top bg-light">
                  <button
                    type="button"
                    className="btn btn-sm btn-light border"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-sm btn-cinema"
                    disabled={submitting}
                  >
                    {submitting ? 'Saving...' : editingMovie ? 'Save Changes' : 'Create Movie'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMoviesPage;

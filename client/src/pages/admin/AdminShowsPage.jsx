import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import { formatRuntime } from '../../utils/formatRuntime';
import { toast } from 'react-toastify';
import { Calendar, Plus, Trash2, Clock, MapPin, Film, Search } from 'lucide-react';

const AdminShowsPage = () => {
  const [shows, setShows] = useState([]);
  const [movies, setMovies] = useState([]);
  const [theatres, setTheatres] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [selectedMovieId, setSelectedMovieId] = useState('');
  const [selectedTheatreId, setSelectedTheatreId] = useState('');
  const [screenNumber, setScreenNumber] = useState(1);
  const [showDate, setShowDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('10:30 AM');
  const [classicPrice, setClassicPrice] = useState(180);
  const [primePrice, setPrimePrice] = useState(280);
  const [reclinerPrice, setReclinerPrice] = useState(450);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [showsRes, moviesRes, theatresRes] = await Promise.all([
        api.get('/shows'),
        api.get('/movies?limit=100&status=all'),
        api.get('/theatres'),
      ]);

      if (showsRes.data.success) setShows(showsRes.data.shows);
      if (moviesRes.data.success) {
        setMovies(moviesRes.data.movies);
        if (moviesRes.data.movies.length > 0) setSelectedMovieId(moviesRes.data.movies[0]._id);
      }
      if (theatresRes.data.success) {
        setTheatres(theatresRes.data.theatres);
        if (theatresRes.data.theatres.length > 0) setSelectedTheatreId(theatresRes.data.theatres[0]._id);
      }
    } catch (err) {
      console.error('Failed to load shows:', err);
      toast.error('Failed to load shows data.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setShowDate(new Date().toISOString().split('T')[0]);
    setStartTime('10:30 AM');
    setScreenNumber(1);
    setClassicPrice(180);
    setPrimePrice(280);
    setReclinerPrice(450);
    setIsModalOpen(true);
  };

  const handleCreateShow = async (e) => {
    e.preventDefault();
    if (!selectedMovieId || !selectedTheatreId || !showDate || !startTime) {
      toast.warning('Please fill in all show fields.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        movieId: selectedMovieId,
        theatreId: selectedTheatreId,
        screenNumber: Number(screenNumber),
        showDate,
        startTime,
        ticketPricing: {
          classic: Number(classicPrice),
          prime: Number(primePrice),
          recliner: Number(reclinerPrice),
        },
      };

      const res = await api.post('/shows', payload);
      if (res.data.success) {
        toast.success('Show scheduled and seats generated successfully!');
        setIsModalOpen(false);
        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Schedule conflict or failed to create show.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteShow = async (id, movieTitle, theatreName) => {
    if (!window.confirm(`Delete show for "${movieTitle}" at "${theatreName}"?`)) return;

    try {
      const res = await api.delete(`/shows/${id}`);
      if (res.data.success) {
        toast.success('Show and associated seats deleted.');
        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot delete show with active bookings.');
    }
  };

  return (
    <div className="container py-4">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
        <div>
          <h3 className="fw-bold mb-1">Show Scheduling & Seat Layouts</h3>
          <p className="text-muted small mb-0">
            Assign movies to auditorium screens and auto-generate seat inventories
          </p>
        </div>

        <button className="btn btn-sm btn-cinema d-flex align-items-center gap-1" onClick={handleOpenAdd}>
          <Plus size={16} />
          <span>Schedule New Show</span>
        </button>
      </div>

      {loading ? (
        <LoadingSpinner message="Loading scheduled screenings..." />
      ) : (
        <div className="bg-white rounded-3 border overflow-hidden">
          <div className="table-responsive">
            <table className="table table-hover align-middle small mb-0">
              <thead className="table-light">
                <tr>
                  <th>Movie</th>
                  <th>Theatre & Screen</th>
                  <th>Date</th>
                  <th>Start Time</th>
                  <th>Pricing</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {shows.map((show) => (
                  <tr key={show._id}>
                    <td>
                      <div className="fw-bold">{show.movieId?.title}</div>
                      <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                        {formatRuntime(show.movieId?.runtimeMinutes || show.movieId?.duration) || `${show.movieId?.duration || 0} mins`}
                      </span>
                    </td>
                    <td>
                      <div>{show.theatreId?.name}</div>
                      <span className="text-muted">
                        Audi {show.screenNumber} • {show.theatreId?.city}
                      </span>
                    </td>
                    <td>{show.showDate}</td>
                    <td className="fw-semibold text-danger">{show.startTime}</td>
                    <td>
                      <span className="badge bg-light text-dark border">
                        ₹{show.ticketPricing?.classic} / ₹{show.ticketPricing?.prime} / ₹{show.ticketPricing?.recliner}
                      </span>
                    </td>
                    <td>
                      <span className="badge bg-success-subtle text-success">
                        {show.status}
                      </span>
                    </td>
                    <td className="text-end">
                      <button
                        className="btn btn-sm btn-light border p-1"
                        onClick={() =>
                          handleDeleteShow(
                            show._id,
                            show.movieId?.title,
                            show.theatreId?.name
                          )
                        }
                        title="Delete Show"
                      >
                        <Trash2 size={14} className="text-danger" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Schedule Show Modal */}
      {isModalOpen && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <form onSubmit={handleCreateShow}>
                <div className="modal-header border-bottom">
                  <h5 className="modal-title fw-bold">Schedule New Screening</h5>
                  <button type="button" className="btn-close" onClick={() => setIsModalOpen(false)}></button>
                </div>

                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">Select Movie *</label>
                    <select
                      className="form-select form-select-sm"
                      value={selectedMovieId}
                      onChange={(e) => setSelectedMovieId(e.target.value)}
                      required
                    >
                      {movies.map((m) => (
                        <option key={m._id} value={m._id}>
                          {m.title} ({m.language})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">Select Theatre *</label>
                    <select
                      className="form-select form-select-sm"
                      value={selectedTheatreId}
                      onChange={(e) => setSelectedTheatreId(e.target.value)}
                      required
                    >
                      {theatres.map((t) => (
                        <option key={t._id} value={t._id}>
                          {t.name} ({t.city})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label small fw-semibold text-secondary">Screen / Audi</label>
                      <input
                        type="number"
                        min="1"
                        max="8"
                        className="form-control form-control-sm"
                        value={screenNumber}
                        onChange={(e) => setScreenNumber(e.target.value)}
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label small fw-semibold text-secondary">Show Date *</label>
                      <input
                        type="date"
                        className="form-control form-control-sm"
                        value={showDate}
                        onChange={(e) => setShowDate(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">Start Time Slot *</label>
                    <select
                      className="form-select form-select-sm"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                    >
                      <option value="10:00 AM">10:00 AM - Morning Show</option>
                      <option value="10:30 AM">10:30 AM - Morning Show</option>
                      <option value="01:45 PM">01:45 PM - Matinee Show</option>
                      <option value="02:00 PM">02:00 PM - Matinee Show</option>
                      <option value="05:30 PM">05:30 PM - Evening Show</option>
                      <option value="06:45 PM">06:45 PM - Evening Show</option>
                      <option value="09:00 PM">09:00 PM - Night Show</option>
                      <option value="10:30 PM">10:30 PM - Late Night Show</option>
                    </select>
                  </div>

                  <div className="row g-2">
                    <div className="col-4">
                      <label className="form-label small fw-semibold text-secondary">Classic (₹)</label>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        value={classicPrice}
                        onChange={(e) => setClassicPrice(e.target.value)}
                      />
                    </div>
                    <div className="col-4">
                      <label className="form-label small fw-semibold text-secondary">Prime (₹)</label>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        value={primePrice}
                        onChange={(e) => setPrimePrice(e.target.value)}
                      />
                    </div>
                    <div className="col-4">
                      <label className="form-label small fw-semibold text-secondary">Recliner (₹)</label>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        value={reclinerPrice}
                        onChange={(e) => setReclinerPrice(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-footer border-top">
                  <button type="button" className="btn btn-sm btn-light border" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-sm btn-cinema" disabled={submitting}>
                    {submitting ? 'Generating Seats...' : 'Schedule & Generate Seats'}
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

export default AdminShowsPage;

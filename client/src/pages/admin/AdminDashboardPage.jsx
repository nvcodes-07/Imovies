import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import MoviePoster from '../../components/MoviePoster';
import {
  Film,
  Building,
  Calendar,
  Ticket,
  IndianRupee,
  Users,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

const AdminDashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [topMovies, setTopMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/stats');
      if (res.data.success) {
        setStats(res.data.stats);
        setRecentBookings(res.data.recentBookings || []);
        setTopMovies(res.data.topMovies || []);
      }
    } catch (err) {
      console.error('Failed to load admin stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Aggregating cinema operations and revenue metrics..." />;
  }

  return (
    <div className="container py-4">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-2">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <span className="badge bg-dark text-warning px-2 py-1">ADMINISTRATOR</span>
            <h2 className="fw-bold mb-0">Cinema Operations Overview</h2>
          </div>
          <p className="text-muted small mb-0">
            Real-time analytics for movies, theatres, screenings, and ticketing revenue
          </p>
        </div>

        <div className="d-flex gap-2">
          <Link to="/admin/shows" className="btn btn-sm btn-cinema">
            Schedule New Show
          </Link>
          <Link to="/admin/movies" className="btn btn-sm btn-outline-secondary">
            Manage Movies
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-4 g-3 mb-4">
        {/* Total Revenue */}
        <div className="col">
          <div className="bg-white p-3 rounded-3 border h-100">
            <div className="d-flex justify-content-between align-items-start mb-2">
              <span className="text-muted small fw-semibold">Total Revenue</span>
              <div className="p-2 rounded bg-success-subtle text-success">
                <IndianRupee size={18} />
              </div>
            </div>
            <h3 className="fw-bold mb-1 text-dark">₹{stats?.totalRevenue || 0}</h3>
            <span className="text-muted" style={{ fontSize: '0.75rem' }}>
              From {stats?.confirmedBookings || 0} confirmed bookings
            </span>
          </div>
        </div>

        {/* Total Bookings */}
        <div className="col">
          <div className="bg-white p-3 rounded-3 border h-100">
            <div className="d-flex justify-content-between align-items-start mb-2">
              <span className="text-muted small fw-semibold">Total Bookings</span>
              <div className="p-2 rounded bg-primary-subtle text-primary">
                <Ticket size={18} />
              </div>
            </div>
            <h3 className="fw-bold mb-1 text-dark">{stats?.totalBookings || 0}</h3>
            <span className="text-muted" style={{ fontSize: '0.75rem' }}>
              {stats?.cancelledBookings || 0} cancelled
            </span>
          </div>
        </div>

        {/* Scheduled Shows */}
        <div className="col">
          <div className="bg-white p-3 rounded-3 border h-100">
            <div className="d-flex justify-content-between align-items-start mb-2">
              <span className="text-muted small fw-semibold">Active Shows</span>
              <div className="p-2 rounded bg-danger-subtle text-danger">
                <Calendar size={18} />
              </div>
            </div>
            <h3 className="fw-bold mb-1 text-dark">{stats?.totalShows || 0}</h3>
            <span className="text-muted" style={{ fontSize: '0.75rem' }}>
              Scheduled across all screens
            </span>
          </div>
        </div>

        {/* Movies Catalog */}
        <div className="col">
          <div className="bg-white p-3 rounded-3 border h-100">
            <div className="d-flex justify-content-between align-items-start mb-2">
              <span className="text-muted small fw-semibold">Movies & Theatres</span>
              <div className="p-2 rounded bg-warning-subtle text-warning">
                <Film size={18} />
              </div>
            </div>
            <h3 className="fw-bold mb-1 text-dark">
              {stats?.totalMovies || 0} / {stats?.totalTheatres || 0}
            </h3>
            <span className="text-muted" style={{ fontSize: '0.75rem' }}>
              Titles in {stats?.totalTheatres || 0} locations
            </span>
          </div>
        </div>
      </div>

      {/* Admin Quick Action Navigation Grid */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <Link to="/admin/movies" className="card border text-decoration-none p-3 h-100 hover-shadow bg-white">
            <Film size={22} className="text-danger mb-2" />
            <h6 className="fw-bold mb-1 text-dark">Movies</h6>
            <p className="text-muted small mb-0">Add titles, posters and status</p>
          </Link>
        </div>
        <div className="col-6 col-md-3">
          <Link to="/admin/theatres" className="card border text-decoration-none p-3 h-100 hover-shadow bg-white">
            <Building size={22} className="text-primary mb-2" />
            <h6 className="fw-bold mb-1 text-dark">Theatres</h6>
            <p className="text-muted small mb-0">Manage auditoriums & screens</p>
          </Link>
        </div>
        <div className="col-6 col-md-3">
          <Link to="/admin/shows" className="card border text-decoration-none p-3 h-100 hover-shadow bg-white">
            <Calendar size={22} className="text-success mb-2" />
            <h6 className="fw-bold mb-1 text-dark">Showtimes</h6>
            <p className="text-muted small mb-0">Schedule shows & seat generation</p>
          </Link>
        </div>
        <div className="col-6 col-md-3">
          <Link to="/admin/bookings" className="card border text-decoration-none p-3 h-100 hover-shadow bg-white">
            <Ticket size={22} className="text-warning mb-2" />
            <h6 className="fw-bold mb-1 text-dark">Bookings</h6>
            <p className="text-muted small mb-0">Customer reservations & refunds</p>
          </Link>
        </div>
      </div>

      <div className="row g-4">
        {/* Recent Bookings Table */}
        <div className="col-12 col-lg-8">
          <div className="bg-white p-4 rounded-3 border h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold mb-0">Recent Customer Bookings</h5>
              <Link to="/admin/bookings" className="text-danger small fw-semibold">
                View All
              </Link>
            </div>

            {recentBookings.length === 0 ? (
              <p className="text-muted small py-3 mb-0">No customer bookings recorded yet.</p>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle small mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Ref</th>
                      <th>Customer</th>
                      <th>Movie</th>
                      <th>Seats</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentBookings.map((b) => (
                      <tr key={b._id}>
                        <td className="fw-bold text-danger">{b.bookingReference}</td>
                        <td>{b.userId?.name || 'Customer'}</td>
                        <td className="text-truncate" style={{ maxWidth: '140px' }}>
                          {b.movieId?.title}
                        </td>
                        <td>{b.seats?.map((s) => s.seatNumber).join(', ')}</td>
                        <td className="fw-bold">₹{b.totalAmount}</td>
                        <td>
                          <span
                            className={`badge ${
                              b.bookingStatus === 'confirmed'
                                ? 'bg-success-subtle text-success'
                                : 'bg-danger-subtle text-danger'
                            }`}
                          >
                            {b.bookingStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Top Movies by Booking */}
        <div className="col-12 col-lg-4">
          <div className="bg-white p-4 rounded-3 border h-100">
            <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
              <TrendingUp size={18} className="text-danger" />
              <span>Top Booked Movies</span>
            </h5>

            {topMovies.length === 0 ? (
              <p className="text-muted small mb-0">No booking statistics yet.</p>
            ) : (
              <div className="d-flex flex-column gap-3">
                {topMovies.map((tm, idx) => (
                  <div key={tm.movieId} className="d-flex align-items-center gap-3">
                    <span className="fw-bold fs-5 text-muted" style={{ width: '20px' }}>
                      #{idx + 1}
                    </span>
                    <div style={{ width: '40px', height: '56px', flexShrink: 0 }}>
                      <MoviePoster
                        src={tm.posterUrl}
                        title={tm.title}
                        aspectRatio="2 / 3"
                        rounded="rounded"
                        alt={tm.title}
                      />
                    </div>
                    <div className="flex-grow-1">
                      <h6 className="fw-bold mb-0 small text-truncate" style={{ maxWidth: '140px' }}>
                        {tm.title}
                      </h6>
                      <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                        {tm.bookingCount} bookings • ₹{tm.totalRevenue}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;

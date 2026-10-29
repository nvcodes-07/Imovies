import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import MoviePoster from '../components/MoviePoster';
import { toast } from 'react-toastify';
import {
  Ticket,
  Calendar,
  Clock,
  MapPin,
  AlertCircle,
  XCircle,
  CheckCircle,
  RotateCcw,
} from 'lucide-react';

const BookingHistoryPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  // Cancel modal state
  const [bookingToCancel, setBookingToCancel] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, [activeTab]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/bookings/my?filter=${activeTab}`);
      if (res.data.success) {
        setBookings(res.data.bookings);
      }
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
      toast.error('Failed to load your booking history.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelConfirm = async () => {
    if (!bookingToCancel) return;

    try {
      setCancelling(true);
      const res = await api.patch(`/bookings/${bookingToCancel._id}/cancel`);
      if (res.data.success) {
        toast.success('Booking cancelled successfully and seats released.');
        setBookingToCancel(null);
        fetchBookings(); // Refresh list
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cancellation failed.');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="container py-4">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-2">
        <div>
          <h2 className="fw-bold mb-1">My Bookings</h2>
          <p className="text-muted small mb-0">
            View your upcoming shows, past tickets, and eligible cancellations
          </p>
        </div>
        <Link to="/movies" className="btn btn-sm btn-cinema">
          Book New Tickets
        </Link>
      </div>

      {/* Tabs */}
      <div className="d-flex gap-2 mb-4 border-bottom pb-2 overflow-auto">
        {['all', 'upcoming', 'past', 'cancelled'].map((tab) => (
          <button
            key={tab}
            className={`btn btn-sm rounded-pill px-3 py-1 text-capitalize fw-semibold ${
              activeTab === tab ? 'btn-danger' : 'btn-light border'
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      {loading ? (
        <LoadingSpinner message="Fetching your bookings..." />
      ) : bookings.length === 0 ? (
        <EmptyState
          icon={Ticket}
          title={`No ${activeTab === 'all' ? '' : activeTab} bookings found`}
          description="You don't have any movie tickets in this category yet."
          actionText="Explore Movies Now"
          onAction={() => (window.location.href = '/movies')}
        />
      ) : (
        <div className="d-flex flex-column gap-3">
          {bookings.map((booking) => {
            const isCancelled = booking.bookingStatus === 'cancelled';
            const showDate = booking.showId?.showDate || '';
            const startTime = booking.showId?.startTime || '';

            return (
              <div
                key={booking._id}
                className={`bg-white p-3 p-md-4 rounded-3 border ${
                  isCancelled ? 'opacity-75' : ''
                }`}
              >
                <div className="row g-3 align-items-center">
                  {/* Poster Thumbnail */}
                  <div className="col-4 col-sm-3 col-md-2 text-center">
                    <div style={{ maxWidth: '90px', margin: '0 auto' }}>
                      <MoviePoster
                        src={booking.movieId?.posterUrl}
                        title={booking.movieId?.title}
                        aspectRatio="2 / 3"
                        rounded="rounded"
                        alt={booking.movieId?.title}
                      />
                    </div>
                  </div>

                  {/* Booking Details */}
                  <div className="col-8 col-sm-9 col-md-6">
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <span
                        className={`badge ${
                          isCancelled
                            ? 'bg-danger-subtle text-danger border border-danger-subtle'
                            : 'bg-success-subtle text-success border border-success-subtle'
                        }`}
                      >
                        {isCancelled ? 'Cancelled' : 'Confirmed'}
                      </span>
                      <span className="text-muted small">
                        Ref: <strong>{booking.bookingReference}</strong>
                      </span>
                    </div>

                    <h5 className="fw-bold mb-1 text-dark">{booking.movieId?.title}</h5>
                    <p className="text-muted small mb-2 d-flex align-items-center gap-1">
                      <MapPin size={13} className="text-danger flex-shrink-0" />
                      <span>{booking.theatreId?.name}</span>
                    </p>

                    <div className="d-flex flex-wrap align-items-center gap-3 text-muted small mb-2">
                      <span className="d-flex align-items-center gap-1">
                        <Calendar size={13} />
                        <span>{showDate}</span>
                      </span>
                      <span className="d-flex align-items-center gap-1">
                        <Clock size={13} />
                        <span>{startTime}</span>
                      </span>
                    </div>

                    {/* Booked Seats */}
                    <div className="d-flex flex-wrap gap-1">
                      {booking.seats?.map((s) => (
                        <span
                          key={s.seatNumber}
                          className="badge bg-light text-dark border fw-semibold"
                          style={{ fontSize: '0.75rem' }}
                        >
                          {s.seatNumber} ({s.category})
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions & Price */}
                  <div className="col-12 col-md-4 text-md-end pt-3 pt-md-0 border-top border-md-0">
                    <div className="mb-2">
                      <span className="text-muted small d-block">Amount Paid</span>
                      <span className="fw-bold fs-5 text-dark">₹{booking.totalAmount}</span>
                      <span className="d-block text-muted" style={{ fontSize: '0.75rem' }}>
                        {booking.paymentStatus === 'refunded' ? 'Refund Processed' : 'Paid Online'}
                      </span>
                    </div>

                    <div className="d-flex justify-content-md-end gap-2">
                      <Link
                        to={`/booking-success/${booking._id}`}
                        className="btn btn-sm btn-outline-secondary"
                      >
                        View Ticket
                      </Link>

                      {!isCancelled && (
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => setBookingToCancel(booking)}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cancellation Confirmation Modal */}
      {bookingToCancel && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header border-bottom">
                <h6 className="modal-title fw-bold text-danger d-flex align-items-center gap-2">
                  <AlertCircle size={18} />
                  <span>Confirm Ticket Cancellation</span>
                </h6>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setBookingToCancel(null)}
                ></button>
              </div>

              <div className="modal-body">
                <p className="mb-2">
                  Are you sure you want to cancel your booking for{' '}
                  <strong>{bookingToCancel.movieId?.title}</strong>?
                </p>
                <div className="bg-light p-3 rounded-2 border mb-3 small">
                  <div>
                    <strong>Seats:</strong>{' '}
                    {bookingToCancel.seats?.map((s) => s.seatNumber).join(', ')}
                  </div>
                  <div>
                    <strong>Refund Amount:</strong> ₹{bookingToCancel.totalAmount}
                  </div>
                </div>
                <p className="text-muted small mb-0">
                  <em>
                    Note: Cancellations are permitted up to 2 hours before the scheduled showtime. Seats will be immediately released for other cinema guests.
                  </em>
                </p>
              </div>

              <div className="modal-footer border-top">
                <button
                  type="button"
                  className="btn btn-sm btn-light border"
                  onClick={() => setBookingToCancel(null)}
                  disabled={cancelling}
                >
                  Keep Booking
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-danger d-flex align-items-center gap-1"
                  onClick={handleCancelConfirm}
                  disabled={cancelling}
                >
                  {cancelling ? (
                    <span className="spinner-border spinner-border-sm"></span>
                  ) : (
                    <XCircle size={15} />
                  )}
                  <span>Confirm Cancellation</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingHistoryPage;

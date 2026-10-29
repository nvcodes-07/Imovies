import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { resetBookingState } from '../redux/slices/bookingSlice';
import api from '../api/axios';
import { toast } from 'react-toastify';
import MoviePoster from '../components/MoviePoster';
import {
  CreditCard,
  Smartphone,
  Building,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  ChevronLeft,
  Lock,
} from 'lucide-react';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { user } = useSelector((state) => state.auth);
  const { activeShow, selectedSeats, seatDetails, convenienceFeePerTicket } = useSelector(
    (state) => state.booking
  );

  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [upiId, setUpiId] = useState('neev@okaxis');
  const [cardNumber, setCardNumber] = useState('4532 •••• •••• 8892');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('889');

  const [processing, setProcessing] = useState(false);
  const [paymentFailedError, setPaymentFailedError] = useState(null);

  // If page is accessed directly without show selection
  if (!activeShow || selectedSeats.length === 0) {
    return (
      <div className="container py-5 text-center">
        <h4>No active checkout session</h4>
        <p className="text-muted small">
          Please select a movie and seats before proceeding to checkout.
        </p>
        <Link to="/movies" className="btn btn-sm btn-cinema mt-2">
          Browse Movies
        </Link>
      </div>
    );
  }

  const ticketSubtotal = seatDetails.reduce((sum, s) => sum + s.price, 0);
  const totalFees = selectedSeats.length * convenienceFeePerTicket;
  const grandTotal = ticketSubtotal + totalFees;

  // Process Successful Payment and Confirmation
  const handleSimulateSuccess = async () => {
    try {
      setProcessing(true);
      setPaymentFailedError(null);

      // Create booking on server (re-validates seats atomically)
      const res = await api.post('/bookings', {
        showId: activeShow._id,
        seatNumbers: selectedSeats,
        paymentMethodType: paymentMethod,
      });

      if (res.data.success) {
        toast.success('Payment authorized and booking confirmed!');
        dispatch(resetBookingState());
        navigate(`/booking-success/${res.data.booking._id}`, {
          state: { booking: res.data.booking },
        });
      }
    } catch (err) {
      const msg =
        err.response?.data?.message || 'Booking confirmation failed. Please try again.';
      toast.error(msg);
      setPaymentFailedError(msg);
    } finally {
      setProcessing(false);
    }
  };

  // Process Simulated Payment Failure for Viva Demonstration
  const handleSimulateFailure = async () => {
    try {
      setProcessing(true);
      setPaymentFailedError(null);

      await api.post('/payments/demo', {
        showId: activeShow._id,
        seatNumbers: selectedSeats,
        amount: grandTotal,
        paymentMethodType: paymentMethod,
        simulateOutcome: 'failure',
      });
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        'Simulated payment declined by gateway. Temporary seat hold released.';
      toast.error(msg);
      setPaymentFailedError(msg);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="container py-4">
      {/* Breadcrumb Header */}
      <div className="d-flex align-items-center gap-2 mb-4">
        <button
          onClick={() => navigate(-1)}
          className="btn btn-light btn-sm border d-flex align-items-center gap-1"
        >
          <ChevronLeft size={16} />
          <span>Back to Seats</span>
        </button>
        <h4 className="fw-bold mb-0 ms-2">Secure Checkout & Payment</h4>
      </div>

      <div className="row g-4">
        {/* Left Column: Simulated Payment Form */}
        <div className="col-12 col-lg-7">
          <div className="bg-white p-4 rounded-3 border mb-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold mb-0">Select Payment Method</h5>
              <span className="badge bg-light text-muted border d-flex align-items-center gap-1">
                <Lock size={12} />
                <span>Simulated Demo Gateway</span>
              </span>
            </div>

            <div className="alert alert-info py-2 px-3 small d-flex align-items-center gap-2 mb-4">
              <ShieldCheck size={18} className="text-info flex-shrink-0" />
              <span>
                <strong>College Assignment Demo:</strong> No real money or actual card numbers will be charged.
              </span>
            </div>

            {/* Payment Method Selector Tabs */}
            <div className="d-flex gap-2 mb-4">
              <button
                type="button"
                className={`btn btn-sm flex-fill py-2 border d-flex align-items-center justify-content-center gap-2 rounded-3 ${
                  paymentMethod === 'upi' ? 'btn-danger' : 'btn-light'
                }`}
                onClick={() => setPaymentMethod('upi')}
              >
                <Smartphone size={16} />
                <span>UPI (GPay/PhonePe)</span>
              </button>

              <button
                type="button"
                className={`btn btn-sm flex-fill py-2 border d-flex align-items-center justify-content-center gap-2 rounded-3 ${
                  paymentMethod === 'credit_card' ? 'btn-danger' : 'btn-light'
                }`}
                onClick={() => setPaymentMethod('credit_card')}
              >
                <CreditCard size={16} />
                <span>Card (Debit/Credit)</span>
              </button>

              <button
                type="button"
                className={`btn btn-sm flex-fill py-2 border d-flex align-items-center justify-content-center gap-2 rounded-3 ${
                  paymentMethod === 'net_banking' ? 'btn-danger' : 'btn-light'
                }`}
                onClick={() => setPaymentMethod('net_banking')}
              >
                <Building size={16} />
                <span>Net Banking</span>
              </button>
            </div>

            {/* Payment Details Inputs */}
            {paymentMethod === 'upi' && (
              <div className="mb-4">
                <label className="form-label small fw-semibold text-muted">Virtual Payment Address (VPA / UPI ID)</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="username@bank"
                />
                <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                  A demo confirmation request will be simulated on this UPI ID.
                </span>
              </div>
            )}

            {paymentMethod === 'credit_card' && (
              <div className="mb-4">
                <div className="mb-3">
                  <label className="form-label small fw-semibold text-muted">Card Number</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                  />
                </div>
                <div className="row g-2">
                  <div className="col-6">
                    <label className="form-label small fw-semibold text-muted">Expiry</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label small fw-semibold text-muted">CVV</label>
                    <input
                      type="password"
                      className="form-control form-control-sm"
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === 'net_banking' && (
              <div className="mb-4">
                <label className="form-label small fw-semibold text-muted">Select Bank</label>
                <select className="form-select form-select-sm">
                  <option>State Bank of India (SBI)</option>
                  <option>HDFC Bank</option>
                  <option>ICICI Bank</option>
                  <option>Axis Bank</option>
                </select>
              </div>
            )}

            {/* Error Message if Simulation Failed */}
            {paymentFailedError && (
              <div className="alert alert-danger py-2 px-3 small d-flex align-items-center gap-2 mb-4">
                <AlertTriangle size={18} className="flex-shrink-0" />
                <div>
                  <strong>Payment Failed:</strong> {paymentFailedError}
                </div>
              </div>
            )}

            {/* Action Buttons: Success and Failure Outcome for Viva */}
            <div className="d-flex flex-column gap-2 mt-4 pt-3 border-top">
              <button
                className="btn btn-cinema py-2 fw-bold d-flex align-items-center justify-content-center gap-2"
                onClick={handleSimulateSuccess}
                disabled={processing}
              >
                {processing ? (
                  <span className="spinner-border spinner-border-sm"></span>
                ) : (
                  <CheckCircle size={18} />
                )}
                <span>Simulate Successful Payment (₹{grandTotal})</span>
              </button>

              <button
                className="btn btn-outline-danger btn-sm py-2"
                onClick={handleSimulateFailure}
                disabled={processing}
              >
                Simulate Gateway Failure (Test Rollback)
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Order Details */}
        <div className="col-12 col-lg-5">
          <div className="bg-white p-4 rounded-3 border">
            <h5 className="fw-bold mb-3">Order Details</h5>

            <div className="d-flex gap-3 mb-3 pb-3 border-bottom">
              <div style={{ width: '60px', height: '80px', flexShrink: 0 }}>
                <MoviePoster
                  src={activeShow.movieId?.posterUrl}
                  title={activeShow.movieId?.title}
                  aspectRatio="2 / 3"
                  rounded="rounded-2"
                  alt={activeShow.movieId?.title}
                />
              </div>
              <div>
                <h6 className="fw-bold mb-1">{activeShow.movieId?.title}</h6>
                <p className="text-muted small mb-1">{activeShow.theatreId?.name}</p>
                <p className="text-muted small mb-0">
                  {activeShow.showDate} • {activeShow.startTime}
                </p>
              </div>
            </div>

            <div className="mb-3 pb-3 border-bottom">
              <div className="small text-muted mb-2">Booked Seats ({selectedSeats.length}):</div>
              <div className="d-flex flex-wrap gap-2">
                {seatDetails.map((seat) => (
                  <span
                    key={seat.seatNumber}
                    className="badge bg-light text-dark border px-2 py-1"
                  >
                    <strong>{seat.seatNumber}</strong> ({seat.category} - ₹{seat.price})
                  </span>
                ))}
              </div>
            </div>

            <div className="mb-3 pb-3 border-bottom small">
              <div className="d-flex justify-content-between text-muted mb-1">
                <span>Tickets Subtotal</span>
                <span>₹{ticketSubtotal}</span>
              </div>
              <div className="d-flex justify-content-between text-muted mb-1">
                <span>Convenience Fee (₹25/ticket)</span>
                <span>₹{totalFees}</span>
              </div>
              <div className="d-flex justify-content-between fw-bold fs-5 pt-2 border-top text-dark">
                <span>Total Payable</span>
                <span className="text-danger">₹{grandTotal}</span>
              </div>
            </div>

            <div className="small text-muted">
              <strong>Customer:</strong> {user?.name} ({user?.email})
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;

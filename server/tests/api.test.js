const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { app } = require('../server');
const User = require('../models/User');
const Movie = require('../models/Movie');
const Theatre = require('../models/Theatre');
const Show = require('../models/Show');
const Seat = require('../models/Seat');
const Booking = require('../models/Booking');
const { generateSeatsForShow } = require('../services/seatService');

let mongoServer;
let userToken;
let adminToken;
let testUserId;
let testMovie;
let testTheatre;
let testShow;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  // 1. Create test admin and user
  const admin = await User.create({
    name: 'Admin Tester',
    email: 'admin_test@imovies.com',
    password: 'Password123',
    role: 'admin',
  });

  const user = await User.create({
    name: 'User Tester',
    email: 'user_test@imovies.com',
    password: 'Password123',
    role: 'user',
  });
  testUserId = user._id;

  // Log in to get tokens
  const adminLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin_test@imovies.com', password: 'Password123' });
  adminToken = adminLogin.body.token;

  const userLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'user_test@imovies.com', password: 'Password123' });
  userToken = userLogin.body.token;

  // 2. Create test movie
  testMovie = await Movie.create({
    title: 'Test Movie Alpha',
    description: 'An exciting test cinema experience.',
    genre: ['Action', 'Sci-Fi'],
    language: 'English',
    duration: 120,
    releaseDate: new Date(),
    posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401',
    status: 'now_showing',
  });

  // 3. Create test theatre
  testTheatre = await Theatre.create({
    name: 'Grand Test Multiplex',
    location: 'Cyber City',
    address: '100 Tech Park Way',
    city: 'Mumbai',
    seatingConfiguration: {
      totalScreens: 1,
      screens: [
        {
          screenNumber: 1,
          name: 'Audi 1',
          totalRows: 4,
          seatsPerRow: 6,
          categories: [
            { name: 'Classic', rows: ['A', 'B'], basePrice: 150 },
            { name: 'Prime', rows: ['C', 'D'], basePrice: 250 },
          ],
        },
      ],
    },
  });

  // 4. Create test show 3 days in future
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 3);
  const futureDateStr = futureDate.toISOString().split('T')[0];

  testShow = await Show.create({
    movieId: testMovie._id,
    theatreId: testTheatre._id,
    screenNumber: 1,
    showDate: futureDateStr,
    startTime: '08:00 PM',
    ticketPricing: { classic: 150, prime: 250, recliner: 400 },
    status: 'scheduled',
  });

  await generateSeatsForShow(testShow._id, testTheatre, 1, testShow.ticketPricing);
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

describe('1. Authentication and Authorization', () => {
  it('should register a new customer with hashed password and user role', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'New Tester',
        email: 'newtester@imovies.com',
        password: 'Password123',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe('user');
  });

  it('should prevent duplicate email registration', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Duplicate',
        email: 'newtester@imovies.com',
        password: 'Password123',
      });

    expect(res.statusCode).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('should fail login with wrong credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'newtester@imovies.com',
        password: 'WrongPassword!',
      });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should forbid standard users from accessing admin statistics', async () => {
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('should permit administrators to access admin statistics', async () => {
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.stats.totalMovies).toBeDefined();
  });
});

describe('2. Movie and Shows Catalog', () => {
  it('should list movies with server-side filters', async () => {
    const res = await request(app)
      .get('/api/movies?genre=Action&language=English');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.movies.length).toBeGreaterThan(0);
  });

  it('should return movie details and showtimes', async () => {
    const res = await request(app).get(`/api/movies/${testMovie._id}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.movie.title).toBe('Test Movie Alpha');
  });

  it('should return seating layout for a show', async () => {
    const res = await request(app).get(`/api/shows/${testShow._id}/seats`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.summary.totalSeats).toBeGreaterThan(0);
    expect(res.body.summary.availableSeats).toBe(res.body.summary.totalSeats);
  });
});

describe('3. Booking and Double-Booking Prevention', () => {
  let createdBookingId;

  it('should successfully book available seats', async () => {
    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        showId: testShow._id,
        seatNumbers: ['A1', 'A2'],
        paymentMethodType: 'upi',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.booking.bookingReference).toMatch(/^IMV-/);
    expect(res.body.booking.seats.length).toBe(2);
    createdBookingId = res.body.booking._id;
  });

  it('should reject double-booking attempt for the same seats (409 Conflict)', async () => {
    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        showId: testShow._id,
        seatNumbers: ['A1'], // Already booked
        paymentMethodType: 'credit_card',
      });

    expect(res.statusCode).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('should allow user to view their own bookings', async () => {
    const res = await request(app)
      .get('/api/bookings/my')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.bookings.length).toBeGreaterThan(0);
  });

  it('should successfully cancel eligible booking and release seats', async () => {
    const res = await request(app)
      .patch(`/api/bookings/${createdBookingId}/cancel`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.booking.bookingStatus).toBe('cancelled');

    // Verify seats are available again
    const seatRes = await request(app).get(`/api/shows/${testShow._id}/seats`);
    const seatA1 = seatRes.body.seats.find((s) => s.seatNumber === 'A1');
    expect(seatA1.status).toBe('available');
  });

  it('should reject cancellation of an already cancelled booking', async () => {
    const res = await request(app)
      .patch(`/api/bookings/${createdBookingId}/cancel`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe('4. Movie Metadata, Trailer, and Admin Management', () => {
  let createdMovieId;

  it('should successfully create a movie with authentic poster, trailer, runtime, cast and certification', async () => {
    const res = await request(app)
      .post('/api/movies')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Inception 2: Dreamverse',
        synopsis: 'A mind-bending heist thriller through subconscious reality.',
        genre: ['Sci-Fi', 'Action'],
        language: 'English',
        runtimeMinutes: 148,
        certification: 'U/A 16+',
        director: 'Christopher Nolan',
        releaseDate: '2026-11-20',
        posterUrl: 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
        trailerUrl: 'https://www.youtube.com/watch?v=YoHD9XEInc0',
        cast: [
          { name: 'Leonardo DiCaprio', character: 'Dom Cobb' },
          { name: 'Joseph Gordon-Levitt', character: 'Arthur' },
        ],
        status: 'coming_soon',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.movie.title).toBe('Inception 2: Dreamverse');
    expect(res.body.movie.runtimeMinutes).toBe(148);
    expect(res.body.movie.duration).toBe(148);
    expect(res.body.movie.director).toBe('Christopher Nolan');
    expect(res.body.movie.certification).toBe('U/A 16+');
    expect(res.body.movie.trailerUrl).toBe('https://www.youtube.com/watch?v=YoHD9XEInc0');
    expect(res.body.movie.cast[0].character).toBe('Dom Cobb');
    createdMovieId = res.body.movie._id;
  });

  it('should reject movie creation with an invalid YouTube trailer URL', async () => {
    const res = await request(app)
      .post('/api/movies')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Broken Trailer Movie',
        synopsis: 'Test synopsis',
        genre: ['Action'],
        language: 'English',
        runtimeMinutes: 120,
        releaseDate: '2026-11-20',
        posterUrl: 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
        trailerUrl: 'https://notyoutube.com/fake-trailer-video',
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors.trailerUrl).toBeDefined();
  });

  it('should reject movie creation with negative or zero runtime', async () => {
    const res = await request(app)
      .post('/api/movies')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Zero Runtime Movie',
        synopsis: 'Test synopsis',
        genre: ['Action'],
        language: 'English',
        runtimeMinutes: 0,
        releaseDate: '2026-11-20',
        posterUrl: 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors.runtimeMinutes).toBeDefined();
  });

  it('should reject movie creation when required fields are missing', async () => {
    const res = await request(app)
      .post('/api/movies')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        language: 'English',
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors.title).toBeDefined();
    expect(res.body.errors.synopsis).toBeDefined();
  });

  it('should allow admin to update movie trailer, runtime, and cast', async () => {
    const res = await request(app)
      .put(`/api/movies/${createdMovieId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        trailerUrl: 'https://youtu.be/8hP9D6kZseM',
        runtimeMinutes: 155,
        director: 'Christopher Nolan & Team',
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.movie.runtimeMinutes).toBe(155);
    expect(res.body.movie.duration).toBe(155);
    expect(res.body.movie.director).toBe('Christopher Nolan & Team');
  });

  it('should forbid non-admin users from creating movies', async () => {
    const res = await request(app)
      .post('/api/movies')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        title: 'Unauthorized Movie',
        synopsis: 'This should be blocked',
        genre: ['Comedy'],
        language: 'English',
        runtimeMinutes: 90,
        releaseDate: '2026-12-01',
        posterUrl: 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
      });

    expect(res.statusCode).toBe(403);
  });
});

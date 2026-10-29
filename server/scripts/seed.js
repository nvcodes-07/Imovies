require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');
const Movie = require('../models/Movie');
const Theatre = require('../models/Theatre');
const Show = require('../models/Show');
const Seat = require('../models/Seat');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Notification = require('../models/Notification');
const { generateSeatsForShow } = require('../services/seatService');

const seedDatabase = async (shouldExit = true) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      console.log('[Seed] Connecting to database...');
      await connectDB();
    }

    console.log('[Seed] Clearing existing collection data...');
    await Promise.all([
      User.deleteMany({}),
      Movie.deleteMany({}),
      Theatre.deleteMany({}),
      Show.deleteMany({}),
      Seat.deleteMany({}),
      Booking.deleteMany({}),
      Payment.deleteMany({}),
      Notification.deleteMany({}),
    ]);

    console.log('[Seed] Creating demo users...');
    const adminUser = await User.create({
      name: 'Cinema Admin',
      email: 'admin@imovies.com',
      password: 'AdminPassword123',
      role: 'admin',
      phone: '+91 98765 43210',
    });

    const demoUser = await User.create({
      name: 'Neev Nagaria',
      email: 'user@imovies.com',
      password: 'UserPassword123',
      role: 'user',
      phone: '+91 98111 22334',
    });

    console.log(`[Seed] Created Admin: admin@imovies.com / AdminPassword123`);
    console.log(`[Seed] Created User: user@imovies.com / UserPassword123`);

    console.log('[Seed] Creating realistic movies...');
    const moviesData = [
      {
        title: 'Interstellar',
        description:
          'When Earth becomes increasingly uninhabitable in the future, a farmer and ex-NASA pilot, Joseph Cooper, is tasked to pilot a spacecraft, along with a team of researchers, to find a new planet for humans.',
        synopsis:
          'When Earth becomes increasingly uninhabitable in the future, a farmer and ex-NASA pilot, Joseph Cooper, is tasked to pilot a spacecraft, along with a team of researchers, to find a new planet for humans.',
        genre: ['Sci-Fi', 'Adventure', 'Drama'],
        genres: ['Sci-Fi', 'Adventure', 'Drama'],
        language: 'English',
        duration: 169,
        runtimeMinutes: 169,
        certification: 'U/A 13+',
        director: 'Christopher Nolan',
        releaseDate: new Date('2024-11-07'),
        posterUrl: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
        backdropUrl: 'https://image.tmdb.org/t/p/original/rAiYTsqOdikIpQm9XZ5MDfiEg0T.jpg',
        trailerUrl: 'https://www.youtube.com/watch?v=zSWdZVtXT7E',
        cast: [
          { name: 'Matthew McConaughey', character: 'Joseph Cooper', role: 'Cooper' },
          { name: 'Anne Hathaway', character: 'Dr. Amelia Brand', role: 'Brand' },
          { name: 'Jessica Chastain', character: 'Murphy Cooper (Murph)', role: 'Murph' },
          { name: 'Michael Caine', character: 'Professor John Brand', role: 'Professor Brand' },
          { name: 'Matt Damon', character: 'Dr. Mann', role: 'Dr. Mann' },
        ],
        rating: 9.2,
        status: 'now_showing',
      },
      {
        title: 'The Dark Knight',
        description:
          'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.',
        synopsis:
          'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.',
        genre: ['Action', 'Crime', 'Drama'],
        genres: ['Action', 'Crime', 'Drama'],
        language: 'English',
        duration: 152,
        runtimeMinutes: 152,
        certification: 'U/A 16+',
        director: 'Christopher Nolan',
        releaseDate: new Date('2024-07-18'),
        posterUrl: 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
        backdropUrl: 'https://image.tmdb.org/t/p/original/oOvqlvO51F3Tsl1h2LupL4Xv0rE.jpg',
        trailerUrl: 'https://www.youtube.com/watch?v=EXeTwQWrcwY',
        cast: [
          { name: 'Christian Bale', character: 'Bruce Wayne / Batman', role: 'Batman' },
          { name: 'Heath Ledger', character: 'The Joker', role: 'Joker' },
          { name: 'Aaron Eckhart', character: 'Harvey Dent / Two-Face', role: 'Harvey Dent' },
          { name: 'Gary Oldman', character: 'James Gordon', role: 'Jim Gordon' },
          { name: 'Morgan Freeman', character: 'Lucius Fox', role: 'Lucius Fox' },
        ],
        rating: 9.0,
        status: 'now_showing',
      },
      {
        title: 'Dune: Part Two',
        description:
          'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family. Facing a choice between love and destiny, he endeavors to prevent a terrible future.',
        synopsis:
          'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family. Facing a choice between love and destiny, he endeavors to prevent a terrible future.',
        genre: ['Sci-Fi', 'Action', 'Adventure'],
        genres: ['Sci-Fi', 'Action', 'Adventure'],
        language: 'English',
        duration: 166,
        runtimeMinutes: 166,
        certification: 'U/A 13+',
        director: 'Denis Villeneuve',
        releaseDate: new Date('2025-03-01'),
        posterUrl: 'https://image.tmdb.org/t/p/w500/6izwz7rsy95ARzTR3poZ8H6c5pp.jpg',
        backdropUrl: 'https://image.tmdb.org/t/p/original/xOMo8BRK7PfcJv9JCnx7s520dQq.jpg',
        trailerUrl: 'https://www.youtube.com/watch?v=Way9Dexny3w',
        cast: [
          { name: 'Timothée Chalamet', character: 'Paul Atreides', role: 'Paul Atreides' },
          { name: 'Zendaya', character: 'Chani', role: 'Chani' },
          { name: 'Rebecca Ferguson', character: 'Lady Jessica', role: 'Lady Jessica' },
          { name: 'Javier Bardem', character: 'Stilgar', role: 'Stilgar' },
          { name: 'Austin Butler', character: 'Feyd-Rautha Harkonnen', role: 'Feyd-Rautha' },
        ],
        rating: 8.8,
        status: 'now_showing',
      },
      {
        title: 'Kalki 2898 AD',
        description:
          'A modern-day avatar of Vishnu, a Hindu god, who is believed to have descended to the earth to protect the world from evil forces in a dystopian futuristic city.',
        synopsis:
          'A modern-day avatar of Vishnu, a Hindu god, who is believed to have descended to the earth to protect the world from evil forces in a dystopian futuristic city.',
        genre: ['Action', 'Sci-Fi', 'Fantasy'],
        genres: ['Action', 'Sci-Fi', 'Fantasy'],
        language: 'Hindi',
        duration: 181,
        runtimeMinutes: 181,
        certification: 'U/A 13+',
        director: 'Nag Ashwin',
        releaseDate: new Date('2024-06-27'),
        posterUrl: 'https://image.tmdb.org/t/p/w500/o8XSR1SONnjcsv84NRu6Mwsl5io.jpg',
        backdropUrl: 'https://image.tmdb.org/t/p/original/siIB5aWcWz7376J2pT9Dphz6a5p.jpg',
        trailerUrl: 'https://www.youtube.com/watch?v=kQDd1AhGIHk',
        cast: [
          { name: 'Prabhas', character: 'Bhairava', role: 'Bhairava' },
          { name: 'Amitabh Bachchan', character: 'Ashwatthama', role: 'Ashwatthama' },
          { name: 'Kamal Haasan', character: 'Supreme Yaskin', role: 'Supreme Yaskin' },
          { name: 'Deepika Padukone', character: 'SUM-80 / Sumathi', role: 'SUM-80' },
          { name: 'Disha Patani', character: 'Roxie', role: 'Roxie' },
        ],
        rating: 8.5,
        status: 'now_showing',
      },
      {
        title: 'Oppenheimer',
        description:
          'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb during World War II.',
        synopsis:
          'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb during World War II.',
        genre: ['Biography', 'Drama', 'History'],
        genres: ['Biography', 'Drama', 'History'],
        language: 'English',
        duration: 180,
        runtimeMinutes: 180,
        certification: 'A',
        director: 'Christopher Nolan',
        releaseDate: new Date('2024-07-21'),
        posterUrl: 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
        backdropUrl: 'https://image.tmdb.org/t/p/original/fm6K9vY9wgYECYrNxMBvPFF1CqO.jpg',
        trailerUrl: 'https://www.youtube.com/watch?v=uYPbbksJxIg',
        cast: [
          { name: 'Cillian Murphy', character: 'J. Robert Oppenheimer', role: 'J. Robert Oppenheimer' },
          { name: 'Emily Blunt', character: 'Katherine "Kitty" Oppenheimer', role: 'Katherine Oppenheimer' },
          { name: 'Matt Damon', character: 'Lt. Gen. Leslie Groves', role: 'Leslie Groves' },
          { name: 'Robert Downey Jr.', character: 'Lewis Strauss', role: 'Lewis Strauss' },
          { name: 'Florence Pugh', character: 'Jean Tatlock', role: 'Jean Tatlock' },
        ],
        rating: 8.9,
        status: 'now_showing',
      },
      {
        title: 'Spider-Man: Across the Spider-Verse',
        description:
          'Miles Morales embarks on a high-stakes adventure across alternate dimensions alongside Gwen Stacy and an elite squad of Spider-Heroes to protect the fabric of reality.',
        synopsis:
          'Miles Morales embarks on a high-stakes adventure across alternate dimensions alongside Gwen Stacy and an elite squad of Spider-Heroes to protect the fabric of reality.',
        genre: ['Animation', 'Action', 'Adventure'],
        genres: ['Animation', 'Action', 'Adventure'],
        language: 'English',
        duration: 140,
        runtimeMinutes: 140,
        certification: 'U',
        director: 'Joaquim Dos Santos, Kemp Powers',
        releaseDate: new Date('2026-12-15'),
        posterUrl: 'https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg',
        backdropUrl: 'https://image.tmdb.org/t/p/original/4HodYYKEIsGOdinkGi2Ucz6X9i0.jpg',
        trailerUrl: 'https://www.youtube.com/watch?v=cqGjhVJWtEg',
        cast: [
          { name: 'Shameik Moore', character: 'Miles Morales / Spider-Man', role: 'Miles Morales' },
          { name: 'Hailee Steinfeld', character: 'Gwen Stacy / Spider-Woman', role: 'Gwen Stacy' },
          { name: 'Oscar Isaac', character: 'Miguel O’Hara / Spider-Man 2099', role: 'Miguel O’Hara' },
          { name: 'Daniel Kaluuya', character: 'Hobart "Hobie" Brown / Spider-Punk', role: 'Spider-Punk' },
        ],
        rating: 9.1,
        status: 'coming_soon',
      },
      {
        title: 'Avatar: The Way of Water',
        description:
          'Jake Sully lives with his newfound family formed on the extrasolar moon Pandora. Once a familiar threat returns to finish what was previously started, Jake must work with Neytiri and the army of the Na\'vi race to protect their home.',
        synopsis:
          'Jake Sully lives with his newfound family formed on the extrasolar moon Pandora. Once a familiar threat returns to finish what was previously started, Jake must work with Neytiri and the army of the Na\'vi race to protect their home.',
        genre: ['Sci-Fi', 'Action', 'Adventure'],
        genres: ['Sci-Fi', 'Action', 'Adventure'],
        language: 'English',
        duration: 192,
        runtimeMinutes: 192,
        certification: 'U/A 13+',
        director: 'James Cameron',
        releaseDate: new Date('2026-12-19'),
        posterUrl: 'https://image.tmdb.org/t/p/w500/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg',
        backdropUrl: 'https://image.tmdb.org/t/p/original/s16H6tpK2utvwDtzZ8Qy4qm5Emw.jpg',
        trailerUrl: 'https://www.youtube.com/watch?v=d9MyW72ELq0',
        cast: [
          { name: 'Sam Worthington', character: 'Jake Sully', role: 'Jake Sully' },
          { name: 'Zoe Saldana', character: 'Neytiri', role: 'Neytiri' },
          { name: 'Sigourney Weaver', character: 'Kiri', role: 'Kiri' },
          { name: 'Stephen Lang', character: 'Colonel Miles Quaritch', role: 'Miles Quaritch' },
          { name: 'Kate Winslet', character: 'Ronal', role: 'Ronal' },
        ],
        rating: 8.7,
        status: 'coming_soon',
      },
    ];

    const createdMovies = await Movie.insertMany(moviesData);
    console.log(`[Seed] Seeded ${createdMovies.length} movies.`);

    console.log('[Seed] Creating theatres...');
    const theatresData = [
      {
        name: 'PVR ICON: Infiniti Mall',
        location: 'Versova, Andheri West',
        address: 'Infiniti Mall, Link Road, Andheri West, Mumbai, Maharashtra 400053',
        city: 'Mumbai',
        seatingConfiguration: {
          totalScreens: 3,
          screens: [
            {
              screenNumber: 1,
              name: 'Audi 1 - IMAX with Laser',
              totalRows: 8,
              seatsPerRow: 10,
              categories: [
                { name: 'Classic', rows: ['A', 'B', 'C', 'D'], basePrice: 200 },
                { name: 'Prime', rows: ['E', 'F', 'G'], basePrice: 320 },
                { name: 'Recliner', rows: ['H'], basePrice: 500 },
              ],
            },
            {
              screenNumber: 2,
              name: 'Audi 2 - Dolby Atmos 4K',
              totalRows: 8,
              seatsPerRow: 10,
              categories: [
                { name: 'Classic', rows: ['A', 'B', 'C', 'D'], basePrice: 180 },
                { name: 'Prime', rows: ['E', 'F', 'G'], basePrice: 280 },
                { name: 'Recliner', rows: ['H'], basePrice: 450 },
              ],
            },
          ],
        },
        facilities: ['IMAX Laser', 'Dolby Atmos', 'Valet Parking', 'Gourmet Lounge', 'Wheelchair Friendly'],
        contactInfo: { phone: '+91 22 6677 8899', email: 'infiniti@pvr.cinemas' },
      },
      {
        name: 'INOX Megaplex: Inorbit Mall',
        location: 'Malad West',
        address: 'Inorbit Mall, Link Road, Malad West, Mumbai, Maharashtra 400064',
        city: 'Mumbai',
        seatingConfiguration: {
          totalScreens: 2,
          screens: [
            {
              screenNumber: 1,
              name: 'Audi 1 - ScreenX',
              totalRows: 8,
              seatsPerRow: 10,
              categories: [
                { name: 'Classic', rows: ['A', 'B', 'C', 'D'], basePrice: 190 },
                { name: 'Prime', rows: ['E', 'F', 'G'], basePrice: 300 },
                { name: 'Recliner', rows: ['H'], basePrice: 480 },
              ],
            },
          ],
        },
        facilities: ['ScreenX 270°', 'Dolby 7.1', 'Food Court', 'Free WiFi'],
        contactInfo: { phone: '+91 22 4000 1122', email: 'inorbit@inox.cinemas' },
      },
      {
        name: 'Cinepolis VIP: Forum Shantiniketan',
        location: 'Whitefield',
        address: 'Forum Shantiniketan Mall, ITPL Main Road, Whitefield, Bengaluru, Karnataka 560067',
        city: 'Bengaluru',
        seatingConfiguration: {
          totalScreens: 2,
          screens: [
            {
              screenNumber: 1,
              name: 'Audi 1 - VIP Luxury Recliner',
              totalRows: 7,
              seatsPerRow: 8,
              categories: [
                { name: 'Prime', rows: ['A', 'B', 'C', 'D'], basePrice: 350 },
                { name: 'Recliner', rows: ['E', 'F', 'G'], basePrice: 550 },
              ],
            },
          ],
        },
        facilities: ['Full Recliner', 'In-Seat Dining', 'Dolby Atmos', 'VIP Valet'],
        contactInfo: { phone: '+91 80 4455 6677', email: 'whitefield@cinepolis.com' },
      },
      {
        name: 'PVR Superplex: Logix City Center',
        location: 'Sector 32',
        address: 'Logix City Center, Sector 32, Noida, Uttar Pradesh 201301',
        city: 'Delhi NCR',
        seatingConfiguration: {
          totalScreens: 2,
          screens: [
            {
              screenNumber: 1,
              name: 'Audi 1 - IMAX 3D',
              totalRows: 8,
              seatsPerRow: 10,
              categories: [
                { name: 'Classic', rows: ['A', 'B', 'C', 'D'], basePrice: 210 },
                { name: 'Prime', rows: ['E', 'F', 'G'], basePrice: 340 },
                { name: 'Recliner', rows: ['H'], basePrice: 520 },
              ],
            },
          ],
        },
        facilities: ['IMAX 3D', '4DX Motion', 'Food Hall', 'Kids Zone'],
        contactInfo: { phone: '+91 120 4567 890', email: 'logix@pvr.cinemas' },
      },
    ];

    const createdTheatres = await Theatre.insertMany(theatresData);
    console.log(`[Seed] Seeded ${createdTheatres.length} theatres.`);

    console.log('[Seed] Generating shows and auditorium seats...');
    // Schedule shows for today and next 3 days
    const today = new Date();
    const dateStrings = [];
    for (let i = 0; i <= 3; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      dateStrings.push(d.toISOString().split('T')[0]);
    }

    const showTimes = ['10:30 AM', '02:00 PM', '05:30 PM', '09:00 PM'];
    const nowShowingMovies = createdMovies.filter((m) => m.status === 'now_showing');

    const scheduledShows = [];

    // Schedule shows across theatres
    for (const theatre of createdTheatres) {
      for (let sIndex = 0; sIndex < nowShowingMovies.length; sIndex++) {
        const movie = nowShowingMovies[sIndex];
        const screenNum = (sIndex % (theatre.seatingConfiguration?.screens?.length || 1)) + 1;
        const timeSlot = showTimes[sIndex % showTimes.length];

        for (const dateStr of dateStrings) {
          const show = await Show.create({
            movieId: movie._id,
            theatreId: theatre._id,
            screenNumber: screenNum,
            showDate: dateStr,
            startTime: timeSlot,
            endTime: '03h 00m later',
            ticketPricing: {
              classic: 190,
              prime: 290,
              recliner: 480,
            },
            status: 'scheduled',
          });

          // Generate seats for this show!
          await generateSeatsForShow(show._id, theatre, screenNum, show.ticketPricing);
          scheduledShows.push(show);
        }
      }
    }

    console.log(`[Seed] Successfully scheduled ${scheduledShows.length} shows and populated seats.`);

    // Create a demo confirmed booking for the demo user on the first show
    if (scheduledShows.length > 0) {
      const firstShow = scheduledShows[0];
      const seatsToBook = await Seat.find({
        showId: firstShow._id,
        seatNumber: { $in: ['E4', 'E5'] },
      });

      if (seatsToBook.length === 2) {
        const bookingRef = 'IMV-7K9A2X';
        const totalAmount = seatsToBook.reduce((s, seat) => s + seat.price, 0);

        const demoBooking = await Booking.create({
          bookingReference: bookingRef,
          userId: demoUser._id,
          showId: firstShow._id,
          movieId: firstShow.movieId,
          theatreId: firstShow.theatreId,
          seats: seatsToBook.map((s) => ({
            seatNumber: s.seatNumber,
            row: s.row,
            col: s.col,
            category: s.category,
            price: s.price,
          })),
          totalAmount,
          bookingStatus: 'confirmed',
          paymentStatus: 'paid',
          paymentReference: 'TXN-DEMO87654321',
        });

        // Mark seats as booked
        await Seat.updateMany(
          { _id: { $in: seatsToBook.map((s) => s._id) } },
          { $set: { status: 'booked', bookingId: demoBooking._id } }
        );

        // Create Payment record
        await Payment.create({
          bookingId: demoBooking._id,
          userId: demoUser._id,
          amount: totalAmount,
          paymentMethodType: 'upi',
          transactionReference: 'TXN-DEMO87654321',
          status: 'success',
          upiId: 'neev@okaxis',
        });

        // Create welcome notification
        await Notification.create({
          userId: demoUser._id,
          type: 'booking_confirmed',
          title: 'Welcome to IMovies!',
          message: `Your booking #${bookingRef} for ${nowShowingMovies[0].title} is confirmed at seats E4, E5!`,
          relatedBooking: demoBooking._id,
        });

        console.log(`[Seed] Created sample booking ${bookingRef} for user@imovies.com`);
      }
    }

    console.log('\n=========================================');
    console.log(' DATABASE SEEDED SUCCESSFULLY! ');
    console.log('=========================================');
    console.log('Admin Account: admin@imovies.com / AdminPassword123');
    console.log('User Account:  user@imovies.com / UserPassword123');
    console.log('=========================================\n');

    if (shouldExit) {
      await disconnectDB();
      process.exit(0);
    }
  } catch (error) {
    console.error('[Seed Error] Database seeding failed:', error);
    if (shouldExit) {
      await disconnectDB();
      process.exit(1);
    }
    throw error;
  }
};

const seedIfEmpty = async () => {
  try {
    const movieCount = await Movie.countDocuments();
    if (movieCount === 0) {
      console.log('[Seed] Database is empty. Auto-seeding initial movies, theatres and shows...');
      await seedDatabase(false);
    }
  } catch (error) {
    console.error('[Seed] Auto-seed check error:', error.message);
  }
};

if (require.main === module) {
  seedDatabase(true);
}

module.exports = { seedDatabase, seedIfEmpty };


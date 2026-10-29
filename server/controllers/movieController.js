const Movie = require('../models/Movie');
const Show = require('../models/Show');
const Booking = require('../models/Booking');

// Utility: Validate YouTube URL
const isValidYouTubeUrl = (url) => {
  if (!url || typeof url !== 'string') return true; // Optional if empty
  const trimmed = url.trim();
  if (trimmed === '') return true;
  const youtubeRegex = /^(https?:\/\/)?(www\.|m\.)?(youtube\.com\/(watch\?v=|embed\/|v\/)|youtu\.be\/)[a-zA-Z0-9_-]{11}(.*)?$/;
  return youtubeRegex.test(trimmed);
};

// Utility: Validate Web URL
const isValidUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (trimmed.startsWith('/uploads/')) return true;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch (e) {
    return false;
  }
};

// @desc    Get all movies with filtering, sorting and pagination
// @route   GET /api/movies
// @access  Public
const getMovies = async (req, res, next) => {
  try {
    const {
      search,
      genre,
      language,
      status,
      sort = '-releaseDate',
      page = 1,
      limit = 12,
    } = req.query;

    const query = {};

    // Search by title, description, synopsis, director, or cast
    if (search && search.trim() !== '') {
      const term = search.trim();
      query.$or = [
        { title: { $regex: term, $options: 'i' } },
        { description: { $regex: term, $options: 'i' } },
        { synopsis: { $regex: term, $options: 'i' } },
        { director: { $regex: term, $options: 'i' } },
        { 'cast.name': { $regex: term, $options: 'i' } },
      ];
    }

    // Filter by genre (supports both genre and genres array)
    if (genre && genre !== 'All') {
      const genreRegex = new RegExp(`^${genre.trim()}$`, 'i');
      query.$or = query.$or
        ? [
            ...query.$or,
            { genre: { $in: [genreRegex] } },
            { genres: { $in: [genreRegex] } },
          ]
        : [
            { genre: { $in: [genreRegex] } },
            { genres: { $in: [genreRegex] } },
          ];
    }

    // Filter by language
    if (language && language !== 'All') {
      query.language = { $regex: new RegExp(`^${language.trim()}$`, 'i') };
    }

    // Filter by status (now_showing / coming_soon / archived)
    if (status && status !== 'all') {
      query.status = status;
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 12;
    const skip = (pageNum - 1) * limitNum;

    // Handle sort field mapping (e.g., duration -> runtimeMinutes/duration)
    let sortField = sort;
    if (sort === 'duration' || sort === '-duration') {
      sortField = sort === '-duration' ? '-duration' : 'duration';
    }

    const total = await Movie.countDocuments(query);
    const movies = await Movie.find(query)
      .sort(sortField)
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: movies.length,
      total,
      totalPages: Math.ceil(total / limitNum) || 1,
      currentPage: pageNum,
      movies,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single movie by ID with available shows
// @route   GET /api/movies/:id
// @access  Public
const getMovieById = async (req, res, next) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found.',
      });
    }

    // Fetch active shows for this movie
    const todayStr = new Date().toISOString().split('T')[0];
    const shows = await Show.find({
      movieId: movie._id,
      status: 'scheduled',
      showDate: { $gte: todayStr },
    })
      .populate('theatreId', 'name location city address facilities')
      .sort({ showDate: 1, startTime: 1 });

    res.status(200).json({
      success: true,
      movie,
      shows,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new movie (Admin only)
// @route   POST /api/movies
// @access  Private/Admin
const createMovie = async (req, res, next) => {
  try {
    let {
      title,
      description,
      synopsis,
      genre,
      genres,
      language,
      duration,
      runtimeMinutes,
      releaseDate,
      posterUrl,
      backdropUrl,
      trailerUrl,
      cast,
      director,
      certification,
      rating,
      status,
    } = req.body;

    const validationErrors = {};

    // 1. Title validation
    if (!title || !title.trim()) {
      validationErrors.title = 'Movie title is required.';
    }

    // 2. Synopsis / Description validation
    const finalDescription = (synopsis || description || '').trim();
    if (!finalDescription) {
      validationErrors.synopsis = 'Movie synopsis / description is required.';
    }

    // 3. Language validation
    if (!language || !language.trim()) {
      validationErrors.language = 'Movie language is required.';
    }

    // 4. Release date validation
    if (!releaseDate) {
      validationErrors.releaseDate = 'Release date is required.';
    }

    // 5. Runtime / Duration validation (must be positive number)
    const rawRuntime = runtimeMinutes !== undefined ? runtimeMinutes : duration;
    const parsedRuntime = Number(rawRuntime);
    if (rawRuntime === undefined || isNaN(parsedRuntime) || parsedRuntime <= 0) {
      validationErrors.runtimeMinutes = 'Runtime must be a positive number of minutes (e.g. 120).';
    }

    // 6. Handle poster file or URL
    if (req.file) {
      posterUrl = `/uploads/${req.file.filename}`;
    }

    if (!posterUrl || !posterUrl.trim()) {
      validationErrors.posterUrl = 'Poster image URL or uploaded file is required.';
    } else if (!isValidUrl(posterUrl)) {
      validationErrors.posterUrl = 'Poster URL must be a valid URL (http://, https://, or /uploads/...).';
    }

    // 7. YouTube trailer URL validation
    if (trailerUrl && trailerUrl.trim()) {
      if (!isValidYouTubeUrl(trailerUrl.trim())) {
        validationErrors.trailerUrl = 'Trailer URL must be a valid YouTube URL (e.g. https://www.youtube.com/watch?v=...).';
      }
    }

    // Parse array fields if passed as JSON string from multipart form
    let parsedGenre = genre || genres;
    if (typeof parsedGenre === 'string') {
      try {
        parsedGenre = JSON.parse(parsedGenre);
      } catch (e) {
        parsedGenre = parsedGenre.split(',').map((g) => g.trim()).filter(Boolean);
      }
    }
    if (!parsedGenre || !Array.isArray(parsedGenre) || parsedGenre.length === 0) {
      validationErrors.genre = 'At least one genre is required.';
    }

    // Parse cast if provided
    let parsedCast = cast || [];
    if (typeof parsedCast === 'string') {
      try {
        parsedCast = JSON.parse(parsedCast);
      } catch (e) {
        parsedCast = parsedCast
          .split(',')
          .map((c) => c.trim())
          .filter(Boolean)
          .map((name) => ({ name, role: 'Actor', character: '' }));
      }
    }

    if (Object.keys(validationErrors).length > 0) {
      return res.status(400).json({
        success: false,
        message: Object.values(validationErrors)[0],
        errors: validationErrors,
      });
    }

    const movie = await Movie.create({
      title: title.trim(),
      description: finalDescription,
      synopsis: finalDescription,
      genre: parsedGenre,
      genres: parsedGenre,
      language: language.trim(),
      duration: parsedRuntime,
      runtimeMinutes: parsedRuntime,
      director: director ? director.trim() : '',
      certification: certification ? certification.trim() : 'U/A 13+',
      releaseDate,
      posterUrl: posterUrl.trim(),
      backdropUrl: backdropUrl ? backdropUrl.trim() : (posterUrl ? posterUrl.trim() : ''),
      trailerUrl: trailerUrl ? trailerUrl.trim() : '',
      cast: parsedCast,
      rating: rating !== undefined && rating !== '' ? Number(rating) : 8.0,
      status: status || 'now_showing',
    });

    res.status(201).json({
      success: true,
      message: 'Movie created successfully.',
      movie,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update movie (Admin only)
// @route   PUT /api/movies/:id
// @access  Private/Admin
const updateMovie = async (req, res, next) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found.',
      });
    }

    const updateData = { ...req.body };
    const validationErrors = {};

    // Validate fields if provided
    if (updateData.title !== undefined && !updateData.title.trim()) {
      validationErrors.title = 'Movie title cannot be empty.';
    }

    if (updateData.synopsis !== undefined || updateData.description !== undefined) {
      const desc = (updateData.synopsis || updateData.description || '').trim();
      if (!desc) {
        validationErrors.synopsis = 'Movie synopsis cannot be empty.';
      } else {
        updateData.synopsis = desc;
        updateData.description = desc;
      }
    }

    if (updateData.language !== undefined && !updateData.language.trim()) {
      validationErrors.language = 'Movie language cannot be empty.';
    }

    const rawRuntime = updateData.runtimeMinutes !== undefined ? updateData.runtimeMinutes : updateData.duration;
    if (rawRuntime !== undefined) {
      const parsedRuntime = Number(rawRuntime);
      if (isNaN(parsedRuntime) || parsedRuntime <= 0) {
        validationErrors.runtimeMinutes = 'Runtime must be a positive number of minutes.';
      } else {
        updateData.runtimeMinutes = parsedRuntime;
        updateData.duration = parsedRuntime;
      }
    }

    if (req.file) {
      updateData.posterUrl = `/uploads/${req.file.filename}`;
    } else if (updateData.posterUrl !== undefined) {
      if (!updateData.posterUrl.trim()) {
        validationErrors.posterUrl = 'Poster image URL cannot be empty.';
      } else if (!isValidUrl(updateData.posterUrl)) {
        validationErrors.posterUrl = 'Poster URL must be a valid URL (http://, https://, or /uploads/...).';
      }
    }

    if (updateData.trailerUrl !== undefined && updateData.trailerUrl.trim()) {
      if (!isValidYouTubeUrl(updateData.trailerUrl.trim())) {
        validationErrors.trailerUrl = 'Trailer URL must be a valid YouTube URL.';
      }
    }

    if (updateData.genre !== undefined || updateData.genres !== undefined) {
      let g = updateData.genre || updateData.genres;
      if (typeof g === 'string') {
        try {
          g = JSON.parse(g);
        } catch (e) {
          g = g.split(',').map((item) => item.trim()).filter(Boolean);
        }
      }
      if (!Array.isArray(g) || g.length === 0) {
        validationErrors.genre = 'At least one genre is required.';
      } else {
        updateData.genre = g;
        updateData.genres = g;
      }
    }

    if (updateData.cast !== undefined && typeof updateData.cast === 'string') {
      try {
        updateData.cast = JSON.parse(updateData.cast);
      } catch (e) {
        updateData.cast = updateData.cast
          .split(',')
          .map((c) => c.trim())
          .filter(Boolean)
          .map((name) => ({ name, role: 'Actor', character: '' }));
      }
    }

    if (Object.keys(validationErrors).length > 0) {
      return res.status(400).json({
        success: false,
        message: Object.values(validationErrors)[0],
        errors: validationErrors,
      });
    }

    if (updateData.rating !== undefined) {
      updateData.rating = Number(updateData.rating);
    }

    const updated = await Movie.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Movie updated successfully.',
      movie: updated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete movie safely (Admin only)
// @route   DELETE /api/movies/:id
// @access  Private/Admin
const deleteMovie = async (req, res, next) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found.',
      });
    }

    // Check if there are active shows scheduled for this movie
    const activeShows = await Show.countDocuments({
      movieId: movie._id,
      status: 'scheduled',
    });

    if (activeShows > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete movie: There are ${activeShows} active scheduled shows referencing this title. Please cancel or remove the shows first.`,
      });
    }

    await Movie.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Movie deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMovies,
  getMovieById,
  createMovie,
  updateMovie,
  deleteMovie,
};

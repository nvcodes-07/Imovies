const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Movie title is required'],
      trim: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    synopsis: {
      type: String,
      trim: true,
      default: '',
    },
    genre: {
      type: [String],
      default: [],
      index: true,
    },
    genres: {
      type: [String],
      default: [],
    },
    language: {
      type: String,
      required: [true, 'Movie language is required'],
      trim: true,
      index: true,
    },
    duration: {
      type: Number, // Duration in minutes
      min: [1, 'Duration must be at least 1 minute'],
    },
    runtimeMinutes: {
      type: Number, // Runtime in minutes
      min: [1, 'Runtime must be at least 1 minute'],
    },
    certification: {
      type: String,
      trim: true,
      default: 'U/A 13+',
    },
    director: {
      type: String,
      trim: true,
      default: '',
    },
    releaseDate: {
      type: Date,
      required: [true, 'Release date is required'],
    },
    posterUrl: {
      type: String,
      required: [true, 'Poster image URL is required'],
      trim: true,
    },
    backdropUrl: {
      type: String,
      trim: true,
      default: '',
    },
    trailerUrl: {
      type: String,
      trim: true,
      default: '',
    },
    cast: [
      {
        name: { type: String, required: true },
        role: { type: String, default: 'Actor' },
        character: { type: String, default: '' },
        image: { type: String, default: '' },
      },
    ],
    rating: {
      type: Number,
      min: 0,
      max: 10,
      default: 8.0,
    },
    status: {
      type: String,
      enum: ['now_showing', 'coming_soon', 'archived'],
      default: 'now_showing',
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Synchronize aliases pre-validate
movieSchema.pre('validate', function () {
  // Sync synopsis and description
  if (!this.description && this.synopsis) {
    this.description = this.synopsis;
  } else if (!this.synopsis && this.description) {
    this.synopsis = this.description;
  }

  // Ensure description/synopsis is present
  if (!this.description && !this.synopsis) {
    this.invalidate('description', 'Movie description or synopsis is required');
  }

  // Sync duration and runtimeMinutes
  if (!this.duration && this.runtimeMinutes) {
    this.duration = this.runtimeMinutes;
  } else if (!this.runtimeMinutes && this.duration) {
    this.runtimeMinutes = this.duration;
  }

  // Ensure duration/runtimeMinutes is present
  if (!this.duration && !this.runtimeMinutes) {
    this.invalidate('duration', 'Movie duration/runtime in minutes is required');
  }

  // Sync genre and genres
  if ((!this.genre || this.genre.length === 0) && this.genres && this.genres.length > 0) {
    this.genre = this.genres;
  } else if ((!this.genres || this.genres.length === 0) && this.genre && this.genre.length > 0) {
    this.genres = this.genre;
  }

  if (!this.genre || this.genre.length === 0) {
    this.invalidate('genre', 'At least one genre is required');
  }

  // Sync cast role & character
  if (Array.isArray(this.cast)) {
    this.cast.forEach((c) => {
      if (!c.role && c.character) {
        c.role = c.character;
      } else if (!c.character && c.role) {
        c.character = c.role;
      }
    });
  }
});

movieSchema.index({ title: 'text', description: 'text', synopsis: 'text', director: 'text' });

module.exports = mongoose.model('Movie', movieSchema);

const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a location name'],
      unique: true,
      trim: true,
    },
    area: {
      type: String,
      required: [true, 'Please provide an area'],
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'Please provide a city'],
      trim: true,
      default: 'Hubli',
    },
    latitude: {
      type: Number,
      required: [true, 'Please provide latitude'],
      min: [-90, 'Latitude must be between -90 and 90'],
      max: [90, 'Latitude must be between -90 and 90'],
    },
    longitude: {
      type: Number,
      required: [true, 'Please provide longitude'],
      min: [-180, 'Longitude must be between -180 and 180'],
      max: [180, 'Longitude must be between -180 and 180'],
    },
    landmark: {
      type: String,
      trim: true,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for search performance
locationSchema.index({ name: 'text', area: 'text', city: 'text' });

module.exports = mongoose.model('Location', locationSchema);

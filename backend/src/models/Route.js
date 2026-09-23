const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema(
  {
    sourceLocation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
      required: [true, 'Please provide source location'],
    },
    destinationLocation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
      required: [true, 'Please provide destination location'],
    },
    distanceKm: {
      type: Number,
      required: [true, 'Please provide route distance in km'],
      min: [0.01, 'Distance must be greater than 0'],
    },
    estimatedTimeMinutes: {
      type: Number,
      required: [true, 'Please provide estimated travel time in minutes'],
      min: [1, 'Time must be at least 1 minute'],
    },
    availableTransports: [
      {
        transportId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Transport',
          required: true,
        },
        estimatedFare: {
          type: Number,
          required: true,
          min: 0,
        },
        estimatedTime: {
          type: Number,
          required: true,
          min: 1,
        },
      },
    ],
    routePath: [
      {
        latitude: {
          type: Number,
          required: true,
        },
        longitude: {
          type: Number,
          required: true,
        },
      },
    ],
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure index for efficient route search lookup
routeSchema.index({ sourceLocation: 1, destinationLocation: 1 });

module.exports = mongoose.model('Route', routeSchema);

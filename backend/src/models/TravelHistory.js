const mongoose = require('mongoose');

const travelHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // Allow null for guest searches
    },
    sourceLocation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TransportStop',
      required: [true, 'Please provide source location'],
    },
    destinationLocation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TransportStop',
      required: [true, 'Please provide destination location'],
    },
    transportSelected: {
      type: String, // e.g. "Bus", "Auto", "Cab"
      required: [true, 'Please specify transport selected'],
    },
    estimatedFare: {
      type: Number,
      required: [true, 'Please provide estimated fare'],
      min: 0,
    },
    estimatedDistance: {
      type: Number,
      required: [true, 'Please provide estimated distance'],
      min: 0,
    },
    estimatedTime: {
      type: Number,
      required: [true, 'Please provide estimated time'],
      min: 0,
    },
    searchedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
travelHistorySchema.index({ userId: 1 });
travelHistorySchema.index({ searchedAt: -1 });

module.exports = mongoose.model('TravelHistory', travelHistorySchema);

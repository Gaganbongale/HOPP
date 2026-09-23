const mongoose = require('mongoose');

const transportSchema = new mongoose.Schema(
  {
    transportType: {
      type: String,
      required: [true, 'Please provide transport type'],
      unique: true,
      enum: ['Bus', 'Auto', 'Cab', 'Metro Future'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    averageSpeed: {
      type: Number,
      required: [true, 'Please provide average speed in km/h'],
      min: [1, 'Speed must be at least 1 km/h'],
    },
    farePerKm: {
      type: Number,
      required: [true, 'Please provide fare per km'],
      min: [0, 'Fare per km cannot be negative'],
    },
    baseFare: {
      type: Number,
      required: [true, 'Please provide base fare'],
      min: [0, 'Base fare cannot be negative'],
    },
    icon: {
      type: String,
      default: '',
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Transport', transportSchema);

const mongoose = require('mongoose');

const savedRouteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Saved route must belong to a user'],
    },
    routeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Route',
      required: [true, 'Saved route must reference a valid route'],
    },
    nickname: {
      type: String,
      trim: true,
      maxlength: [30, 'Nickname cannot exceed 30 characters'],
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent saving duplicate route for same user
savedRouteSchema.index({ userId: 1, routeId: 1 }, { unique: true });

module.exports = mongoose.model('SavedRoute', savedRouteSchema);

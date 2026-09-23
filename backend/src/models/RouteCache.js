const mongoose = require('mongoose');

const routeCacheSchema = new mongoose.Schema(
  {
    sourceStop: { type: String, required: true, trim: true },
    destinationStop: { type: String, required: true, trim: true },
    preference: { type: String, trim: true, default: 'balanced' },
    result: { type: mongoose.Schema.Types.Mixed, required: true },
    createdAt: { type: Date, default: Date.now, expires: 900 } // TTL index set to 15 minutes (900 seconds)
  }
);

routeCacheSchema.index({ sourceStop: 1, destinationStop: 1, preference: 1 });

module.exports = mongoose.model('RouteCache', routeCacheSchema);

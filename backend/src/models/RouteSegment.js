const mongoose = require('mongoose');

const routeSegmentSchema = new mongoose.Schema(
  {
    fromStop: { type: mongoose.Schema.Types.ObjectId, ref: 'TransportStop', required: true },
    toStop: { type: mongoose.Schema.Types.ObjectId, ref: 'TransportStop', required: true },
    route: { type: mongoose.Schema.Types.ObjectId, ref: 'TransitRoute', default: null },
    operator: { type: mongoose.Schema.Types.ObjectId, ref: 'TransportOperator', default: null },
    mode: {
      type: String,
      required: true,
      enum: ['CITY_BUS', 'FEEDER_BUS', 'BRTS', 'TRAIN', 'SHARED_AUTO', 'AUTO_RICKSHAW', 'CAB'],
    },
    distanceKm: { type: Number, required: true, min: 0.01 },
    durationMinutes: { type: Number, required: true, min: 1 },
    fare: { type: Number, required: true, min: 0 },
    bidirectional: { type: Boolean, default: true },
    dataConfidence: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'MEDIUM' },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

routeSegmentSchema.index({ fromStop: 1, toStop: 1, mode: 1, route: 1 }, { unique: true });
routeSegmentSchema.index({ fromStop: 1, active: 1, mode: 1 });
routeSegmentSchema.index({ toStop: 1, active: 1, mode: 1 });
routeSegmentSchema.index({ mode: 1, fare: 1, durationMinutes: 1 });

routeSegmentSchema.statics.outgoingFrom = function (stopId, modes) {
  const query = { fromStop: stopId, active: true };
  if (modes?.length) query.mode = { $in: modes };
  return this.find(query);
};

module.exports = mongoose.model('RouteSegment', routeSegmentSchema);

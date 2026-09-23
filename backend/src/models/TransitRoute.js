const mongoose = require('mongoose');

const routeStopSchema = new mongoose.Schema(
  {
    stop: { type: mongoose.Schema.Types.ObjectId, ref: 'TransportStop', required: true },
    sequence: { type: Number, required: true, min: 0 },
    distanceFromOriginKm: { type: Number, min: 0, default: null },
  },
  { _id: false }
);

const transitRouteSchema = new mongoose.Schema(
  {
    routeNumber: { type: String, required: true, trim: true, uppercase: true },
    name: { type: String, required: true, trim: true },
    operator: { type: mongoose.Schema.Types.ObjectId, ref: 'TransportOperator', required: true },
    mode: {
      type: String,
      required: true,
      enum: ['CITY_BUS', 'FEEDER_BUS', 'BRTS', 'TRAIN', 'SHARED_AUTO'],
    },
    direction: { type: String, enum: ['UP', 'DOWN', 'LOOP', 'BIDIRECTIONAL'], default: 'BIDIRECTIONAL' },
    stops: {
      type: [routeStopSchema],
      required: true,
      validate: {
        validator: (stops) => stops.length >= 2,
        message: 'A route must contain at least two stops',
      },
    },
    estimatedTravelTimeMinutes: { type: Number, min: 1, default: null },
    estimatedFare: { type: Number, min: 0, default: null },
    fareRange: {
      min: { type: Number, min: 0, default: null },
      max: { type: Number, min: 0, default: null },
    },
    serviceHours: {
      start: { type: String, trim: true, default: '' },
      end: { type: String, trim: true, default: '' },
    },
    frequency: {
      regular: { type: String, trim: true, default: '' },
      peak: { type: String, trim: true, default: '' },
    },
    dataConfidence: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'MEDIUM' },
    notes: { type: [String], default: [] },
    active: { type: Boolean, default: true },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

transitRouteSchema.index({ routeNumber: 1, operator: 1, direction: 1 }, { unique: true });
transitRouteSchema.index({ 'stops.stop': 1, mode: 1, active: 1 });
transitRouteSchema.index({ name: 'text', routeNumber: 'text' });

transitRouteSchema.virtual('sourceStop').get(function () {
  return this.stops[0]?.stop;
});

transitRouteSchema.virtual('destinationStop').get(function () {
  return this.stops[this.stops.length - 1]?.stop;
});

transitRouteSchema.methods.includesStop = function (stopId) {
  return this.stops.some((entry) => entry.stop.toString() === stopId.toString());
};

transitRouteSchema.statics.connectingStops = function (sourceStop, destinationStop) {
  return this.find({ active: true, 'stops.stop': { $all: [sourceStop, destinationStop] } });
};

module.exports = mongoose.model('TransitRoute', transitRouteSchema);

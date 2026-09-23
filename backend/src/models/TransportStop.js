const mongoose = require('mongoose');

const pointSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['Point'], default: 'Point', required: true },
    coordinates: {
      type: [Number],
      validate: {
        validator: (value) =>
          value.length === 0 ||
          (value.length === 2 &&
            value[0] >= -180 &&
            value[0] <= 180 &&
            value[1] >= -90 &&
            value[1] <= 90),
        message: 'Coordinates must be [longitude, latitude]',
      },
      default: [],
    },
  },
  { _id: false }
);

const transportStopSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, trim: true, uppercase: true },
    name: { type: String, required: true, trim: true },
    aliases: { type: [String], default: [] },
    city: { type: String, required: true, enum: ['Hubballi', 'Dharwad'], index: true },
    area: { type: String, trim: true, default: '' },
    stopTypes: {
      type: [String],
      required: true,
      enum: ['BUS_STOP', 'BRTS_STATION', 'RAILWAY_STATION', 'AIRPORT', 'AUTO_STAND', 'BUS_TERMINAL', 'DEPOT', 'AREA'],
    },
    location: { type: pointSchema, default: undefined },
    corridorDistanceKm: { type: Number, min: 0, default: null },
    importance: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'MEDIUM' },
    dataConfidence: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'MEDIUM' },
    active: { type: Boolean, default: true },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

transportStopSchema.index({ location: '2dsphere' }, { sparse: true });
transportStopSchema.index({ name: 'text', aliases: 'text', area: 'text' });
transportStopSchema.index({ city: 1, stopTypes: 1, active: 1 });

transportStopSchema.virtual('hasCoordinates').get(function () {
  return this.location?.coordinates?.length === 2;
});

transportStopSchema.statics.nearby = function (longitude, latitude, maxDistanceMeters = 3000) {
  return this.find({
    active: true,
    location: {
      $near: {
        $geometry: { type: 'Point', coordinates: [longitude, latitude] },
        $maxDistance: maxDistanceMeters,
      },
    },
  });
};

module.exports = mongoose.model('TransportStop', transportStopSchema);

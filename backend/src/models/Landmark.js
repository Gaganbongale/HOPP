const mongoose = require('mongoose');

const landmarkSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, trim: true, uppercase: true },
    name: { type: String, required: true, trim: true },
    aliases: { type: [String], default: [] },
    categories: {
      type: [String],
      required: true,
      enum: ['TRANSPORT_HUB', 'EDUCATIONAL', 'HOSPITAL', 'COMMERCIAL', 'RESIDENTIAL', 'TOURIST', 'RECREATIONAL', 'RELIGIOUS', 'GOVERNMENT', 'MARKET'],
    },
    city: { type: String, required: true, enum: ['Hubballi', 'Dharwad'], index: true },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point', required: true },
      coordinates: {
        type: [Number],
        required: true,
        validate: {
          validator: (value) =>
            value.length === 2 &&
            value[0] >= -180 &&
            value[0] <= 180 &&
            value[1] >= -90 &&
            value[1] <= 90,
          message: 'Coordinates must be [longitude, latitude]',
        },
      },
    },
    importance: { type: String, required: true, enum: ['LOW', 'MEDIUM', 'HIGH'] },
    nearbyStops: [{ type: mongoose.Schema.Types.ObjectId, ref: 'TransportStop' }],
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

landmarkSchema.index({ location: '2dsphere' });
landmarkSchema.index({ name: 'text', aliases: 'text', categories: 'text' });
landmarkSchema.index({ city: 1, categories: 1, importance: 1 });

landmarkSchema.statics.nearby = function (longitude, latitude, maxDistanceMeters = 3000) {
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

module.exports = mongoose.model('Landmark', landmarkSchema);

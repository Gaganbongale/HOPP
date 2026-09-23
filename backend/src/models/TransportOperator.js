const mongoose = require('mongoose');

const transportOperatorSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, trim: true, uppercase: true },
    name: { type: String, required: true, trim: true },
    operatorType: {
      type: String,
      required: true,
      enum: ['GOVERNMENT', 'PUBLIC_COMPANY', 'RAILWAY', 'COMMUNITY', 'PRIVATE'],
    },
    modes: {
      type: [String],
      required: true,
      enum: ['CITY_BUS', 'FEEDER_BUS', 'BRTS', 'TRAIN', 'SHARED_AUTO', 'AUTO_RICKSHAW', 'CAB'],
    },
    website: { type: String, trim: true, default: '' },
    contactNumbers: { type: [String], default: [] },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

transportOperatorSchema.index({ name: 'text', code: 'text' });

transportOperatorSchema.statics.findByMode = function (mode) {
  return this.find({ modes: mode, active: true });
};

module.exports = mongoose.model('TransportOperator', transportOperatorSchema);

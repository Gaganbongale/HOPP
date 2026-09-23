const mongoose = require('mongoose');

const fareRuleSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, trim: true, uppercase: true },
    operator: { type: mongoose.Schema.Types.ObjectId, ref: 'TransportOperator', default: null },
    mode: {
      type: String,
      required: true,
      enum: ['CITY_BUS', 'FEEDER_BUS', 'BRTS', 'TRAIN', 'SHARED_AUTO', 'AUTO_RICKSHAW', 'CAB'],
    },
    ruleType: { type: String, required: true, enum: ['DISTANCE_BAND', 'STOP_PAIR', 'INTEGRATED', 'PASS', 'BASE_RATE'] },
    fromStop: { type: mongoose.Schema.Types.ObjectId, ref: 'TransportStop', default: null },
    toStop: { type: mongoose.Schema.Types.ObjectId, ref: 'TransportStop', default: null },
    distanceRangeKm: {
      min: { type: Number, min: 0, default: null },
      max: { type: Number, min: 0, default: null },
    },
    amount: {
      min: { type: Number, min: 0, default: null },
      average: { type: Number, min: 0, default: null },
      max: { type: Number, min: 0, default: null },
      currency: { type: String, enum: ['INR'], default: 'INR' },
    },
    componentFares: { type: [Number], default: [] },
    savings: { type: Number, min: 0, default: null },
    validFrom: { type: Date, default: null },
    notes: { type: [String], default: [] },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

fareRuleSchema.index({ mode: 1, ruleType: 1, active: 1 });
fareRuleSchema.index({ fromStop: 1, toStop: 1, mode: 1, active: 1 });
fareRuleSchema.index({ operator: 1, mode: 1, active: 1 });

fareRuleSchema.statics.forStopPair = function (fromStop, toStop, mode) {
  return this.findOne({ fromStop, toStop, mode, active: true });
};

module.exports = mongoose.model('FareRule', fareRuleSchema);

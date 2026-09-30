const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  ticketId: { type: String, required: true, unique: true },
  from: { type: String, required: true },
  to: { type: String, required: true },
  passengers: { type: Number, required: true, min: 1, max: 6 },
  distanceKm: { type: Number, required: true, min: 0 },
  amountPaise: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  paymentId: { type: String, required: true, unique: true },
  orderId: { type: String, default: null },
  status: { type: String, enum: ['VALID'], default: 'VALID' },
}, { timestamps: true });

module.exports = mongoose.model('Ticket', ticketSchema);

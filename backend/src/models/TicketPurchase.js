const mongoose = require('mongoose');

const ticketPurchaseSchema = new mongoose.Schema({
  purchaseId: { type: String, required: true, unique: true },
  qrCodeId: { type: String, required: true, unique: true },
  imageUrl: { type: String, required: true },
  from: { type: String, required: true },
  to: { type: String, required: true },
  passengers: { type: Number, required: true, min: 1, max: 6 },
  distanceKm: { type: Number, required: true, min: 0 },
  farePaise: { type: Number, required: true, min: 1 },
  closeBy: { type: Date, required: true },
  status: { type: String, enum: ['PENDING', 'PAID', 'EXPIRED'], default: 'PENDING' },
  paymentId: { type: String, default: null },
  ticketId: { type: String, default: null },
}, { timestamps: true });

module.exports = mongoose.model('TicketPurchase', ticketPurchaseSchema);

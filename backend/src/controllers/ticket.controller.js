const crypto = require('crypto');
const brtsStations = require('../../../seeds-cleaned/brtsStations.cleaned.json');
const Ticket = require('../models/Ticket');
const TicketPurchase = require('../models/TicketPurchase');
const { sendSuccess } = require('../utils/responseFormatter');

const stationByName = new Map(brtsStations.filter((station) => station.status === 'ACTIVE').map((station) => [station.name, station]));

function fareRates() {
  const base = Number(process.env.TICKET_BASE_FARE_RUPEES);
  const perKm = Number(process.env.TICKET_FARE_PER_KM_RUPEES);
  if (!Number.isFinite(base) || base < 0 || !Number.isFinite(perKm) || perKm < 0 || base + perKm <= 0) return null;
  return { base, perKm };
}

function assertGatewayConfigured() {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET || !fareRates()) {
    const error = new Error('Ticket checkout requires Razorpay keys and configured distance-based fare rates.');
    error.statusCode = 503;
    throw error;
  }
}

function quoteFare(from, to, passengers) {
  const origin = stationByName.get(from);
  const destination = stationByName.get(to);
  const count = Number(passengers);
  if (!origin || !destination || from === to || !Number.isInteger(count) || count < 1 || count > 6) return null;
  const distanceKm = Math.round(Math.abs(origin.corridorDistanceKm - destination.corridorDistanceKm) * 100) / 100;
  const rates = fareRates();
  if (!rates) return null;
  const farePaise = Math.round((rates.base + rates.perKm * distanceKm) * 100);
  return { from, to, passengers: count, distanceKm, baseFareRupees: rates.base, farePerKmRupees: rates.perKm, farePerPassengerPaise: farePaise, amountPaise: farePaise * count };
}

async function razorpayRequest(path, options = {}) {
  const credentials = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64');
  const response = await fetch(`https://api.razorpay.com/v1${path}`, {
    ...options,
    headers: { Authorization: `Basic ${credentials}`, 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body.error?.description || 'Razorpay could not process the request.');
    error.statusCode = 502;
    error.gatewayStatus = response.status;
    error.gatewayCode = body.error?.code || null;
    throw error;
  }
  return body;
}

function ticketResponse(ticket) {
  return { ticketId: ticket.ticketId, from: ticket.from, to: ticket.to, passengers: ticket.passengers, distanceKm: ticket.distanceKm, amountRupees: ticket.amountPaise / 100, issuedAt: ticket.createdAt, status: ticket.status };
}

async function issueTicket({ from, to, passengers, distanceKm, amountPaise, paymentId, orderId = null }) {
  const existing = await Ticket.findOne({ paymentId });
  if (existing) return existing;
  return Ticket.create({ ticketId: crypto.randomUUID(), from, to, passengers, distanceKm, amountPaise, paymentId, orderId });
}

exports.getConfig = (req, res) => {
  const rates = fareRates();
  const ready = Boolean(rates && process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
  return res.status(200).json(sendSuccess({ keyId: ready ? process.env.RAZORPAY_KEY_ID : null, fareReady: Boolean(rates), baseFareRupees: rates?.base ?? null, farePerKmRupees: rates?.perKm ?? null }));
};

exports.getFare = (req, res) => {
  const quote = quoteFare(req.query.from, req.query.to, req.query.passengers);
  if (!quote) return res.status(400).json({ success: false, message: 'Choose two different active BRTS stations and 1–6 passengers.' });
  return res.status(200).json(sendSuccess({ ...quote, farePerPassengerRupees: quote.farePerPassengerPaise / 100, totalRupees: quote.amountPaise / 100 }));
};

exports.createOrder = async (req, res, next) => {
  try {
    assertGatewayConfigured();
    const quote = quoteFare(req.body.from, req.body.to, req.body.passengers);
    if (!quote) return res.status(400).json({ success: false, message: 'Choose two different active BRTS stations and 1–6 passengers.' });
    const receipt = `hop_${crypto.randomUUID().replace(/-/g, '').slice(0, 30)}`;
    const order = await razorpayRequest('/orders', { method: 'POST', body: JSON.stringify({ amount: quote.amountPaise, currency: 'INR', receipt, notes: { from: quote.from, to: quote.to, passengers: String(quote.passengers), distance_km: String(quote.distanceKm) } }) });
    return res.status(201).json(sendSuccess({ orderId: order.id, amount: order.amount, currency: order.currency, keyId: process.env.RAZORPAY_KEY_ID, ...quote }));
  } catch (error) { return next(error); }
};

exports.createPaymentQr = async (req, res, next) => {
  try {
    assertGatewayConfigured();
    const quote = quoteFare(req.body.from, req.body.to, req.body.passengers);
    if (!quote) return res.status(400).json({ success: false, message: 'Choose two different active BRTS stations and 1–6 passengers.' });
    const purchaseId = crypto.randomUUID();
    const closeBy = new Date(Date.now() + 10 * 60 * 1000);
    const purchase = await TicketPurchase.create({ purchaseId, qrCodeId: `pending_${purchaseId}`, imageUrl: 'pending', closeBy, ...quote, farePaise: quote.farePerPassengerPaise, status: 'PENDING' });
    const qr = await razorpayRequest('/payments/qr_codes', { method: 'POST', body: JSON.stringify({
      type: 'upi_qr', name: `Hop BRTS ${purchaseId.slice(0, 8)}`, usage: 'single_use', fixed_amount: true,
      payment_amount: quote.amountPaise, description: `Chigari BRTS ${quote.from} to ${quote.to}`,
      close_by: Math.floor(closeBy.getTime() / 1000),
      notes: { purchase_id: purchaseId, from: quote.from, to: quote.to, passengers: String(quote.passengers), distance_km: String(quote.distanceKm) },
    }) });
    purchase.qrCodeId = qr.id;
    purchase.imageUrl = qr.image_url;
    await purchase.save();
    return res.status(201).json(sendSuccess({ purchaseId, qrCodeId: qr.id, imageUrl: qr.image_url, amountRupees: quote.amountPaise / 100, distanceKm: quote.distanceKm, from: quote.from, to: quote.to, passengers: quote.passengers, expiresAt: closeBy }));
  } catch (error) {
    if (error.gatewayStatus === 404) error.message = 'Razorpay QR Codes API returned 404 for this account or key. Use standard Razorpay Checkout for now, and ask Razorpay to enable UPI QR Codes API access for this account.';
    return next(error);
  }
};

exports.getPaymentQrStatus = async (req, res, next) => {
  try {
    assertGatewayConfigured();
    const purchase = await TicketPurchase.findOne({ purchaseId: req.params.purchaseId });
    if (!purchase) return res.status(404).json({ success: false, message: 'Payment QR was not found.' });
    if (purchase.status === 'PAID' && purchase.ticketId) {
      const ticket = await Ticket.findOne({ ticketId: purchase.ticketId });
      if (ticket) return res.status(200).json(sendSuccess({ status: 'PAID', ticket: ticketResponse(ticket) }));
    }
    if (purchase.closeBy <= new Date()) {
      if (purchase.status === 'PENDING') { purchase.status = 'EXPIRED'; await purchase.save(); }
      return res.status(200).json(sendSuccess({ status: purchase.status }));
    }
    const collection = await razorpayRequest(`/payments/qr_codes/${encodeURIComponent(purchase.qrCodeId)}/payments?count=100`);
    const payment = (collection.items || []).find((item) => item.status === 'captured' && item.amount === purchase.farePaise * purchase.passengers && item.currency === 'INR');
    if (!payment) return res.status(200).json(sendSuccess({ status: 'PENDING' }));
    const ticket = await issueTicket({ from: purchase.from, to: purchase.to, passengers: purchase.passengers, distanceKm: purchase.distanceKm, amountPaise: payment.amount, paymentId: payment.id });
    purchase.status = 'PAID'; purchase.paymentId = payment.id; purchase.ticketId = ticket.ticketId;
    await purchase.save();
    return res.status(200).json(sendSuccess({ status: 'PAID', ticket: ticketResponse(ticket) }));
  } catch (error) { return next(error); }
};

exports.verifyPayment = async (req, res, next) => {
  try {
    assertGatewayConfigured();
    const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature, from, to, passengers } = req.body;
    const quote = quoteFare(from, to, passengers);
    if (!orderId || !paymentId || !signature || !quote) return res.status(400).json({ success: false, message: 'Payment details are incomplete or invalid.' });
    const existing = await Ticket.findOne({ paymentId });
    if (existing) return res.status(200).json(sendSuccess(ticketResponse(existing)));
    const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(`${orderId}|${paymentId}`).digest();
    const received = Buffer.from(signature, 'hex');
    if (received.length !== expected.length || !crypto.timingSafeEqual(received, expected)) return res.status(400).json({ success: false, message: 'Payment signature could not be verified.' });
    const order = await razorpayRequest(`/orders/${encodeURIComponent(orderId)}`);
    if (order.amount !== quote.amountPaise || order.currency !== 'INR' || order.notes?.from !== from || order.notes?.to !== to || order.notes?.passengers !== String(quote.passengers) || order.notes?.distance_km !== String(quote.distanceKm)) {
      return res.status(400).json({ success: false, message: 'Ticket details do not match the paid order.' });
    }
    const payment = await razorpayRequest(`/payments/${encodeURIComponent(paymentId)}`);
    if (payment.order_id !== orderId || payment.amount !== quote.amountPaise || payment.currency !== 'INR' || !['captured', 'authorized'].includes(payment.status)) {
      return res.status(400).json({ success: false, message: 'Payment does not match this ticket order.' });
    }
    if (payment.status === 'authorized') await razorpayRequest(`/payments/${encodeURIComponent(paymentId)}/capture`, { method: 'POST', body: JSON.stringify({ amount: payment.amount, currency: payment.currency }) });
    const ticket = await issueTicket({ ...quote, amountPaise: payment.amount, paymentId, orderId });
    return res.status(201).json(sendSuccess(ticketResponse(ticket)));
  } catch (error) { return next(error); }
};

exports.getTicket = async (req, res, next) => {
  try {
    const ticket = await Ticket.findOne({ ticketId: req.params.ticketId }).select('ticketId from to passengers distanceKm amountPaise currency status createdAt');
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found.' });
    return res.status(200).json(sendSuccess(ticketResponse(ticket)));
  } catch (error) { return next(error); }
};

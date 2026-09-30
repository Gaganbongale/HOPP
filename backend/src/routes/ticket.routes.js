const express = require('express');
const controller = require('../controllers/ticket.controller');

const router = express.Router();
router.get('/tickets/config', controller.getConfig);
router.get('/tickets/fare', controller.getFare);
router.post('/tickets/orders', controller.createOrder);
router.post('/tickets/qr', controller.createPaymentQr);
router.get('/tickets/qr/:purchaseId/status', controller.getPaymentQrStatus);
router.post('/tickets/verify', controller.verifyPayment);
router.get('/tickets/:ticketId', controller.getTicket);

module.exports = router;

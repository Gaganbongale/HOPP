const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, default: '' },
    comments: { type: String, required: true, trim: true },
    rating: { type: Number, min: 1, max: 5, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Feedback', feedbackSchema);
